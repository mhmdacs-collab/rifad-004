# Rifad Applications

Planned product surfaces:

- `pos/` — executable React/Vite cashier POS application. The first implemented slice is `POS-FLOW-001`.
- `backoffice/` — management and configuration.
- `dashboard/` — owner/manager operational summary.
- `kds/` — kitchen display.
- `cds/` — customer display.

All applications consume Rifad contracts. They do not import donor application code directly and do not own business truth.

The UI phase target is the complete interactive product shell with mock adapters.

Implementation order and scope are controlled by `docs/ui/UI_EXECUTION_MANIFEST.json`. The first authorized code milestone is the bounded `POS-FLOW-001` vertical slice, not the entire screen-family list at once.

## Run the POS

```bash
cd apps/pos
npm install
npm run dev
```

The bundled mock adapter accepts the prefilled device credentials and employee PIN `1234`. It persists the current ticket and completed receipt in browser local storage so the first flow can be exercised without a backend.
