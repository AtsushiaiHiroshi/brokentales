/**
 * Compatibility helpers for keeping the legacy Broken Tales system usable
 * across Foundry VTT generations.
 *
 * The project intentionally keeps the old system id (brokentales) so worlds
 * made on previous Foundry versions can continue to open. These helpers keep
 * version-sensitive API access in one place instead of scattering appv1/v14
 * checks throughout the system.
 */

export function installLegacySheetAliases() {
  const foundryGlobal = globalThis.foundry;
  if (!foundryGlobal) return;

  foundryGlobal.appv1 = foundryGlobal.appv1 || {};
  foundryGlobal.appv1.sheets = foundryGlobal.appv1.sheets || {};

  if (!foundryGlobal.appv1.sheets.ActorSheet && globalThis.ActorSheet) {
    foundryGlobal.appv1.sheets.ActorSheet = globalThis.ActorSheet;
  }

  if (!foundryGlobal.appv1.sheets.ItemSheet && globalThis.ItemSheet) {
    foundryGlobal.appv1.sheets.ItemSheet = globalThis.ItemSheet;
  }
}

installLegacySheetAliases();

export function getFoundryMajorVersion() {
  const version = globalThis.game?.version || globalThis.game?.data?.version || "0";
  return Number.parseInt(String(version).split(".")[0], 10) || 0;
}

export function isFoundryV14OrNewer() {
  return getFoundryMajorVersion() >= 14;
}

export function getAppV1Sheets() {
  installLegacySheetAliases();
  return globalThis.foundry?.appv1?.sheets || {};
}

export function getBaseActorSheet() {
  return getAppV1Sheets().ActorSheet || globalThis.ActorSheet;
}

export function getBaseItemSheet() {
  return getAppV1Sheets().ItemSheet || globalThis.ItemSheet;
}

function getActorSheetRegistry() {
  return globalThis.foundry?.documents?.collections?.Actors || globalThis.Actors;
}

function getItemSheetRegistry() {
  return globalThis.foundry?.documents?.collections?.Items || globalThis.Items;
}

export function registerActorSheet(systemId, sheetClass, options = {}) {
  const registry = getActorSheetRegistry();
  const coreSheet = getBaseActorSheet();

  if (!registry?.registerSheet) {
    console.warn("Broken Tales | Actor sheet registry is not available.");
    return;
  }

  if (coreSheet && registry.unregisterSheet) {
    try {
      registry.unregisterSheet("core", coreSheet);
    } catch (error) {
      console.debug("Broken Tales | Core actor sheet was not registered or could not be unregistered.", error);
    }
  }

  registry.registerSheet(systemId, sheetClass, options);
}

export function registerItemSheet(systemId, sheetClass, options = {}) {
  const registry = getItemSheetRegistry();
  const coreSheet = getBaseItemSheet();

  if (!registry?.registerSheet) {
    console.warn("Broken Tales | Item sheet registry is not available.");
    return;
  }

  if (coreSheet && registry.unregisterSheet) {
    try {
      registry.unregisterSheet("core", coreSheet);
    } catch (error) {
      console.debug("Broken Tales | Core item sheet was not registered or could not be unregistered.", error);
    }
  }

  registry.registerSheet(systemId, sheetClass, options);
}

export async function evaluateRoll(roll) {
  const result = roll.evaluate({ async: true });
  if (result instanceof Promise) return result;
  return roll;
}

export function ensureBrokenTalesNamespace(values = {}) {
  const namespace = {
    ...(globalThis.game?.brokentales || {}),
    ...(globalThis.game?.brokenTales || {}),
    ...values,
  };

  if (globalThis.game) {
    globalThis.game.brokentales = namespace;
    globalThis.game.brokenTales = namespace;
  }

  return namespace;
}

export function getControlledOrAssignedActor() {
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor || globalThis.game?.user?.character || null;
}
