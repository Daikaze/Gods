import { SEED_DEITIES } from "../data/deities.js";
import { LEGACY_DEITIES } from "../data/legacy.js";

const MODULE = "gods";
const SUPPORTED_FOUNDRY_GENERATION = 14;
const SUPPORTED_SYSTEM_ID = "dnd5e";
const SUPPORTED_SYSTEM_VERSION = "5.3.3";
const DB_NAME = "Gods — GM Database (private)";
const IMAGE_FALLBACK = "modules/gods/assets/deities/unknown.svg";
const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const EDIT_GROUPS = [
  { title: "Identity and Portfolio", fields: [
    ["name", "Name", false], ["aliases", "Other Names and Epithets", false],
    ["title", "Divine Title", false], ["pantheon", "Pantheon / Setting", false],
    ["category", "Divine Rank / Type", false], ["alignment", "Alignment", false],
    ["domains", "Domains and Spheres of Influence", false],
    ["symbol", "Holy Symbol", false], ["plane", "Divine Realm / Plane", false],
    ["summary", "Overview", true]
  ]},
  { title: "Myths and Divine Nature", fields: [
    ["appearance", "Appearance", true], ["personality", "Personality and Motives", true],
    ["history", "History and Origins", true], ["doctrine", "Teachings and Commandments", true],
    ["powers", "Powers and Miracles", true],
    ["manifestations", "Avatars, Omens, and Signs", true]
  ]},
  { title: "Faith and Followers", fields: [
    ["worship", "Worship and Devotion", true], ["clergy", "Priests and Orders", true],
    ["followers", "Followers", true], ["temples", "Temples and Holy Places", true],
    ["holyDays", "Festivals, Prayers, and Rituals", true],
    ["offerings", "Offerings and Sacrifices", true]
  ]},
  { title: "Relationships and Adventures", fields: [
    ["allies", "Allies", true], ["enemies", "Enemies", true],
    ["relationships", "Relationships with Other Deities", true],
    ["artifacts", "Relics and Artifacts", true],
    ["blessings", "Blessings and Rewards", true],
    ["questHooks", "Adventure Hooks", true]
  ]},
  { title: "GM Only — Secrets", fields: [
    ["secrets", "Hidden Truths and Plot Twists", true],
    ["dmNotes", "GM Notes", true]
  ]}
];
const KEYS = EDIT_GROUPS.flatMap(group => group.fields.map(field => field[0]));
const DETAIL_GROUPS = EDIT_GROUPS.slice(1, -1);
const text = value => String(value ?? "").trim();
const normalize = value => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
const hasAccess = () => Boolean(game.user?.isGM);
const DATABASE_SCHEMA = 2;

/** Migrate only fields identical to the original starter pack, preserving all GM edits. */
function migrateLegacyRecords(records) {
  const originals = new Map(LEGACY_DEITIES.map(record => [record.id, record]));
  const currentSeeds = new Map(seedRecords().map(record => [record.id, record]));
  return records.map(record => {
    const legacy = originals.get(record.id);
    const replacement = currentSeeds.get(record.id);
    if (!legacy || !replacement) return record; // Preserve all custom/imported deities.
    const next = { ...record };
    for (const key of KEYS) {
      // A non-empty field manually edited or deliberately cleared stays as it was.
      if (text(record[key]) === text(legacy[key])) {
        next[key] = replacement[key];
      }
    }
    return next;
  });
}

/**
 * Supported deployment: Foundry VTT generation 14 with D&D 5e system 5.3.3.
 * Other system versions may have different behavior and are intentionally blocked.
 */
function compatibility() {
  const generation = Number(game.release?.generation ?? String(game.version ?? "").split(".")[0]);
  const system = game.system?.id ?? "";
  const version = game.system?.version ?? "";
  return {
    generation, system, version,
    supported: generation === SUPPORTED_FOUNDRY_GENERATION
      && system === SUPPORTED_SYSTEM_ID
      && version === SUPPORTED_SYSTEM_VERSION
  };
}
const isSupported = () => compatibility().supported;
const unsupportedMessage = () => {
  const { generation, system, version } = compatibility();
  return "Gods requires Foundry V14 and D&D5e 5.3.3. Current: Foundry "
    + (Number.isFinite(generation) ? "V" + generation : "unknown version")
    + ", " + (system || "unknown system") + " " + (version || "unknown version") + ".";
};
const newId = () => "deity-" + foundry.utils.randomID(16);

