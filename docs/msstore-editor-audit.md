# MS Store Editor Audit and Redesign Proposal

Assumption: desktop is the primary scene, and the first delivery should improve efficiency without forcing a storage migration. The current `entries[] + defaultValues` persistence can stay in place for phase 1, while the renderer switches to a locale-first workbench.

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2/4 | Entry selection is mouse-first and the main editing flow depends on clickable table rows. |
| 2 | Performance | 3/4 | Rendering cost is acceptable, but the one-field-at-a-time inventory flow creates heavy interaction cost. |
| 3 | Responsive Design | 2/4 | The two-pane layout collapses late and the editor grows vertically because each field is wrapped in its own block. |
| 4 | Theming | 3/4 | Tokens are mostly in place, but a few success and background treatments still bypass the token system. |
| 5 | Anti-Patterns | 2/4 | The page is not flashy, but it overuses nested panels and card-like sections for dense maintenance work. |
| **Total** | | **12/20** | **Acceptable, significant work needed** |

## Anti-Patterns Verdict

Pass on visual restraint, fail on operational density. The page does not look AI-generated in the usual gradient-heavy sense, but it does fall into a common admin anti-pattern: too many stacked panels for what should be a compact workbench. The result is a long editor that hides relationships between language, market, default value, and field inventory.

## Executive Summary

- Audit Health Score: **12/20** (`Acceptable`)
- Issues found: **0 P0, 4 P1, 2 P2, 2 P3**
- The core problem is structural: the current page edits one `locale + market` entry at a time, while the user need is language management with full-language maintenance.
- The current form makes constrained data free text, duplicates controls between `default` and current language, and turns the Partner Center field inventory into a slow single-item editor.
- Recommended direction: rebuild this page as a **locale-first workbench** with grouped fields, compact row-based editors, market chips, coverage status, and a searchable full-field table.

## Detailed Findings

### [P1] Entry-first architecture blocks language management

- Location: `src/renderer/components/products/ProductProfilePage.tsx:218`, `src/renderer/store/slices/msStoreDataSlice.ts:38`, `src/renderer/store/slices/msStoreDataSlice.ts:84`
- Category: Anti-Pattern / Responsive / Task flow
- Impact: users must manage each record as an isolated `locale + market` item, so they cannot see language coverage, missing translations, or current language health at a glance.
- Standard: desktop productivity UI should surface the dominant axis of work first; here the dominant axis is language, not row identity.
- Recommendation: derive a `LocaleWorkbenchViewModel` from `entries[]`, group records by `locale`, and make language the first-class selection target. Keep market as a secondary dimension inside the selected language.
- Suggested command: `impeccable layout`

### [P1] Constrained fields are exposed as free-text inputs

- Location: `src/renderer/components/products/ProductProfilePage.tsx:370`, `src/renderer/components/products/ProductProfilePage.tsx:386`, `src/shared/ms-store-data.ts:18`, `src/renderer/store/slices/productManagementSlice.ts:15`
- Category: Accessibility / Error prevention / Task flow
- Impact: `locale` and `market` are both bounded concepts in the product, but the UI still requires manual typing. This increases validation churn, duplicate combinations, and user hesitation.
- WCAG/Standard: error prevention for forms, reduce user memory burden.
- Recommendation: replace `locale` with a supported-language picker, and replace `market` with product-scoped market chips or multi-select sourced from `relatedMarkets`. Invalid combinations should be disabled before save.
- Suggested command: `impeccable harden`

### [P1] Core/default field editing wastes vertical space and breaks comparison

- Location: `src/renderer/components/products/ProductProfilePage.tsx:412`, `src/renderer/components/products/ProductProfilePage.tsx:455`, `src/renderer/components/products/ProductProfilePage.tsx:461`
- Category: Responsive / Anti-Pattern
- Impact: each core field becomes its own bordered block, then splits again into `default` and locale editors. Users scroll through container chrome instead of content and cannot compare fields as a compact matrix.
- Standard: dense maintenance interfaces should prefer aligned rows and predictable columns over stacked cards.
- Recommendation: convert core fields into a compact comparison grid: `field name | default | current locale | status`. Long text fields can expand vertically inside the same row instead of spawning a new panel.
- Suggested command: `impeccable distill`

### [P1] Full-field inventory is technically complete but operationally incomplete

- Location: `src/renderer/components/products/ProductProfilePage.tsx:495`, `src/renderer/components/products/ProductProfilePage.tsx:520`, `src/shared/ms-store-field-registry.ts:1`
- Category: Performance / Task flow
- Impact: the user can technically edit the full Microsoft field registry, but only one field at a time. With hundreds of fields, this makes “complete language editing” too slow for real use.
- Standard: full editors need batch visibility, filtering, and edit locality.
- Recommendation: introduce grouped inventory sections and a row editor that shows multiple fields at once. Add quick filters: `Required`, `Filled`, `Empty`, `Changed`, `Assets`, `Compliance`, `Metadata`.
- Suggested command: `impeccable layout`

