# 📁 REORGANIZACIÓN DE ESTRUCTURA DE PACKS

## 🎯 PROPUESTA DE NUEVA ESTRUCTURA

### **ESTRUCTURA ACTUAL (Desorganizada):**

```
packs/
├── actors/
│   ├── adversaries.db
│   ├── broken-ones.db
│   ├── creatures.db
│   ├── villagers.db
│   ├── pre-generated-hunters.db
│   ├── pre-generated-npcs.db
│   ├── scenario-gifts.db
│   ├── pre-generated-hunters/  (carpetas fuente)
│   ├── pre-generated-npcs/
│   └── scenario-gifts/
├── maps/
├── playlists/
└── scenarios/
```

**Problemas:**

- ❌ Archivos .db mezclados con carpetas fuente
- ❌ Items (scenario-gifts) en carpeta de actors
- ❌ Difícil distinguir entre fuentes de desarrollo y archivos de distribución

---

### **OPCIÓN 1: ESTRUCTURA SIMPLE (RECOMENDADA)**

```
packs/
├── actors/                          ← Compendios de actores
│   ├── pre-generated-hunters.db     ← Archivo distribución
│   ├── pre-generated-npcs.db
│   ├── adversaries.db
│   ├── broken-ones.db
│   ├── creatures.db
│   └── villagers.db
│
├── items/                           ← Compendios de items
│   └── scenario-gifts.db
│
├── scenes/                          ← Compendios de escenas
│   ├── maps-en.db
│   └── maps-es.db
│
├── playlists/                       ← Compendios de audio
│   ├── environment.db
│   └── sound.db
│
├── journals/                        ← Compendios de journal entries
│   ├── scenarios-campaign.db
│   └── scenarios-oneshot.db
│
└── _source/                         ← Archivos fuente (desarrollo)
    ├── actors/
    │   ├── pre-generated-hunters/
    │   ├── pre-generated-npcs/
    │   └── ...
    └── items/
        └── scenario-gifts/
```

**Ventajas:**

- ✅ Clara separación por tipo de documento
- ✅ Fuentes en carpeta `_source` (no se distribuyen)
- ✅ Fácil de mantener
- ✅ Compatible con .gitignore

---

### **OPCIÓN 2: ESTRUCTURA HÍBRIDA (DESARROLLO)**

```
packs/
├── actors/
│   ├── pre-generated-hunters/       ← Carpeta fuente (Foundry lee esto)
│   ├── pre-generated-npcs/
│   ├── adversaries/
│   ├── broken-ones/
│   ├── creatures/
│   └── villagers/
│
├── items/
│   └── scenario-gifts/
│
├── scenes/
│   ├── maps-en/
│   └── maps-es/
│
├── playlists/
│   ├── environment/
│   └── sound/
│
└── journals/
    ├── scenarios-campaign/
    └── scenarios-oneshot/
```

**Ventajas:**

- ✅ Solo carpetas (Foundry las lee directamente)
- ✅ Ideal para desarrollo
- ✅ Git-friendly

**Desventajas:**

- ❌ Sin archivos .db pre-generados
- ❌ Foundry debe indexar todas las veces

---

### **OPCIÓN 3: ESTRUCTURA PRODUCCIÓN (ACTUAL - MANTENER)**

```
packs/
├── actors/
│   ├── pre-generated-hunters.db     ← Solo archivos .db
│   ├── pre-generated-npcs.db
│   ├── adversaries.db
│   ├── broken-ones.db
│   ├── creatures.db
│   └── villagers.db
│
├── items/
│   └── scenario-gifts.db
│
├── maps/
│   ├── en/                          ← Carpetas (porque tienen assets)
│   └── es/
│
├── playlists/
│   ├── environment/
│   └── sound/
│
└── scenarios/
    ├── campaign/
    └── one-shot/
```

**Ventajas:**

- ✅ Archivos .db para carga rápida
- ✅ Ideal para releases
- ✅ Sin carpetas fuente en distribución

---

## 🎯 MI RECOMENDACIÓN: OPCIÓN 1 (ESTRUCTURA SIMPLE)

### **Estructura Propuesta:**

