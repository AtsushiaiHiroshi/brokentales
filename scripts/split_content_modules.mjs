import fs from "node:fs";
import path from "node:path";

const SYSTEM_ROOT = path.resolve("C:/Users/Gamer/AppData/Local/FoundryVTT/Data/systems/broken-tales");
const DATA_ROOT = path.resolve(SYSTEM_ROOT, "../..");
const MODULES_ROOT = path.join(DATA_ROOT, "modules");
const SYSTEM_ID = "broken-tales";
const SYSTEM_VERSION = "0.2.0";
const LOCAL_SOURCE_ROOT = "C:/Users/Gamer/Documents/Broken Tales KS [ENG]";
const LEGACY_BACKUP_ROOT = "E:/respaldos";

const CORE_COLLECTIONS = new Set(["Core Book", "Core Book: Fox and Cat"]);
const BROKEN_ONES_COLLECTIONS = new Set(["The Broken Ones"]);
const LOST_STORIES_COLLECTIONS = new Set(["Lost Stories", "Lost Stories Exclusives"]);

const CORE_BOOK_CATEGORIES = new Set(["Core Book", "Sheets and Support", "Spanish Extras"]);
const BROKEN_ONES_CATEGORIES = new Set(["The Broken Ones"]);
const LOST_STORIES_CATEGORIES = new Set(["Lost Stories"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readDb(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readBestPack(packsDir, baseName) {
  const plain = readDb(path.join(packsDir, `${baseName}.db`));
  const canon = readDb(path.join(packsDir, `${baseName}-canon.db`));
  return plain.length > canon.length ? plain : canon;
}

function walk(source) {
  if (!fs.existsSync(source)) return [];
  let files = [];
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(sourcePath));
    else files.push(sourcePath);
  }
  return files;
}

function writeDb(file, documents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, documents.map((document) => JSON.stringify(document)).join("\n") + (documents.length ? "\n" : ""), "utf8");
}

function copyTree(source, target, predicate = () => true) {
  if (!fs.existsSync(source)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      count += copyTree(sourcePath, targetPath, predicate);
    } else if (predicate(sourcePath)) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      count += 1;
    }
  }
  return count;
}

function stableId(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let hash = 2166136261 >>> 0;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  let id = "";
  for (let index = 0; index < 16; index += 1) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    id += chars[hash % chars.length];
  }
  return id;
}