function cleanRecord(record = {}) {
  const cleaned = { id: text(record.id) || newId(), image: text(record.image) || IMAGE_FALLBACK };
  for (const key of KEYS) cleaned[key] = text(record[key]);
  return cleaned;
}

function seedRecords() {
  return SEED_DEITIES.map(entry => cleanRecord({
    ...entry, image: entry.image || "modules/gods/assets/deities/" + entry.id + ".svg"
  }));
}

function database() {
  return game.journal?.contents.find(j => j.getFlag(MODULE, "database") === true) || null;
}

async function ensureDatabase() {
  if (!hasAccess()) throw new Error("Gods is available to the GM only.");
  if (!isSupported()) throw new Error(unsupportedMessage());
  const existing = database();
  if (existing) {
    const schema = Number(existing.getFlag(MODULE, "schema") || 1);
    if (schema < DATABASE_SCHEMA) {
      const records = existing.getFlag(MODULE, "records") || [];
      await existing.update({
        ["flags." + MODULE + ".records"]: migrateLegacyRecords(records),
        ["flags." + MODULE + ".schema"]: DATABASE_SCHEMA
      });
      console.info("Gods | Database upgraded to schema " + DATABASE_SCHEMA + " (GM changes preserved)");
    }
    return existing;
  }
  return JournalEntry.create({
    name: DB_NAME,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags: { [MODULE]: { database: true, schema: DATABASE_SCHEMA, records: seedRecords() } }
  });
}

