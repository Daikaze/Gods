# Gods — Divine Codex

**Foundry VTT V14 | GM-only encyclopedia of deities**

Searchable, illustrated deity library built for Daikaze's Averis campaign, with a separate selection of optional D&D / Forgotten Realms reference profiles. The latter are **examples, not established Averis canon**.

## Install

In **Foundry → Add-on Modules → Install Module → Manifest URL**, paste:

`https://raw.githubusercontent.com/Daikaze/Gods/main/module.json`

Enable **Gods — Divine Codex** in your world. In the **Settings** sidebar, click **Gods — Divine Codex**. As a fallback, GM can run `game.gods.open()` from the browser console.

## Included features (v0.1.0)

- **GM-only access.** The UI is not created for players; all operations reject non-GMs. Data is stored in a GM-private JournalEntry with default ownership **NONE**, not in readable world settings. Do **not** manually grant player access to the "Gods — GM Database (private)" Journal.
- **Search as you type** across titles, aliases, domains, symbols, lore and notes. Filter by pantheon/world.
- **Portrait gallery:** locally bundled original SVG illustrations (offline-capable), replaceable individually with a chosen Foundry image file or URL.
- **Fully editable deity profiles**: name, titles, alignments, planes, appearance, personality, history, doctrine, worship, clergy, rituals, relationships, relics, powers, quest hooks and **GM-only secrets/notes**.
- Create, duplicate, edit, delete gods.
- JSON **Backup / Import**. Import merges by ID (matching IDs are overwritten); all files include secret notes — keep backups private.
- Optional sample profiles are labeled "Forgotten Realms" and don't rewrite the campaign.

**Data lifecycle:** The library is seeded *once*, when a GM opens the module for the first time. Editing existing records is independent of future code updates. Updates to defaults do not overwrite DM edits. The secret fields are not embedded in public source files.

## Caveats

- This is an initial functional version targeting Foundry V14 APIs; it has been statically reviewed but needs a live-world smoke test.
- Art consists of bespoke symbolic vector portraits, not finished character paintings. Replace images through the editor at any time.
- Foundry's Journal permissions protect the world database from players. Public module files and example lore remain downloadable by anyone with the repository link. Keep confidential campaign secrets in editable GM fields, not shipped seed data.
- Multiple GMs editing the same record simultaneously can overwrite each other's changes; export a backup before large changes.

## Manifest
https://raw.githubusercontent.com/Daikaze/Gods/main/module.json

Repository: https://github.com/Daikaze/Gods

License: source available for use in this campaign; original bundled vector illustrations and module code.
