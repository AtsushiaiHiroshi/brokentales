#!/usr/bin/env node
/**
 * Broken Tales - Items Compendium Builder
 *
 * Compiles JSON files from packs/items/[scenario]/
 * into .db files in packs/compendiums/items/[scenario].db
 *
 * This handles physical objects and clues for each adventure.
 * Scenario Gifts are handled by build-scenario-compendiums.mjs separately.
 *
 * Usage: node build-items-compendiums.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("📦 Broken Tales Items Compendium Builder");
console.log("Compiling items from packs/items/ → packs/compendiums/items/\n");

const SCENARIOS = [
  "red-hood-iskra",
  "ozena-the-suffering-and-desperate",
  "wonderbedlam",
  "the-city-of-pigs",
  "the-smile-in-the-darkness",
  "tuvstarrs-reflection",
  "of-flesh-and-wood",
  "saint-george-the-dragon-slayer",
  "one-thousand-and-one-nightmares",
  "a-soldiers-duty",
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
 * Build a single compendium from JSON sources
 */
function buildCompendium(sourceDir, outputPath, type) {
  const jsonFiles = getJsonFiles(sourceDir);

  if (jsonFiles.length === 0) {
    return 0;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const entries = [];

  for (const jsonFile of jsonFiles) {
    try {
      const content = fs.readFileSync(jsonFile, "utf8");
      const data = JSON.parse(content);

      // Ensure required fields
      if (!data.name) {
        errors.push(`Missing 'name' field in: ${jsonFile}`);
        totalErrors++;
        continue;
      }

      // Create Foundry document structure
      const entry = {
        _id: data._id || generateId(),
        name: data.name,
        type: data.type || "object", // Default to object if not specified
        img: data.img || "icons/svg/item-bag.svg",
        system: data.system || {},
        flags: data.flags || {},
        effects: data.effects || [],
        folder: data.folder || null,
        sort: data.sort || 0,
        ownership: data.ownership || { default: 0 },
      };

      entries.push(entry);
      totalProcessed++;
    } catch (error) {
      errors.push(`Error processing ${jsonFile}: ${error.message}`);
      totalErrors++;
    }
  }

  // Write to .db file (newline-delimited JSON)
  const dbContent = entries.map((entry) => JSON.stringify(entry)).join("\n");
  fs.writeFileSync(outputPath, dbContent + "\n", "utf8");

  return entries.length;
}

/**
 * Main build process
 */
console.log("🏗️  Building items compendiums for all scenarios...\n");

for (const scenario of SCENARIOS) {
  const scenarioName = scenario
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  console.log(`📁 ${scenarioName}`);

  const sourceDir = path.join(ROOT_DIR, "packs/items", scenario);
  const outputPath = path.join(
    ROOT_DIR,
    "packs/compendiums/items",
    `${scenario}.db`
  );

  if (!fs.existsSync(sourceDir)) {
    console.log(`  ⚠️  Source directory not found: ${sourceDir}`);
    console.log("");
    continue;
  }

  const count = buildCompendium(sourceDir, outputPath, "Item");

  if (count > 0) {
    console.log(`  ✅ ${scenario}.db - ${count} items compiled`);
  } else {
    console.log(`  ⚠️  No items found in source directory`);
  }

  console.log("");
}

// Summary
console.log("━".repeat(50));
console.log("\n📊 Build Summary:");
console.log(`  ✅ Total items processed: ${totalProcessed}`);
console.log(`  ❌ Total errors: ${totalErrors}`);

if (errors.length > 0) {
  console.log("\n⚠️  Errors encountered:");
  errors.forEach((error) => console.log(`  - ${error}`));
}

console.log("\n✨ Items compilation complete!");
console.log("\n💡 Next steps:");
console.log("  1. Restart Foundry VTT");
console.log("  2. Compendiums will load from packs/compendiums/items/");
console.log("  3. Edit JSON sources in packs/items/ and re-run this script\n");
