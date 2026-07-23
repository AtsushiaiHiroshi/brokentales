export class BrokenTalesActor extends Actor {
  get descriptors() {
    return this.items.filter((item) => item.type === "descriptor");
  }

  get gifts() {
    return this.items.filter((item) => item.type === "gift");
  }

  async showRollDialog() {
    return this.rollOppositionDialog();
  }

  async rollWithDifficulty(diceCount = 0, difficulty = 5, somaBonus = 0, options = {}) {
    return this.rollOpposition({
      checkType: options.checkType ?? "position",
      descriptorId: options.descriptorId ?? "",
      oppositionLevel: difficulty,
      somaSpent: somaBonus,
      giftSuccesses: options.giftSuccesses ?? 0,
      penalties: options.penalties ?? 0,
      riskDice: diceCount,
      modifier: options.modifier ?? 0
    });
  }

  async rollOppositionDialog() {
    const descriptorOptions = this.descriptors
      .map((item) => `<option value="${item.id}">${foundry.utils.escapeHTML(item.name)}</option>`)
      .join("");
    const diceOptions = Array.from({ length: 21 }, (_value, index) =>
      `<option value="${index}"${index === 0 ? " selected" : ""}>${index}</option>`
    ).join("");

    const content = `
      <form class="broken-tales roll-dialog">
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.CheckType")}</label>
          <select name="checkType">
            <option value="position">${game.i18n.localize("BROKENTALES.Roll.PositionCheck")}</option>
            <option value="opposition">${game.i18n.localize("BROKENTALES.Roll.OppositionCheck")}</option>
            <option value="defense">${game.i18n.localize("BROKENTALES.Roll.DefenseCheck")}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.Descriptor")}</label>
          <select name="descriptorId">
            <option value="">${game.i18n.localize("BROKENTALES.Roll.NoDescriptor")}</option>
            ${descriptorOptions}
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.OppositionLevel")}</label>
          <select name="oppositionLevel">
            <option value="3">${game.i18n.localize("BROKENTALES.Roll.Easy")} (3)</option>
            <option value="5" selected>${game.i18n.localize("BROKENTALES.Roll.Intermediate")} (5)</option>
            <option value="7">${game.i18n.localize("BROKENTALES.Roll.Hard")} (7)</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.GiftModifier")}</label>
          <input type="number" name="modifier" value="0" min="-20" max="20" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.SomaSuccesses")}</label>
          <input type="number" name="somaSpent" value="0" min="0" max="20" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.GiftSuccesses")}</label>
          <input type="number" name="giftSuccesses" value="0" min="0" max="20" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.Penalties")}</label>
          <input type="number" name="penalties" value="0" min="0" max="20" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.RiskDice")}</label>
          <select name="riskDice">${diceOptions}</select>
        </div>
      </form>
    `;

    const formData = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("BROKENTALES.Roll.DialogTitle") },
      content,
      ok: {
        label: game.i18n.localize("BROKENTALES.Roll.Roll")
      }
    });

    if (!formData) return null;
    return this.rollOpposition({
      checkType: formData.checkType || "position",
      descriptorId: formData.descriptorId || "",
      oppositionLevel: Number(formData.oppositionLevel || 5),
      modifier: Number(formData.modifier || 0),
      somaSpent: Number(formData.somaSpent || 0),
      giftSuccesses: Number(formData.giftSuccesses || 0),
      penalties: Number(formData.penalties || 0),
      riskDice: Number(formData.riskDice || 0)
    });
  }

  async rollOpposition({
    checkType = "position",
    descriptorId = "",
    oppositionLevel = 5,
    modifier = 0,
    somaSpent = 0,
    giftSuccesses = 0,
    penalties = 0,
    riskDice = 0
  } = {}) {
    const descriptor = descriptorId ? this.items.get(descriptorId) : null;
    const hasDescriptor = Boolean(descriptor);
    const baseSuccesses = hasDescriptor ? 3 : 1;
    const currentSoma = Number(this.system.resources?.soma?.value ?? 0);
    const requestedSoma = this.#clampNumber(somaSpent, 0, 20);
    const actualSomaSpent = Math.min(requestedSoma, currentSoma);
    const normalizedOppositionLevel = [3, 5, 7].includes(Number(oppositionLevel)) ? Number(oppositionLevel) : 5;
    const normalizedModifier = this.#clampNumber(modifier, -20, 20);
    const finalOppositionLevel = Math.max(1, normalizedOppositionLevel + normalizedModifier);
    const diceCount = this.#clampNumber(riskDice, 0, 20);
    const normalizedGiftSuccesses = this.#clampNumber(giftSuccesses, 0, 20);
    const normalizedPenalties = this.#clampNumber(penalties, 0, 20);

    let roll = null;
    let diceResults = [];
    if (diceCount > 0) {
      roll = await new Roll(`${diceCount}d6`).evaluate({ async: true });
      diceResults = roll.dice.flatMap((die) => die.results.map((result) => result.result));
    }

    const diceDisplay = diceResults.map((result) => ({
      result,
      isOne: result === 1
    }));
    const riskSuccesses = diceResults.filter((result) => result > 1).length;
    const hasBotch = diceResults.includes(1);
    const calculatedSuccesses = baseSuccesses
      + actualSomaSpent
      + normalizedGiftSuccesses
      + riskSuccesses
      - normalizedPenalties;
    const totalSuccesses = hasBotch ? 0 : calculatedSuccesses;
    const margin = totalSuccesses - finalOppositionLevel;
    const outcome = this.#getOppositionOutcome({ hasBotch, margin });

    if (actualSomaSpent > 0) {
      await this.update({ "system.resources.soma.value": currentSoma - actualSomaSpent });
    }

    const content = await renderTemplate("systems/broken-tales/templates/chat/opposition-card.hbs", {
      actor: this,
      checkType,
      checkTypeLabel: this.#checkTypeLabel(checkType),
      descriptor,
      baseSuccesses,
      somaSpent: actualSomaSpent,
      giftSuccesses: normalizedGiftSuccesses,
      penalties: normalizedPenalties,
      riskDice: diceCount,
      diceResults,
      diceDisplay,
      riskSuccesses,
      hasBotch,
      oppositionLevel: normalizedOppositionLevel,
      modifier: normalizedModifier,
      finalOppositionLevel,
      totalSuccesses,
      margin,
      outcome,
      labels: CONFIG.BROKENTALES.roll
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      flags: {
        "broken-tales": {
          checkType,
          diceCount,
          diceResults,
          oppositionLevel: normalizedOppositionLevel,
          modifier: normalizedModifier,
          finalOppositionLevel,
          totalSuccesses,
          outcome: outcome.id
        }
      }
    });
  }

  #clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, Math.trunc(number)));
  }

  #checkTypeLabel(checkType) {
    return {
      defense: "BROKENTALES.Roll.DefenseCheck",
      opposition: "BROKENTALES.Roll.OppositionCheck",
      position: "BROKENTALES.Roll.PositionCheck"
    }[checkType] ?? "BROKENTALES.Roll.PositionCheck";
  }

  #getOppositionOutcome({ hasBotch, margin }) {
    if (hasBotch) return CONFIG.BROKENTALES.roll.outcomes.botch;
    if (margin < 0) return CONFIG.BROKENTALES.roll.outcomes.failure;
    if (margin === 0) return CONFIG.BROKENTALES.roll.outcomes.cost;
    if (margin === 1) return CONFIG.BROKENTALES.roll.outcomes.success;
    return CONFIG.BROKENTALES.roll.outcomes.increment;
  }
}
