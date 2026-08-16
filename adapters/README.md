# Rifad Adapters

Adapters connect Rifad contracts to replaceable implementations and external systems.

Initial adapter families:

- printing
- payments
- LAN/device discovery
- synchronization
- ZATCA/fiscal
- accounting/ERP
- notifications
- hardware

An adapter may wrap a library, port logic from another language, or implement a protocol directly.

The rest of Rifad must not depend on the adapter's donor-specific schema, classes, SDK types or internal IDs.

One capability may require several independently replaceable adapters. Printing, for example, separates document rendering (PDF/ESC-POS/raster), media profiles (A4/80 mm/58 mm) and transport (Windows spooler/USB/Bluetooth/TCP/IPP). Paper width must not be coupled to connection type.

Adapters do not own durable business truth. Queue state, stable job identity, retry policy and ambiguous-delivery handling belong to the Rifad capability/core unless the contract explicitly assigns otherwise.
