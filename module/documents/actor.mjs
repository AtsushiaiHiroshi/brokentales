/**
 * Extend the base Actor document to support Broken Tales system
 * @extends {Actor}
 */
export class BrokenTalesActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data.
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.brokentales || {};

    // Make separate methods for each Actor type
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    const systemData = actorData.system;

    // Initialize attributes if they don't exist
    if (!systemData.attributes) {
      systemData.attributes = {};
    }

    // Initialize Soma
    if (!systemData.attributes.soma) {
      systemData.attributes.soma = {
        current: 6,
        max: 6,
      };
    }

    // Ensure soma doesn't exceed max
    if (systemData.attributes.soma.current > systemData.attributes.soma.max) {
      systemData.attributes.soma.current = systemData.attributes.soma.max;
    }

    // Initialize Wounds
    if (!systemData.attributes.wounds) {
      systemData.attributes.wounds = {
        current: 0,
        max: 3,
        extra: {
          value: 0,
          max: 1,
        },
      };
    }

    // Check for death condition
    const wounds = systemData.attributes.wounds;
    if (
      wounds.current >= wounds.max &&
      wounds.extra.value >= wounds.extra.max
    ) {
      systemData.isDead = true;
    } else {
      systemData.isDead = false;
    }

    // Initialize XP
    if (systemData.xp === undefined) {
      systemData.xp = 0;
    }

    // Initialize arrays
    if (!systemData.descriptors) systemData.descriptors = [];
    if (!systemData.gifts) systemData.gifts = [];
    if (!systemData.conditions) systemData.conditions = [];

    // Initialize Dark Ego
    if (!systemData.darkEgo) {
      systemData.darkEgo = {
        trigger: "",
        gift: "",
        descriptor: "",
      };
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;

    const systemData = actorData.system;

    // Initialize attributes if they don't exist
    if (!systemData.attributes) {
      systemData.attributes = {};
    }

    // Initialize Soma (NPCs can have 0 soma)
    if (!systemData.attributes.soma) {
      systemData.attributes.soma = {
        current: 0,
        max: 0,
      };
    }

    // Initialize Wounds
    if (!systemData.attributes.wounds) {
      systemData.attributes.wounds = {
        current: 0,
        max: 1,
        extra: {
          value: 0,
          max: 1,
        },
      };
    }

    // Initialize NPC type
    if (!systemData.npcType) {
      systemData.npcType = "villager";
    }

    // ✅ CORREGIDO: Initialize opposition level as NUMBER
    if (!systemData.oppositionLevel) {
      systemData.oppositionLevel = 5; // Default: Normal (5)
    }

    // Convert string OL to number if needed (legacy data)
    if (typeof systemData.oppositionLevel === "string") {
      const olMap = {
        Easy: 3,
        Normal: 5,
        Medium: 5,
        Hard: 7,
      };
      systemData.oppositionLevel = olMap[systemData.oppositionLevel] || 5;
    }

    // Initialize arrays
    if (!systemData.descriptors) systemData.descriptors = [];
    if (!systemData.gifts) systemData.gifts = [];
    if (!systemData.conditions) systemData.conditions = [];
    if (!systemData.weapons) systemData.weapons = [];
    if (!systemData.objects) systemData.objects = [];

    // Initialize damage
    if (!systemData.damage) {
      systemData.damage = "1d6";
    }
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== "character") return;

    // Copy the soma and wounds values for formula access
    if (data.attributes.soma) {
      data.soma = data.attributes.soma.current ?? 0;
    }
    if (data.attributes.wounds) {
      data.wounds = data.attributes.wounds.current ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== "npc") return;

    // Copy the soma and wounds values for formula access
    if (data.attributes.soma) {
      data.soma = data.attributes.soma.current ?? 0;
    }
    if (data.attributes.wounds) {
      data.wounds = data.attributes.wounds.current ?? 0;
    }
    if (data.oppositionLevel) {
      data.ol = data.oppositionLevel;
    }
  }

  /**
   * Add a wound to the actor
   * @param {number} amount - Amount of wounds to add
   * @param {boolean} isExtra - Whether this is an extra wound
   */
  async addWound(amount = 1, isExtra = false) {
    const wounds = this.system.attributes.wounds;

    if (!isExtra) {
      let newWounds = wounds.current + amount;
      if (newWounds > wounds.max) {
        const overflow = newWounds - wounds.max;
        await this.update({ "system.attributes.wounds.current": wounds.max });
        if (overflow > 0) {
          await this.addWound(overflow, true);
        }
      } else {
        await this.update({ "system.attributes.wounds.current": newWounds });
      }
    } else {
      let newExtra = wounds.extra.value + amount;
      if (newExtra > wounds.extra.max) {
        newExtra = wounds.extra.max;
        ui.notifications.error(`${this.name} has died!`);
      }
      await this.update({ "system.attributes.wounds.extra.value": newExtra });
    }
  }

  /**
   * Remove wounds from the actor
   * @param {number} amount - Amount of wounds to remove
   */
  async removeWound(amount = 1) {
    const wounds = this.system.attributes.wounds;

    // First remove from extra wounds
    if (wounds.extra.value > 0) {
      const removeExtra = Math.min(amount, wounds.extra.value);
      await this.update({
        "system.attributes.wounds.extra.value":
          wounds.extra.value - removeExtra,
      });
      amount -= removeExtra;
    }

    // Then remove from regular wounds
    if (amount > 0) {
      let newWounds = Math.max(0, wounds.current - amount);
      await this.update({ "system.attributes.wounds.current": newWounds });
    }
  }

  /**
   * Spend Soma
   * @param {number} amount - Amount of Soma to spend
   * @returns {boolean} - Whether the soma was successfully spent
   */
  async spendSoma(amount = 1) {
    const soma = this.system.attributes.soma;

    if (soma.current < amount) {
      ui.notifications.warn(`${this.name} does not have enough Soma!`);
      return false;
    }

    const newValue = Math.max(0, soma.current - amount);
    await this.update({ "system.attributes.soma.current": newValue });
    return true;
  }

  /**
   * Recover Soma
   * @param {number} amount - Amount of Soma to recover
   */
  async recoverSoma(amount = 1) {
    const soma = this.system.attributes.soma;
    let newValue = Math.min(soma.max, soma.current + amount);
    await this.update({ "system.attributes.soma.current": newValue });
  }

  /**
   * Perform a roll with difficulty
   * @param {number} diceCount - Number of dice to roll
   * @param {number} difficulty - Difficulty level (2-7)
   * @param {number} somaBonus - Additional successes from Soma spending
   */
  async rollWithDifficulty(diceCount = 3, difficulty = 2, somaBonus = 0) {
    const roll = new Roll(`${diceCount}d6`);
    await roll.evaluate({ async: true });

    const results = roll.dice[0].results.map((r) => r.result);

    // ✅ CORREGIDO: Check for critical failure FIRST
    const hasCriticalFailure = results.includes(1);

    // If critical failure, all successes are negated
    const baseSuccesses = hasCriticalFailure
      ? 0
      : results.filter((r) => r >= 2).length;

    const totalSuccesses = baseSuccesses + somaBonus;

    // Determine outcome
    let outcome = "";
    let outcomeClass = "";

    if (hasCriticalFailure) {
      outcome = game.i18n.localize("BROKENTALES.Roll.CriticalFailure");
      outcomeClass = "fail";
    } else if (totalSuccesses < difficulty) {
      outcome = game.i18n.format("BROKENTALES.Roll.Failure", {
        difficulty,
        successes: totalSuccesses,
      });
      outcomeClass = "fail";
    } else if (totalSuccesses === difficulty) {
      outcome = game.i18n.format("BROKENTALES.Roll.SuccessExact", {
        successes: totalSuccesses,
      });
      outcomeClass = "warning";
    } else if (totalSuccesses === difficulty + 1) {
      outcome = game.i18n.format("BROKENTALES.Roll.SuccessPlus1", {
        successes: totalSuccesses,
      });
      outcomeClass = "success";
    } else {
      outcome = game.i18n.format("BROKENTALES.Roll.SuccessPlus", {
        successes: totalSuccesses,
      });
      outcomeClass = "success";
    }

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="bt-chat-roll">
          <h2>${game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")}</h2>
          <div><b>${game.i18n.localize("BROKENTALES.Roll.Character")}:</b> ${
        this.name
      }</div>
          <div><b>${game.i18n.localize(
            "BROKENTALES.Roll.Difficulty"
          )}:</b> ${difficulty}</div>
          ${somaBonus > 0 ? `<div><b>Soma Bonus:</b> +${somaBonus}</div>` : ""}
          <div class="dice-result">🎲 ${game.i18n.localize(
            "BROKENTALES.Roll.Results"
          )}: ${results.join(", ")}</div>
          ${
            somaBonus > 0
              ? `<div><em>Base: ${baseSuccesses} + Soma: ${somaBonus} = ${totalSuccesses}</em></div>`
              : ""
          }
          <div class="outcome ${outcomeClass}">
            ${outcome}
          </div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: [roll],
    };

    await ChatMessage.create(chatData);
    return roll;
  }

  /**
   * Show roll dialog with difficulty and soma options
   */
  async showRollDialog() {
    const currentSoma = this.system.attributes.soma.current;

    const dialogContent = `
      <form class="bt-roll-dialog">
        <div class="form-group">
          <label for="dice-count">${game.i18n.localize(
            "BROKENTALES.Fields.DiceCount"
          )}:</label>
          <input type="number" id="dice-count" name="diceCount" value="3" min="1" max="10" />
        </div>
        <div class="form-group">
          <label for="difficulty">${game.i18n.localize(
            "BROKENTALES.Fields.Difficulty"
          )}:</label>
          <select id="difficulty" name="difficulty">
            <option value="0">None (Basic Roll)</option>
            <option value="2">${game.i18n.localize(
              "BROKENTALES.Fields.Easy"
            )} (2)</option>
            <option value="3" selected>${game.i18n.localize(
              "BROKENTALES.Fields.Normal"
            )} (3)</option>
            <option value="5">${game.i18n.localize(
              "BROKENTALES.Fields.Hard"
            )} (5)</option>
            <option value="7">Very Hard (7)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="soma-bonus">${game.i18n.localize(
            "BROKENTALES.Fields.Soma"
          )} Bonus (Current: ${currentSoma}):</label>
          <input type="number" id="soma-bonus" name="somaBonus" value="0" min="0" max="${currentSoma}" />
        </div>
      </form>
    `;

    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty"),
        content: dialogContent,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d6"></i>',
            label: game.i18n.localize("BROKENTALES.Fields.Roll"),
            callback: async (html) => {
              const diceCount = parseInt(html.find('[name="diceCount"]').val());
              const difficulty = parseInt(
                html.find('[name="difficulty"]').val()
              );
              const somaBonus = parseInt(html.find('[name="somaBonus"]').val());

              // Spend soma if used
              if (somaBonus > 0) {
                const success = await this.spendSoma(somaBonus);
                if (!success) {
                  resolve(null);
                  return;
                }
              }

              // Perform roll
              if (difficulty > 0) {
                await this.rollWithDifficulty(diceCount, difficulty, somaBonus);
              } else {
                await this.rollWithDifficulty(diceCount, 0, somaBonus);
              }

              resolve(true);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("Cancel"),
            callback: () => resolve(null),
          },
        },
        default: "roll",
      }).render(true);
    });
  }
}
