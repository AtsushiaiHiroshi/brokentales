import { MODULE_ID } from "./dictionaries.js";

const SYSTEM_LANG_ROOTS = {
  "broken-tales": "systems/broken-tales/lang"
};

const BROKEN_TALES_NAME_ALIASES = {
  "Baba Yaga - The Child Witch": "Baba Yaga la Niña Bruja",
  "Babai - The Judge": "Babai el Juez",
  "Cunning Machiavelli The Fox & Sly Bischeri The Cat": "Machiavelli el Zorro Astuto y Bischeri el Gato Malicioso",
  "Cunning Machiavelli the Fox & Sly Bischeri the Cat": "Machiavelli el Zorro Astuto y Bischeri el Gato Malicioso",
  "Garou - The Old Wolf": "Garou el Viejo Lobo",
  "George The Holy Dragon Slayer": "San Jorge el Matadragones",
  "James The Swordsman": "Jaime el Espadachín",
  "Marina - The Sea Explorer": "Marina la Exploradora del Mar",
  "Niklaus Von Krampus": "Niklaus von Krampus",
  "Regina - The Thief of Hearts": "Regina la Ladrona de Corazones",
  "Sun Wukong - The Amazing Monkey": "Sun Wukong el Mono Asombroso",
  "The Astonishing Pied Piper Without a Name": "El Asombroso Flautista sin Nombre",
  "The Inmortal": "El Inmortal",
  "The Immortal": "El Inmortal",
  "The Woman from the Woods": "La Dama de los Bosques",
  "Verdoux Bluebeard": "Verdoux Barba Azul",
  "Yukie Onn - The Traveling Artist": "Yukie Onn la Artista Viajera"
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

  static #addPair(dict, source, translated) {
    const from = String(source ?? "").trim();
    const to = String(translated ?? "").trim();
    if (!from || !to || from === to) return;
    dict[from] = to;
  }

  static #addBrokenTalesAliases(dict, source, translated) {
    this.#addPair(dict, source, translated);

    const from = String(source ?? "").trim();
    const to = String(translated ?? "").trim();
    if (!from || !to || from === to) return;

    this.#addPair(dict, from.replace(/\s+-\s+/g, " "), to.replace(/\s+-\s+/g, " "));
    this.#addPair(dict, from.replace(/\s+&\s+/g, " and "), to.replace(/\s+&\s+/g, " y "));
    this.#addPair(dict, from.replace(/\s+and\s+/gi, " & "), to.replace(/\s+y\s+/gi, " y "));

    const sourceBase = from.replace(/\s+-\s+(Main Descriptor|Dark Ego Descriptor|Gift \d+ Descriptor)$/i, "").trim();
    const targetBase = to.replace(/\s+-\s+Descriptor (principal|de Ego oscuro|de Don \d+)$/i, "").trim();
    this.#addPair(dict, sourceBase, targetBase);
    this.#addPair(dict, sourceBase.replace(/\s+&\s+/g, " and "), targetBase.replace(/\s+&\s+/g, " y "));
  }

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
        dict[key] = translated;
        this.#addBrokenTalesAliases(dict, source, translated);
      }
      for (const [source, translated] of Object.entries(BROKEN_TALES_NAME_ALIASES)) {
        this.#addBrokenTalesAliases(dict, source, translated);
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
