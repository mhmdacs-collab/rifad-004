# Rifad Applications

Current/planned product surfaces:

- `pos/` — executable React/Vite cashier POS application. Current executable flows include retail sale, restaurant local-service staging and tablet sale-page configuration.
- `backoffice/` — executable React/Vite management application. The first bounded slice is `BO-FLOW-002` for catalog item list + add/edit.
- `dashboard/` — owner/manager operational summary; mapped, not implemented.
- `kds/` — kitchen display; mapped, not implemented.
- `cds/` — customer display; mapped, not implemented.

All applications consume Rifad contracts. They do not import donor application code directly and do not own another module's private business state.

The UI phase target is the complete interactive product shell with replaceable adapters while durable field meaning is discovered before production database freeze.

Implementation order and scope are controlled by `docs/ui/UI_EXECUTION_MANIFEST.json`. A mapped screen family is not automatic authorization to implement the whole family.

## Run the POS

```bash
cd apps/pos
npm install
npm run dev
```

The current POS runtime remains staging/mock-backed for unimplemented production capabilities.

## Run Back Office

```bash
cd apps/backoffice
npm install
npm run dev
```

`BO-FLOW-002` currently exposes only the authorized Items destination. It supports a bounded item list/editor over the Rifad-owned catalog contract: name, description, existing category selection, fixed base price, SKU, barcode and available-for-sale.

The current `BrowserCatalogAdapter` is a **same-origin/local staging transport**, not LAN/cloud synchronization. The important product proof is that Back Office and POS consume one Rifad catalog meaning/identity rather than each inventing its own product schema. A later same-device host, LAN adapter or cloud Sync adapter may replace transport without changing the public catalog contract.
