# Resumen de Cambios - Sistema de Tipos de Actores

**Fecha:** 17 de diciembre de 2025
**Autor:** Atsushiai Hiroshi

---

## ✅ Cambios Implementados

### 1. Estructura de Carpetas

✅ **Creada carpeta:** `packs/compendiums/actors/threats/`

- Para almacenar NPCs de tipo "threat" (amenazas ambientales)

### 2. Actualización de system.json

✅ **Añadido compendio "threats"** en la sección `packs`:

```json
{
  "name": "threats",
  "label": "Threats",
  "path": "packs/compendiums/actors/threats",
  "type": "Actor",
  "system": "brokentales"
}
```

✅ **Actualizado packFolders** para incluir "threats" en la organización:

```json
"packs": ["adversaries", "broken-ones", "creatures", "threats", "villagers"]
```

### 3. Documentación Creada

✅ **Archivo de referencia completo:** `.github/instructions/actor_types_reference.md`

- Definición de 2 tipos de actores (character, npc)
- Explicación de 3 categorías de NPCs (Minor, Main, Dark Presence)
- Detalle de 7 subtipos de NPCs (villager, creature, adversary, broken_one, threat, object, obstacle)
- Niveles de oposición (3, 5, 7)
- Estructura de carpetas
- Ejemplos de uso
- Buenas prácticas
- Guía de conversión desde texto

✅ **README.md actualizado** con sección detallada sobre tipos de NPCs

---

## 📊 Tipos de Actores Identificados

### Tipos Principales (template.json)

1. **character** - Cazador (Hunter)
2. **npc** - Personaje No Jugador

### Categorías de NPCs (Manual)

1. **Minor NPC** - 1-3 Heridas (generalmente 1)
2. **Main NPC** - 1-6 Heridas (generalmente 3)
3. **Dark Presence** - 1-6 Heridas (generalmente 3)

### Subtipos de NPCs (config.mjs)

1. **villager** - Aldeano
2. **creature** - Criatura
3. **adversary** - Adversario
4. **broken_one** - Corrompido
5. **threat** - Amenaza ⭐ (recién añadido al sistema)
6. **object** - Objeto (definido pero no implementado)
7. **obstacle** - Obstáculo (definido pero no implementado)

---

## 🗂️ Compendios por Tipo

| Tipo        | Compendio             | Ubicación                                         | Estado       |
| ----------- | --------------------- | ------------------------------------------------- | ------------ |
| character   | pre-generated-hunters | `packs/compendiums/actors/pre-generated-hunters/` | ✅ Existe    |
| npc (mixto) | pre-generated-npcs    | `packs/compendiums/actors/pre-generated-npcs/`    | ✅ Existe    |
| adversary   | adversaries           | `packs/compendiums/actors/adversaries/`           | ✅ Existe    |
| broken_one  | broken-ones           | `packs/compendiums/actors/broken-ones/`           | ✅ Existe    |
| creature    | creatures             | `packs/compendiums/actors/creatures/`             | ✅ Existe    |
| threat      | threats               | `packs/compendiums/actors/threats/`               | ✅ **NUEVO** |
| villager    | villagers             | `packs/compendiums/actors/villagers/`             | ✅ Existe    |
| object      | -                     | -                                                 | ⏳ Pendiente |
| obstacle    | -                     | -                                                 | ⏳ Pendiente |

---

## 🎯 Configuración Validada

### ✅ Config.mjs

Todos los tipos definidos correctamente:

```javascript
BROKENTALES.npcTypes = {
  villager: "BROKENTALES.Fields.Villager",
  creature: "BROKENTALES.Fields.Creature",
  adversary: "BROKENTALES.Fields.Adversary",
  broken_one: "BROKENTALES.Fields.broken_one",
  threat: "BROKENTALES.Fields.ThreatType",
  object: "BROKENTALES.Fields.Object",
  obstacle: "BROKENTALES.Fields.Obstacle",
};
```

### ✅ Traducciones (lang/en.json y lang/es.json)

Todas las traducciones presentes:

- Villager / Aldeano ✅
- Creature / Criatura ✅
- Adversary / Adversario ✅
- broken_one / Corrompido ✅
- ThreatType / Amenaza ✅
- Object / Objeto ✅
- Obstacle / Obstáculo ✅

---

## 🔍 Inconsistencias Detectadas y Resueltas

### ❌ Antes

- Carpeta `packs/actors/pre-generated-npcs/threats/` existía pero NO estaba registrada en system.json
- No había documentación clara sobre los tipos de actores
- README no explicaba la diferencia entre tipos de NPCs

