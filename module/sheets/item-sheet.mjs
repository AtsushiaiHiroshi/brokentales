/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {foundry.appv1.sheets.ItemSheet}
 */
export class BrokenTalesItemSheet extends foundry.appv1.sheets.ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["brokentales", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = "systems/brokentales/templates/item";
    // Return a specific template based on item type
    return `${path}/${this.item.type}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Prepare item-specific data
    this._prepareItemData(context);

    return context;
  }

  /**
   * Prepare item-specific data
   * @param {Object} context
   */
  _prepareItemData(context) {
    const itemType = context.item.type;

    if (itemType === "descriptor") {
      this._prepareDescriptorData(context);
    } else if (itemType === "gift") {
      this._prepareGiftData(context);
    }
  }

  /**
   * Prepare descriptor-specific data
   * @param {Object} context
   */
  _prepareDescriptorData(context) {
    // Add any descriptor-specific context data here
    context.descriptorTypes = {
      narrative: "Narrative",
      mechanical: "Mechanical",
    };
  }

  /**
   * Prepare gift-specific data
   * @param {Object} context
   */
  _prepareGiftData(context) {
    // Add any gift-specific context data here
    context.giftTypes = {
      narrative: "Narrative",
      mechanical: "Mechanical",
    };
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Use gift button
    html.find(".gift-use").click(this._onUseGift.bind(this));

    // Use descriptor button
    html.find(".descriptor-use").click(this._onUseDescriptor.bind(this));
  }

  /**
   * Handle using a gift
   * @param {Event} event
   * @private
   */
  async _onUseGift(event) {
    event.preventDefault();

    if (this.item.type !== "gift") return;

    await this.item.useGift();
  }

  /**
   * Handle using a descriptor
   * @param {Event} event
   * @private
   */
  async _onUseDescriptor(event) {
    event.preventDefault();

    if (this.item.type !== "descriptor") return;

    await this.item.useDescriptor();
  }
}
