# Gods — Divine Codex

**Foundry VTT V14 + D&D5e system v5.3.3 | GM-only encyclopedia of deities**

Searchable, illustrated deity library built for Daikaze's Averis campaign, with a separate selection of optional D&D / Forgotten Realms reference profiles. The latter are **examples, not established Averis canon**.

## Exact compatibility

- **Foundry core:** Version **14** (any stable V14 build).
- **Game system:** `dnd5e` **exactly 5.3.3**. This is the D&D 5e game system version, **not** the Foundry build number.
- Version 0.1.1 declares these limits in `module.json`, and checks them again on startup and before database operations. Unsupported combinations show a GM warning instead of opening the module.
- No new D&D6-only APIs are used; the UI relies on V14 `ApplicationV2` and the standard `JournalEntry` API.
- Existing Gods records are preserved: updates do **not** replace the GM-private Journal or its edited deity entries.

## Install

In **Foundry → Add-on Modules → Install Module → Manifest URL**, paste:

`https://raw.githubusercontent.com/Daikaze/Gods/main/module.json`

Alternatively, download the packaged [v0.1.1 ZIP](https://github.com/Daikaze/Gods/releases/download/v0.1.1/gods-v0.1.1.zip). This release archive puts `module.json` at its root, as required for Foundry installation.

Enable **Gods — Divine Codex** in your world. As GM, open **Game Settings → Configure Settings → Module Settings → Gods — Divine Codex → Open Divine Codex** (the exact tab label depends on Foundry's language). As a fallback, run `game.gods.open()` from the browser console.

## Included features (v0.1.1)

- **GM-only access.** The UI is not created for players; all operations reject non-GMs. Data is stored in a GM-private JournalEntry with default ownership **NONE**, not in readable world settings. Do **not** manually grant player access to the "Gods — GM Database (private)" Journal.
- **Search as you type** across titles, aliases, domains, symbols, lore and notes. Filter by pantheon/world.
- **Portrait gallery:** locally bundled original SVG illustrations (offline-capable), replaceable individually with a chosen Foundry image file or URL.
- **Fully editable deity profiles**: name, titles, alignments, planes, appearance, personality, history, doctrine, worship, clergy, rituals, relationships, relics, powers, quest hooks and **GM-only secrets/notes**.
- Create, duplicate, edit, delete gods.
- JSON **Backup / Import**. Import merges by ID (matching IDs are overwritten); all files include secret notes — keep backups private.
- Optional sample profiles are labeled "Forgotten Realms" and don't rewrite the campaign.

**Data lifecycle:** The library is seeded *once*, when a GM opens the module for the first time. Editing existing records is independent of future code updates. Updates to defaults do not overwrite DM edits. The secret fields are not embedded in public source files.

## Caveats

- This is a version-targeted build for Foundry V14 + dnd5e 5.3.3. Automated static checks and mocked Foundry runtime checks do not replace an in-world smoke test.
- Art consists of bespoke symbolic vector portraits, not finished character paintings. Replace images through the editor at any time.
- Foundry's Journal permissions protect the world database from players. Public module files and example lore remain downloadable by anyone with the repository link. Keep confidential campaign secrets in editable GM fields, not shipped seed data.
- Multiple GMs editing the same record simultaneously can overwrite each other's changes; export a backup before large changes.

## Manifest
https://raw.githubusercontent.com/Daikaze/Gods/main/module.json

Repository: https://github.com/Daikaze/Gods

License: source available for use in this campaign; original bundled vector illustrations and module code.
