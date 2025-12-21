// ==============================================
// DIAGNÓSTICO DEL PROBLEMA DE MENÚS - FOUNDRY VTT
// Ejecuta este código en la consola del navegador (F12)
// ==============================================

console.log("=== BROKEN TALES - DIAGNÓSTICO DE MENÚS ===");
console.log("");

// 1. Verificar elementos del sidebar
console.log("1. VERIFICANDO SIDEBAR:");
const sidebar = document.getElementById("sidebar");
if (sidebar) {
  console.log("✅ Sidebar encontrado");
  console.log("   - Display:", getComputedStyle(sidebar).display);
  console.log("   - Visibility:", getComputedStyle(sidebar).visibility);
  console.log("   - Opacity:", getComputedStyle(sidebar).opacity);
  console.log("   - Position:", getComputedStyle(sidebar).position);
  console.log("   - Right:", getComputedStyle(sidebar).right);
  console.log("   - Width:", getComputedStyle(sidebar).width);
  console.log("   - Z-index:", getComputedStyle(sidebar).zIndex);
} else {
  console.error("❌ Sidebar NO encontrado");
}

// 2. Verificar tabs del sidebar
console.log("");
console.log("2. VERIFICANDO SIDEBAR TABS:");
const sidebarTabs = document.getElementById("sidebar-tabs");
if (sidebarTabs) {
  console.log("✅ Sidebar tabs encontrado");
  console.log("   - Display:", getComputedStyle(sidebarTabs).display);
  console.log("   - Visibility:", getComputedStyle(sidebarTabs).visibility);
  console.log(
    "   - Flex-direction:",
    getComputedStyle(sidebarTabs).flexDirection
  );

  const tabs = sidebarTabs.querySelectorAll(".item, a");
  console.log(`   - Número de tabs: ${tabs.length}`);
  tabs.forEach((tab, index) => {
    console.log(
      `     Tab ${index + 1}: ${
        tab.dataset.tab || tab.getAttribute("data-tab")
      } - Display: ${getComputedStyle(tab).display}`
    );
  });
} else {
  console.error("❌ Sidebar tabs NO encontrado");
}

// 3. Verificar contenido de las tabs
console.log("");
console.log("3. VERIFICANDO CONTENIDO DE TABS:");
const tabContents = document.querySelectorAll(
  "#sidebar .tab, #sidebar .sidebar-tab"
);
console.log(`   - Tabs de contenido encontradas: ${tabContents.length}`);
tabContents.forEach((content, index) => {
  const tabName = content.dataset.tab || content.className;
  const display = getComputedStyle(content).display;
  const visibility = getComputedStyle(content).visibility;
  const hasActive = content.classList.contains("active");
  console.log(`     ${index + 1}. ${tabName}:`);
  console.log(`        - Display: ${display}`);
  console.log(`        - Visibility: ${visibility}`);
  console.log(`        - Active: ${hasActive}`);
});

// 4. Verificar hotbar
console.log("");
console.log("4. VERIFICANDO HOTBAR:");
const hotbar = document.getElementById("hotbar");
if (hotbar) {
  console.log("✅ Hotbar encontrado");
  console.log("   - Display:", getComputedStyle(hotbar).display);
  console.log("   - Position:", getComputedStyle(hotbar).position);
  console.log("   - Bottom:", getComputedStyle(hotbar).bottom);
  console.log("   - Left:", getComputedStyle(hotbar).left);
  console.log("   - Z-index:", getComputedStyle(hotbar).zIndex);
} else {
  console.error("❌ Hotbar NO encontrado");
}

// 5. Verificar reglas CSS del sistema
console.log("");
console.log("5. VERIFICANDO CSS DE BROKEN TALES:");
const stylesheets = Array.from(document.styleSheets);
const brokenTalesCSS = stylesheets.find((sheet) => {
  try {
    return sheet.href && sheet.href.includes("brokentales.css");
  } catch (e) {
    return false;
  }
});

if (brokenTalesCSS) {
  console.log("✅ Hoja de estilos brokentales.css encontrada");
  console.log("   - URL:", brokenTalesCSS.href);

  try {
    const rules = Array.from(brokenTalesCSS.cssRules || []);
    const foundryUIRules = rules.filter((rule) => {
      const selector = rule.selectorText || "";
      return (
        selector.includes("#sidebar") ||
        selector.includes("#hotbar") ||
        selector.includes("#ui-") ||
        selector.includes("#controls") ||
        selector.includes("#players") ||
        selector.includes("#navigation")
      );
    });

    if (foundryUIRules.length > 0) {
      console.warn(
        `⚠️ ENCONTRADAS ${foundryUIRules.length} REGLAS CSS AFECTANDO FOUNDRY UI:`
      );
      foundryUIRules.forEach((rule) => {
        console.log(`   - ${rule.selectorText}`);
      });
      console.error(
        "❌ PROBLEMA: El CSS del sistema está interfiriendo con el UI de Foundry"
      );
      console.log(
        "   SOLUCIÓN: Eliminar todas las reglas CSS que afecten elementos de Foundry (#sidebar, #hotbar, etc.)"
      );
    } else {
      console.log("✅ No hay reglas CSS interfiriendo con Foundry UI");
    }
  } catch (e) {
    console.warn("⚠️ No se pudo analizar el CSS (puede ser CORS):", e.message);
  }
} else {
  console.error("❌ Hoja de estilos brokentales.css NO encontrada");
}

// 6. Verificar tab activa
console.log("");
console.log("6. VERIFICANDO TAB ACTIVA:");
const activeTab = document.querySelector(
  "#sidebar .tab.active, #sidebar .sidebar-tab.active"
);
if (activeTab) {
  console.log("✅ Tab activa encontrada");
  console.log("   - ID:", activeTab.id);
  console.log("   - Clases:", activeTab.className);
  console.log("   - Display:", getComputedStyle(activeTab).display);
  console.log("   - Contenido vacío:", activeTab.children.length === 0);
} else {
  console.error("❌ No hay tab activa");
}

// 7. Resumen
console.log("");
console.log("=== RESUMEN ===");
console.log("Si ves:");
console.log(
  "  - ❌ elementos NO encontrados → Foundry no ha cargado correctamente"
);
console.log(
  "  - ⚠️ reglas CSS interfiriendo → El CSS del sistema está causando el problema"
);
console.log("  - Display: none en tabs → CSS está ocultando elementos");
console.log("  - No hay tab activa → Problema de JavaScript o CSS");
console.log("");
console.log("SOLUCIONES:");
console.log("1. Si hay reglas CSS interfiriendo: Eliminar del brokentales.css");
console.log("2. Si no hay tab activa: Hacer clic en una tab del sidebar");
console.log("3. Si todo parece correcto: Limpiar caché (CTRL+SHIFT+R)");
console.log("");
console.log("=== FIN DEL DIAGNÓSTICO ===");
