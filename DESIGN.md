---
name: Store Master
description: Product-first desktop workbench for maintaining local multi-market store records.
colors:
  canvas: "oklch(0.982 0.003 248)"
  ink: "oklch(0.28 0.016 255)"
  panel: "oklch(0.996 0.002 248 / 0.98)"
  panel-muted: "oklch(0.97 0.006 246 / 0.96)"
  accent-blue: "oklch(0.56 0.108 248)"
  accent-blue-foreground: "oklch(0.985 0.003 248)"
  secondary-surface: "oklch(0.956 0.007 248)"
  row-selected: "oklch(0.938 0.012 238)"
  border-soft: "oklch(0.9 0.008 247)"
  success-soft: "#ecfdf5"
  warning-soft: "#fffbeb"
  danger-soft: "#fff1f2"
typography:
  title:
    fontFamily: "IBM Plex Sans, Segoe UI Variable, PingFang SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, Segoe UI Variable, PingFang SC, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, Segoe UI Variable, PingFang SC, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
  mono:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.accent-blue-foreground}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  workspace-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  table-row-selected:
    backgroundColor: "{colors.row-selected}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  status-chip-ready:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Store Master

## Overview

**Creative North Star: "The Operations Ledger"**

Store Master is a product UI, not a brand showcase. The visual system should feel like a disciplined desktop ledger for release operations: light, compact, and explicit about ownership, status, and missing work. Product is the anchor, markets are subordinate, and market records are the final maintenance layer.

This system rejects the common admin cliches that blur operational meaning: oversized metric cards, decorative gradients, glassy panels, and card-first layouts that fragment related records. The goal is not visual drama. The goal is confidence that local store data is structured, reviewable, and ready to publish.

**Key Characteristics:**
- Compact table-first layouts with a secondary detail panel
- Restrained color with one action accent
- Light surfaces, visible borders, and low-elevation chrome
- Tight typography tuned for labels, rows, and IDs
- Status communicated by text and tone, never color alone

## Colors

The palette is restrained and operational: cool neutrals carry the interface, and a single blue accent is reserved for selection, primary actions, and current context.

### Primary
- **Registry Blue** (`oklch(0.56 0.108 248)`): The only assertive accent. Use it for primary actions, selected navigation, and the active product context.

### Neutral
- **Ledger Canvas** (`oklch(0.982 0.003 248)`): The app background and broad working surface.
- **Panel White** (`oklch(0.996 0.002 248 / 0.98)`): Main tables, detail panes, and input surfaces.
- **Muted Shelf** (`oklch(0.97 0.006 246 / 0.96)`): Table headers, sidebars, and secondary grouping areas.
- **Quiet Border** (`oklch(0.9 0.008 247)`): Dividers, row lines, and low-contrast chrome.
- **Ink Slate** (`oklch(0.28 0.016 255)`): Primary text, headings, and dense operational copy.

### Named Rules
**The One Accent Rule.** Blue is not decoration. If something is blue, it is actionable, selected, or current.

**The Review Tone Rule.** Success, warning, and danger colors appear as soft background tints inside chips and review states only. They should not wash entire panels.

## Typography

**Display Font:** None. Store Master does not use display typography.
**Body Font:** IBM Plex Sans (with Segoe UI Variable and PingFang SC fallbacks)
**Label/Mono Font:** JetBrains Mono for IDs, timestamps, and store identifiers

**Character:** The type system is compact and technical. Headings should feel firm without becoming oversized, and tabular data should remain readable during long maintenance sessions.

### Hierarchy
- **Title** (600, `1rem`, `1.4`): Section headers inside panels and workbench labels.
- **Body** (400, `0.875rem`, `1.5`): Row content, descriptions, and most operational copy.
- **Label** (500, `0.75rem`, `1.4`, `0.08em`): Table headers, metadata labels, and small chrome text. Use uppercase sparingly for headers only.
- **Mono** (500, `0.8125rem`, `1.45`): Store IDs, timestamps, PFNs, and other fixed-format data.

### Named Rules
**The No Hero Type Rule.** Nothing in this interface should read like a landing page headline. If it feels promotional, it is too large.

## Elevation

Elevation is minimal and structural. Panels may use a soft ambient shadow to separate work zones, but row-to-row hierarchy comes from borders, muted header bands, and selected-state tinting rather than lifted cards.

### Shadow Vocabulary
- **Workbench Panel** (`box-shadow: 0 12px 36px rgba(15,23,42,0.05)`): Use on the main product, market, and detail panels only.
- **Flat Row** (`box-shadow: none`): Default for table rows, lists, and inline controls.

### Named Rules
**The Flat-By-Default Rule.** Lists and rows stay flat. Depth belongs to structural regions, not every data item.

## Components

### Buttons
- **Shape:** Soft rectangular corners (`8px`).
- **Primary:** Blue fill with white text, `36px` height, medium label weight. Use for create, confirm, or explicit sync actions.
- **Hover / Focus:** Hover darkens slightly. Focus uses a subtle ring, not a glow.
- **Secondary / Outline:** White or muted surface with border. Use for refresh, switch, and non-destructive toolbar actions.

### Tables
- **Style:** This is the default interaction surface. Headers sit on a muted band, rows use `40px` to `44px` vertical rhythm, and dividers stay visible.
- **Selection:** Selected rows use a light accent tint, not a left stripe and not a filled card.
- **Dense Data:** IDs and timestamps move to mono. Ownership and state stay adjacent to the relevant row.

### Status Chips
- **Style:** Small rounded rectangles, never full pills. Use soft success, warning, or danger backgrounds with text and icon.
- **State:** Always pair tone with a label such as Ready, Needs review, or Missing fields.

### Inputs / Fields
- **Style:** White input surface, `8px` radius, quiet border, no inset glow.
- **Focus:** Border and ring tighten toward the primary blue.
- **Usage:** Inputs belong in toolbars and detail panes, not floating independently in decorative panels.

### Navigation
- **Sidebar:** Compact, muted, and obvious. One current section at a time.
- **Detail Tabs:** Short, rectangular tabs used only to switch between field sets, checklists, and activity.

## Do's and Don'ts

### Do:
- **Do** keep the data model visible in the UI: product first, market second, market record third.
- **Do** prefer tables for registries and use the right-side panel for deeper field maintenance.
- **Do** keep primary actions at `36px` height and maintain visible borders between rows and regions.
- **Do** show review state with text, icon, and a soft tone so missing work is readable in dense layouts.
- **Do** keep copy short and operational, especially in headers, chips, and toolbar actions.

### Don't:
- **Don't** use marketing-page styling disguised as admin UI.
- **Don't** introduce oversized hero cards or decorative metric tiles.
- **Don't** use glassmorphism, glowing gradients, or entertainment-style visual noise.
- **Don't** push routine maintenance into modal-heavy workflows.
- **Don't** replace tables with card-first layouts that hide the relationship between product, market, and market record.
