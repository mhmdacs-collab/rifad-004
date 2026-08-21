# Rifad Capability Adoption Workflow

## Purpose

Rifad should not re-invent solved engineering problems. It should find proven implementations, inspect how far they reached, reuse the smallest valuable slice when licensing permits, and improve it behind a Rifad-owned boundary.

This is not copy/paste development and it is not a fork strategy. Rifad owns the contracts, product data, acceptance tests and integration point.

## Core rule

> Donors provide evidence and implementation slices. Rifad provides the product boundary and composes the result.

If donor A solves one part and donor B solves another, both enter Rifad separately. Donor B is not patched into donor A to create a hidden fork.

## Relationship to the Rifad Build Method

The owner-approved capability promotion gates are defined in `docs/architecture/RIFAD_BUILD_METHOD.md`.

This adoption workflow is the detailed procedure entered at **G4 — Frontier / Donor Gate** after G0–G2 have bounded the product behavior and drafted the Rifad boundary, and G3 has determined that the work has crossed the Mock Ceiling or otherwise requires substantial implementation evidence.

The workflow then feeds:

- G4 — search, execution/characterization and legal fit;
- G5 — adoption decision;
- G6 — Rifad integration behind the refined contract;
- G7 — conformance evidence;
- G8 — capability-specific production evidence and release/replaceability.

A map item being next in the dependency order does not waive this workflow when its implementation is substantial.

## Mandatory workflow

### 1. Define the bounded capability

Describe the user behavior, inputs/outputs, durable state, failure modes, offline requirements and security/fiscal impact. Keep the unit small enough to replace.

### 2. Define the Rifad contract

Create or draft the commands, queries, DTOs, errors, stable identities, state transitions and idempotency semantics. The contract must contain Rifad language only.

At this stage the contract may still be a draft seam. Characterizing mature implementations may reveal missing product concepts, so refine the Rifad contract before treating it as a freeze candidate. Do not copy a donor schema merely because it exposes a useful concept.

### 3. Search multiple implementations

Shortlist at least two credible candidates for substantial capabilities. Search across languages. Include libraries and narrow modules before full applications.

When relevant, treat the current Rifad implementation as a candidate too. Existing implementation effort does not grant automatic preference.

### 4. Execute and characterize

Build/run the relevant donor slice. Inspect source and tests, reproduce success and failure cases, record assumptions and extract test vectors. README claims alone are not evidence.

Characterize the current Rifad implementation under the same important invariants when it competes with donor candidates.

### 5. Verify legal fit

Check the repository license, relevant file headers, dependency licenses and distribution obligations. Public source is not automatically permissive source.

### 6. Choose an adoption disposition

Choose one disposition per useful bounded slice:

- **Direct reuse (`DIRECT-REUSE`):** a small, permissively licensed and well-isolated dependency behind an adapter.
- **Port/reimplementation (`PORT-REIMPLEMENT`):** translate invariants, algorithms, state machine and test vectors into Rifad's stack.
- **Behavioral reference (`BEHAVIORAL-REFERENCE`):** implement independently from documented/observable behavior when direct reuse is unsuitable.
- **Keep Rifad (`KEEP-RIFAD`):** evidence supports the current Rifad implementation as the best practical implementation for the bounded slice.
- **Reject (`REJECT`):** choose another candidate when the slice is too coupled, unsafe, untestable, legally incompatible, weakly maintained or otherwise inferior.

Do not choose `KEEP-RIFAD` merely because the code already exists, and do not choose donor reuse merely because an external project is mature. Record the evidence for the decision.

### 7. Integrate inside Rifad

Implement the selected slice in `core/` or `adapters/` behind the Rifad contract. Do not expose donor schema, IDs, errors, SDK types or application lifecycle.

If `KEEP-RIFAD` is selected, keep the implementation behind the same replaceable boundary and subject it to the same conformance/production evidence as a donor-derived implementation.

### 8. Prove conformance

Run Rifad contract and conformance tests. Add the applicable offline, retry, migration, hardware, security and fiscal cases. Compare results with donor test vectors where useful.

The important conformance suite should describe Rifad behavior rather than one implementation's internals so a future replacement can run against the same invariants.

### 9. Record the decision

Create a donor capability record using `docs/donors/DONOR_INVENTORY_TEMPLATE.md`. Pin the source commit/version and record rejected candidates, provenance and required notices.

When `KEEP-RIFAD` wins, still record the external candidates considered and why the current implementation was retained. This prevents sunk-cost assumptions from being mistaken for evidence later.

### 10. Release and replace through Rifad

Rifad owns versioning, rollout, rollback and upstream review. Donor updates are evaluated inputs, not automatic upgrades.

A capability reaches production status only after the applicable G8 evidence exists. Green implementation tests, a working demo or clean restart alone are not sufficient.

## What makes the result Rifad code

The result is a Rifad capability only when:

- product/UI code depends on a Rifad contract;
- public DTOs, IDs, errors and state belong to Rifad;
- donor-specific details stop at the adapter/implementation boundary;
- Rifad tests can run against the current implementation and a replacement;
- persistent data ownership and migrations are explicit;
- license/provenance evidence is stored;
- replacing the implementation does not rewrite unrelated product surfaces.

## Risk lanes

Ready code reduces effort in every lane, but the acceptance evidence grows with risk.

| Lane | Examples | Minimum additional evidence |
| --- | --- | --- |
| Low | formatting, export, barcode helpers | unit/conformance and license evidence |
| Medium | printing, device discovery, local persistence | hardware/restart/error matrix |
| High | synchronization, payments, migrations, tenant isolation | idempotency, recovery, security and destructive-failure tests |
| Regulated | ZATCA/fiscal signing/reporting/clearance | official-spec vectors, audit evidence, certificate/state/retry tests |

High risk does not mean “build from zero.” It means proven donor logic must pass a stronger Rifad gate.

## Adoption anti-patterns

- Copy a whole donor application to obtain one feature.
- Modify donor A with donor B and call the combined fork Rifad.
- Accept code because its demo works while ignoring failure paths.
- Let donor models become Rifad contracts or database schema.
- Protect an accidental mock contract shape from evidence-driven refinement.
- Keep Rifad code only because replacing it feels wasteful.
- Claim support for “anything” without a tested capability matrix.
- Track a moving donor branch instead of pinning an inspected version.

## Pull request evidence

A capability-adoption PR should include:

- Rifad contract and implementation boundary;
- donor capability record(s), including retained/rejected candidate rationale;
- source/license/provenance notices where applicable;
- contract/conformance tests and applicable risk tests;
- supported capability matrix;
- migration/rollback impact when persistent state changes;
- explicit remaining limitations;
- the highest G0–G8 maturity gate actually passed, without production over-claiming.
