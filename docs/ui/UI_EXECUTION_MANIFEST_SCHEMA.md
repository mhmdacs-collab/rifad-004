# UI Execution Manifest Schema and Gate

Last updated: 2026-08-17

## Binding artifact

`UI_EXECUTION_MANIFEST.json` is the implementation inventory for Rifad product surfaces. It converts research into stable screen, action, state and flow IDs.

The manifest does not replace the source research. It points to evidence sections and narrows what implementation is allowed to claim.

For POS-facing terminology and durable UI-field traceability, use `POS_UI_NAMING_AND_FIELD_REGISTER.md` alongside the manifest.

## Stable IDs

- Screens: `<SURFACE>-SCREEN-###`, for example `POS-SCREEN-003`.
- Actions: `<DOMAIN>-ACTION-###`, for example `SALES-ACTION-002`.
- Flows: `<SURFACE>-FLOW-###`, for example `POS-FLOW-001`.
- States are stable kebab-case names scoped to a screen or flow.

IDs are never reused for a different meaning. Renamed/removed IDs remain recorded as deprecated aliases.

## Readiness states

| Status | Meaning | Implementation permission |
| --- | --- | --- |
| `discovered` | observed but not mapped to evidence | none |
| `mapped` | stable ID and source section exist | none |
| `specified` | states/actions/contracts are described | none until acceptance is approved |
| `ready` | scope and acceptance criteria are approved | implementation allowed only for the declared scope |
| `implemented` | code exists and is linked | verification only; scope changes still require manifest change |
| `verified` | required interaction/visual/contract tests pass | releasable within the declared product milestone |

## Hard implementation gate

Codex or a human developer may implement UI only when either:

1. the complete screen has status `ready`; or
2. a flow has status `ready` and explicitly lists the permitted subset of screen states/actions.

Everything else is evidence-gathering work. Missing actions, states, layout choices or error behavior must not be invented. Update the manifest first.

After a permitted scope advances to `implemented` or `verified`, it remains listed in `implementationGate.readyFlows`; the gate records the approved scope while the status records its current lifecycle stage.

## Required screen fields before `ready`

- stable ID and surface;
- source evidence document/sections and confidence;
- purpose and roles;
- entry and exit paths;
- responsive/RTL requirements;
- visible states including empty/loading/error/offline/denied where applicable;
- every visible action ID;
- each action's Rifad contract method or explicit UI-only classification;
- prerequisite feature/settings/permission;
- mock response and failure behavior;
- acceptance criteria and test IDs;
- visual authority/approved visual decision IDs;
- **for POS: every visible durable field/option/status introduced by the screen must be represented in `POS_UI_NAMING_AND_FIELD_REGISTER.md` as CURRENT, REQUIRED-GAP, RESERVED-INTEGRATION, DERIVED or UI-ONLY.**

## Required action fields

- stable ID and visible trigger;
- owning screen(s);
- Rifad contract and draft/frozen version;
- input/output/error shape reference;
- authorization requirement;
- offline classification: local / queued / disabled / connected-only;
- idempotency requirement for durable commands;
- visible pending/success/failure result;
- durable inputs/results must be traceable to the UI field register when they introduce new POS data requirements.

Pure UI navigation or presentation actions may use `uiOnly: true`; they must not hide a business mutation.

## Required flow fields

- stable ID and source evidence;
- allowed entry points;
- ordered steps with screen/action IDs;
- required cross-surface effects;
- online/offline variants;
- explicit non-goals;
- end-to-end acceptance criteria.

## UI-to-data traceability gate

UI-first does not mean data-later-without-traceability.

When a visible POS change introduces or implies durable information — for example SKU, barcode, order type, payment method, terminal reference, customer attribute, receipt fact, device preference or print status — the same change must:

1. add/update the field in `POS_UI_NAMING_AND_FIELD_REGISTER.md`;
2. classify whether it is current, missing, reserved, derived or UI-only;
3. update the domain contract/model immediately if the field is already authoritative business state;
4. record a persistence gap if the UI needs the field but the current mock/model does not yet preserve it.

Do not create database columns for purely presentational state such as pressed state, dialog visibility, animation state or decorative artwork.

## Evidence confidence

- `documented`: supported directly by the research and cited sources.
- `observed`: based on recorded interface evidence that may vary by version.
- `inferred`: not enough for `ready`; requires product confirmation or additional evidence.

An `inferred` requirement cannot silently become implementation behavior.

## Change control

Any implementation PR touching visible behavior must list the affected screen/action/flow IDs. If behavior changes, the manifest changes in the same PR before or with the code.

For POS changes, any new durable visible field or canonical cashier-facing label must also update `POS_UI_NAMING_AND_FIELD_REGISTER.md` in the same PR.

A mock hardware/payment UX must remain explicitly distinguishable from production hardware/provider support until real integration evidence exists.
