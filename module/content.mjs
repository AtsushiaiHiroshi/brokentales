const LIBRARY_PATH = "systems/broken-tales/content/library.json";
const IMPORT_FLAG = "librarySlug";
const SUPPORT_FLAG = "supportSlug";
const DARK_PRESENCE_FLAG = "darkPresenceSlug";
const DARK_PRESENCES_PACK = "broken-tales.dark-presences";
const CANON_ACTOR_PACKS = [
  "broken-tales.hunters",
  "broken-tales.dark-presences",
  "broken-tales.scenario-actors",
  "broken-tales-broken-ones.broken-ones-hunters",
  "broken-tales-broken-ones.broken-ones-actors",
  "broken-tales-lost-stories.lost-stories-hunters",
  "broken-tales-lost-stories.lost-stories-actors",
  "broken-tales-lost-stories.lost-stories-dark-presences"
];

const SUPPORT_ITEMS = [
  {
    slug: "scenario-gifts",
    name: "Dones de escenario",
    type: "storyElement",
    img: "icons/svg/aura.svg",
    description: "<p>Indice local para Dones de escenario. Revisa los Journals importados de resumen de escenario, pantalla del Narrador, Core Book, The Broken Ones y Lost Stories.</p>"
  },
  {
    slug: "objects-equipment",
    name: "Objetos y equipamiento",
    type: "equipment",
    img: "icons/svg/item-bag.svg",
    description: "<p>Indice local para objetos, equipo de Cazador, equipo especial y objetos narrativos. El detalle oficial esta en las hojas importadas y en los libros enlazados.</p>"
  },
  {
    slug: "order-treasure",
    name: "Tesoro de la Orden",
    type: "storyElement",
    img: "icons/svg/chest.svg",
    description: "<p>Indice local para el Tesoro de la Orden de The Broken Ones.</p>"
  },
  {
    slug: "broken-europe-map",
    name: "Mapa de Europa Rota",
    type: "storyElement",
    img: "icons/svg/map.svg",
    description: "<p>Referencia al mapa incluido en la biblioteca local importada.</p>"
  },
  {
    slug: "villagers",
    name: "Aldeanos",
    type: "storyElement",
    img: "icons/svg/village.svg",
    description: "<p>Indice local para The Village y la hoja de Aldeano de The Broken Ones.</p>"
  },
  {
    slug: "spirits-essences",
    name: "Espiritus y esencias",
    type: "storyElement",
    img: "icons/svg/angel.svg",
    description: "<p>Indice local para espiritus, esencias, almas, virtudes y entidades incorporeas. Usa el tipo de Actor Espiritu / Esencia para modelarlas.</p>"
  }
];

const REFERENCE_ACTORS = [
  {
    slug: "reference-threat",
    name: "Amenaza - plantilla",
    type: "threat",
    img: "icons/svg/cowled.svg",
    system: {
      details: {
        concept: "Amenaza",
        origin: "Biblioteca local",
        role: "Amenaza / PNJ complejo",
        notes: "<p>Usa esta plantilla para trasladar amenazas desde los escenarios importados en Journals.</p>"
      },
      threat: {
        rank: "Media",
        impulse: "",
        oppositionLevel: 5
      }
    }
  },
  {
    slug: "reference-npc",
    name: "PNJ - plantilla",
    type: "npc",
    img: "icons/svg/mystery-man.svg",
    system: {
      details: {
        concept: "PNJ",
        origin: "Biblioteca local",
        role: "PNJ",
        notes: "<p>Usa esta plantilla para PNJ principales o menores de los escenarios importados.</p>"
      }
    }
  },
  {
    slug: "reference-villager",
    name: "Aldeano - plantilla",
    type: "villager",
    img: "icons/svg/mystery-man.svg",
    system: {
      details: {
        concept: "The Village",
        origin: "The Broken Ones",
        role: "Aldeano",
        notes: "<p>Usa esta plantilla junto con la hoja de Aldeano importada.</p>"
      }
    }
  },
  {
    slug: "reference-essence",
    name: "Espiritu / Esencia - plantilla",
    type: "essence",
    img: "icons/svg/angel.svg",
    system: {
      details: {
        concept: "Entidad incorporea",
        origin: "Biblioteca local",
        role: "Espiritu / Esencia",
        notes: "<p>Usa esta plantilla para espiritus, esencias, almas, virtudes o entidades incorporeas.</p>"
      },
      essence: {
        nature: "",
        anchor: "",
        manifestation: ""
      }
    }
  }
];

