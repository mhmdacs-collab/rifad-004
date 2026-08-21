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

- [ ] Render Pay/Credit/Debt actions and Clear Cart directly from React; remove business DOM observers/capture listeners.
- [ ] Clear cart sequentially, without confirmation, while keeping the operation card unchanged.
- [ ] Keep Add Customer inside the cart column with a light slide-up transition; the product catalog remains visible.
- [ ] Limit Add Customer to name, mobile, optional tax number, and optional address; no auto-save.
- [ ] On success create + attach + return to cart. Cancel/back returns without creating.
- [ ] Attach flow keeps results visible and exposes `إضافة إلى التذكرة` inside the selected card.
- [ ] Credit flow alone hides results after selection and shows selected summary + `تغيير العميل`.
- [ ] Add double-tap guards for customer create/attach and run targeted tests.
- [ ] Commit this wave independently.

## Wave 3 — Restaurant, Kitchen Delta, and table lifecycle

**Files:** restaurant domain/contract/adapter/journal, local-service state, ticket rendering, local-service tests.

- [x] Add RED/GREEN pure-domain tests for add, same-product add, reduce, cancel, unchanged, and order.
- [x] Add immutable `KitchenDispatchBatch` history and adapter idempotency coverage.
- [ ] Render immutable sent history and pending add/reduce/cancel separately in the cart.
- [ ] Keep the same table/order/ticket active after Send; gate Send and Pay deterministically.
- [ ] Make corrections explicit and never rewrite earlier dispatch batches.
- [ ] Preserve total and history through leave/reopen; free the place only after completed payment.
- [ ] Move table context, return, settings, and dialogs into React-owned structure; remove remaining DOM slots/observers.
- [ ] Add atomic assign/resume/send/leave guards and run restaurant suites.
- [ ] Commit domain/lifecycle changes independently from visual polish.

## Wave 4 — Payments, Credit, and Debt

**Files:** payment rail, debt dialog, POS domain/contract/adapter/journal/state, affected tests.

- [ ] Preserve direct payment and dine-in no-Delivery behavior.
- [ ] Complete partial/exact/invalid/overpayment debt settlement rules.
- [ ] Persist cash/card collection method plus receipt identifiers on the debt ledger entry.
- [ ] Keep collection method and confirmation reachable while debt content scrolls.
- [ ] Add atomic Pay/Credit/Debt guards and targeted double-submit tests.
- [ ] Commit this wave independently.

## Wave 5 — Collection receipt, print, and app polish

**Files:** `PrintingContract`, runtime adapters/journal, debt receipt UI, `front-office.css`, tests.

- [ ] Add a dedicated debt-collection receipt print command; do not fabricate a sales receipt.
- [ ] Show receipt number, customer name/mobile, amount, method, date/time, cashier, branch, previous debt, paid amount, and remaining debt.
- [ ] Provide `طباعة سند القبض` and `تم`, with atomic print guard and visible status.
- [ ] Consolidate semantic colors, states, focus-visible, pressed/disabled behavior, overflow, and responsive rules in `front-office.css` only.
- [ ] Commit receipt/print separately from the final CSS polish when the diff would otherwise mix concerns.

## Wave 6 — Full verification and handoff

**Files:** UI manifest, naming/field register, progress/status/handoff documents.

- [ ] Reconcile authority docs without promoting MAP-04/05 or production capability.
- [ ] Run fresh typecheck, targeted tests, full tests, and build; compare with the 16-failure baseline.
- [ ] Run the app and observe/capture cart, customer, tables, payment, credit, debt, receipt, print, and settings at 1366×768, 1440×900, 1920×1080, and 1024×768.
- [ ] Record exact PASS/FAIL/UNVERIFIED evidence and remaining issues.
- [ ] Inspect status/diff, push the branch, and create or reuse a Draft PR targeting `agent/rifad-frontoffice-final-ui`.
