import { MODULE_ID, DICTIONARIES, EXCLUSIONS } from "./dictionaries.js";
import { BabeleIntegration } from "./babele-integration.js";
import { RavannoIntegration } from "./ravanno-integration.js";
import { I18nGlossary } from "./i18n-glossary.js";
import { WordReferenceProvider } from "./wordreference-provider.js";

export class Translator {
  static variant() {
    const configured = game.settings.get(MODULE_ID, "variant");
    if (DICTIONARIES.generic?.[configured]) return configured;
    if (DICTIONARIES.generic?.[game.i18n?.lang]) return game.i18n.lang;
    return "es-419";
  }

  static mode() { return game.settings.get(MODULE_ID, "mode") || "safe"; }
  static debug(...args) { if (game.settings.get(MODULE_ID, "debug")) console.log("Traductor Universal |", ...args); }

  static dictionary(namespace = "generic") {
    const variant = this.variant();
    const baseGeneric = DICTIONARIES.generic?.["es-419"] ?? {};
    const regionalGeneric = DICTIONARIES.generic?.[variant] ?? {};
    const base = DICTIONARIES[namespace]?.["es-419"] ?? {};
    const regional = DICTIONARIES[namespace]?.[variant] ?? {};
    const custom = game.settings.get(MODULE_ID, "customDictionary") ?? {};
    const babele = namespace === "dnd5e" ? BabeleIntegration.dictionary() : {};
    const ravanno = namespace === "dnd5e" ? RavannoIntegration.dictionary() : {};
    const i18nGlossary = namespace === "brokenTales" ? I18nGlossary.dictionary() : {};
    return foundry.utils.mergeObject(
      foundry.utils.mergeObject(foundry.utils.mergeObject({}, baseGeneric, { inplace: false }), regionalGeneric, { inplace: false }),
      foundry.utils.mergeObject(foundry.utils.mergeObject(foundry.utils.mergeObject(foundry.utils.mergeObject(foundry.utils.mergeObject(base, regional, { inplace: false }), i18nGlossary, { inplace: false }), babele, { inplace: false }), ravanno, { inplace: false }), custom[namespace] ?? {}, { inplace: false }),
      { inplace: false }
    );
  }

  static dictionaries(namespaces = "generic") {
    const unique = [...new Set([].concat(namespaces).filter(Boolean))];
    return unique.reduce((dict, namespace) => foundry.utils.mergeObject(dict, this.dictionary(namespace), { inplace: false }), {});
  }

  static systemNamespace() {
    const systemMap = {
      dnd5e: "dnd5e",
      pf2e: "pf2e",
      sf2e: "pf2e",
      worldofdarkness: "wod",
      wod5e: "wod",
      vtm5e: "wod",
      "broken-tales": "brokenTales",
      swade: "swade",
      "cyberpunk-red-core": "cyberpunkRed",
      dragonbane: "dragonbane"
    };
    return systemMap[game.system?.id] ?? "generic";
  }

  static shouldSkip(text) {
    const clean = String(text ?? "").trim();
    if (!clean) return true;
    if (clean.length > 800) return true;
    if (EXCLUSIONS.exact.has(clean)) return true;
    return EXCLUSIONS.patterns.some(p => p.test(clean));
  }