### [P2] Entry selection is not keyboard-complete

- Location: `src/renderer/components/products/ProductProfilePage.tsx:328`
- Category: Accessibility
- Impact: table rows are clickable but not focusable controls, which makes selection unreliable for keyboard users and weakens screen-reader semantics.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 4.1.2 Name/Role/Value.
- Recommendation: render a button or roving-tabindex row action inside the first cell, add `aria-selected`, and expose the table as a selectable list or grid with clear focus states.
- Suggested command: `impeccable harden`

### [P2] Conflict feedback arrives too late and at the wrong level

- Location: `src/renderer/store/slices/msStoreDataSlice.ts:84`, `src/renderer/store/slices/msStoreDataSlice.ts:353`
- Category: Accessibility / Error handling
- Impact: duplicate `locale + market` conflicts are only discovered on save, then attached to the `market` error bucket. Users do not learn which existing record conflicts with the current draft.
- WCAG/Standard: actionable error messaging, error recovery.
- Recommendation: validate the combination while editing, show the conflicting record inline, and disable already-claimed combinations in the picker.
- Suggested command: `impeccable clarify`

### [P3] Success styling bypasses theme tokens

- Location: `src/renderer/components/products/ProductProfilePage.tsx:306`
- Category: Theming
- Impact: the export success message hardcodes emerald values, which will age poorly if the theme system changes.
- Recommendation: move success colors into semantic tokens and reuse them for chips, banners, and validation states.
- Suggested command: `impeccable colorize`

### [P3] Background and container language still overspecify decoration

- Location: `src/renderer/index.css:103`, `src/renderer/components/products/ProductProfilePage.tsx:219`
- Category: Anti-Pattern / Theming
- Impact: the product UI already has a clear operational design system, but the msstore page still relies on layered gradients plus many rounded containers, which reduces the ledger-like feel described in `PRODUCT.md` and `DESIGN.md`.
- Recommendation: keep one structural panel level, flatten repeated section containers, and let rows, tabs, and dividers carry hierarchy.
- Suggested command: `impeccable quieter`

## Patterns and Systemic Issues

- The storage model is compact, but the UI expands each maintenance task into separate blocks instead of showing the dataset as a working table.
- Existing bounded vocabularies such as supported locales and product markets are not promoted into selection controls.
- The page treats “complete editor” as “all fields exist somewhere” instead of “all fields can be edited efficiently in one language session”.
- Default values and locale values are conceptually paired, but the UI displays them as repeated form islands instead of side-by-side rows.

## Positive Findings

- `msStoreFieldRegistry` and the core field mapping already provide a stable foundation for a full editor.
- `defaultValues` plus per-entry field values are the right raw ingredients for side-by-side comparison.
- The product already has a defined `relatedMarkets` concept, so market scoping can become a guided control rather than a free-text burden.
- Theme tokens, spacing rules, and typography direction are already good enough to support a denser workbench without a full visual redesign.

## Recommended Target UX

### Working model

Treat the page as a **language workbench**:

- Left: language roster with coverage and status.
- Center: compact editor for the selected language.
- Right: searchable field catalog, filters, and metadata helpers.

The user should be able to answer these questions without scrolling through the full form:

1. Which languages already exist?
2. Which language is missing required fields?
3. Which markets are attached to this language?
4. Which fields differ from `default`?
5. Can I complete all remaining translation and metadata work from one view?

### Recommended information architecture

1. Toolbar
   - Product switcher
   - `Import CSV`, `Export CSV`, `Add language`
   - Summary chips: `Languages`, `Markets`, `Needs review`
2. Language rail
   - Locale rows with `Ready`, `Needs review`, `New`, `Missing required`
   - Coverage meter: required filled count
   - Quick add language
3. Main editor
   - `Overview`: locale, attached markets, store ID, keywords
   - `Core listing`: compact comparison grid for title, subtitle, short description, description
   - `Full inventory`: grouped editable rows for all remaining fields
4. Utility rail
   - Field search
   - Filters
   - Default/local diff summary
   - Warnings and import/export notes

## Compact Form Rules

- Input height: `32px` for standard rows, `36px` only for primary actions.
- Labels sit in the first column or inside the row header, not above every single control.
- Use one border system per zone. Do not wrap each field in a new card.
- Keep help text collapsed by default. Expand only for long description fields and validation messages.
- Add sticky save bar for desktop when the form is dirty.
- Show `default` and current language in aligned columns so copy and fallback behavior are obvious.

## Proposed Phase Plan

### Phase 1, no storage migration

