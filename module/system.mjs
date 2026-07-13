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
});

Hooks.once("ready", async () => {
  game.brokenTales = {
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
    await Promise.all([
      createPregenImportMacro(),
      createPregenRepairMacro(),
      createDarkPresenceImportMacro(),
      createDarkPresenceRepairMacro(),
      createCleanupDuplicateActorsMacro(),
      createDeleteWorldActorsItemsMacro(),
      createSyncWorldActorsMacro(),
      createLibraryImportMacro(),
      createSupportImportMacro(),
      createReferenceActorsImportMacro()
    ]);
    await refreshPregenAssets({ notify: false });
  } catch (error) {
    console.warn("Broken Tales | Could not create utility macros.", error);
  }
});
