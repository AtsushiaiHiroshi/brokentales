const RAVANNO_MODULE_ID = "ravanno-dnd5e-es";

const RAVANNO_COMPENDIUMS = [
  "dnd5e.backgrounds",
  "dnd5e.classes",
  "dnd5e.classfeatures",
  "dnd5e.heroes",
  "dnd5e.items",
  "dnd5e.monsterfeatures",
  "dnd5e.monsters",
  "dnd5e.races",
  "dnd5e.rules",
  "dnd5e.spells",
  "dnd5e.subclasses",
  "dnd5e.tables",
  "dnd5e.tradegoods"
];

export class RavannoIntegration {
  static nameDictionary = {};
  static translationsByCollection = {};
  static translationsByName = {};
  static built = false;

  static available() {
    return game.system?.id === "dnd5e" && game.modules.has(RAVANNO_MODULE_ID);
  }

  static dictionary() {
    return this.available() ? this.nameDictionary : {};
  }

  static async buildCompendiumDictionary() {
    if (this.built || !this.available()) return;

    const nameDictionary = {};
    const translationsByCollection = {};
    const translationsByName = {};

    for (const collection of RAVANNO_COMPENDIUMS) {
      try {
        const json = await this.fetchJson(`modules/${RAVANNO_MODULE_ID}/compendium/${collection}.json`);
        this.collectPackTranslations(collection, json, nameDictionary, translationsByCollection, translationsByName);
      } catch (err) {
        console.warn(`Traductor Universal | No se pudo cargar Ravanno ${collection}`, err);
      }
    }

    this.nameDictionary = nameDictionary;
    this.translationsByCollection = translationsByCollection;
    this.translationsByName = translationsByName;
    this.built = true;
    console.log(`Traductor Universal | Ravanno aportó ${Object.keys(nameDictionary).length} nombres de compendio.`);
  }

  static collectPackTranslations(collection, json, nameDictionary, translationsByCollection, translationsByName) {
    if (json?.label) nameDictionary[collection] = json.label;

    for (const [source, target] of Object.entries(json?.folders ?? {})) {
      if (this.isUsefulPair(source, target)) nameDictionary[source] = target;
    }

    const collectionTranslations = translationsByCollection[collection] ?? {};
    translationsByCollection[collection] = collectionTranslations;

    for (const [sourceName, translation] of Object.entries(json?.entries ?? {})) {
      if (!translation || typeof translation !== "object") continue;

      this.collectEntryNames(sourceName, translation, nameDictionary);

      const normalized = this.normalizeDocumentTranslation(translation);
      if (Object.keys(normalized).length) {
        collectionTranslations[sourceName] = normalized;
        translationsByName[sourceName] = normalized;
      }
    }
  }

  static collectEntryNames(sourceName, translation, nameDictionary) {
    if (this.isUsefulPair(sourceName, translation.name)) nameDictionary[sourceName] = translation.name;

    for (const [pageName, pageTranslation] of Object.entries(translation.pages ?? {})) {
      if (this.isUsefulPair(pageName, pageTranslation?.name)) nameDictionary[pageName] = pageTranslation.name;
    }

    for (const [itemName, itemTranslation] of Object.entries(translation.items ?? {})) {
      if (this.isUsefulPair(itemName, itemTranslation?.name)) nameDictionary[itemName] = itemTranslation.name;
    }

    for (const [resultName, resultTranslation] of Object.entries(translation.results ?? {})) {
      if (this.isUsefulPair(resultName, resultTranslation)) nameDictionary[resultName] = resultTranslation;
      else if (this.isUsefulPair(resultName, resultTranslation?.name)) nameDictionary[resultName] = resultTranslation.name;
    }
  }

