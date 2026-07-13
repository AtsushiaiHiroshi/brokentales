const { api, sheets } = foundry.applications;

export class BrokenTalesItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["broken-tales", "item-sheet"],
    tag: "form",
    position: {
      width: 520,
      height: "auto"
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true
    }
  };

  static PARTS = {
    main: {
      template: "systems/broken-tales/templates/items/item-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const source = this.document.toObject();
    return {
      item: this.document,
      source,
      system: source.system,
      nameLengthClass: this.#nameLengthClass(this.document.name),
      isDescriptor: this.document.type === "descriptor",
      isGift: this.document.type === "gift",
      isDarkEgo: this.document.type === "darkEgo",
      isEquipment: this.document.type === "equipment",
      typeLabel: game.i18n.localize(CONFIG.BROKENTALES.itemTypeLabels[this.document.type] || "BROKENTALES.Item"),
      isEditable: this.isEditable,
      fieldDisabled: this.isEditable ? "" : "disabled"
    };
  }

  #nameLengthClass(name) {
    const length = String(name ?? "").length;
    if (length > 58) return "bt-name-extreme";
    if (length > 42) return "bt-name-very-long";
    if (length > 28) return "bt-name-long";
    return "";
  }
}