- Keep `MsStoreDataDataset` unchanged.
- Build a derived `localeGroups` selector from `entries[]`.
- Replace free-text locale and market fields with guided controls.
- Replace stacked core-field cards with a compact row grid.
- Replace single-field inventory editor with grouped editable rows.

### Phase 2, optional normalization

- Introduce a locale-first view model in state, for example `locales[]` with nested market bindings.
- Keep import/export adapters translating to and from `win_store.csv`.
- Add per-language completeness scoring and diffing against `default`.

## ASCII Design, desktop

```text
+-----------------------------------------------------------------------------------------------------------+
| Product [ Hagi App ]  Search fields [__________]  Import CSV  Export CSV  + Add language                 |
| Context: 6 markets | 4 languages | 2 need review                                                        |
+---------------------------+--------------------------------------------------------------+---------------+
| Languages                 | Locale Editor: zh-CN                                         | Field Tools   |
|                           |                                                              |               |
| > zh-CN   Needs review    | Overview                                                     | Search        |
|   en-US   Ready           | Locale [zh-CN v]   Markets [CN][HK][SG]   Store ID [_____]  | [_________]   |
|   ja-JP   Missing 3       | Keywords [_______________________________________________]   |               |
|   ko-KR   New             |                                                              | Filters       |
|                           | Core listing                                                 | [Required]    |
| + Add language            | +----------------------+------------------+----------------+ | [Filled]      |
|                           | | Field                | Default          | zh-CN          | | [Empty]       |
| Coverage                  | +----------------------+------------------+----------------+ | [Changed]     |
| Required 12 / 16          | | Title                | [______________] | [____________] | | [Assets]      |
| Changed 8                 | | Subtitle             | [______________] | [____________] | | [Compliance]  |
| Empty 21                  | | Short Description    | [______________] | [____________] | | [Metadata]    |
|                           | | Description          | [ textarea ....                 ] | |               |
| Markets                   | +------------------------------------------------------------+ | Current field |
| [CN][US][JP][KR][DE][FR]  |                                                              | Description   |
|                           | Full inventory                                                | ID 2 · Text   |
|                           | Search [____________]  Show: Required | Filled | Changed     |               |
|                           | ------------------------------------------------------------ | Default [__]  |
|                           | ReleaseNotes                 [default____] [zh-CN__________] | Locale  [__]  |
|                           | DesktopScreenshot1           [default____] [zh-CN__________] |               |
|                           | DesktopScreenshotCaption1    [default____] [zh-CN__________] | Warnings      |
|                           | AdditionalLicenseTerms       [default____] [zh-CN__________] | 1 conflict    |
+---------------------------+--------------------------------------------------------------+---------------+
| Dirty changes: 6 fields changed                                                Reset   Save language     |
+-----------------------------------------------------------------------------------------------------------+
```

## ASCII Design, narrow width

```text
+--------------------------------------------------------------+
| Product [Hagi App]        Languages 4   Needs review 2       |
| Import  Export  +Language                                   |
+--------------------------------------------------------------+
| Language tabs: [zh-CN] [en-US] [ja-JP] [+]                  |
+--------------------------------------------------------------+
| Overview                                                     |
| Locale [zh-CN v]                                             |
| Markets [CN][HK][SG]                                         |
| Store ID [____________________]                              |
| Keywords [____________________]                              |
+--------------------------------------------------------------+
| Core listing                                                 |
| Title                                                        |
| Default [__________________]                                 |
| zh-CN  [__________________]                                  |
|                                                              |
| Short Description                                            |
| Default [__________________]                                 |
| zh-CN  [__________________]                                  |
+--------------------------------------------------------------+
| Full inventory                                               |
| Search [__________________]  Filter [Required v]            |
| ReleaseNotes              Default [____]  zh-CN [____]      |
| DesktopScreenshot1        Default [____]  zh-CN [____]      |
| AdditionalLicenseTerms    Default [____]  zh-CN [____]      |
+--------------------------------------------------------------+
| Reset                                           Save         |
+--------------------------------------------------------------+
```

## Recommended Commands

1. **[P1] `impeccable layout`**: rebuild the page into a locale-first workbench with compact edit regions.
2. **[P1] `impeccable harden`**: replace free-text locale and market inputs, add keyboard-complete row selection, and improve conflict prevention.
3. **[P1] `impeccable distill`**: remove nested field panels and convert core fields into a compact comparison grid.
4. **[P2] `impeccable clarify`**: improve validation copy, conflict messaging, and empty/filter states.
5. **[P3] `impeccable quieter`**: flatten remaining decorative surface layers and align success states with semantic tokens.
6. **[P2] `impeccable polish`**: final pass after implementation.

You can run these one by one or combine them in a single implementation pass. Re-run the audit after the UI is rebuilt.
