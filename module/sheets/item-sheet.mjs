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
    const localizedSource = this.#localizeData(source);
    return {
      item: localizedSource,
      source: localizedSource,
      system: localizedSource.system,
      nameLengthClass: this.#nameLengthClass(localizedSource.name),
      isDescriptor: this.document.type === "descriptor",
      isGift: this.document.type === "gift",
      isDarkEgo: this.document.type === "darkEgo",
      isEquipment: this.document.type === "equipment",
      typeLabel: game.i18n.localize(CONFIG.BROKENTALES.itemTypeLabels[this.document.type] || "BROKENTALES.Item"),
      isEditable: this.isEditable,
      fieldDisabled: this.isEditable ? "" : "disabled"
    };
  }

  #contentLanguage() {
    const normalize = (value) => String(value ?? "").toLowerCase();
    const resolve = (value) => {
      const normalized = normalize(value);
      if (normalized === "es" || normalized.startsWith("es-") || normalized === "spanish" || normalized === "español") return "es";
      if (normalized === "en" || normalized.startsWith("en-") || normalized === "english" || normalized === "inglés") return "en";
      return "";
    };

    try {
      const core = resolve(game.settings.get("core", "language"));
      if (core) return core;

      const configuredRaw = normalize(game.settings.get("broken-tales", "contentLanguage"));
      const configured = resolve(configuredRaw);
      if (configured && configuredRaw !== "system") return configured;
    } catch (_error) {
      // Settings can be unavailable during early initialization.
    }

    return resolve(game.i18n?.lang) || "en";
  }

  #localizeData(data) {
    const language = this.#contentLanguage();
    if (language === "en") return data;

    const translation = data.flags?.["broken-tales"]?.translations?.[language];
    if (!translation) return data;

    const localized = foundry.utils.deepClone(data);
    if (translation.name) localized.name = translation.name;
    if (translation.img) localized.img = translation.img;
    if (translation.system) {
      localized.system = foundry.utils.mergeObject(localized.system ?? {}, translation.system, {
        inplace: false,
        recursive: true
      });
    }
    return localized;
  }

  #nameLengthClass(name) {
    const length = String(name ?? "").length;
    if (length > 58) return "bt-name-extreme";
    if (length > 42) return "bt-name-very-long";
    if (length > 28) return "bt-name-long";
    return "";
  }
}
