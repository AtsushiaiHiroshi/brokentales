import { MODULE_ID } from "./dictionaries.js";
import { Translator } from "./translator.js";

export class PlutoniumSupport {
  static isActive() {
    return game.modules.get("plutonium")?.active || game.modules.get("plutonium-addon-automation")?.active || game.modules.get("plutonium-importer")?.active;
  }

  static enabled() { return game.settings.get(MODULE_ID, "enablePlutonium") && this.isActive(); }

  static namespaces() {
    return ["foundry", "modules", Translator.systemNamespace(), "dnd5e", "plutonium"];
  }

  static matches(app) {
    if (!this.enabled()) return false;
    const blob = [
      app?.constructor?.name,
      app?.id,
      app?.title,
      app?.options?.id,
      app?.options?.classes?.join?.(" ")
    ].filter(Boolean).join(" ");
    return /plutonium|5etools|import|bestiary|spell|class|subclass|feat|race|species|background|adventure|book|creature|monster|optional|vehicle|object|trap|hazard|psionic|recipe/i.test(blob);
  }

  static translateApp(app, html) {
    if (this.matches(app)) Translator.translateElement(html, this.namespaces());
  }

  static translateData(data) {
    return this.enabled() ? Translator.translateObjectData(data, this.namespaces()) : data;
  }
}
