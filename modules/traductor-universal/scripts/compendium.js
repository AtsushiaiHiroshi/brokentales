import { MODULE_ID } from "./dictionaries.js";
import { Translator } from "./translator.js";
import { PlutoniumSupport } from "./plutonium.js";
import { BabeleIntegration } from "./babele-integration.js";

export class CompendiumTranslator extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "traductor-universal-compendium-translator",
      title: game.i18n.localize("TRADUCTOR_UNIVERSAL.Compendium.Title"),
      template: `modules/${MODULE_ID}/templates/compendium-translator.hbs`,
      width: 620,
      height: "auto",
      closeOnSubmit: false
    });
  }

  getData() {
    const packs = game.packs.map(p => ({ collection: p.collection, label: p.metadata.label, type: p.documentName }));
    return { packs, useWordReferenceApi: game.settings.get(MODULE_ID, "useWordReferenceApi") };
  }

  async _updateObject(event, formData) {
    const sourceKey = formData.sourcePack;
    const namespace = formData.namespace || "generic";
    const useExternal = Boolean(formData.useExternal);
    const sourcePack = game.packs.get(sourceKey);
    if (!sourcePack) return ui.notifications.error("Compendio de origen no encontrado.");
    const translatedLabel = `${sourcePack.metadata.label} ES`;
    const packName = this.uniquePackName(`${sourcePack.metadata.name}-es`.slugify());
    const pack = await CompendiumCollection.createCompendium({ type: sourcePack.documentName, label: translatedLabel, package: "world", name: packName });
    const index = await sourcePack.getIndex();
    const total = index.size ?? index.length ?? 0;
    let count = 0;
    for (const entry of index) {
      const doc = await sourcePack.getDocument(entry._id);
      let data = doc.toObject();
      data = BabeleIntegration.translateData(data, sourcePack.collection);
      data = namespace === "plutonium"
        ? PlutoniumSupport.translateData(data)
        : await Translator.translateObjectDataAsync(data, ["foundry", namespace], {
          useExternal,
          from: "en",
          to: Translator.variant().startsWith("es") ? "es" : Translator.variant()
        });
      delete data._id;
      await pack.importDocument(new CONFIG[sourcePack.documentName].documentClass(data));
      count++;
      if (count % 25 === 0) ui.notifications.info(`Traductor Universal: ${count}/${total} documentos traducidos...`);
    }
    ui.notifications.info(`Compendio traducido: ${count} documentos.`);
  }

  uniquePackName(baseName) {
    let name = baseName || "traductor-universal-es";
    let suffix = 2;
    while (game.packs.has(`world.${name}`)) name = `${baseName}-${suffix++}`;
    return name;
  }
}
