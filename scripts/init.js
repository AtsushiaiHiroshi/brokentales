// Import custom actor class
import { PBTAActor } from "./actor.js";

// Import actor sheets
import { BrokenTalesCharacterSheet } from "./character-sheet.js";
import { BrokenTalesNPCSheet } from "./npc-sheet.js";

// Import item sheets
import { DescriptorSheet, GiftSheet } from "../sheets/item-sheets.js";

Hooks.once("init", async function () {
  console.log("Broken Tales | Inicializando sistema...");

  // Registrar clase de actor personalizada
  CONFIG.Actor.documentClass = PBTAActor;

  // Registrar hojas de actores
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("brokentales", BrokenTalesCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "BROKENTALES.Actor.Character"
  });
  Actors.registerSheet("brokentales", BrokenTalesNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "BROKENTALES.Actor.NPC"
  });

  // Registrar hojas de ítems
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("brokentales", DescriptorSheet, {
    types: ["descriptor"],
    makeDefault: true,
    label: "BROKENTALES.Item.Descriptor"
  });
  Items.registerSheet("brokentales", GiftSheet, {
    types: ["gift"],
    makeDefault: true,
    label: "BROKENTALES.Item.Gift"
  });

  // Cargar plantillas
  await loadTemplates([
    "systems/brokentales/templates/actor/character.html",
    "systems/brokentales/templates/actor/npc.html",
    "systems/brokentales/templates/item/descriptor.html",
    "systems/brokentales/templates/item/gift.html"
  ]);

  // Configuración global del sistema
  CONFIG.Combat.initiative = {
    formula: "1d6 + @attributes.soma.current",
    decimals: 0
  };

  console.log("Broken Tales | Sistema inicializado.");
});
