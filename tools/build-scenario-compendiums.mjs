#!/usr/bin/env node
/**
 * Broken Tales - Scenario Compendium Builder
 *
 * Builds separate compendiums for each scenario/adventure
 * Following the pattern: packs/compendiums/[type]/[scenario-name]/[subtype].db
 *
 * Usage: node build-scenario-compendiums.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("🏗️  Broken Tales Scenario Compendium Builder");
console.log("Building scenario-specific .db files...\n");

const SCENARIOS = [
  "a-soldiers-duty",
  "of-flesh-and-wood",
  "one-thousand-and-one-nightmares",
  "ozena-the-suffering-and-desperate",
  "red-hood-iskra",
  "saint-george-the-dragon-slayer",
  "the-city-of-pigs",
  "the-smile-in-the-darkness",
  "tuvstarrs-reflection",
  "wonderbedlam",
];

const NPC_TYPES = [
  "adversaries",
  "broken-ones",
  "creatures",
  "dark-presences",
  "threats",
  "villager",
];

let totalProcessed = 0;
let totalErrors = 0;
const errors = [];

/**
 * Recursively get all JSON files from a directory
 */
function getJsonFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...getJsonFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate a unique ID for Foundry
 */
function generateId() {
  return "x".repeat(16).replace(/x/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  });
}

/**
 * Build a compendium from JSON files
 */
function buildCompendium(sourceDir, outputPath, type) {
  const jsonFiles = getJsonFiles(sourceDir);

  if (jsonFiles.length === 0) {
    return 0;
  }

  const entries = [];
  let processed = 0;

  for (const filePath of jsonFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);

      // Add _id if not present
      if (!data._id) {
        data._id = generateId();
      }

      // Ensure type is set
      if (!data.type) {
        data.type = type === "Actor" ? "npc" : "item";
      }

      entries.push(JSON.stringify(data));
      processed++;
      totalProcessed++;
    } catch (error) {
      const relativePath = path.relative(ROOT_DIR, filePath);
      console.log(`  ❌ Error in ${path.basename(filePath)}: ${error.message}`);
      errors.push(`${relativePath}: ${error.message}`);
      totalErrors++;
    }
  }

  if (entries.length > 0) {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, entries.join("\n"), "utf8");
  }

  return processed;
}

/**
 * Build compendiums for a single scenario
 */
function buildScenarioCompendiums(scenarioName) {
  console.log(`📦 Building compendiums for: ${scenarioName}`);
  let scenarioTotal = 0;

  // Build NPC compendiums (actors)
  for (const npcType of NPC_TYPES) {
    const sourceDir = path.join(
      ROOT_DIR,
      "packs/actors/pre-generated-npcs",
      npcType,
      scenarioName
    );

    if (fs.existsSync(sourceDir)) {
      const outputPath = path.join(
        ROOT_DIR,
        "packs/compendiums/actors",
        scenarioName,
        `${npcType}.db`
      );

      const count = buildCompendium(sourceDir, outputPath, "Actor");
      if (count > 0) {
        console.log(`  ✅ ${npcType}.db - ${count} entries`);
        scenarioTotal += count;
      }
    }
  }

  // Build scenario gifts compendium (items)
  const giftsSourceDir = path.join(ROOT_DIR, "packs/items", scenarioName);

  if (fs.existsSync(giftsSourceDir)) {
    const giftsOutputPath = path.join(
      ROOT_DIR,
      "packs/compendiums/scenario-gifts",
      scenarioName,
      "scenario-gifts.db"
    );

    const count = buildCompendium(giftsSourceDir, giftsOutputPath, "Item");
    if (count > 0) {
      console.log(`  ✅ scenario-gifts.db - ${count} entries`);
      scenarioTotal += count;
    }
  }

  if (scenarioTotal === 0) {
    console.log(`  ⚠️  No content found for this scenario`);
  }

  console.log("");
  return scenarioTotal;
}

// Build Pre-Generated Hunters (global compendium)
console.log("📦 Building global compendium: Pre-Generated Hunters");
const huntersSource = path.join(ROOT_DIR, "packs/actors/pre-generated-hunters");
const huntersOutput = path.join(
  ROOT_DIR,
  "packs/compendiums/actors/pre-generated-hunters.db"
);
const huntersCount = buildCompendium(huntersSource, huntersOutput, "Actor");
if (huntersCount > 0) {
  console.log(`  ✅ pre-generated-hunters.db - ${huntersCount} entries\n`);
}

// Build scenario-specific compendiums
console.log("Building scenario-specific compendiums...\n");

for (const scenario of SCENARIOS) {
  buildScenarioCompendiums(scenario);
}

// Summary
console.log("═".repeat(60));
console.log("📊 SUMMARY");
console.log("═".repeat(60));
console.log(`Total entries processed: ${totalProcessed}`);
console.log(`Scenarios processed: ${SCENARIOS.length}`);
console.log(`Errors: ${totalErrors}`);

if (errors.length > 0) {
  console.log("\n❌ ERRORS:");
  errors.forEach((error) => {
    console.log(`  - ${error}`);
  });
}

console.log("\n✅ Build complete!");
console.log("\n📁 Compendium structure:");
console.log("  packs/compendiums/");
console.log("  ├── actors/");
console.log("  │   ├── pre-generated-hunters.db");
console.log("  │   └── [scenario-name]/");
console.log("  │       ├── adversaries.db");
console.log("  │       ├── creatures.db");
console.log("  │       ├── dark-presences.db");
console.log("  │       └── ...");
console.log("  └── scenario-gifts/");
console.log("      └── [scenario-name]/");
console.log("          └── scenario-gifts.db");
