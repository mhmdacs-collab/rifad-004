# Rifad Core Lab — Project Rules

These rules are binding for Core Lab research, simulation and adoption work.

## 0. Mandatory session entrypoint

- Every fresh AI/Codex/human technical session must read `AI_PROJECT_ENTRYPOINT.md` before substantive work.
- Recover project state from repository authority instead of asking the product owner to repeat known history.
- Major strategic changes must update the entrypoint in the same repository change.
- Authority files may not be silently rewritten during an unrelated implementation/research task.

## 1. Product target

- Rifad owns the product, UX, Saudi requirements and quality bar.
- The first product horizon is **100% functional/workflow parity with the adopted observable Loyverse baseline** before the baseline is declared complete.
- Evaluate architecture against the full parity horizon, not only the next feature.
- Any deliberate omission from the adopted baseline requires explicit product-owner approval.
- Loyverse is a functional/workflow reference, not a code source or assumed internal architecture.
- Rifad keeps its own visual identity.

## 2. Product owner vs technical responsibility

- Product owner: customer needs, features, workflows, UX direction, Saudi/commercial priorities.
- Technical/AI role: Core selection, databases, languages, protocols, APIs, implementation sources, graft strategy, simulation, failure analysis, licensing and technical tradeoffs.
- Do not push purely technical implementation selection back to the product owner.

## 3. Primary Core first

- Before building a substantial business engine from zero, search serious mature whole-core candidates.
- A mature open-source POS, ERP, accounting engine or other system may become the Primary Core.
- No candidate wins by name, sunk cost or architectural fashion.
- Inspect real code, tests, database model, transaction boundaries, failures, maintenance and licenses.
- Build/run leading candidates where practical.
- Perform architecture simulation before adoption.
- Do not select the first candidate that runs.

## 4. Capability grafting

- A selected Primary Core does not need to be best at every capability.
- Keep strong native capabilities.
- For weak/missing areas, search proven implementations elsewhere.
- A graft may use direct reuse, port/reimplementation, behavioral/test-vector reference, native core extension or external service when justified.
- Language mismatch is not a blocker.
- Build from zero only when mature options do not fit safely or bespoke Rifad work is demonstrably better.

## 5. Adapters are a tool

- Do not require an adapter between every internal component.
- Direct modification of a controlled Primary Core is allowed when it is the simplest safe design.
- Use contracts/facades/adapters when they provide real isolation, translation, replacement or conformance value.
- Avoid a shadow business engine or ceremonial architecture.

## 6. Simulation before commitment

Every serious Core candidate must be simulated against at least:

- full adopted Loyverse parity coverage;
- exact money/rounding;
- transaction integrity;
- sales/orders;
- catalog/options/modifiers;
- inventory;
- shifts/cash/time clock;
- payments/refunds;
- taxes;
- customers/credit/loyalty;
- restaurant/tables/open orders;
- KDS/CDS;
- local persistence/restart/crash;
- concurrency/multi-device;
- LAN;
- API/extensibility;
- database/migrations;
- offline;
- branches/devices;
- sync attachment;
- printing/hardware;
- permissions/security;
- accounting;
- ZATCA feasibility;
- performance/volume;
- maintenance/dependencies;
- licensing/control.

Record `KEEP / MODIFY / REPLACE / GRAFT` for major capability families.

## 7. Capability gates

Substantial work follows G0–G8 from `docs/architecture/RIFAD_BUILD_METHOD.md`.

The Mock Ceiling is binding: do not grow a discovery mock into a production state machine, ledger, persistence engine, concurrency system, protocol implementation, security authority or fiscal engine without the sourcing/simulation gate.

## 8. Correctness and evidence

- Money and rounding must be exact and explicit.
- Sales/payment duplication must be prevented by design.
- Local/offline durability must be proven where required.
- Green upstream tests are useful but not sufficient.
- Production status requires applicable conformance, failure, migration, hardware, security, performance and regulatory evidence.

## 9. Source and license discipline

- Public source is not automatically reusable source.
- Pin the exact version/commit inspected.
- Check repository/file/dependency licenses and redistribution/modification obligations.
- Preserve provenance for reused or ported logic.
- Record rejected candidates and reasons.

## 10. Historical material

- `rifad-004` is evidence, not automatic Core architecture authority.
- Preserve useful product decisions, tests and research.
- Do not force a new Core to reproduce accidental staging models from the historical repository.

## 11. No premature production repo

The Core Lab is for selection and simulation. Do not turn it into the final production application before the Primary Core decision is evidence-backed.

A clean production repository is created after Core selection.
