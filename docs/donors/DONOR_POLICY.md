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

## Maintenance rule

Rifad never follows donor upstream blindly.

When an upstream changes:

1. inspect the diff;
2. identify whether it fixes/improves a capability Rifad actually uses;
3. port/cherry-pick/reimplement only the relevant change;
4. run Rifad tests;
5. release through Rifad's own lifecycle.

A donor update is input to Rifad, not a command to Rifad.