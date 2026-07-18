import { MODULE_ID } from "./dictionaries.js";
import { Translator } from "./translator.js";

export class OCRTranslator {
  static tesseractPromise = null;

  static enabled() {
    return game.settings.get(MODULE_ID, "enableOcr");
  }

  static async tesseract() {
    if (globalThis.Tesseract) return globalThis.Tesseract;
    if (this.tesseractPromise) return this.tesseractPromise;

    this.tesseractPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `modules/${MODULE_ID}/vendor/tesseract.min.js`;
      script.async = true;
      script.onload = () => globalThis.Tesseract ? resolve(globalThis.Tesseract) : reject(new Error("Tesseract no quedó disponible."));
      script.onerror = () => reject(new Error(`No se encontró modules/${MODULE_ID}/vendor/tesseract.min.js`));
      document.head.appendChild(script);
    });

    return this.tesseractPromise;
  }

  static async translateImages(root, namespaces = ["foundry", "generic"]) {
    if (!this.enabled()) return;

    const element = root instanceof jQuery ? root[0] : root;
    if (!element) return;

    const images = [];
    if (element.matches?.("img[src]")) images.push(element);
    images.push(...(element.querySelectorAll?.("img[src]") ?? []));
    if (!images.length) return;

    let tesseract;
    try {
      tesseract = await this.tesseract();
    } catch (err) {
      Translator.debug("OCR no disponible:", err.message);
      return;
    }

    for (const image of images) {
      if (image.dataset.tuOcr === "done" || image.dataset.tuOcr === "working") continue;
      if (!this.shouldReadImage(image)) continue;
      this.readImage(image, tesseract, namespaces);
    }
  }

  static shouldReadImage(image) {
    const src = image.getAttribute("src") ?? "";
    if (!src || /^data:/i.test(src)) return false;
    if (image.closest?.("[data-tu-ignore], .editor, .tox, .CodeMirror")) return false;
    return true;
  }

  static async readImage(image, tesseract, namespaces) {
    image.dataset.tuOcr = "working";

    try {
      if (!image.complete) await image.decode?.();
      const lang = game.settings.get(MODULE_ID, "ocrLanguage") || "eng";
      const result = await tesseract.recognize(image, lang);
      const lines = this.resultLines(result);
      this.renderOverlay(image, lines, Translator.dictionaries(namespaces));
      image.dataset.tuOcr = "done";
    } catch (err) {
      image.dataset.tuOcr = "failed";
      console.warn("Traductor Universal | OCR falló para una imagen", err);
    }
  }

  static resultLines(result) {
    const lines = result?.data?.lines ?? [];
    return lines
      .map(line => ({
        text: String(line.text ?? "").trim(),
        bbox: line.bbox ?? line.words?.[0]?.bbox
      }))
      .filter(line => line.text && line.bbox);
  }

  static renderOverlay(image, lines, dict) {
    if (!lines.length) return;

    const translated = lines
      .map(line => ({ ...line, translated: Translator.translateText(line.text, dict) }))
      .filter(line => line.translated && line.translated !== line.text);

    if (!translated.length) return;

    const wrapper = this.ensureWrapper(image);
    wrapper.querySelectorAll(":scope > .tu-ocr-overlay").forEach(el => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "tu-ocr-overlay";
    overlay.dataset.tuIgnore = "true";

    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;

    for (const line of translated) {
      const label = document.createElement("span");
      label.className = "tu-ocr-line";
      label.textContent = line.translated;
      label.style.left = `${(line.bbox.x0 / naturalWidth) * 100}%`;
      label.style.top = `${(line.bbox.y0 / naturalHeight) * 100}%`;
      label.style.width = `${Math.max(8, ((line.bbox.x1 - line.bbox.x0) / naturalWidth) * 100)}%`;
      overlay.appendChild(label);
    }

    wrapper.appendChild(overlay);
  }

  static ensureWrapper(image) {
    const parent = image.parentElement;
    if (parent?.classList.contains("tu-ocr-wrapper")) return parent;

    const wrapper = document.createElement("span");
    wrapper.className = "tu-ocr-wrapper";
    image.before(wrapper);
    wrapper.appendChild(image);
    return wrapper;
  }
}
