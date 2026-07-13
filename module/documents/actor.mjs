export class BrokenTalesActor extends Actor {
  get descriptors() {
    return this.items.filter((item) => item.type === "descriptor");
  }

  get gifts() {
    return this.items.filter((item) => item.type === "gift");
  }

  async rollOppositionDialog() {
    const descriptorOptions = this.descriptors
      .map((item) => `<option value="${item.id}">${foundry.utils.escapeHTML(item.name)}</option>`)
      .join("");

    const content = `
      <form class="broken-tales roll-dialog">
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.CheckType")}</label>
          <select name="checkType">
            <option value="position">${game.i18n.localize("BROKENTALES.Roll.PositionCheck")}</option>
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
          <label>${game.i18n.localize("BROKENTALES.Roll.NarrativeModifier")}</label>
          <input type="number" name="modifier" value="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.SomaSpent")}</label>
          <input type="number" name="somaSpent" value="0" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.GiftSuccesses")}</label>
          <input type="number" name="giftSuccesses" value="0" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.Penalties")}</label>
          <input type="number" name="penalties" value="0" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("BROKENTALES.Roll.RiskDice")}</label>
          <input type="number" name="riskDice" value="0" min="0" step="1" />
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
    const requestedSoma = Math.max(0, Math.trunc(somaSpent));
    const actualSomaSpent = Math.min(requestedSoma, currentSoma);
    const finalOppositionLevel = Math.max(1, oppositionLevel + modifier);
    const diceCount = Math.max(0, Math.trunc(riskDice));

    let roll = null;
    let diceResults = [];
    if (diceCount > 0) {
      roll = await new Roll(`${diceCount}d6`).evaluate();
      diceResults = roll.dice.flatMap((die) => die.results.map((result) => result.result));
    }

    const diceDisplay = diceResults.map((result) => ({
      result,
      isOne: result === 1
    }));
    const riskSuccesses = diceResults.filter((result) => result > 1).length;
    const hasBotch = diceResults.includes(1);
    const totalSuccesses = baseSuccesses
      + actualSomaSpent
      + Math.max(0, giftSuccesses)
      + riskSuccesses
      - Math.max(0, penalties);
    const margin = totalSuccesses - finalOppositionLevel;
    const outcome = this.#getOppositionOutcome({ hasBotch, margin });

    if (actualSomaSpent > 0) {
      await this.update({ "system.resources.soma.value": currentSoma - actualSomaSpent });
    }

    const content = await renderTemplate("systems/broken-tales/templates/chat/opposition-card.hbs", {
      actor: this,
      checkType,
      checkTypeLabel: checkType === "defense"
        ? "BROKENTALES.Roll.DefenseCheck"
        : "BROKENTALES.Roll.PositionCheck",
      descriptor,
      baseSuccesses,
      somaSpent: actualSomaSpent,
      giftSuccesses,
      penalties,
      riskDice: diceCount,
      diceResults,
      diceDisplay,
      riskSuccesses,
      hasBotch,
      oppositionLevel,
      modifier,
      finalOppositionLevel,
      totalSuccesses,
      margin,
      outcome,
      labels: CONFIG.BROKENTALES.roll
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      rolls: roll ? [roll] : [],
      flags: {
        "broken-tales": {
          checkType,
          finalOppositionLevel,
          totalSuccesses,
          outcome: outcome.id
        }
      }
    });
  }

  #getOppositionOutcome({ hasBotch, margin }) {
    if (hasBotch) return CONFIG.BROKENTALES.roll.outcomes.botch;
    if (margin < 0) return CONFIG.BROKENTALES.roll.outcomes.failure;
    if (margin === 0) return CONFIG.BROKENTALES.roll.outcomes.cost;
    if (margin === 1) return CONFIG.BROKENTALES.roll.outcomes.success;
    return CONFIG.BROKENTALES.roll.outcomes.increment;
  }
}
