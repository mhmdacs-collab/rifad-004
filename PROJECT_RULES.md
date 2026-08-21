# Rifad Project Rules

These rules are binding for implementation work in this repository.

## 0. Mandatory session entrypoint

- Before any substantive architecture, implementation, donor/core selection, MAP work or repository change, a fresh AI/Codex session or human technical lead must read `AI_PROJECT_ENTRYPOINT.md` completely.
- Recover project state from repository authority before asking the product owner to repeat prior history or decisions.
- After reading the entrypoint, verify live branch/PR/head state before making writes; the entrypoint is continuity authority, not a substitute for checking mutable Git state.
- When a major strategic task, Primary Core decision, repository role, authority rule or continuation point changes, update `AI_PROJECT_ENTRYPOINT.md` in the same repository change.
- If this file and the entrypoint conflict, surface the conflict instead of silently choosing the locally convenient rule.

## 1. Product ownership and implementation sourcing

- Rifad is the product. Rifad owns the customer experience, business decisions, release quality and Saudi-specific requirements.
- Rifad ownership does **not** require every engine or business capability to be written from zero by Rifad.
- A mature open-source POS, ERP, accounting engine or other system may become the **Primary Core** when evidence shows that adopting, modifying and controlling it is the strongest practical path for stability, correctness, capability, maintainability, cost and delivery speed.
- Odoo, ERPNext, FloCafe, another POS, the current Rifad implementation or another project may win a core/capability evaluation. None receives preference by name, previous effort or architectural fashion.
- Start from the frontier, not from zero: before inventing a product workflow or substantial technical capability, identify mature products, standards and implementations that already solved the closest problem.
- Before substantial implementation, consider both a strong **whole-core candidate** and narrower **capability slices** when either could materially reduce risk or development time.
- If a Primary Core is selected, keep it when it is strong and graft/port/reimplement stronger capabilities from other proven sources where it is weak. Building from zero is the fallback, not the default.
- The binding sourcing strategy is `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`.
- Loyverse remains the primary functional/workflow and ergonomic baseline for the POS/Back Office product split, not a source-code dependency or Rifad's visual identity.
- For ordinary POS/Back Office ownership questions, inspect documented mature behavior first. Do not repeatedly ask whether a mature cashier/admin responsibility belongs in POS or Back Office when the baseline already resolves it.
- Deviate from the proven product baseline only for an explicit Rifad reason such as Saudi regulation, a real market need, lower total cost, stronger offline/reliability behavior, security, performance or a demonstrably better user experience.

## 2. UI-first without UI business logic

- Build user-facing surfaces early using mock/staging behavior where the real engine is not ready so product behavior can be discovered and owner-reviewed.
- UI components may orchestrate interaction state only; authoritative business rules belong in the selected engine/domain implementation.
- Every visible durable action must have an explicit execution seam. That seam may be a Rifad contract, a thin facade over the selected Primary Core, or another deliberate boundary appropriate to the implementation. Do not add abstraction merely for ceremony.
- A screen is not accepted if it looks or behaves like a generic website. Tablet interaction must feel application-native.
- No screen, action, state or flow may be implemented merely from a family name such as “sales workspace.” It must have a stable ID and evidence in `docs/ui/UI_EXECUTION_MANIFEST.json`.
- Implementation is allowed only for a complete `ready` screen or the explicitly permitted subset of a `ready` flow. Missing behavior is a manifest task, not an invitation to invent.
- Every implementation PR must name the affected screen/action/flow IDs and update the manifest when behavior changes.
- Loyverse is the primary functional/workflow reference. Rifad's design system is the visual authority.
- External visual references require an approved decision under `docs/ui/visual-decisions/`; a mention in discussion is not approval.

## 3. Core and capability architecture

Architecture exists to improve reliability and maintainability, not to maximize indirection.

### Primary Core

