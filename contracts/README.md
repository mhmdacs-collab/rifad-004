# Rifad Contracts

Contracts are the stable seams between Rifad product surfaces and replaceable implementations.

Initial contract families:

- sales
- orders
- money
- catalog
- tables
- shifts
- inventory
- branches
- employees
- permissions
- customers
- loyalty
- printing
- payments
- lan
- sync
- kds
- cds
- fiscal
- accounting
- notifications

## Contract rule

A contract describes Rifad behavior and data, never donor internals.

Every contract must eventually define:

- commands;
- queries;
- input/output DTOs;
- stable IDs;
- errors;
- state transitions;
- idempotency requirements where relevant;
- offline behavior where relevant;
- versioning/migration expectations.

Phase 1 implementations are mocks used by the UI. Later adapters replace them without requiring product-surface rewrites.

## Adoption rule

Donor APIs are inputs to adapter design, never public Rifad contracts. Contracts are derived from Rifad product behavior first, then used to evaluate donor candidates.

A contract must be specific enough to run the same conformance suite against a mock, a ported implementation and a replacement adapter. For hardware capabilities it also exposes capabilities/status without leaking vendor SDK types.

Contract method names referenced by `docs/ui/UI_EXECUTION_MANIFEST.json` are draft seams until the authorized UI flow proves their commands, results, errors and state transitions. Freeze them only after that evidence exists; do not treat a draft manifest name as a production API promise.
