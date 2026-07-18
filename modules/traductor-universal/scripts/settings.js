import { MODULE_ID } from "./dictionaries.js";
import { DictionaryEditor } from "./ui.js";
import { CompendiumTranslator } from "./compendium.js";

export const SPANISH_VARIANTS = {
  "es-419": "Español latinoamericano",
  "es-MX": "Español mexicano",
  "es-AR": "Español argentino",
  "es-CL": "Español chileno",
  "es-CO": "Español colombiano",
  "es-PE": "Español peruano",
  "es-ES": "Castellano / España"
};

let reloadTimer = null;

function scheduleReload() {
  window.clearTimeout(reloadTimer);
  reloadTimer = window.setTimeout(() => window.location.reload(), 750);
}

export function registerSettings() {
  const defaultVariant = SPANISH_VARIANTS[game.i18n?.lang] ? game.i18n.lang : "es-419";
  game.settings.register(MODULE_ID, "variant", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Variant.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Variant.Hint"), scope: "client", config: true, type: String, default: defaultVariant, choices: SPANISH_VARIANTS, onChange: scheduleReload });
  game.settings.register(MODULE_ID, "enableHardTranslation", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.HardTranslation.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.HardTranslation.Hint"), scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MODULE_ID, "translateWholeWindow", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WholeWindow.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WholeWindow.Hint"), scope: "world", config: true, type: Boolean, default: true, onChange: scheduleReload });
  game.settings.register(MODULE_ID, "enableOcr", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Ocr.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Ocr.Hint"), scope: "world", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "ocrLanguage", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.OcrLanguage.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.OcrLanguage.Hint"), scope: "world", config: true, type: String, default: "eng", choices: { eng: "English", spa: "Español", deu: "Deutsch", fra: "Français", jpn: "日本語" } });
  game.settings.register(MODULE_ID, "enableBabele", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Babele.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Babele.Hint"), scope: "world", config: true, type: Boolean, default: true, onChange: scheduleReload });
  game.settings.register(MODULE_ID, "enablePlutonium", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Plutonium.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Plutonium.Hint"), scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MODULE_ID, "mode", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Mode.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Mode.Hint"), scope: "world", config: true, type: String, default: "safe", choices: { safe: "Seguro", aggressive: "Agresivo" } });
  game.settings.register(MODULE_ID, "translateChat", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.TranslateChat.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.TranslateChat.Hint"), scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MODULE_ID, "translateCreatedDocuments", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.TranslateCreatedDocuments.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.TranslateCreatedDocuments.Hint"), scope: "world", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "wordReferencePublicLookup", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferencePublicLookup.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferencePublicLookup.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MODULE_ID, "wordReferenceEndpoint", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceEndpoint.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceEndpoint.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(MODULE_ID, "wordReferenceMethod", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceMethod.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceMethod.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "POST",
    choices: { POST: "POST", GET: "GET" }
  });
  game.settings.register(MODULE_ID, "wordReferenceToken", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceToken.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceToken.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: ""
  });
  game.settings.register(MODULE_ID, "wordReferenceResponsePath", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceResponsePath.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.WordReferenceResponsePath.Hint"),
    scope: "world",
    config: true,
    type: String,
    default: "translation"
  });
  game.settings.register(MODULE_ID, "useWordReferenceApi", {
    name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.UseWordReferenceApi.Name"),
    hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.UseWordReferenceApi.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(MODULE_ID, "debug", { name: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Debug.Name"), hint: game.i18n.localize("TRADUCTOR_UNIVERSAL.Settings.Debug.Hint"), scope: "world", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "customDictionary", { name: "Diccionario personalizado", scope: "world", config: false, type: Object, default: {} });
  game.settings.registerMenu(MODULE_ID, "dictionaryEditor", { name: "Editor de diccionario", label: "Abrir editor", hint: "Edita traducciones personalizadas en JSON.", icon: "fas fa-language", type: DictionaryEditor, restricted: true });
  game.settings.registerMenu(MODULE_ID, "compendiumTranslator", { name: "Traducir compendio", label: "Abrir traductor", hint: "Traduce documentos de un compendio a un compendio nuevo.", icon: "fas fa-book", type: CompendiumTranslator, restricted: true });
}
