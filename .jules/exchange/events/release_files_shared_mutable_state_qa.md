---
label: "tests"
created_at: "2024-03-25"
author_role: "qa"
confidence: "high"
---

## Problem

The test suite `tests/adapters/release-files.test.ts` uses a module-level mutable array `temporaryDirectories` to track state across isolated tests, risking order-dependent flakes.

## Goal

Refactor the test setup to track resources using test-scoped or `beforeEach` scoped contexts instead of a global array.

## Context

Using a shared, mutable top-level array across an entire `describe` block means that if tests are run in parallel, or if an early failure leaves resources in an unknown state, subsequent tests might fail. It violates the "Isolation By Design" principle which mandates avoiding shared mutable state to prevent hidden ordering constraints and flakiness. The cleanup should be tied to the execution context of individual tests or localized lifecycle hooks safely.

## Evidence

- path: "tests/adapters/release-files.test.ts"
  loc: "Line 8"
  note: "`const temporaryDirectories: string[] = []` creates shared module-level mutable state."
- path: "tests/adapters/release-files.test.ts"
  loc: "Lines 11-19"
  note: "An `afterEach` hook mutates the global state to attempt cleanup, which can fail if Vitest executes other hooks or tests concurrently."

## Change Scope

- `tests/adapters/release-files.test.ts`
