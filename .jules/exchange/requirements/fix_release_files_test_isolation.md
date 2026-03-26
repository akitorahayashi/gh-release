---
label: "tests"
implementation_ready: false
---

## Goal

Refactor the test setup to track resources safely and avoid shared mutable state to prevent hidden ordering constraints and flakiness.

## Problem

The test suite `tests/adapters/release-files.test.ts` uses a module-level mutable array `temporaryDirectories` to track state across isolated tests, risking order-dependent flakes.

## Context

Using a shared, mutable top-level array across an entire `describe` block means that if tests are run in parallel, or if an early failure leaves resources in an unknown state, subsequent tests might fail. It violates the "Isolation By Design" principle which mandates avoiding shared mutable state.

## Evidence

- source_event: "release_files_shared_mutable_state_qa.md"
  path: "tests/adapters/release-files.test.ts"
  loc: "Line 8"
  note: "`const temporaryDirectories: string[] = []` creates shared module-level mutable state."
- source_event: "release_files_shared_mutable_state_qa.md"
  path: "tests/adapters/release-files.test.ts"
  loc: "Lines 11-19"
  note: "An `afterEach` hook mutates the global state to attempt cleanup, which can fail if Vitest executes other hooks or tests concurrently."

## Change Scope

- `tests/adapters/release-files.test.ts`

## Constraints

- Isolate test state by using appropriate test context tools (e.g. `beforeEach`, test-scoped variables).

## Acceptance Criteria

- Removed module-level mutable arrays.
- Setup and teardown rely on localized lifecycle hooks or test-scoped tracking.