class GodsCodex extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gods-divine-codex", classes: ["gods-codex-window"],
    window: { title: "Gods — Divine Codex", icon: "fa-solid fa-book-open", resizable: true },
    position: { width: 1160, height: 780 },
    actions: {
      selectGod: function (_event, button) { return this.selectGod(button.dataset.id); },
      addGod: function () { return this.addGod(); },
      editGod: function () { return this.editGod(); },
      copyGod: function () { return this.copyGod(); },
      deleteGod: function () { return this.deleteGod(); },
      cancelEdit: function () { return this.cancelEdit(); },
      saveGod: function () { return this.saveGod(); },
      chooseImage: function () { return this.chooseImage(); },
      deityImageAction: function () { return this.deityImageAction(); },
      exportGods: function () { return this.exportGods(); },
      importGods: function () { return this.element.querySelector('[data-role="import-file"]')?.click(); }
    }
  };

  static PARTS = { main: { template: "modules/gods/templates/codex.hbs" } };

  constructor(...args) {
    super(...args);
    this.selectedId = null;
    this.editing = false;
    this.draft = null;
    this.search = "";
    this.pantheon = "";
    this.entries = [];
    // Both columns are independently scrollable. Keep their positions across V14 part rerenders.
    this._listScrollTop = 0;
    this._detailScrollTop = 0;
  }

  /**
   * Foundry's ApplicationV2 can replace the entire Handlebars part when a deity is selected.
   * Snapshot the old DOM before that happens, so the list cannot jump back to its first entry.
   */
  _captureScrollPositions({ resetDetails = false } = {}) {
    const list = this.element?.querySelector(".gods-list");
    const main = this.element?.querySelector(".gods-main");
    if (list) this._listScrollTop = list.scrollTop;
    if (main) this._detailScrollTop = main.scrollTop;
    if (resetDetails) this._detailScrollTop = 0;
  }

  _restoreScrollPositions() {
    const list = this.element?.querySelector(".gods-list");
    const main = this.element?.querySelector(".gods-main");
    if (list) {
      list.scrollTop = this._listScrollTop;
      list.addEventListener("scroll", () => {
        if (this.element?.querySelector(".gods-list") === list) {
          this._listScrollTop = list.scrollTop;
        }
      }, { passive: true });
    }
    if (main) {
      main.scrollTop = this._detailScrollTop;
      main.addEventListener("scroll", () => {
        if (this.element?.querySelector(".gods-main") === main) {
          this._detailScrollTop = main.scrollTop;
        }
      }, { passive: true });
    }
  }

  _canRender(options) {
    if (!hasAccess() || !isSupported()) return false;
    return super._canRender(options);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const db = await ensureDatabase();
    this.entries = (db.getFlag(MODULE, "records") || []).map(cleanRecord);
    this.entries.sort((a, b) => {
      const aCampaign = a.pantheon === "Averis";
      const bCampaign = b.pantheon === "Averis";
      if (aCampaign !== bCampaign) return aCampaign ? -1 : 1;
      return a.name.localeCompare(b.name, "en");
    });
    if (!this.selectedId || !this.entries.some(entry => entry.id === this.selectedId)) {
      this.selectedId = this.entries[0]?.id ?? null;
    }
    const selected = this.entries.find(entry => entry.id === this.selectedId) || null;
    const display = selected ? { ...selected, image: selected.image || IMAGE_FALLBACK } : null;
    const groups = display ? DETAIL_GROUPS.map(group => ({
      title: group.title, fields: group.fields.filter(field => display[field[0]]).map(field => ({
        label: field[1], value: display[field[0]]
      }))
    })).filter(group => group.fields.length) : [];
    if (display?.secrets || display?.dmNotes) {
      groups.push({
        title: "GM Only — Secrets",
        fields: [["secrets", "Hidden Truths"], ["dmNotes", "GM Notes"]]
          .filter(field => display[field[0]]).map(field => ({ label: field[1], value: display[field[0]] }))
      });
    }
    const edited = this.draft || display || cleanRecord({ pantheon: "Averis" });
    const editGroups = EDIT_GROUPS.map(group => ({
      title: group.title,
      fields: group.fields.map(field => ({
        key: field[0], label: field[1], multiline: field[2],
        value: edited[field[0]] || ""
      }))
    }));
    return {
      ...context, editing: this.editing, entries: this.entries.map(entry => ({
        ...entry, active: entry.id === this.selectedId
      })), selected: display, groups, editGroups,
      image: edited.image, search: this.search, pantheon: this.pantheon,
      pantheons: [...new Set(this.entries.map(entry => entry.pantheon).filter(Boolean))].sort(),
      total: this.entries.length
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector('[data-role="search"]')?.addEventListener("input", event => {
      this.search = event.currentTarget.value;
      this.filterList();
    });
    this.element.querySelector('[data-role="pantheon"]')?.addEventListener("change", event => {
      this.pantheon = event.currentTarget.value;
      this.filterList();
    });
    this.element.querySelector('[data-role="import-file"]')?.addEventListener("change", event => {
      void this.importGods(event.currentTarget);
    });
    this.element.querySelector('[data-gods-editor]')?.addEventListener("submit", event => {
      event.preventDefault();
      void this.saveGod();
    });
    this.element.querySelectorAll(".gods-portrait").forEach(image => {
      image.addEventListener("error", () => { if (!image.src.endsWith("/unknown.svg")) image.src = IMAGE_FALLBACK; }, { once: true });
    });
    this.filterList();
    this._restoreScrollPositions();
  }

  filterList() {
    if (!this.element || !hasAccess()) return;
    const query = normalize(this.search);
    let count = 0;
    for (const button of this.element.querySelectorAll("[data-action='selectGod']")) {
      const entry = this.entries.find(item => item.id === button.dataset.id);
      if (!entry) continue;
      const matches = (!this.pantheon || this.pantheon === entry.pantheon)
        && (!query || normalize(Object.values(entry).join(" ")).includes(query));
      button.hidden = !matches;
      if (matches) count++;
    }
    const counter = this.element.querySelector("[data-role='result-count']");
    if (counter) counter.textContent = count + " / " + this.entries.length;
    const empty = this.element.querySelector("[data-role='empty-results']");
    if (empty) empty.hidden = count > 0;
  }

  selectGod(id) {
    if (!hasAccess()) return;
    if (!this.editing && this.selectedId === id) return; // No needless scroll-changing render.
    this._captureScrollPositions({ resetDetails: true });
    this.selectedId = id;
    this.editing = false;
    this.draft = null;
    return this.render();
  }

  addGod() {
    if (!hasAccess()) return;
    this._captureScrollPositions({ resetDetails: true });
    this.draft = cleanRecord({ id: newId(), pantheon: "Averis", category: "Deity" });
    this.editing = true;
    return this.render();
  }

  editGod() {
    if (!hasAccess()) return;
    this._captureScrollPositions({ resetDetails: true });
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    this.draft = { ...selected };
    this.editing = true;
    return this.render();
  }

  copyGod() {
    if (!hasAccess()) return;
    this._captureScrollPositions({ resetDetails: true });
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    this.draft = { ...selected, id: newId(), name: selected.name + " (copy)" };
    this.editing = true;
    return this.render();
  }

  cancelEdit() {
    this._captureScrollPositions({ resetDetails: true });
    this.draft = null;
    this.editing = false;
    return this.render();
  }

  async chooseImage() {
    if (!hasAccess()) return;
    const imageInput = this.element.querySelector('input[name="image"]');
    if (!imageInput) return;
    const FilePicker = foundry.applications.apps.FilePicker.implementation;
    new FilePicker({
      type: "image", current: imageInput.value,
      callback: path => {
        imageInput.value = path;
        const preview = this.element.querySelector("[data-role='image-preview']");
        if (preview) preview.src = path;
      }
    }).render({ force: true });
  }

  async persist(change) {
    if (!hasAccess()) throw new Error("Only the GM can save deity records.");
    const db = await ensureDatabase();
    const current = (db.getFlag(MODULE, "records") || []).map(cleanRecord);
    const updated = change(current);
    await db.setFlag(MODULE, "records", updated);
  }

  async saveGod() {
    if (!hasAccess() || !this.editing || !this.draft) return;
    const form = this.element.querySelector("[data-gods-editor]");
    if (!form) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const updated = cleanRecord({ ...values, id: this.draft.id });
    if (!updated.name) {
      ui.notifications.warn("Enter a deity name.");
      form.querySelector('[name="name"]')?.focus();
      return;
    }
    try {
      await this.persist(records => {
        const index = records.findIndex(entry => entry.id === updated.id);
        if (index >= 0) records[index] = updated;
        else records.push(updated);
        return records;
      });
      this.selectedId = updated.id;
      this.editing = false;
      this.draft = null;
      ui.notifications.info("Deity saved.");
      await this.render();
    } catch (error) {
      console.error("Gods | Failed to save deity", error);
      ui.notifications.error("Could not save the deity. Check the console.");
    }
  }

  async deleteGod() {
    if (!hasAccess()) return;
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    const confirmed = await DialogV2.confirm({
      window: { title: "Delete Deity" },
      content: "<p>Delete <strong>" + Handlebars.escapeExpression(selected.name) + "</strong>? This cannot be undone.</p>",
      rejectClose: false
    });
    if (!confirmed) return;
    try {
      await this.persist(records => records.filter(entry => entry.id !== selected.id));
      this.selectedId = null;
      await this.render();
      ui.notifications.info("Deity deleted.");
    } catch (error) {
      console.error("Gods | Delete failed", error);
      ui.notifications.error("Could not delete the deity.");
    }
  }

  getSelectedDeity() {
    return this.entries.find(entry => entry.id === this.selectedId) || null;
  }

  async deityImageAction() {
    if (!hasAccess() || !isSupported()) return;
    const deity = this.getSelectedDeity();
    if (!deity) return;

    // Only the public-facing name and image are shown. Never expose hidden GM fields.
    const name = deity.name || "Deity";
    const src = deity.image || IMAGE_FALLBACK;
    const escapedName = Handlebars.escapeExpression(name);
    const escapedSrc = Handlebars.escapeExpression(src);
    try {
      const choice = await DialogV2.wait({
        window: { title: name + " — Image Actions" },
        content: `<div class="gods-image-menu">
          <p>Choose how to display <strong>${escapedName}</strong>'s portrait.</p>
          <img class="gods-image-menu-preview" alt="${escapedName}" src="${escapedSrc}">
        </div>`,
        buttons: [
          { action: "open", label: "Open Image", icon: "fa-solid fa-up-right-from-square" },
          { action: "chat", label: "Send to Chat", icon: "fa-solid fa-comments" },
          { action: "players", label: "Show to Players", icon: "fa-solid fa-eye" },
          { action: "cancel", label: "Cancel", icon: "fa-solid fa-xmark" }
        ],
        rejectClose: false
      });
      if (choice === "open") {
        await this.openDeityImage(src, name, false);
      } else if (choice === "chat") {
        await this.sendDeityImageToChat(src, name);
        ui.notifications.info(name + " image sent to the public chat.");
      } else if (choice === "players") {
        await this.openDeityImage(src, name, true);
        ui.notifications.info(name + " image shared with connected players.");
      }
    } catch (error) {
      console.error("Gods | Image action failed", error);
      ui.notifications.error("Unable to display or share this deity image. Check the console.");
    }
  }

  async openDeityImage(src, title, showPlayers = false) {
    if (!hasAccess() || !isSupported()) return;
    // Foundry V14 takes ONE options object, unlike legacy ImagePopout versions.
    const ImagePopout = foundry.applications.apps.ImagePopout;
    const popout = new ImagePopout({ src, window: { title } });
    await popout.render(true);
    if (showPlayers) popout.shareImage();
  }

  async sendDeityImageToChat(src, title) {
    if (!hasAccess() || !isSupported()) return;
    const safeTitle = Handlebars.escapeExpression(title);
    const safeSrc = Handlebars.escapeExpression(src);
    // Force public delivery even when the GM's roll mode is set to whisper.
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: "Divine Codex" }),
      whisper: [],
      blind: false,
      content: `<div class="gods-chat-portrait"><h3>${safeTitle}</h3>
        <img alt="${safeTitle}" src="${safeSrc}" style="max-width:100%;height:auto;border-radius:7px;"></div>`
    });
  }

  exportGods() {
    if (!hasAccess()) return;
    const payload = JSON.stringify({ format: "gods-codex", version: 1, records: this.entries }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gods-gm-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async importGods(input) {
    if (!hasAccess()) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (json.format !== "gods-codex" || !Array.isArray(json.records)) {
        throw new Error("File is not a Gods Codex backup.");
      }
      if (json.records.length > 1000) throw new Error("Too many entries.");
      const imported = json.records.map(entry => cleanRecord({
        ...entry, id: text(entry.id) || newId()
      })).filter(entry => entry.name);
      await this.persist(records => {
        const merged = new Map(records.map(entry => [entry.id, entry]));
        for (const entry of imported) merged.set(entry.id, entry);
        return [...merged.values()];
      });
      ui.notifications.info("Imported or updated: " + imported.length + " deity records.");
      await this.render();
    } catch (error) {
      console.error("Gods | Import failed", error);
      ui.notifications.error("Could not import the selected file.");
    }
  }
}

