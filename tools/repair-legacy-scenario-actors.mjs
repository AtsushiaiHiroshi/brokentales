#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd());
const backups = process.argv[3] ? path.resolve(process.argv[3]) : "E:/respaldos";

const systemPack = path.join(root, "packs", "scenario-actors.db");
const repoModulePack = path.join(root, "modules", "broken-tales-broken-ones", "packs", "broken-ones-actors.db");
const localModulePack = path.join(root, "..", "..", "modules", "broken-tales-broken-ones", "packs", "broken-ones-actors.db");
const brokenOnesPack = fs.existsSync(repoModulePack) ? repoModulePack : localModulePack;

const sources = [
  "Adversaries 1.db",
  "Villager 1.db",
  "Creatures 1.db",
  "Dark Presences 1.db"
];

const pairs = [
  { oldName: "Andersen - The Commander", pack: systemPack, currentName: "Andersen - The Former Commander", currentType: "threat", concept: "Scenario Adversary", role: "Main NPC" },
  { oldName: "Dr. Norman Henkle - The False Wizard", pack: brokenOnesPack, currentName: "Dr. Norman Henkle - The Powerful Wizard", currentType: "threat", concept: "Legacy Broken One", role: "Main NPC" },
  { oldName: "Adam - The Chatty Servant", pack: systemPack, currentName: "Adam - The Chatty Servant", currentType: "villager", concept: "Scenario Villager", role: "NPC" },
  { oldName: "Erik - The Innocent", pack: systemPack, currentName: "Erik", currentType: "villager", concept: "Scenario Villager", role: "NPC" },
  { oldName: "Satu - The Broken Dancer", pack: systemPack, currentName: "Satu", currentType: "villager", concept: "Scenario Villager", role: "NPC" },
  { oldName: "Dead Pirates - Hook's Crew", pack: systemPack, currentName: "Dead Pirates", currentType: "threat", concept: "Scenario Creature", role: "Creature" },
  { oldName: "Dose the Tin Man - The Giant in Love", pack: systemPack, currentName: "Dose the Giant in Love - The Transformed Tin Man", currentType: "threat", concept: "Scenario Creature", role: "Main NPC" },
  { oldName: "Hirnloser the Scarecrow - The Genius", pack: systemPack, currentName: "Hirnloser the Genius - The Transformed Scarecrow", currentType: "threat", concept: "Scenario Creature", role: "Main NPC" },
  { oldName: "Lowe the Coward - The Brave Fighter", pack: systemPack, currentName: "Lowe the Brave Fighter - The Transformed Coward", currentType: "threat", concept: "Scenario Creature", role: "Main NPC" },
  { oldName: "Sea Fairy - The Compassionate", pack: systemPack, currentName: "Sea Fairy", currentType: "threat", concept: "Scenario Dark Presence", role: "Dark Presence" },
  { oldName: "Azzurra De Baciocchi - The Spirit Who Spurns Death", pack: brokenOnesPack, currentName: "Azzurra De Baciocchi - The Spirit of the Witch", currentType: "threat", concept: "Dark Presence", role: "Dark Presence" }
];

const html = (value = "") => String(value ?? "").startsWith("<")
  ? String(value)
  : `<p>${String(value ?? "").replace(/\n+/g, "</p><p>")}</p>`;

const slug = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const id = (seed) => crypto
  .createHash("sha256")
  .update(String(seed))
  .digest("base64url")
  .replace(/[^A-Za-z0-9]/g, "")
  .slice(0, 16);

const readDb = (file) => fs.existsSync(file)
  ? fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  : [];

const writeDb = (file, docs) => fs.writeFileSync(file, `${docs.map((doc) => JSON.stringify(doc)).join("\n")}\n`, "utf8");

const oldDocs = new Map();
for (const source of sources) {
  for (const doc of readDb(path.join(backups, source))) {
    if (doc?.name) oldDocs.set(doc.name, { source, doc });
  }
}

function giftItem(ownerName, ownerKey, sourceFile, gift, index) {
  const name = typeof gift === "string" ? gift : gift.name;
  const description = typeof gift === "string" ? gift : gift.description;
  return {
    _id: id(`${ownerKey}:gift:${index}:${name}`),
    name: name || `Gift ${index}`,
    type: "gift",
    img: "systems/broken-tales/assets/icons/gift.webp",
    effects: [],
    folder: null,
    flags: {
      "broken-tales": {
        owner: ownerName,
        ownerKey,
        itemKey: `don${index}.${ownerKey}`,
        contentKey: `don${index}.${ownerKey}`,
        sourceBackup: sourceFile
      }
    },
    system: {
      description: html(description),
      notes: `${sourceFile} (legacy structured backup)`,
      key: `don${index}.${ownerKey}`,
      owner: ownerName,
      category: "Scenario Gift",
      source: `${sourceFile} (legacy structured backup)`,
      somaCost: Number(gift?.somaCost ?? 0),
      successes: 0,
      trigger: "",
      exhausted: false,
      sceneUsed: false
    }
  };
}

function descriptorItem(ownerName, ownerKey, sourceFile, text, index, principal = false) {
  const key = principal ? `descriptor-principal.${ownerKey}` : `descriptor${index}.${ownerKey}`;
  return {
    _id: id(`${ownerKey}:descriptor:${index}:${text}`),
    name: principal ? `${ownerName} - Principal Descriptor` : `${ownerName} - Descriptor ${index}`,
    type: "descriptor",
    img: "systems/broken-tales/assets/icons/descriptor-improvement.webp",
    effects: [],
    folder: null,
    flags: {
      "broken-tales": {
        owner: ownerName,
        ownerKey,
        itemKey: key,
        contentKey: key,
        sourceBackup: sourceFile
      }
    },
    system: {
      description: html(text),
      notes: `${sourceFile} (legacy structured backup)`,
      key,
      owner: ownerName,
      category: principal ? "Principal Descriptor" : "Scenario Descriptor",
      source: `${sourceFile} (legacy structured backup)`,
      positive: String(text ?? ""),
      negative: "",
      exhausted: false,
      xpMarked: false,
      specialization: false,
      sceneUsed: false
    }
  };
}

