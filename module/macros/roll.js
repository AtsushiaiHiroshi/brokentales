// Roll.js - Broken Tales

let lastRoll = null;

// Function 1: Basic roll (no difficulty)
async function brokenTalesRoll(diceCount = 3) {
  const roll = new Roll(`${diceCount}d6`);
  roll.evaluateSync(); // Synchronous evaluation for Foundry v12
  const results = roll.dice[0].results.map(r => r.result);

  // Calculate successes and check for critical failure
  const successes = results.filter(r => r >= 2).length;
  const criticalFailure = results.includes(1);

  // Build chat message
  let flavor = `<strong>${game.i18n.format("BROKENTALES.Roll.Title", { dice: diceCount })}</strong><br>`;
  flavor += `${game.i18n.localize("BROKENTALES.Roll.Results")}: [${results.join(", ")}]<br>`;

  if (criticalFailure) {
    flavor += `<strong style="color:red;">${game.i18n.localize("BROKENTALES.Roll.CriticalFailure")}</strong>`;
  } else {
    flavor += `<strong style="color:green;">${game.i18n.localize("BROKENTALES.Roll.Successes")}:</strong> ${successes}`;
  }

  // Send message to chat
  roll.toMessage({
    speaker: ChatMessage.getSpeaker(),
    flavor: flavor
  });
}

// Initialize namespace
if (!game.brokenTales) {
  game.brokenTales = {};
}

// Function 2: Roll with difficulty
async function rollWithDifficulty(actor, diceCount = 3, difficulty = 2) {
  const roll = new Roll(`${diceCount}d6`);
  await roll.evaluate({ async: true });
  const results = roll.dice[0].results.map(r => r.result);

  // Calculate successes and check for critical failure
  const successes = results.filter(r => r >= 2).length;
  const criticalFailure = results.includes(1);

  // Determine outcome
  let outcome = "";
  if (criticalFailure) {
    outcome = game.i18n.localize("BROKENTALES.Roll.CriticalFailure");
  } else if (successes < difficulty) {
    outcome = game.i18n.format("BROKENTALES.Roll.Failure", { difficulty, successes });
  } else if (successes === difficulty) {
    outcome = game.i18n.format("BROKENTALES.Roll.SuccessExact", { successes });
  } else {
    outcome = game.i18n.format("BROKENTALES.Roll.SuccessPlus", { successes });
  }

  // Build chat message
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `
      <div class="bt-chat-roll">
        <h2>${game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")}</h2>
        <b>${game.i18n.localize("BROKENTALES.Roll.Character")}:</b> ${actor.name}<br>
        <b>${game.i18n.localize("BROKENTALES.Roll.Difficulty")}:</b> ${difficulty}<br>
        <div class="dice-result">🎲 ${game.i18n.localize("BROKENTALES.Roll.Results")}: ${results.join(", ")}</div>
        <div class="outcome ${criticalFailure ? 'fail' : (successes >= difficulty ? 'success' : 'warning')}">
          ${outcome}
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: roll
  };

  await ChatMessage.create(chatData);
}

// Function 3: Repeat last roll
async function repeatLastRoll() {
  const messages = game.messages.contents.slice().reverse();

  for (const msg of messages) {
    const roll = msg.rolls?.[0];
    if (roll) {
      const diceCount = roll.terms[0].number || 3;
      const difficultyMatch = msg.flavor?.match(/Difficulty:\s*(\d+)/i);
      const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : null;

      const actor = game.actors.get(msg.speaker.actor);
      if (!actor) {
        ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.MissingActor"));
        return;
      }

      if (difficulty !== null) {
        await rollWithDifficulty(actor, diceCount, difficulty);
      } else {
        await brokenTalesRoll(diceCount);
      }
      return;
    }
  }

  ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.NoPrevious"));
}

// Hook: Add roll buttons to actor sheet
Hooks.on("renderActorSheet", (app, html, data) => {
  html.find(".bt-roll-difficulty").click(async (event) => {
    const difficulty = parseInt(event.currentTarget.dataset.difficulty || "2");
    const diceCount = parseInt(html.find("#bt-dice-count").val()) || 3;
    await rollWithDifficulty(app.actor, diceCount, difficulty);
  });

  html.find(".bt-macro-roll-button").click(async () => {
    const diceCount = parseInt(html.find("#bt-dice-count").val()) || 3;
    await brokenTalesRoll(diceCount);
  });

  html.find(".bt-macro-repeat-button").click(async () => {
    await repeatLastRoll();
  });
});
