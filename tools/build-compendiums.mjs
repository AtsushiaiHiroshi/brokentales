#!/usr/bin/env node
/**
 * Broken Tales - Compendium Builder
 *
 * Converts JSON source files into Foundry VTT .db compendium files
 *
 * Usage: node build-compendiums.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("🏗️  Broken Tales Compendium Builder");
console.log("Building .db files from JSON sources...\n");

// Compendium definitions
const COMPENDIUMS = [
  {
    name: "Pre-Generated Hunters",
    source: "packs/actors/pre-generated-hunters",
    output: "packs/actors/Pre-Generated Hunters.db",
    type: "Actor",
  },
  {
    name: "Adversaries",
    source: "packs/actors/pre-generated-npcs/adversaries",
    output: "packs/actors/Adversaries.db",
    type: "Actor",
  },
  {
    name: "Broken Ones",
    source: "packs/actors/pre-generated-npcs/broken-ones",
    output: "packs/actors/Broken Ones.db",
    type: "Actor",
  },
  {
    name: "Creatures",
    source: "packs/actors/pre-generated-npcs/creatures",
    output: "packs/actors/Creatures.db",
    type: "Actor",
  },
  {
    name: "Villagers",
    source: "packs/actors/pre-generated-npcs/villager",
    output: "packs/actors/Villager.db",
    type: "Actor",
  },
  {
    name: "Dark Presences",
    source: "packs/actors/pre-generated-npcs/dark-presences",
    output: "packs/actors/Dark Presences.db",
    type: "Actor",
  },
  {
    name: "Scenario Gifts",
    source: "packs/actors/scenario-gifts",
    output: "packs/actors/Scenario Gifts.db",
    type: "Item",
  },
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
 * Build a single compendium
 */
function buildCompendium(config) {
  console.log(`📦 Building: ${config.name}`);

  const sourceDir = path.join(ROOT_DIR, config.source);
  const outputPath = path.join(ROOT_DIR, config.output);

  // Get all JSON files from source directory
  const jsonFiles = getJsonFiles(sourceDir);

  if (jsonFiles.length === 0) {
    console.log(`  ⚠️  No JSON files found in ${config.source}`);
    return;
  }

  console.log(`  📄 Found ${jsonFiles.length} files`);

  const entries = [];
  let processed = 0;
  let skipped = 0;

  // Process each JSON file
  for (const filePath of jsonFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);

      // Add _id if not present
      if (!data._id) {
        data._id = generateId();
      }

      // Ensure type is set
      if (!data.type && config.type === "Actor") {
        data.type = "npc";
      } else if (!data.type && config.type === "Item") {
        data.type = "item";
      }

      // Create compendium entry (one line per entry)
      const entry = JSON.stringify(data);
      entries.push(entry);
      processed++;
      totalProcessed++;
    } catch (error) {
      const relativePath = path.relative(ROOT_DIR, filePath);
      console.log(`  ❌ Error in ${path.basename(filePath)}: ${error.message}`);
      errors.push(`${relativePath}: ${error.message}`);
      skipped++;
      totalErrors++;
    }
  }

  // Write .db file (each entry on its own line)
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const dbContent = entries.join("\n");
    fs.writeFileSync(outputPath, dbContent, "utf8");

    console.log(
      `  ✅ Created ${path.basename(outputPath)} with ${processed} entries`
    );
    if (skipped > 0) {
      console.log(`  ⚠️  Skipped ${skipped} files due to errors`);
    }
  } catch (error) {
    console.log(
      `  ❌ Failed to write ${path.basename(outputPath)}: ${error.message}`
    );
    errors.push(`${config.name}: Failed to write output - ${error.message}`);
    totalErrors++;
  }

  console.log("");
}

// Build all compendiums
console.log("Building compendiums...\n");

for (const config of COMPENDIUMS) {
  buildCompendium(config);
}

// Summary
console.log("═".repeat(60));
console.log("📊 SUMMARY");
console.log("═".repeat(60));
console.log(`Entries processed: ${totalProcessed}`);
console.log(`Compendiums built: ${COMPENDIUMS.length}`);
console.log(`Errors: ${totalErrors}`);

if (errors.length > 0) {
  console.log("\n❌ ERRORS:");
  errors.forEach((error) => {
    console.log(`  - ${error}`);
  });
}

console.log("\n✅ Build complete!");
console.log("\nNext steps:");
console.log("  1. Copy the system folder to Foundry Data/systems/");
console.log("  2. Restart Foundry VTT");
console.log("  3. Create a world using the Broken Tales system");
console.log("  4. Open compendiums to verify actors loaded correctly");