  static normalizeDocumentTranslation(translation) {
    const normalized = {};

    if (translation.name) normalized.name = translation.name;

    const description = translation.description ?? translation.text;
    if (description) foundry.utils.setProperty(normalized, "system.description.value", description);
    if (translation.unidentified) foundry.utils.setProperty(normalized, "system.description.unidentified", translation.unidentified);
    if (translation.chat) foundry.utils.setProperty(normalized, "system.description.chat", translation.chat);
    if (translation.material ?? translation.materials) foundry.utils.setProperty(normalized, "system.materials.value", translation.material ?? translation.materials);

    if (translation.pages) normalized.pages = translation.pages;
    if (translation.items) normalized.items = translation.items;
    if (translation.results) normalized.results = translation.results;

    return normalized;
  }

  static translateData(data, collection = null, sourceData = data) {
    if (!this.available() || !this.built || !data || typeof data !== "object") return data;

    const sourceName = sourceData?.name ?? data?.name;
    if (!sourceName) return data;

    const sourceCollection = collection ?? this.sourceCollection(sourceData) ?? this.sourceCollection(data);
    const translation = this.findTranslation(sourceName, sourceCollection);
    if (!translation) return data;

    const clone = foundry.utils.deepClone(data);
    this.applyDocumentTranslation(clone, translation, sourceData);
    return clone;
  }

  static findTranslation(sourceName, collection) {
    return this.translationsByCollection[collection]?.[sourceName] ?? this.translationsByName[sourceName] ?? null;
  }

  static applyDocumentTranslation(data, translation, sourceData) {
    if (translation.name) data.name = translation.name;

    for (const path of ["system.description.value", "system.description.unidentified", "system.description.chat", "system.materials.value"]) {
      const value = foundry.utils.getProperty(translation, path);
      if (value) foundry.utils.setProperty(data, path, value);
    }

    if (translation.pages && Array.isArray(data.pages)) this.translatePages(data.pages, translation.pages, sourceData?.pages ?? []);
    if (translation.items && Array.isArray(data.items)) this.translateEmbeddedByName(data.items, translation.items, sourceData?.items ?? []);
    if (translation.results && Array.isArray(data.results)) this.translateTableResults(data.results, translation.results, sourceData?.results ?? []);
  }

  static translatePages(pages, translations, sourcePages = []) {
    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const sourcePage = sourcePages[i] ?? page;
      const translation = translations[sourcePage?._id] ?? translations[sourcePage?.name] ?? translations[page?._id] ?? translations[page?.name];
      if (!translation) continue;

      if (translation.name) page.name = translation.name;
      if (translation.text) foundry.utils.setProperty(page, "text.content", translation.text);
      if (translation.tooltip) foundry.utils.setProperty(page, "system.tooltip", translation.tooltip);
    }
  }

  static translateEmbeddedByName(items, translations, sourceItems = []) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const sourceItem = sourceItems[i] ?? item;
      const translation = translations[sourceItem?.name] ?? translations[item?.name];
      if (!translation || typeof translation !== "object") continue;

      if (translation.name) item.name = translation.name;
      if (translation.description) foundry.utils.setProperty(item, "system.description.value", translation.description);
    }
  }

  static translateTableResults(results, translations, sourceResults = []) {
    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      const sourceResult = sourceResults[i] ?? result;
      const translation = translations[sourceResult?.text] ?? translations[result?.text];
      if (!translation) continue;

      if (typeof translation === "string") result.text = translation;
      else if (translation.name) result.text = translation.name;
    }
  }

  static sourceCollection(data) {
    const source = data?._stats?.compendiumSource || data?.flags?.core?.sourceId || data?.flags?.ddbimporter?.sourceId;
    if (!source) return null;

    const parsed = foundry.utils.parseUuid(source);
    if (parsed?.collection) return parsed.collection;
    if (source.startsWith("Compendium.")) {
      const parts = source.split(".");
      return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : null;
    }
    return null;
  }

  static async fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.json();
  }

  static isUsefulPair(source, target) {
    if (typeof source !== "string" || typeof target !== "string") return false;
    const cleanSource = source.trim();
    const cleanTarget = target.trim();
    return !!cleanSource && !!cleanTarget && cleanSource !== cleanTarget;
  }
}
