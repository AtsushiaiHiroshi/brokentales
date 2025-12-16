// ============================================================================
// roll.js - CORREGIDO
// ============================================================================

// Initialize namespace
if (!game.brokenTales) {
  game.brokenTales = {};
}

// Function 1: Basic roll (no difficulty)
async function brokenTalesRoll(diceCount = 3, actor = null) {
  if (!actor) {
    actor = canvas.tokens.controlled[0]?.actor || game.user.character;
  }

  if (!actor) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.MissingActor"));
    return;
  }

  const roll = new Roll(`${diceCount}d6`);
  await roll.evaluate({ async: true });
  const results = roll.dice[0].results.map((r) => r.result);

  // ✅ CORREGIDO: Calculate critical failure FIRST
  const hasCriticalFailure = results.includes(1);
  const successes = hasCriticalFailure
    ? 0
    : results.filter((r) => r >= 2).length;

  // Build chat message
  let flavor = `<strong>${game.i18n.format("BROKENTALES.Roll.Title", {
    dice: diceCount,
  })}</strong><br>`;
  flavor += `${game.i18n.localize("BROKENTALES.Roll.Results")}: [${results.join(
    ", "
  )}]<br>`;

  if (hasCriticalFailure) {
    flavor += `<strong style="color:red;">${game.i18n.localize(
      "BROKENTALES.Roll.CriticalFailure"
    )}</strong>`;
  } else {
    flavor += `<strong style="color:green;">${game.i18n.localize(
      "BROKENTALES.Roll.Successes"
    )}:</strong> ${successes}`;
  }

  // Send message to chat
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor,
  });
}

// Function 2: Roll with difficulty
async function rollWithDifficulty(
  actor,
  diceCount = 3,
  difficulty = 3,
  somaBonus = 0
) {
  if (!actor) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.MissingActor"));
    return;
  }

  // Use actor's built-in method if available
  if (typeof actor.rollWithDifficulty === "function") {
    return await actor.rollWithDifficulty(diceCount, difficulty, somaBonus);
  }

  // Fallback implementation
  const roll = new Roll(`${diceCount}d6`);
  await roll.evaluate({ async: true });
  const results = roll.dice[0].results.map((r) => r.result);

  const hasCriticalFailure = results.includes(1);
  const baseSuccesses = hasCriticalFailure
    ? 0
    : results.filter((r) => r >= 2).length;
  const totalSuccesses = baseSuccesses + somaBonus;

  // Determine outcome
  let outcome = "";
  if (hasCriticalFailure) {
    outcome = game.i18n.localize("BROKENTALES.Roll.CriticalFailure");
  } else if (totalSuccesses < difficulty) {
    outcome = game.i18n.format("BROKENTALES.Roll.Failure", {
      difficulty,
      successes: totalSuccesses,
    });
  } else if (totalSuccesses === difficulty) {
    outcome = game.i18n.format("BROKENTALES.Roll.SuccessExact", {
      successes: totalSuccesses,
    });
  } else {
    outcome = game.i18n.format("BROKENTALES.Roll.SuccessPlus", {
      successes: totalSuccesses,
    });
  }

  // Build chat message
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `
      <div class="bt-chat-roll">
        <h2>${game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")}</h2>
        <b>${game.i18n.localize("BROKENTALES.Roll.Character")}:</b> ${
      actor.name
    }<br>
        <b>${game.i18n.localize(
          "BROKENTALES.Roll.Difficulty"
        )}:</b> ${difficulty}<br>
        ${somaBonus > 0 ? `<div><b>Soma Bonus:</b> +${somaBonus}</div>` : ""}
        <div class="dice-result">🎲 ${game.i18n.localize(
          "BROKENTALES.Roll.Results"
        )}: ${results.join(", ")}</div>
        ${
          somaBonus > 0
            ? `<div><em>Base: ${baseSuccesses} + Soma: ${somaBonus} = ${totalSuccesses}</em></div>`
            : ""
        }
        <div class="outcome ${
          hasCriticalFailure
            ? "fail"
            : totalSuccesses >= difficulty
            ? "success"
            : "warning"
        }">
          ${outcome}
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    rolls: [roll],
  };

  await ChatMessage.create(chatData);
}

// Expose functions to namespace
game.brokenTales.roll = brokenTalesRoll;
game.brokenTales.rollWithDifficulty = rollWithDifficulty;

// Hook: Add roll buttons to actor sheet (if not already handled by sheet)
Hooks.on("renderActorSheet", (app, html, data) => {
  html.find(".bt-roll-difficulty").click(async (event) => {
    const difficulty = parseInt(event.currentTarget.dataset.difficulty || "3");
    const diceCount = parseInt(html.find("#bt-dice-count").val()) || 3;
    await rollWithDifficulty(app.actor, diceCount, difficulty);
  });

  html.find(".bt-macro-roll-button").click(async () => {
    const diceCount = parseInt(html.find("#bt-dice-count").val()) || 3;
    await brokenTalesRoll(diceCount, app.actor);
  });

  html.find(".bt-macro-repeat-button").click(async () => {
    if (game.brokenTales.repeatLastRoll) {
      await game.brokenTales.repeatLastRoll();
    }
  });
});

console.log("Broken Tales | Roll system loaded");
