#!/usr/bin/env node

/**
 * fix-all-json-files.mjs
 *
 * Normalizes all JSON files in the brokentales system:
 * 1. Converts "data" to "system" (Foundry v10+ standard)
 * 2. Ensures oppositionLevel is NUMBER (not string)
 * 3. Ensures wounds.current starts at 0 (not max - NPCs start alive)
 * 4. Pretty-prints JSON with 2-space indentation
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the system root directory (parent of tools/)
const SYSTEM_ROOT = path.resolve(__dirname, "..");

// Directories to process
const DIRECTORIES_TO_PROCESS = [
  "packs/actors/pre-generated-hunters",
  "packs/actors/pre-generated-npcs/adversaries",
  "packs/actors/pre-generated-npcs/broken-ones",
  "packs/actors/pre-generated-npcs/creatures",
  "packs/actors/pre-generated-npcs/villager",
  "packs/actors/pre-generated-npcs/dark-presences",
  "packs/actors/scenario-gifts",
  "packs/scenarios/one-shot",
  "packs/scenarios/campaign",
];

let filesProcessed = 0;
let filesModified = 0;
let errors = [];

/**
 * Recursively process all JSON files in a directory
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      // Process JSON file
      processJsonFile(fullPath);
    }
  }
}

/**
 * Process a single JSON file
 */
function processJsonFile(filePath) {
  filesProcessed++;

  try {
    // Read file
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    let modified = false;

    // FIX 1: Convert "data" to "system" (Foundry v10+)
    if (data.data && !data.system) {
      data.system = data.data;
      delete data.data;
      modified = true;
      console.log(
        `  ✓ Converted "data" → "system" in: ${path.basename(filePath)}`
      );
    }

    // FIX 2: Ensure oppositionLevel is NUMBER (for NPCs)
    if (data.type === "npc" && data.system) {
      if (typeof data.system.oppositionLevel === "string") {
        // Convert string OL to number
        const olMap = {
          Easy: 3,
          easy: 3,
          Normal: 5,
          normal: 5,
          Medium: 5,
          medium: 5,
          Hard: 7,
          hard: 7,
        };

        const newOL =
          olMap[data.system.oppositionLevel] ||
          parseInt(data.system.oppositionLevel) ||
          5;
        data.system.oppositionLevel = newOL;
        modified = true;
        console.log(
          `  ✓ Fixed oppositionLevel (string → number ${newOL}) in: ${path.basename(
            filePath
          )}`
        );
      }
    }

    // FIX 3: Ensure wounds.current starts at 0 (NPCs start alive, not dead)
    if (
      data.system &&
      data.system.attributes &&
      data.system.attributes.wounds
    ) {
      const wounds = data.system.attributes.wounds;

      // If current wounds equals max wounds, reset to 0 (unless it's intentionally wounded)
      if (wounds.current === wounds.max && wounds.max > 0) {
        wounds.current = 0;
        modified = true;
        console.log(
          `  ✓ Reset wounds.current to 0 (was at max) in: ${path.basename(
            filePath
          )}`
        );
      }

      // Ensure wounds.extra is properly structured
      if (typeof wounds.extra === "number") {
        wounds.extra = { value: wounds.extra, max: 1 };
        modified = true;
        console.log(
          `  ✓ Fixed wounds.extra structure in: ${path.basename(filePath)}`
        );
      }
    }

    // FIX 4: Ensure descriptors is an array
    if (
      data.system &&
      data.system.descriptors &&
      !Array.isArray(data.system.descriptors)
    ) {
      data.system.descriptors = [];
      modified = true;
      console.log(
        `  ✓ Fixed descriptors (not array) in: ${path.basename(filePath)}`
      );
    }

    // FIX 5: Ensure gifts is an array
    if (data.system && data.system.gifts && !Array.isArray(data.system.gifts)) {
      data.system.gifts = [];
      modified = true;
      console.log(`  ✓ Fixed gifts (not array) in: ${path.basename(filePath)}`);
    }

    // Write back if modified
    if (modified) {
      const newContent = JSON.stringify(data, null, 2) + "\n";
      fs.writeFileSync(filePath, newContent, "utf8");
      filesModified++;
      console.log(`  💾 Saved: ${path.basename(filePath)}`);
    }
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(
      `  ❌ Error processing ${path.basename(filePath)}: ${error.message}`
    );
  }
}

/**
 * Main execution
 */
console.log("🔧 Broken Tales JSON Normalization Tool\n");
console.log('Converting "data" → "system" and fixing common issues...\n');

for (const dir of DIRECTORIES_TO_PROCESS) {
  const fullPath = path.join(SYSTEM_ROOT, dir);
  console.log(`📂 Processing: ${dir}`);
  processDirectory(fullPath);
  console.log("");
}

// Summary
console.log("═".repeat(60));
console.log("📊 SUMMARY");
console.log("═".repeat(60));
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log("\n❌ ERRORS:");
  errors.forEach(({ file, error }) => {
    console.log(`  - ${path.basename(file)}: ${error}`);
  });
}

console.log("\n✅ Normalization complete!");
console.log("\nNext steps:");
console.log("  1. Review the changes");
console.log("  2. Run build-compendiums.mjs to generate .db files");
console.log("  3. Test in Foundry VTT\n");
