# Rifad PowerSync Field Proof — Windows 11 + Second Device

Status: **FIELD KIT READY — OWNER HARDWARE EXECUTION PENDING**

This kit closes the next PowerSync adoption gate with actual owner hardware rather than another CI-only simulation.

Target topology:

```text
Windows 11 Pro
  ├─ PostgreSQL source (isolated Docker proof volume)
  ├─ PowerSync Service (pinned tested image)
  ├─ Rifad proof write/API boundary
  ├─ native @powersync/node Windows client
  └─ browser client host
          │
          └── LAN ──> second device browser (currently Windows 8 compatibility device)
```

The Windows 8 machine is a **compatibility observation client**, not a production support promise. If its old browser/runtime cannot execute the current PowerSync web SDK, that is recorded as a Windows 8/browser limitation rather than automatically failing the synchronization engine.

## What the automatic Windows 11 proof checks

`native-proof.mjs` runs on the real Windows 11 machine and proves:

1. source/Back Office-shaped item change -> live PowerSync Service -> native Windows local SQLite;
2. native Windows local sale -> Rifad upload API -> PostgreSQL source;
3. disconnect -> local offline sale;
4. close/reopen the Windows SQLite database while the sale is pending;
5. stable queued operation identity after restart;
6. reconnect to the live service;
7. deliberate apply-then-HTTP-503 ambiguous acknowledgement;
8. automatic retry leaves exactly one source sale.

The browser page then allows a manual two-device test across the real LAN.

## Prerequisites on Windows 11 Pro

- Git;
- Node.js 22;
- Docker Desktop running with Docker Compose v2.20.3+;
- PowerShell opened **as Administrator** for the easiest LAN/firewall setup;
- both devices connected to the same LAN/Wi-Fi.

No database or PowerSync installation is required on the Windows 8 device. It only opens the browser test URL.

## Run

From the repository on branch `agent/pos-visual-pass-01`:

```powershell
git pull
Set-ExecutionPolicy -Scope Process Bypass
.\tests\sync-candidates\powersync-field\Start-RifadPowerSyncFieldTest.ps1 -Reset
```

The launcher:

- detects the Windows 11 LAN IP;
- clones the official PowerSync CLI at pinned commit `0eaf3629fb5f7e2ad9d0b70142004aaabab0a7a3` into an isolated local proof directory;
- pins the PowerSync service image already exercised by Rifad CI;
- starts isolated PostgreSQL + PowerSync containers;
- installs/builds the pinned Rifad field client dependencies;
- opens only proof ports `4173`, `8787`, `8080` on the Windows Private firewall profile when run as Administrator;
- starts the Rifad proof API and browser host;
- executes the native Windows 11 live-service proof automatically;
- prints the exact URL to open on the second device;
- opens the Windows 11 browser client automatically.

Expected successful native proof ending:

```text
RESULT PASS candidate=powersync scope=windows11-live-service-native-offline-restart
FIELD KIT READY
```

## Two-device manual test

On Windows 11, keep the launcher/services running.

On Windows 8, open the printed URL, for example:

```text
http://192.168.x.x:4173/?device=win8
```

Use the Windows 11 browser page and Windows 8 page together:

1. Press **إنشاء/تعديل صنف من المصدر**. The item should appear automatically in both clients.
2. Press **إنشاء بيع محلي** on one client. Use **قراءة حالة المصدر** on the other; the sale should appear without a manual Sync action.
3. For a real offline check on the second device, disconnect that device from the network **after the page has loaded**, create a local sale, then reconnect the network. The queued sale should upload automatically.
4. Do not use page refresh as the cold-offline-launch test yet. Installable PWA/service-worker cold launch is a separate remaining gate.

If the Windows 8 browser cannot start `@powersync/web`, capture the exact browser/version/error. Windows 11 native proof remains independently valid; the compatibility result determines whether Windows 8 is supportable, not whether modern Windows/tablet sync works.

## Stop

```powershell
.\tests\sync-candidates\powersync-field\Stop-RifadPowerSyncFieldTest.ps1
```

To also remove the isolated proof database volumes:

```powershell
.\tests\sync-candidates\powersync-field\Stop-RifadPowerSyncFieldTest.ps1 -RemoveData
```

## Safety / non-production statement

This is a bounded adoption proof only. It uses proof credentials, local HTTP/LAN transport and isolated Docker data. It is **not production authentication, TLS, secret management or cloud deployment** and must never be exposed to the public internet.
