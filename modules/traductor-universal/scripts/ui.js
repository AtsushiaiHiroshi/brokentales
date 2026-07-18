import { MODULE_ID } from "./dictionaries.js";

export class DictionaryEditor extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "traductor-universal-dictionary-editor",
      title: game.i18n.localize("TRADUCTOR_UNIVERSAL.Editor.Title"),
      template: `modules/${MODULE_ID}/templates/dictionary-editor.hbs`,
      width: 720,
      height: "auto",
      closeOnSubmit: true
    });
  }
  getData() { return { json: JSON.stringify(game.settings.get(MODULE_ID, "customDictionary") ?? {}, null, 2) }; }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='export']").on("click", () => this.exportDictionary());
    html.find("[data-action='import']").on("change", event => this.importDictionary(event));
  }

  async _updateObject(event, formData) {
    try { await game.settings.set(MODULE_ID, "customDictionary", JSON.parse(formData.dictionary || "{}")); ui.notifications.info("Diccionario personalizado guardado."); }
    catch (err) { ui.notifications.error("El JSON del diccionario no es válido."); }
  }

  exportDictionary() {
    const dictionary = game.settings.get(MODULE_ID, "customDictionary") ?? {};
    const json = JSON.stringify(dictionary, null, 2);
    const filename = `traductor-universal-diccionario-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  importDictionary(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "{}"));
        const textarea = this.element.find("textarea[name='dictionary']");
        textarea.val(JSON.stringify(parsed, null, 2));
        ui.notifications.info("Diccionario importado. Revisa y guarda para aplicarlo.");
      } catch (err) {
        ui.notifications.error("El archivo importado no contiene JSON válido.");
      }
    };
    reader.readAsText(file);
    event.currentTarget.value = "";
  }
}
