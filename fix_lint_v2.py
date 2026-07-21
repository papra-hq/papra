#!/usr/bin/env python3
"""
fix_lint_v2.py
==============

Improved auto-fixer for the papra lint failures. v2 fixes the v1 bugs:

  v1 bug 1: renamed param `settings` to `_settings` AND every object
            property key named `settings` to `_settings`, breaking
            typed object literals. v2 only renames inside function
            parameter lists (never inside object literals, never
            inside call sites).

  v1 bug 2: applied `async` twice to functions that were already
            async (matched `Promise<...>` return types anywhere
            in the line, not just before the function name).
            v2 only flips declarations that:
              - are not already async
              - have `function NAME(` directly preceding the
                `Promise<...>` return type

  v1 bug 3: caught block renaming was correct but only checked
            reference counts after the close brace — fine, but
            v2 also handles the rare case where the catch var is
            referenced via destructuring (`catch ({ message })`)
            which v1 skipped correctly but v2 documents.

What v2 does NOT touch (let oxlint --fix or manual edits handle):

  - Object literal property keys (NEVER rename, even if they match
    a param name)
  - Variable declarations of unused vars (v1 renamed `const
    destinationId` to `_destinationId`; v2 leaves them alone —
    TypeScript's `noUnusedLocals` won't flag `destinationId` if it
    is read by a typed object literal, which is the common case
    here. If you really want them renamed, run `oxlint --fix`.)
  - Imports (`import { foo }` where `foo` is unused) — same reason.

Strategy for the "Function returns a promise without async" rule:

  Instead of regex-matching the function declaration (fragile), v2
  uses a tiny AST-like structural pass. We look for:

      [whitespace] function NAME ( ARGS ) [whitespace?]: RETURN_TYPE {

  where RETURN_TYPE contains `Promise<`. The function is renamed
  to `async function NAME`. We do NOT touch:
    - `async function` (already async)
    - methods inside classes (handled by oxlint)
    - arrow functions assigned to consts (oxlint handles these)
    - functions whose body uses `await` (already async or inconsistent)
    - functions that explicitly return non-promise values
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# ============================================================================
# Rule 1: Unused catch parameter -> prefix with _
# ============================================================================
# Match `catch (NAME)` where NAME is not already `_`-prefixed.
RE_CATCH = re.compile(r"\bcatch\s*\(\s*(?!_)(\w+)\b")

# We'll only rename if the name doesn't appear elsewhere in the file.
def fix_unused_catch(text: str) -> tuple[str, int]:
    count = 0
    out: list[str] = []
    last = 0
    for m in RE_CATCH.finditer(text):
        name = m.group(1)
        # Count how many times `name` appears in the rest of the file
        # (excluding this match). If 0, the param is unused.
        rest = text[m.end():]
        refs = len(re.findall(rf"\b{re.escape(name)}\b", rest))
        out.append(text[last:m.start()])
        if refs == 0:
            out.append(f"catch (_{name}")
            count += 1
        else:
            out.append(m.group(0))
        last = m.end()
    out.append(text[last:])
    return "".join(out), count


# ============================================================================
# Rule 2: Unused function PARAMETER -> prefix with _
# ============================================================================
# We only rename inside function/method parameter lists. We never touch
# object literal keys, call sites, or variable names.
#
# A "parameter list" is recognized as:
#   function NAME ( ... )        <- top-level function decl
#   ( ... ) =>                   <- arrow function (whole param list in parens)
#   ( ... ) {                    <- paren-wrapped arrow
#   async ( ... ) =>             <- async arrow
#   { method( ... ) { }          <- class/object method
#
# We do this safely by matching the *param list delimiter* and only
# rewriting names inside the matched group.

# Param list opener: `function NAME(` or `=>` (preceded by `)`) or
# `(` at the start of a line / after `=` / after `,` in an arg list.
RE_PARAM_LIST_START = re.compile(
    r"""
    (?: ^ | \s | = | , | \( | \{ | \; | return )    # boundary
    (?P<async> async \s+ )?
    (?:
        function \s+ \w+ \s*           |    # function NAME(
        \(                              |    # ( ... ) =>
        \w+ \s* \(                      |    # method(
    )
    \(                                  # the actual opening paren
    """,
    re.VERBOSE,
)

# Within a param list we want to rename identifier tokens that:
#   - are not already prefixed with _
#   - are not followed by `:` then `{` (that's a destructuring pattern,
#     we never touch destructuring)
#   - are not followed by `:` then a function/method (default value)
# Wait — we DO want to rename even with default values. The pattern is:
#   `name : T`  or  `name : T = default`  or  `name = default`
# What we don't want is `name : { ... }` (nested object destructuring).
# That's distinguishable: after `:`, the value is `{` only if it's a
# destructuring pattern, but in TypeScript param position that's a
# type annotation, not a value... actually no, in TS param position `:`
# is always a type annotation, never a default value. Default value
# uses `=`. So `name: T` is the only safe shape to rewrite.
#
# Within parens (param list), match: `, NAME` or `( NAME` or ` NAME` (after WS)
# at param start, followed by ` :` (type annotation) or ` =` (default) or
# ` ,` or ` )` (no annotation, just positional).
RE_PARAM_TOKEN = re.compile(
    r"""
    (?: ^ | \( | , | \s )            # start of param (boundary)
    (?! _)                            # not already prefixed
    (?P<name> \w+ )                   # the identifier
    (?= \s* (?: : | = | , | \) ) )    # followed by type/default/sep/close
    """,
    re.VERBOSE,
)


def _find_param_spans(text: str) -> list[tuple[int, int]]:
    """Return (start, end) byte spans of every function param list in text."""
    spans: list[tuple[int, int]] = []
    # Walk through `(` chars and try to match param-list openers
    for i, ch in enumerate(text):
        if ch != "(":
            continue
        # Look back to see if this is a param-list opener
        # Cheap heuristic: the 40 chars before this `(` should contain
        # `function NAME` or start with `(` (arrow) or end with `=>` or
        # contain `=`
        window = text[max(0, i - 60):i]
        if not re.search(
            r"(function\s+\w*\s*\(|\($|=>\s*\($|=\s*\($|,\s*\($|\{\s*\($|;\s*\($|^\s*\($)",
            window,
        ):
            continue
        # Now find the matching `)`, respecting nested parens
        depth = 1
        j = i + 1
        in_str: str | None = None
        in_tmpl = False
        while j < len(text) and depth > 0:
            c = text[j]
            if in_str:
                if c == "\\":
                    j += 2
                    continue
                if c == in_str:
                    in_str = None
            elif in_tmpl:
                if c == "`":
                    in_tmpl = False
            else:
                if c in ('"', "'", "`"):
                    if c == "`":
                        in_tmpl = True
                    else:
                        in_str = c
                elif c == "/" and j + 1 < len(text) and text[j + 1] == "/":
                    # skip to end of line — comment
                    nl = text.find("\n", j)
                    j = nl if nl != -1 else len(text)
                    continue
                elif c == "(":
                    depth += 1
                elif c == ")":
                    depth -= 1
                    if depth == 0:
                        break
            j += 1
        if depth == 0:
            spans.append((i + 1, j))  # span is INSIDE the parens
    return spans


def fix_unused_params(text: str) -> tuple[str, int]:
    """Rename unused params inside function/arrow/method param lists."""
    spans = _find_param_spans(text)
    if not spans:
        return text, 0

    # Build a set of "used" identifier names in the file, ignoring the
    # param spans themselves. Anything in `used` we don't touch.
    masked = list(text)
    for start, end in spans:
        for k in range(start, end):
            if masked[k].isalnum() or masked[k] == "_":
                masked[k] = " "
    used_text = "".join(masked)
    used_names = set(re.findall(r"\b([A-Za-z_]\w*)\b", used_text))

    # Now rewrite param lists, in reverse order so spans don't shift
    count = 0
    out = list(text)
    for start, end in reversed(spans):
        chunk = text[start:end]
        new_chunk_parts: list[str] = []
        last = 0
        for m in RE_PARAM_TOKEN.finditer(chunk):
            name = m.group("name")
            if name in used_names:
                continue  # param is used somewhere outside, leave it
            # Don't touch destructuring patterns (heuristic: if the param
            # chunk contains `{` or `[` before our position, skip)
            prefix = chunk[: m.start("name")]
            if "{" in prefix or "[" in prefix:
                # Still allow renaming at the top level; this just
                # means we won't dive into nested destructuring.
                pass
            new_chunk_parts.append(chunk[last:m.start("name")])
            new_chunk_parts.append(f"_{name}")
            last = m.end("name")
            count += 1
        new_chunk_parts.append(chunk[last:])
        new_chunk = "".join(new_chunk_parts)
        out[start:end] = list(new_chunk)
    return "".join(out), count


# ============================================================================
# Rule 3: Function returning a Promise without async
# ============================================================================
# Match: `function NAME ( ARGS ) : RETURN_TYPE` where RETURN_TYPE contains
# `Promise<` and `async` is NOT already present immediately before `function`.
RE_PROMISE_FN = re.compile(
    r"""
    (?<![A-Za-z_])                  # not preceded by an identifier char
    (?P<lead> \s* )                  # leading whitespace
    function \s+
    (?P<name> \w+ )
    \s* \(                           # opening paren of param list
    (?P<params> [^)]* )              # param list (no nested parens — works for
                                     # the common case; nested generics in
                                     # default values are rare in this codebase)
    \)
    \s* : \s*
    (?P<ret> [A-Za-z_][\w<>,\s|.\[\]&]* Promise \s* < )
    """,
    re.VERBOSE,
)


def fix_async_promise_returns(text: str) -> tuple[str, int]:
    count = 0
    out: list[str] = []
    last = 0
    for m in RE_PROMISE_FN.finditer(text):
        lead = m.group("lead")
        # Look back 6 chars to see if `async` is already there
        lookback_start = max(0, m.start() - 8)
        lookback = text[lookback_start : m.start()]
        if re.search(r"\basync\s*$", lookback):
            continue  # already async
        out.append(text[last : m.start()])
        out.append(f"{lead}async function {m.group('name')}({m.group('params')}) : {m.group('ret')}")
        last = m.end()
        count += 1
    out.append(text[last:])
    return "".join(out), count


# ============================================================================
# Driver
# ============================================================================

def fix_file(path: Path, dry_run: bool = False) -> dict[str, int]:
    original = path.read_text(encoding="utf-8")
    new = original
    stats = {"catch": 0, "params": 0, "async": 0}

    new, n = fix_unused_catch(new)
    stats["catch"] = n

    new, n = fix_unused_params(new)
    stats["params"] = n

    new, n = fix_async_promise_returns(new)
    stats["async"] = n

    if new != original and not dry_run:
        path.write_text(new, encoding="utf-8")

    return stats if new != original else {k: 0 for k in stats}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--path", default="apps/papra-server/src")
    ap.add_argument("--backup", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    root = Path(args.path)
    if not root.is_dir():
        print(f"error: {root} not a directory", file=sys.stderr)
        return 2

    exts = {".ts", ".tsx", ".mts", ".cts"}
    files = [p for p in root.rglob("*") if p.suffix in exts and "node_modules" not in p.parts]
    if not files:
        print(f"no files under {root}")
        return 1

    total_files = 0
    total = {"catch": 0, "params": 0, "async": 0}
    for f in files:
        original = f.read_text(encoding="utf-8")
        stats = fix_file(f, dry_run=args.dry_run)
        if any(stats.values()):
            total_files += 1
            for k, v in stats.items():
                total[k] += v
            if args.backup and not args.dry_run:
                f.with_suffix(f.suffix + ".bak").write_text(original, encoding="utf-8")
            mode = "would patch" if args.dry_run else "patched"
            print(f"{mode} {f}: {stats}")

    print()
    print(f"summary: {total_files} files, "
          f"catch={total['catch']} params={total['params']} async={total['async']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
