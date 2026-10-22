# Gods — Divine Codex

**Foundry VTT V14 + D&D5e system v5.3.3 | GM-only English-language deity encyclopedia**

Searchable, illustrated deity library built for Daikaze's Averis campaign, with a separate selection of optional D&D / Forgotten Realms reference profiles. The latter are **examples, not established Averis canon**.

## Exact compatibility

- **Foundry core:** Version **14** (any stable V14 build).
- **Game system:** `dnd5e` **exactly 5.3.3**. This is the D&D 5e game system version, **not** the Foundry build number.
- Version 0.2.0 declares these limits in `module.json`, and checks them again on startup and before database operations. Unsupported combinations show a GM warning instead of opening the module.
- No new D&D6-only APIs are used; the UI relies on V14 `ApplicationV2` and the standard `JournalEntry` API.
- Existing Gods records are preserved: updates do **not** replace the GM-private Journal or its edited deity entries.

## Install

In **Foundry → Add-on Modules → Install Module → Manifest URL**, paste:

`https://raw.githubusercontent.com/Daikaze/Gods/main/module.json`

Alternatively, download the packaged [v0.2.1 ZIP](https://github.com/Daikaze/Gods/releases/download/v0.2.1/gods-v0.2.1.zip). This release archive puts `module.json` at its root, as required for Foundry installation.

Enable **Gods — Divine Codex** in your world. As GM, open **Game Settings → Configure Settings → Module Settings → Gods — Divine Codex → Open Divine Codex** (the exact tab label depends on Foundry's language). As a fallback, run `game.gods.open()` from the browser console.

## Fixed in v0.2.1

- **Deity list scroll stays in place:** selecting a deity no longer jumps the scrollable left list back to its first entry.
- **Search and pantheon filters stay active** when navigating between gods.
- The newly selected deity's right-hand profile starts at the top, while ordinary rerenders also preserve each column's last scroll position.
- Regression checks verify selecting a deity after scrolling and reopening the codex. No GM notes or deity records are changed.

## New in v0.2.0

- **Scene Controls launcher:** GM-only **Gods** (book icon) in the **left two-column Foundry V14 Scene Controls toolbar**, as in the requested screenshot. Clicking the **Gods category icon** opens Divine Codex immediately. Its right-column tool, **Open Divine Codex** (sun icon), also opens the same window. Normal scene tools remain intact.
- **100% English module UI and starter profiles:** all 34 deity descriptions and form labels are in English.
- **Expanded campaign connections** for Selûne, Asmodeus, Fūjin, Izanami, Hikari, Ragamodji and the Raven Queen, using confirmed Averis campaign notes. Unconfirmed doctrine is labeled as such.
- **Safe upgrade from v0.1.1:** a one-time migration translates and expands only unchanged original starter text. GM edits, custom deities, imported entries and portrait choices remain. Back up before major upgrades as usual.
- **GM-only reminder:** this repository is public, and its *starter source lore* may be viewed by anyone visiting GitHub. Keep unrevealed plot secrets in the application's private GM notes, not in public source files.

## Included features (v0.2.1)

- **GM-only access.** The UI is not created for players; all operations reject non-GMs. Data is stored in a GM-private JournalEntry with default ownership **NONE**, not in readable world settings. Do **not** manually grant player access to the "Gods — GM Database (private)" Journal.
- **Search as you type** across titles, aliases, domains, symbols, lore and notes. Filter by pantheon/world.
- **Portrait gallery:** locally bundled original SVG illustrations (offline-capable), replaceable individually with a chosen Foundry image file or URL.
- **Fully editable deity profiles**: name, titles, alignments, planes, appearance, personality, history, doctrine, worship, clergy, rituals, relationships, relics, powers, quest hooks and **GM-only secrets/notes**.
- Create, duplicate, edit, delete gods.
- JSON **Backup / Import**. Import merges by ID (matching IDs are overwritten); all files include secret notes — keep backups private.
- Optional sample profiles are labeled "Forgotten Realms" and don't rewrite the campaign.

**Data lifecycle:** The library is seeded *once*, when a GM opens the module for the first time. On v0.2.1 upgrade, the database migrates once: only unchanged original seed text is updated to English and enriched lore. GM-authored edits are preserved. Later updates do not overwrite GM edits. The secret fields are not embedded in public source files.

## Caveats

- This is a version-targeted build for Foundry V14 + dnd5e 5.3.3. Automated static checks and mocked Foundry runtime checks do not replace an in-world smoke test.
- Art consists of bespoke symbolic vector portraits, not finished character paintings. Replace images through the editor at any time.
- Foundry's Journal permissions protect the world database from players. Public module files and example lore remain downloadable by anyone with the repository link. Keep confidential campaign secrets in editable GM fields, not shipped seed data.
- Multiple GMs editing the same record simultaneously can overwrite each other's changes; export a backup before large changes.

## Manifest
https://raw.githubusercontent.com/Daikaze/Gods/main/module.json

Repository: https://github.com/Daikaze/Gods

License: source available for use in this campaign; original bundled vector illustrations and module code.
