import {
  HunterData,
  NPCData,
  EssenceData,
  VillagerData,
  ThreatData,
  DescriptorData,
  GiftData,
  DarkEgoData,
  EquipmentData,
  ConditionData,
  WoundData,
  StoryElementData
} from "./models.mjs";
import { BrokenTalesActor } from "./documents/actor.mjs";
import { BrokenTalesItem } from "./documents/item.mjs";
import { BrokenTalesActorSheet } from "./sheets/actor-sheet.mjs";
import { BrokenTalesItemSheet } from "./sheets/item-sheet.mjs";
import {
  createPregenImportMacro,
  createPregenRepairMacro,
  importPregens,
  refreshPregenAssets,
  repairPregens
} from "./pregens.mjs";
import {
  createLibraryImportMacro,
  createDarkPresenceImportMacro,
  createDarkPresenceRepairMacro,
  cleanupDuplicateActors,
  createCleanupDuplicateActorsMacro,
  createDeleteWorldActorsItemsMacro,
  createSyncWorldActorsMacro,
  deleteWorldActorsAndItems,
  createReferenceActorsImportMacro,
  createSupportImportMacro,
  importDarkPresences,
  importLibrary,
  importReferenceActors,
  importSupportItems,
  repairDarkPresences,
  syncWorldActorsFromCompendia
} from "./content.mjs";
import {
  auditBrokenTalesCompendia,
  repairBrokenTalesCompendia,
  repairEmptyBrokenTalesCompendia
} from "./compendium-repair.mjs";

const BROKEN_TALES_PACK_PREFIXES = [
  "broken-tales.",
  "broken-tales-broken-ones.",
  "broken-tales-lost-stories."
];

const ESSENTIAL_MACRO_COMMANDS = new Set([
  "await game.brokenTales.repairPregens({ collection: \"core\", pruneOtherImportedPregens: true });",
  "await game.brokenTales.syncWorldActorsFromCompendia({ cleanupDuplicates: true, importMissing: false, replaceExisting: true });",
  "await game.brokenTales.deleteWorldActorsAndItems();"
]);

const ESSENTIAL_MACRO_NAME_KEYS = [
  "BROKENTALES.Macros.RepairPregens",
  "BROKENTALES.Macros.SyncWorldActors",
  "BROKENTALES.Macros.DeleteWorldActorsItems"
];

const LEGACY_MACRO_PATTERNS = [
  /broken tales/i,
  /delete all world actors and items/i,
  /borrar todos los actores e items/i,
  /borrar todos los actores y objetos/i,
  /clean .*duplicate actors/i,
  /limpiar actores duplicados/i,
  /pregenerados de broken tales/i,
  /presencias oscuras de broken tales/i,
  /actores duplicados de broken tales/i
];

function isBrokenTalesPackId(packId) {
  return BROKEN_TALES_PACK_PREFIXES.some((prefix) => String(packId ?? "").startsWith(prefix));
}

function normalizeBrokenTalesPackId(value) {
  const raw = String(value ?? "");
  if (isBrokenTalesPackId(raw)) return raw;
  return raw.match(/(broken-tales(?:-[a-z0-9-]+)?\.[a-z0-9-]+)/i)?.[1] ?? "";
}

function applicationElement(element) {
  if (element instanceof HTMLElement) return element;
  if (element?.[0] instanceof HTMLElement) return element[0];
  return null;
}