- A selected Primary Core may legitimately own several tightly related capabilities and use its native transaction/data model internally when that model has passed the selection evidence.
- Rifad may modify the selected Primary Core directly when direct modification is the cleanest and safest implementation path.
- Do not build a second shadow business engine merely to hide the selected Primary Core.
- Keep the Rifad UI/product layer insulated from unnecessary engine-specific details where practical so product work does not become scattered across vendor/project internals.

### Capability grafts and integrations

A capability that is replaced, grafted or externally integrated must have enough explicit boundary to answer:

1. who owns the durable truth;
2. how the Primary Core/product invokes it;
3. what identities/state/errors cross the boundary;
4. how retries/failures are handled;
5. how it is tested independently;
6. how its source/license/provenance is recorded.

Use an adapter/contract/facade when it provides concrete value: provider isolation, protocol translation, replaceability, conformance testing, or protection from spreading external SDK/schema details.

Do **not** require an adapter between every internal component if Rifad directly controls the Primary Core and the layer would add complexity without meaningful isolation.

Independent modules may not silently mutate another module's private state. Cross-boundary changes must use the selected integration seam or an explicitly accepted shared transaction model inside the Primary Core.

### Capability promotion gates

- Every substantial capability follows the owner-approved G0–G8 build method in `docs/architecture/RIFAD_BUILD_METHOD.md`.
- The Final Implementation Map defines **what/when**; the Build Method defines **how** a capability is allowed to mature. Being the next map item does not waive the gates.
- UI/mock work may proceed for bounded product discovery, but the **Mock Ceiling** is mandatory: when the next work becomes a real state machine, financial ledger, durable lifecycle, concurrency/conflict system, production offline/retry engine, hardware/protocol integration, migration/security/fiscal authority or equivalent substantial engine, stop extending the mock as the production path and perform the sourcing/simulation gate first.
- Draft contracts/facades may be refined after mature implementation characterization. Do not freeze accidental mock shapes merely because they exist.
- Current Rifad code is evaluated as a candidate alongside full-core and capability implementations. Existing effort is not automatic authority, and external maturity is not automatic authority either.
- Green tests, a working UI or a clean restart do not by themselves promote a capability to production. Production status requires the applicable conformance/failure/runtime evidence in G7/G8.

## 4. Core / donor / source policy

Before adopting a Primary Core or capability implementation:

- inspect the real implementation, not only the README;
- inspect tests and failure cases;
- inspect realistic persistence/restart/concurrency behavior where relevant;
- verify the license and dependency licenses;
- compare credible alternatives;
- simulate how the candidate fits future Rifad needs before committing implementation effort;
- preserve required notices/provenance for copied or redistributed code;
- reject a candidate when adapting it requires broad unsafe repairs or creates a worse long-term foundation than another option.

Language mismatch is not a blocker. Proven logic from Java, C++, Python, PHP or another language may be ported/reimplemented in the runtime that best fits the selected core and product.

### Primary Core selection

- A project may become Rifad's Primary Core **only through explicit evidence-driven selection**, never because it was the first donor examined.
- Whole-core adoption is valid when the candidate carries a large share of Rifad better than a green-field or fragmented implementation.
- The selection must consider money correctness, transaction integrity, inventory, orders, shifts/cash, payments, taxes, offline/restart, concurrency, APIs/extensibility, database evolution, LAN, sync, hardware, ZATCA feasibility, performance, maintenance and licensing as applicable.
- Record what will be retained, modified, replaced and grafted before implementation begins.

### Capability grafting

- Once a Primary Core is selected, search other sources for its weak/missing capabilities instead of automatically replacing the core or writing from zero.
- Different capabilities may have different best sources.
- A graft may be direct reuse, port/reimplementation, behavioral/test-vector reference, an external process/service, or retained native core behavior.
- Do not run a collection of unrelated donor applications as the customer-facing product. The final runtime must remain a cohesive Rifad system.
- Record rejected candidates and reasons so investigations are not repeated.

