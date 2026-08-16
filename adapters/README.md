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