/**
 * Broken Tales Template Preloader
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */

export async function preloadHandlebarsTemplates() {
  return loadTemplates([
    // Actor partials
    "systems/brokentales/templates/actor/parts/actor-features.html",
    "systems/brokentales/templates/actor/parts/actor-items.html",
    "systems/brokentales/templates/actor/parts/actor-effects.html",
    "systems/brokentales/templates/actor/parts/npc-features.html",
    "systems/brokentales/templates/actor/parts/npc-abilities.html",

    // Item partials
    "systems/brokentales/templates/item/parts/item-effects.html",

    // Character sheet sections
    "systems/brokentales/templates/actor/character.html",
    "systems/brokentales/templates/actor/character-sheet.html",

    // NPC sheet sections
    "systems/brokentales/templates/actor/npc.html",
    "systems/brokentales/templates/actor/npc-sheet.html",

    // Item sheets
    "systems/brokentales/templates/item/descriptor.html",
    "systems/brokentales/templates/item/gift.html",
    "systems/brokentales/templates/item/scenarioGift.html",
    "systems/brokentales/templates/item/clue.html",
    "systems/brokentales/templates/item/object.html",
    "systems/brokentales/templates/item/item-sheet.html",
  ]);
}

console.log("Broken Tales | Templates preloaded");
