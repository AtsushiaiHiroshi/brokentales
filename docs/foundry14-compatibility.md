# Foundry VTT 14 Compatibility Notes

This branch keeps the legacy Broken Tales system line alive instead of replacing it with the newer local `broken-tales` system.

## Preservation rules

- Keep the system id as `brokentales` so older worlds continue to resolve the system.
- Keep the existing actor and item document types for this legacy line: `character`, `npc`, `descriptor`, `gift`, `scenarioGift`, `clue`, and `object`.
- Keep the existing compendium paths and pack names so worlds and references do not break.
- Do not overwrite this line with the newer `broken-tales` data model without an explicit migration layer.

## Compatibility work added

- `module/helpers/compat.mjs` centralizes Foundry-version-sensitive helpers.
- Both historical namespace spellings are exposed: `game.brokentales` and `game.brokenTales`.
- Sheet registration is routed through compatibility wrappers.
- Legacy `foundry.appv1.sheets.ActorSheet` and `ItemSheet` access is aliased when Foundry exposes the older globals differently.
- Roll evaluation is wrapped for code paths touched in the bootstrap macros.
- `system.json` no longer caps compatibility at Foundry 13 and now declares verification for Foundry 14.

## Next migration steps

- Audit `module/documents/actor.mjs` and `module/documents/item.mjs` for remaining direct Foundry API calls.
- Test sheet registration in Foundry 11, 13, and 14.
- Preserve the compendium-heavy legacy packs, then selectively backport cleaner content extraction and importer repair logic from the newer local system.
- Add a dedicated migration script only if we decide to support opening newer `broken-tales` data inside this legacy `brokentales` line.
