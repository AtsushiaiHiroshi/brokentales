import { MODULE_ID } from "./dictionaries.js";
import { registerSettings, SPANISH_VARIANTS } from "./settings.js";
import { Translator } from "./translator.js";
import { PlutoniumSupport } from "./plutonium.js";
import { WindowTranslator } from "./window-translator.js";
import { OCRTranslator } from "./ocr.js";
import { BabeleIntegration } from "./babele-integration.js";
import { RavannoIntegration } from "./ravanno-integration.js";
import { I18nGlossary } from "./i18n-glossary.js";
import { WordReferenceProvider } from "./wordreference-provider.js";

function activeNamespaces() {
  const namespaces = ["foundry", "modules", Translator.systemNamespace()];
  if (PlutoniumSupport.enabled()) namespaces.push("plutonium");
  return namespaces;
}

function translateRendered(root, namespaces = activeNamespaces()) {
  Translator.translateElement(root, namespaces);
  OCRTranslator.translateImages(root, namespaces);
}

function translateCreatedData(data) {
  if (!game.user.isGM || !game.settings.get(MODULE_ID, "translateCreatedDocuments")) return;
  const namespaces = PlutoniumSupport.enabled() ? PlutoniumSupport.namespaces() : ["foundry", "modules", Translator.systemNamespace()];
  const babeleData = BabeleIntegration.translateData(data);
  const ravannoData = RavannoIntegration.translateData(babeleData, null, data);
  const plutoniumData = PlutoniumSupport.translateData(ravannoData);
  foundry.utils.mergeObject(data, Translator.translateObjectData(plutoniumData, namespaces), { inplace: true });
}

Hooks.once("init", () => {
  registerSettings();
  console.log("Traductor Universal | Inicializado");
});

Hooks.on("renderApplication", (app, html) => {
  try {
    translateRendered(html);
    PlutoniumSupport.translateApp(app, html);
  } catch (err) {
    console.warn("Traductor Universal | Error en renderApplication", err);
  }
});

Hooks.on("renderApplicationV2", (app, element) => {
  try {
    translateRendered(element);
    PlutoniumSupport.translateApp(app, element);
  } catch (err) {
    console.warn("Traductor Universal | Error en renderApplicationV2", err);
  }
});

Hooks.on("renderActorSheet", (app, html) => {
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("renderItemSheet", (app, html) => {
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("renderJournalSheet", (app, html) => {
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("renderJournalEntrySheet", (app, html) => {
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("renderJournalPageSheet", (app, html) => {
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("renderImagePopout", (app, html) => {
  try { OCRTranslator.translateImages(html, activeNamespaces()); } catch (err) { console.warn(err); }
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!game.settings.get(MODULE_ID, "translateChat")) return;
  try { translateRendered(html); } catch (err) { console.warn(err); }
});

Hooks.on("preCreateItem", (document, data, options, userId) => {
  try { translateCreatedData(data); } catch (err) { console.warn("Traductor Universal | preCreateItem", err); }
});

Hooks.on("preCreateActor", (document, data, options, userId) => {
  try { translateCreatedData(data); } catch (err) { console.warn("Traductor Universal | preCreateActor", err); }
});

for (const hook of ["preCreateJournalEntry", "preCreateJournalEntryPage", "preCreateScene", "preCreateRollTable", "preCreateMacro"]) {
  Hooks.on(hook, (document, data) => {
    try { translateCreatedData(data); } catch (err) { console.warn(`Traductor Universal | ${hook}`, err); }
  });
}

Hooks.once("ready", async () => {
  await I18nGlossary.build();
  await BabeleIntegration.buildLanguageDictionaries();
  await RavannoIntegration.buildCompendiumDictionary();
  await BabeleIntegration.buildNameDictionary();
  game.traductorUniversal = {
    Translator,
    I18nGlossary,
    WordReferenceProvider,
    openWordReference: (text) => WordReferenceProvider.open(text),
    translateWithWordReference: (text, options = {}) => WordReferenceProvider.translate(text, options)
  };
  WindowTranslator.start();
  if (game.system?.id === "dnd5e" && !game.modules.get("translate-dnd5e-sdr2-es")?.active) {
    ui.notifications.warn("Traductor Universal: activa 'D&D 5e SRD 2024 Spanish Translation (Babele)' para traducir compendios y nombres de D&D5e con Babele.");
  }
  const variant = Translator.variant();
  ui.notifications.info(`Traductor Universal activo. Base: ${SPANISH_VARIANTS[variant] ?? variant}.`);
});

Hooks.on("babele.ready", () => {
  BabeleIntegration.buildNameDictionary();
});
