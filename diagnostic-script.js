/* ================================================
   DIAGNOSTIC SCRIPT - Paste in Browser Console
   ================================================
   
   Instructions:
   1. Open Foundry VTT with your world
   2. Press F12 to open Developer Tools
   3. Go to "Console" tab
   4. Paste this ENTIRE script
   5. Press Enter
   6. Copy ALL the output and share it
   
   ================================================ */

console.log("╔════════════════════════════════════════╗");
console.log("║  BROKEN TALES - UI DIAGNOSTIC SCRIPT  ║");
console.log("╚════════════════════════════════════════╝");
console.log("");

// 1. Foundry Version Info
console.log("📌 FOUNDRY VERSION:");
console.log("  Version:", game.version || "N/A");
console.log("  Build:", game.data?.version || "N/A");
console.log("");

// 2. System Info
console.log("📌 SYSTEM INFO:");
console.log("  ID:", game.system?.id || "N/A");
console.log("  Title:", game.system?.title || "N/A");
console.log("  Version:", game.system?.version || "N/A");
console.log("");

// 3. Active Modules
console.log("📌 ACTIVE MODULES:");
const activeModules = game.modules.filter((m) => m.active);
if (activeModules.size === 0) {
  console.log("  ✅ No modules active (Safe Configuration)");
} else {
  console.log(`  ⚠️ ${activeModules.size} modules active:`);
  activeModules.forEach((m) => console.log(`     - ${m.id} (${m.version})`));
}
console.log("");

// 4. Content Count
console.log("📌 CONTENT COUNT:");
console.log("  Scenes:", game.scenes?.size || 0);
console.log("  Actors:", game.actors?.size || 0);
console.log("  Items:", game.items?.size || 0);
console.log("  Journal Entries:", game.journal?.size || 0);
console.log("  Playlists:", game.playlists?.size || 0);
console.log("");

// 5. User Info
console.log("📌 USER INFO:");
console.log("  Name:", game.user?.name || "N/A");
console.log("  Role:", game.user?.role || "N/A");
console.log("  Is GM:", game.user?.isGM || false);
console.log("");

// 6. Sidebar Elements Check
console.log("📌 SIDEBAR ELEMENTS:");
const sidebar = document.querySelector("#sidebar");
console.log("  Sidebar exists:", !!sidebar);

const directories = {
  scenes: document.querySelector("#scenes"),
  actors: document.querySelector("#actors"),
  items: document.querySelector("#items"),
  journal: document.querySelector("#journal"),
  tables: document.querySelector("#tables"),
  cards: document.querySelector("#cards"),
  playlists: document.querySelector("#playlists"),
  compendium: document.querySelector("#compendium"),
};

Object.entries(directories).forEach(([name, elem]) => {
  console.log(`  ${name}:`, !!elem);
  if (elem) {
    const entries = elem.querySelectorAll(".directory-item");
    console.log(`    └─ Entries found: ${entries.length}`);
  }
});
console.log("");

// 7. CSS Files Loaded
console.log("📌 CSS FILES LOADED:");
const stylesheets = Array.from(document.styleSheets);
const brokenTalesCSS = stylesheets.filter(
  (s) => s.href && s.href.includes("brokentales")
);

if (brokenTalesCSS.length > 0) {
  console.log("  ✅ Broken Tales CSS found:");
  brokenTalesCSS.forEach((s) => console.log(`     - ${s.href}`));
} else {
  console.log("  ⚠️ Broken Tales CSS NOT found");
}
console.log("");

// 8. Console Errors Check
console.log("📌 RECENT CONSOLE ERRORS:");
const errors = window.performance
  .getEntries()
  .filter(
    (e) =>
      e.entryType === "resource" &&
      (e.name.includes("404") || e.transferSize === 0)
  );

if (errors.length > 0) {
  console.log("  ⚠️ Failed resources:");
  errors.slice(0, 5).forEach((e) => console.log(`     - ${e.name}`));
} else {
  console.log("  ✅ No 404 errors detected");
}
console.log("");

// 9. Rendering Check
console.log("📌 RENDERING CHECK:");
console.log("  WebGL Available:", !!window.WebGLRenderingContext);
console.log("  Canvas Rendering:", !!canvas);
console.log("  Canvas Ready:", canvas?.ready || false);
console.log("");

// 10. Sidebar Visibility
console.log("📌 SIDEBAR VISIBILITY:");
if (sidebar) {
  const styles = window.getComputedStyle(sidebar);
  console.log("  Display:", styles.display);
  console.log("  Visibility:", styles.visibility);
  console.log("  Opacity:", styles.opacity);
  console.log("  Width:", styles.width);
  console.log("  Height:", styles.height);
}
console.log("");

// 11. Directory State
console.log("📌 ACTORS DIRECTORY STATE:");
const actorsDir = ui.actors;
if (actorsDir) {
  console.log("  UI Object exists:", true);
  console.log("  Rendered:", actorsDir.rendered);
  console.log("  Element:", !!actorsDir.element);
  console.log("  Documents:", actorsDir.documents?.length || 0);
} else {
  console.log("  ⚠️ Actors directory UI not found");
}
console.log("");

// 12. Summary
console.log("╔════════════════════════════════════════╗");
console.log("║          DIAGNOSTIC SUMMARY            ║");
console.log("╚════════════════════════════════════════╝");

const issues = [];

if (activeModules.size > 0) {
  issues.push(
    `⚠️ ${activeModules.size} modules active - Try Safe Configuration`
  );
}

if (game.scenes?.size === 0 && game.actors?.size === 0) {
  issues.push("ℹ️ No content in world - Directories may appear empty");
}

if (!game.user?.isGM) {
  issues.push("⚠️ User is not GM - Limited permissions");
}

if (!brokenTalesCSS.length) {
  issues.push("⚠️ System CSS not loaded - Check system.json");
}

if (errors.length > 0) {
  issues.push(`⚠️ ${errors.length} failed resource loads - Check paths`);
}

if (issues.length === 0) {
  console.log("✅ No obvious issues detected");
  console.log("");
  console.log("Next steps:");
  console.log("1. Try creating content (Scene, Actor, Item)");
  console.log("2. Try Safe Configuration if not already active");
  console.log("3. Clear browser cache (Ctrl+Shift+Delete)");
} else {
  console.log("Issues detected:");
  issues.forEach((issue) => console.log(`  ${issue}`));
}

console.log("");
console.log("════════════════════════════════════════");
console.log("Please copy ALL output above and share");
console.log("════════════════════════════════════════");
