# Broken Tales - Actor Types Reference

**Fecha de creación:** 17 de diciembre de 2025
**Versión del sistema:** 1.0.0

---

## 📚 Tipos de Actores (Actor Types)

Según el `template.json`, Broken Tales tiene **2 tipos principales de actores**:

### 1. **character** - Cazador (Hunter)

Personajes jugadores que pertenecen a la Orden y cazan Presencias Oscuras.

**Características:**

- Soma: 0-6 (recurso sobrenatural)
- Heridas: 0-3 + 1 herida extra
- XP (Experiencia)
- Descriptores (narrativos)
- Dones (Gifts - mecánicos)
- Ego Oscuro (Dark Ego - lado oscuro del personaje)

**Ubicación de compendios:**

- `packs/compendiums/actors/pre-generated-hunters/`

---

### 2. **npc** - Personaje No Jugador (Non-Player Character)

Todos los demás personajes del juego, desde aldeanos hasta Presencias Oscuras.

**Características:**

- Soma: Variable (0 para la mayoría)
- Heridas: Variable según categoría
- Nivel de Oposición (OL): 3, 5 o 7
- Tipo de NPC (npcType)
- Descriptores
- Dones (Gifts)
- Agenda (motivaciones)

---

## 🏷️ Categorías de NPCs (Según el Manual)

Los NPCs se clasifican en **3 categorías según su importancia narrativa**:

### 1. **Minor NPC** (NPC Menor)

- **Heridas:** 1 a 3 (generalmente 1)
- **Rol:** Personajes secundarios, encuentros ocasionales
- **Ejemplos:** Aldeanos, guardias, transeúntes

### 2. **Main NPC** (NPC Principal)

- **Heridas:** 1 a 6 (generalmente 3)
- **Rol:** Personajes importantes en la historia
- **Ejemplos:** Aliados principales, antagonistas menores

### 3. **Dark Presence** (Presencia Oscura)

- **Heridas:** 1 a 6 (generalmente 3)
- **Rol:** Entidades sobrenaturales relacionadas con cuentos de hadas
- **Ejemplos:** Brujas, espíritus, criaturas mágicas corruptas

---

## 🎭 Subtipos de NPCs (npcType)

Definidos en `module/helpers/config.mjs`, los NPCs se clasifican en **7 subtipos**:

### 1. **villager** (Aldeano)

- **Traducción ES:** Aldeano
- **Descripción:** Gente común, campesinos, ciudadanos
- **Compendio:** `packs/compendiums/actors/villagers/`
- **Ejemplos:** Granjeros, comerciantes, sacerdotes locales

### 2. **creature** (Criatura)

- **Traducción ES:** Criatura
- **Descripción:** Seres sobrenaturales o animales especiales
- **Compendio:** `packs/compendiums/actors/creatures/`
- **Ejemplos:** Hombres lobo, espíritus de la naturaleza, bestias mágicas

### 3. **adversary** (Adversario)

- **Traducción ES:** Adversario
- **Descripción:** Enemigos humanos o humanoides organizados
- **Compendio:** `packs/compendiums/actors/adversaries/`
- **Ejemplos:** Bandidos, nobles corruptos, cazadores rivales

### 4. **broken_one** (Corrompido)

- **Traducción ES:** Corrompido
- **Descripción:** Antiguos Cazadores corrompidos por la oscuridad
- **Compendio:** `packs/compendiums/actors/broken-ones/`
- **Ejemplos:** Ex-Cazadores caídos, héroes corrompidos
- **Nota:** Relacionado con la expansión "The Broken Ones"

### 5. **threat** (Amenaza)

- **Traducción ES:** Amenaza
- **Descripción:** Elementos ambientales u obstáculos peligrosos
- **Compendio:** `packs/compendiums/actors/threats/`
- **Ejemplos:** Trampas mágicas, fenómenos naturales peligrosos, edificios embrujados

### 6. **object** (Objeto)

- **Traducción ES:** Objeto
- **Descripción:** Objetos animados u objetos con estadísticas
- **Compendio:** _No implementado aún_
- **Ejemplos:** Armaduras animadas, espejos mágicos, estatuas vivientes

### 7. **obstacle** (Obstáculo)

- **Traducción ES:** Obstáculo
- **Descripción:** Desafíos ambientales que requieren superar
- **Compendio:** _No implementado aún_
- **Ejemplos:** Puertas encantadas, laberintos, tormentas místicas

---

## 📊 Niveles de Oposición (Opposition Level - OL)

Los NPCs tienen uno de **3 niveles de dificultad**:

| Nivel      | Valor | Traducción EN | Traducción ES | Uso                        |
| ---------- | ----- | ------------- | ------------- | -------------------------- |
| **Easy**   | 3     | Easy          | Fácil         | Aldeanos, NPCs débiles     |
| **Medium** | 5     | Normal        | Normal        | NPCs estándar, adversarios |
| **Hard**   | 7     | Hard          | Difícil       | Presencias Oscuras, jefes  |

**Importante:** En `template.json`, el Opposition Level es un **número** (3, 5 o 7), NO un string.

---

## 🗂️ Estructura de Carpetas en `packs/`

