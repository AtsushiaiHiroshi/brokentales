# Broken Tales Development References

These references define the implementation baseline for the Broken Tales system and companion modules.

## Foundry VTT

- System development: https://foundryvtt.com/article/system-development/
- Module development: https://foundryvtt.com/article/module-development/
- Publisher handbook: https://foundryvtt.com/article/publisher-handbook/
- Data API: https://foundryvtt.com/api/modules/foundry.data.html
- Document API: https://foundryvtt.com/api/modules/foundry.documents.html
- Foundry V14 ApplicationV2 render hook: https://foundryvtt.com/api/v14/functions/hookEvents.renderApplicationV2.html
- CompendiumCollection reference: https://foundryvtt.wiki/en/development/api/CompendiumCollection

## Web Platform

- HTML select element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select

## Project Rules

- Keep the base system focused on Core Book content.
- Put The Broken Ones and Lost Stories content in their own modules.
- Use Foundry DataModels for Actor and Item system data.
- Use manifest-declared ES modules and stylesheets.
- Keep compendium pack names stable and lower-case.
- Use module/system relationships for content modules that depend on the Broken Tales system.
- Prefer Foundry V14 `renderApplicationV2` hooks for ApplicationV2 UI enhancement instead of fragile direct DOM assumptions.
- Use semantic HTML controls. When a fixed set of options is needed, prefer a native `<select>` over free text.
