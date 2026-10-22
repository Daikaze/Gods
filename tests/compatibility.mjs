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
  _onRender() {}
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

// Regression: clicking a deity after scrolling down the list must NOT reset it to the first item.
const makeScrollable = (start = 0) => ({
  scrollTop: start,
  listeners: {},
  addEventListener(event, handler) { this.listeners[event] = handler; },
  scrollTo(top) { this.scrollTop = top; },
  simulateScroll(top) { this.scrollTop = top; this.listeners.scroll?.(); }
});
const makeShell = (list, details) => ({
  querySelector(selector) {
    if (selector === ".gods-list") return list;
    if (selector === ".gods-main") return details;
    return null;
  },
  querySelectorAll() { return []; }
});

const nav = new MenuApp();
nav.entries = db.flags.gods.records.map(god => ({ ...god }));
nav.selectedId = "selune";
nav.search = "moon";
nav.pantheon = "Averis";
const oldList = makeScrollable(620);
const oldDetail = makeScrollable(850);
nav.element = makeShell(oldList, oldDetail);
await nav.selectGod("fujin");
assert.equal(nav.selectedId, "fujin");
assert.equal(nav._listScrollTop, 620, "Scroll position must be captured before render");
assert.equal(nav._detailScrollTop, 0, "New deity details should start at the top");
const newList = makeScrollable(0);
const newDetail = makeScrollable(0);
nav.element = makeShell(newList, newDetail);
nav._onRender({}, {});
assert.equal(newList.scrollTop, 620, "List should return to precisely its former scroll offset");
assert.equal(newDetail.scrollTop, 0, "New deity profile should open at its start");
assert.equal(nav.search, "moon", "Search input persists");
assert.equal(nav.pantheon, "Averis", "Pantheon filter persists");
newList.simulateScroll(730);
newDetail.simulateScroll(315);
const reopenedList = makeScrollable(0);
const reopenedDetail = makeScrollable(0);
nav.element = makeShell(reopenedList, reopenedDetail);
nav._onRender({}, {});
assert.equal(reopenedList.scrollTop, 730, "List stays in place after re-opening the window");
assert.equal(reopenedDetail.scrollTop, 315, "Detail scroll also survives a plain rerender");
// Clicking the already-selected deity must not force any rerender.
const priorRenderFlag = nav.rendered;
await nav.selectGod("fujin");
assert.equal(nav.rendered, priorRenderFlag);

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

console.log("PASS: Foundry V14 + dnd5e 5.3.3; scene-controls icon GM-only; deity scroll persists; English migration preserves DM edits; incompatible versions blocked.");
