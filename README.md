# Gods — Divine Codex

**Foundry VTT V14 + D&D5e system v5.3.3 | GM-only English-language deity encyclopedia**

Searchable, illustrated deity library built for Daikaze's Averis campaign, with a separate selection of optional D&D / Forgotten Realms reference profiles. The latter are **examples, not established Averis canon**.

## Exact compatibility

- **Foundry core:** Version **14** (any stable V14 build).
- **Game system:** `dnd5e` **exactly 5.3.3**. This is the D&D 5e game system version, **not** the Foundry build number.
- Version 0.2.5 declares these limits in `module.json`, and checks them again on startup and before database operations. Unsupported combinations show a GM warning instead of opening the module.
- No new D&D6-only APIs are used; the UI relies on V14 `ApplicationV2` and the standard `JournalEntry` API.
- Existing Gods records are preserved: updates do **not** replace the GM-private Journal or its edited deity entries.

## Install

In **Foundry → Add-on Modules → Install Module → Manifest URL**, paste:

`https://raw.githubusercontent.com/Daikaze/Gods/main/module.json`

Alternatively, download the packaged [v0.2.5 ZIP](https://github.com/Daikaze/Gods/releases/download/v0.2.5/gods-v0.2.5.zip). This release archive puts `module.json` at its root, as required for Foundry installation.

Enable **Gods — Divine Codex** in your world. As GM, open **Game Settings → Configure Settings → Module Settings → Gods — Divine Codex → Open Divine Codex** (the exact tab label depends on Foundry's language). As a fallback, run `game.gods.open()` from the browser console.

## Fixed in v0.2.5

- **Full portraits, no cropping:** the primary hero image now uses `object-fit: contain` inside a taller, fixed-width portrait panel. Portrait proportions are always preserved for full-body, square, landscape, and tall character illustrations. The portrait never expands its parent by its intrinsic image dimensions.
- The **Image Actions** strip now has its own reserved space below the image and no longer obscures the bottom of the artwork.
- Small list thumbnails and the GM portrait editor preview also show the entire uploaded picture instead of trimming the sides or head.
- Maintains GM-only access, deity lore, images, Obsidian divine tier ordering, search filters, scroll positions, and chat/player image-sharing functions. No database migration is required.

## New in v0.2.4

- **Obsidian-exact divine power hierarchy:** Primordial Powers → Greater Gods → Major Gods → Lesser Gods, preserving the written order within each tier. This is not the old story-importance ranking.
- **The 31 ranked gods** from the Averis Obsidian note appear in their original groups; **19 missing ranked gods** were added to the catalog with English starter profiles based on the note.
- **22 other existing gods** remain in a separate **Unranked** section, rather than being assigned unsupported power tiers.
- **GM-editable tier and tier position** in each deity's profile. Legacy Story Importance is retained but no longer determines list order. Search, filters, portrait sharing and scroll position continue working.
- **One-time schema 3 upgrade:** adds missing Obsidian gods without overwriting or recreating existing GM-edited records, deleted legacy entries, private notes or image selections. New entries use the existing fallback portrait pending custom art.
- The term **Power Tier** refers to the Obsidian document's cosmic-influence groups. Gods in the same tier are displayed in the file's order; this need not imply a numerical strength difference.

## New in v0.2.3

- **Sorted by Averis story importance** rather than alphabetically or by divine power: Ragamodji (100), Asmodeus (98), Fūjin (96), Izanami (94), Hikari (92), Selûne (90), then The Raven Queen (88). Generic Forgotten Realms reference gods follow.
- **GM-editable Campaign Importance (0-100)** in the deity editor; higher scores appear first. Ties sort by English names.
- Importance bands: Main Story (90-100), Character Connection (75-89), Supporting Lore (45-74), Background (0-44).
- Existing worlds, custom deity entries, hand-written GM notes and previous priorities are not overwritten; a missing priority is assigned a safe default when loaded, and edited ranks are saved with backups.
- Search, pantheon filtering, image sharing, and scroll-position preservation remain unchanged.

## New in v0.2.2

- **Readable pantheon filter:** native dropdown is explicitly dark-themed, with high-contrast option text and selected-row colors for Firefox and Chromium.
- **Portrait actions (GM-only):** click the large portrait in any deity profile and choose **Open Image**, **Send to Chat**, **Show to Players**, or **Cancel**.
- **Open Image:** uses the Foundry V14 ImagePopout application, visible only to the GM who opens it.
- **Send to Chat:** posts the deity's name and image as a public message, regardless of the GM's private roll mode. This does not send the deity description, secret fields, or GM notes.
- **Show to Players:** uses Foundry V14's built-in ImagePopout.shareImage, so the selected portrait appears for connected players; no chat post is created.
- The menu is usable with keyboard or pointer. All existing deity records remain unchanged.
- Automated tests exercise every portrait action, HTML escaping, public delivery, and the scroll fix. Live Foundry-world visual testing is still recommended.

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
