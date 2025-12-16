// ============================================================================
// reroll.js - CORREGIDO
// ============================================================================

async function repeatLastRoll() {
  const messages = game.messages.contents.slice().reverse();

  for (const msg of messages) {
    // Verificar si el mensaje tiene un flavor y si es una tirada de Broken Tales
    if (!msg.flavor || !msg.rolls) continue;

    const isBrokenRoll =
      msg.flavor.includes(game.i18n.localize("BROKENTALES.Roll.Title")) ||
      msg.flavor.includes(
        game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")
      );
    const roll = msg.rolls[0];

    if (isBrokenRoll && roll) {
      // Obtener la cantidad de dados y la dificultad desde el mensaje
      const diceCount = roll.terms?.[0]?.number || 3;
      const difficultyMatch = msg.flavor.match(
        new RegExp(
          `${game.i18n.localize("BROKENTALES.Roll.Difficulty")}\\s*:\\s*(\\d+)`,
          "i"
        )
      );
      const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : 3;

      // Buscar soma bonus
      const somaMatch = msg.flavor.match(/Soma Bonus:\s*\+?(\d+)/i);
      const somaBonus = somaMatch ? parseInt(somaMatch[1]) : 0;

      // Obtener el actor asociado al mensaje
      const actor = game.actors.get(msg.speaker?.actor);

      if (!actor) {
        ui.notifications.warn(
          game.i18n.localize("BROKENTALES.Roll.MissingActor")
        );
        return;
      }

      // Repetir la tirada
      if (game.brokenTales?.rollWithDifficulty) {
        await game.brokenTales.rollWithDifficulty(
          actor,
          diceCount,
          difficulty,
          somaBonus
        );
      } else {
        await actor.rollWithDifficulty(diceCount, difficulty, somaBonus);
      }
      return;
    }
  }

  // Si no se encuentra una tirada previa
  ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.NoPrevious"));
}

// ✅ Registrar en namespace si no existe
if (!game.brokenTales) {
  game.brokenTales = {};
}
game.brokenTales.repeatLastRoll = repeatLastRoll;

// Ejecutar
repeatLastRoll();
