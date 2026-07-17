import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(await fs.readFile(path.join(systemRoot, "system.json"), "utf8"));
const require = createRequire(import.meta.url);
const { ClassicLevel } = await loadClassicLevel();

const requested = new Set(process.argv.slice(2));
const selectedPacks = manifest.packs.filter((pack) => !requested.size || requested.has(pack.name));

async function loadClassicLevel() {
  try {
    return await import("classic-level");
  } catch {
    return require("C:/Program Files/Foundry Virtual Tabletop/resources/app/node_modules/classic-level");
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJsonl(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text.trim() ? text.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)) : [];
}

function documentCollection(doc) {
  if (doc.prototypeToken || Array.isArray(doc.items)) return "actors";
  if (doc.pages !== undefined) return "journal";
  if (doc.grid !== undefined || doc.background !== undefined || doc.tokens !== undefined) return "scenes";
  if (doc.system !== undefined || doc.type !== undefined) return "items";
  return "documents";
}

async function writeLevelPack(targetDir, docs) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const db = new ClassicLevel(targetDir, { valueEncoding: "utf8" });
  await db.open();
  const batch = [];

  for (const original of docs) {
    const doc = clone(original);
    const collection = documentCollection(doc);

    if (collection === "actors") {
      const items = Array.isArray(doc.items) ? doc.items.map(clone) : [];
      doc.items = items.map((item) => item._id);
      batch.push({ type: "put", key: `!actors!${doc._id}`, value: JSON.stringify(doc) });
      for (const item of items) {
        batch.push({ type: "put", key: `!actors.items!${doc._id}.${item._id}`, value: JSON.stringify(item) });
      }
      continue;
    }

    if (collection === "journal") {
      const pages = Array.isArray(doc.pages) ? doc.pages.map(clone) : [];
      doc.pages = pages.map((page) => page._id);
      batch.push({ type: "put", key: `!journal!${doc._id}`, value: JSON.stringify(doc) });
      for (const page of pages) {
        batch.push({ type: "put", key: `!journal.pages!${doc._id}.${page._id}`, value: JSON.stringify(page) });
      }
      continue;
    }

    if (collection === "scenes") {
      batch.push({ type: "put", key: `!scenes!${doc._id}`, value: JSON.stringify(doc) });
      continue;
    }

    if (collection === "items") {
      batch.push({ type: "put", key: `!items!${doc._id}`, value: JSON.stringify(doc) });
      continue;
    }

    batch.push({ type: "put", key: `!documents!${doc._id}`, value: JSON.stringify(doc) });
  }

  if (batch.length) await db.batch(batch);
  await db.close();
  return batch.length;
}

async function syncPack(pack, timestamp) {
  const sourcePath = path.join(systemRoot, pack.path);
  const docs = await readJsonl(sourcePath);
  const packRoot = path.join(systemRoot, "packs");
  const destinations = new Set([pack.name, path.basename(pack.path, ".db")]);
  const results = [];

  for (const destinationName of destinations) {
    const destination = path.join(packRoot, destinationName);
    const backupRoot = path.join(packRoot, `_backup-leveldb-${timestamp}`);

    if (await exists(destination)) {
      await fs.mkdir(backupRoot, { recursive: true });
      await fs.rename(destination, path.join(backupRoot, destinationName));
    }

    const records = await writeLevelPack(destination, docs);
    results.push(`${destinationName}: ${docs.length} docs, ${records} records`);
  }

  return results;
}

if (!selectedPacks.length) {
  console.error(`No matching packs: ${Array.from(requested).join(", ")}`);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
for (const pack of selectedPacks) {
  try {
    const results = await syncPack(pack, timestamp);
    console.log(`${pack.name}: ${results.join("; ")}`);
  } catch (error) {
    console.error(`${pack.name}: ${error.message}`);
    process.exitCode = 1;
  }
}
