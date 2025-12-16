// Macro for Dark Ego activation
// darknessEgo.js - Broken Tales Dark Ego Activation Roll

async function brokenTalesDarkEgoRoll(diceCount = 3, bonusSuccesses = 1) {
  // Obtén el actor activo
  const actor = game.user.character;
  if (!actor) {
    ui.notifications.error("No actor is currently selected or assigned to your user.");
    return;
  }

  if (actor && actor.data && actor.data.attributes) {
    const soma = actor.data.attributes.soma;
    // Lógica aquí
  } else {
    console.error("Los datos del actor no están definidos.");
    return;
  }

  // Verifica que el actor tenga los datos necesarios
  const rollData = actor.getRollData();
  if (!rollData.attributes?.darkEgo) {
    ui.notifications.error("The actor does not have a valid 'darkEgo' attribute.");
    return;
  }

  if (!rollData.attributes?.soma || !rollData.attributes?.wounds) {
    ui.notifications.error("The actor does not have the required attributes (soma or wounds).");
    return;
  }

  // Construye la fórmula de la tirada
  const formula = `${diceCount}d6`;

  // Realiza la tirada
  const roll = new Roll(formula, rollData);
  await roll.evaluate({ async: true });

  // Obtén los resultados de los dados
  const results = roll.dice[0].results.map(r => r.result);

  // Calcula éxitos y fallos críticos
  let successes = 0;
  let failCritical = results.includes(1);

  if (!failCritical) {
    successes = results.filter(r => r >= 2).length + bonusSuccesses;
  }

  // Construye el mensaje de resultado
  let flavor = `<strong>Broken Tales - Dark Ego Activation Roll (${diceCount}d6)</strong><br>`;
  flavor += `Results: [${results.join(", ")}]<br>`;
  flavor += `Bonus Successes: <strong>${bonusSuccesses}</strong><br>`;

  if (failCritical) {
    flavor += `<strong style="color:red;">Critical Failure!</strong> All successes are negated.`;
  } else {
    flavor += `<strong style="color:purple;">Total Successes (including Ego Bonus):</strong> ${successes}`;
  }

  // Envía el mensaje al chat
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor
  });
}

// Ejecutar tirada de Dark Ego al invocar la macro
brokenTalesDarkEgoRoll();