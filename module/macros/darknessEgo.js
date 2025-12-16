// ============================================================================
// darknessEgo.js - CORREGIDO
// ============================================================================

async function brokenTalesDarkEgoRoll(diceCount = 3, bonusSuccesses = 1) {
  // Obtener el actor activo
  const actor = game.user.character;
  if (!actor) {
    ui.notifications.error(
      "No actor is currently selected or assigned to your user."
    );
    return;
  }

  // ✅ CORREGIDO: Usar actor.system en lugar de actor.data
  const systemData = actor.system;
  if (!systemData?.attributes?.soma || !systemData?.attributes?.wounds) {
    ui.notifications.error(
      "The actor does not have the required attributes (soma or wounds)."
    );
    return;
  }

  // Verificar Dark Ego
  if (!systemData.darkEgo || !systemData.darkEgo.trigger) {
    ui.notifications.error(
      "The actor does not have a valid 'darkEgo' attribute."
    );
    return;
  }

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
  const totalSuccesses = baseSuccesses + bonusSuccesses;

  // Construir el mensaje de resultado
  let flavor = `<strong>Broken Tales - Dark Ego Activation Roll (${diceCount}d6)</strong><br>`;
  flavor += `<div><strong>Dark Ego:</strong> ${
    systemData.darkEgo.gift || "Unnamed"
  }</div>`;
  flavor += `<div><em>Trigger:</em> ${systemData.darkEgo.trigger}</div><br>`;
  flavor += `Results: [${results.join(", ")}]<br>`;
  flavor += `Bonus Successes: <strong>${bonusSuccesses}</strong><br>`;

  if (hasCriticalFailure) {
    flavor += `<strong style="color:red;">Critical Failure!</strong> All successes are negated.`;
  } else {
    flavor += `<strong style="color:purple;">Total Successes (including Ego Bonus):</strong> ${totalSuccesses}`;
  }

  // Enviar el mensaje al chat
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor,
  });
}

// Ejecutar tirada de Dark Ego al invocar la macro
brokenTalesDarkEgoRoll();
