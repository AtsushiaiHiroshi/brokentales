/**
 * Dialog utilities for Broken Tales system
 * @module helpers/dialog
 */

/**
 * Show a simple yes/no continue dialog
 * @returns {Promise<boolean>} True if user clicked yes, false if no
 */
export async function continueDialog() {
  return new Promise((resolve) => {
    new Dialog({
      title:
        game.i18n.localize("BROKENTALES.Dialog.ContinueTitle") || "Continuar",
      content:
        game.i18n.localize("BROKENTALES.Dialog.Continue") ||
        "¿Deseas continuar?",
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("BROKENTALES.Dialog.Yes") || "Sí",
          callback: () => resolve(true),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("BROKENTALES.Dialog.No") || "No",
          callback: () => resolve(false),
        },
      },
      default: "yes",
    }).render(true);
  });
}
