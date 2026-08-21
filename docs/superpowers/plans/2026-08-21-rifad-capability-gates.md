# Rifad Capability Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the owner-approved G0–G8 capability maturity gates and Mock Ceiling a discoverable, binding Rifad repository rule without changing runtime code or the dependency order.

**Architecture:** Add one canonical build-method document, then link it from the binding project rules and the existing adoption workflow. The final implementation map remains the authority for what/when; the new build method governs how each substantial capability is promoted from discovery to production.

**Tech Stack:** Markdown repository documentation only.

**Spec:** `docs/superpowers/specs/2026-08-21-rifad-capability-gates-design.md`

## Global Constraints

- Do not change runtime code.
- Do not start MAP-02.
- Do not alter the dependency order in `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.
- Do not define the later Codex/session-start operating protocol in this change.
- Preserve existing donor/adoption rules and make the new gates additive and consistent with them.

---

### Task 1: Add the canonical Rifad build method

**Files:**
- Create: `docs/architecture/RIFAD_BUILD_METHOD.md`

**Interfaces:**
- Consumes: `PROJECT_RULES.md`, `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`, `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.
- Produces: canonical G0–G8 gate definitions, Mock Ceiling, maturity dimensions and promotion rules.

- [ ] **Step 1:** Write the canonical document from the approved design.
- [ ] **Step 2:** Verify it distinguishes the final map's what/when responsibility from the build method's how responsibility.
- [ ] **Step 3:** Verify G3 requires a stop before substantial engine work and G4 requires real multi-candidate evidence for substantial capabilities.
- [ ] **Step 4:** Verify no section claims current mocks or staging adapters are production-ready.
- [ ] **Step 5:** Commit the document.

### Task 2: Bind the method into repository authority

**Files:**
- Modify: `PROJECT_RULES.md`
- Modify: `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`

**Interfaces:**
- Consumes: `docs/architecture/RIFAD_BUILD_METHOD.md`.
- Produces: explicit repository-level requirement to follow G0–G8 and trigger the adoption workflow after the Mock Ceiling.

- [ ] **Step 1:** Add a concise capability-gates section to `PROJECT_RULES.md`.
- [ ] **Step 2:** State that green tests or existing code do not by themselves promote a capability to production.
- [ ] **Step 3:** Add a short mapping in the adoption workflow showing that donor adoption is entered from G4 and returns evidence into G5–G8.
- [ ] **Step 4:** Preserve all existing donor licensing, provenance and replaceability requirements.
- [ ] **Step 5:** Commit the authority-document updates.

### Task 3: Verify documentation consistency

**Files:**
- Read/verify: `docs/architecture/RIFAD_BUILD_METHOD.md`
- Read/verify: `PROJECT_RULES.md`
- Read/verify: `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`
- Read/verify: `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`

**Interfaces:**
- Produces: a documentation-only branch with no runtime or map-order changes.

- [ ] **Step 1:** Compare the branch to base `16958648b9f4e1db12ab121b74ae50bfd741cd85`.
- [ ] **Step 2:** Confirm only documentation files changed.
- [ ] **Step 3:** Search the changed text for contradictory production claims or a change to MAP sequencing.
- [ ] **Step 4:** Confirm the branch remains isolated from PR #4 and no merge occurred.
- [ ] **Step 5:** Report the resulting branch HEAD and changed files.
