# First Implementation Target

## Objective

Create the first executable Rifad application shell from a clean codebase. Do not import FloCafe/Odoo application structure.

## Scope

Start with the POS tablet/desktop shell because it establishes the design system and interaction grammar used by the other surfaces.

Required first slice:

- application shell/navigation;
- employee/PIN entry state;
- sales workspace;
- product/category grid;
- current ticket;
- item selection and quantity controls;
- modifier/variant interaction shell;
- customer attachment shell;
- open-ticket entry point;
- table/floor entry point;
- payment entry point;
- responsive RTL/LTR behavior;
- desktop keyboard/mouse usability;
- installable PWA shell;
- mock contracts/adapters for all actions.

## Non-goals

- no donor backend integration yet;
- no final SQLite schema yet;
- no cloud synchronization implementation yet;
- no Odoo/FloCafe binding;
- no generic admin-template UI;
- no business rules embedded in components.

## Acceptance

The slice passes only when it is visibly an operational POS application rather than a web dashboard and when every action is already routed through a Rifad contract that can later receive a real module implementation.