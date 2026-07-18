const { api, sheets } = foundry.applications;

export class BrokenTalesActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["broken-tales", "actor-sheet"],
    tag: "form",
    position: {
      width: 820,
      height: 760
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true
    },
    dragDrop: [{ dropSelector: ".bt-sheet" }],
    actions: {
      createItem: BrokenTalesActorSheet.#onCreateItem,
      deleteItem: BrokenTalesActorSheet.#onDeleteItem,
      editItem: BrokenTalesActorSheet.#onEditItem,
      rollOpposition: BrokenTalesActorSheet.#onRollOpposition
    }
  };

  static PARTS = {
    main: {
      template: "systems/broken-tales/templates/actors/hunter-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const source = this.document.toObject();
    const localizedActor = this.#localizeData(source);
    return {
      actor: localizedActor,
      source,
      system: localizedActor.system,
      nameLengthClass: this.#nameLengthClass(localizedActor.name),
      itemGroups: this.#prepareItems(),
      descriptorRows: this.#prepareDescriptorRows(),
      extraGifts: this.#prepareExtraGifts(),
      featuredDescriptor: this.#findFeaturedDescriptor(),
      darkEgoDescriptor: this.#findDarkEgoDescriptor(),
      darkEgo: this.#findDarkEgo(),
      isThreat: this.document.type === "threat",
      isVillager: this.document.type === "villager",
      isEssence: this.document.type === "essence",
      typeLabel: CONFIG.BROKENTALES.actorTypeLabels[this.document.type] || "BROKENTALES.ActorTypes.Hunter",
      threatRankOptions: CONFIG.BROKENTALES.threatRankOptions,
      detailSuggestions: CONFIG.BROKENTALES.detailSuggestions,
      datalistId: `bt-${this.document.id ?? this.document.uuid?.slugify?.() ?? foundry.utils.randomID()}-details`,
      isEditable: this.isEditable,
      fieldDisabled: this.isEditable ? "" : "disabled",
      config: CONFIG.BROKENTALES
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    root?.querySelector("[data-bt-threat-rank]")?.addEventListener("change", (event) => {
      const level = CONFIG.BROKENTALES.threatRankOpposition[event.currentTarget.value];
      const levelInput = root.querySelector("[name='system.threat.oppositionLevel']");
      if (levelInput && level) {
        levelInput.value = level;
        levelInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const data = TextEditor.getDragEventData(event);
    const document = await this.#resolveDroppedDocument(data);
    if (!document || document.documentName !== "Item") return super._onDrop?.(event);

    const itemData = this.#prepareDroppedItemData(document);
    const duplicate = this.document.items.find((item) => item.type === itemData.type && item.name === itemData.name);
    if (duplicate) {
      ui.notifications.info(game.i18n.format("BROKENTALES.DropDuplicateItem", { name: itemData.name }));
      return false;
    }

    await this.document.createEmbeddedDocuments("Item", [itemData]);
    this.render({ force: true });
    return false;
  }

  async #resolveDroppedDocument(data) {
    if (!data) return null;
    if (data.uuid) return fromUuid(data.uuid);

    const fromDropData = Item.implementation?.fromDropData ?? Item.fromDropData;
    if (data.type === "Item" && fromDropData) return fromDropData.call(Item.implementation ?? Item, data);
    return null;
  }

  #prepareDroppedItemData(document) {
    const itemData = document.toObject();
    delete itemData._id;
    itemData.folder = null;

    if (itemData.type === "gift" && /dark ego|ego oscuro/i.test(itemData.name ?? "")) {
      itemData.type = "darkEgo";
    }

    return itemData;
  }

  #prepareItems() {
    const groups = {
      descriptor: [],
      gift: [],
      darkEgo: [],
      equipment: [],
      condition: [],
      wound: [],
      storyElement: []
    };
    for (const item of this.document.items) {
      if (this.#isEmptyPlaceholder(item)) continue;
      const data = this.#localizeItem(item);
      groups[item.type]?.push(data);
    }
    for (const list of Object.values(groups)) {
      list.sort((a, b) => (this.#contentSort(a) - this.#contentSort(b)) || a.name.localeCompare(b.name));
    }
    return groups;
  }

  #prepareDescriptorRows() {
    const featuredText = this.#plainText(this.#featuredDescriptionText());
    const descriptors = this.document.items
      .filter((item) => this.#isUsableDescriptor(item) && !this.#isPrincipalDescriptor(item))
      .filter((item) => this.#plainText(item.system?.description) !== featuredText)
      .sort((a, b) => this.#contentSort(a) - this.#contentSort(b));
    const gifts = this.document.items
      .filter((item) => this.#isUsableGift(item))
      .sort((a, b) => this.#contentSort(a) - this.#contentSort(b));
    const rowCount = Math.max(2, descriptors.length, gifts.length);
    return Array.from({ length: rowCount }, (_value, index) => {
      const descriptor = this.#descriptorForGiftIndex(descriptors, index + 1);
      return {
        index: index + 1,
        descriptor: descriptor ? this.#localizeItem(descriptor) : null,
        gift: gifts[index] ? this.#localizeItem(gifts[index]) : null
      };
    });
  }

  #prepareExtraGifts() {
    return [];
  }

  #findFeaturedDescriptor() {
    const description = this.#featuredDescriptionText();
    if (description) {
      return {
        _id: "actor-description",
        name: game.i18n.localize("BROKENTALES.Description"),
        type: "descriptor",
        system: { description }
      };
    }

    const descriptor = this.document.items.find((item) => this.#isUsableDescriptor(item) && this.#isPrincipalDescriptor(item));
    return descriptor ? this.#localizeItem(descriptor) : null;
  }

  #featuredDescriptionText() {
    const localizedActor = this.#localizeData(this.document.toObject());
    const notes = this.#plainText(localizedActor.system?.details?.notes);
    if (notes) return localizedActor.system.details.notes;

    const principal = this.document.items.find((item) => this.#isUsableDescriptor(item) && this.#isPrincipalDescriptor(item));
    if (principal) return this.#localizeItem(principal).system?.description ?? "";

    return "";
  }

  #findDarkEgoDescriptor() {
    const descriptor = this.document.items.find((item) => (
      item.type === "descriptor"
      && !this.#isEmptyPlaceholder(item)
      && (/dark ego|ego oscuro/i.test(item.name) || this.#contentKey(item).startsWith("descriptor-darkego."))
    ));
    return descriptor ? this.#localizeItem(descriptor) : null;
  }

  #findDarkEgo() {
    const darkEgo = this.document.items.find((item) => item.type === "darkEgo" && !this.#isEmptyPlaceholder(item))
      ?? this.document.items.find((item) => item.type === "gift" && /dark ego|ego oscuro/i.test(item.name) && !this.#isEmptyPlaceholder(item));
    return darkEgo ? this.#localizeItem(darkEgo) : null;
  }

  #contentLanguage() {
    return game.brokenTales?.contentLanguage?.() ?? (game.i18n.lang?.startsWith("es") ? "es" : "en");
  }

  #localizeItem(item) {
    return this.#localizeData(item.toObject());
  }

  #localizeData(data) {
    const language = this.#contentLanguage();
    if (!language || language === "en") return data;
    const translations = data.flags?.["broken-tales"]?.translations?.[language];
    if (!translations) return data;

    const localized = foundry.utils.deepClone(data);
    if (translations.name) localized.name = translations.name;
    if (translations.img) localized.img = translations.img;
    if (translations.system) localized.system = foundry.utils.mergeObject(
      localized.system ?? {},
      translations.system,
      { inplace: false }
    );
    if (translations.description) {
      localized.system ??= {};
      localized.system.description = translations.description;
    }
    if (translations.trigger) {
      localized.system ??= {};
      localized.system.trigger = translations.trigger;
    }
    return localized;
  }

  #plainText(value) {
    const raw = String(value ?? "");
    return raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  #hasItemText(item) {
    return Boolean(
      this.#plainText(item.system?.description)
      || this.#plainText(item.system?.positive)
      || this.#plainText(item.system?.trigger)
    );
  }

  #isEmptyPlaceholder(item) {
    if (!["descriptor", "gift", "darkEgo", "equipment"].includes(item.type)) return false;
    const placeholderName = /^(descriptor \d+|don \d+|gift \d+|ego oscuro|dark ego|equipo|equipment)$/i.test(item.name ?? "");
    return placeholderName && !this.#hasItemText(item);
  }

  #isUsableDescriptor(item) {
    return item.type === "descriptor"
      && !/dark ego|ego oscuro/i.test(item.name)
      && !this.#contentKey(item).startsWith("descriptor-darkego.")
      && !this.#isEmptyPlaceholder(item);
  }

  #isUsableGift(item) {
    return item.type === "gift" && !/dark ego|ego oscuro/i.test(item.name) && !this.#isEmptyPlaceholder(item);
  }

  #nameLengthClass(name) {
    const length = String(name ?? "").length;
    if (length > 58) return "bt-name-extreme";
    if (length > 42) return "bt-name-very-long";
    if (length > 28) return "bt-name-long";
    return "";
  }

  #contentKey(item) {
    return String(
      item.system?.key
      ?? item.flags?.["broken-tales"]?.contentKey
      ?? item.getFlag?.("broken-tales", "contentKey")
      ?? ""
    );
  }

  #isPrincipalDescriptor(item) {
    return this.#contentKey(item).startsWith("descriptor-principal.");
  }

  #contentSort(item) {
    const key = this.#contentKey(item);
    const sequence = Number(item.flags?.["broken-tales"]?.sequence ?? item.getFlag?.("broken-tales", "sequence") ?? NaN);
    if (Number.isFinite(sequence) && sequence > 0) return sequence;
    const descriptorGift = key.match(/^descriptor(\d+)-don(\d+)\./i);
    if (descriptorGift) return Number(descriptorGift[2]);
    const gift = key.match(/^don(\d+)\./i);
    if (gift) return Number(gift[1]);
    const equipment = key.match(/^equipment(\d+)\./i);
    if (equipment) return Number(equipment[1]);
    return 1000;
  }

  #descriptorForGiftIndex(descriptors, giftIndex) {
    return descriptors.find((item) => {
      const match = this.#contentKey(item).match(/^descriptor(\d+)-don(\d+)\./i);
      return match && Number(match[2]) === giftIndex;
    }) ?? descriptors[giftIndex - 1] ?? null;
  }

  static async #onCreateItem(_event, target) {
    const type = target.dataset.type || "descriptor";
    const labels = CONFIG.BROKENTALES.itemTypeLabels;
    const name = game.i18n.format("BROKENTALES.NewItem", {
      type: game.i18n.localize(labels[type] || "BROKENTALES.Item")
    });
    await Item.implementation.create({ name, type }, {
      parent: this.document,
      renderSheet: true
    });
  }

  static async #onDeleteItem(_event, target) {
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (!item) return;
    const confirmed = await api.DialogV2.confirm({
      window: { title: game.i18n.localize("BROKENTALES.Delete") },
      content: `<p>${game.i18n.format("BROKENTALES.DeleteConfirm", { name: item.name })}</p>`
    });
    if (confirmed) await item.delete();
  }

  static async #onEditItem(_event, target) {
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    await item?.sheet?.render({ force: true });
  }

  static async #onRollOpposition() {
    await this.document.rollOppositionDialog();
  }
}
