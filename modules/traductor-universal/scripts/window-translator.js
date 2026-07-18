import { MODULE_ID } from "./dictionaries.js";
import { Translator } from "./translator.js";
import { PlutoniumSupport } from "./plutonium.js";
import { OCRTranslator } from "./ocr.js";

export class WindowTranslator {
  static observer = null;
  static pending = new Set();
  static timer = null;

  static enabled() {
    return game.settings.get(MODULE_ID, "translateWholeWindow");
  }

  static namespaces() {
    const namespaces = ["foundry", "modules", Translator.systemNamespace()];
    if (PlutoniumSupport.enabled()) namespaces.push("plutonium");
    return namespaces;
  }

  static start() {
    if (this.observer || !document.body) return;

    this.translateNow(document.body);

    this.observer = new MutationObserver(mutations => {
      if (!this.enabled()) return;

      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          this.schedule(mutation.target.parentElement);
          continue;
        }

        if (mutation.type === "attributes") {
          this.schedule(mutation.target);
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) this.schedule(node);
          else if (node.nodeType === Node.TEXT_NODE && node.parentElement) this.schedule(node.parentElement);
        }
      }
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["title", "alt", "placeholder", "aria-label", "aria-description", "aria-roledescription", "data-title", "data-label", "data-placeholder", "data-tooltip", "data-tooltip-content", "data-tooltip-html"],
      characterData: true,
      childList: true,
      subtree: true
    });
    Translator.debug("Observador global de ventana activo");
  }

  static schedule(root) {
    if (!root?.isConnected) return;
    if (root.closest?.("[data-tu-ignore], .editor, .tox, .CodeMirror")) return;

    for (const queued of this.pending) {
      if (queued === root || queued.contains?.(root)) return;
      if (root.contains?.(queued)) this.pending.delete(queued);
    }

    this.pending.add(root);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.flush(), 50);
  }

  static flush() {
    const roots = [...this.pending].filter(root => root?.isConnected);
    this.pending.clear();

    for (const root of roots) this.translateNow(root);
  }

  static translateNow(root) {
    if (!this.enabled()) return;
    try {
      Translator.translateElement(root, this.namespaces());
      OCRTranslator.translateImages(root, this.namespaces());
    } catch (err) {
      console.warn("Traductor Universal | Error al traducir la ventana", err);
    }
  }
}