function packIdFromApplication(application) {
  const collectionMetadata = application?.collection?.metadata;
  const metadataId = normalizeBrokenTalesPackId(collectionMetadata?.id);
  if (metadataId) return metadataId;
  if (collectionMetadata?.packageName && collectionMetadata?.name) {
    return normalizeBrokenTalesPackId(collectionMetadata.packageName + "." + collectionMetadata.name);
  }

  const direct = [
    application?.collection?.collection,
    application?.document?.collection?.metadata?.id,
    application?.options?.collection,
    application?.options?.pack,
    application?.id
  ].map(normalizeBrokenTalesPackId).find(Boolean) ?? "";
  if (direct) return direct;

  const title = String(application?.title ?? application?.window?.title ?? "").trim();
  if (title && game?.packs) {
    const byTitle = game.packs.find((pack) => {
      if (!isBrokenTalesPackId(pack.collection)) return false;
      const rawLabel = pack.metadata?.label ?? pack.title ?? pack.metadata?.name ?? "";
      const label = game.i18n.localize(rawLabel);
      return label === title || pack.title === title || rawLabel === title;
    });
    if (byTitle) return byTitle.collection;
  }

  return "";
}
function packIdFromRoot(root) {
  return [
    root?.dataset?.pack,
    root?.querySelector?.("[data-pack]")?.dataset?.pack,
    root?.closest?.("[data-pack]")?.dataset?.pack
  ].map(normalizeBrokenTalesPackId).find(Boolean) ?? "";
}

function enhanceBrokenTalesCompendiumMarkup(root) {
  if (!root) return;

  root.querySelectorAll("[data-pack]").forEach((entry) => {
    const packId = entry.dataset.pack;
    if (!isBrokenTalesPackId(packId)) return;
    entry.classList.add("broken-tales-pack-entry");
    entry.closest(".directory-item.folder")?.classList.add("broken-tales-pack-folder");
  });

  root.querySelectorAll("[data-document-id], [data-entry-id], .directory-item.document").forEach((entry) => {
    const closestPack = entry.closest("[data-pack]");
    if (closestPack && !isBrokenTalesPackId(closestPack.dataset.pack)) return;
    const appPackId = root.dataset?.pack;
    if (appPackId && !isBrokenTalesPackId(appPackId)) return;
    entry.classList.add("broken-tales-compendium-document");
  });
}

const LOCALIZED_PACK_NAME_CACHE = new Map();
const LOCALIZED_PACK_IMAGE_CACHE = new Map();
const SCENARIO_GIFT_GROUP_CACHE = new Map();
const LOCALIZED_COMPENDIUM_OBSERVERS = new WeakSet();
const SCENARIO_GIFT_PACK_IDS = new Set([
  "broken-tales.scenario-gifts",
  "broken-tales-broken-ones.red-hood-iskra-support",
  "broken-tales-lost-stories.lost-stories-scenario-gifts"
]);

function isScenarioGiftPackId(packId) {
  return SCENARIO_GIFT_PACK_IDS.has(packId)
    || /^broken-tales\.scenario-gifts(?:-|$)/i.test(String(packId ?? ""));
}

function selectedContentLanguage() {
  const normalize = (value) => String(value ?? "").toLowerCase();
  const resolve = (value) => {
    const normalized = normalize(value);
    if (normalized === "es" || normalized.startsWith("es-") || normalized === "spanish" || normalized === "español") return "es";
    if (normalized === "en" || normalized.startsWith("en-") || normalized === "english" || normalized === "inglés") return "en";
    return "";
  };

  try {
    const configuredRaw = normalize(game.settings.get("broken-tales", "contentLanguage"));
    const configured = resolve(configuredRaw);
    if (configured && configuredRaw !== "system") return configured;

    const core = resolve(game.settings.get("core", "language"));
    if (core) return core;
  } catch (_error) {
    // Settings are not available before ready; fall back to Foundry's UI language.
  }

  const i18n = resolve(game.i18n?.lang);
  if (i18n) return i18n;

  return "en";
}

async function translatedPackNames(packId, language) {
  if (!packId || !language || language === "en") return new Map();
  const cacheKey = `${packId}:${language}`;
  if (LOCALIZED_PACK_NAME_CACHE.has(cacheKey)) return LOCALIZED_PACK_NAME_CACHE.get(cacheKey);

  const pack = game.packs.get(packId);
  if (!pack) return new Map();
  const documents = await pack.getDocuments();
  const names = new Map();
  for (const document of documents) {
    const translatedName = document.flags?.["broken-tales"]?.translations?.[language]?.name;
    if (!translatedName) continue;
    names.set(document.uuid, translatedName);
    names.set(`Compendium.${packId}.${document.id}`, translatedName);
    names.set(`${packId}.${document.id}`, translatedName);
    names.set(document.id, translatedName);
    names.set(document._id, translatedName);
    names.set(document.name, translatedName);
  }
  LOCALIZED_PACK_NAME_CACHE.set(cacheKey, names);
  return names;
}

