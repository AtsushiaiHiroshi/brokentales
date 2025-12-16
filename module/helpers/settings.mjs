/**
 * Register all system settings
 */
export const registerSystemSettings = function () {
  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("brokentales", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  /**
   * Register dice roll sound setting
   */
  game.settings.register("brokentales", "playDiceSound", {
    name: "BROKENTALES.Settings.DiceSound.Name",
    hint: "BROKENTALES.Settings.DiceSound.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  /**
   * Register automatic wound tracking
   */
  game.settings.register("brokentales", "autoTrackWounds", {
    name: "BROKENTALES.Settings.AutoWounds.Name",
    hint: "BROKENTALES.Settings.AutoWounds.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /**
   * Register soma consumption confirmation
   */
  game.settings.register("brokentales", "confirmSomaSpend", {
    name: "BROKENTALES.Settings.ConfirmSoma.Name",
    hint: "BROKENTALES.Settings.ConfirmSoma.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  /**
   * Show character portraits in chat
   */
  game.settings.register("brokentales", "showPortraitsInChat", {
    name: "BROKENTALES.Settings.ChatPortraits.Name",
    hint: "BROKENTALES.Settings.ChatPortraits.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
};
