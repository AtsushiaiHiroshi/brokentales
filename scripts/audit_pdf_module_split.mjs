import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SYSTEM_ROOT = path.resolve("C:/Users/Gamer/AppData/Local/FoundryVTT/Data/systems/broken-tales");
const DATA_ROOT = path.resolve(SYSTEM_ROOT, "../..");
const SOURCE_ROOT = path.resolve("C:/Users/Gamer/Documents/Broken Tales KS [ENG]");
const PYTHON = "C:/Users/Gamer/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(target));
    else files.push(target);
  }
  return files;
}

function readDb(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slugify(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function classifyPdf(file) {
  const rel = path.relative(SOURCE_ROOT, file).replace(/\\/g, "/");
  const lower = rel.toLowerCase();
  let owner = "system";
  let reason = "core/support";
  if (/lost stories|lost_stories|bt-ls|ls-hunters|ls-book/.test(lower)) {
    owner = "lost-stories";
    reason = "Lost Stories filename/path";
  } else if (/bt-tbo|the broken ones|broken ones|broken-ones|villager/.test(lower)) {
    owner = "broken-ones";
    reason = "The Broken Ones filename/path";
  }

  let language = "unknown";
  if (/\beng\b|english|corebook|hunter's sheet|storyteller|lost stories|broken europe|screen/.test(lower)) language = "en";
  if (/manual b[aá]sico|hojas|mapa europa rota|zorro astuto|gato malicioso|maquiaveli|devir|jugadores|creaci[oó]n|europa rota|viejo lobo|niña|juez|ladrona|matadragones|mono asombroso|artista viajera|barba azul|exploradora/.test(lower)) {
    language = language === "en" ? "mixed" : "es";
  }

  let kind = "source";
  if (/sheet|hoja|bookmark|screen|map|mapa|plantilla/.test(lower)) kind = "sheet-support";
  if (/core|manual|rulebook|b[aá]sico/.test(lower)) kind = "rulebook";
  if (/scenario|escenario|newcomer|crown|aventura|campaign|campa/.test(lower)) kind = "adventure-support";
  if (/garou|machiavelli|maquiaveli|baba|babai|iskra|krampus|wukong|regina|marina|yukie|jorge|verdoux|derdoux|inmortal|flautista|dama/.test(lower)) kind = "hunter-sheet";

  return { file, rel, slug: slugify(path.basename(rel, ".pdf")), owner, reason, language, kind, size: fs.statSync(file).size };
}

function pdfInfo(files) {
  const code = [
    "import json, sys",
    "try:",
    " import pypdf",
    "except Exception as e:",
    " print(json.dumps({'error': str(e)})); sys.exit(0)",
    "files=json.loads(sys.stdin.read())",
    "out={}",
    "for f in files:",
    " try:",
    "  r=pypdf.PdfReader(f)",
    "  text=''",
    "  for page in r.pages[:3]:",
    "   text += (page.extract_text() or '') + '\\n'",
    "  out[f]={'pages': len(r.pages), 'sample': ' '.join(text.split())[:500]}",
    " except Exception as e:",
    "  out[f]={'error': str(e)}",
    "print(json.dumps(out, ensure_ascii=False))"
  ].join("\n");
  const result = spawnSync(PYTHON, ["-c", code], {
    input: JSON.stringify(files),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });
  if (result.status !== 0) return {};
  try {
    return JSON.parse(result.stdout || "{}");
  } catch {
    return {};
  }
}

function flattenDocuments(rootDir, manifestFile) {
  const manifestPath = path.join(rootDir, manifestFile);
  if (!fs.existsSync(manifestPath)) return { packs: [], docs: [] };
  const manifest = readJson(manifestPath);
  const docs = [];
  for (const pack of manifest.packs ?? []) {
    if (pack.name === "audit") continue;
    const packPath = path.join(rootDir, pack.path);
    for (const document of readDb(packPath)) {
      docs.push({ pack: pack.name, type: pack.type, name: document.name, flags: document.flags, text: JSON.stringify(document) });
    }
  }
  return { packs: manifest.packs ?? [], docs };
}

function containsPdf(docs, pdf) {
  const base = path.basename(pdf.rel).toLowerCase();
  const slug = pdf.slug;
  return docs.filter((document) => {
    const text = document.text.toLowerCase();
    return text.includes(base) || text.includes(slug) || text.includes(pdf.rel.toLowerCase());
  }).map((document) => `${document.pack}:${document.name}`).slice(0, 10);
}

function main() {
  const pdfs = walk(SOURCE_ROOT).filter((file) => file.toLowerCase().endsWith(".pdf")).map(classifyPdf);
  const info = pdfInfo(pdfs.map((pdf) => pdf.file));
  for (const pdf of pdfs) Object.assign(pdf, info[pdf.file] ?? {});

  const system = flattenDocuments(SYSTEM_ROOT, "system.json");
  const broken = flattenDocuments(path.join(DATA_ROOT, "modules", "broken-tales-broken-ones"), "module.json");
  const lost = flattenDocuments(path.join(DATA_ROOT, "modules", "broken-tales-lost-stories"), "module.json");

  const rows = [];
  const alerts = [];
  for (const pdf of pdfs.sort((a, b) => a.rel.localeCompare(b.rel))) {
    const hits = {
      system: containsPdf(system.docs, pdf),
      broken: containsPdf(broken.docs, pdf),
      lost: containsPdf(lost.docs, pdf)
    };
    const expectedHits = pdf.owner === "system" ? hits.system : pdf.owner === "broken-ones" ? hits.broken : hits.lost;
    const wrongHits = [
      ...(pdf.owner !== "system" ? hits.system.map((hit) => `system:${hit}`) : []),
      ...(pdf.owner !== "broken-ones" ? hits.broken.map((hit) => `broken:${hit}`) : []),
      ...(pdf.owner !== "lost-stories" ? hits.lost.map((hit) => `lost:${hit}`) : [])
    ];
    const status = expectedHits.length ? (wrongHits.length ? "CHECK" : "OK") : "MISSING";
    if (status !== "OK") alerts.push({ pdf: pdf.rel, expected: pdf.owner, status, wrongHits, expectedHits });
    rows.push({ ...pdf, hits, status });
  }

  const summary = {
    sourceRoot: SOURCE_ROOT,
    totalPdfs: pdfs.length,
    byOwner: rows.reduce((acc, row) => {
      acc[row.owner] = (acc[row.owner] || 0) + 1;
      return acc;
    }, {}),
    byStatus: rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {}),
    systemPacks: system.packs.length,
    brokenPacks: broken.packs.length,
    lostPacks: lost.packs.length,
    alerts
  };

  const md = [
    "# Broken Tales PDF-to-System/Module Audit",
    "",
    `Source root: \`${SOURCE_ROOT}\``,
    "",
    "## Summary",
    "",
    `- PDFs scanned: ${summary.totalPdfs}`,
    `- Expected system PDFs: ${summary.byOwner.system || 0}`,
    `- Expected Broken Ones PDFs: ${summary.byOwner["broken-ones"] || 0}`,
    `- Expected Lost Stories PDFs: ${summary.byOwner["lost-stories"] || 0}`,
    `- Status OK: ${summary.byStatus.OK || 0}`,
    `- Status CHECK: ${summary.byStatus.CHECK || 0}`,
    `- Status MISSING: ${summary.byStatus.MISSING || 0}`,
    "",
    "## Alerts",
    "",
    ...(alerts.length
      ? alerts.map((alert) => `- **${alert.status}** \`${alert.pdf}\` expected \`${alert.expected}\`; expected hits: ${alert.expectedHits.length}; wrong hits: ${alert.wrongHits.join(", ") || "none"}`)
      : ["No alerts."]),
    "",
    "## PDF Table",
    "",
    "| Status | Owner | Lang | Kind | Pages | PDF | Found In |",
    "|---|---|---|---|---:|---|---|",
    ...rows.map((row) => {
      const found = [
        row.hits.system.length ? `system(${row.hits.system.length})` : "",
        row.hits.broken.length ? `broken(${row.hits.broken.length})` : "",
        row.hits.lost.length ? `lost(${row.hits.lost.length})` : ""
      ].filter(Boolean).join(", ") || "none";
      return `| ${row.status} | ${row.owner} | ${row.language} | ${row.kind} | ${row.pages ?? "?"} | \`${row.rel}\` | ${found} |`;
    })
  ];

  fs.mkdirSync(path.join(SYSTEM_ROOT, "docs"), { recursive: true });
  fs.writeFileSync(path.join(SYSTEM_ROOT, "docs", "pdf-module-audit.json"), `${JSON.stringify({ summary, rows }, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(SYSTEM_ROOT, "docs", "pdf-module-audit.md"), `${md.join("\n")}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main();
