# UI Execution Manifest Schema and Gate

## Binding artifact

`UI_EXECUTION_MANIFEST.json` is the implementation inventory for Rifad product surfaces. It converts research into stable screen, action, state and flow IDs.

The manifest does not replace the source research. It points to evidence sections and narrows what implementation is allowed to claim.

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
- visual authority/approved visual decision IDs.

## Required action fields

- stable ID and visible trigger;
- owning screen(s);
- Rifad contract and draft/frozen version;
- input/output/error shape reference;
- authorization requirement;
- offline classification: local / queued / disabled / connected-only;
- idempotency requirement for durable commands;
- visible pending/success/failure result.

Pure UI navigation or presentation actions may use `uiOnly: true`; they must not hide a business mutation.

## Required flow fields

- stable ID and source evidence;
- allowed entry points;
- ordered steps with screen/action IDs;
- required cross-surface effects;
- online/offline variants;
- explicit non-goals;
- end-to-end acceptance criteria.

## Evidence confidence

- `documented`: supported directly by the research and cited sources.
- `observed`: based on recorded interface evidence that may vary by version.
- `inferred`: not enough for `ready`; requires product confirmation or additional evidence.

An `inferred` requirement cannot silently become implementation behavior.

## Change control

Any implementation PR touching visible behavior must list the affected screen/action/flow IDs. If behavior changes, the manifest changes in the same PR before or with the code.
