// Importaciones al inicio
import { BrokenTalesCharacterSheet } from "../templates/actor/character-sheet.js";
import { BrokenTalesNPCSheet } from "../templates/actor/npc-sheet.js";

/**
 * Registro de hojas de actor para Broken Tales
 */
export function registerActorSheets() {
  Actors.unregisterSheet("core", ActorSheet); // Desregistrar la hoja base

  Actors.registerSheet("brokentales", BrokenTalesCharacterSheet, {
    types: ["character"],
    makeDefault: true,
  });

  Actors.registerSheet("brokentales", BrokenTalesNPCSheet, {
    types: ["npc"],
    makeDefault: true,
  });
}