### ✅ Después

- Compendio "threats" registrado en system.json ✅
- Documentación completa en `.github/instructions/actor_types_reference.md` ✅
- README actualizado con información detallada ✅
- Estructura de carpetas coherente con system.json ✅

---

## 📝 Próximos Pasos Sugeridos

### Corto Plazo

1. ⏳ Poblar el compendio `threats/` con amenazas de los escenarios extraídos
2. ⏳ Verificar que todos los NPCs existentes tengan el `npcType` correcto
3. ⏳ Crear plantillas de ejemplo para cada tipo de NPC

### Medio Plazo

4. ⏳ Implementar compendios para `object` y `obstacle` si se necesitan
5. ⏳ Añadir campo `category` explícito (Minor/Main/Dark Presence) en template.json
6. ⏳ Crear helper para auto-calcular heridas según categoría

### Largo Plazo

7. ⏳ Sistema de tags para búsqueda avanzada en compendios
8. ⏳ Tracking de origen de NPCs (de qué escenario vienen)
9. ⏳ Generador automático de NPCs según tipo

---

## 🎨 Ejemplos de NPCs por Tipo

### Villager (Aldeano)

```json
{
  "name": "Lorenzo Scannapecore",
  "type": "npc",
  "system": {
    "npcType": "villager",
    "oppositionLevel": 5,
    "isMainNPC": false,
    "attributes": {
      "wounds": { "current": 0, "max": 1 }
    }
  }
}
```

### Adversary (Adversario)

```json
{
  "name": "Father Adrien",
  "type": "npc",
  "system": {
    "npcType": "adversary",
    "oppositionLevel": 5,
    "isMainNPC": true,
    "attributes": {
      "wounds": { "current": 0, "max": 3 }
    }
  }
}
```

### Creature (Criatura)

```json
{
  "name": "Yvonne the Spirit",
  "type": "npc",
  "system": {
    "npcType": "creature",
    "oppositionLevel": 5,
    "isMainNPC": true,
    "attributes": {
      "wounds": { "current": 0, "max": 3 }
    }
  }
}
```

### Threat (Amenaza)

```json
{
  "name": "Grudge of the Dead",
  "type": "npc",
  "system": {
    "npcType": "threat",
    "oppositionLevel": 7,
    "isMainNPC": false,
    "attributes": {
      "wounds": { "current": 0, "max": 0 }
    }
  }
}
```

---

## 📚 Referencias Actualizadas

### Archivos Modificados

1. ✅ `system.json` - Añadido compendio "threats"
2. ✅ `README.md` - Actualizado con información de tipos
3. ✅ `.github/instructions/actor_types_reference.md` - **NUEVO** archivo de referencia

### Archivos Creados

1. ✅ `packs/compendiums/actors/threats/` - **NUEVA** carpeta de compendio
2. ✅ `.github/instructions/actor_types_reference.md` - **NUEVO** documento de referencia
3. ✅ `.github/instructions/CHANGELOG_actor_types.md` - Este archivo

### Archivos Validados (sin cambios)

- ✅ `template.json` - Ya tenía la estructura correcta
- ✅ `module/helpers/config.mjs` - Ya tenía todos los tipos definidos
- ✅ `lang/en.json` - Ya tenía todas las traducciones
- ✅ `lang/es.json` - Ya tenía todas las traducciones

---

## ✨ Beneficios de los Cambios

1. **Claridad**: Documentación completa de todos los tipos de actores
2. **Consistencia**: Estructura de carpetas alineada con system.json
3. **Extensibilidad**: Fácil añadir nuevos tipos en el futuro
4. **Referencia**: Guía clara para extraer NPCs de escenarios
5. **Organización**: Compendios bien categorizados por tipo

---

## 🎓 Lecciones Aprendidas

1. **template.json define la estructura base** - Solo 2 tipos de actores principales
2. **config.mjs define las opciones** - Los subtipos de NPCs se gestionan aquí
3. **system.json registra compendios** - Necesario para que Foundry los reconozca
4. **Carpetas != Compendios** - Puede haber carpetas que no estén registradas
5. **Categorías vs Tipos** - Las categorías (Minor/Main/Dark) son conceptuales, los tipos (villager/creature/etc) son implementados

---

**Estado del Sistema:** ✅ Completamente documentado y estructurado
**Próxima prioridad:** Continuar extracción de escenarios (Saint George y Ozena)

---
