# Front Office Regression Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the Rifad POS Front Office regressions while preserving the accepted catalog/transaction-rail layout and proving the required cashier flows.

**Architecture:** Make React own the ticket workspace, add immutable mock/local Kitchen Delta history, keep Add Customer inline in the cart column, distinguish Attach from Credit selection, and route debt collection receipt printing through the Rifad printing contract.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, Rifad local persistence/journal contracts.

**Spec:** `docs/superpowers/specs/2026-08-21-front-office-regression-finalization-design.md`

## Global constraints

- Base is `agent/rifad-frontoffice-final-ui` at SHA `4a30118f11b1072db71569cb73fd9aeae37e8309`, confirmed equal to its remote tracking ref before implementation.
- Work only on `agent/frontoffice-regression-finalization`; never merge to `main`.
- Preserve the existing main catalog/transaction-rail layout.
- Use `front-office.css`; do not add or edit a new `visual-pass-*` file.
- Do not change tax, VAT, ZATCA, Money scale, sync, production database, Branch Hub, or MAP-02.
- Restaurant/Kitchen work remains mock/local; do not claim real KDS transport or MAP-04 completion.
- Every behavior change follows RED → GREEN → REFACTOR.
- Each wave receives its own focused commit; do not combine domain, CSS, and receipt work in one commit.
- A visual viewport is PASS only after the running application is actually observed or captured at that exact size. If browser runtime is unavailable, record `UNVERIFIED` and do not mark the task done.

## Wave 1 — Baseline and root causes

**Files:** test setup, plan/spec, existing test suite.

- [x] Confirm the exact base SHA and isolate a clean worktree without touching owner changes.
- [x] Record baseline typecheck PASS and exact 16 failing tests.
- [x] Prove the default restaurant-on initial state rewrites retail actions before async config loads.
- [x] Make the initial/test context retail-off; restaurant tests explicitly opt in.
- [x] Commit documentation and baseline-context changes only.

## Wave 2 — Ticket, Customer, and Cart

**Files:** `SalesScreen.tsx`, `TicketPanel.tsx`, `TicketCustomerWorkspace.tsx`, `CustomerPickerDialog.tsx`, `ConfiguredCustomerCredit.tsx`, `App.tsx`, affected tests.

- [x] Render Pay/Credit/Debt actions and Clear Cart directly from React; remove business DOM observers/capture listeners.
- [x] Clear cart sequentially, without confirmation, while keeping the operation card unchanged.
- [x] Keep Add Customer inside the cart column with a light slide-up transition; the product catalog remains visible.
- [x] Limit Add Customer to name, mobile, optional tax number, and optional address; no auto-save.
- [x] On success create + attach + return to cart. Cancel/back returns without creating.
- [x] Attach flow keeps results visible and exposes `إضافة إلى التذكرة` inside the selected card.
- [x] Credit flow alone hides results after selection and shows selected summary + `تغيير العميل`.
- [x] Add double-tap guards for customer create/attach and run targeted tests.
- [x] Commit this wave independently.

## Wave 3 — Restaurant, Kitchen Delta, and table lifecycle

**Files:** restaurant domain/contract/adapter/journal, local-service state, ticket rendering, local-service tests.

- [x] Add RED/GREEN pure-domain tests for add, same-product add, reduce, cancel, unchanged, and order.
- [x] Add immutable `KitchenDispatchBatch` history and adapter idempotency coverage.
- [x] Render immutable sent history and pending add/reduce/cancel separately in the cart.
- [x] Keep the same table/order/ticket active after Send; gate Send and Pay deterministically.
- [x] Make corrections explicit and never rewrite earlier dispatch batches.
- [x] Preserve total and history through leave/reopen; free the place only after completed payment.
- [x] Move table context, return, settings, and dialogs into React-owned structure; remove remaining DOM slots/observers.
- [x] Add atomic assign/resume/send/leave guards and run restaurant suites.
- [x] Commit domain/lifecycle changes independently from visual polish.

Capability Adoption audit: this wave is a bounded correction of the existing Rifad-owned `RestaurantServiceContract`, `OpenLocalOrder`, and mock/local persistence path. It does not add an external donor or a new tables state machine; move/merge/split/seats/reservations and real KDS transport remain out of scope.

Wave verification: typecheck PASS; `kitchen-delta.test.ts` + `local-service.test.tsx` PASS (13/13). The full suite is reduced from the 16-failure baseline to three failures, all assigned to Wave 4/5 debt/receipt assertions rather than Restaurant/Kitchen behavior.

## Wave 4 — Payments, Credit, and Debt

**Files:** payment rail, debt dialog, POS domain/contract/adapter/journal/state, affected tests.

- [x] Preserve direct payment and dine-in no-Delivery behavior.
- [x] Complete partial/exact/invalid/overpayment debt settlement rules.
- [x] Persist cash/card collection method plus receipt identifiers on the debt ledger entry.
- [x] Keep collection method and confirmation reachable while debt content scrolls.
- [x] Add atomic Pay/Credit/Debt guards and targeted double-submit tests.
- [x] Commit this wave independently.

Wave verification: typecheck PASS; payment/credit/debt targeted suites PASS (23/23); full Vitest suite PASS (27 files, 83 tests).

## Wave 5 — Collection receipt, print, and app polish

**Files:** `PrintingContract`, runtime adapters/journal, debt receipt UI, `front-office.css`, tests.

- [x] Add a dedicated debt-collection receipt print command; do not fabricate a sales receipt.
- [x] Show receipt number, customer name/mobile, amount, method, date/time, cashier, branch, previous debt, paid amount, and remaining debt.
- [x] Provide `طباعة سند القبض` and `تم`, with atomic print guard and visible status.
- [x] Consolidate semantic colors, states, focus-visible, pressed/disabled behavior, overflow, and responsive rules in `front-office.css` only.
- [x] Commit receipt/print separately from the final CSS polish when the diff would otherwise mix concerns.

Wave verification: typecheck PASS; targeted receipt/customer/restaurant suites PASS (37/37); production build PASS. The application was run in the in-app browser and actually observed at 1024×768, 1366×768, 1440×900, and 1920×1080. Verified states include inline customer creation with catalog retained and no body horizontal overflow, tables, sent/pending Kitchen Delta, payment total/method contrast, Credit selected-summary behavior, Debt keypad with sticky method/confirmation actions, collection receipt fields/actions, print status, and settings. Browser console warnings/errors: none.

## Wave 6 — Full verification and handoff

**Files:** UI manifest, naming/field register, progress/status/handoff documents.

- [x] Reconcile authority docs without promoting MAP-04/05 or production capability.
- [x] Run fresh typecheck, targeted tests, full tests, and build; compare with the 16-failure baseline.
- [x] Run the app and observe/capture cart, customer, tables, payment, credit, debt, receipt, print, and settings at 1366×768, 1440×900, 1920×1080, and 1024×768.
- [x] Record exact PASS/FAIL/UNVERIFIED evidence and remaining issues.
- [x] Inspect status/diff, push the branch, and create or reuse a Draft PR targeting `agent/rifad-frontoffice-final-ui`.

Final verification: typecheck PASS; targeted Front Office suites PASS (7 files, 29 tests); full POS suite PASS (27 files, 83 tests) versus the pinned-base baseline of 16 failed / 52 passed; production build PASS (148 modules). Runtime visual inspection PASS at all four required viewports with no console warnings/errors or page-level horizontal overflow. Physical printer output and production persistence remain UNVERIFIED and are not claimed by this lane.