async function translatedPackImages(packId, language) {
  if (!packId || !language || language === "en") return new Map();
  const cacheKey = `${packId}:${language}`;
  if (LOCALIZED_PACK_IMAGE_CACHE.has(cacheKey)) return LOCALIZED_PACK_IMAGE_CACHE.get(cacheKey);

  const pack = game.packs.get(packId);
  if (!pack) return new Map();
  const documents = await pack.getDocuments();
  const images = new Map();
  for (const document of documents) {
    const translatedImage = document.flags?.["broken-tales"]?.translations?.[language]?.img ?? document.img;
    if (!translatedImage) continue;
    images.set(document.uuid, translatedImage);
    images.set(`Compendium.${packId}.${document.id}`, translatedImage);
    images.set(`${packId}.${document.id}`, translatedImage);
    images.set(document.id, translatedImage);
    images.set(document._id, translatedImage);
    images.set(document.name, translatedImage);
  }
  LOCALIZED_PACK_IMAGE_CACHE.set(cacheKey, images);
  return images;
}

async function localizeBrokenTalesPackIndexes() {
  const language = selectedContentLanguage();
  if (!language || language === "en" || !game?.packs) return;

  for (const pack of game.packs) {
    if (!isBrokenTalesPackId(pack.collection)) continue;
    try {
      const index = await pack.getIndex({ fields: ["flags.broken-tales.translations"] });
      for (const entry of index) {
        const translation = entry.flags?.["broken-tales"]?.translations?.[language];
        if (translation?.name) {
          entry.name = translation.name;
          if (entry.label) entry.label = translation.name;
          if (entry.title) entry.title = translation.name;
        }
        if (translation?.img) entry.img = translation.img;
      }
      pack.apps?.forEach?.((app) => app.render?.(false));
    } catch (error) {
      console.warn(`Broken Tales | Could not localize compendium index ${pack.collection}.`, error);
    }
  }
}

async function localizeBrokenTalesCompendiumNames(root, packId) {
  const language = selectedContentLanguage();
  if (!root || !packId || language === "en") return;
  const names = await translatedPackNames(packId, language);
  const images = await translatedPackImages(packId, language);
  if (!names.size && !images.size) return;

  const selector = [
    "[data-document-id]",
    "[data-document-uuid]",
    "[data-entry-id]",
    "[data-uuid]",
    "[data-id]",
    "[data-tooltip]",
    ".directory-item.document",
    ".directory-item",
    ".compendium-entry"
  ].join(", ");

  root.querySelectorAll(selector).forEach((entry) => {
    const label = entry.querySelector(".entry-name, .document-name, .compendium-entry-name, .name, .title, h4, h3, a")
      ?? Array.from(entry.querySelectorAll("span")).find((span) => names.has(span.textContent?.trim()))
      ?? entry;
    const keys = [
      entry.dataset.documentId,
      entry.dataset.documentUuid,
      entry.dataset.entryId,
      entry.dataset.uuid,
      entry.dataset.id,
      entry.dataset.tooltip,
      label.dataset?.documentId,
      label.dataset?.documentUuid,
      label.dataset?.entryId,
      label.dataset?.uuid,
      label.dataset?.id,
      label.dataset?.tooltip,
      label.textContent?.trim(),
      entry.textContent?.trim(),
      `Compendium.${packId}.${entry.dataset.documentId ?? entry.dataset.entryId ?? entry.dataset.id ?? ""}`
    ].filter(Boolean);

    const translatedName = keys.map((key) => names.get(key)).find(Boolean);
    const translatedImage = keys.map((key) => images.get(key)).find(Boolean);
    if (translatedName) {
      label.textContent = translatedName;
      if (entry.dataset.tooltip) entry.dataset.tooltip = translatedName;
      if (entry.title) entry.title = translatedName;
    }
    if (translatedImage) {
      const image = entry.querySelector("img");
      if (image) {
        image.src = translatedImage;
        image.alt = translatedName ?? image.alt ?? "";
      }
    }
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, textarea, input, button")) return NodeFilter.FILTER_REJECT;
      return names.has(node.nodeValue?.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const translatedName = names.get(node.nodeValue.trim());
    if (translatedName) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), translatedName);
  }
}

