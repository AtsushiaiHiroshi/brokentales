# Traductor Universal

Traductor para Foundry VTT que permite visualizar la interfaz en español desde su base. El objetivo es traducir no solo Foundry, sino también sistemas, módulos, compendios e importaciones integradas.

Compatible con Foundry VTT v13/v14.

## Funciones
- Español latinoamericano como base (`es-419`).
- Proveedor de idioma `es`, `es-419`, `es-MX` y `es-ES` para que Foundry pueda arrancar directamente en español desde la configuración global.
- Variantes regionales: México, Argentina, Chile, Colombia, Perú y castellano/España.
- Traducción de texto no localizado en interfaces.
- Traducción global de la ventana de Foundry mediante observador dinámico.
- Traducción de diálogos, sidebar, notificaciones, botones, tooltips, placeholders y contenido añadido después de cargar.
- OCR opcional para imágenes, mapas y handouts con superposición de traducción.
- Diccionarios por capa: genérico, Foundry, D&D 5e, PF2e/SF2e, World of Darkness, Broken Tales, Savage Worlds, Cyberpunk RED, Dragonbane, módulos comunes, Plutonium y personalizado.
- Soporte especial para Plutonium/5etools.
- Integración directa con Plutonium/5etools independiente de Babele: ventanas de importación, filtros, botones y documentos importados pasan por diccionarios D&D5e + Plutonium.
- Integración con Babele, `translate-dnd5e-sdr2-es` y `ravanno-dnd5e-es` para aprovechar traducciones de D&D5e ya instaladas.
- Integración ampliada con `ravanno-dnd5e-es`: usa sus archivos Babele de compendio como diccionario de nombres y para traducir campos de documentos importados cuando coinciden con el SRD.
- Diccionario automático desde archivos de idioma de sistemas y módulos activos cuando incluyen inglés y español.
- Editor de diccionario desde configuración con importación/exportación JSON.
- Traductor de compendios que crea un compendio nuevo en el mundo.
- Traducción automática opcional de documentos creados/importados: actores, objetos, journals, escenas, tablas y macros.

## OCR opcional
Para activar el OCR, coloca `tesseract.min.js` en:

```txt
Data/modules/traductor-universal/vendor/tesseract.min.js
```

Después activa **OCR para imágenes y handouts** en la configuración del módulo. El OCR superpone traducciones encima de la imagen y no modifica el archivo original.

## D&D5e y Babele
Para D&D5e se recomienda activar:

- `babele`
- `translate-dnd5e-sdr2-es` para compendios D&D5e SRD 2024.
- `ravanno-dnd5e-es` para interfaz D&D5e y compendios SRD legacy.

`dnd5e-babele-translation-files-generator` no es necesario durante la partida. Sirve como herramienta auxiliar para generar o exportar archivos de traducción Babele desde compendios D&D5e.

## Instalación manual
Copiar la carpeta `traductor-universal` en `Data/modules/` y activar el módulo desde Foundry.

Para que Foundry muestre español desde el arranque, selecciona un idioma de `Traductor Universal` en la configuración global de Foundry, por ejemplo `es-MX.traductor-universal`.
