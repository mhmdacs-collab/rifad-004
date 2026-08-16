# Printing Capability Adoption Example

## Status

This is an architecture and adoption example, not evidence that a named donor supports a particular printer. Actual donor claims require source/test execution and a completed donor capability record.

## Scenario

Rifad needs:

- A4 invoices/reports;
- 80 mm thermal receipts;
- 58 mm thermal receipts;
- Windows spooler, USB, Bluetooth and network/Wi-Fi printing;
- Arabic, QR, logos, cut and cash-drawer capabilities where supported;
- offline queue/restart/retry behavior without uncontrolled duplicates.

Suppose candidate A (for example ERPNext after verification) proves useful A4 and 80 mm behavior, candidate B proves 58 mm wrapping/layout, and candidate C provides a reliable Bluetooth or ESC/POS transport.

The incorrect approach is to patch B and C into candidate A and treat the modified candidate as Rifad.

The Rifad approach is:

```text
Candidate A: A4/80 layout evidence ─┐
Candidate B: 58 layout evidence ────┼─> Rifad printing implementations
Candidate C: transport evidence ────┘              │
                                                   ▼
                                      Rifad Printing Contract
                                                   │
                                                   ▼
                                             POS / KDS / Back Office
```

## Separate the capability dimensions

Printing must not be represented as one large “printer integration.”

1. **Document model:** receipt, tax invoice, kitchen ticket, report.
2. **Layout/media profile:** A4, receipt 80 mm, receipt 58 mm, printable dots/columns/margins.
3. **Renderer:** PDF, ESC/POS text/raster, image/raster, OS-native document.
4. **Transport:** Windows spooler, USB, Bluetooth, TCP raw/9100, IPP or vendor SDK.
5. **Device capabilities:** cut, drawer pulse, QR, code page, raster image, status reporting.
6. **Durable job control:** identity, queue, attempts, acknowledgment, ambiguous delivery and reprint.

Wi-Fi is normally a network connection path, not a paper/layout type. A 58 mm device may use USB, Bluetooth or network transport; the media profile must remain independent.

## Target Rifad boundaries

```text
contracts/printing
  PrintJob / PrintResult / PrinterCapability / PrinterStatus

core/printing
  durable queue / stable identity / attempt policy / audit / reprint semantics

adapters/printing-renderers
  pdf / escpos / raster

adapters/printing-transports
  windows-spooler / usb / bluetooth / tcp / ipp

adapters/printing-profiles
  a4 / 80mm / 58mm / tested device quirks

tests/printing
  contract / layout fixtures / transport simulators / hardware matrix
```

The final directory names may evolve, but these responsibilities must remain independently testable and replaceable.

## Illustrative contract shape

```ts
type MediaProfileId = "a4" | "receipt-80mm" | "receipt-58mm";

type PrintJob = {
  id: string;                // stable Rifad identity
  document: PrintDocument;   // Rifad document model
  mediaProfileId: MediaProfileId;
  printerId: string;
  copies: number;
  purpose: "customer-receipt" | "tax-invoice" | "kitchen" | "report";
};

type PrintResult =
  | { status: "accepted"; jobId: string }
  | { status: "rejected"; jobId: string; error: PrintError };

interface PrintingContract {
  submit(job: PrintJob): Promise<PrintResult>;
  getStatus(jobId: string): Promise<PrintJobStatus>;
  reprint(jobId: string, reason: string): Promise<PrintResult>;
}
```

Vendor SDK types and donor document models do not cross this boundary.

## Delivery state and duplicate safety

A realistic lifecycle distinguishes confirmed failure from ambiguous delivery:

```text
queued -> rendering -> dispatching -> acknowledged
                      |
                      +-> failed
                      +-> delivery-unknown
```

If a network connection drops after bytes were sent, the receipt may have printed even when no acknowledgment returned. Blind automatic retry can create duplicates. Rifad must define per-purpose retry/reprint policy, preserve the stable job ID and audit operator-triggered reprints.

Cash-drawer pulses are separate device commands with their own authorization and audit semantics; they must not be an accidental side effect of retrying an unrelated document.

## Donor adoption slices

| Needed slice | Candidate evidence | Rifad destination | Acceptance proof |
| --- | --- | --- | --- |
| A4 layout | template/PDF implementation and fixtures | PDF renderer | visual/PDF fixtures and Arabic/QR cases |
| 80 mm layout | column/wrap/ESC-POS logic | 80 mm profile + renderer | golden byte/raster fixtures on tested widths |
| 58 mm layout | width/wrap logic from another candidate | 58 mm profile | long Arabic names, totals and QR fit |
| Windows printing | spooler integration | Windows transport | queue/status/error/restart tests |
| USB/Bluetooth/network | narrow transport libraries | transport adapters | disconnect/reconnect and device matrix |

Each row may select a different donor and reuse mode. No row gives a donor ownership of the full printing domain.

## Supported capability matrix

Rifad should publish support as evidence, not as “works with any printer.”

Track at least:

- protocol/transport;
- operating system/runtime;
- manufacturer/model or standards class;
- paper widths and printable dots;
- Arabic/text/raster behavior;
- QR/logo/cut/drawer support;
- status feedback quality;
- tested driver/firmware version;
- known limitations.

Generic Windows-driver support, generic ESC/POS compatibility and specifically certified devices are different claims.

## Required tests

- A4, 80 mm and 58 mm golden layout fixtures.
- Arabic RTL/mixed-number text, long item names and modifiers.
- tax totals, rounding presentation and ZATCA QR placement where applicable.
- logo/image scaling and printer-code-page fallback.
- cut/drawer capability detection and authorization.
- Windows spooler stopped/restarted and USB removal.
- network timeout before send, during send and after possible delivery.
- Bluetooth disconnect/reconnect.
- application crash/restart with queued jobs.
- duplicate submit with the same job ID.
- explicit, audited reprint after `delivery-unknown`.
- real hardware runs for every certified combination.

## Definition of done

Printing is a Rifad capability when the UI only sees the Rifad contract, donor details are isolated, the queue and audit state belong to Rifad, provenance is recorded, the tested support matrix is published, and any renderer/transport/profile can be replaced without changing sales or KDS workflows.
