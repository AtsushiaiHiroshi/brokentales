async function continueDialog() {
    return new Promise((resolve) => {
        new Dialog({
            title: "Continuar",
            content: game.i18n.localize("BROKENTALES.Dialog.Continue"),
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Sí",
                    callback: () => resolve(true)
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "No",
                    callback: () => resolve(false)
                }
            },
            default: "yes"
        }).render(true);
    });
}