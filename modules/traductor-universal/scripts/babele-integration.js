import { MODULE_ID } from "./dictionaries.js";

export class BabeleIntegration {
  static nameDictionary = {};
  static languageDictionary = {};
  static packageLanguageDictionary = {};
  static built = false;
  static languageBuilt = false;
  static packageLanguageBuilt = false;

  static enabled() {
    return game.settings.get(MODULE_ID, "enableBabele");
  }

  static active() {
    return this.enabled() && !!game.babele;
  }

  static dictionary() {
    if (this.active() && !this.built) this.buildNameDictionary();
    if (!this.packageLanguageBuilt) this.buildPackageLanguageDictionaries();
    if (game.system?.id === "dnd5e" && !this.languageBuilt) this.buildDnd5eLanguageDictionary();
    return {
      ...this.packageLanguageDictionary,
      ...this.languageDictionary,
      ...(this.active() ? this.nameDictionary : {})
    };
  }

  static async buildLanguageDictionaries() {
    await this.buildDnd5eLanguageDictionary();
    await this.buildPackageLanguageDictionaries();
  }

  static async buildNameDictionary() {
    if (!this.active()) return;

    const dict = {};

    for (const pack of game.packs ?? []) {
      if (!game.babele.isTranslated?.(pack.collection)) continue;

      try {
        const sourceIndex = [...await pack.getIndex()];
        const translatedIndex = game.babele.translateIndex?.(foundry.utils.deepClone(sourceIndex), pack.collection) ?? [];
        const translatedById = new Map(translatedIndex.map(entry => [entry._id, entry]));

        for (const source of sourceIndex) {
          const translated = translatedById.get(source._id);
          if (source.name && translated?.name && source.name !== translated.name) dict[source.name] = translated.name;
        }
      } catch (err) {
        console.warn(`Traductor Universal | No se pudo leer traducciones Babele para ${pack.collection}`, err);
      }
    }

    this.nameDictionary = dict;
    this.built = true;
    console.log(`Traductor Universal | Babele aportó ${Object.keys(dict).length} nombres traducibles.`);
  }

  static async buildDnd5eLanguageDictionary() {
    if (this.languageBuilt || game.system?.id !== "dnd5e") return;
    if (!game.modules.has("ravanno-dnd5e-es")) return;

    try {
      const [english, spanish] = await Promise.all([
        this.fetchJson("systems/dnd5e/lang/en.json"),
        this.fetchJson("modules/ravanno-dnd5e-es/lang/es.json")
      ]);

      const dict = {};
      for (const [key, englishValue] of Object.entries(english)) {
        const spanishValue = spanish[key];
        if (!this.isUsefulPair(englishValue, spanishValue)) continue;
        dict[englishValue.trim()] = spanishValue.trim();
      }

      this.languageDictionary = dict;
      this.languageBuilt = true;
      console.log(`Traductor Universal | Ravanno aportó ${Object.keys(dict).length} textos de interfaz D&D5e.`);
    } catch (err) {
      console.warn("Traductor Universal | No se pudo cargar ravanno-dnd5e-es/lang/es.json", err);
    }
  }

  static async buildPackageLanguageDictionaries() {
    if (this.packageLanguageBuilt) return;

    const dict = {};
    const packages = this.languagePackages();

    for (const pkg of packages) {
      const english = this.findLanguage(pkg.languages, ["en", "en-US"]);
      const spanish = this.findLanguage(pkg.languages, this.targetLanguages());
      if (!english || !spanish) continue;

      try {
        const [englishJson, spanishJson] = await Promise.all([
          this.fetchJson(this.resolveLanguagePath(pkg.base, english.path)),
          this.fetchJson(this.resolveLanguagePath(pkg.base, spanish.path))
        ]);

        foundry.utils.mergeObject(dict, this.compareLanguageFiles(englishJson, spanishJson), { inplace: true });
      } catch (err) {
        console.warn(`Traductor Universal | No se pudo leer idiomas de ${pkg.id}`, err);
      }
    }

    this.packageLanguageDictionary = dict;
    this.packageLanguageBuilt = true;
    console.log(`Traductor Universal | Sistemas y módulos aportaron ${Object.keys(dict).length} textos traducibles.`);
  }

  static languagePackages() {
    const packages = [];
    const systemId = game.system?.id;
    if (systemId) packages.push({ id: systemId, base: `systems/${systemId}`, languages: this.languageDefinitions(game.system) });

    for (const module of game.modules?.values?.() ?? []) {
      if (!module.active) continue;
      packages.push({ id: module.id, base: `modules/${module.id}`, languages: this.languageDefinitions(module) });
    }

    return packages;
  }

  static languageDefinitions(pkg) {
    return pkg?.languages ?? pkg?.manifest?.languages ?? [];
  }

  static targetLanguages() {
    const variant = game.settings.get(MODULE_ID, "variant") || game.i18n?.lang || "es-419";
    return [...new Set([variant, game.i18n?.lang, "es-MX", "es-419", "es"].filter(Boolean))];
  }

  static findLanguage(languages, targets) {
    return targets.map(target => languages.find(language => language.lang === target)).find(Boolean);
  }

  static resolveLanguagePath(base, path) {
    const clean = String(path ?? "").replace(/^\/+/, "");
    if (/^(systems|modules|worlds)\//.test(clean)) return clean;
    return `${base}/${clean}`;
  }

  static compareLanguageFiles(english, spanish) {
    const dict = {};
    for (const [key, englishValue] of Object.entries(foundry.utils.flattenObject(english))) {
      const spanishValue = spanish[key] ?? foundry.utils.getProperty(spanish, key);
      if (!this.isUsefulPair(englishValue, spanishValue)) continue;
      dict[englishValue.trim()] = spanishValue.trim();
    }
    return dict;
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
    if (!cleanSource || !cleanTarget || cleanSource === cleanTarget) return false;
    if (cleanSource.length > 140 || cleanTarget.length > 180) return false;
    if (/[{}]/.test(cleanSource)) return false;
    return true;
  }

  static sourceCollection(data) {
    const source = data?._stats?.compendiumSource || data?.flags?.core?.sourceId || data?.flags?.ddbimporter?.sourceId;
    if (!source) return null;

    const parsed = foundry.utils.parseUuid(source);
    if (parsed?.collection && parsed?.documentType) return parsed.collection;
    if (source.startsWith("Compendium.")) {
      const parts = source.split(".");
      return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : null;
    }
    return null;
  }

  static translateData(data, collection = null) {
    if (!this.active()) return data;

    const pack = collection ?? this.sourceCollection(data);
    if (!pack || !game.babele.isTranslated?.(pack)) return data;

    try {
      return game.babele.translate(pack, data) ?? data;
    } catch (err) {
      console.warn(`Traductor Universal | Babele no pudo traducir ${pack}`, err);
      return data;
    }
  }
}
