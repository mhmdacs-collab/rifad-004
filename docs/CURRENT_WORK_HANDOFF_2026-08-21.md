# Front Office Regression Finalization Handoff — 2026-08-21

Branch: `agent/frontoffice-regression-finalization`

Base branch: `agent/rifad-frontoffice-final-ui`

Pinned base SHA: `4a30118f11b1072db71569cb73fd9aeae37e8309`

Draft pull request: `#4` targeting `agent/rifad-frontoffice-final-ui`; unmerged.

Foundation follow-up commits: `d6188b9`, `27c4ac5`, `911df69`; regression-test
follow-up: `85e5746`.

## Current checkpoint

The branch retains the six separately committed regression waves below:

1. baseline and root-cause isolation;
2. Ticket Workspace, customer and cart ownership;
3. existing restaurant/kitchen/table lifecycle correction;
4. payment, Credit and debt collection safeguards;
5. dedicated collection receipt printing and app-like CSS polish;
6. authority reconciliation and verification.

The subsequent Wave 7 visual-polish continuation was stopped at the first safe
checkpoint by owner override. The ownership corrections above are allowed foundation
work, not a resumption of visual polish. The Front Office is not visually accepted yet,
and MAP-02 has not started.

## Binding customer decisions

- Add New Customer is inline inside Ticket Workspace/cart column, never a dialog or modal.
- The catalog remains visible while the four-field customer form is active.
- Name and mobile are required; tax number and address are optional.
- Cancel/Back returns without creation; success creates, attaches and returns to cart.
- Normal-ticket selection keeps results and exposes attachment in the selected card.
- Credit selection hides all other results and shows a selected summary plus Change Customer.

## Capability boundary

Restaurant work is a bounded correction of the existing Rifad-owned
`RestaurantServiceContract`, open-local-order adapter and local/mock state. It adds
immutable kitchen dispatch batches and explicit pending/sent ownership. Ordinary cart
editing, deletion and clearing apply to pending additions only; sent lines are
read-only in the current cashier Front Office. No current cashier control, gesture or
interaction path exposes `allowSentCorrections` or can stage a `reduce`/`cancel` against
a sent line. The existing `reduce`/`cancel` helpers may remain only as internal
domain/adapter characterization coverage; they are not an executable cashier feature
and do not represent an authorization decision. Future sent-item correction/void UX,
authorization, reason, audit, kitchen notification and financial consequences are
deferred to the later Open Order lifecycle decision.
It does not add move/merge/split/seats/reservations, a real KDS, production table
persistence or a new domain engine.

This remains an extension of the existing local/mock contract and adapters. A broader
kitchen/table capability or state machine must stop and follow Capability Adoption.

Debt settlement and collection-receipt printing remain local/mock. The dedicated
printing call does not create a sales receipt. Physical printer delivery, production
database behavior and payment accounting are not claimed.

## Runtime visual status

**UNVERIFIED overall.** Earlier handoff text recorded a four-viewport review before the
latest ownership corrections, but the complete required viewport/state matrix has not
been rerun and captured for the current checkpoint. Do not report Runtime Visual PASS
until the running application is actually observed or captured at every required size.

Physical printer output and production persistence remain `UNVERIFIED`.

## Fresh automated verification

- TypeScript: `npm run typecheck` — PASS.
- Serialized POS suite: `npm test -- --run --maxWorkers=1 --minWorkers=1 --no-file-parallelism --reporter=dot` — PASS, 27 files / 94 tests, exit 0.
- Production bundle: `npm run build` — PASS, 146 modules transformed.
- The pinned-base baseline remains 16 failed / 52 passed tests for comparison only.

## Review order

Review the original commits in wave order, then review `d6188b9`, `27c4ac5`,
`911df69`, and `85e5746` in that order. Do not squash domain, CSS, receipt and
foundation work together; the separation is intentional for regression isolation.
