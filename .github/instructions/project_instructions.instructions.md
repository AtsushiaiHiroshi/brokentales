# Broken Tales - Foundry VTT System Development

## 🎯 Project Overview

You are working on **Broken Tales**, a dark fairy tale RPG system for Foundry VTT v11-13. The system uses a Powered by the Apocalypse (PbtA) inspired mechanic with d6 pools, difficulty checks, and a resource called "Soma" representing willpower and supernatural power.

---

## 📚 **MANDATORY REFERENCE DOCUMENTATION**

### **Foundry Virtual Tabletop**

- **[Foundry VTT API Documentation](https://foundryvtt.com/api/)**: Documentación oficial completa de la API
- **[Foundry VTT Knowledge Base](https://foundryvtt.com/kb/)**: Guías oficiales de desarrollo de sistemas y módulos:
  - https://foundryvtt.com/article/intro-development/
  - https://foundryvtt.com/article/module-development/
  - https://foundryvtt.com/article/module-sub-types/
  - https://foundryvtt.com/article/system-data-models/
  - https://foundryvtt.com/article/system-development/
  - https://foundryvtt.com/article/localization/
  - https://foundryvtt.com/article/asset-management/
  - https://foundryvtt.com/article/migration/
  - https://foundryvtt.com/article/frameworks/
    - https://handlebarsjs.com/guide/
    - https://jquery.com/ / https://api.jquery.com/
    - https://pixijs.com/8.x/guides/getting-started/intro
    - https://gsap.com/docs/v3/

### **Estándares Web**

- **[MDN Web Docs](https://developer.mozilla.org/)**: Referencia autorizada para HTML5, CSS3 y JavaScript

### **Mejores Prácticas**

- **[Programming Best Practices](https://github.com/dereknguyen269/programing-best-practices)**: Guía de buenas prácticas de programación

**ALL CODE MUST FOLLOW THESE REFERENCES. NO EXCEPTIONS.**

---

## 📂 Project Structure

```
brokentales/
├── module/
│   ├── brokentales.mjs          # Main entry point
│   ├── documents/
│   │   ├── actor.mjs            # Actor document class
│   │   └── item.mjs             # Item document class
│   ├── sheets/
│   │   ├── actor-sheet.mjs      # Actor sheet UI
│   │   └── item-sheet.mjs       # Item sheet UI
│   ├── helpers/
│   │   ├── config.mjs           # System constants & Handlebars helpers
│   │   ├── settings.mjs         # System settings registration
│   │   └── templates.mjs        # Template preloader
│   └── macros/
│       ├── roll.js              # Base roll system
│       ├── soma.js              # Soma spending rolls
│       ├── darknessEgo.js       # Dark Ego activation
│       └── reroll.js            # Repeat last roll
├── templates/
│   ├── actor/
│   │   ├── character-sheet.html # Hunter character sheet
│   │   ├── npc-sheet.html       # NPC sheet
│   │   └── parts/               # Partial templates
│   └── item/
│       ├── descriptor.html      # Descriptor item sheet
│       └── gift.html            # Gift item sheet
├── styles/
│   └── brokentales.css          # System styles
├── lang/
│   ├── en.json                  # English translations
│   └── es.json                  # Spanish translations
├── packs/                        # Compendium packs (.db files)
├── actors/                       # Actor JSON files (source)
├── items/                        # Item JSON files (source)
├── tools/                        # Build scripts
│   ├── fix-all-json-files.mjs   # Normalize JSON files
│   └── build-compendiums.mjs    # Generate .db packs
├── system.json                   # System manifest
└── template.json                 # Data structure template
```

---

## 🎲 Core Game Mechanics

### Roll System

- **Dice Pool**: Roll Xd6, successes on 2+
- **Critical Failure**: Rolling a 1 negates ALL successes
- **Difficulties**: Easy (2), Normal (3), Hard (5), Very Hard (7)
- **Soma Boost**: Spend Soma for +1 success per Soma spent

### Actor Types

1. **Character** (Hunter):

   - Soma: 6 max (supernatural resource)
   - Wounds: 3 max + 1 extra wound
   - XP, Descriptors, Gifts, Dark Ego

2. **NPC**:

   - Types: villager, creature, adversary, broken_one, threat, object, obstacle
   - Opposition Level (OL): 3 (Easy), 5 (Normal), 7 (Hard) **MUST BE NUMBER**
   - Soma: variable (0 for most)
   - Wounds: 1-4 depending on importance

### Item Types

- **Descriptor**: Narrative traits/abilities
- **Gift**: Mechanical powers with Soma costs
- **Scenario Gift**: Special gifts tied to specific scenarios

---

## ⚠️ CRITICAL RULES - ALWAYS FOLLOW

### 1. Data Structure (Foundry VTT API Standard)

```javascript
// ✅ CORRECT - Use "system" (Foundry v10+)
actor.system.attributes.soma.current;
actor.system.attributes.wounds.current;
actor.system.descriptors;
actor.system.gifts;

// ❌ WRONG - Never use "data" (deprecated)
actor.data.attributes; // FORBIDDEN
```

**Reference**: [Foundry VTT Data Architecture](https://foundryvtt.com/api/classes/foundry.abstract.DataModel.html)

---

### 2. Opposition Level (Type Safety)

```javascript
// ✅ CORRECT - Must be NUMBER
systemData.oppositionLevel = 5; // Normal
systemData.oppositionLevel = 3; // Easy
systemData.oppositionLevel = 7; // Hard

// ❌ WRONG - Never string
systemData.oppositionLevel = "Normal"; // FORBIDDEN
```

**Reference**: [Type Safety Best Practices](https://github.com/dereknguyen269/programing-best-practices#type-safety)

---

### 3. Critical Failure Logic (Game Mechanic)

```javascript
// ✅ CORRECT - Check critical FIRST
const hasCriticalFailure = results.includes(1);
const successes = hasCriticalFailure
  ? 0 // Negates ALL successes
  : results.filter((r) => r >= 2).length;

// ❌ WRONG - Calculating successes before checking critical
const successes = results.filter((r) => r >= 2).length; // WRONG ORDER
const criticalFailure = results.includes(1); // TOO LATE
```

**Reference**: Game design document - Critical failures negate all successes

---

### 4. Wounds Initialization (Game State)

```javascript
// ✅ CORRECT - NPCs start with 0 wounds (alive and healthy)
wounds: {
  current: 0,  // Always 0 at creation
  max: 1,
  extra: { value: 0, max: 1 }
}

// ❌ WRONG - Starting with max wounds means instant death
wounds: { current: 3, max: 3 }  // FORBIDDEN - Character would be dead
```

**Reference**: Game rules - `current` wounds represent damage taken

---

### 5. ES6 Modules Only (Modern JavaScript - MDN)

```javascript
// ✅ CORRECT - ES6 Modules
import { BrokenTalesActor } from "./documents/actor.mjs";
export class BrokenTalesActorSheet extends ActorSheet {}

// ❌ WRONG - No CommonJS
const actor = require("./actor.js"); // FORBIDDEN - Not ES6
```

**Reference**: [MDN - JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

---

## 🛠️ Common Tasks

### Creating New Actor JSON

```javascript
{
  "name": "Character Name",
  "type": "character", // or "npc"
  "system": {  // NOT "data" - Foundry v10+ standard
    "attributes": {
      "soma": { "current": 6, "max": 6 },
      "wounds": { "current": 0, "max": 3, "extra": { "value": 0, "max": 1 } }
    },
    "descriptors": [],
    "gifts": [],
    "conditions": []
  }
}
```

**Reference**: [Foundry System Data Templates](https://foundryvtt.com/article/system-data-models/)

---

### Creating NPC

```javascript
{
  "name": "NPC Name",
  "type": "npc",
  "system": {
    "npcType": "adversary",
    "oppositionLevel": 5,  // NUMBER not string - type safety
    "isMainNPC": true,     // true for 2+ wounds
    "attributes": {
      "soma": { "current": 0, "max": 0 },
      "wounds": { "current": 0, "max": 3, "extra": { "value": 0, "max": 1 } }
    }
  }
}
```

---

### Roll Function Pattern

```javascript
/**
 * Roll dice with difficulty check
 * @param {number} diceCount - Number of d6 to roll
 * @param {number} difficulty - Target success count
 * @param {number} somaBonus - Additional successes from Soma
 * @returns {Promise<Object>} Roll result with outcome
 */
async function rollWithDifficulty(diceCount, difficulty, somaBonus = 0) {
  const roll = new Roll(`${diceCount}d6`);
  await roll.evaluate({ async: true });
  const results = roll.dice[0].results.map((r) => r.result);

  // CRITICAL: Check failure FIRST (game mechanic)
  const hasCriticalFailure = results.includes(1);
  const baseSuccesses = hasCriticalFailure
    ? 0
    : results.filter((r) => r >= 2).length;
  const totalSuccesses = baseSuccesses + somaBonus;

  // Determine outcome based on total vs difficulty
  return {
    roll,
    results,
    hasCriticalFailure,
    baseSuccesses,
    totalSuccesses,
    success: totalSuccesses >= difficulty,
  };
}
```

**References**:

- [MDN - Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Foundry Roll Class](https://foundryvtt.com/api/classes/client.Roll.html)

---

## 🔍 Code Quality Standards

### Anti-Patterns (FORBIDDEN - Best Practices Guide)

```javascript
// ❌ Never use var (ES6: const/let)
var x = 1; // FORBIDDEN

// ❌ Never use == or != (type coercion issues)
if (x == "1") {
} // FORBIDDEN - use ===

// ❌ Never use eval or Function constructor (security)
eval(code); // FORBIDDEN - XSS vulnerability
new Function(code); // FORBIDDEN

// ❌ Never use innerHTML without sanitization (XSS)
element.innerHTML = userInput; // FORBIDDEN

// ❌ Never use console.log in production
console.log("debug"); // FORBIDDEN - use proper logging

// ❌ Never hardcode paths (portability)
const path = "C:/Users/..."; // FORBIDDEN - use relative paths

// ❌ Never ignore errors (debugging nightmare)
try {
  code;
} catch (e) {} // FORBIDDEN - must handle errors
```

**Reference**: [Programming Best Practices - Anti-patterns](https://github.com/dereknguyen269/programing-best-practices#anti-patterns)

---

### Required Patterns (Best Practices Guide)

```javascript
// ✅ Use const/let (ES6 - MDN)
const x = 1;
let y = 2;

// ✅ Use === and !== (type safety)
if (x === 1) {
}

// ✅ Use foundry.utils for object operations (Foundry API)
const merged = foundry.utils.mergeObject(obj1, obj2);
const copy = foundry.utils.duplicate(obj);

// ✅ Always handle async/await properly (error handling)
try {
  const result = await asyncFunction();
} catch (error) {
  console.error("Broken Tales | Error:", error);
  ui.notifications.error(game.i18n.localize("BROKENTALES.Error.Generic"));
}

// ✅ Use i18n for all user-facing text (localization)
game.i18n.localize("BROKENTALES.Roll.Success");
game.i18n.format("BROKENTALES.Roll.Difficulty", { difficulty: 5 });
```

**References**:

- [MDN - const/let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [MDN - Strict Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality)
- [Foundry Utils API](https://foundryvtt.com/api/modules/foundry.utils.html)
- [Foundry Localization](https://foundryvtt.com/article/localization/)

---

## 📦 Compendium Workflow

### 1. Edit Source JSONs

```bash
# Edit files in actors/*.json or items/*.json
```

### 2. Normalize Data

```bash
cd tools
node fix-all-json-files.mjs
# Converts data→system, fixes OL to number, normalizes wounds to 0
```

### 3. Build Packs

```bash
node build-compendiums.mjs
# Generates .db files in packs/ directory
```

### 4. Verify in Foundry

- Restart Foundry VTT
- Check compendiums load without errors
- Test actor/item imports
- Verify console for warnings

**Reference**: [Foundry Compendium Development](https://foundryvtt.com/article/compendium/)

---

## 🎨 UI/UX Guidelines

### Chat Cards

- Use gothic dark theme (red/black)
- Include emoji icons (🎲 for rolls, ⚡ for Dark Ego)
- Clear outcome indicators (color-coded)
- Show dice breakdown and modifiers

### Actor Sheets

- Gothic aesthetic with GrobeDeutschmeister font
- Red (#cc0000) for emphasis colors
- Black background with texture overlays
- Clear stat displays with circles/decorative boxes

### Handlebars Templates

```handlebars
{{!-- Always use partials for reusable components --}}
{{> "systems/brokentales/templates/actor/parts/actor-features.html"}}

{{!-- Always localize text --}}
<label>{{localize "BROKENTALES.Fields.Soma"}}</label>

{{!-- Handle missing data gracefully --}}
{{#if system.attributes}}
  <input value="{{system.attributes.soma.current}}" />
{{else}}
  <span>{{localize "BROKENTALES.Error.MissingData"}}</span>
{{/if}}

{{!-- Use #each for lists --}}
{{#each system.descriptors as |descriptor index|}}
  <div class="descriptor">{{descriptor}}</div>
{{/each}}
```

**Reference**: [MDN - Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

---

## 🐛 Debugging Checklist

When investigating errors:

### 1. Check Console (F12)

```javascript
// All logs prefixed for filtering
console.log("Broken Tales | System initialized");
console.error("Broken Tales | Error:", error);
```

### 2. Verify Data Structure

```javascript
// ALWAYS use .system, never .data
console.log("Actor system:", actor.system);
console.log("Soma:", actor.system.attributes.soma.current);
```

### 3. Check Opposition Level Type

```javascript
const ol = actor.system.oppositionLevel;
console.log("OL value:", ol, "Type:", typeof ol);
// Should log: "OL value: 5 Type: number"
```

### 4. Verify Wounds State

```javascript
const wounds = actor.system.attributes.wounds;
console.log("Wounds - current:", wounds.current, "max:", wounds.max);
// New actors should show: "Wounds - current: 0 max: 3"
```

### 5. Test Critical Failure Logic

```javascript
const results = [1, 4, 5]; // Contains critical failure
const hasCrit = results.includes(1);
const successes = hasCrit ? 0 : results.filter((r) => r >= 2).length;
console.log("Has crit:", hasCrit, "Successes:", successes);
// Should log: "Has crit: true Successes: 0"
```

**Reference**: [MDN - Console API](https://developer.mozilla.org/en-US/docs/Web/API/Console)

---

## 📚 Reference Documentation Quick Links

### Foundry VTT Core API

- **Documents**: [`Actor`](https://foundryvtt.com/api/classes/client.Actor.html), [`Item`](https://foundryvtt.com/api/classes/client.Item.html), [`ChatMessage`](https://foundryvtt.com/api/classes/client.ChatMessage.html)
- **Applications**: [`ActorSheet`](https://foundryvtt.com/api/classes/client.ActorSheet.html), [`ItemSheet`](https://foundryvtt.com/api/classes/client.ItemSheet.html), [`Dialog`](https://foundryvtt.com/api/classes/client.Dialog.html)
- **Utilities**: [`foundry.utils`](https://foundryvtt.com/api/modules/foundry.utils.html), [`Roll`](https://foundryvtt.com/api/classes/client.Roll.html), [`game.i18n`](https://foundryvtt.com/api/classes/client.Localization.html)

### MDN Web Standards

- **JavaScript**: [const/let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const), [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- **HTML**: [Forms](https://developer.mozilla.org/en-US/docs/Learn/Forms), [Semantic elements](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantic_elements)
- **CSS**: [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout), [Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout), [Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

### System Namespaces

```javascript
// Global system namespace
game.brokentales.rollWithDifficulty(actor, diceCount, difficulty, somaBonus);
game.brokentales.showRollDialog(actor);
game.brokentales.repeatLastRoll();

// Configuration
CONFIG.BROKENTALES.difficulties = { easy: 2, normal: 3, hard: 5 };
CONFIG.BROKENTALES.npcTypes = [
  "villager",
  "creature",
  "adversary",
  "broken_one",
];
```

### Translation Keys Pattern

```
BROKENTALES.Roll.Title              → "Broken Tales Roll"
BROKENTALES.Roll.CriticalFailure    → "Critical Failure!"
BROKENTALES.Roll.Success            → "Success"
BROKENTALES.Fields.Soma             → "Soma"
BROKENTALES.Fields.Wounds           → "Wounds"
BROKENTALES.Error.Generic           → "An error occurred"
```

---

## 🎯 Development Priorities

### Current Sprint Goals

1. ✅ Fix actor-sheet.mjs duplication
2. ✅ Correct Opposition Level to NUMBER type
3. ✅ Fix Critical Failure logic (check before counting)
4. ✅ Update all macros to use `.system` instead of `.data`
5. ⏳ Generate all compendium packs (.db files)
6. ⏳ Test Red-Hood Iskra scenario end-to-end

### Known Issues

- [ ] Legacy `.js` files need cleanup (after verification)
- [ ] Some NPCs may still have string OL in old JSONs
- [ ] Compendiums need regeneration after fixes

### Future Enhancements

- [ ] Automated XP tracking system
- [ ] Interlude mechanics (between-session rules)
- [ ] Active Effects integration for conditions
- [ ] Macro hotbar integration for Gifts
- [ ] Dice So Nice module integration

---

## ⚡ Quick Commands Reference

```bash
# Fix all JSON files (normalize structure)
cd tools && node fix-all-json-files.mjs

# Build compendium database files
cd tools && node build-compendiums.mjs

# Test in Foundry VTT
# 1. Copy system folder to: [Foundry Data]/Data/systems/brokentales/
# 2. Restart Foundry VTT server
# 3. Create new test world with Broken Tales system
# 4. Open browser console (F12) and verify no errors
```

---

## 🔒 Security Notes (Best Practices)

- **Never** use `eval()` or `Function()` constructor - [Security Risk](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!)
- **Always** sanitize HTML before inserting - [XSS Prevention](https://developer.mozilla.org/en-US/docs/Web/Security/Types_of_attacks#cross-site_scripting_xss)
- **Validate** all user input on forms - [Input Validation](https://github.com/dereknguyen269/programing-best-practices#input-validation)
- **Use** CSP-safe inline styles only
- **Restrict** external scripts to `cdnjs.cloudflare.com` only

**Reference**: [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 📊 Success Metrics

A well-functioning system should:

- ✅ Load without console errors or warnings
- ✅ Actor sheets render correctly with all fields
- ✅ Rolls work with proper critical failure mechanic
- ✅ Soma spending decrements automatically
- ✅ NPCs have numeric Opposition Level (not string)
- ✅ All 67+ JSON files normalized to `system` structure
- ✅ 4+ compendium packs load successfully
- ✅ Chat messages display with gothic theme
- ✅ i18n works for both English and Spanish
- ✅ No deprecated API usage warnings

---

## 📖 Study Materials

### Essential Reading Order

1. **[Foundry System Development Tutorial](https://foundryvtt.com/article/system-development/)** - Start here
2. **[MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)** - Core language
3. **[Programming Best Practices](https://github.com/dereknguyen269/programing-best-practices)** - Code quality
4. **[Foundry API Reference](https://foundryvtt.com/api/)** - Detailed API docs

### Code Review Checklist

Before committing code, verify:

- [ ] Uses `const`/`let`, never `var`
- [ ] Uses `===`/`!==`, never `==`/`!=`
- [ ] All strings localized with `game.i18n`
- [ ] Errors handled with try-catch
- [ ] No `console.log` in production code
- [ ] Follows Foundry API conventions
- [ ] No deprecated API usage
- [ ] Code documented with JSDoc comments
- [ ] Tested in Foundry VTT v11-13

---

**Version:** 1.2.0
**Last Updated:** December 2024
**Foundry Compatibility:** v11 - v13
**Status:** Production Ready
**License:** Proprietary (Broken Tales © The World Anvil Publishing)

---

## 🆘 Getting Help

1. **Console Errors**: Check browser console (F12) for error messages
2. **API Questions**: Search [Foundry VTT API Docs](https://foundryvtt.com/api/)
3. **JavaScript Issues**: Reference [MDN Web Docs](https://developer.mozilla.org/)
4. **Best Practices**: Review [Programming Best Practices Guide](https://github.com/dereknguyen269/programing-best-practices)
5. **System Issues**: Check this document's debugging section

**Remember**: Every line of code should follow the three reference sources. No exceptions.
