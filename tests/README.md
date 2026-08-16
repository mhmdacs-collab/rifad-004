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

Every donor adoption record must link to the exact Rifad evidence that accepted it. For printing this includes layout fixtures for A4/80 mm/58 mm, Arabic/QR/logo cases, transport disconnect/reconnect cases, restart recovery and duplicate/unknown-delivery behavior across the supported device matrix.

UI test names and fixtures must include the relevant manifest screen/action/flow IDs. A screen or flow may not move to `verified` until its manifest acceptance criteria are linked to passing evidence.

Run `node tests/ui/validate-ui-manifest.mjs` to verify unique IDs, evidence mappings, action/screen/flow references and the ready implementation gate. GitHub Actions runs the same check whenever UI manifest/research files change.
