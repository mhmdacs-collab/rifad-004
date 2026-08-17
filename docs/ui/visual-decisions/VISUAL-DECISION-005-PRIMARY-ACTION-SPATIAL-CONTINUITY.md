# VISUAL-DECISION-005 — Primary Action Spatial Continuity

Status: **current owner-directed POS interaction rule; final visual review pending**

Date: 2026-08-17

## Decision

Rifad POS minimizes cashier finger travel between consecutive transaction steps.

A repeated primary completion action should occupy the **same physical footer slot** when the operational surface changes, whenever the composition allows it.

For the current RTL POS composition:

- the right footer slot is secondary;
- the left footer slot is the primary completion slot;
- the primary slot should remain spatially stable across the normal transaction sequence.

Examples of actions that should inherit the same primary slot:

- **دفع**;
- **سداد**;
- **تم الدفع**;
- **إنشاء** / final **حفظ**;
- **بيع جديد**;
- final **تم** after a completed settlement.

When a secondary action exists, such as **حفظ**, **إلغاء** or **طباعة الإيصال**, it occupies the secondary slot rather than displacing the primary action.

If a screen has only one final action, the action should still prefer the established primary zone instead of expanding/repositioning in a way that forces unnecessary finger travel.

## Scroll relationship

This decision extends D-021:

- repeated content and optional fields absorb scrolling first;
- the footer/action zone remains reachable;
- dynamic validation must not move the keypad or final action;
- advancing from one transaction state to the next should not move the main completion target without a strong ergonomic reason.

## Customer-form density

The same touch-first principle allows density to change by device class before controls are shrunk:

- desktop/wide customer **additional information** uses three columns to reduce vertical scrolling;
- narrow/mobile customer entry uses one column for easier sequential touch entry;
- the mobile layout must not preserve desktop columns by shrinking fields.

## Affected current POS surfaces

- basket footer: **حفظ / دفع**;
- Quick Sale empty-ticket debt action: **سداد** uses the normal primary slot rather than the secondary slot;
- cash/card completion;
- debt settlement and settlement-success confirmation;
- customer create/save actions;
- sale success: **طباعة / بيع جديد**.

## Data consequence

None. Footer position, column count and action-slot placement are UI-only interaction/layout state and do not create durable business fields.
