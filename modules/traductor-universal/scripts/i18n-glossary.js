import { MODULE_ID } from "./dictionaries.js";

const SYSTEM_LANG_ROOTS = {
  "broken-tales": "systems/broken-tales/lang"
};

function targetLanguage() {
  try {
    if (game.system?.id === "broken-tales") {
      const configured = String(game.settings.get("broken-tales", "contentLanguage") ?? "").toLowerCase();
      if (configured === "es" || configured.startsWith("es-") || configured === "spanish" || configured === "español") return "es";
      if (configured === "en" || configured.startsWith("en-") || configured === "english" || configured === "inglés") return "en";
    }
  } catch (_error) {
    // Broken Tales settings may not be registered yet during early startup.
  }

  const lang = game.i18n?.lang ?? "en";
  if (lang.startsWith("es")) return "es";
  return lang;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export class I18nGlossary {
  static #cache = {};

  static async build(systemId = game.system?.id) {
    if (!systemId || !SYSTEM_LANG_ROOTS[systemId]) return {};

    const lang = targetLanguage();
    if (lang === "en") {
      this.#cache[systemId] = {};
      return {};
    }

    const root = SYSTEM_LANG_ROOTS[systemId];
    try {
      const [en, target] = await Promise.all([
        fetchJson(`${root}/en.json`),
        fetchJson(`${root}/${lang}.json`).catch(() => fetchJson(`${root}/es.json`))
      ]);
      const dict = {};
      for (const [key, source] of Object.entries(en)) {
        if (!key.startsWith("BROKENTALES.")) continue;
        const translated = target[key];
        if (!source || !translated || source === translated) continue;
        dict[source] = translated;
        dict[key] = translated;
      }
      this.#cache[systemId] = dict;
      console.log(`Traductor Universal | Glosario i18n ${systemId}: ${Object.keys(dict).length} entradas.`);
      return dict;
    } catch (error) {
      console.warn(`Traductor Universal | No se pudo cargar el glosario i18n de ${systemId}.`, error);
      this.#cache[systemId] = {};
      return {};
    }
  }

  static dictionary(systemId = game.system?.id) {
    return this.#cache[systemId] ?? {};
  }

  static clear(systemId = game.system?.id) {
    if (systemId) delete this.#cache[systemId];
    else this.#cache = {};
  }
}