async function scenarioGiftGroups(packId) {
  if (!isScenarioGiftPackId(packId)) return new Map();
  if (SCENARIO_GIFT_GROUP_CACHE.has(packId)) return SCENARIO_GIFT_GROUP_CACHE.get(packId);

  const pack = game.packs.get(packId);
  if (!pack) return new Map();
  const documents = await pack.getDocuments();
  const groups = new Map();
  for (const document of documents) {
    const scenario = document.system?.scenario
      ?? document.flags?.["broken-tales"]?.scenario
      ?? document.flags?.scenarioId
      ?? document.system?.source
      ?? document.flags?.["broken-tales"]?.sourceDirectory;
    if (!scenario) continue;
    groups.set(document.id, scenario);
    groups.set(document.name, scenario);
  }
  SCENARIO_GIFT_GROUP_CACHE.set(packId, groups);
  return groups;
}

async function groupScenarioGiftCompendium(root, packId) {
  const groups = await scenarioGiftGroups(packId);
  if (!groups.size) return;

  root.querySelectorAll(".broken-tales-scenario-gift-group").forEach((header) => header.remove());
  let lastScenario = "";
  root.querySelectorAll("[data-document-id], [data-entry-id], .directory-item.document").forEach((entry) => {
    const documentId = entry.dataset.documentId ?? entry.dataset.entryId ?? entry.dataset.id;
    const label = entry.querySelector(".entry-name, .document-name, h4, h3") ?? entry;
    const scenario = groups.get(documentId) ?? groups.get(label.textContent?.trim());
    if (!scenario || scenario === lastScenario) return;
    lastScenario = scenario;

    const header = document.createElement("li");
    header.className = "broken-tales-scenario-gift-group";
    header.textContent = scenario;
    entry.before(header);
  });
}

function observeCompendiumLocalization(root, packId) {
  if (!root || LOCALIZED_COMPENDIUM_OBSERVERS.has(root)) return;
  const target = root.querySelector(".directory-list, .scrollable, .window-content") ?? root;
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    window.setTimeout(() => {
      pending = false;
      enhanceBrokenTalesCompendiumMarkup(root);
      if (isBrokenTalesPackId(packId)) localizeBrokenTalesCompendiumNames(root, packId);
      if (isScenarioGiftPackId(packId)) groupScenarioGiftCompendium(root, packId);
    }, 80);
  });
  observer.observe(target, { childList: true, subtree: true });
  LOCALIZED_COMPENDIUM_OBSERVERS.add(root);
}

async function cleanupLegacyBrokenTalesMacros() {
  if (!game.user.isGM) return;
  const desiredNames = new Set(ESSENTIAL_MACRO_NAME_KEYS.map((key) => game.i18n.localize(key)));
  const preservedCommands = new Set();
  const deletable = game.macros.filter((macro) => {
    const command = String(macro.command ?? "").trim();
    if (ESSENTIAL_MACRO_COMMANDS.has(command)) {
      if (desiredNames.has(macro.name) && !preservedCommands.has(command)) {
        preservedCommands.add(command);
        return false;
      }
      return true;
    }
    if (/game\.brokenTales\./.test(command)) return true;
    return LEGACY_MACRO_PATTERNS.some((pattern) => pattern.test(macro.name ?? ""));
  });
  for (const macro of deletable) await macro.delete();
}

