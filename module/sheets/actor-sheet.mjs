/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BrokenTalesActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "actor"],
      width: 800,
      height: 900,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      scrollY: [".sheet-body"],
    });
  }

  /** @override */
  get template() {
    const type = this.actor.type;

    console.log(`Broken Tales | Loading template for actor type: ${type}`);

    if (type === "character") {
      return `systems/brokentales/templates/actor/character-sheet.html`;
    } else if (type === "npc") {
      return `systems/brokentales/templates/actor/npc-sheet.html`;
    }

    // Fallback template
    console.warn(`Broken Tales | Unknown actor type: ${type}, using fallback`);
    return `systems/brokentales/templates/actor/character-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context for easier access
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Add actor reference
    context.actor = this.actor;

    // Add config reference for templates
    context.config = CONFIG.BROKENTALES || {};

    console.log(`Broken Tales | getData for ${this.actor.name}:`, context);

    // Prepare character data and items.
    if (actorData.type === "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type === "npc") {
      this._prepareItems(context);
      this._prepareNpcData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = this.actor.getRollData();

    // Prepare active effects
    context.effects = this._prepareActiveEffects();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   * @param {Object} context The context object to modify
   */
  _prepareCharacterData(context) {
    const system = context.system;

    // Ensure soma exists
    if (!system.attributes) system.attributes = {};
    if (!system.attributes.soma) {
      system.attributes.soma = { current: 6, max: 6 };
    }
    if (!system.attributes.wounds) {
      system.attributes.wounds = {
        current: 0,
        max: 3,
        extra: { value: 0, max: 1 },
      };
    }
    if (system.xp === undefined) {
      system.xp = 0;
    }
  }

  /**
   * Organize and classify Items for NPC sheets.
   * @param {Object} context The context object to modify
   */
  _prepareNpcData(context) {
    const system = context.system;

    // Ensure attributes exist
    if (!system.attributes) system.attributes = {};
    if (!system.attributes.soma) {
      system.attributes.soma = { current: 0, max: 0 };
    }
    if (!system.attributes.wounds) {
      system.attributes.wounds = {
        current: 0,
        max: 1,
        extra: { value: 0, max: 1 },
      };
    }

    // Set NPC type options for template
    context.config.npcTypes = context.config.npcTypes || {
      villager: "BROKENTALES.Fields.Villager",
      creature: "BROKENTALES.Fields.Creature",
      adversary: "BROKENTALES.Fields.Adversary",
      broken_one: "BROKENTALES.Fields.broken_one",
      threat: "BROKENTALES.Fields.ThreatType",
      object: "BROKENTALES.Fields.Object",
      obstacle: "BROKENTALES.Fields.Obstacle",
    };

    // Set opposition levels for template
    context.config.oppositionLevels = context.config.oppositionLevels || {
      3: "BROKENTALES.Fields.Easy",
      5: "BROKENTALES.Fields.Normal",
      7: "BROKENTALES.Fields.Hard",
    };
  }

  /**
   * Organize and classify Items for Character and NPC sheets.
   * @param {Object} context The context object to modify
   */
  _prepareItems(context) {
    // Initialize containers.
    const descriptors = [];
    const gifts = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      // Append to descriptors.
      if (i.type === "descriptor") {
        descriptors.push(i);
      }
      // Append to gifts.
      else if (i.type === "gift" || i.type === "scenarioGift") {
        gifts.push(i);
      }
    }

    // Assign and return
    context.descriptors = descriptors;
    context.gifts = gifts;
  }

  /**
   * Prepare active effects for display
   * @returns {Array}
   */
  _prepareActiveEffects() {
    const effects = [];

    for (let e of this.actor.allApplicableEffects()) {
      effects.push({
        ...e,
        isDisabled: e.disabled,
        isTemporary: e.isTemporary,
        label: e.label,
        _id: e.id,
      });
    }

    return effects;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    console.log("Broken Tales | Activating listeners for", this.actor.name);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Use Gift
    html.find(".gift-use").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item && (item.type === "gift" || item.type === "scenarioGift")) {
        await item.useGift();
      }
    });

    // Active Effect management
    html.find(".effect-control").click((ev) => {
      const button = ev.currentTarget;
      const action = button.dataset.action;
      const effectId = button.closest(".effect")?.dataset.effectId;

      switch (action) {
        case "create":
          return this._createActiveEffect();
        case "edit":
          if (effectId) {
            const effect = this.actor.effects.get(effectId);
            if (effect) return effect.sheet.render(true);
          }
          break;
        case "delete":
          if (effectId) return this.actor.effects.get(effectId)?.delete();
          break;
        case "toggle":
          if (effectId) {
            const eff = this.actor.effects.get(effectId);
            if (eff) return eff.update({ disabled: !eff.disabled });
          }
          break;
      }
    });

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));

    // Roll with difficulty buttons
    html.find(".bt-roll-difficulty").click(this._onRollDifficulty.bind(this));

    // Repeat last roll
    html.find(".bt-macro-repeat-button").click(this._onRepeatRoll.bind(this));

    // Soma/Wounds management
    html.find(".soma-adjust").click(this._onSomaAdjust.bind(this));
    html.find(".wound-adjust").click(this._onWoundAdjust.bind(this));

    // Wound checkboxes
    html.find(".wound-checkbox").click(this._onWoundCheckbox.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = foundry.utils.duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;

    const itemData = {
      name: name,
      type: type,
      system: data,
    };

    delete itemData.system["type"];

    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[${dataset.label}]` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }

  /**
   * Handle roll with difficulty
   * @param {Event} event
   * @private
   */
  async _onRollDifficulty(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const difficulty = parseInt(button.dataset.difficulty) || 2;
    const diceCount = parseInt($(this.form).find("#bt-dice-count").val()) || 3;

    await this.actor.rollWithDifficulty(diceCount, difficulty);
  }

  /**
   * Handle repeat last roll
   * @param {Event} event
   * @private
   */
  async _onRepeatRoll(event) {
    event.preventDefault();

    const messages = game.messages.contents.slice().reverse();

    for (const msg of messages) {
      if (!msg.flavor || !msg.rolls) continue;

      const isBrokenRoll =
        msg.flavor.includes(game.i18n.localize("BROKENTALES.Roll.Title")) ||
        msg.flavor.includes(
          game.i18n.localize("BROKENTALES.Roll.TitleWithDifficulty")
        );
      const roll = msg.rolls[0];

      if (isBrokenRoll && roll) {
        const diceCount = roll.terms?.[0]?.number || 3;
        const difficultyMatch = msg.flavor.match(/Difficulty:\s*(\d+)/i);
        const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : 2;

        await this.actor.rollWithDifficulty(diceCount, difficulty);
        return;
      }
    }

    ui.notifications.warn(game.i18n.localize("BROKENTALES.Roll.NoPrevious"));
  }

  /**
   * Handle soma adjustments
   * @param {Event} event
   * @private
   */
  async _onSomaAdjust(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const action = button.dataset.action;

    if (action === "spend") {
      await this.actor.spendSoma(1);
    } else if (action === "recover") {
      await this.actor.recoverSoma(1);
    }
  }

  /**
   * Handle wound adjustments
   * @param {Event} event
   * @private
   */
  async _onWoundAdjust(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const action = button.dataset.action;

    if (action === "add") {
      await this.actor.addWound(1);
    } else if (action === "remove") {
      await this.actor.removeWound(1);
    }
  }

  /**
   * Handle wound checkbox clicks
   * @param {Event} event
   * @private
   */
  async _onWoundCheckbox(event) {
    const checkbox = event.currentTarget;
    const woundIndex = parseInt(checkbox.value);
    const currentWounds = this.actor.system.attributes.wounds.current;

    // Toggle wound state
    const newWounds = checkbox.checked ? woundIndex + 1 : woundIndex;
    await this.actor.update({ "system.attributes.wounds.current": newWounds });
  }

  /**
   * Create a new Active Effect
   * @private
   */
  async _createActiveEffect() {
    const effectData = {
      label: "New Effect",
      icon: "icons/svg/aura.svg",
      origin: this.actor.uuid,
      disabled: false,
    };

    return await ActiveEffect.create(effectData, { parent: this.actor });
  }
}
