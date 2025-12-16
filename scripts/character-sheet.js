/**
 * Hoja de personaje para Broken Tales
 */
export class BrokenTalesCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "actor", "character"],
      template: "systems/brokentales/templates/actor/character.html",
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
    data.data.attributes = data.data.attributes || {
      soma: { current: 0, max: 6 },
      wounds: { current: 0, max: 3, extra: 0 }
    };
    data.data.descriptors = data.data.descriptors || [];
    data.data.gifts = data.data.gifts || [];
    data.data.darkEgo = data.data.darkEgo || { trigger: "", gift: "", descriptor: "" };
    data.data.systemNote = data.data.systemNote || "";
    
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Eventos para los botones de tirada
    html.find(".bt-roll-difficulty").click(this._onRollDifficulty.bind(this));
    html.find(".bt-macro-repeat-button").click(this._onRepeatRoll.bind(this));

    // Eventos para cambios en notas del sistema
    html.find('[name="data.systemNote"]').change(this._onSystemNoteChange.bind(this));
  }

  async _onRollDifficulty(event) {
    event.preventDefault();
    const difficulty = event.currentTarget.dataset.difficulty;
    const diceCount = parseInt(this.element.find("#bt-dice-count").val()) || 3;
    
    // Si existe el namespace de brokenTales, usar su función de tirada
    if (game.brokenTales && game.brokenTales.rollWithDifficulty) {
      await game.brokenTales.rollWithDifficulty(this.actor, diceCount, difficulty);
    }
  }

  async _onRepeatRoll(event) {
    event.preventDefault();
    // Si existe el namespace de brokenTales, usar su función de repetir tirada
    if (game.brokenTales && game.brokenTales.repeatLastRoll) {
      await game.brokenTales.repeatLastRoll();
    }
  }

  async _onSystemNoteChange(event) {
    event.preventDefault();
    const systemNote = event.currentTarget.value;
    await this.actor.update({ "data.systemNote": systemNote });
  }
}
