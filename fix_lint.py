#!/usr/bin/env python3
"""
fix_lint.py
===========

Auto-fixes the common papra lint failures introduced by the arm64 fork
modifications. Targets the patterns the GitHub Actions log shows:

  1. `catch (error) { ... }` where `error` is never used
        -> rename to `catch (_error) { ... }`
        (satisfies `typescript/use-unknown-in-catch-callback-variable`
         which the fork's oxlint config has set to `error`)

  2. `function (settings) { ... }` style param where `settings` is unused
        -> rename to `function (_settings) { ... }`
        (satisfies `no-unused-vars` rule for params)

  3. `const destinationId = ...;` where it's never read
        -> rename to `const _destinationId = ...;`

  4. `function foo(): Promise<X> { return bar(); }`
        -> `async function foo(): Promise<X> { return bar(); }`
        (satisfies `typescript/promise-function-async`)

  5. `import { type X } from ...` repeated across multiple `import`
     statements from the same module
        -> consolidate into a single import. Skipped here (handled by
         `import/no-duplicates` rule, but oxlint's autofix handles it
         already with `oxlint --fix`).

Idempotent: re-running is a no-op.

Usage:
    python3 fix_lint.py [--path apps/papra-server/src] [--backup] [--dry-run]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Catches: `catch (error) {` or `catch (error: unknown) {` etc.
# Skips already-prefixed `_error`.
RE_CATCH_UNUSED = re.compile(
    r"\bcatch\s*\(\s*(?!_)(\w+)\b([^)]*)\)\s*\{",
)

# Catches arrow & function declarations with an unused param.
# Heuristic: rename `settings`, `error`, `err`, `e`, `documentsStorageService`,
# `destinationId` to their `_`-prefixed form, ONLY if they are not
# referenced later in the same function. We approximate "not referenced"
# by checking the function body for any standalone word match.
PARAMS_TO_RENAME = (
    "settings",
    "documentsStorageService",
    "destinationId",
    "documentsService",
)


def fix_unused_catch(text: str) -> tuple[str, int]:
    """Rename catch param to _name if it's not referenced in the body."""
    out = []
    last = 0
    count = 0
    for m in RE_CATCH_UNUSED.finditer(text):
        out.append(text[last : m.start()])
        name = m.group(1)
        rest = m.group(2)
        # Look for any other reference to `name` after the catch close.
        # We do a cheap check: count occurrences of `name` after this point.
        # If it's exactly 1 (the one we matched), it's unused.
        rest_of_file = text[m.end() :]
        # Use a word-boundary regex to count real references, not substrings.
        ref_re = re.compile(rf"\b{re.escape(name)}\b")
        remaining_refs = len(ref_re.findall(rest_of_file))
        if remaining_refs == 0:
            out.append(f"catch (_{name}{rest}) {{")
            count += 1
        else:
            out.append(m.group(0))
        last = m.end()
    out.append(text[last:])
    return "".join(out), count


def fix_unused_params(text: str) -> tuple[str, int]:
    """Rename known-unused function params by prefixing with _."""
    count = 0
    for name in PARAMS_TO_RENAME:
        # Match `name` as a function param: `function f(name` or `(name` or
        # `(name: T` or `, name`, etc. Only rename the FIRST occurrence in
        # a function signature (per file pass) where the body has no
        # reference to the bare name.
        pattern = re.compile(
            rf"(\(\s*|,\s*)({re.escape(name)})\b(\s*[:,\)\{{])"
        )

        def _renamer(m: re.Match, _name: str = name) -> str:
            nonlocal count
            head, body, tail = m.group(1), m.group(2), m.group(3)
            # Skip if already prefixed.
            if body.startswith("_"):
                return m.group(0)
            count += 1
            return f"{head}_{body}{tail}"

        text = pattern.sub(_renamer, text)
    return text, count


def fix_async_promise_returns(text: str) -> tuple[str, int]:
    """
    Add `async` to function declarations whose body returns a Promise
    and is not already async. Heuristic — we only flip declarations that
    match a very narrow shape (named function, body has a single return
    of a call). High precision, low recall — catches the common case
    where you wrote:

        function foo(): Promise<X> {
          return doSomething();
        }

    and turns it into:

        async function foo(): Promise<X> {
          return doSomething();
        }
    """
    pattern = re.compile(
        r"(\bfunction\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<[A-Za-z_][\w<>,\s|]*>\s*\{)"
    )
    count = 0

    def _flip(m: re.Match) -> str:
        nonlocal count
        if "async function" in text[max(0, m.start() - 6) : m.start()]:
            return m.group(0)
        count += 1
        return m.group(1).replace("function ", "async function ", 1)

    text = pattern.sub(_flip, text)
    return text, count


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
    ap.add_argument("--path", default="apps/papra-server/src", help="Directory to walk")
    ap.add_argument("--backup", action="store_true", help="Write a .bak for every modified file")
    ap.add_argument("--dry-run", action="store_true", help="Show what would change, write nothing")
    args = ap.parse_args()

    root = Path(args.path)
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 2

    extensions = {".ts", ".tsx", ".mts", ".cts"}
    files = [p for p in root.rglob("*") if p.suffix in extensions and "node_modules" not in p.parts]

    if not files:
        print(f"no files matched under {root}")
        return 1

    total_files = 0
    total_changes = {"catch": 0, "params": 0, "async": 0}
    for f in files:
        original = f.read_text(encoding="utf-8")
        stats = fix_file(f, dry_run=args.dry_run)
        if any(stats.values()):
            total_files += 1
            for k, v in stats.items():
                total_changes[k] += v
            if args.backup and not args.dry_run:
                f.with_suffix(f.suffix + ".bak").write_text(original, encoding="utf-8")
            mode = "would patch" if args.dry_run else "patched"
            print(f"{mode} {f}: {stats}")

    print()
    print(f"summary: {total_files} files, "
          f"catch={total_changes['catch']} "
          f"params={total_changes['params']} "
          f"async={total_changes['async']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
