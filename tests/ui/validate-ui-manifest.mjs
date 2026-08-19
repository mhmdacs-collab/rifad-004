import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const manifestPath = path.join(root, "docs/ui/UI_EXECUTION_MANIFEST.json");
const tokenPath = path.join(root, "docs/ui/RIFAD_DESIGN_TOKENS.json");
const researchPath = path.join(
  root,
  "docs/research/loyverse/Loyverse_Phase_1_UI_UX_Functional_Analysis_AR.md",
);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const list = (value) => (Array.isArray(value) ? value : []);
const fail = (message) => {
  throw new Error(message);
};

const manifest = readJson(manifestPath);
const tokens = readJson(tokenPath);
const research = fs.readFileSync(researchPath, "utf8");

const surfaces = list(manifest.surfaces);
const screens = surfaces.flatMap((surface) => list(surface.screens));
const actions = list(manifest.actions);
const flows = list(manifest.flows);
const allEntries = [...screens, ...actions, ...flows];
const allowedStatuses = new Set([
  "discovered",
  "mapped",
  "specified",
  "ready",
  "implemented",
  "verified",
]);

const byId = new Map();
for (const entry of allEntries) {
  if (!entry.id) fail("Manifest entry without an ID.");
  if (byId.has(entry.id)) fail(`Duplicate manifest ID: ${entry.id}`);
  byId.set(entry.id, entry);
}

for (const entry of [...screens, ...flows]) {
  if (!allowedStatuses.has(entry.status)) {
    fail(`Invalid readiness status on ${entry.id}: ${entry.status}`);
  }
  if (entry.status !== "discovered" && list(entry.evidence?.sections).length === 0) {
    fail(`${entry.id} is ${entry.status} without source evidence sections.`);
  }
  if (["ready", "implemented", "verified"].includes(entry.status) && entry.evidence?.confidence === "inferred") {
    fail(`${entry.id} cannot be ${entry.status} with inferred evidence.`);
  }
}

const screenIds = new Set(screens.map((screen) => screen.id));
const actionIds = new Set(actions.map((action) => action.id));
const flowIds = new Set(flows.map((flow) => flow.id));

for (const screen of screens) {
  for (const actionId of list(screen.actionIds)) {
    if (!actionIds.has(actionId)) fail(`${screen.id} references unknown action ${actionId}`);
  }
  for (const flowId of list(screen.implementationAllowedByFlows)) {
    if (!flowIds.has(flowId)) fail(`${screen.id} references unknown flow ${flowId}`);
  }
  if (screen.implementationAllowed === true && !["ready", "implemented", "verified"].includes(screen.status)) {
    fail(`${screen.id} permits implementation while status is ${screen.status}`);
  }
  if (screen.status === "specified") {
    if (list(screen.states).length === 0) fail(`${screen.id} is specified without states.`);
    if (list(screen.actionIds).length === 0) fail(`${screen.id} is specified without actions.`);
  }
}

for (const action of actions) {
  if (!action.contract) fail(`${action.id} has no Rifad contract.`);
  if (!action.contractStatus) fail(`${action.id} has no contract status.`);
  for (const screenId of list(action.screens)) {
    if (!screenIds.has(screenId)) fail(`${action.id} references unknown screen ${screenId}`);
  }
}

for (const flow of flows) {
  for (const step of list(flow.steps)) {
    if (!screenIds.has(step.screenId)) fail(`${flow.id} references unknown screen ${step.screenId}`);
    if (!actionIds.has(step.actionId)) fail(`${flow.id} references unknown action ${step.actionId}`);
    const screen = byId.get(step.screenId);
    if (!list(screen.implementationAllowedByFlows).includes(flow.id)) {
      fail(`${flow.id} uses ${step.screenId} without explicit screen permission.`);
    }
    // A ready flow is intentionally allowed to use a declared subset of a
    // screen's actions. Validate the direction that matters for the hard gate:
    // every flow step must be an action owned by that screen. Do not require
    // every other visible action on a shared screen to appear in every flow.
    if (!list(screen.actionIds).includes(step.actionId)) {
      fail(`${flow.id} uses ${step.actionId} on ${step.screenId} but the screen does not declare that action.`);
    }
  }
  if (["ready", "implemented", "verified"].includes(flow.status)) {
    if (list(flow.steps).length === 0) fail(`${flow.id} is executable without steps.`);
    if (list(flow.acceptanceCriteria).length === 0) fail(`${flow.id} is executable without acceptance criteria.`);
    if (list(flow.nonGoals).length === 0) fail(`${flow.id} is executable without non-goals.`);
  }
}

const readyFromGate = new Set(list(manifest.implementationGate?.readyFlows));
const readyFromFlows = new Set(
  flows
    .filter((flow) => ["ready", "implemented", "verified"].includes(flow.status))
    .map((flow) => flow.id),
);
for (const id of readyFromGate) {
  if (!readyFromFlows.has(id)) fail(`Implementation gate lists a non-executable flow ${id}`);
}
for (const id of readyFromFlows) {
  if (!readyFromGate.has(id)) fail(`Ready flow ${id} is missing from the implementation gate.`);
}

const evidenceSections = [
  ...surfaces.flatMap((surface) => list(surface.sourceSections)),
  ...screens.flatMap((screen) => list(screen.evidence?.sections)),
  ...flows.flatMap((flow) => list(flow.evidence?.sections)),
];

const ownerDecisionRef = /^([A-Z0-9_\-]+\.md)(?:\s+§.*)?$/;
for (const section of evidenceSections) {
  if (research.includes(section)) continue;
  const decisionMatch = section.match(ownerDecisionRef);
  if (decisionMatch) {
    const decisionPath = path.join(root, "docs", "architecture", decisionMatch[1]);
    if (fs.existsSync(decisionPath) && fs.statSync(decisionPath).size > 0) continue;
  }
  fail(`Evidence section is missing from Loyverse research or an owner-approved architecture decision: ${section}`);
}

if (!tokens.version || !tokens.status) fail("Rifad design tokens require version and status.");

console.log(
  `UI manifest valid: ${surfaces.length} surfaces, ${screens.length} screens, ` +
    `${actions.length} actions, ${flows.length} flows, ${readyFromFlows.size} executable flow.`,
);