let codex = null;
async function openCodex() {
  if (!hasAccess()) return;
  if (!isSupported()) {
    ui.notifications.warn(unsupportedMessage());
    return;
  }
  try {
    await ensureDatabase();
    if (!codex || !codex.rendered) codex = new GodsCodex();
    await codex.render({ force: true });
    codex.bringToFront();
  } catch (error) {
    console.error("Gods | Failed to open Codex", error);
    ui.notifications.error("Unable to open Gods. Check the console.");
  }
}

// Native Foundry V14 Scene Controls — matching the two-column toolbar.
Hooks.on("getSceneControlButtons", controls => {
  if (!hasAccess() || !isSupported()) return;
  controls.gods = {
    name: "gods",
    title: "Gods — Divine Codex",
    icon: "fa-solid fa-book-open",
    order: Object.keys(controls).length + 50,
    visible: true,
    onChange: (_event, active) => { if (active) void openCodex(); },
    tools: {
      openCodex: {
        name: "openCodex",
        title: "Open Divine Codex",
        icon: "fa-solid fa-sun",
        order: 0,
        button: true,
        visible: true,
        onChange: () => { void openCodex(); }
      }
    }
  };
});

Hooks.once("init", () => {
  game.settings.registerMenu(MODULE, "openCodex", {
    name: "Gods — Divine Codex",
    label: "Open Divine Codex",
    hint: "GM-only searchable library of deities and secret campaign lore.",
    icon: "fa-solid fa-book-open",
    type: GodsCodex,
    restricted: true
  });
});
Hooks.once("ready", () => {
  if (!hasAccess()) return;
  game.gods = Object.freeze({ open: openCodex, compatibility });
  if (!isSupported()) {
    ui.notifications.warn(unsupportedMessage());
    return;
  }
  console.info("Gods | Foundry V14 + D&D5e 5.3.3 ready for GM");
});
