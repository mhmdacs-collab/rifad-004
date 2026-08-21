# Donor Selection Policy

Rifad uses open-source and observable products as sources of proven ideas, algorithms, state machines, protocols, tests and — when licensing permits — code.

## Selection workflow

For each capability:

1. Define the Rifad contract from product behavior.
2. Search broadly across languages and frameworks.
3. Shortlist several real implementations.
4. Inspect source code, tests, open issues, dependencies and maintenance history.
5. Verify license compatibility and dependency licenses.
6. Extract the smallest valuable logic slice.
7. Prove it in isolation against Rifad contract tests.
8. Adopt, port or reject.

## Composition boundary

Donor projects never compose each other on Rifad's behalf.

If donor A solves A4/80 mm printing and donor B solves 58 mm layout, Rifad does not patch donor B into donor A. Rifad extracts or ports the selected slices into its own printing implementation behind its own contract. The same rule applies to synchronization, payments, ZATCA, migrations, hardware and every other capability.

This prevents the first donor from becoming the accidental product core.

## Acceptance questions

A donor candidate should answer yes to most of these:

- Does it solve the exact capability we need?
- Is its state model understandable?
- Are failure/retry cases explicit?
- Are tests available or can behavior be reproduced reliably?
- Is the useful logic isolated enough to extract?
- Can it be hidden behind a Rifad contract?
- Can we replace it later without a product rewrite?
- Is the license suitable for the chosen reuse mode?
- Does it reduce work immediately instead of creating a maintenance project?

## Rejection triggers

Reject or downgrade a donor when:

- using one feature requires adopting its whole application;
- extraction requires repairing broad unrelated areas;
- hidden global state makes isolation unsafe;
- license obligations conflict with Rifad's intended distribution model;
- critical logic has no tests and is difficult to characterize;
- its schema would have to become Rifad's public contract;
- the donor is effectively abandoned and the slice is too coupled to maintain locally;
- a simpler implementation exists elsewhere.

## Language policy

The best logic may come from Java, Kotlin, C++, C#, Python, PHP, Go, Rust or JavaScript/TypeScript.

We distinguish **logic reuse** from **runtime reuse**:

- If importing the runtime/library is clean and valuable, use an adapter.
- If runtime adoption creates coupling, port the behavior to Rifad's implementation language and preserve test vectors/invariants.

## Provenance

For every adopted donor slice record:

- repository/source;
- exact commit/tag/version inspected;
- license;
- files/algorithms/tests used as sources;
- reuse mode: direct / port / behavioral reference;
- local Rifad module receiving the capability;
- deviations made during adaptation.

Also record:

- the Rifad contract/version used for acceptance;
- commands used to execute donor tests or reproduce behavior;
- failure cases characterized locally;
- competing candidates considered and why they were rejected;
- the Rifad tests proving replaceability and conformance.

## Adoption gate

A candidate is not adopted merely because its demo works. The receiving Rifad module must exist, donor types must be contained, required notices must be present, and the applicable contract/conformance/offline/hardware/fiscal tests must pass.

## Maintenance rule

Rifad never follows donor upstream blindly.

When an upstream changes:

1. inspect the diff;
2. identify whether it fixes/improves a capability Rifad actually uses;
3. port/cherry-pick/reimplement only the relevant change;
4. run Rifad tests;
5. release through Rifad's own lifecycle.

A donor update is input to Rifad, not a command to Rifad.