async function resetUtilityMacros() {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.GMOnly"));
    return;
  }
  await cleanupLegacyBrokenTalesMacros();
  await Promise.all([
    createPregenRepairMacro(),
    createDeleteWorldActorsItemsMacro(),
    createSyncWorldActorsMacro()
  ]);
  ui.notifications.info(game.i18n.localize("BROKENTALES.Macros.ResetComplete"));
}

Hooks.once("init", () => {
  CONFIG.BROKENTALES = {
    actorTypeLabels: {
      hunter: "BROKENTALES.ActorTypes.Hunter",
      npc: "BROKENTALES.ActorTypes.NPC",
      threat: "BROKENTALES.ActorTypes.Threat",
      villager: "BROKENTALES.ActorTypes.Villager",
      essence: "BROKENTALES.ActorTypes.Essence"
    },
    itemTypeLabels: {
      descriptor: "BROKENTALES.ItemTypes.Descriptor",
      gift: "BROKENTALES.ItemTypes.Gift",
      darkEgo: "BROKENTALES.ItemTypes.DarkEgo",
      equipment: "BROKENTALES.ItemTypes.Equipment",
      condition: "BROKENTALES.ItemTypes.Condition",
      wound: "BROKENTALES.ItemTypes.Wound",
      storyElement: "BROKENTALES.ItemTypes.StoryElement"
    },
    threatRankOptions: {
      "Easy 3": "BROKENTALES.ThreatRanks.Easy",
      "Medium 5": "BROKENTALES.ThreatRanks.Medium",
      "Hard 7": "BROKENTALES.ThreatRanks.Hard"
    },
    threatRankOpposition: {
      "Easy 3": 3,
      "Medium 5": 5,
      "Hard 7": 7
    },
    detailSuggestions: {
      concepts: [
        "Core Book",
        "Core Book: Fox and Cat",
        "The Broken Ones",
        "Lost Stories",
        "Lost Stories Exclusives",
        "Dark Presence",
        "Threat / Complex NPC",
        "Villager",
        "Spirit / Essence"
      ],
      roles: [
        "Hunter of the Order",
        "Spirit Hunter",
        "Dark Presence",
        "Main NPC",
        "Minor NPC",
        "Scenario Actor",
        "Threat",
        "Threat / Complex NPC",
        "Villager",
        "Spirit / Essence"
      ]
    },
    roll: {
      outcomes: {
        botch: {
          id: "botch",
          label: "BROKENTALES.Roll.Outcomes.Botch",
          cssClass: "failure"
        },
        failure: {
          id: "failure",
          label: "BROKENTALES.Roll.Outcomes.Failure",
          cssClass: "failure"
        },
        cost: {
          id: "cost",
          label: "BROKENTALES.Roll.Outcomes.Cost",
          cssClass: "cost"
        },
        success: {
          id: "success",
          label: "BROKENTALES.Roll.Outcomes.Success",
          cssClass: "success"
        },
        increment: {
          id: "increment",
          label: "BROKENTALES.Roll.Outcomes.Increment",
          cssClass: "increment"
        }
      }
    }
  };

  CONFIG.Actor.documentClass = BrokenTalesActor;
  CONFIG.Item.documentClass = BrokenTalesItem;

  CONFIG.Actor.dataModels.hunter = HunterData;
  CONFIG.Actor.dataModels.npc = NPCData;
  CONFIG.Actor.dataModels.essence = EssenceData;
  CONFIG.Actor.dataModels.villager = VillagerData;
  CONFIG.Actor.dataModels.threat = ThreatData;

  CONFIG.Item.dataModels.descriptor = DescriptorData;
  CONFIG.Item.dataModels.gift = GiftData;
  CONFIG.Item.dataModels.darkEgo = DarkEgoData;
  CONFIG.Item.dataModels.equipment = EquipmentData;
  CONFIG.Item.dataModels.condition = ConditionData;
  CONFIG.Item.dataModels.wound = WoundData;
  CONFIG.Item.dataModels.storyElement = StoryElementData;

  const actorSheet = foundry.applications.sheets.ActorSheetV2 || foundry.appv1.sheets.ActorSheet;
  const itemSheet = foundry.applications.sheets.ItemSheetV2 || foundry.appv1.sheets.ItemSheet;

  Actors.unregisterSheet("core", actorSheet);
  Items.unregisterSheet("core", itemSheet);
  Actors.registerSheet("broken-tales", BrokenTalesActorSheet, {
    types: ["hunter", "npc", "threat", "villager", "essence"],
    makeDefault: true,
    label: "BROKENTALES.Sheets.Actor"
  });
  Items.registerSheet("broken-tales", BrokenTalesItemSheet, {
    types: ["descriptor", "gift", "darkEgo", "equipment", "condition", "wound", "storyElement"],
    makeDefault: true,
    label: "BROKENTALES.Sheets.Item"
  });

  game.settings.register("broken-tales", "contentLanguage", {
    name: "BROKENTALES.Settings.ContentLanguage.Name",
    hint: "BROKENTALES.Settings.ContentLanguage.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "system",
    choices: {
      system: "BROKENTALES.Settings.ContentLanguage.System",
      en: "BROKENTALES.Settings.ContentLanguage.English",
      es: "BROKENTALES.Settings.ContentLanguage.Spanish"
    },
    requiresReload: true
  });
});