The detailed workflow is defined in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## 5. Data and offline

- Local-first is a product requirement, not an optimization.
- Every durable offline command needs stable identity and idempotent replay semantics where replay can occur.
- Sales/payment duplication must be prevented by design.
- The selected Primary Core/local database may own local business truth when it passes the production evidence. Do not create a duplicate Rifad database merely to satisfy an old architecture assumption.
- Cloud synchronization is a separate concern. A sync provider must not redefine sale/payment semantics merely because it transports them.
- Never make a finalized local sale depend on a live cloud connection unless a specific regulated/payment operation requires it.

## 6. Money and fiscal

- Monetary representation and rounding must be exact, explicit and proven against the selected engine's real behavior.
- Never introduce floating-point business authority casually.
- If a Primary Core already provides a mature money/tax/accounting engine, evaluate and retain it when evidence supports it rather than duplicating it automatically.
- ZATCA is a core Saudi product responsibility. It may attach to the selected Primary Core through direct extension, facade, adapter or service according to the best proven design, but its state/retries/audit evidence remain explicit.
- Accounting may be native to the selected Primary Core or connected externally. The choice is evidence-driven.

## 7. Replaceability and coupling test

Replaceability is a risk-management tool, not a requirement that every internal class be swappable.

- Replacing a grafted LAN, printer, sync, payment-provider, KDS or fiscal integration should not require rewriting unrelated product surfaces when a practical isolation seam can prevent that coupling.
- The Rifad UI should not depend broadly on external SDK types or accidental provider IDs.
- A Primary Core replacement is acknowledged to be expensive. The goal is to protect product/UI and high-risk external seams enough to avoid unnecessary lock-in, not to pretend the entire business engine can be swapped cheaply.
- Do not sacrifice transaction integrity, performance or maintainability merely to satisfy theoretical replaceability.

## 8. Definition of done

A capability is done only when its applicable evidence exists:

- product/acceptance evidence;
- domain/unit tests or equivalent engine tests;
- integration tests;
- conformance/invariant tests where replacement or grafting is relevant;
- offline/retry tests where relevant;
- visual interaction tests for UI slices;
- hardware tests where relevant;
- migration tests where persistent data changes;
- security/recovery evidence where relevant;
- license/provenance record for adopted code;
- production evidence appropriate to the G8 risk lane.

A UI slice additionally requires manifest-linked visual, interaction, responsive, RTL and execution evidence for every ID it marks implemented or verified.

## 9. Scope discipline

- Do not repair an entire external project merely to obtain one feature unless that project is itself being evaluated as the Primary Core.
- Do not add infrastructure because it is fashionable.
- Do not add adapters/facades merely to conform to a pattern.
- Do not create a second implementation stack without a concrete capability need.
- Prefer replacing a weak graft/integration over years of compensating patches.
- Prefer a mature, tested engine over bespoke reimplementation when the mature engine fits Rifad better.

## 10. Execution continuity

- Every meaningful implementation slice or core-selection decision must leave a repository record of what changed, why it was done, what evidence exists, what remains and the next dependency-safe step.
- `AI_PROJECT_ENTRYPOINT.md` is the mandatory continuity entrypoint for every fresh session and must stay aligned with major strategic state.
- `docs/implementation/CURRENT_EXECUTION_STATUS.md` is the rolling execution checkpoint while a map item is in progress; capability-specific plans/evidence may link from it.
- Core-selection simulation/scorecards and graft decisions must remain in the repository, not only in chat history.
- When a map item reaches PASS, reconcile the canonical/current-state documents that describe product reality, including the UI manifest/field register/progress/architecture decisions/final map/handoff where applicable.
- A new AI, coding agent or human reading the repository should be able to recover the same current project state and rationale without relying on a previous conversation.
- Use an external coding agent such as Codex only for a scoped task with the exact objective, authority files, allowed scope, tests and stop conditions. Do not ask it to “continue the project” broadly.
