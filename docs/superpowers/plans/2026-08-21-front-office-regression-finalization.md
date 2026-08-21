# Front Office Regression Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the Rifad POS Front Office regressions while preserving the accepted catalog/transaction-rail layout and proving the required cashier flows.

**Architecture:** Make React own the ticket workspace, add immutable mock/local Kitchen Delta history, keep Add Customer inline in the cart column, distinguish Attach from Credit selection, and route debt collection receipt printing through the Rifad printing contract.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, Rifad local persistence/journal contracts.

**Spec:** `docs/superpowers/specs/2026-08-21-front-office-regression-finalization-design.md`

**Current owner override:** foundation commits `d6188b9`, `27c4ac5`, and `911df69`,
plus regression-test commit `85e5746`, implement the latest ownership correction.
Sent history is immutable to ordinary cart tools; pending additions are separately
editable/clearable. The current cashier Front Office exposes no sent-line correction
region, control, gesture or `allowSentCorrections` path. Existing `reduce`/`cancel`
helpers remain only as internal domain/adapter characterization coverage; future
sent-item correction/void UX and authorization are deferred to the later Open Order
lifecycle. Wave 7 visual polish is halted at a safe checkpoint, MAP-02 has not started, and
Runtime Visual remains `UNVERIFIED` overall.

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
- [x] Render immutable sent history and editable/clearable pending additions in the cart; do not expose any sent-line correction controls.
- [x] Keep the same table/order/ticket active after Send; gate Send and Pay deterministically.
- [x] Keep ordinary edit/delete/swipe/Clear Cart scoped to pending lines only.
- [x] Keep existing `reduce`/`cancel` helpers isolated as internal characterization coverage without exposing an executable cashier correction flow.
- [x] Preserve total and history through leave/reopen; free the place only after completed payment.
- [x] Move table context, return, settings, and dialogs into React-owned structure; remove remaining DOM slots/observers.
- [x] Add atomic assign/resume/send/leave guards and run restaurant suites.
- [x] Commit domain/lifecycle changes independently from visual polish.

Capability Adoption audit: this wave is a bounded correction of the existing Rifad-owned `RestaurantServiceContract`, `OpenLocalOrder`, and mock/local persistence path. It does not add an external donor or a new tables state machine; move/merge/split/seats/reservations and real KDS transport remain out of scope.

Historical Wave 3 verification is superseded by the ownership follow-up. Current fresh
verification is recorded under Wave 6.

## Wave 4 — Payments, Credit, and Debt

**Files:** payment rail, debt dialog, POS domain/contract/adapter/journal/state, affected tests.

- [x] Preserve direct payment and dine-in no-Delivery behavior.
- [x] Complete partial/exact/invalid/overpayment debt settlement rules.
- [x] Persist cash/card collection method plus receipt identifiers on the debt ledger entry.
- [x] Keep collection method and confirmation reachable while debt content scrolls.
- [x] Add atomic Pay/Credit/Debt guards and targeted double-submit tests.
- [x] Commit this wave independently.

Historical Wave 4 verification before the ownership follow-up: typecheck PASS;
payment/credit/debt targeted suites PASS (23/23); full Vitest suite PASS (27 files,
83 tests). This is provenance, not the current final result.

## Wave 5 — Collection receipt, print, and app polish

**Files:** `PrintingContract`, runtime adapters/journal, debt receipt UI, `front-office.css`, tests.

- [x] Add a dedicated debt-collection receipt print command; do not fabricate a sales receipt.
- [x] Show receipt number, customer name/mobile, amount, method, date/time, cashier, branch, previous debt, paid amount, and remaining debt.
- [x] Provide `طباعة سند القبض` and `تم`, with atomic print guard and visible status.
- [x] Consolidate semantic colors, states, focus-visible, pressed/disabled behavior, overflow, and responsive rules in `front-office.css` only.
- [x] Commit receipt/print separately from the final CSS polish when the diff would otherwise mix concerns.

Historical Wave 5 automated evidence predates the latest ownership corrections. It is
retained as provenance only and does not establish current Runtime Visual PASS.

## Wave 6 — Full verification and handoff

**Files:** UI manifest, naming/field register, progress/status/handoff documents.

- [x] Reconcile authority docs without promoting MAP-04/05 or production capability.
- [x] Run fresh typecheck, serialized full tests and build after the ownership follow-up; compare with the 16-failure baseline.
- [ ] Run the app and observe/capture cart, customer, tables, payment, credit, debt, receipt, print, and settings at 1366×768, 1440×900, 1920×1080, and 1024×768.
- [x] Record the current Runtime Visual result as `UNVERIFIED` and retain remaining issues.
- [x] Inspect status/diff, push the branch, and create or reuse a Draft PR targeting `agent/rifad-frontoffice-final-ui`.

Current verification: `npm run typecheck` PASS; serialized full POS suite PASS (27
files / 94 tests, exit 0); `npm run build` PASS (146 modules transformed). Runtime
Visual is `UNVERIFIED` overall because the full required viewport/state matrix has not
been rerun and captured after the ownership corrections. Physical printer output and
production persistence also remain `UNVERIFIED`.

## Wave 7 — halted safe checkpoint

Wave 7 visual polish was stopped by owner override. Do not resume it until the
foundation scenario is accepted. Do not start MAP-02 before explicit owner approval.