function enhanceBrokenTalesApplication(application, element) {
  const root = applicationElement(element);
  if (!root) return;

  const packId = packIdFromApplication(application);
  const domPackId = packId || packIdFromRoot(root);
  if (isBrokenTalesPackId(domPackId)) {
    root.classList.add("broken-tales-compendium");
    root.dataset.pack = domPackId;
  }

  enhanceBrokenTalesCompendiumMarkup(root);
  if (isBrokenTalesPackId(domPackId)) {
    localizeBrokenTalesCompendiumNames(root, domPackId);
    for (const delay of [75, 250, 600]) {
      window.setTimeout(() => localizeBrokenTalesCompendiumNames(root, domPackId), delay);
    }
    observeCompendiumLocalization(root, domPackId);
  }
  if (isScenarioGiftPackId(domPackId)) groupScenarioGiftCompendium(root, domPackId);
}

Hooks.on("renderApplicationV2", enhanceBrokenTalesApplication);
Hooks.on("renderCompendium", enhanceBrokenTalesApplication);

Hooks.once("ready", async () => {
  game.brokenTales = {
    contentLanguage: selectedContentLanguage,
    importPregens,
    repairPregens,
    refreshPregenAssets,
    createPregenImportMacro,
    createPregenRepairMacro,
    importLibrary,
    createLibraryImportMacro,
    importDarkPresences,
    repairDarkPresences,
    createDarkPresenceImportMacro,
    createDarkPresenceRepairMacro,
    cleanupDuplicateActors,
    createCleanupDuplicateActorsMacro,
    deleteWorldActorsAndItems,
    createDeleteWorldActorsItemsMacro,
    syncWorldActorsFromCompendia,
    createSyncWorldActorsMacro,
    importSupportItems,
    createSupportImportMacro,
    importReferenceActors,
    createReferenceActorsImportMacro,
    resetUtilityMacros,
    auditCompendia: auditBrokenTalesCompendia,
    repairCompendia: repairBrokenTalesCompendia
  };

  try {
    await localizeBrokenTalesPackIndexes();
  } catch (error) {
    console.warn("Broken Tales | Could not localize compendium indexes.", error);
  }

  if (!game.user.isGM) return;
  try {
    await cleanupLegacyBrokenTalesMacros();
    await Promise.all([
      createPregenRepairMacro(),
      createDeleteWorldActorsItemsMacro(),
      createSyncWorldActorsMacro()
    ]);
    await refreshPregenAssets({ notify: false });
    await repairEmptyBrokenTalesCompendia();
  } catch (error) {
    console.warn("Broken Tales | Could not create utility macros.", error);
  }
});
