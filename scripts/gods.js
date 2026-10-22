import { SEED_DEITIES } from "../data/deities.js";

const MODULE = "gods";
const DB_NAME = "Gods — GM Database (private)";
const IMAGE_FALLBACK = "modules/gods/assets/deities/unknown.svg";
const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const EDIT_GROUPS = [
  { title: "Основна информация", fields: [
    ["name", "Име", false], ["aliases", "Други имена / титли", false],
    ["title", "Титла", false], ["pantheon", "Пантеон / свят", false],
    ["category", "Вид / ранг", false], ["alignment", "Alignment", false],
    ["domains", "Домейни и сфери на влияние", false],
    ["symbol", "Свещен символ", false], ["plane", "Дом / план", false],
    ["summary", "Кратко описание", true]
  ]},
  { title: "Легенди и същност", fields: [
    ["appearance", "Външен вид", true], ["personality", "Характер и мотиви", true],
    ["history", "История и произход", true], ["doctrine", "Учение / заповеди", true],
    ["powers", "Сили, проявления и чудеса", true],
    ["manifestations", "Аватари и знамения", true]
  ]},
  { title: "Вяра и последователи", fields: [
    ["worship", "Как се почита", true], ["clergy", "Жреци и ордени", true],
    ["followers", "Последователи", true], ["temples", "Храмове и свети места", true],
    ["holyDays", "Празници, молитви, ритуали", true],
    ["offerings", "Дарове и жертвоприношения", true]
  ]},
  { title: "Връзки и приключения", fields: [
    ["allies", "Съюзници", true], ["enemies", "Врагове", true],
    ["relationships", "Връзки с други богове", true],
    ["artifacts", "Реликви и артефакти", true],
    ["blessings", "Благословии и награди", true],
    ["questHooks", "Идеи за куестове", true]
  ]},
  { title: "Само за DM — тайни", fields: [
    ["secrets", "Скрита истина / сюжетни обрати", true],
    ["dmNotes", "DM бележки", true]
  ]}
];
const KEYS = EDIT_GROUPS.flatMap(group => group.fields.map(field => field[0]));
const DETAIL_GROUPS = EDIT_GROUPS.slice(1, -1);
const text = value => String(value ?? "").trim();
const normalize = value => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
const hasAccess = () => Boolean(game.user?.isGM);
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
  if (!hasAccess()) throw new Error("Gods е достъпен само за GM.");
  const existing = database();
  if (existing) return existing;
  return JournalEntry.create({
    name: DB_NAME,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags: { [MODULE]: { database: true, schema: 1, records: seedRecords() } }
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
  }

  _canRender(options) {
    return hasAccess() && super._canRender(options);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const db = await ensureDatabase();
    this.entries = (db.getFlag(MODULE, "records") || []).map(cleanRecord);
    this.entries.sort((a, b) => {
      const aCampaign = a.pantheon === "Averis";
      const bCampaign = b.pantheon === "Averis";
      if (aCampaign !== bCampaign) return aCampaign ? -1 : 1;
      return a.name.localeCompare(b.name, "bg");
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
        title: "Само за DM — тайни",
        fields: [["secrets", "Скрита истина"], ["dmNotes", "DM бележки"]]
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
    this.selectedId = id;
    this.editing = false;
    this.draft = null;
    return this.render();
  }

  addGod() {
    if (!hasAccess()) return;
    this.draft = cleanRecord({ id: newId(), pantheon: "Averis", category: "Божество" });
    this.editing = true;
    return this.render();
  }

  editGod() {
    if (!hasAccess()) return;
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    this.draft = { ...selected };
    this.editing = true;
    return this.render();
  }

  copyGod() {
    if (!hasAccess()) return;
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    this.draft = { ...selected, id: newId(), name: selected.name + " (копие)" };
    this.editing = true;
    return this.render();
  }

  cancelEdit() {
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
    if (!hasAccess()) throw new Error("Само GM може да записва.");
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
      ui.notifications.warn("Въведи име на божеството.");
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
      ui.notifications.info("Божеството е записано.");
      await this.render();
    } catch (error) {
      console.error("Gods | Failed to save deity", error);
      ui.notifications.error("Неуспешен запис. Провери конзолата.");
    }
  }

  async deleteGod() {
    if (!hasAccess()) return;
    const selected = this.entries.find(entry => entry.id === this.selectedId);
    if (!selected) return;
    const confirmed = await DialogV2.confirm({
      window: { title: "Изтриване на божество" },
      content: "<p>Да изтрия ли <strong>" + Handlebars.escapeExpression(selected.name) + "</strong>? Това не може да се върне.</p>",
      rejectClose: false
    });
    if (!confirmed) return;
    try {
      await this.persist(records => records.filter(entry => entry.id !== selected.id));
      this.selectedId = null;
      await this.render();
      ui.notifications.info("Божеството е изтрито.");
    } catch (error) {
      console.error("Gods | Delete failed", error);
      ui.notifications.error("Неуспешно изтриване.");
    }
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
      ui.notifications.info("Импортирани/обновени записи: " + imported.length);
      await this.render();
    } catch (error) {
      console.error("Gods | Import failed", error);
      ui.notifications.error("Файлът не може да се импортира.");
    }
  }
}

let codex = null;
async function openCodex() {
  if (!hasAccess()) return;
  try {
    await ensureDatabase();
    if (!codex || !codex.rendered) codex = new GodsCodex();
    await codex.render({ force: true });
    codex.bringToFront();
  } catch (error) {
    console.error("Gods | Failed to open Codex", error);
    ui.notifications.error("Gods не може да се отвори. Провери конзолата.");
  }
}

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
  game.gods = Object.freeze({ open: openCodex });
  console.info("Gods | Divine Codex ready for GM");
});
