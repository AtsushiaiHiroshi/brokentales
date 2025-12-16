/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class BrokenTalesItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.brokentales || {};

    // Make separate methods for each Item type (descriptor, gift, etc.) to keep
    // things organized.
    this._prepareDescriptorData(itemData);
    this._prepareGiftData(itemData);
  }

  /**
   * Prepare Descriptor type specific data
   * @param {Object} itemData
   */
  _prepareDescriptorData(itemData) {
    if (itemData.type !== "descriptor") return;

    const systemData = itemData.system;

    // Initialize description
    if (!systemData.description) {
      systemData.description = "";
    }

    // Initialize type
    if (!systemData.type) {
      systemData.type = "narrative";
    }

    // Initialize uses
    if (!systemData.uses) {
      systemData.uses = {
        value: 0,
        max: 1,
      };
    }

    // Initialize improvement flag
    if (systemData.isImprovement === undefined) {
      systemData.isImprovement = false;
    }
  }

  /**
   * Prepare Gift type specific data
   * @param {Object} itemData
   */
  _prepareGiftData(itemData) {
    if (itemData.type !== "gift") return;

    const systemData = itemData.system;

    // Initialize description
    if (!systemData.description) {
      systemData.description = "";
    }

    // Initialize type
    if (!systemData.type) {
      systemData.type = "mechanical";
    }

    // Initialize cost
    if (!systemData.cost) {
      systemData.cost = {
        soma: 0,
      };
    }

    // Initialize effect
    if (!systemData.effect) {
      systemData.effect = "";
    }

    // Initialize unique flag
    if (systemData.isUnique === undefined) {
      systemData.isUnique = false;
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? "",
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(this.system.formula, rollData);

      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   * Use a Gift (spend Soma if needed)
   */
  async useGift() {
    if (this.type !== "gift") return;

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This Gift is not owned by any actor.");
      return;
    }

    const cost = this.system.cost?.soma || 0;

    if (cost > 0) {
      const canSpend = await actor.spendSoma(cost);
      if (!canSpend) return;
    }

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `
        <div class="bt-gift-use">
          <h3>${this.name}</h3>
          <div><strong>${game.i18n.localize(
            "BROKENTALES.Fields.Cost"
          )}:</strong> ${cost} Soma</div>
          <div><strong>${game.i18n.localize(
            "BROKENTALES.Fields.Effect"
          )}:</strong></div>
          <div>${this.system.description}</div>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    };

    await ChatMessage.create(chatData);
  }

  /**
   * Use a Descriptor
   */
  async useDescriptor() {
    if (this.type !== "descriptor") return;

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This Descriptor is not owned by any actor.");
      return;
    }

    // Check if descriptor has limited uses
    const uses = this.system.uses;
    if (uses && uses.max > 0) {
      if (uses.value >= uses.max) {
        ui.notifications.warn("This Descriptor has no more uses.");
        return;
      }
      // Increment uses
      await this.update({ "system.uses.value": uses.value + 1 });
    }

    // Create chat message
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `
        <div class="bt-descriptor-use">
          <h3>${this.name}</h3>
          <div>${this.system.description}</div>
          ${
            uses && uses.max > 0
              ? `<div><em>Uses: ${uses.value + 1}/${uses.max}</em></div>`
              : ""
          }
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    };

    await ChatMessage.create(chatData);
  }
}