function html(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(value) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block) => `<p>${html(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function stats(seed) {
  const now = Date.now();
  return {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "13.351",
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
    createdTime: now,
    modifiedTime: now,
    lastModifiedBy: null,
    exportSource: null
  };
}

function itemDoc(seed, name, type, img, system) {
  return {
    _id: stableId(seed),
    name,
    type,
    img,
    effects: [],
    folder: null,
    flags: { [SYSTEM_ID]: { legacySource: LEGACY_BACKUP_ROOT, importSlug: seed } },
    system,
    sort: 0,
    ownership: { default: 0 },
    _stats: stats(seed)
  };
}

function readLegacyJson(file) {
  const target = path.join(LEGACY_BACKUP_ROOT, file);
  if (!fs.existsSync(target)) return null;
  return readJson(target);
}

function legacyIskraSupport() {
  const documents = [];
  const scenarioGifts = readLegacyJson("Red-Hood Iskra Gifts.json") ?? [];
  for (const [index, entry] of scenarioGifts.entries()) {
    const requirement = entry.data?.requirement || "";
    const effect = entry.data?.effect || entry.system?.description || "";
    documents.push(itemDoc(
      `iskra-scenario-gift-${entry.name}-${index}`,
      entry.name,
      "gift",
      "icons/svg/aura.svg",
      {
        description: `${requirement ? `<h3>Requirement</h3>${paragraphs(requirement)}` : ""}<h3>Effect</h3>${paragraphs(effect)}`,
        notes: "Scenario Gift. Legacy Iskra adventure support from local backups.",
        somaCost: 0,
        automaticSuccesses: 0
      }
    ));
  }

  const storyFiles = [
    "Blood Drawings in the Den.json",
    "Elizavetas Poison.json",
    "Gerards Letter to the Papacy.json",
    "Iskras Pendant.json",
    "Iskras Red Cape.json",
    "Iskras Wolf Mask.json",
    "Portrait of Patrick Dubois.json",
    "Wolf Tracks and Childs Footprints.json"
  ];

  for (const [index, file] of storyFiles.entries()) {
    const entry = readLegacyJson(file);
    if (!entry) continue;
    documents.push(itemDoc(
      `iskra-story-element-${entry.name}-${index}`,
      entry.name,
      "storyElement",
      entry.img || "icons/svg/scroll.svg",
      {
        description: paragraphs(entry.system?.description || entry.data?.description || ""),
        notes: `Red-Hood Iskra adventure element. Legacy file: ${file}.`
      }
    ));
  }

  const unique = new Map();
  for (const document of documents) unique.set(`${document.type}:${document.name}`, document);
  return [...unique.values()];
}

function journalPage(seed, name, content, sort = 0) {
  return {
    _id: stableId(seed),
    name,
    type: "text",
    title: { show: true, level: 1 },
    text: { format: 1, content, markdown: "" },
    sort,
    ownership: { default: -1 },
    flags: {},
    _stats: stats(seed)
  };
}

function journalDoc(seed, name, pages) {
  return {
    _id: stableId(seed),
    name,
    pages,
    folder: null,
    flags: { [SYSTEM_ID]: { legacySource: LEGACY_BACKUP_ROOT, importSlug: seed } },
    sort: 0,
    ownership: { default: 0 },
    _stats: stats(seed)
  };
}

function classifySourcePdf(file) {
  const relativePath = path.relative(LOCAL_SOURCE_ROOT, file).replace(/\\/g, "/");
  const lower = relativePath.toLowerCase();
  if (/lost stories|lost_stories|bt-ls|ls-hunters|ls-book/.test(lower)) return { owner: "lost-stories", relativePath };
  if (/bt-tbo|the broken ones|broken ones|broken-ones|villager/.test(lower)) return { owner: "broken-ones", relativePath };
  return { owner: "system", relativePath };
}

function sourcePdfJournal(file) {
  const { owner, relativePath } = classifySourcePdf(file);
  const name = path.basename(file, path.extname(file));
  const sizeMb = (fs.statSync(file).size / (1024 * 1024)).toFixed(2);
  const content = [
    `<h1>${html(name)}</h1>`,
    `<p><strong>Expected owner:</strong> ${html(owner)}</p>`,
    `<p><strong>Local source:</strong> <code>${html(file)}</code></p>`,
    `<p><strong>Relative source:</strong> <code>${html(relativePath)}</code></p>`,
    `<p><strong>Size:</strong> ${html(sizeMb)} MB</p>`
  ].join("");
  return journalDoc(`source-pdf-${owner}-${relativePath}`, name, [
    journalPage(`source-pdf-${owner}-${relativePath}-page`, "Source PDF", content)
  ]);
}

function sourcePdfJournals(owner) {
  return walk(LOCAL_SOURCE_ROOT)
    .filter((file) => file.toLowerCase().endsWith(".pdf"))
    .filter((file) => classifySourcePdf(file).owner === owner)
    .map(sourcePdfJournal);
}

function legacyIskraMapJournals() {
  const entries = [
    ["iskra-gevaudan", "Gevaudan - Red-Hood Iskra", "assets/adventures/iskra/gevaudan-es.png"],
    ["iskra-durfort", "Durfort - Red-Hood Iskra", "assets/adventures/iskra/durfort.png"],
    ["iskra-cemetery", "Cemetery - Red-Hood Iskra", "assets/adventures/iskra/cementerio-es.png"],
    ["iskra-wolf-den", "Wolf Den - Red-Hood Iskra", "assets/adventures/iskra/guarida-de-lobos.png"]
  ];
  return entries.map(([seed, name, relativePath], index) => journalDoc(
    seed,
    name,
    [journalPage(
      `${seed}-page`,
      "Map / Visual Resource",
      `<h1>${html(name)}</h1><p>Red-Hood Iskra map resource imported from local backups.</p><img src="modules/broken-tales-broken-ones/${relativePath}" alt="${html(name)}" style="max-width:100%;height:auto;" />`,
      index * 1000
    )]
  ));
}

function walkFiles(source) {
  if (!fs.existsSync(source)) return [];
  let files = [];
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    if (entry.isDirectory()) files = files.concat(walkFiles(sourcePath));
    else files.push(sourcePath);
  }
  return files;
}

function copyAudioAndBuildPlaylists(moduleRoot) {
  const ostRoot = path.join(LOCAL_SOURCE_ROOT, "OST");
  const audioSources = walkFiles(ostRoot).filter((file) => /\.(mp3|ogg|wav|flac|m4a)$/i.test(file) && !/[\/\\]waiting[\/\\]/i.test(file));
  const copied = [];
  for (const sourcePath of audioSources) {
    const relativeSource = path.relative(ostRoot, sourcePath).replace(/\\/g, "/");
    const safeRelative = relativeSource
      .split("/")
      .map((part) => part.replace(/[^a-zA-Z0-9._ -]+/g, "").trim().replace(/\s+/g, "-"))
      .join("/");
    const targetRelative = `assets/audio/ost/${safeRelative}`;
    const targetPath = path.join(moduleRoot, targetRelative);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    copied.push({
      name: path.basename(sourcePath, path.extname(sourcePath)),
      source: relativeSource,
      path: `modules/broken-tales-broken-ones/${targetRelative}`
    });
  }

  const soundDoc = (entry, index) => ({
    _id: stableId(`sound-${entry.path}`),
    name: entry.name.replace(/^\d+\s*/, "").replace(/-/g, " "),
    path: entry.path,
    playing: false,
    pausedTime: null,
    repeat: false,
    volume: 0.8,
    sort: index * 100000,
    flags: {}
  });

  const music = copied.filter((entry) => !entry.source.toLowerCase().startsWith("sounds/"));
  const sfx = copied.filter((entry) => entry.source.toLowerCase().startsWith("sounds/"));
  const playlists = [];
  if (music.length) {
    playlists.push({
      _id: stableId("broken-tales-ost-playlist"),
      name: "Broken Tales OST",
      description: "Official/local Broken Tales OST tracks copied from the local source folder.",
      sounds: music.map(soundDoc),
      mode: 0,
      playing: false,
      fade: null,
      folder: null,
      sorting: "a",
      sort: 0,
      ownership: { default: 0 },
      flags: { [SYSTEM_ID]: { sourceRoot: LOCAL_SOURCE_ROOT } },
      _stats: stats("broken-tales-ost-playlist")
    });
  }
  if (sfx.length) {
    playlists.push({
      _id: stableId("broken-tales-iskra-sfx-playlist"),
      name: "Broken Tales - Iskra SFX",
      description: "Wolf and forest sound effects copied from the local source folder.",
      sounds: sfx.map(soundDoc),
      mode: 0,
      playing: false,
      fade: null,
      folder: null,
      sorting: "a",
      sort: 100000,
      ownership: { default: 0 },
      flags: { [SYSTEM_ID]: { sourceRoot: LOCAL_SOURCE_ROOT } },
      _stats: stats("broken-tales-iskra-sfx-playlist")
    });
  }
  return playlists;
}

function buildNamesByCollection(pregens, collections) {
  return new Set(
    pregens
      .filter((pregen) => collections.has(pregen.collection))
      .flatMap((pregen) => [pregen.name, pregen.displayName].filter(Boolean))
  );
}

function actorCollection(actor) {
  return actor.flags?.[SYSTEM_ID]?.pregenCollection || actor.system?.details?.concept || "";
}

function actorInCollections(actor, collections) {
  return collections.has(actorCollection(actor));
}

function textMentionsAny(document, names) {
  const text = JSON.stringify({ name: document.name, flags: document.flags, system: document.system });
  for (const name of names) {
    if (name && text.includes(name)) return true;
  }
  return false;
}

function itemForNames(document, names) {
  if (textMentionsAny(document, names)) return true;
  for (const name of names) {
    if (document.name?.startsWith(`${name} - `)) return true;
  }
  return false;
}

function filterLibrary(documents, categories) {
  return documents.filter((document) => categories.has(document.flags?.[SYSTEM_ID]?.category));
}

function packDef(name, label, type) {
  return {
    name,
    label,
    path: `packs/${name}.db`,
    type,
    system: SYSTEM_ID,
    ownership: { PLAYER: "OBSERVER", ASSISTANT: "OWNER" },
    flags: {}
  };
}

function makeModuleManifest({ id, title, description, packs }) {
  return {
    id,
    title,
    description,
    version: SYSTEM_VERSION,
    authors: [{ name: "Atsushiai Hiroshi / local conversion" }],
    compatibility: { minimum: "12", verified: "14" },
    relationships: {
      systems: [{ id: SYSTEM_ID, type: "system", compatibility: { minimum: SYSTEM_VERSION } }]
    },
    packs,
    esmodules: [],
    styles: [],
    languages: [],
    url: "https://github.com/AtsushiaiHiroshi/brokentales",
    manifest: "",
    download: ""
  };
}

function writeModule(id, manifest, packMap, assetCopy) {
  const moduleRoot = path.join(MODULES_ROOT, id);
  fs.mkdirSync(path.join(moduleRoot, "packs"), { recursive: true });
  for (const [name, documents] of Object.entries(packMap)) {
    writeDb(path.join(moduleRoot, "packs", `${name}.db`), documents);
  }
  if (assetCopy) assetCopy(moduleRoot);
  writeJson(path.join(moduleRoot, "module.json"), manifest);
  return moduleRoot;
}

function main() {
  const pregens = readJson(path.join(SYSTEM_ROOT, "pregens/enriched-pregens.json")).actors;
  const coreNames = buildNamesByCollection(pregens, CORE_COLLECTIONS);
  const brokenNames = buildNamesByCollection(pregens, BROKEN_ONES_COLLECTIONS);
  const lostNames = buildNamesByCollection(pregens, LOST_STORIES_COLLECTIONS);

  const packsDir = path.join(SYSTEM_ROOT, "packs");
  const hunters = readBestPack(packsDir, "hunters");
  const descriptors = readBestPack(packsDir, "hunter-descriptors");
  const brokenDescriptors = readBestPack(packsDir, "broken-one-descriptors");
  const gifts = readBestPack(packsDir, "hunter-gifts");
  const darkEgos = readBestPack(packsDir, "hunter-dark-egos");
  const equipment = readBestPack(packsDir, "hunter-equipment");
  const library = readBestPack(packsDir, "library");
  const adventures = readBestPack(packsDir, "adventures");
  const maps = readBestPack(packsDir, "adventure-maps");
  const scenes = readBestPack(packsDir, "adventure-scenes");
  const scenarioActors = readDb(path.join(packsDir, "scenario-actors-canon.db"));
  const fullScenarioActors = readBestPack(packsDir, "scenario-actors");
  const darkPresences = readBestPack(packsDir, "dark-presences");
  const darkPresenceDescriptors = readBestPack(packsDir, "dark-presence-descriptors");
  const threatDescriptors = readBestPack(packsDir, "threat-descriptors");
  const support = readDb(path.join(packsDir, "support-canon.db"));

  const coreHunters = hunters.filter((actor) => actorInCollections(actor, CORE_COLLECTIONS));
  const brokenHunters = hunters.filter((actor) => actorInCollections(actor, BROKEN_ONES_COLLECTIONS));
  const lostHunters = hunters.filter((actor) => actorInCollections(actor, LOST_STORIES_COLLECTIONS));

  const librarySource = (document) => document.flags?.[SYSTEM_ID]?.sourceFile || document.name || "";
  const isBrokenLibrary = (document) => (
    BROKEN_ONES_CATEGORIES.has(document.flags?.[SYSTEM_ID]?.category)
    || /bt-tbo|The Broken Ones|broken ones|villager's sheet/i.test(librarySource(document))
  );
  const isLostLibrary = (document) => (
    LOST_STORIES_CATEGORIES.has(document.flags?.[SYSTEM_ID]?.category)
    || /bt-ls|Lost Stories|lost stories/i.test(librarySource(document))
  );
  const coreLibrary = library.filter((document) => CORE_BOOK_CATEGORIES.has(document.flags?.[SYSTEM_ID]?.category) && !isBrokenLibrary(document) && !isLostLibrary(document));
  const brokenLibrary = library.filter(isBrokenLibrary);
  const lostLibrary = library.filter(isLostLibrary);

  const coreItemsByName = (document) => itemForNames(document, coreNames);
  const brokenItemsByName = (document) => itemForNames(document, brokenNames);
  const lostItemsByName = (document) => itemForNames(document, lostNames);

  const legacyIskraSupportDocuments = legacyIskraSupport();
  const isIskraSupport = (document) => /Iskra|Voice of the Spirits|Wolf-killer|sweetie|Blood Drawings|Elizaveta|Gerard|Patrick|Wolf Tracks/i.test(document.name);
  const coreSupport = support.filter((document) => !isIskraSupport(document));
  const iskraSupport = [...support.filter(isIskraSupport), ...legacyIskraSupportDocuments];

  const flagsText = (document) => JSON.stringify(document.flags ?? {});
  const sourceFileText = (document) => document.flags?.[SYSTEM_ID]?.sourceFile || "";
  const isBrokenOnesAdventure = (document) => (
    /broken ones/i.test(document.name)
    || /the broken ones/i.test(flagsText(document))
    || /bt-tbo|tbo-|broken-ones|villager/i.test(sourceFileText(document))
  );
  const isLostAdventure = (document) => (
    /lost stories/i.test(document.name)
    || /lost stories/i.test(flagsText(document))
    || /bt-ls|lost-stories|ls-/i.test(sourceFileText(document))
  );
  const isIskraMap = (document) => /Red-Hood Iskra|Gevaudan|Durfort|Cemetery|Wolf Den/i.test(document.name);
  const isCoreAdventure = (document) => !isBrokenOnesAdventure(document) && !isLostAdventure(document);
  const adventureClassByName = new Map();
  for (const document of [...adventures, ...maps]) {
    adventureClassByName.set(document.name, isLostAdventure(document) ? "lost" : isBrokenOnesAdventure(document) ? "broken" : "core");
  }
  const sceneClass = (document) => adventureClassByName.get(document.name) || "core";
  const collectionOf = (document) => document.flags?.[SYSTEM_ID]?.collection || "";
  const coreScenarioActors = fullScenarioActors.filter((actor) => collectionOf(actor) === "Core Book");
  const brokenScenarioActors = fullScenarioActors.filter((actor) => collectionOf(actor) === "The Broken Ones");
  const lostScenarioActors = fullScenarioActors.filter((actor) => collectionOf(actor) === "Lost Stories");
  const coreDarkPresences = darkPresences.filter((actor) => collectionOf(actor) === "Core Book");
  const lostDarkPresences = darkPresences.filter((actor) => collectionOf(actor) === "Lost Stories");
  const coreDarkPresenceNames = new Set(coreDarkPresences.map((actor) => actor.name));
  const lostDarkPresenceNames = new Set(lostDarkPresences.map((actor) => actor.name));
  const threatDescriptorSource = (document) => document.system?.notes || JSON.stringify(document.flags ?? {});
  const coreThreatDescriptors = threatDescriptors.filter((document) => /bt-corebook|Core Book/i.test(threatDescriptorSource(document)));
  const brokenThreatDescriptors = threatDescriptors.filter((document) => /bt-tbo|The Broken Ones|broken ones/i.test(threatDescriptorSource(document)));
  const lostThreatDescriptors = threatDescriptors.filter((document) => /bt-ls|Lost Stories/i.test(threatDescriptorSource(document)));

  const brokenModulePacks = {
    "broken-ones-hunters": brokenHunters,
    "broken-ones-actors": brokenScenarioActors.length ? brokenScenarioActors : scenarioActors.filter((actor) => /The Broken Ones|broken one/i.test(JSON.stringify({ flags: actor.flags, system: actor.system }))),
    "broken-ones-descriptors": brokenDescriptors,
    "broken-ones-threat-descriptors": brokenThreatDescriptors,
    "broken-ones-gifts": gifts.filter(brokenItemsByName),
    "broken-ones-dark-egos": darkEgos.filter(brokenItemsByName),
    "broken-ones-equipment": equipment.filter(brokenItemsByName),
    "broken-ones-library": brokenLibrary,
    "broken-ones-adventures": adventures.filter(isBrokenOnesAdventure),
    "broken-ones-maps": maps.filter(isBrokenOnesAdventure),
    "broken-ones-scenes": scenes.filter((document) => sceneClass(document) === "broken"),
    "red-hood-iskra-support": iskraSupport,
    "red-hood-iskra-maps": [...maps.filter(isIskraMap), ...legacyIskraMapJournals()],
    "red-hood-iskra-audio": []
  };

  const lostModulePacks = {
    "lost-stories-hunters": lostHunters,
    "lost-stories-actors": lostScenarioActors.length ? lostScenarioActors : scenarioActors.filter((actor) => /Lost Stories/i.test(JSON.stringify(actor.flags ?? {}))),
    "lost-stories-dark-presences": lostDarkPresences,
    "lost-stories-dark-presence-descriptors": darkPresenceDescriptors.filter((document) => itemForNames(document, lostDarkPresenceNames)),
    "lost-stories-threat-descriptors": lostThreatDescriptors,
    "lost-stories-descriptors": descriptors.filter(lostItemsByName),
    "lost-stories-gifts": gifts.filter(lostItemsByName),
    "lost-stories-dark-egos": darkEgos.filter(lostItemsByName),
    "lost-stories-equipment": equipment.filter(lostItemsByName),
    "lost-stories-library": lostLibrary,
    "lost-stories-adventures": adventures.filter(isLostAdventure),
    "lost-stories-maps": maps.filter(isLostAdventure),
    "lost-stories-scenes": scenes.filter((document) => sceneClass(document) === "lost")
  };

  brokenModulePacks["broken-ones-source-pdfs"] = sourcePdfJournals("broken-ones");
  lostModulePacks["lost-stories-source-pdfs"] = sourcePdfJournals("lost-stories");

  const brokenPacks = [
    packDef("broken-ones-hunters", "Broken Tales - The Broken Ones Hunters", "Actor"),
    packDef("broken-ones-actors", "Broken Tales - The Broken Ones Actors", "Actor"),
    packDef("broken-ones-descriptors", "Broken Tales - The Broken Ones Descriptors", "Item"),
    packDef("broken-ones-threat-descriptors", "Broken Tales - The Broken Ones Threat Descriptors", "Item"),
    packDef("broken-ones-gifts", "Broken Tales - The Broken Ones Gifts", "Item"),
    packDef("broken-ones-dark-egos", "Broken Tales - The Broken Ones Dark Egos", "Item"),
    packDef("broken-ones-equipment", "Broken Tales - The Broken Ones Equipment", "Item"),
    packDef("broken-ones-library", "Broken Tales - The Broken Ones Library", "JournalEntry"),
    packDef("broken-ones-adventures", "Broken Tales - The Broken Ones Adventures", "JournalEntry"),
    packDef("broken-ones-maps", "Broken Tales - The Broken Ones Maps", "JournalEntry"),
    packDef("broken-ones-scenes", "Broken Tales - The Broken Ones Scenes", "Scene"),
    packDef("red-hood-iskra-support", "Broken Tales - Red-Hood Iskra Support", "Item"),
    packDef("red-hood-iskra-maps", "Broken Tales - Red-Hood Iskra Maps", "JournalEntry"),
    packDef("red-hood-iskra-audio", "Broken Tales - Red-Hood Iskra Audio / OST", "Playlist"),
    packDef("broken-ones-source-pdfs", "Broken Tales - The Broken Ones Source PDFs", "JournalEntry")
  ];

  const lostPacks = [
    packDef("lost-stories-hunters", "Broken Tales - Lost Stories Hunters", "Actor"),
    packDef("lost-stories-actors", "Broken Tales - Lost Stories Actors", "Actor"),
    packDef("lost-stories-dark-presences", "Broken Tales - Lost Stories Dark Presences", "Actor"),
    packDef("lost-stories-dark-presence-descriptors", "Broken Tales - Lost Stories Dark Presence Descriptors", "Item"),
    packDef("lost-stories-threat-descriptors", "Broken Tales - Lost Stories Threat Descriptors", "Item"),
    packDef("lost-stories-descriptors", "Broken Tales - Lost Stories Descriptors", "Item"),
    packDef("lost-stories-gifts", "Broken Tales - Lost Stories Gifts", "Item"),
    packDef("lost-stories-dark-egos", "Broken Tales - Lost Stories Dark Egos", "Item"),
    packDef("lost-stories-equipment", "Broken Tales - Lost Stories Equipment", "Item"),
    packDef("lost-stories-library", "Broken Tales - Lost Stories Library", "JournalEntry"),
    packDef("lost-stories-adventures", "Broken Tales - Lost Stories Adventures", "JournalEntry"),
    packDef("lost-stories-maps", "Broken Tales - Lost Stories Maps", "JournalEntry"),
    packDef("lost-stories-scenes", "Broken Tales - Lost Stories Scenes", "Scene"),
    packDef("lost-stories-source-pdfs", "Broken Tales - Lost Stories Source PDFs", "JournalEntry")
  ];

  const brokenRoot = writeModule(
    "broken-tales-broken-ones",
    makeModuleManifest({
      id: "broken-tales-broken-ones",
      title: "Broken Tales - The Broken Ones",
      description: "Expansion module for The Broken Ones content for the Broken Tales system.",
      packs: brokenPacks
    }),
    brokenModulePacks,
    (moduleRoot) => {
      copyTree(path.join(SYSTEM_ROOT, "assets/adventures/iskra"), path.join(moduleRoot, "assets/adventures/iskra"));
      copyTree(path.join(SYSTEM_ROOT, "assets/source-pdfs"), path.join(moduleRoot, "assets/source-pdfs"), (file) => /tbo|broken-ones|villager|iskra/i.test(file));
      writeDb(path.join(moduleRoot, "packs", "red-hood-iskra-audio.db"), copyAudioAndBuildPlaylists(moduleRoot));
    }
  );

  const lostRoot = writeModule(
    "broken-tales-lost-stories",
    makeModuleManifest({
      id: "broken-tales-lost-stories",
      title: "Broken Tales - Lost Stories",
      description: "Expansion module for Lost Stories content for the Broken Tales system.",
      packs: lostPacks
    }),
    lostModulePacks,
    (moduleRoot) => {
      copyTree(path.join(SYSTEM_ROOT, "assets/source-pdfs"), path.join(moduleRoot, "assets/source-pdfs"), (file) => /lost-stories|bt-ls/i.test(file));
    }
  );

  writeDb(path.join(packsDir, "hunters-canon.db"), coreHunters);
  writeDb(path.join(packsDir, "hunter-descriptors-canon.db"), descriptors.filter(coreItemsByName));
  writeDb(path.join(packsDir, "hunter-gifts-canon.db"), gifts.filter(coreItemsByName));
  writeDb(path.join(packsDir, "hunter-dark-egos-canon.db"), darkEgos.filter(coreItemsByName));
  writeDb(path.join(packsDir, "hunter-equipment-canon.db"), equipment.filter(coreItemsByName));
  writeDb(path.join(packsDir, "library-canon.db"), coreLibrary);
  writeDb(path.join(packsDir, "support-canon.db"), coreSupport);
  writeDb(path.join(packsDir, "adventures-canon.db"), adventures.filter(isCoreAdventure));
  writeDb(path.join(packsDir, "adventure-maps-canon.db"), maps.filter((document) => isCoreAdventure(document) && !isIskraMap(document)));
  writeDb(path.join(packsDir, "adventure-scenes-canon.db"), scenes.filter((document) => sceneClass(document) === "core"));
  writeDb(path.join(packsDir, "scenario-actors-canon.db"), coreScenarioActors);
  writeDb(path.join(packsDir, "dark-presences-canon.db"), coreDarkPresences);
  writeDb(path.join(packsDir, "dark-presence-descriptors-canon.db"), darkPresenceDescriptors.filter((document) => itemForNames(document, coreDarkPresenceNames)));
  writeDb(path.join(packsDir, "threat-descriptors-canon.db"), coreThreatDescriptors);
  writeDb(path.join(packsDir, "source-pdfs-canon.db"), sourcePdfJournals("system"));

  const systemJsonPath = path.join(SYSTEM_ROOT, "system.json");
  const systemJson = readJson(systemJsonPath);
  const removeFromSystem = new Set(["broken-one-descriptors", "audio"]);
  systemJson.packs = systemJson.packs.filter((pack) => !removeFromSystem.has(pack.name));
  if (!systemJson.packs.some((pack) => pack.name === "source-pdfs")) {
    systemJson.packs.push({
      name: "source-pdfs",
      label: "Broken Tales - Source PDFs",
      path: "packs/source-pdfs-canon.db",
      type: "JournalEntry",
      system: SYSTEM_ID,
      ownership: { PLAYER: "OBSERVER", ASSISTANT: "OWNER" },
      flags: {}
    });
  }
  writeJson(systemJsonPath, systemJson);

  const summary = {
    system: {
      hunters: coreHunters.length,
      descriptors: descriptors.filter(coreItemsByName).length,
      gifts: gifts.filter(coreItemsByName).length,
      darkEgos: darkEgos.filter(coreItemsByName).length,
      equipment: equipment.filter(coreItemsByName).length,
      library: coreLibrary.length,
      packs: systemJson.packs.length
    },
    brokenOnes: Object.fromEntries(Object.entries(brokenModulePacks).map(([name, docs]) => [name, docs.length])),
    lostStories: Object.fromEntries(Object.entries(lostModulePacks).map(([name, docs]) => [name, docs.length])),
    moduleRoots: { brokenRoot, lostRoot }
  };
  fs.mkdirSync(path.join(SYSTEM_ROOT, "docs"), { recursive: true });
  fs.writeFileSync(path.join(SYSTEM_ROOT, "docs/content-module-split.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main();
