# Rifad Applications

Planned product surfaces:

- `pos/` — cashier/waiter POS application.
- `backoffice/` — management and configuration.
- `dashboard/` — owner/manager operational summary.
- `kds/` — kitchen display.
- `cds/` — customer display.

All applications consume Rifad contracts. They do not import donor application code directly and do not own business truth.

The UI phase target is the complete interactive product shell with mock adapters.

Implementation order and scope are controlled by `docs/ui/UI_EXECUTION_MANIFEST.json`. The first authorized code milestone is the bounded `POS-FLOW-001` vertical slice, not the entire screen-family list at once.
