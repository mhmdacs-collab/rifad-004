# Rifad Core Lab

Status: **BOOTSTRAP / PRIMARY CORE DISCOVERY LAB**

This repository is the clean engineering lab for selecting the strongest practical foundation for Rifad before production implementation resumes.

## Product north star

Rifad's first product horizon is **100% functional/workflow parity with the adopted observable Loyverse baseline**, then systematic differentiation beyond it.

The target covers the adopted observable behavior across:

- POS;
- Back Office;
- Dashboard;
- KDS;
- Customer Display;
- restaurant/table/open-order behavior;
- permissions, errors, offline/recovery and operational workflows where part of the baseline.

Rifad keeps its own visual identity and Saudi-specific requirements. Loyverse is a functional/workflow baseline, not a code source and not an assumption about proprietary internals.

## What this lab is for

The current strategic task is **Primary Core Candidate Discovery & Architecture Simulation**.

We are not trying to maximize the amount of code written from zero. We are trying to find the strongest foundation we can legally control, test, modify and evolve.

A mature open-source POS, ERP, accounting engine or adjacent system may become Rifad's Primary Core. If that core is weak in a bounded capability such as LAN, Tables, KDS, Printing, Sync or another area, Rifad may reuse, port, reimplement or graft a stronger proven implementation from elsewhere.

## Start here

Every new AI/Codex/human technical session reads these files in order:

1. `AI_PROJECT_ENTRYPOINT.md`
2. `PROJECT_RULES.md`
3. `docs/product/RIFAD_PRODUCT_TARGET.md`
4. `docs/product/LOYVERSE_FUNCTIONAL_PARITY_TARGET.md`
5. `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`
6. `docs/architecture/RIFAD_BUILD_METHOD.md`
7. current task evidence under `docs/core-selection/`

Do not ask the product owner to retell project history that is recoverable from repository authority.

## Current phase

No Primary Core is selected yet.

Do not begin production implementation merely because a candidate builds or has many features. Candidates must be inspected, executed where practical, simulated against Rifad's full near-term horizon, scored, and compared before adoption.

## Historical source repository

`mhmdacs-collab/rifad-004` is preserved as a source of product discoveries, UI behavior, tests and technical experiments. It is evidence, not automatic architecture authority for the Core Lab.

The import manifest in `docs/REFERENCE_IMPORT_MANIFEST.md` identifies which historical materials are useful and how they should be classified.
