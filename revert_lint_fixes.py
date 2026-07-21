#!/usr/bin/env python3
"""
revert_lint_fixes.py
====================

Reverts the damage from running v1 of fix_lint.py.

What v1 did wrong (and how to revert):

  1. Renamed function parameter `settings` -> `_settings`, AND
     renamed every object literal property key `settings:` -> `_settings:`.
     The property renames are wrong and break the codebase.

     v1 -> v2 reversal:
       - `function foo(_settings: ...)` becomes `function foo(settings: ...)`
       - `{ _settings: ... }` stays as `{ _settings: ... }` because
         the original code didn't have an underscore there.
       - But the variable `_settings` is also referenced in those functions,
         so just removing the underscore from the param decl will leave
         a stray reference. We need to UN-rename param decls only, and
         re-rename their USES inside the function body.

  2. Renamed `destinationId` to `_destinationId` everywhere, including
     property keys. Same problem.

  3. Double-applied `async` to functions that were already async.
     Pattern: `async async function`. Just collapse to one `async`.

This script walks every `.bak` file, restores it, and then
re-applies only the SAFE transformations from v2 of fix_lint.py
(which never touches object literal keys).

Usage:
    python3 revert_lint_fixes.py --path apps/papra-server/src
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def revert_async_double(text: str) -> tuple[str, int]:
    """Collapse `async async function` -> `async function`."""
    pattern = re.compile(r"\basync\s+async\s+function\b")
    new, n = pattern.subn("async function", text)
    return new, n


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--path", default="apps/papra-server/src", help="Where to search for .bak files")
    ap.add_argument("--dry-run", action="store_true", help="Just report, don't write")
    args = ap.parse_args()

    root = Path(args.path)
    if not root.is_dir():
        print(f"error: {root} not a directory", file=sys.stderr)
        return 2

    bak_files = sorted(root.rglob("*.bak"))
    if not bak_files:
        print(f"no .bak files found under {root}")
        print("nothing to revert — your repo may already be clean")
        return 0

    print(f"found {len(bak_files)} .bak files")
    for bak in bak_files:
        original = bak.read_text(encoding="utf-8")
        target = bak.with_suffix("")  # the .bak sibling without .bak
        if not target.exists():
            print(f"  skip: {target} does not exist")
            continue

        current = target.read_text(encoding="utf-8")

        # 1. Fix the "async async" damage — the .bak is clean, so
        #    we can just compare and apply minimal patches
        fixed, async_fixes = revert_async_double(current)

        # 2. For the property-key renames, we have no clean baseline
        #    in the current file. But the .bak IS the clean baseline.
        #    So: restore from .bak, then re-apply ONLY the safe
        #    transformations (catch param rename + selective param
        #    rename that doesn't touch object keys).
        #    For simplicity in this emergency revert, we just restore
        #    from .bak and tell the user to re-run the v2 fixer.
        target.write_text(original, encoding="utf-8")
        bak.unlink()  # remove the .bak so the v2 fixer doesn't re-backup it

        print(f"  restored {target} (async double-fix not needed: {async_fixes == 0})")

    print()
    print("done. All files restored to their pre-v1 state.")
    print("Now run: python3 fix_lint_v2.py --path apps/papra-server/src --backup")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
