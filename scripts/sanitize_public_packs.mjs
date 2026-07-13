import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const manifests = [
  { rel: "system.json", base: "" },
  { rel: "modules/broken-tales-broken-ones/module.json", base: "modules/broken-tales-broken-ones" },
  { rel: "modules/broken-tales-lost-stories/module.json", base: "modules/broken-tales-lost-stories" }
];

const omittedNote =
  '<p class="bt-public-asset-note"><em>Visual resource omitted from the public GitHub package. Use the full local package to restore this map or handout image.</em></p>';

function sanitizeString(value) {
  return value
    .replace(/<img\b[^>]*\bsrc=["'](?:systems\/broken-tales|modules\/broken-tales(?:-[^/]+)?)\/assets\/adventures\/maps\/[^"']+["'][^>]*>/gi, omittedNote)
    .replace(/(?:systems\/broken-tales|modules\/broken-tales(?:-[^/]+)?)\/assets\/source-pdfs\/[^\s"'<>\\)]+/g, "#source-pdf-omitted")
    .replace(/(?:systems\/broken-tales|modules\/broken-tales(?:-[^/]+)?)\/assets\/audio\/[^\s"'<>\\)]+/g, "#audio-omitted")
    .replace(/(?:systems\/broken-tales|modules\/broken-tales(?:-[^/]+)?)\/assets\/adventures\/maps\/[^\s"'<>\\)]+/g, "#map-image-omitted");
}

function sanitizeValue(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeValue(child)]));
  }
  return value;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(repoRoot, file), "utf8"));
}

async function sanitizePack(packPath) {
  const absolute = path.join(repoRoot, packPath);
  let source;
  try {
    source = await fs.readFile(absolute, "utf8");
  } catch {
    return { packPath, documents: 0, changed: 0, missing: true };
  }

  const lines = source.split(/\r?\n/).filter(Boolean);
  let changed = 0;
  const nextLines = lines.map((line) => {
    const doc = JSON.parse(line);
    const sanitized = sanitizeValue(doc);
    const next = JSON.stringify(sanitized);
    if (next !== line) changed += 1;
    return next;
  });

  if (changed) await fs.writeFile(absolute, `${nextLines.join("\n")}\n`, "utf8");
  return { packPath, documents: lines.length, changed };
}

const results = [];

for (const manifestInfo of manifests) {
  const manifest = await readJson(manifestInfo.rel);
  for (const pack of manifest.packs ?? []) {
    const packPath = path.posix.join(manifestInfo.base, pack.path).replace(/\\/g, "/");
    results.push(await sanitizePack(packPath));
  }
}

console.log(JSON.stringify(results.filter((result) => result.changed || result.missing), null, 2));