```
packs/
├── actors/
│   ├── pre-generated-hunters.db
│   ├── pre-generated-npcs.db
│   ├── adversaries.db
│   ├── broken-ones.db
│   ├── creatures.db
│   └── villagers.db
│
├── items/
│   └── scenario-gifts.db
│
├── scenes/
│   └── maps/
│       ├── en/
│       └── es/
│
├── playlists/
│   ├── environment/
│   └── sound/
│
├── journals/
│   └── scenarios/
│       ├── campaign/
│       └── one-shot/
│
└── _source/                         ← OPCIONAL: Solo para desarrollo
    ├── actors/
    │   ├── pre-generated-hunters/   (15 archivos .json)
    │   ├── pre-generated-npcs/
    │   │   ├── adversaries/
    │   │   ├── broken-ones/
    │   │   ├── creatures/
    │   │   ├── threats/
    │   │   └── villager/
    │   └── scenario-gifts/
    └── README.md                    (instrucciones de desarrollo)
```

---

## 📝 CAMBIOS EN SYSTEM.JSON

### **Paths Actualizados:**

```json
{
  "packs": [
    {
      "name": "pre-generated-hunters",
      "path": "packs/actors/pre-generated-hunters",
      "type": "Actor"
    },
    {
      "name": "scenario-gifts",
      "path": "packs/items/scenario-gifts",        ← CAMBIO: items/
      "type": "Item"
    },
    {
      "name": "maps-en",
      "path": "packs/scenes/maps/en",              ← CAMBIO: scenes/maps/
      "type": "Scene"
    }
  ]
}
```

---

## ⚙️ PASOS DE MIGRACIÓN

### **1. Crear Nueva Estructura:**

```powershell
New-Item -ItemType Directory -Path "packs/items"
New-Item -ItemType Directory -Path "packs/scenes/maps"
New-Item -ItemType Directory -Path "packs/journals/scenarios"
New-Item -ItemType Directory -Path "packs/_source/actors"
New-Item -ItemType Directory -Path "packs/_source/items"
```

### **2. Mover Archivos .db:**

```powershell
# Mover scenario-gifts a items/
Move-Item "packs/actors/scenario-gifts.db" "packs/items/"

# Mover mapas a scenes/
Move-Item "packs/maps" "packs/scenes/maps"

# Renombrar journals
Move-Item "packs/scenarios" "packs/journals/scenarios"
```

### **3. Mover Carpetas Fuente (OPCIONAL):**

```powershell
# Mover carpetas fuente a _source/
Move-Item "packs/actors/pre-generated-hunters" "packs/_source/actors/"
Move-Item "packs/actors/pre-generated-npcs" "packs/_source/actors/"
Move-Item "packs/actors/scenario-gifts" "packs/_source/items/"
```

### **4. Actualizar system.json:**

- Cambiar paths de scenario-gifts a `packs/items/`
- Cambiar paths de maps a `packs/scenes/maps/`
- Cambiar paths de scenarios a `packs/journals/scenarios/`

### **5. Actualizar .gitignore (OPCIONAL):**

```gitignore
# Ignorar archivos .db generados (solo versionar fuentes)
packs/**/*.db

# Versionar carpetas fuente
!packs/_source/
```

---

## ❓ ¿QUÉ OPCIÓN PREFIERES?

1. **Mantener actual (Opción 3)**: Todo funciona, solo pequeños ajustes
2. **Estructura simple (Opción 1)**: Separar por tipo + carpeta \_source
3. **Desarrollo (Opción 2)**: Solo carpetas, sin .db

**Mi recomendación:** **Mantener actual + pequeños ajustes**:

- Mover `scenario-gifts.db` a `packs/items/`
- Dejar todo lo demás como está
- Es el cambio mínimo y funciona perfectamente

---

## 🎯 DECISIÓN

**¿Qué quieres hacer?**

- **A**: Mantener estructura actual (solo mover scenario-gifts a items/)
- **B**: Reestructurar completo con carpeta \_source (Opción 1)
- **C**: Solo carpetas, eliminar .db (Opción 2)

Espera mi confirmación antes de proceder.
