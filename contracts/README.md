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