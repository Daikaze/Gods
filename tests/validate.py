#!/usr/bin/env python3
"""Static test for Gods Codex. A live Foundry V14 smoke test is still required."""
import json
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
assert manifest["id"] == "gods"
assert manifest["compatibility"]["minimum"] == "14"
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
assert 'hasAccess()' in js, "All mutations must be GM-gated."
assert 'ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE }' in js, "Journal must be private."
template = (ROOT / "templates" / "codex.hbs").read_text(encoding="utf-8")
for action in ("selectGod", "addGod", "saveGod", "deleteGod", "importGods", "exportGods"):
    assert 'data-action="' + action + '"' in template
print("OK: manifest, %d deity portraits, GM access controls, UI actions." % len(deities))