  static translateText(text, dict) {
    if (typeof text !== "string") return text;
    const trimmed = text.trim();
    const exact = this.exactTranslation(trimmed, dict);
    if (exact) return text.replace(trimmed, exact);
    if (this.shouldSkip(trimmed)) return text;
    if (this.mode() !== "aggressive") return text;
    let out = text;
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [source, target] of entries) {
      if (source.length < 3) continue;
      const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`\\b${escaped}\\b`, "g"), target);
    }
    return out;
  }

  static externalTranslationText(result) {
    if (!result || typeof result !== "object") return null;
    return result.translation
      ?? result.translatedText
      ?? result.targetText
      ?? result.textTranslated
      ?? result.result
      ?? null;
  }

  static async translateTextAsync(text, dict, { useExternal = false, from = "en", to = "es" } = {}) {
    const translated = this.translateText(text, dict);
    if (translated !== text) return translated;
    if (!useExternal || typeof text !== "string") return text;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 5000) return text;
    if (EXCLUSIONS.exact.has(trimmed)) return text;
    if (EXCLUSIONS.patterns.some(p => p.test(trimmed))) return text;

    try {
      const result = await WordReferenceProvider.translate(trimmed, { from, to });
      const external = this.externalTranslationText(result);
      if (!external || external === trimmed) return text;
      return text.replace(trimmed, external);
    } catch (error) {
      this.debug("WordReference/API translation skipped", error);
      return text;
    }
  }

  static exactTranslation(text, dict) {
    if (dict[text]) return dict[text];

    const normalized = text.replace(/\s+/g, " ");
    if (normalized !== text && dict[normalized]) return dict[normalized];

    const lower = normalized.toLocaleLowerCase("es");
    const entry = Object.entries(dict).find(([source]) => source.toLocaleLowerCase("es") === lower);
    if (!entry) return null;

    return this.matchCase(text, entry[1]);
  }

  static matchCase(source, target) {
    if (/^[\p{Lu}\d\s.,:;/()[\]'+-]+$/u.test(source)) return target.toLocaleUpperCase("es");
    return target;
  }

  static translateElement(root, namespaces = "generic") {
    if (!game.settings.get(MODULE_ID, "enableHardTranslation")) return;
    const element = globalThis.jQuery && root instanceof globalThis.jQuery ? root[0] : root;
    if (!element) return;
    const dict = this.dictionaries(namespaces);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName?.toLowerCase();
        if (["script", "style", "textarea", "code", "pre", "input"].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.closest?.("[data-tu-ignore], .editor, .tox, .CodeMirror, [contenteditable='true']")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const before = node.nodeValue;
      const after = this.translateText(before, dict);
      if (before !== after) node.nodeValue = after;
    }
    this.translateAttributes(element, dict);
  }

  static translateAttributes(element, dict) {
    const selector = "[title], [alt], [placeholder], [aria-label], [aria-description], [aria-roledescription], [data-title], [data-label], [data-placeholder], [data-tooltip], [data-tooltip-content], [data-tooltip-html], input[type='button'], input[type='submit'], input[type='reset'], option";
    const nodes = [];
    if (element.matches?.(selector)) nodes.push(element);
    nodes.push(...(element.querySelectorAll?.(selector) ?? []));

    for (const el of nodes) {
      for (const attr of ["title", "alt", "placeholder", "aria-label", "aria-description", "aria-roledescription", "data-title", "data-label", "data-placeholder", "data-tooltip", "data-tooltip-content", "data-tooltip-html"]) {
        const value = el.getAttribute?.(attr);
        if (!value) continue;
        const translated = this.translateText(value, dict);
        if (translated !== value) el.setAttribute(attr, translated);
      }
      if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type)) {
        const translated = this.translateText(el.value, dict);
        if (translated !== el.value) el.value = translated;
      }
    }
  }

  static translateObjectData(data, namespaces = "generic") {
    const dict = this.dictionaries(namespaces);
    const clone = foundry.utils.deepClone(data);
    const blocked = new Set(["_id", "id", "uuid", "img", "type", "folder", "sort", "permission", "ownership"]);
    const walk = obj => {
      if (!obj || typeof obj !== "object") return obj;
      for (const [key, value] of Object.entries(obj)) {
        if (blocked.has(key)) continue;
        if (typeof value === "string") obj[key] = this.translateText(value, dict);
        else if (Array.isArray(value)) obj[key] = value.map(v => typeof v === "string" ? this.translateText(v, dict) : walk(v));
        else if (typeof value === "object") walk(value);
      }
      return obj;
    };
    return walk(clone);
  }

  static async translateObjectDataAsync(data, namespaces = "generic", options = {}) {
    const dict = this.dictionaries(namespaces);
    const clone = foundry.utils.deepClone(data);
    const blocked = new Set(["_id", "id", "uuid", "img", "type", "folder", "sort", "permission", "ownership"]);
    const walk = async obj => {
      if (!obj || typeof obj !== "object") return obj;
      for (const [key, value] of Object.entries(obj)) {
        if (blocked.has(key)) continue;
        if (typeof value === "string") obj[key] = await this.translateTextAsync(value, dict, options);
        else if (Array.isArray(value)) {
          const translated = [];
          for (const entry of value) translated.push(typeof entry === "string" ? await this.translateTextAsync(entry, dict, options) : await walk(entry));
          obj[key] = translated;
        }
        else if (typeof value === "object") await walk(value);
      }
      return obj;
    };
    return walk(clone);
  }
}
