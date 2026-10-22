// Version-specific runtime checks using mocked Foundry V14 APIs.
// This is not a replacement for manually testing in a live Foundry world.
import assert from "node:assert/strict";

const callbacks = {};
globalThis.Hooks = {
  once(event, callback) { callbacks[event] = callback; },
  on() {}
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
      async setFlag(module, key, value) { this.flags[module][key] = value; }
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
await game.gods.open();
assert.equal(createCount, 1);
assert.equal(game.journal.contents.length, 1);
assert.equal(game.journal.contents[0].ownership.default, 0);
assert.ok(game.journal.contents[0].flags.gods.records.length >= 30);
await game.gods.open();
assert.equal(createCount, 1, "Never overwrite old data");

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
assert.equal(new MenuApp()._canRender({}), false);
await game.gods.open();
assert.equal(createCount, 1, "Player cannot create journal");
assert.equal(notices.errors.length, 0);

console.log("PASS: Foundry V14 + dnd5e 5.3.3; blocked wrong core, wrong system versions, and players; data preserved.");
