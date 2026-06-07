# Product

## Register

product

## Users

Primary users are operators, release managers, and small publishing teams maintaining store metadata on their local machine.
They work title by title, need to compare multiple markets under the same product, and care more about correctness and auditability than presentation.

## Product Purpose

Store Master exists to manage application information across multiple markets from one local workspace.
The core data model is product first: a product can contain multiple markets, and each market owns its channel-specific identifiers, assets, compliance items, and publishing metadata.
Success means the user can see what exists, what is missing, and what still needs review before a submission leaves the machine.

## Brand Personality

Compact, professional, dependable.
The interface should feel like an operational ledger for release work: low-noise, direct, and built for repeated maintenance tasks.

## Anti-references

- Marketing-page styling disguised as admin UI
- Oversized hero cards and decorative metric tiles
- Glassmorphism, glowing gradients, or entertainment-style visual noise
- Modal-heavy workflows for routine record maintenance
- Card-first layouts that hide tabular relationships between product, market, and market record

## Design Principles

- Product before channel: the product record is always the top-level anchor, and markets are attached beneath it.
- Tables before cards: structured maintenance work should default to rows and columns, with cards reserved for supporting context.
- Compact clarity: dense information is acceptable when labels, ownership, and state remain obvious at a glance.
- Progressive detail: list views surface status first, then reveal field-level detail in a secondary panel.
- Local-first trust: every screen should help the user understand what is stored locally, what changed, and what still needs review.

## Accessibility & Inclusion

Target WCAG AA contrast for all operational surfaces.
All primary navigation, row selection, and detail tabs should be keyboard reachable, with visible focus states and status expressed by text plus color.
Dense tables should keep readable body sizes, stable alignment, and avoid relying on motion or color alone to communicate missing or risky records.
