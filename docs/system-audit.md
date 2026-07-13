# Broken Tales System Audit

Date: 2026-06-15 02:22:43 -06:00

Follow-up: 2026-06-15 02:55 -06:00

Follow-up: 2026-06-15 content cotejo

Follow-up: scenario actor extraction

Follow-up: blood ink title effect

## Scope

This audit checks the local Foundry VTT system files and generated compendium packs after rebuilding the Broken Tales content pipeline.

System path:

`C:\Users\Gamer\AppData\Local\FoundryVTT\Data\systems\broken-tales`

## Rules Confirmed

- Base system content is English.
- Spanish is limited to `lang/es.json` localization unless a Spanish-base rebuild is explicitly requested.
- `Dark Ego` is not a `gift`.
- `Dark Ego` is its own Item document type: `darkEgo`.
- Gifts no longer define or export a `trigger` field.
- Dark Ego items keep `trigger`, `somaCost`, and `automaticSuccesses`.
- Pregenerated Hunters import embedded Descriptors, Gifts, Dark Ego, Equipment, and Source Sheet items.
- Descriptor compendia are split by content class where source material supports it.

## Files Checked

- `system.json`: includes `darkEgo` Item type and declares the new compendium packs.
- `module/models.mjs`: `GiftData` and `DarkEgoData` are separate models.
- `module/system.mjs`: registers `darkEgo` data model and item sheet.
- `module/sheets/actor-sheet.mjs`: supports dropping compendium Items into Actor sheets and finds `darkEgo` items separately from Gifts.
- `module/sheets/item-sheet.mjs`: identifies Dark Ego by item type, not by gift name.
- `templates/actors/hunter-sheet.hbs`: creates Dark Ego items as `darkEgo`.
- `templates/items/item-sheet.hbs`: shows `Trigger` only for `darkEgo`, not for normal Gifts.
- `scripts/generate_enriched_pregens.py`: extracts the English pregenerated sheets and handles Dark Ego text even when PDF extraction orders it before the main heading.
- `scripts/generate_packs.py`: generates English packs, separates Gifts from Dark Egos, and avoids empty placeholder embedded items.
- `scripts/generate_dark_presences.py`: generates Dark Presence actors plus descriptor packs for dark presences and threats.
- `module/pregens.mjs`: now imports pregenerated Hunters directly from the `broken-tales.hunters` compendium, avoiding older duplicated placeholder-building logic.
- `module/content.mjs`: now includes Dark Presence import and repair helpers that clone from `broken-tales.dark-presences`.
- `scripts/generate_adventures.py`: now renders full PDF pages for maps and splits scenario Journals by detected scenes instead of raw page numbers.

## Generated Pack Counts

- `hunters.db`: 47 Actors
- `hunter-gifts.db`: 93 Gift Items
- `hunter-dark-egos.db`: 47 Dark Ego Items
- `hunter-descriptors.db`: 94 Descriptor Items
- `broken-one-descriptors.db`: 34 Descriptor Items
- `hunter-equipment.db`: 268 Equipment Items
- `dark-presences.db`: 28 Threat Actors
- `dark-presence-descriptors.db`: 28 Descriptor Items
- `threat-descriptors.db`: 28 Descriptor Items
- `scenario-actors.db`: 270 Scenario NPC / Threat Actors
- `villager-descriptors.db`: 4 Descriptor reference Items
- `essence-descriptors.db`: 3 Descriptor reference Items
- `library.db`: 21 JournalEntry documents
- `adventures.db`: 27 JournalEntry documents
- `adventure-maps.db`: 30 JournalEntry documents
- `adventure-scenes.db`: 30 Scene documents
- `audit.db`: 1 JournalEntry document
- `support.db`: 6 support Items
- `threats-villagers-essences.db`: 4 reference Actors

## Automated Validation Result

No pack validation problems were found.

Full actor-by-actor cotejo report:

`systems/broken-tales/docs/foundry-content-cotejo.md`

Latest cotejo result: 0 problems.

The latest cotejo includes:

- Pregenerated Hunters
- The Broken Ones pregenerated Hunters
- Dark Presences / Threats
- Scenario NPCs and Threats extracted from adventure sections
- Reference templates, marked separately from extracted official actors

Visual integration:

- Actor and Item sheet titles use a reusable `bt-ink-title` component.
- The global sheet font stack now prefers IM Fell English / Cormorant Garamond with local serif fallbacks.
- Blood-light and black ink tide styling is applied to short text elements: section titles, labels, linked item titles, resource labels, and resource numbers.
- Long editable names receive automatic length classes (`bt-name-long`, `bt-name-very-long`, `bt-name-extreme`) so the blood-ink effect remains active while the text scales down.
- The dice roll button is explicitly excluded from ink blending.
- Long readable body text remains clean: descriptor/gift descriptions, rich text paragraphs, and notes textareas do not receive ink blending.

Checks performed:

- Every Hunter has at least two Descriptors, at least one Gift, and one Dark Ego.
- No Hunter embedded Gift has a `trigger` field.
- Every Hunter Dark Ego has a `trigger` field.
- No Hunter embedded Descriptor, Gift, Dark Ego, or Equipment item has an empty description.
- Every Dark Presence has at least one Descriptor.
- No Dark Presence Gift has a `trigger` field.
- English-base packs checked for Spanish leakage terms: `Cazador`, `Ego oscuro`, `Descriptor de Ego`, `Hoja fuente`, `paginas`, `Equipo`, `Activador`.

## Notes

Villager and Spirit / Essence descriptor packs are reference descriptor packs based on the official sheet fields because the available source sheets do not provide named pregenerated Villager or Essence actors in the same way Hunter sheets do.

Existing Foundry worlds may still contain older imported Actors. To see the rebuilt content, re-open the compendia or import fresh Actors from the rebuilt packs.

For existing test worlds with old empty imports, use these console commands as GM after restarting Foundry:

```js
await game.brokenTales.repairPregens();
await game.brokenTales.repairDarkPresences();
```
