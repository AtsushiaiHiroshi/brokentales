const IMPORT_FLAG = "pregenSlug";
const PREGENS_PATH = "systems/broken-tales/pregens/enriched-pregens.json";
const PREGENS_PACK = "broken-tales.hunters";
const DESCRIPTOR_ICON = "systems/broken-tales/assets/icons/descriptor-improvement.webp";
const GIFT_ICON = "systems/broken-tales/assets/icons/icon-gift.webp";
const CORE_PREGEN_COLLECTIONS = new Set(["Core Book", "Core Book: Fox and Cat"]);

function html(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block) => `<p>${block.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function oneLine(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function looseName(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function activeContentLanguage() {
  const normalize = (value) => String(value ?? "").toLowerCase();
  const resolve = (value) => {
    const normalized = normalize(value);
    if (normalized === "es" || normalized.startsWith("es-") || normalized === "spanish" || normalized === "español") return "es";
    if (normalized === "en" || normalized.startsWith("en-") || normalized === "english" || normalized === "inglés") return "en";
    return "";
  };

  const i18n = resolve(game.i18n?.lang);
  if (i18n) return i18n;

  try {
    const configuredRaw = normalize(game.settings.get("broken-tales", "contentLanguage"));
    const configured = resolve(configuredRaw);
    if (configured && configuredRaw !== "system") return configured;

    const core = resolve(game.settings.get("core", "language"));
    if (core) return core;
  } catch (_error) {
    // Settings can be unavailable during early initialization.
  }

  return "en";
}

function localizePackData(data) {
  const language = activeContentLanguage();
  if (language === "en") return data;

  const translation = data.flags?.["broken-tales"]?.translations?.[language];
  if (!translation) return data;

  if (translation.name) data.name = translation.name;
  if (translation.img) data.img = translation.img;
  if (translation.system) {
    data.system = foundry.utils.mergeObject(data.system ?? {}, translation.system, {
      inplace: false,
      recursive: true
    });
  }
  return data;
}

function packActorData(document) {
  const data = document.toObject();
  delete data._id;
  data.folder = null;
  localizePackData(data);

  for (const item of data.items ?? []) {
    delete item._id;
    item.folder = null;
    localizePackData(item);
  }
  return data;
}

function sourceNote(pregen) {
  return [
    `<p><strong>${html(pregen.collection)}</strong></p>`,
    `<p>${html(pregen.source)}, pages ${html(pregen.pages)}.</p>`
  ].join("");
}

function pregenDescriptors(pregen) {
  const descriptors = (pregen.descriptors ?? []).filter((descriptor) => oneLine(descriptor));
  const story = oneLine(pregen.story);
  if (story && (!descriptors.length || oneLine(descriptors[0]) !== story)) descriptors.unshift(pregen.story);
  return descriptors;
}

function darkEgoDescriptorIndex(pregen, descriptors) {
  if (!pregen.darkEgo || !descriptors.length) return null;
  const gifts = pregen.gifts ?? [];
  return descriptors.length >= gifts.length + 2 ? descriptors.length : null;
}

function embeddedItem(name, type, img, system) {
  return {
    name,
    type,
    img,
    effects: [],
    folder: null,
    flags: {},
    system
  };
}

function actorDataFromPregen(pregen) {
  const actorName = pregen.displayName || pregen.name;
  const slug = slugify(`${pregen.collection}-${actorName}`);
  const source = sourceNote(pregen);
  const items = [];
  const descriptors = pregenDescriptors(pregen);
  const gifts = pregen.gifts ?? [];
  const darkEgo = pregen.darkEgo;
  const darkDescriptorIndex = darkEgoDescriptorIndex(pregen, descriptors);

  descriptors.forEach((descriptor, index) => {
    const descriptorIndex = index + 1;
    if (!oneLine(descriptor)) return;
    items.push(embeddedItem(
      descriptorIndex === darkDescriptorIndex ? "Dark Ego Descriptor" : `Descriptor ${descriptorIndex}`,
      "descriptor",
      DESCRIPTOR_ICON,
      {
        description: html(descriptor),
        notes: `See ${pregen.source}, pages ${pregen.pages}.`,
        positive: oneLine(descriptor),
        negative: "",
        exhausted: false,
        xpMarked: false,
        specialization: false,
        sceneUsed: false
      }
    ));
  });

  gifts.forEach((gift, index) => {
    if (!oneLine(gift?.name) && !oneLine(gift?.description)) return;
    items.push(embeddedItem(
      oneLine(gift.name) || `Gift ${index + 1}`,
      "gift",
      GIFT_ICON,
      {
        description: html(gift.description),
        notes: `See ${pregen.source}, pages ${pregen.pages}.`,
        somaCost: 0,
        automaticSuccesses: 0
      }
    ));
  });

  if (darkEgo && (oneLine(darkEgo.name) || oneLine(darkEgo.description) || oneLine(darkEgo.trigger))) {
    items.push(embeddedItem(
      oneLine(darkEgo.name) || "Dark Ego",
      "darkEgo",
      "icons/svg/terror.svg",
      {
        description: html(darkEgo.description),
        notes: `See ${pregen.source}, pages ${pregen.pages}.`,
        somaCost: 0,
        automaticSuccesses: 0,
        trigger: oneLine(darkEgo.trigger) || "Activator on source sheet."
      }
    ));
  }

  for (const [index, equipment] of String(pregen.equipment ?? "")
    .split(/\s*\/\s*/)
    .map((entry) => oneLine(entry).replace(/[ .]+$/g, ""))
    .filter(Boolean)
    .entries()) {
    items.push(embeddedItem(
      equipment,
      "equipment",
      "icons/svg/item-bag.svg",
      {
        description: html(equipment),
        notes: `See ${pregen.source}, pages ${pregen.pages}.`,
        quantity: 1
      }
    ));
  }

  items.push(embeddedItem(
    "Source Sheet",
    "storyElement",
    "icons/svg/scroll.svg",
    {
      description: source,
      notes: `${pregen.source}, pages ${pregen.pages}`
    }
  ));

  const isSpirit = (pregen.traits ?? []).includes("spirit");
  const actorImg = pregen.img || (isSpirit ? "icons/svg/angel.svg" : "icons/svg/mystery-man.svg");
  return {
    name: actorName,
    type: "hunter",
    img: actorImg,
    items,
    effects: [],
    folder: null,
    flags: {
      "broken-tales": {
        [IMPORT_FLAG]: slug,
        pregenCollection: pregen.collection,
        source: pregen.source,
        pages: pregen.pages
      }
    },
    system: {
      details: {
        concept: pregen.collection,
        origin: actorName,
        role: isSpirit ? "Spirit Hunter" : "Hunter of the Order",
        notes: html(pregen.story) || source
      },
      resources: {
        soma: { value: pregen.soma ?? 5, max: pregen.soma ?? 5 },
        xp: 0,
        wounds: { value: 0, max: 3 },
        darkness: { value: 0, max: 6 }
      },
      opposition: { defaultLevel: 5, modifier: 0 },
      bookmark: { wound1: "", wound2: "", wound3: "", extraWound: "" }
    }
  };
}

function matchesPregenCollection(pregenCollection, collection) {
  if (collection === "all") return true;
  if (collection === "core") return CORE_PREGEN_COLLECTIONS.has(pregenCollection);
  return pregenCollection === collection;
}

async function loadPregenActors(collection = "core") {
  const pack = game.packs.get(PREGENS_PACK);
  if (pack) {
    const documents = await pack.getDocuments();
    return documents
      .filter((document) => {
        const pregenCollection = document.getFlag("broken-tales", "pregenCollection") ?? document.system?.details?.concept;
        return matchesPregenCollection(pregenCollection, collection);
      })
      .map(packActorData);
  }

  const response = await fetch(PREGENS_PATH);
  if (!response.ok) throw new Error(`Could not load ${PREGENS_PATH}`);
  const data = await response.json();
  return (data.actors ?? [])
    .filter((pregen) => matchesPregenCollection(pregen.collection, collection))
    .map(actorDataFromPregen);
}

async function loadPregenRecords(collection = "core") {
  return loadPregenActors(collection);
}

function findExistingPregens(slug, name) {
  const loose = looseName(name);
  return game.actors.filter((actor) => (
    actor.type === "hunter"
    && (
      actor.getFlag("broken-tales", IMPORT_FLAG) === slug
      || actor.name === name
      || actor.system?.details?.origin === name
      || looseName(actor.name) === loose
      || looseName(actor.system?.details?.origin) === loose
    )
  ));
}

function findRepairPregens(slug, name, allNames = []) {
  const canonicalNames = new Set(allNames.map((entry) => looseName(entry)).filter(Boolean));
  canonicalNames.add(looseName(name));
  return game.actors.filter((actor) => {
    if (actor.type !== "hunter") return false;
    const actorSlug = actor.getFlag("broken-tales", IMPORT_FLAG);
    const actorName = looseName(actor.name);
    const actorOrigin = looseName(actor.system?.details?.origin);
    return actorSlug === slug || canonicalNames.has(actorName) || canonicalNames.has(actorOrigin);
  });
}

function hasUsefulPregenContent(actor) {
  return actor.items.some((item) => {
    if (!["descriptor", "gift", "darkEgo", "equipment"].includes(item.type)) return false;
    const name = oneLine(item.name);
    const placeholder = /^(descriptor \d+|don \d+|gift \d+|ego oscuro|dark ego|equipo|equipment)$/i.test(name);
    const text = oneLine(item.system?.description) || oneLine(item.system?.positive) || oneLine(item.system?.trigger);
    return Boolean(text) && !placeholder;
  });
}

export async function importPregens({ collection = "core", overwrite = false } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.Notifications.GMOnly"));
    return [];
  }

  const selected = await loadPregenActors(collection);
  const selectedNames = selected.map((actorData) => actorData.name);
  const created = [];
  const skipped = [];
  const ActorClass = Actor.implementation ?? Actor;

  for (const actorData of selected) {
    const slug = actorData.flags["broken-tales"][IMPORT_FLAG];
    const existing = overwrite
      ? findRepairPregens(slug, actorData.name, selectedNames)
      : findExistingPregens(slug, actorData.name);
    const hasBrokenExisting = existing.some((actor) => !hasUsefulPregenContent(actor));
    const shouldReplace = overwrite || hasBrokenExisting || existing.length > 1;

    if (existing.length && !shouldReplace) {
      skipped.push(...existing);
      continue;
    }

    if (shouldReplace) {
      for (const actor of existing) await actor.delete();
    }

    created.push(await ActorClass.create(actorData));
  }

  ui.notifications.info(game.i18n.format("BROKENTALES.Notifications.PregensImported", {
    created: created.length,
    skipped: skipped.length
  }));
  return created;
}

export async function repairPregens({ collection = "core" } = {}) {
  return importPregens({ collection, overwrite: true });
}

export async function refreshPregenAssets({ collection = "core", notify = true } = {}) {
  if (!game.user.isGM) return { actors: 0, items: 0 };

  const records = await loadPregenRecords(collection);
  let actorUpdates = 0;
  let itemUpdates = 0;

  for (const pregen of records) {
    const actorName = pregen.displayName || pregen.name;
    const slug = pregen.flags?.["broken-tales"]?.[IMPORT_FLAG] ?? slugify(`${pregen.collection}-${actorName}`);
    const img = pregen.img;
    if (!img) continue;

    const actors = findExistingPregens(slug, actorName);
    for (const actor of actors) {
      const genericActorImg = /icons\/svg\/(mystery-man|angel)\.svg/i.test(actor.img ?? "");
      if (genericActorImg || actor.img !== img) {
        await actor.update({ img });
        actorUpdates += 1;
      }

      const embeddedUpdates = [];
      for (const item of actor.items) {
        if (item.type === "descriptor" && item.img !== DESCRIPTOR_ICON) {
          embeddedUpdates.push({ _id: item.id, img: DESCRIPTOR_ICON });
        }
        if (item.type === "gift" && item.img !== GIFT_ICON) {
          embeddedUpdates.push({ _id: item.id, img: GIFT_ICON });
        }
      }
      if (embeddedUpdates.length) {
        await actor.updateEmbeddedDocuments("Item", embeddedUpdates);
        itemUpdates += embeddedUpdates.length;
      }
    }
  }

  if (notify && (actorUpdates || itemUpdates)) {
    ui.notifications.info(`Broken Tales: ${actorUpdates} actor images and ${itemUpdates} item icons refreshed.`);
  }
  return { actors: actorUpdates, items: itemUpdates };
}

export async function createPregenImportMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.ImportPregens");
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/d20.svg",
    command: "await game.brokenTales.importPregens();"
  });
}

export async function createPregenRepairMacro() {
  if (!game.user.isGM) return null;
  const name = game.i18n.localize("BROKENTALES.Macros.RepairPregens");
  const existing = game.macros.find((macro) => macro.name === name);
  if (existing) return existing;
  const MacroClass = Macro.implementation ?? Macro;
  return MacroClass.create({
    name,
    type: "script",
    img: "icons/svg/upgrade.svg",
    command: "await game.brokenTales.repairPregens();"
  });
}
