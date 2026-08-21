# Rifad Capability Gates Implementation Plan

> **For agentic workers:** This plan is a documentation-only architecture change. Runtime implementation is not authorized by this plan.

**Goal:** Make the owner-approved G0–G8 maturity gates, Mock Ceiling, Primary Core selection and Capability Grafting strategy discoverable and binding without changing runtime code or MAP dependency order.

**Architecture:** The Final Implementation Map continues to define what/when. `RIFAD_BUILD_METHOD.md` defines how work matures. `PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md` defines how implementation foundations are sourced: evaluate a strong whole core when appropriate, then retain it where strong and graft/port/reimplement better capability slices where weak. `CAPABILITY_ADOPTION_WORKFLOW.md` supplies the detailed evaluation workflow.

**Tech Stack:** Markdown repository documentation only.

**Spec:** `docs/superpowers/specs/2026-08-21-rifad-capability-gates-design.md`

## Global Constraints

- Do not change runtime code.
- Do not start MAP-02.
- Do not alter the dependency order in `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.
- Do not select a Primary Core as a side effect of this documentation change.
- Do not define the later Codex/session-start operating protocol in this change.
- Preserve useful existing Rifad work as evidence, not automatic production authority.
- Do not require adapters as architecture ceremony; use them only when they create real isolation/translation/replacement value.

---

### Task 1: Canonical sourcing strategy

**Files:**
- Create: `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`

- [x] Record owner/AI responsibility split.
- [x] Allow evidence-driven whole-core adoption.
- [x] Require architecture simulation before core selection.
- [x] Define capability grafting for LAN/Tables/KDS/Printing/Sync/etc.
- [x] Define adapters as optional tools, not doctrine.
- [x] Preserve Rifad ownership of product, UX, quality and Saudi requirements.

### Task 2: Reconcile G0–G8 build method

**Files:**
- Modify: `docs/architecture/RIFAD_BUILD_METHOD.md`

- [x] Keep maturity dimensions and Mock Ceiling.
- [x] Expand G4 into whole-core scan + bounded capability source scan.
- [x] Add architecture simulation before adoption.
- [x] Expand G5 dispositions for core and graft decisions.
- [x] Allow direct core modification, native extension, facade, adapter or service at G6.
- [x] Keep G7/G8 evidence requirements.

### Task 3: Bind strategy into repository authority

**Files:**
- Modify: `PROJECT_RULES.md`
- Modify: `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`

- [x] Remove the assumption that every core capability must be Rifad-authored from zero.
- [x] Remove slice-only/adapter-only interpretation.
- [x] Allow an explicitly selected mature project to become the Primary Core.
- [x] Preserve evidence, legal, failure and production gates.
- [x] Define capability grafting once the core is selected.

### Task 4: Reconcile design history

**Files:**
- Modify: `docs/superpowers/specs/2026-08-21-rifad-capability-gates-design.md`
- Modify: this plan.

- [x] Remove stale statements that could teach a future agent the old slice-only interpretation.
- [x] Record the owner-approved Primary Core + Capability Grafting correction.

### Task 5: Verification

- [ ] Compare the branch to base `16958648b9f4e1db12ab121b74ae50bfd741cd85`.
- [ ] Confirm only documentation files changed.
- [ ] Confirm MAP dependency order was not modified.
- [ ] Confirm PR #4 remains untouched, Draft, Open and Unmerged.
- [ ] Report branch HEAD and changed files.
