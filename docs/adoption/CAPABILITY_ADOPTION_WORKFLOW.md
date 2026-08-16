# Rifad Capability Adoption Workflow

## Purpose

Rifad should not re-invent solved engineering problems. It should find proven implementations, inspect how far they reached, reuse the smallest valuable slice when licensing permits, and improve it behind a Rifad-owned boundary.

This is not copy/paste development and it is not a fork strategy. Rifad owns the contracts, product data, acceptance tests and integration point.

## Core rule

> Donors provide evidence and implementation slices. Rifad provides the product boundary and composes the result.

If donor A solves one part and donor B solves another, both enter Rifad separately. Donor B is not patched into donor A to create a hidden fork.

## Mandatory workflow

### 1. Define the bounded capability

Describe the user behavior, inputs/outputs, durable state, failure modes, offline requirements and security/fiscal impact. Keep the unit small enough to replace.

### 2. Define the Rifad contract

Create or draft the commands, queries, DTOs, errors, stable identities, state transitions and idempotency semantics. The contract must contain Rifad language only.

### 3. Search multiple implementations

Shortlist at least two credible candidates for substantial capabilities. Search across languages. Include libraries and narrow modules before full applications.

### 4. Execute and characterize

Build/run the relevant donor slice. Inspect source and tests, reproduce success and failure cases, record assumptions and extract test vectors. README claims alone are not evidence.

### 5. Verify legal fit

Check the repository license, relevant file headers, dependency licenses and distribution obligations. Public source is not automatically permissive source.

### 6. Choose a reuse mode

- **Direct reuse:** a small, permissively licensed and well-isolated dependency behind an adapter.
- **Port/reimplementation:** translate invariants, algorithms, state machine and test vectors into Rifad's stack.
- **Behavioral reference:** implement independently from documented/observable behavior when direct reuse is unsuitable.
- **Reject:** choose another donor when the slice is too coupled, unsafe, untestable or legally incompatible.

### 7. Integrate inside Rifad

Implement the selected slice in `core/` or `adapters/` behind the Rifad contract. Do not expose donor schema, IDs, errors, SDK types or application lifecycle.

### 8. Prove conformance

Run Rifad contract and conformance tests. Add the applicable offline, retry, migration, hardware, security and fiscal cases. Compare results with donor test vectors where useful.

### 9. Record the decision

Create a donor capability record using `docs/donors/DONOR_INVENTORY_TEMPLATE.md`. Pin the source commit/version and record rejected candidates, provenance and required notices.

### 10. Release and replace through Rifad

Rifad owns versioning, rollout, rollback and upstream review. Donor updates are evaluated inputs, not automatic upgrades.

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
- Claim support for “anything” without a tested capability matrix.
- Track a moving donor branch instead of pinning an inspected version.

## Pull request evidence

A capability-adoption PR should include:

- Rifad contract and implementation boundary;
- donor capability record(s);
- source/license/provenance notices;
- contract/conformance tests and applicable risk tests;
- supported capability matrix;
- migration/rollback impact when persistent state changes;
- explicit remaining limitations.
