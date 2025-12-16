/**
 * Hojas de items para Broken Tales
 */
export class DescriptorSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "item"],
      template: "systems/brokentales/templates/item/descriptor.html",
      width: 500,
      height: "auto",
      resizable: true
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.data = data.data || {};
    data.data.description = data.data.description || "";
    data.data.uses = data.data.uses || { value: 0, max: 1 };
    data.data.isImprovement = data.data.isImprovement || false;
    
    return data;
  }
}
  
export class GiftSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "item"],
      template: "systems/brokentales/templates/item/gift.html",
      width: 500,
      height: "auto",
      resizable: true
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.data = data.data || {};
    data.data.description = data.data.description || "";
    data.data.cost = data.data.cost || { soma: 0 };
    data.data.effect = data.data.effect || "";
    data.data.isUnique = data.data.isUnique || false;
    
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Eventos específicos para dones
    html.find(".gift-use").click(this._onUseGift.bind(this));
  }

  async _onUseGift(event) {
    event.preventDefault();
    const cost = this.item.data.data.cost.soma;
    
    if (this.actor) {
      const currentSoma = this.actor.data.data.attributes.soma.current;
      if (currentSoma >= cost) {
        await this.actor.update({
          "data.attributes.soma.current": currentSoma - cost
        });
        // Notificar uso del don
        ui.notifications.info(`${this.item.name} usado (Coste: ${cost} Soma)`);
      } else {
        ui.notifications.warn("No hay suficiente Soma para usar este don");
      }
    }
  }
}
