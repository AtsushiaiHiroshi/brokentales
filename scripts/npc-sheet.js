/**
 * Hoja de PNJ para Broken Tales
 */
export class BrokenTalesNPCSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "actor", "npc"],
      template: "systems/brokentales/templates/actor/npc.html",
      width: 600,
      height: "auto",
      tabs: [],
      scrollY: [".sheet-body"],
      resizable: true
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    
    // Asegurarse de que todos los campos necesarios existan
    data.data = data.data || {};
    data.data.npcType = data.data.npcType || "villager";
    data.data.attributes = data.data.attributes || {
      soma: { current: 0, max: 0 },
      wounds: { current: 0, max: 1, extra: { value: 0, max: 1 } },
      damage: "1d6",
      state: ""
    };
    data.data.descriptors = data.data.descriptors || [];
    data.data.gifts = data.data.gifts || [];
    data.data.agenda = data.data.agenda || "";
    data.data.oppositionLevel = data.data.oppositionLevel || "";
    data.data.darkEgo = data.data.darkEgo || { trigger: "", gift: "", descriptor: "" };
    data.data.weapons = data.data.weapons || [];
    data.data.objects = data.data.objects || [];
    data.data.conditions = data.data.conditions || [];
    data.data.notes = data.data.notes || "";
    data.data.systemNote = data.data.systemNote || "";

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Eventos para los botones de tirada
    html.find(".bt-roll-difficulty").click(this._onRollDifficulty.bind(this));
    html.find(".bt-macro-repeat-button").click(this._onRepeatRoll.bind(this));

    // Eventos específicos de PNJ
    html.find(".npc-type-select").change(this._onNPCTypeChange.bind(this));
    html.find('[name="data.systemNote"]').change(this._onSystemNoteChange.bind(this));
  }

  async _onRollDifficulty(event) {
    event.preventDefault();
    const difficulty = event.currentTarget.dataset.difficulty;
    const diceCount = parseInt(this.element.find("#bt-dice-count").val()) || 3;
    
    if (game.brokenTales && game.brokenTales.rollWithDifficulty) {
      await game.brokenTales.rollWithDifficulty(this.actor, diceCount, difficulty);
    }
  }

  async _onRepeatRoll(event) {
    event.preventDefault();
    if (game.brokenTales && game.brokenTales.repeatLastRoll) {
      await game.brokenTales.repeatLastRoll();
    }
  }

  async _onNPCTypeChange(event) {
    event.preventDefault();
    const newType = event.currentTarget.value;
    await this.actor.update({ 
      "data.npcType": newType,
      // Resetear algunos campos según el tipo
      "data.agenda": newType === "object" || newType === "obstacle" ? "" : this.actor.data.data.agenda,
      "data.darkEgo": newType === "broken_one" ? this.actor.data.data.darkEgo : { trigger: "", gift: "", descriptor: "" }
    });
  }

  async _onSystemNoteChange(event) {
    event.preventDefault();
    const systemNote = event.currentTarget.value;
    await this.actor.update({ "data.systemNote": systemNote });
  }
}