```
packs/
├── compendiums/
│   ├── actors/
│   │   ├── pre-generated-hunters/     ✅ Cazadores pregenerados
│   │   ├── pre-generated-npcs/        ✅ NPCs pregenerados (mixtos)
│   │   ├── adversaries/               ✅ Adversarios
│   │   ├── broken-ones/               ✅ Corrompidos
│   │   ├── creatures/                 ✅ Criaturas
│   │   ├── threats/                   ✅ Amenazas (recién añadido)
│   │   └── villagers/                 ✅ Aldeanos
│   ├── scenario-gifts/                ✅ Dones de escenario
│   └── items/
│       └── iskra-items/               ✅ Objetos del escenario Iskra
├── scenarios/
│   ├── one-shot/                      ✅ Escenarios cortos
│   └── campaign/                      ✅ Campañas
├── maps/
│   ├── en/                            ✅ Mapas en inglés
│   └── es/                            ✅ Mapas en español
└── playlists/
    ├── environment/                   ✅ Música ambiental
    └── sound/                         ✅ Efectos de sonido
```

---

## ⚙️ Registro en system.json

Todos los compendios deben estar registrados en `system.json` en la sección `packs`:

```json
{
  "name": "threats",
  "label": "Threats",
  "path": "packs/compendiums/actors/threats",
  "type": "Actor",
  "system": "brokentales",
  "ownership": {
    "PLAYER": "OBSERVER",
    "ASSISTANT": "OWNER"
  }
}
```

Y organizados en `packFolders`:

```json
{
  "name": "Actors",
  "sorting": "m",
  "packs": ["pre-generated-hunters", "pre-generated-npcs"],
  "folders": [
    {
      "name": "NPCs by Type",
      "sorting": "m",
      "packs": [
        "adversaries",
        "broken-ones",
        "creatures",
        "threats",
        "villagers"
      ]
    }
  ]
}
```

---

## 🎯 Ejemplos de Uso por Escenario

### The Smile in the Darkness

- **Main NPCs:** Father Adrien (adversary), Yvonne (creature - spirit)
- **Minor NPCs:** Lorenzo (villager), Alizée (villager), Olivier (adversary)
- **Threats:** Grudge of the Dead (environmental threat)

### The City of Pigs

- **Main NPCs:** Bardolf Greed (adversary), Arthur/Frank/Clarence Browne (adversaries)
- **Creatures:** God Under the Mine (creature), Spawn (creature)
- **Threats:** Pig Heads gang (adversaries), mine collapse (threat)

### Wonderbedlam

- **Main NPC:** Alice Liddell (broken_one - Director)
- **Creatures:** Cheshire (creature - lynx)
- **Threats:** Building entity with Place of Pure Madness (threat)

---

## 📝 Buenas Prácticas

1. **Siempre usar número para Opposition Level**

   ```json
   "oppositionLevel": 5  // ✅ Correcto
   "oppositionLevel": "Normal"  // ❌ Incorrecto
   ```

2. **Heridas actuales siempre empiezan en 0**

   ```json
   "wounds": {
     "current": 0,  // Sano al inicio
     "max": 3
   }
   ```

3. **Categoría determina heridas máximas**

   - Minor NPC: 1 herida generalmente
   - Main NPC: 3 heridas generalmente
   - Dark Presence: 3-6 heridas según peligro

4. **Usar el npcType apropiado**

   - Humanos normales → `villager`
   - Humanos organizados/hostiles → `adversary`
   - Seres sobrenaturales → `creature`
   - Ex-Cazadores caídos → `broken_one`
   - Elementos ambientales → `threat`

5. **Soma para NPCs**
   - Mayoría de NPCs: Soma = 0
   - Presencias Oscuras poderosas: Soma variable (1-3)
   - Broken Ones: Soma como antiguos Cazadores (1-6)

---

## 🔄 Conversión de NPCs de Escenarios

Al extraer NPCs de los escenarios en texto, seguir esta guía:

| Descripción en texto                       | npcType    | OL típico | Heridas |
| ------------------------------------------ | ---------- | --------- | ------- |
| "Sacerdote", "Doctor", "Aldeano"           | villager   | 3-5       | 1       |
| "Bandido", "Guardia", "Nobleza corrupta"   | adversary  | 5-7       | 1-3     |
| "Espíritu", "Hombre lobo", "Bestia mágica" | creature   | 5-7       | 1-6     |
| "Ex-Cazador", "Cazador caído"              | broken_one | 7         | 3-6     |
| "Trampa mágica", "Fenómeno", "Edificio"    | threat     | 3-7       | N/A     |

---

## 🚀 Pendientes de Implementación

### Compendios faltantes

- [ ] **Objects** - Para objetos animados
- [ ] **Obstacles** - Para obstáculos ambientales específicos

### Posibles mejoras

- [ ] Añadir campo `category` explícito en template.json (Minor/Main/Dark Presence)
- [ ] Crear helper para calcular heridas según categoría
- [ ] Implementar sistema de tags para búsqueda avanzada
- [ ] Añadir campo `scenarioOrigin` para rastrear procedencia

---

## 📚 Referencias

- **Template.json:** Define estructura de datos de actores
- **module/helpers/config.mjs:** Define constantes y tipos del sistema
- **lang/en.json y lang/es.json:** Traducciones de tipos
- **system.json:** Registro de compendios
- **Manual (Broken Tales.txt, líneas 916-924):** Definición de categorías

---

**Última actualización:** 17 de diciembre de 2025
**Mantenedor:** Atsushiai Hiroshi
