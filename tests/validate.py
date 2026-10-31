#!/usr/bin/env python3
"""Static test for Gods Codex. A live Foundry V14 smoke test is still required."""
import json
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
assert manifest["id"] == "gods"
assert manifest["compatibility"]["minimum"] == "14.367"
assert manifest["compatibility"]["maximum"] == "14"
assert manifest["version"] == "0.2.7"
assert manifest["download"] == "https://github.com/Daikaze/Gods/releases/download/v0.2.7/gods-v0.2.7.zip"
systems = manifest["relationships"]["systems"]
assert len(systems) == 1 and systems[0]["id"] == "dnd5e"
assert systems[0]["type"] == "system"
assert systems[0]["compatibility"]["minimum"] == "6.0.6"
assert systems[0]["compatibility"]["maximum"] == "6.0.6"
assert manifest["version"]
for key in ("esmodules", "styles"):
    for path in manifest[key]:
        assert (ROOT / path).is_file(), path

src = (ROOT / "data/deities.js").read_text(encoding="utf-8")
match = re.search(r"export const SEED_DEITIES = (\[.*\]);\s*$", src, re.DOTALL)
assert match, "Seed data must be a JSON literal exported as a JavaScript array."
deities = json.loads(match.group(1))
assert len(deities) >= 30, len(deities)
ids = set()
for god in deities:
    id = god["id"]
    assert id not in ids, id
    ids.add(id)
    assert god["name"] and god["pantheon"] and god["summary"], id
    assert "secrets" not in god and "dmNotes" not in god, "Do not commit GM secrets."
    svg = ROOT / "assets" / "deities" / (id + ".svg")
    assert svg.is_file(), svg
    tree = ET.parse(svg)
    assert tree.getroot().tag == "{http://www.w3.org/2000/svg}svg", svg
assert sum(g["pantheon"] == "Averis" for g in deities) >= 6

ET.parse(ROOT / "assets" / "deities" / "unknown.svg")
js = (ROOT / "scripts" / "gods.js").read_text(encoding="utf-8")
assert 'restricted: true' in js, "Menu must be GM-only."
assert 'SUPPORTED_SYSTEM_VERSION = "6.0.6"' in js
assert 'SUPPORTED_FOUNDRY_GENERATION = 14' in js
assert 'isSupported()' in js, "Operations must check system/core versions"
assert 'hasAccess()' in js, "All mutations must be GM-gated."
assert 'ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE }' in js, "Journal must be private."
template = (ROOT / "templates" / "codex.hbs").read_text(encoding="utf-8")
for action in ("selectGod", "addGod", "deleteGod", "importGods", "exportGods"):
    assert 'data-action="' + action + '"' in template
assert "data-gods-editor" in template and 'type="submit"' in template
assert 'data-action="deityImageAction"' in template, "Deity art must be clickable."
assert 'deityImageAction: function' in js
assert 'ChatMessage.create' in js and 'popout.shareImage()' in js
css = (ROOT / "styles" / "gods.css").read_text(encoding="utf-8")
assert ".gods-codex-window .window-content" in css, "Only the Gods window may be styled."
assert "container: gods-codex / inline-size" in css, "Responsive layout must follow application width."
assert "@container gods-codex" in css
assert "var(--color-text-primary" in css and "var(--gods-line)" in css, "Use Foundry theme colors."
assert "color-scheme:dark" not in css, "Do not force a dark native select menu."
assert "object-fit:cover" not in css, "Do not crop deity portraits."
for selector in (
    ".gods-entry-art", ".gods-hero-image-button .gods-hero-art",
    ".gods-image-editor img", ".gods-image-menu-preview"
):
    match = re.search(r"(?m)^\\.gods-codex-window\\s+" + re.escape(selector) + r"\\s*\\{([^}]+)\\}", css)
    assert match and re.search(r"object-fit:\\s*contain", match.group(1)), "Portrait must use contain: " + selector
assert re.search(r"height:\\s*calc\\(100% - 62px\\)", css), "Full hero must reserve a strip for image actions."
assert re.search(r"min-height:\\s*410px", css), "Give full-body art a usable viewport."


assert not re.search(r"[\u0400-\u04FF]", template), "UI must be fully English."
assert not re.search(r"[\u0400-\u04FF]", js), "Module code/messages must be English."
assert not re.search(r"[\u0400-\u04FF]", src), "All bundled deity text must be English."
assert (ROOT / "data" / "legacy.js").is_file(), "Original v0.1.1 seeds are required for safe migration."
assert 'getSceneControlButtons' in js and 'controls.gods' in js, "Scene Controls launcher must be registered."
assert 'migrateLegacyRecords' in js and 'DATABASE_SCHEMA = 3' in js, "Safe schema migration required."
assert 'POWER_BY_ID' in js and 'this.entries.sort(comparePower)' in js
assert 'divineTier' in template and 'tierHeader' in template
assert 'tierOptions' in js and 'Position in Tier' in js
# Preserve the exact number and original within-tier sequence from the Obsidian note.
ranks = (ROOT / "data" / "power-hierarchy.js").read_text(encoding="utf-8")
ranks_match = re.search(r'export const POWER_HIERARCHY = (\{.*\});\s*$', ranks, re.DOTALL)
assert ranks_match
hierarchy = json.loads(ranks_match.group(1))
assert [tier["tier"] for tier in hierarchy["tiers"]] == [
    "Primordial Powers", "Greater Gods", "Major Gods", "Lesser Gods"
]
expected = [
    ["izanagi", "izanami"],
    ["amaterasu", "ra", "odin", "mystra", "bahamut", "tiamat", "shar", "astrael"],
    ["selune", "tsukuyomi", "susanoo", "poseidon", "kelemvor", "hades", "thor", "athena", "raven-queen", "tenrai-no-kami", "asmodeus"],
    ["fujin", "inari", "raijin", "hikari", "ragamodji", "shizuru", "kirinokami", "akurojin-no-hi", "bastet", "hermes"],
]
assert [tier["deities"] for tier in hierarchy["tiers"]] == expected
additions = (ROOT / "data" / "obsidian-deities.js").read_text(encoding="utf-8")
extras_match = re.search(r'export const OBSIDIAN_DEITIES = (\[.*\]);\s*$', additions, re.DOTALL)
assert extras_match
extra_data = json.loads(extras_match.group(1))
assert len(extra_data) == 19
all_ids = {god["id"] for god in deities} | {god["id"] for god in extra_data}
assert len(all_ids) == 53
assert set(sum(expected, [])) <= all_ids, "Every power-ranked god must be present."
assert not re.search(r"[\u0400-\u04FF]", additions), "New entries must be in English."
print("OK: manifest, %d deity portraits, GM access controls, UI actions." % len(deities))