function storyElement(ownerName, ownerKey, sourceFile, label, text) {
  return {
    _id: id(`${ownerKey}:story:${label}`),
    name: label,
    type: "storyElement",
    img: "icons/svg/book.svg",
    effects: [],
    folder: null,
    flags: { "broken-tales": { owner: ownerName, ownerKey, sourceBackup: sourceFile } },
    system: {
      description: html(text),
      notes: `${sourceFile} (legacy structured backup)`,
      key: `story.${slug(label)}`,
      owner: ownerName,
      category: "Legacy Notes",
      source: `${sourceFile} (legacy structured backup)`
    }
  };
}

function convert(pair, oldSource) {
  const { source, doc: oldDoc } = oldSource;
  const sys = oldDoc.system ?? {};
  const ownerName = pair.currentName;
  const ownerKey = slug(ownerName);
  const biography = sys.biography || sys.background || sys.specialNotes || sys.notes || "";
  const notes = sys.notes || sys.specialNotes || "";
  const agenda = Array.isArray(sys.agenda) ? sys.agenda.join("\n") : String(sys.agenda ?? "");
  const descriptors = Array.isArray(sys.descriptors) ? sys.descriptors : [];
  const gifts = Array.isArray(sys.gifts) ? sys.gifts : [];
  const items = [];

  descriptors.forEach((text, index) => items.push(descriptorItem(ownerName, ownerKey, source, text, index + 1, index === 0)));
  gifts.forEach((gift, index) => items.push(giftItem(ownerName, ownerKey, source, gift, index + 1)));
  if (agenda) items.push(storyElement(ownerName, ownerKey, source, "Agenda", agenda));
  if (notes) items.push(storyElement(ownerName, ownerKey, source, "Notes", notes));

  const wounds = sys.attributes?.wounds ?? {};
  const soma = sys.attributes?.soma ?? {};
  const actor = {
    name: ownerName,
    type: pair.currentType,
    img: oldDoc.img || "icons/svg/mystery-man.svg",
    effects: [],
    ownership: { default: 0 },
    prototypeToken: {
      name: ownerName,
      actorLink: true,
      disposition: 0,
      texture: { src: oldDoc.img || "icons/svg/mystery-man.svg" }
    },
    flags: {
      "broken-tales": {
        legacyNames: [pair.oldName, ...(pair.oldName === pair.currentName ? [] : [pair.currentName])],
        ownerKey,
        collection: "Legacy Structured Backup",
        sourceBackup: source,
        npcKind: sys.npcType || pair.currentType
      }
    },
    system: {
      details: {
        concept: pair.concept,
        origin: "Legacy Structured Backup",
        role: pair.role,
        notes: html(biography)
      },
      background: html(biography),
      resources: {
        soma: { value: Number(soma.current ?? 0), max: Number(soma.max ?? 0) },
        xp: 0,
        wounds: { value: Number(wounds.current ?? 0), max: Number(wounds.max ?? 0) },
        darkness: { value: 0, max: 6 }
      },
      bookmark: { wound1: "", wound2: "", wound3: "", extraWound: "" },
      opposition: { defaultLevel: Number(sys.oppositionLevel ?? 0), modifier: 0 },
      threat: {
        rank: Number(sys.oppositionLevel ?? 0) >= 7 ? "hard" : Number(sys.oppositionLevel ?? 0) >= 5 ? "medium" : "easy",
        impulse: agenda.split("\n")[0] || "",
        oppositionLevel: Number(sys.oppositionLevel ?? 0)
      },
      villager: {
        age: "",
        bond: agenda,
        contact: html(biography),
        distinguishingFeatures: html(descriptors[0] ?? "")
      }
    },
    items
  };
  return actor;
}

const touched = [];
for (const pair of pairs) {
  const oldSource = oldDocs.get(pair.oldName);
  if (!oldSource) {
    touched.push({ oldName: pair.oldName, status: "missing-old-source" });
    continue;
  }

  const docs = readDb(pair.pack);
  const replacement = convert(pair, oldSource);
  const existingIndex = docs.findIndex((doc) => doc.name === pair.currentName || doc.name === pair.oldName);
  if (existingIndex >= 0) {
    replacement._id = docs[existingIndex]._id;
    replacement.folder = docs[existingIndex].folder ?? null;
    replacement.sort = docs[existingIndex].sort ?? 0;
    replacement.ownership = docs[existingIndex].ownership ?? replacement.ownership;
    replacement.flags["broken-tales"] = {
      ...(docs[existingIndex].flags?.["broken-tales"] ?? {}),
      ...replacement.flags["broken-tales"]
    };
    docs[existingIndex] = replacement;
    touched.push({ oldName: pair.oldName, currentName: pair.currentName, pack: path.relative(root, pair.pack), status: "replaced" });
  } else {
    replacement._id = id(`${pair.currentName}:actor`);
    docs.push(replacement);
    touched.push({ oldName: pair.oldName, currentName: pair.currentName, pack: path.relative(root, pair.pack), status: "added" });
  }
  writeDb(pair.pack, docs);
}

const auditPath = path.join(root, "audit", "legacy-scenario-actor-repair-0.2.76.json");
fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, JSON.stringify(touched, null, 2), "utf8");
console.log(JSON.stringify(touched, null, 2));
