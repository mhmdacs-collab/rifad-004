# Rifad Primary Core Scorecard

Status: **ACTIVE EVIDENCE SCORECARD**

The scorecard compares serious Primary Core candidates. It does not replace hard blockers, runtime evidence or engineering judgment.

## Hard blockers

A candidate cannot be selected while an unresolved blocker exists in any of these areas:

- incompatible license/redistribution/modification rights;
- fundamentally unsafe money/transaction behavior that is impractical to repair;
- no viable path to Rifad's required local/offline operation;
- project cannot be built/maintained realistically;
- architecture prevents required extension/grafting without making the system worse than alternatives;
- data/operational topology creates a known critical dead end.

## Weighted score — 100 points

| Dimension | Weight | What strong evidence looks like |
| --- | ---: | --- |
| Money correctness + transaction integrity | 15 | exact/explicit money, deterministic rounding, atomic transactions, rollback, no duplicate financial facts |
| Reliability + durability | 15 | restart/crash recovery, corruption/error behavior, stable lifecycle, mature migrations |
| Loyverse-parity coverage | 15 | large share of adopted POS/BO/Dashboard/KDS/CDS/restaurant workflows can be retained or reached without structural fighting |
| Local/offline capability | 10 | real local operation, durable offline work, replay/recovery path, no unnecessary cloud dependency |
| Extensibility + API + database evolution | 10 | clean extension seams, inspectable schema, practical migrations, ability to graft without destabilizing the core |
| Restaurant / Tables / KDS / LAN fit | 8 | mature order/table lifecycle or clean graft path; concurrency/device topology is credible |
| Inventory / accounting / tax engine value | 7 | strong stock movements, financial/tax semantics where useful; does not force duplicate engines |
| Branch / device / sync topology | 5 | practical identity/isolation model and clear future synchronization attachment |
| Hardware / printing / payments seams | 5 | proven or cleanly extensible device/protocol boundaries |
| ZATCA attachment feasibility | 3 | fiscal extension can be added without corrupting sale truth or creating duplicate lifecycle authority |
| License / maintenance / operational control | 7 | controllable deployment, healthy maintenance, acceptable dependencies, predictable cost and redistribution obligations |
| **Total** | **100** | |

## Scoring rules

For each dimension record:

- score earned;
- confidence: `LOW | MEDIUM | HIGH`;
- evidence links;
- unknowns;
- highest-risk assumption.

Do not award full points from feature-list claims alone.

### Confidence penalty

A high numerical score with mostly LOW-confidence evidence is not a selection result. The candidate must move through source inspection/runtime simulation before promotion.

## Required companion classifications

For every serious candidate, classify major capabilities as:

- `KEEP`
- `MODIFY`
- `REPLACE`
- `GRAFT`
- `N/A`

This exposes adaptation burden that one weighted total can hide.

## Suggested promotion thresholds

These are research filters, not automatic adoption rules:

- **90–100:** leading candidate; eligible for deepest trial if no hard blocker.
- **80–89:** strong contender; deep trial only if it has a plausible path to close the leader gap or the leader fails a hard gate.
- **70–79:** hold as fallback/control unless strategically unique.
- **<70:** normally reject as Primary Core; may still be a useful capability source.

A lower-scoring project may still be the best source for one grafted capability.

## Selection rule

The final decision is not “highest score wins”. It is:

> Which candidate gives Rifad the strongest controllable foundation after accounting for its native strengths, required modifications, planned grafts, failure risk, licensing and long-term maintenance?
