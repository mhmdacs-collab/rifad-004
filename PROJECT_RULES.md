# Rifad Project Rules

These rules are binding for implementation work in this repository.

## 1. Product ownership

- Rifad is the product. No donor project owns Rifad's architecture.
- Loyverse is a functional/workflow and ergonomic reference, not a source-code dependency or Rifad's visual identity.
- FloCafe, Odoo, ERPNext and other projects may be donors only unless an explicit architecture decision says otherwise.
- Do not expose donor names, schemas or internal IDs through Rifad public contracts.

## 2. UI-first without UI business logic

- Build the complete user-facing surfaces first using mock adapters where backend logic is not ready.
- UI components may orchestrate interaction state only; business rules belong in domain modules.
- Every visible action must call a Rifad-owned contract, even while its implementation is mocked.
- A screen is not accepted if it looks or behaves like a generic website. Tablet interaction must feel application-native.
- No screen, action, state or flow may be implemented merely from a family name such as “sales workspace.” It must have a stable ID and evidence in `docs/ui/UI_EXECUTION_MANIFEST.json`.
- Implementation is allowed only for a complete `ready` screen or the explicitly permitted subset of a `ready` flow. Missing behavior is a manifest task, not an invitation to invent.
- Every implementation PR must name the affected screen/action/flow IDs and update the manifest when behavior changes.
- Loyverse is the primary functional/workflow reference. Rifad's design system is the visual authority.
- External visual references require an approved decision under `docs/ui/visual-decisions/`; a mention in discussion is not approval.

## 3. Puzzle architecture

Each capability must have:

1. a Rifad-owned contract,
2. one replaceable implementation/adapter,
3. isolated tests,
4. explicit data ownership,
5. no hidden cross-module database access.

Examples: sales, money, tables, shifts, inventory, loyalty, printing, LAN, synchronization, payments and ZATCA.

A module may not read or mutate another module's private tables. Cross-module interaction goes through contracts or versioned domain events.

## 4. Donor policy

Before adopting donor logic:

- inspect the real implementation, not only the README;
- inspect tests and failure cases;
- verify the license and dependency licenses;
- compare at least two credible implementations when the capability is substantial;
- prefer the smallest proven slice, not the full application;
- preserve required notices/provenance for copied code;
- if extraction requires broad repairs to the donor project, reject it and evaluate another source.

Language mismatch is not a blocker. Proven logic from Java, C++, Python, PHP or another language may be reimplemented in Rifad TypeScript when that is cleaner than importing its runtime.

### Donor composition boundary

- Never make donor A the integration base merely because it supplied the first capability.
- Never merge donor B into donor A and describe the combined donor codebase as Rifad.
- Compose selected slices only inside Rifad-owned contracts, core domains and adapters.
- Existing code is an accelerator and evidence source, not automatic authority.
- A public repository is not automatically reusable. License and dependency obligations must be verified before copying code.
- Record rejected candidates and the reason for rejection so the same investigation is not repeated.

The binding workflow is defined in `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`.

## 5. Data and offline

- Local-first is a product requirement, not an optimization.
- Every durable offline command needs stable identity and idempotent replay semantics.
- Sales/payment duplication must be prevented by design.
- Local database and cloud synchronization contracts belong to Rifad.
- Never make a finalized local sale depend on a live cloud connection unless a specific regulated/payment operation requires it.

## 6. Money and fiscal

- Monetary representation must be exact and defined by the Money contract.
- Never introduce floating-point business authority casually.
- ZATCA is a core Saudi fiscal domain with its own adapter boundary, state model, retries and audit evidence.
- Accounting integrations are adapters; they do not own finalized local POS truth.

## 7. Replaceability test

A module design fails if replacing its implementation requires rewriting unrelated screens or domains.

For example, replacing Tables must not require rewriting Sales, Inventory or the POS UI as long as the Tables contract remains compatible.

Likewise, replacing an ESC/POS renderer, Windows printer transport, synchronization engine or ZATCA client must not expose donor types or force unrelated product changes.

## 8. Definition of done

A capability is done only when its applicable evidence exists:

- contract tests,
- domain/unit tests,
- integration tests,
- offline/retry tests,
- visual interaction tests,
- hardware tests where relevant,
- migration tests where persistent data changes,
- license/provenance record for donor-derived code.

A UI slice additionally requires manifest-linked visual, interaction, responsive, RTL and contract evidence for every ID it marks implemented or verified.

## 9. Scope discipline

- Do not repair an entire donor application to obtain one feature.
- Do not add infrastructure because it is fashionable.
- Do not create a second implementation stack without a concrete capability need.
- Do not change architecture to solve a local module problem.
- Prefer deletion/replacement of a bad adapter over years of compensating patches.
