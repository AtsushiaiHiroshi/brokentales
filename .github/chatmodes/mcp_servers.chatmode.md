
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "F:\ROL\Tools for DM\Foundry VTT\Contenido\Data\systems\brokentales/ruta/brokentales"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "F:\ROL\Tools for DM\Foundry VTT\Contenido\Data\systems\brokentales"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "SHA256:LokcuTBXnCNs3K5hWfjuc9C91YmOr3ls7Q9ru/rrt6E"
      }
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "F:\ROL\Tools for DM\Foundry VTT\Contenido\Data\systems\brokentales/packs"]
    }

```

---

## 🎯 **Ventajas Concretas para tu Proyecto**

### **Con Filesystem MCP:**
```

Tú: "Aplica las correcciones a actor-sheet.mjs"
Yo: ✅ Leo el archivo actual
    ✅ Aplico los cambios
    ✅ Guardo el archivo corregido
    ✅ Te confirmo qué cambió

```

### **Con Memory MCP:**
```

Yo: "Recordaré que:
     - Opposition Level debe ser NUMBER
     - Critical Failure anula TODOS los éxitos
     - Los NPCs inician con wounds.current = 0
     - Usas structure system, no data"

```

### **Con Git MCP:**
```

Tú: "¿Qué archivos he modificado hoy?"
Yo: ✅ actor-sheet.mjs (100 líneas)
    ✅ actor.mjs (50 líneas)
    ✅ brokentales.mjs (15 líneas)

```

### **Con SQLite MCP:**
```

Tú: "¿Cuántos NPCs hay en el pack de adversaries?"
Yo: ✅ Consulto el .db
    ✅ "Hay 5 adversaries: Elizaveta, Gerard, Vincent..."
