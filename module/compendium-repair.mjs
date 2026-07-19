const BROKEN_TALES_PACKAGE_PREFIXES = [
  "broken-tales",
  "broken-tales-broken-ones",
  "broken-tales-lost-stories"
];

const SOURCE_ROOTS = {
  "broken-tales": "systems/broken-tales",
  "broken-tales-broken-ones": "modules/broken-tales-broken-ones",
  "broken-tales-lost-stories": "modules/broken-tales-lost-stories"
};

function isBrokenTalesPack(pack) {
  const packageName = pack?.metadata?.packageName ?? pack?.metadata?.package ?? pack?.collection?.split(".")?.[0];
  return BROKEN_TALES_PACKAGE_PREFIXES.includes(packageName);
}

function sourceUrlForPack(pack) {
  const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? pack.collection.split(".")[0];
  const root = SOURCE_ROOTS[packageName];
  const packPath = String(pack.metadata?.path ?? "").replace(/^\.\//, "");
  if (!root || !packPath) return "";
  return `${root}/${packPath}`;
}

async function fetchJsonLines(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const text = await response.text();
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${url}:${index + 1}: ${error.message}`);
      }
    });
}

function documentClassForPack(pack) {
  return CONFIG[pack.documentName]?.documentClass ?? globalThis[pack.documentName];
}

function cleanCompendiumDocumentData(data) {
  const documentData = foundry.utils.deepClone(data);
  documentData.folder = documentData.folder ?? null;
  return documentData;
}

async function indexSize(pack) {
  try {
    const index = await pack.getIndex();
    return index?.size ?? pack.index?.size ?? 0;
  } catch (_error) {
    return pack.index?.size ?? 0;
  }
}

async function replacePackDocuments(pack, sourceDocuments) {
  const documentClass = documentClassForPack(pack);
  if (!documentClass) throw new Error(`No document class for ${pack.documentName}`);

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  try {
    const existing = await pack.getDocuments();
    if (existing.length) {
      await documentClass.deleteDocuments(existing.map((document) => document.id), {
        pack: pack.collection
      });
    }

    const documents = sourceDocuments.map(cleanCompendiumDocumentData);
    if (documents.length) {
      await documentClass.createDocuments(documents, {
        pack: pack.collection,
        keepId: true,
        keepEmbeddedIds: true
      });
    }
    await pack.getIndex({ force: true });
  } finally {
    if (wasLocked) await pack.configure({ locked: true });
  }
}

export async function auditBrokenTalesCompendia() {
  const rows = [];
  for (const pack of game.packs) {
    if (!isBrokenTalesPack(pack)) continue;
    const sourceUrl = sourceUrlForPack(pack);
    let sourceCount = 0;
    let visibleCount = 0;
    let status = "ok";
    let error = "";

    try {
      const sourceDocuments = await fetchJsonLines(sourceUrl);
      sourceCount = sourceDocuments.length;
      visibleCount = await indexSize(pack);
      if (sourceCount && !visibleCount) status = "empty-visible";
      else if (sourceCount !== visibleCount) status = "count-mismatch";
    } catch (caught) {
      status = "error";
      error = caught.message ?? String(caught);
    }

    rows.push({
      pack: pack.collection,
      label: game.i18n.localize(pack.metadata.label ?? pack.title ?? pack.collection),
      documentName: pack.documentName,
      source: sourceUrl,
      sourceCount,
      visibleCount,
      status,
      error
    });
  }
  return rows;
}

export async function repairBrokenTalesCompendia({ force = false, notify = true } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("BROKENTALES.GMOnly"));
    return [];
  }

  const results = [];
  for (const pack of game.packs) {
    if (!isBrokenTalesPack(pack)) continue;

    const source = sourceUrlForPack(pack);
    const result = {
      pack: pack.collection,
      source,
      sourceCount: 0,
      visibleCount: 0,
      repaired: false,
      status: "ok"
    };

    try {
      const sourceDocuments = await fetchJsonLines(source);
      result.sourceCount = sourceDocuments.length;
      result.visibleCount = await indexSize(pack);

      const shouldRepair = sourceDocuments.length > 0
        && (force || result.visibleCount === 0 || result.visibleCount !== sourceDocuments.length);

      if (shouldRepair) {
        await replacePackDocuments(pack, sourceDocuments);
        result.repaired = true;
        result.visibleCount = sourceDocuments.length;
        result.status = "repaired";
      }
    } catch (caught) {
      result.status = "error";
      result.error = caught.message ?? String(caught);
      console.warn(`Broken Tales | Could not repair compendium ${pack.collection}.`, caught);
    }
    results.push(result);
  }

  if (notify) {
    const repaired = results.filter((row) => row.repaired).length;
    const errors = results.filter((row) => row.status === "error").length;
    const message = game.i18n.format("BROKENTALES.CompendiaRepairComplete", { repaired, errors });
    ui.notifications.info(message);
  }
  return results;
}

export async function repairEmptyBrokenTalesCompendia() {
  const audit = await auditBrokenTalesCompendia();
  const needsRepair = audit.some((row) => row.status === "empty-visible");
  if (!needsRepair) return audit;
  await repairBrokenTalesCompendia({ force: false, notify: false });
  return auditBrokenTalesCompendia();
}
