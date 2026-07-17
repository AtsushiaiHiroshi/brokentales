# Broken Tales for Foundry VTT

Sistema comunitario no oficial para Foundry VTT V13/V14.

## Incluye

- Actor types: `hunter`, `npc`, `threat`, `villager`, `essence`.
- Item types: `descriptor`, `gift`, `equipment`, `condition`, `wound`, `storyElement`.
- DataModels modernos para Actors e Items.
- Hojas basadas en `ActorSheetV2` e `ItemSheetV2`.
- Prueba de posicion / Defensa con:
  - Descriptor relevante: 3 exitos basicos.
  - Sin descriptor relevante: 1 exito basico.
  - Nivel de Oposicion base.
  - Modificador narrativo.
  - Soma gastado.
  - Exitos por Dones.
  - Dados de riesgo d6.
  - Un resultado de 1 en dados de riesgo anula la prueba.
- Chat card con resultado:
  - Fracaso.
  - Triunfo con coste.
  - Triunfo.
- Triunfo con incremento.
- PX.
- Punto de libro para Heridas narrativas.
- Actor type `villager` para The Broken Ones / The Village.
- Actor type `essence` para espiritus, esencias, almas, virtudes o entidades incorporeas.

## Compendios

El sistema declara compendios visibles al crear o abrir un mundo con Broken Tales:

- `Broken Tales - Cazadores pregenerados`
- `Broken Tales - Amenazas, aldeanos y esencias`
- `Broken Tales - Dones, objetos y apoyo`
- `Broken Tales - Dones de Cazador`
- `Broken Tales - Equipo de Cazadores`
- `Broken Tales - Presencias oscuras`
- `Broken Tales - Biblioteca completa`
- `Broken Tales - Aventuras y escenarios`
- `Broken Tales - Mapas y recursos visuales`
- `Broken Tales - Escenas de mapas`
- `Broken Tales - Auditoria de contenido`

Los compendios se generan desde:

- `pregens/pregens.json`
- `content/library.json`
- `assets/source-pdfs`

Para regenerarlos despues de cambiar contenido fuente:

```powershell
python scripts/generate_packs.py
```

Para volver a extraer texto real de hojas pregeneradas:

```powershell
python scripts/generate_enriched_pregens.py
```

Para regenerar Presencias oscuras:

```powershell
python scripts/generate_dark_presences.py
```

Para regenerar aventuras, mapas extraidos y escenas:

```powershell
python scripts/generate_adventures.py
```

## Importadores opcionales

El contenido principal vive en compendios. Si aun quieres copiar documentos desde los compendios/datos locales al mundo como Actors, Items o Journals editables, estas funciones siguen disponibles desde consola o macro de GM.

En una macro de GM puedes ejecutar:

```js
await game.brokenTales.importPregens();
```

Tambien puedes crear una macro automaticamente con:

```js
await game.brokenTales.createPregenImportMacro();
```

Los Actors se crean con nombre, Soma, fuente y placeholders de Descriptores/Dones para rellenar desde los PDFs locales.

## Biblioteca local completa

El sistema incluye una biblioteca privada generada desde los PDFs locales de la mesa. Los libros, hojas, mapas y apoyos estan en el compendio de Journals, con texto extraido por pagina y enlace al PDF copiado dentro del sistema.

En una macro de GM puedes ejecutar:

```js
await game.brokenTales.importLibrary();
```

Tambien puedes crear una macro automaticamente con:

```js
await game.brokenTales.createLibraryImportMacro();
```

## Dones de escenario, objetos y apoyo

El sistema crea Items de apoyo para localizar rapidamente Dones de escenario, objetos/equipamiento, Tesoro de la Orden, aldeanos, mapa y espiritus/esencias. Para importarlos manualmente:

```js
await game.brokenTales.importSupportItems();
```

Para crear la macro:

```js
await game.brokenTales.createSupportImportMacro();
```

Tambien crea actores de referencia para Amenaza, PNJ, Aldeano y Espiritu / Esencia:

```js
await game.brokenTales.importReferenceActors();
```

Para regenerar la biblioteca desde los PDFs originales:

```powershell
python scripts/generate_library.py
```

## Nota de contenido

Esta instalacion local incluye texto y PDFs extraidos de archivos que posee la mesa. No redistribuyas esta carpeta del sistema si contiene `content/library.json` o `assets/source-pdfs`.

## Investigacion de reglas

La especificacion de elementos corroborados para adaptar el sistema con mas fidelidad esta en:

`docs/rules-research.md`

## Foundry VTT Installation

Install the system from this manifest URL:

`https://raw.githubusercontent.com/AtsushiaiHiroshi/brokentales/main/system.json`

Optional content modules:

- The Broken Ones: `https://raw.githubusercontent.com/AtsushiaiHiroshi/brokentales/main/modules/broken-tales-broken-ones/module.json`
- Lost Stories: `https://raw.githubusercontent.com/AtsushiaiHiroshi/brokentales/main/modules/broken-tales-lost-stories/module.json`

The public install packages intentionally exclude local source PDFs, private audio, and very large source-map assets. The local development copy may contain those files for personal reference.

