#!/usr/bin/env python3
"""Check the user's Codex AGENTS.md rule contract."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import sys


DEFAULT_AGENTS = Path.home() / ".codex" / "AGENTS.md"

EXPECTED_VERIFICATION_BLOCK = """### 8. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness"""


@dataclass(frozen=True)
class ContractCheck:
    name: str
    required: tuple[str, ...] = ()
    forbidden: tuple[str, ...] = ()
    exact_block: str | None = None


CHECKS = (
    ContractCheck(
        name="language protocol and AGENTS language exception",
        required=(
            "Think / reason internally in English",
            "Always answer the user in Chinese",
            "except `AGENTS.md`, `CLAUDE.md`, and rule files",
        ),
    ),
    ContractCheck(
        name="first-principles thinking",
        required=(
            "real problem to solve",
            "existing patterns blindly",
            "smallest testable units",
            "major decisions",
        ),
    ),
    ContractCheck(
        name="adversarial review",
        required=(
            "adversarial review",
            "skeptical reviewer",
            "logical errors",
            "incorrect assumptions",
            "unnecessary complexity",
            "better alternatives",
            "3-5 most probable failure modes",
            "tests, evidence, or reproducible verification",
        ),
    ),
    ContractCheck(
        name="mandatory task records",
        required=(
            "write a plan to `tasks/todo.md`",
            "Track progress in `tasks/todo.md`",
            "Add a review section to `tasks/todo.md`",
            "Capture lessons in `tasks/lessons.md`",
            "After ANY correction from the user",
        ),
    ),
    ContractCheck(
        name="verification section unchanged",
        exact_block=EXPECTED_VERIFICATION_BLOCK,
    ),
    ContractCheck(
        name="duplicate old sections removed",
        forbidden=(
            "## Engineering Mindset",
            "### Think from First Principles",
            "### Perform an Adversarial Review",
            "## Task Management",
            "## Core Principles",
            "### 1. Think Before Coding",
        ),
    ),
)


def normalized(text: str) -> str:
    return text.replace("\u2013", "-").replace("\u2014", "-")


def run_check(check: ContractCheck, text: str) -> list[str]:
    failures: list[str] = []
    searchable = normalized(text)

    for phrase in check.required:
        if phrase not in searchable:
            failures.append(f"missing: {phrase}")

    for phrase in check.forbidden:
        if phrase in searchable:
            failures.append(f"forbidden: {phrase}")

    if check.exact_block and normalized(check.exact_block) not in searchable:
        failures.append("exact block not found")

    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check that Codex AGENTS.md still carries the expected rule concepts."
    )
    parser.add_argument(
        "agents_md",
        nargs="?",
        type=Path,
        default=DEFAULT_AGENTS,
        help=f"AGENTS.md path to check. Default: {DEFAULT_AGENTS}",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    path = args.agents_md.expanduser()

    try:
        text = path.read_text(encoding="utf-8")
    except OSError as error:
        print(f"FAIL cannot read {path}: {error}", file=sys.stderr)
        return 2

    failed = False
    for check in CHECKS:
        failures = run_check(check, text)
        if failures:
            failed = True
            print(f"FAIL {check.name}")
            for failure in failures:
                print(f"  - {failure}")
        else:
            print(f"PASS {check.name}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
