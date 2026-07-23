/**
 * Broken Tales Configuration
 * Defines system-wide constants and configuration options
 */

export const BROKENTALES = {};

/**
 * NPC Types
 */
BROKENTALES.npcTypes = {
  villager: "BROKENTALES.Fields.Villager",
  creature: "BROKENTALES.Fields.Creature",
  adversary: "BROKENTALES.Fields.Adversary",
  broken_one: "BROKENTALES.Fields.broken_one",
  threat: "BROKENTALES.Fields.ThreatType",
  object: "BROKENTALES.Fields.Object",
  obstacle: "BROKENTALES.Fields.Obstacle",
};

/**
 * Opposition Levels
 */
BROKENTALES.oppositionLevels = {
  3: "BROKENTALES.Fields.Easy",
  5: "BROKENTALES.Fields.Normal",
  7: "BROKENTALES.Fields.Hard",
};

/**
 * Item Types
 */
BROKENTALES.itemTypes = {
  descriptor: "BROKENTALES.Item.Descriptor",
  gift: "BROKENTALES.Item.Gift",
  scenarioGift: "BROKENTALES.Item.ScenarioGift",
};

/**
 * Descriptor Types
 */
BROKENTALES.descriptorTypes = {
  narrative: "BROKENTALES.Narrative",
  improvement: "BROKENTALES.Improvement",
};

/**
 * Gift Types
 */
BROKENTALES.giftTypes = {
  mechanical: "BROKENTALES.Mechanical",
  narrative: "BROKENTALES.Narrative",
  darkEgo: "BROKENTALES.DarkEgo",
};

/**
 * Dice System
 */
BROKENTALES.dice = {
  successThreshold: 2, // Results >= 2 are successes
  criticalFailure: 1, // Rolling a 1 negates all successes
  maxDice: 20, // Maximum dice that can be rolled
  minDice: 0, // Automatic successes can resolve a check without rolling dice
};

/**
 * Difficulty Levels
 */
BROKENTALES.difficulties = {
  none: 0,
  easy: 3,
  normal: 5,
  hard: 7,
};

/**
 * Soma System
 */
BROKENTALES.soma = {
  defaultMax: 6,
  minValue: 0,
  costPerSuccess: 1, // 1 Soma = 1 Additional Success
};

/**
 * Wounds System
 */
BROKENTALES.wounds = {
  defaultMax: 3,
  extraMax: 1,
  minValue: 0,
};

/**
 * Experience System
 */
BROKENTALES.experience = {
  checkDescriptor: 1, // XP for checking a descriptor
  scenarioCompletion: 3, // XP for completing a scenario
  interludeParticipation: 1, // XP for participating in an interlude
  newDescriptor: 5, // XP cost for a new descriptor
  newGift: 5, // XP cost for a new gift
  somaIncrease: 5, // XP cost to increase max Soma by 1
};

/**
 * Scenarios
 */
BROKENTALES.scenarios = {
  "red-hood-iskra": "BROKENTALES.Scenarios.RedHoodIskra",
};

/**
 * Default Icons
 */
BROKENTALES.defaultIcons = {
  character: "systems/brokentales/assets/icons/hunter.svg",
  npc: "systems/brokentales/assets/icons/npc.svg",
  descriptor: "systems/brokentales/assets/icons/descriptor.svg",
  gift: "systems/brokentales/assets/icons/gift.svg",
  scenarioGift: "systems/brokentales/assets/icons/scenario-gift.svg",
};

/**
 * CSS Classes
 */
BROKENTALES.cssClasses = {
  roll: {
    success: "bt-roll-success",
    failure: "bt-roll-failure",
    critical: "bt-roll-critical",
    exactSuccess: "bt-roll-exact",
  },
};

/**
 * Handlebars Helpers
 */
export function registerHandlebarsHelpers() {
  // Check if a value is in an array
  Handlebars.registerHelper("includes", function (array, value) {
    return Array.isArray(array) && array.includes(value);
  });

  // Compare two values
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  // Less than comparison
  Handlebars.registerHelper("lt", function (a, b) {
    return a < b;
  });

  // Greater than comparison
  Handlebars.registerHelper("gt", function (a, b) {
    return a > b;
  });

  // Times loop
  Handlebars.registerHelper("times", function (n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // Select helper for dropdowns
  Handlebars.registerHelper("select", function (selected, options) {
    const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected));
    const rgx = new RegExp(" value=['\"]" + escapedValue + "['\"]");
    return options.fn(this).replace(rgx, "$& selected");
  });

  // Checked helper for checkboxes
  Handlebars.registerHelper("checked", function (value) {
    return value ? "checked" : "";
  });

  // Localize and format helpers with type validation
  Handlebars.registerHelper("localize", function (key) {
    // Validate that key is a string before calling localize
    if (typeof key !== "string") {
      console.warn(
        "BrokenTales | localize helper received non-string key:",
        key
      );
      return key;
    }
    return game.i18n.localize(key);
  });

  Handlebars.registerHelper("format", function (key, data) {
    // Validate that key is a string before calling format
    if (typeof key !== "string") {
      console.warn("BrokenTales | format helper received non-string key:", key);
      return key;
    }
    return game.i18n.format(key, data);
  });
}

console.log("Broken Tales | Configuration loaded");
