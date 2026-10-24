---
public: true
multilingual: false
style: product
---

# README requirements

## Product focus

- Present Store Master as a cross-platform desktop app (Windows, macOS, Linux; built with Electron) that gives one local workspace for managing application store information across markets (Steam and MS Store).
- Main features users get: a product list where each product carries its related markets, a per-language Microsoft Store listing editor (title, subtitle, short description, description and the full field inventory, with filters such as empty, changed, assets and long text), CSV import and export, ten listing languages, and light and dark appearance settings.
- Address operators, release managers and small publishing teams who maintain store metadata, not developers.
- Lead with product value (see what exists, what is missing and what needs review before a submission), then the feature list.

## Required content

- Open with a short product introduction and the badges the README already carries.
- List features in user terms and state only features that `src/` shows; do not present the tech stack as features.
- Mention supported desktop platforms and how users get or run the app, only as far as the repository shows.
- Keep the license statement. The license badge and `LICENSE` say MIT while `package.json` says AGPL-3.0; the README must follow `LICENSE` until that mismatch is resolved.

## Exclusions

- Exclude store credentials, signing material, tokens, internal hosts, machine-specific paths and private links.
- Keep repository maintenance instructions out of the README: repository layout, internal architecture, tech stack and dependency versions, development setup, CI, build internals and contribution workflow.
