# Rifad Core

Rifad Core contains business-domain implementations owned by Rifad.

Target domains include catalog, money, sales, orders, tables, shifts, inventory, branches, employees, permissions, customers and loyalty.

Core rules:

- each domain owns its private state;
- domains communicate through contracts/events, not private-table access;
- donor logic is adapted into the domain rather than exposing donor models;
- domain tests must run without product UI;
- a domain implementation must be replaceable while preserving its public contract.