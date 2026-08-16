# Rifad Test Strategy

Tests are organized around contracts and product behavior, not donor projects.

Target suites:

- `contract/` — every adapter must satisfy its Rifad contract.
- `conformance/` — invariant and reference behavior across implementations.
- `visual/` — major POS/Back Office/Dashboard/KDS/CDS layouts and states.
- `interaction/` — touch, keyboard, dialogs, navigation and state transitions.
- `offline/` — restart, retry, duplicate prevention and delayed synchronization.
- `lan/` — discovery, pairing, reconnect, sequence/replay and device-loss cases.
- `hardware/` — printer/payment/device families where relevant.
- `fiscal/` — ZATCA generation/submission/state/retry evidence.
- `migration/` — persistent-schema upgrades and rollback/recovery paths.

A donor is never considered adopted merely because its own test suite passes. It must pass Rifad contract/conformance tests in isolation.