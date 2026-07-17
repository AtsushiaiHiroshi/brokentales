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

const BROKEN_TALES_PACK_PREFIXES = [
  "broken-tales.",
  "broken-tales-broken-ones.",
  "broken-tales-lost-stories."
];

const ESSENTIAL_MACRO_COMMANDS = new Set([
  "await game.brokenTales.repairPregens();",
  "await game.brokenTales.syncWorldActorsFromCompendia({ cleanupDuplicates: true });",
  "await game.brokenTales.deleteWorldActorsAndItems();"
]);

const LEGACY_MACRO_PATTERNS = [
  /broken tales/i,
  /pregenerados de broken tales/i,
  /presencias oscuras de broken tales/i,
  /actores duplicados de broken tales/i
];

function isBrokenTalesPackId(packId) {
  return BROKEN_TALES_PACK_PREFIXES.some((prefix) => String(packId ?? "").startsWith(prefix));
}

function applicationElement(element) {
  if (element instanceof HTMLElement) return element;
  if (element?.[0] instanceof HTMLElement) return element[0];
  return null;
}

function packIdFromApplication(application) {
  return application?.collection?.metadata?.id
    ?? application?.collection?.collection
    ?? application?.document?.collection?.metadata?.id
    ?? application?.options?.collection
    ?? application?.options?.pack
    ?? "";
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

function selectedContentLanguage() {
  try {
    const configured = game.settings.get("broken-tales", "contentLanguage");
    if (configured && configured !== "system") return configured;
  } catch (_error) {
    // Settings are not available before ready; fall back to Foundry's UI language.
  }
  return game.i18n.lang?.startsWith("es") ? "es" : "en";
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
    names.set(document.id, translatedName);
    names.set(document.name, translatedName);
  }
  LOCALIZED_PACK_NAME_CACHE.set(cacheKey, names);
  return names;
}

async function localizeBrokenTalesCompendiumNames(root, packId) {
  const language = selectedContentLanguage();
  if (!root || !packId || language === "en") return;
  const names = await translatedPackNames(packId, language);
  if (!names.size) return;

  root.querySelectorAll("[data-document-id], [data-entry-id], .directory-item.document").forEach((entry) => {
    const documentId = entry.dataset.documentId ?? entry.dataset.entryId ?? entry.dataset.id;
    const label = entry.querySelector(".entry-name, .document-name, h4, h3") ?? entry;
    const translatedName = names.get(documentId) ?? names.get(label.textContent?.trim());
    if (!translatedName) return;
    label.textContent = translatedName;
  });
}

async function cleanupLegacyBrokenTalesMacros() {
  if (!game.user.isGM) return;
  const deletable = game.macros.filter((macro) => {
    const command = String(macro.command ?? "").trim();
    if (ESSENTIAL_MACRO_COMMANDS.has(command)) return false;
    if (/game\.brokenTales\./.test(command)) return true;
    return LEGACY_MACRO_PATTERNS.some((pattern) => pattern.test(macro.name ?? ""));
  });
  for (const macro of deletable) await macro.delete();
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

Hooks.on("renderApplicationV2", (application, element) => {
  const root = applicationElement(element);
  if (!root) return;

  const packId = packIdFromApplication(application);
  if (isBrokenTalesPackId(packId)) {
    root.classList.add("broken-tales-compendium");
    root.dataset.pack = packId;
  }

  enhanceBrokenTalesCompendiumMarkup(root);
  if (isBrokenTalesPackId(packId)) localizeBrokenTalesCompendiumNames(root, packId);
});

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
    createReferenceActorsImportMacro
  };

  if (!game.user.isGM) return;
  try {
    await cleanupLegacyBrokenTalesMacros();
    await Promise.all([
      createPregenRepairMacro(),
      createDeleteWorldActorsItemsMacro(),
      createSyncWorldActorsMacro()
    ]);
    await refreshPregenAssets({ notify: false });
  } catch (error) {
    console.warn("Broken Tales | Could not create utility macros.", error);
  }
});
