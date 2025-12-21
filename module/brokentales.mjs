/**
 * Broken Tales System
 * Main initialization file
 * Author: Broken Tales System Developer
 * Compatible with Foundry VTT v11+
 */

// Import configuration
import { BROKENTALES, registerHandlebarsHelpers } from "./helpers/config.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { registerSystemSettings } from "./helpers/settings.mjs";
import { continueDialog } from "./helpers/dialog.mjs";

// Import document classes
import { BrokenTalesActor } from "./documents/actor.mjs";
import { BrokenTalesItem } from "./documents/item.mjs";

// Import sheet classes
import { BrokenTalesActorSheet } from "./sheets/actor-sheet.mjs";
import { BrokenTalesItemSheet } from "./sheets/item-sheet.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log(`Broken Tales | Initializing Broken Tales System`);

  // Add utility classes to CONFIG
  game.brokentales = {
    BrokenTalesActor,
    BrokenTalesItem,
    rollItemMacro,
  };

  // Define custom Document classes
  CONFIG.BROKENTALES = BROKENTALES;
  CONFIG.Actor.documentClass = BrokenTalesActor;
  CONFIG.Item.documentClass = BrokenTalesItem;

  // Register sheet application classes (using namespaced references)
  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.appv1.sheets.ActorSheet
  );
  foundry.documents.collections.Actors.registerSheet(
    "brokentales",
    BrokenTalesActorSheet,
    {
      types: ["character", "npc"],
      makeDefault: true,
      label: "BROKENTALES.SheetClassActor",
    }
  );

  foundry.documents.collections.Items.unregisterSheet(
    "core",
    foundry.appv1.sheets.ItemSheet
  );
  foundry.documents.collections.Items.registerSheet(
    "brokentales",
    BrokenTalesItemSheet,
    {
      types: ["descriptor", "gift", "scenarioGift", "clue", "object"],
      makeDefault: true,
      label: "BROKENTALES.SheetClassItem",
    }
  );

  // Register Handlebars helpers
  registerHandlebarsHelpers();

  // Preload Handlebars templates
  await preloadHandlebarsTemplates();

  // ✅ CORREGIDO: Register system settings from settings.mjs
  registerSystemSettings();

  console.log(`Broken Tales | System initialized`);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

  // Initialize game.brokenTales namespace for macros
  game.brokenTales = game.brokenTales || {};

  // Add roll functions to namespace for macro access
  game.brokenTales.rollWithDifficulty = async (
    actor,
    diceCount,
    difficulty,
    somaBonus = 0
  ) => {
    if (!actor) {
      ui.notifications.warn(
        game.i18n.localize("BROKENTALES.Roll.MissingActor")
      );
      return;
    }
    return await actor.rollWithDifficulty(diceCount, difficulty, somaBonus);
  };

  game.brokenTales.showRollDialog = async (actor) => {
    if (!actor) {
      ui.notifications.warn(
        game.i18n.localize("BROKENTALES.Roll.MissingActor")
      );
      return;
    }
    return await actor.showRollDialog();
  };

  // ✅ Add soma boost roll for macros
  game.brokenTales.somaRoll = async (diceCount = 3, somaSpent = 1) => {
    const actor = game.user.character;
    if (!actor) {
      ui.notifications.error(
        game.i18n.localize("BROKENTALES.Roll.MissingActor")
      );
      return;
    }

    const soma = actor.system?.attributes?.soma;
    if (!soma || typeof soma.current !== "number") {
      ui.notifications.error(
        game.i18n.localize("BROKENTALES.Error.InvalidSoma")
      );
      return;
    }

    if (soma.current < somaSpent) {
      ui.notifications.warn(
        game.i18n.format("BROKENTALES.Roll.NotEnoughSoma", {
          name: actor.name,
        })
      );
      return;
    }

    // Spend soma
    await actor.update({
      "system.attributes.soma.current": soma.current - somaSpent,
    });

    // Perform roll
    const roll = new Roll(`${diceCount}d6`, actor.getRollData());
    await roll.evaluate({ async: true });

    const results = roll.dice[0].results.map((r) => r.result);
    const hasCriticalFailure = results.includes(1);
    const baseSuccesses = hasCriticalFailure
      ? 0
      : results.filter((r) => r >= 2).length;
    const totalSuccesses = baseSuccesses + somaSpent;

    // Build flavor message
    let flavor = `<strong>${game.i18n.format(
      "BROKENTALES.Roll.SomaBoostTitle",
      {
        dice: diceCount,
      }
    )}</strong><br>`;
    flavor += `${game.i18n.localize(
      "BROKENTALES.Roll.Results"
    )}: [${results.join(", ")}]<br>`;
    flavor += `${game.i18n.localize(
      "BROKENTALES.Roll.SomaSpent"
    )}: <strong>${somaSpent}</strong><br>`;

    if (hasCriticalFailure) {
      flavor += `<strong style="color:red;">${game.i18n.localize(
        "BROKENTALES.Roll.CriticalFailure"
      )}</strong>`;
    } else {
      flavor += `<strong style="color:blue;">${game.i18n.localize(
        "BROKENTALES.Roll.TotalSuccesses"
      )}:</strong> ${totalSuccesses}`;
    }

    // Send to chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor,
    });
  };

  // ✅ Add Dark Ego activation roll for macros
  game.brokenTales.darkEgoRoll = async (diceCount = 3, bonusSuccesses = 1) => {
    const actor = game.user.character;
    if (!actor) {
      ui.notifications.error(
        game.i18n.localize("BROKENTALES.Roll.MissingActor")
      );
      return;
    }

    const systemData = actor.system;
    if (!systemData?.attributes?.soma || !systemData?.attributes?.wounds) {
      ui.notifications.error(
        game.i18n.localize("BROKENTALES.Error.InvalidAttributes")
      );
      return;
    }

    if (!systemData.darkEgo || !systemData.darkEgo.trigger) {
      ui.notifications.error(game.i18n.localize("BROKENTALES.Error.NoDarkEgo"));
      return;
    }

    // Perform roll
    const roll = new Roll(`${diceCount}d6`, actor.getRollData());
    await roll.evaluate({ async: true });

    const results = roll.dice[0].results.map((r) => r.result);
    const hasCriticalFailure = results.includes(1);
    const baseSuccesses = hasCriticalFailure
      ? 0
      : results.filter((r) => r >= 2).length;
    const totalSuccesses = baseSuccesses + bonusSuccesses;

    // Build flavor message
    let flavor = `<strong>${game.i18n.format("BROKENTALES.Roll.DarkEgoTitle", {
      dice: diceCount,
    })}</strong><br>`;
    flavor += `<div><strong>${game.i18n.localize(
      "BROKENTALES.Fields.DarkEgo"
    )}:</strong> ${
      systemData.darkEgo.gift || game.i18n.localize("BROKENTALES.Unnamed")
    }</div>`;
    flavor += `<div><em>${game.i18n.localize(
      "BROKENTALES.Fields.Trigger"
    )}:</em> ${systemData.darkEgo.trigger}</div><br>`;
    flavor += `${game.i18n.localize(
      "BROKENTALES.Roll.Results"
    )}: [${results.join(", ")}]<br>`;
    flavor += `${game.i18n.localize(
      "BROKENTALES.Roll.BonusSuccesses"
    )}: <strong>${bonusSuccesses}</strong><br>`;

    if (hasCriticalFailure) {
      flavor += `<strong style="color:red;">${game.i18n.localize(
        "BROKENTALES.Roll.CriticalFailure"
      )}</strong>`;
    } else {
      flavor += `<strong style="color:purple;">${game.i18n.localize(
        "BROKENTALES.Roll.TotalSuccesses"
      )}:</strong> ${totalSuccesses}`;
    }

    // Send to chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor,
    });
  };

  // ✅ Add repeat last roll function for macros
  game.brokenTales.repeatLastRoll = async () => {
    const messages = game.messages.contents.slice().reverse();

    for (const msg of messages) {
      if (!msg.flavor || !msg.rolls) continue;

      const isBrokenRoll =
        msg.flavor.includes(game.i18n.localize("BROKENTALES.Roll.Title")) ||
        msg.flavor.includes(
          game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")
        ) ||
        msg.flavor.includes(
          game.i18n.localize("BROKENTALES.Roll.SomaBoostTitle")
        ) ||
        msg.flavor.includes(
          game.i18n.localize("BROKENTALES.Roll.DarkEgoTitle")
        );

      const roll = msg.rolls[0];

      if (isBrokenRoll && roll) {
        const diceCount = roll.terms?.[0]?.number || 3;
        const difficultyMatch = msg.flavor.match(
          new RegExp(
            `${game.i18n.localize(
              "BROKENTALES.Roll.Difficulty"
            )}\\s*:\\s*(\\d+)`,
            "i"
          )
        );
        const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : 3;

        const somaMatch = msg.flavor.match(
          /Soma\s+(?:Bonus|Spent):\s*\+?(\d+)/i
        );
        const somaBonus = somaMatch ? parseInt(somaMatch[1]) : 0;

        const actor = game.actors.get(msg.speaker?.actor);

        if (!actor) {
          ui.notifications.warn(
            game.i18n.localize("BROKENTALES.Roll.MissingActor")
          );
          return;
        }

        // Repeat the roll
        await game.brokenTales.rollWithDifficulty(
          actor,
          diceCount,
          difficulty,
          somaBonus
        );
        return;
      }
    }

    ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.NoPrevious"));
  };

  // ✅ Add dialog utility
  game.brokenTales.continueDialog = continueDialog;

  console.log("Broken Tales | System ready");
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  }

  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.brokentales.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );

  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "brokentales.itemMacro": true },
    });
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };

  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

/* -------------------------------------------- */
/*  Chat Commands                               */
/* -------------------------------------------- */

Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
  // Check for /roll command
  if (messageText.startsWith("/bt-roll") || messageText.startsWith("/btr")) {
    const match = messageText.match(
      /\/bt(?:-roll)?r?\s+(\d+)d6(?:\s+(\d+))?(?:\s+(\d+))?/i
    );

    if (match) {
      const diceCount = parseInt(match[1]);
      const difficulty = match[2] ? parseInt(match[2]) : 3;
      const somaBonus = match[3] ? parseInt(match[3]) : 0;

      const actor = canvas.tokens.controlled[0]?.actor || game.user.character;

      if (!actor) {
        ui.notifications.warn(
          game.i18n.localize("BROKENTALES.Roll.MissingActor")
        );
        return false;
      }

      game.brokenTales.rollWithDifficulty(
        actor,
        diceCount,
        difficulty,
        somaBonus
      );

      return false; // Prevent the message from being sent
    }
  }

  return true;
});

console.log("Broken Tales | Main system file loaded");
