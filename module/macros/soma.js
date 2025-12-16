// ============================================================================
// soma.js - CORREGIDO
// ============================================================================

async function brokenTalesSomaRoll(diceCount = 3, somaSpent = 1) {
  const actor = game.user.character;
  if (!actor) {
    ui.notifications.error(
      "No actor is currently selected or assigned to your user."
    );
    return;
  }

  // ✅ CORREGIDO: Usar actor.system en lugar de actor.data
  const soma = actor.system?.attributes?.soma;
  if (!soma || typeof soma.current !== "number") {
    ui.notifications.error(
      "The actor does not have a valid 'soma.current' attribute."
    );
    return;
  }

  if (soma.current < somaSpent) {
    ui.notifications.warn(`${actor.name} does not have enough Soma!`);
    return;
  }

  // Spend soma
  await actor.spendSoma(somaSpent);

  // Construir la fórmula de la tirada
  const formula = `${diceCount}d6`;

  // Realizar la tirada
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate({ async: true });

  // Obtener los resultados de los dados
  const results = roll.dice[0].results.map((r) => r.result);

  // ✅ CORREGIDO: Calcular critical failure PRIMERO
  const hasCriticalFailure = results.includes(1);
  const baseSuccesses = hasCriticalFailure
    ? 0
    : results.filter((r) => r >= 2).length;
  const totalSuccesses = baseSuccesses + somaSpent;

  // Construir el mensaje de resultado
  let flavor = `<strong>Broken Tales - Soma Boost Roll (${diceCount}d6)</strong><br>`;
  flavor += `Results: [${results.join(", ")}]<br>`;
  flavor += `Soma Spent: <strong>${somaSpent}</strong><br>`;

  if (hasCriticalFailure) {
    flavor += `<strong style="color:red;">Critical Failure!</strong> All successes are negated.`;
  } else {
    flavor += `<strong style="color:blue;">Total Successes (including Soma Boost):</strong> ${totalSuccesses}`;
  }

  // Enviar el mensaje al chat
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor,
  });
}

// Ejecutar tirada con gasto de Soma al invocar la macro
brokenTalesSomaRoll();
