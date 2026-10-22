// Version-specific runtime checks using mocked Foundry V14 APIs.
// This is not a replacement for manually testing in a live Foundry world.
import assert from "node:assert/strict";

const callbacks = {};
const events = {};
globalThis.Hooks = {
  once(event, callback) { callbacks[event] = callback; },
  on(event, callback) { events[event] = callback; }
};

const notices = { warnings: [], errors: [] };
globalThis.ui = { notifications: {
  warn(message) { notices.warnings.push(message); },
  error(message) { notices.errors.push(message); },
  info() {}
} };
globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0 } };

class FakeApplicationV2 {
  constructor() { this.rendered = false; }
  _canRender() { /* returning undefined allows rendering in V14 */ }
  async _prepareContext() { return {}; }
  async render() { this.rendered = true; return this; }
  bringToFront() {}
}

globalThis.foundry = {
  utils: {
    randomID: () => "test-random-id",
    escapeHTML: text => text
  },
  applications: {
    api: {
      ApplicationV2: FakeApplicationV2,
      HandlebarsApplicationMixin: base => base,
      DialogV2: { async confirm() { return true; } }
    }
  }
};
const menus = new Map();
globalThis.game = {
  release: { generation: 14 },
  version: "14.367",
  system: { id: "dnd5e", version: "5.3.3" },
  user: { isGM: true },
  settings: {
    registerMenu(namespace, key, data) { menus.set(namespace + "." + key, data); }
  },
  journal: { contents: [] }
};
let createCount = 0;
globalThis.JournalEntry = {
  async create(document) {
    createCount++;
    const item = {
      ...document,
      getFlag(module, key) { return this.flags[module][key]; },
      async setFlag(module, key, value) { this.flags[module][key] = value; },
      async update(changes) {
        for (const [path, value] of Object.entries(changes)) {
          if (path === "flags.gods.records") this.flags.gods.records = value;
          if (path === "flags.gods.schema") this.flags.gods.schema = value;
        }
        return this;
      }
    };
    game.journal.contents.push(item);
    return item;
  }
};
globalThis.Handlebars = {
  escapeExpression(text) { return String(text).replaceAll("<", "&lt;"); }
};

await import("../scripts/gods.js");
assert.equal(typeof callbacks.init, "function");
assert.equal(typeof callbacks.ready, "function");

callbacks.init();
assert.equal(menus.get("gods.openCodex").restricted, true, "Only GMs see menu");
callbacks.ready();
assert.equal(game.gods.compatibility().supported, true, "Exact V14/dnd5e 5.3.3 supported");
assert.equal(typeof events.getSceneControlButtons, "function");
const controls = { tokens: { name: "tokens", tools: {} } };
events.getSceneControlButtons(controls);
assert.equal(controls.gods.visible, true, "Gods scene control is visible to GM");
assert.equal(controls.gods.tools.openCodex.button, true);
assert.equal(typeof controls.gods.onChange, "function");
assert.equal(typeof controls.gods.tools.openCodex.onChange, "function");
await game.gods.open();
assert.equal(createCount, 1);
assert.equal(game.journal.contents.length, 1);
assert.equal(game.journal.contents[0].ownership.default, 0);
assert.ok(game.journal.contents[0].flags.gods.records.length >= 30);
assert.equal(game.journal.contents[0].flags.gods.schema, 2);
await game.gods.open();
assert.equal(createCount, 1, "Never overwrite old data");

// Simulate upgrading a pre-English v0.1.1 world, preserving the GM's edits.
const { LEGACY_DEITIES } = await import("../data/legacy.js");
const db = game.journal.contents[0];
const originalSelune = LEGACY_DEITIES.find(god => god.id === "selune");
const oldSelune = db.flags.gods.records.find(god => god.id === "selune");
oldSelune.summary = originalSelune.summary;
oldSelune.title = "GM's custom title";
oldSelune.history = "GM's private custom history";
db.flags.gods.schema = 1;
await game.gods.open();
assert.equal(db.flags.gods.schema, 2, "Older world should migrate");
const newSelune = db.flags.gods.records.find(god => god.id === "selune");
assert.match(newSelune.summary, /Lady of Silver/, "Unedited old Bulgarian seed becomes English");
assert.equal(newSelune.title, "GM's custom title", "Custom fields are never overwritten");
assert.equal(newSelune.history, "GM's private custom history", "GM-authored history is preserved");
assert.equal(createCount, 1, "Existing Journal must never be recreated");

const MenuApp = menus.get("gods.openCodex").type;
assert.notEqual(new MenuApp()._canRender({}), false, "GM on correct version can render");

game.system.version = "6.0.0";
assert.equal(game.gods.compatibility().supported, false);
assert.equal(new MenuApp()._canRender({}), false);
await game.gods.open();
assert.equal(createCount, 1);
assert.match(notices.warnings.at(-1), /5\.3\.3/);

game.system.version = "5.3.2";
assert.equal(game.gods.compatibility().supported, false);
game.system.version = "5.3.3";
game.release.generation = 13;
assert.equal(game.gods.compatibility().supported, false);
game.release.generation = 15;
assert.equal(game.gods.compatibility().supported, false);
game.release.generation = 14;
game.system.id = "pf2e";
assert.equal(game.gods.compatibility().supported, false);
game.system.id = "dnd5e";
game.user.isGM = false;
const playerControls = { tokens: { name: "tokens", tools: {} } };
events.getSceneControlButtons(playerControls);
assert.equal(playerControls.gods, undefined, "No Gods scene control for players");
assert.equal(new MenuApp()._canRender({}), false);
await game.gods.open();
assert.equal(createCount, 1, "Player cannot create journal");
assert.equal(notices.errors.length, 0);

console.log("PASS: Foundry V14 + dnd5e 5.3.3; scene-controls icon GM-only; English migration preserves DM edits; incompatible versions blocked.");
