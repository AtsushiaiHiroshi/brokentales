import { MODULE_ID } from "./dictionaries.js";

const WORDREFERENCE_SEARCH_URL = "https://www.wordreference.com/es/translation.asp";
const MAX_PUBLIC_LOOKUP_LENGTH = 80;
const MAX_PUBLIC_LOOKUP_WORDS = 6;

function readPath(object, path) {
  if (!path) return null;
  return String(path).split(".").reduce((value, key) => value?.[key], object);
}

function applyTemplate(template, values) {
  return String(template ?? "").replace(/\{(text|from|to|token)\}/g, (_match, key) => encodeURIComponent(values[key] ?? ""));
}

export class WordReferenceProvider {
  static #cache = new Map();

  static lookupUrl(text, { from = "en", to = "es" } = {}) {
    const term = String(text ?? "").trim();
    if (from === "en" && to === "es") return "https://www.wordreference.com/enes/" + encodeURIComponent(term);
    if (from === "es" && to === "en") return "https://www.wordreference.com/es/en/translation.asp?spen=" + encodeURIComponent(term);
    const query = new URLSearchParams({ tranword: term });
    return WORDREFERENCE_SEARCH_URL + "?" + query.toString();
  }

  static open(text, options = {}) {
    const term = String(text ?? "").trim();
    if (!term) return null;
    const url = this.lookupUrl(term, options);
    window.open(url, "_blank", "noopener,noreferrer");
    return url;
  }

  static canUsePublicLookup(text) {
    const term = String(text ?? "").trim();
    if (!term || term.length > MAX_PUBLIC_LOOKUP_LENGTH) return false;
    return term.split(/\s+/).length <= MAX_PUBLIC_LOOKUP_WORDS;
  }

  static cleanTranslationText(text) {
    return String(text ?? "")
      .replace(/\s+/g, " ")
      .replace(/^⇒\s*/, "")
      .replace(/\s*\[[^\]]+\]\s*/g, " ")
      .trim();
  }

  static stripHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html ?? "");
    return this.cleanTranslationText(template.content.textContent ?? "");
  }

  static extractPublicTranslation(html) {
    if (!html || typeof DOMParser === "undefined") return null;
    const document = new DOMParser().parseFromString(html, "text/html");
    const cells = [
      ...document.querySelectorAll("td.ToWrd"),
      ...document.querySelectorAll(".ToWrd"),
      ...document.querySelectorAll("#articleWRD td:nth-child(3)")
    ];

    for (const cell of cells) {
      const text = this.cleanTranslationText(cell.textContent);
      if (!text || /^(ⓘ|forum|discussions?|advertisement)$/i.test(text)) continue;
      if (text.length > 120) continue;
      return text;
    }

    const match = String(html).match(/<td[^>]*class=["'][^"']*ToWrd[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    return match ? this.stripHtml(match[1]) : null;
  }

  static async publicLookup(text, { from = "en", to = "es" } = {}) {
    const term = String(text ?? "").trim();
    if (!this.canUsePublicLookup(term)) {
      return {
        provider: "wordreference",
        status: "manual-only",
        reason: "term-too-long",
        url: this.lookupUrl(term, { from, to }),
        text: term
      };
    }

    const url = this.lookupUrl(term, { from, to });
    try {
      const response = await fetch(url, { method: "GET", credentials: "omit" });
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      const html = await response.text();
      const translation = this.extractPublicTranslation(html);
      return {
        provider: "wordreference",
        status: translation ? "translated" : "no-public-match",
        text: term,
        translation,
        from,
        to,
        url
      };
    } catch (error) {
      return {
        provider: "wordreference",
        status: "manual-only",
        reason: error?.message ?? String(error),
        url,
        text: term,
        from,
        to
      };
    }
  }

  static externalTranslationText(payload) {
    if (!payload || typeof payload !== "object") return null;
    const configuredPath = game.settings.get(MODULE_ID, "wordReferenceResponsePath")?.trim();
    return readPath(payload, configuredPath)
      ?? payload.translation
      ?? payload.translatedText
      ?? payload.targetText
      ?? payload.textTranslated
      ?? payload.result
      ?? payload.data?.translation
      ?? payload.data?.translatedText
      ?? null;
  }

  static async translate(text, { from = "en", to = "es", refresh = false } = {}) {
    const endpoint = game.settings.get(MODULE_ID, "wordReferenceEndpoint")?.trim();
    const method = game.settings.get(MODULE_ID, "wordReferenceMethod") || "POST";
    const token = game.settings.get(MODULE_ID, "wordReferenceToken")?.trim() || "";
    const term = String(text ?? "").trim();
    if (!term) return null;

    const cacheKey = from + ":" + to + ":" + term.toLocaleLowerCase();
    if (!refresh && this.#cache.has(cacheKey)) return this.#cache.get(cacheKey);

    if (!endpoint) {
      const allowPublicLookup = game.settings.get(MODULE_ID, "wordReferencePublicLookup");
      const result = allowPublicLookup
        ? await this.publicLookup(term, { from, to })
        : {
            provider: "wordreference",
            status: "manual-only",
            url: this.lookupUrl(term, { from, to }),
            text: term
          };
      this.#cache.set(cacheKey, result);
      return result;
    }

    const values = { text: term, from, to, token };
    const url = applyTemplate(endpoint, values);
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    const request = method === "GET"
      ? { method: "GET", headers }
      : { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(values) };

    const response = await fetch(url, request);
    if (!response.ok) throw new Error(response.status + " " + response.statusText);

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : { translatedText: await response.text() };
    const translation = this.externalTranslationText(payload);
    const result = {
      provider: "wordreference",
      status: translation ? "translated" : "no-translation-field",
      text: term,
      translation,
      from,
      to,
      payload
    };
    this.#cache.set(cacheKey, result);
    return result;
  }

  static clearCache() {
    this.#cache.clear();
  }
}
