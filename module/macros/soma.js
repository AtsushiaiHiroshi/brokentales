// Soma.js - Broken Tales Soma Boost Roll

async function brokenTalesSomaRoll(diceCount = 3, somaSpent = 1) {
  const actor = game.user.character;
  if (!actor) {
    ui.notifications.error("No actor is currently selected or assigned to your user.");
    return;
  }

  if (actor && actor.data && actor.data.attributes) {
    const soma = actor.data.attributes.soma;
    if (!soma?.current) {
      ui.notifications.error("The actor does not have a valid 'soma.current' attribute.");
      return;
    }

    // Construye la fórmula de la tirada
    const formula = `${diceCount}d6 + ${soma.current}`;

    // Realiza la tirada
    const roll = new Roll(formula, actor.getRollData());
    await roll.evaluate({ async: true });

    // Obtén los resultados de los dados
    const results = roll.dice[0].results.map(r => r.result);

    // Calcula éxitos y fallos críticos
    let successes = 0;
    let failCritical = results.includes(1);

    if (!failCritical) {
      successes = results.filter(r => r >= 2).length + somaSpent;
    }

    // Construye el mensaje de resultado
    let flavor = `<strong>Broken Tales - Soma Boost Roll (${diceCount}d6)</strong><br>`;
    flavor += `Results: [${results.join(", ")}]<br>`;
    flavor += `Soma Spent: <strong>${somaSpent}</strong><br>`;

    if (failCritical) {
      flavor += `<strong style="color:red;">Critical Failure!</strong> All successes are negated.`;
    } else {
      flavor += `<strong style="color:blue;">Total Successes (including Soma Boost):</strong> ${successes}`;
    }

    // Envía el mensaje al chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor
    });
  } else {
    console.error("Los datos del actor no están definidos.");
  }
}

// Ejecutar tirada con gasto de Soma al invocar la macro
brokenTalesSomaRoll();