function html(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text) {
  const clean = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!clean) return "<p><em>No extractable text on this page. Use the linked PDF page.</em></p>";
  return clean
    .split(/\n{2,}/)
    .map((block) => `<p>${html(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function getOrCreateFolder({ name, type, parent = null }) {
  const existing = game.folders.find((folder) => (
    folder.name === name
    && folder.type === type
    && (folder.folder?.id ?? folder.folder ?? null) === parent
  ));
  if (existing) return existing;
  const FolderClass = Folder.implementation ?? Folder;
  return FolderClass.create({ name, type, folder: parent });
}

function buildJournalPages(book) {
  const pages = [
    {
      name: "PDF local",
      type: "text",
      text: {
        format: 1,
        content: [
          `<h1>${html(book.title)}</h1>`,
          `<p><strong>Archivo:</strong> ${html(book.fileName)}</p>`,
          `<p><strong>Paginas:</strong> ${book.pageCount}</p>`,
          `<p><a href="${html(book.assetPath)}" target="_blank" rel="noopener">Abrir PDF dentro de Foundry</a></p>`,
          book.notes ? `<p>${html(book.notes)}</p>` : ""
        ].join("")
      }
    }
  ];

  for (const page of book.pages) {
    pages.push({
      name: `Pagina ${page.number}`,
      type: "text",
      text: {
        format: 1,
        content: [
          `<h2>${html(book.title)} - Pagina ${page.number}</h2>`,
          paragraphs(page.text)
        ].join("")
      }
    });
  }

  return pages;
}

async function importBook(book, folder, overwrite) {
  const existing = game.journal.find((entry) => entry.getFlag("broken-tales", IMPORT_FLAG) === book.slug);
  if (existing && !overwrite) return { status: "skipped", document: existing };
  if (existing && overwrite) await existing.delete();

  const JournalClass = JournalEntry.implementation ?? JournalEntry;
  const document = await JournalClass.create({
    name: book.title,
    folder: folder.id,
    pages: buildJournalPages(book),
    flags: {
      "broken-tales": {
        [IMPORT_FLAG]: book.slug,
        category: book.category,
        sourceFile: book.fileName,
        sourcePath: book.originalPath
      }
    }
  });

  return { status: "created", document };
}

export async function importLibrary({ category = "all", overwrite = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn("Only a GM can import the Broken Tales library.");
    return [];
  }

  const response = await fetch(LIBRARY_PATH);
  const library = await response.json();
  const root = await getOrCreateFolder({ name: "Broken Tales", type: "JournalEntry" });
  const imported = [];
  const skipped = [];

  for (const book of library.books.filter((entry) => category === "all" || entry.category === category)) {
    const folder = await getOrCreateFolder({ name: book.category, type: "JournalEntry", parent: root.id });
    const result = await importBook(book, folder, overwrite);
    if (result.status === "created") imported.push(result.document);
    else skipped.push(result.document);
  }

  ui.notifications.info(`Broken Tales library: ${imported.length} created, ${skipped.length} skipped.`);
  return imported;
}

export async function createLibraryImportMacro() {
  if (!game.user.isGM) return null;
  const name = "Import Broken Tales Library";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  return Macro.create({
    name,
    type: "script",
    img: "icons/svg/book.svg",
    command: "await game.brokenTales.importLibrary();"
  });
}

export async function importSupportItems({ overwrite = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn("Only a GM can import Broken Tales support items.");
    return [];
  }

  const folder = await getOrCreateFolder({ name: "Broken Tales - Dones, objetos y apoyo", type: "Item" });
  const ItemClass = Item.implementation ?? Item;
  const created = [];
  const skipped = [];

  for (const entry of SUPPORT_ITEMS) {
    const existing = game.items.find((item) => item.getFlag("broken-tales", SUPPORT_FLAG) === entry.slug);
    if (existing && !overwrite) {
      skipped.push(existing);
      continue;
    }
    if (existing && overwrite) await existing.delete();
    created.push(await ItemClass.create({
      name: entry.name,
      type: entry.type,
      img: entry.img,
      folder: folder.id,
      system: {
        description: entry.description,
        notes: "Contenido de apoyo local. Ver Journals importados para el texto oficial completo."
      },
      flags: {
        "broken-tales": {
          [SUPPORT_FLAG]: entry.slug
        }
      }
    }));
  }

  ui.notifications.info(`Broken Tales support items: ${created.length} created, ${skipped.length} skipped.`);
  return created;
}

export async function createSupportImportMacro() {
  if (!game.user.isGM) return null;
  const name = "Import Broken Tales Support Items";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/aura.svg",
    command: "await game.brokenTales.importSupportItems();"
  });
}

export async function importReferenceActors({ overwrite = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn("Only a GM can import Broken Tales reference actors.");
    return [];
  }

  const folder = await getOrCreateFolder({ name: "Broken Tales - Amenazas, aldeanos y esencias", type: "Actor" });
  const ActorClass = Actor.implementation ?? Actor;
  const created = [];
  const skipped = [];

  for (const entry of REFERENCE_ACTORS) {
    const existing = game.actors.find((actor) => actor.getFlag("broken-tales", SUPPORT_FLAG) === entry.slug);
    if (existing && !overwrite) {
      skipped.push(existing);
      continue;
    }
    if (existing && overwrite) await existing.delete();
    created.push(await ActorClass.create({
      ...entry,
      folder: folder.id,
      flags: {
        "broken-tales": {
          [SUPPORT_FLAG]: entry.slug
        }
      }
    }));
  }

  ui.notifications.info(`Broken Tales reference actors: ${created.length} created, ${skipped.length} skipped.`);
  return created;
}

export async function createReferenceActorsImportMacro() {
  if (!game.user.isGM) return null;
  const name = "Import Broken Tales Reference Actors";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/cowled.svg",
    command: "await game.brokenTales.importReferenceActors();"
  });
}

function cleanPackActor(document) {
  const data = document.toObject();
  delete data._id;
  data.folder = null;
  localizePackDocumentData(data);
  for (const item of data.items ?? []) {
    delete item._id;
    item.folder = null;
    localizePackDocumentData(item);
  }
  return data;
}

function activeContentLanguage() {
  const normalize = (value) => String(value ?? "").toLowerCase();
  const resolve = (value) => {
    const normalized = normalize(value);
    if (normalized === "es" || normalized.startsWith("es-") || normalized === "spanish" || normalized === "español") return "es";
    if (normalized === "en" || normalized.startsWith("en-") || normalized === "english" || normalized === "inglés") return "en";
    return "";
  };

  try {
    const core = resolve(game.settings.get("core", "language"));
    if (core) return core;

    const configuredRaw = normalize(game.settings.get("broken-tales", "contentLanguage"));
    const configured = resolve(configuredRaw);
    if (configured && configuredRaw !== "system") return configured;
  } catch (_error) {
    // Settings can be unavailable during early initialization.
  }

  const i18n = resolve(game.i18n?.lang);
  if (i18n) return i18n;

  const system = resolve(game.brokenTales?.contentLanguage?.());
  if (system) return system;

  return "en";
}

function mergePlainObject(target, source) {
  const output = { ...(target ?? {}) };
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = mergePlainObject(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function localizePackDocumentData(data) {
  const language = activeContentLanguage();
  if (!language || language === "en") return data;

  const translation = data.flags?.["broken-tales"]?.translations?.[language];
  if (!translation) return data;

  if (translation.name) data.name = translation.name;
  if (translation.img) data.img = translation.img;
  if (translation.system) data.system = mergePlainObject(data.system, translation.system);
  if (translation.description) data.system = mergePlainObject(data.system, { description: translation.description });
  if (translation.descriptor) data.system = mergePlainObject(data.system, { descriptor: translation.descriptor });
  if (translation.trigger) data.system = mergePlainObject(data.system, { trigger: translation.trigger });
  return data;
}

function compactName(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function localizedNames(document) {
  const names = new Set([compactName(document.name)]);
  const translations = document.flags?.["broken-tales"]?.translations ?? {};
  for (const translation of Object.values(translations)) {
    if (translation?.name) names.add(compactName(translation.name));
  }
  return names;
}

async function loadPackActors(packId) {
  const pack = game.packs.get(packId);
  if (!pack) throw new Error(`Missing compendium pack: ${packId}`);
  return pack.getDocuments();
}

async function loadAvailableCanonActors() {
  const documents = [];
  for (const packId of CANON_ACTOR_PACKS) {
    const pack = game.packs.get(packId);
    if (!pack) continue;
    documents.push(...await pack.getDocuments());
  }
  return documents;
}

function worldActorMatchesPackActor(actor, packActor) {
  if (actor.type !== packActor.type) return false;
  const actorNames = localizedNames(actor);
  const packNames = localizedNames(packActor);
  if ([...actorNames].some((name) => packNames.has(name))) return true;

  const worldFlags = actor.flags?.["broken-tales"] ?? {};
  const packFlags = packActor.flags?.["broken-tales"] ?? {};
  return Object.entries(packFlags).some(([key, value]) => value && worldFlags[key] === value);
}

async function refreshActorFromPack(actor, packActor) {
  const data = cleanPackActor(packActor);
  const itemIds = actor.items.map((item) => item.id);
  if (itemIds.length) await actor.deleteEmbeddedDocuments("Item", itemIds);

  const update = {
    name: data.name,
    img: data.img,
    system: data.system,
    flags: {
      ...actor.flags,
      "broken-tales": {
        ...(actor.flags?.["broken-tales"] ?? {}),
        ...(data.flags?.["broken-tales"] ?? {})
      }
    }
  };
  await actor.update(update);
  if (data.items?.length) await actor.createEmbeddedDocuments("Item", data.items);
}

export async function syncWorldActorsFromCompendia({
  cleanupDuplicates = true,
  importMissing = false,
  replaceExisting = false
} = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Notifications.GMOnly"));
    return { updated: 0, created: 0, replaced: 0, unmatched: 0 };
  }

  const canonActors = await loadAvailableCanonActors();
  const updated = [];
  const created = [];
  const replaced = [];
  const unmatched = [];
  const usedCanonActors = new Set();
  const ActorClass = Actor.implementation ?? Actor;

  for (const actor of game.actors.filter(isBrokenTalesActor)) {
    const packActor = canonActors.find((candidate) => worldActorMatchesPackActor(actor, candidate));
    if (!packActor) {
      unmatched.push(actor.name);
      continue;
    }
    usedCanonActors.add(packActor);
    if (replaceExisting) {
      const data = cleanPackActor(packActor);
      const folder = actor.folder?.id ?? null;
      await actor.delete();
      created.push(await ActorClass.create({ ...data, folder }));
      replaced.push(data.name);
      continue;
    }
    await refreshActorFromPack(actor, packActor);
    updated.push(actor.name);
  }

  if (importMissing) {
    const existingActors = game.actors.filter(isBrokenTalesActor);
    for (const packActor of canonActors) {
      if (usedCanonActors.has(packActor)) continue;
      if (existingActors.some((actor) => worldActorMatchesPackActor(actor, packActor))) continue;
      created.push(await ActorClass.create(cleanPackActor(packActor)));
    }
  }

  if (cleanupDuplicates) await cleanupDuplicateActors();
  ui.notifications.info(game.i18n.format("BROKENTALES.Notifications.WorldActorsSynced", {
    updated: updated.length + replaced.length + created.length,
    unmatched: unmatched.length
  }));
  return {
    updated: updated.length,
    created: created.length,
    replaced: replaced.length,
    unmatched: unmatched.length,
    unmatchedNames: unmatched
  };
}

export async function importDarkPresences({ overwrite = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Notifications.GMOnly"));
    return [];
  }

  const packActors = await loadPackActors(DARK_PRESENCES_PACK);
  const ActorClass = Actor.implementation ?? Actor;
  const created = [];
  const skipped = [];

  for (const packActor of packActors) {
    const slug = packActor.getFlag("broken-tales", DARK_PRESENCE_FLAG);
    const existing = game.actors.filter((actor) => (
      actor.type === "threat"
      && (
        actor.getFlag("broken-tales", DARK_PRESENCE_FLAG) === slug
        || actor.name === packActor.name
      )
    ));
    const shouldReplace = overwrite || existing.length > 1;
    if (existing.length && !shouldReplace) {
      skipped.push(...existing);
      continue;
    }
    if (shouldReplace) {
      for (const actor of existing) await actor.delete();
    }
    created.push(await ActorClass.create(cleanPackActor(packActor)));
  }

  ui.notifications.info(game.i18n.format("BROKENTALES.Notifications.DarkPresencesImported", {
    created: created.length,
    skipped: skipped.length
  }));
  return created;
}

export async function repairDarkPresences() {
  return importDarkPresences({ overwrite: true });
}

function actorContentScore(actor) {
  let score = 0;
  for (const item of actor.items ?? []) {
    const text = [
      item.name,
      item.system?.description,
      item.system?.positive,
      item.system?.trigger
    ].join(" ");
    score += String(text).replace(/<[^>]*>/g, "").trim().length;
  }
  score += String(actor.system?.details?.notes ?? "").replace(/<[^>]*>/g, "").trim().length;
  return score;
}

function isBrokenTalesActor(actor) {
  return actor.system?.schema?.name === "broken-tales"
    || Object.keys(actor.flags?.["broken-tales"] ?? {}).length > 0
    || ["hunter", "threat", "npc", "villager", "essence"].includes(actor.type);
}

function actorDuplicateKeys(actor) {
  const flags = actor.flags?.["broken-tales"] ?? {};
  const flaggedKey = flags.ownerKey
    || flags.hunterSlug
    || flags.darkPresenceSlug
    || flags.scenarioActorSlug
    || flags.brokenOneSlug
    || flags.lostStoriesSlug;
  if (flaggedKey) return [`${actor.type}:flag:${flaggedKey}`];

  return [...localizedNames(actor)]
    .filter(Boolean)
    .map((name) => `${actor.type}:name:${name}`);
}

export async function cleanupDuplicateActors() {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Notifications.GMOnly"));
    return [];
  }

  const groups = new Map();
  for (const actor of game.actors.filter(isBrokenTalesActor)) {
    for (const key of actorDuplicateKeys(actor)) {
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(actor);
    }
  }

  const deletedIds = new Set();
  const deleted = [];
  for (const group of groups.values()) {
    const actors = [...group].filter((actor) => !deletedIds.has(actor.id));
    if (actors.length < 2) continue;
    actors.sort((a, b) => actorContentScore(b) - actorContentScore(a));
    for (const duplicate of actors.slice(1)) {
      if (deletedIds.has(duplicate.id)) continue;
      deleted.push(duplicate.name);
      deletedIds.add(duplicate.id);
      await duplicate.delete();
    }
  }

  ui.notifications.info(game.i18n.format("BROKENTALES.Notifications.DuplicatesCleaned", {
    deleted: deleted.length
  }));
  return deleted;
}

export async function deleteWorldActorsAndItems() {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Notifications.GMOnly"));
    return { actors: 0, items: 0 };
  }

  const actorCollection = game.actors;
  const itemCollection = game.items;
  const actors = [...actorCollection];
  const items = [...itemCollection];
  const folders = [...game.folders].filter((folder) => ["Actor", "Item"].includes(folder.type));
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("BROKENTALES.Macros.DeleteWorldActorsItems") },
    content: `
      <p><strong>${game.i18n.localize("BROKENTALES.Delete")}</strong></p>
      <p>${game.i18n.format("BROKENTALES.Notifications.DeleteWorldActorsItemsConfirm", {
        actors: actors.length,
        items: items.length
      })}</p>
      <p>${game.i18n.localize("BROKENTALES.Notifications.CompendiaNotDeleted")}</p>
    `
  });
  if (!confirmed) return { actors: 0, items: 0 };

  const failures = [];
  let deletedActors = 0;
  let deletedItems = 0;
  let deletedFolders = 0;

  const deleteDocuments = async (DocumentClass, collection, documents, label) => {
    const ids = documents.map((document) => document.id).filter(Boolean);
    if (!ids.length) return 0;
    const deletedIds = new Set();
    try {
      await DocumentClass.deleteDocuments(ids);
      for (const id of ids) {
        if (!collection.get(id)) deletedIds.add(id);
      }
    } catch (error) {
      console.warn(`Broken Tales | Batch delete failed for ${label}; falling back to document deletes.`, error);
    }

    const remaining = documents.filter((document) => document.id && !deletedIds.has(document.id) && collection.get(document.id));
    for (const document of remaining) {
      try {
        await document.delete();
        if (!collection.get(document.id)) deletedIds.add(document.id);
      } catch (documentError) {
        failures.push(`${label}: ${document.name}`);
        console.warn(`Broken Tales | Could not delete ${label}.`, document, documentError);
      }
    }

    const stillPresent = ids.filter((id) => collection.get(id));
    for (const id of stillPresent) {
      const document = collection.get(id);
      failures.push(`${label}: ${document?.name ?? id}`);
    }

    return deletedIds.size;
  };

  const ActorClass = Actor.implementation ?? Actor;
  const ItemClass = Item.implementation ?? Item;
  deletedActors = await deleteDocuments(ActorClass, actorCollection, actors, "Actor");
  deletedItems = await deleteDocuments(ItemClass, itemCollection, items, "Item");

  for (let pass = 0; pass < 4; pass += 1) {
    const remainingFolders = [...game.folders]
      .filter((folder) => ["Actor", "Item"].includes(folder.type))
      .sort((a, b) => String(b.folder?.id ?? "").length - String(a.folder?.id ?? "").length);
    if (!remainingFolders.length) break;
    let deletedThisPass = 0;
    for (const folder of remainingFolders) {
      try {
        if ([...game.actors, ...game.items].some((document) => document.folder?.id === folder.id)) continue;
        if ([...game.folders].some((child) => child.folder?.id === folder.id)) continue;
        await folder.delete();
        deletedFolders += 1;
        deletedThisPass += 1;
      } catch (error) {
        failures.push(`Folder: ${folder.name}`);
        console.warn("Broken Tales | Could not delete folder.", folder, error);
      }
    }
    if (!deletedThisPass) break;
  }

  const remainingActors = actorCollection.size ?? [...actorCollection].length;
  const remainingItems = itemCollection.size ?? [...itemCollection].length;
  if (remainingActors || remainingItems) {
    ui.notifications.warn(`Broken Tales: ${remainingActors} Actors and ${remainingItems} Items remain after cleanup.`);
  }

  ui.actors?.render?.(true);
  ui.items?.render?.(true);

  ui.notifications.info(game.i18n.format("BROKENTALES.Notifications.WorldActorsItemsDeleted", {
    actors: deletedActors,
    items: deletedItems
  }));
  if (deletedFolders) ui.notifications.info(`Broken Tales: ${deletedFolders} Actor/Item folders deleted.`);
  if (failures.length) {
    ui.notifications.warn(`Broken Tales: ${failures.length} documents could not be deleted. Check the console.`);
  }
  return { actors: deletedActors, items: deletedItems, folders: deletedFolders, failures };
}

export async function createDarkPresenceImportMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.ImportDarkPresences");
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/cowled.svg",
    command: "await game.brokenTales.importDarkPresences();"
  });
}

export async function createDarkPresenceRepairMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.RepairDarkPresences");
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/upgrade.svg",
    command: "await game.brokenTales.repairDarkPresences();"
  });
}

export async function createCleanupDuplicateActorsMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.CleanupDuplicateActors");
  const command = "await game.brokenTales.cleanupDuplicateActors();";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) {
    if (existing.command !== command) await existing.update({ command, img: "icons/svg/cancel.svg" });
    return existing;
  }
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/cancel.svg",
    command
  });
}

export async function createDeleteWorldActorsItemsMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.DeleteWorldActorsItems");
  const command = "await game.brokenTales.deleteWorldActorsAndItems();";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) {
    if (existing.command !== command) await existing.update({ command, img: "icons/svg/skull.svg" });
    return existing;
  }
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/skull.svg",
    command
  });
}

export async function createSyncWorldActorsMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.SyncWorldActors");
  const command = "await game.brokenTales.syncWorldActorsFromCompendia({ cleanupDuplicates: true, importMissing: false, replaceExisting: true });";
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) {
    if (existing.command !== command) await existing.update({ command, img: "icons/svg/upgrade.svg" });
    return existing;
  }
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/upgrade.svg",
    command
  });
}
