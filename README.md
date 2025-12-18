# Broken Tales System

Installation instructions and notes.

**Broken Tales** is a full-featured system for Foundry VTT, designed to play Broken Tales campaigns directly within the virtual tabletop environment.

---

## 📥 Installation

1. Download or clone this repository.

2. Extract the folder and place it in:
   [FoundryVTT Data Folder]/systems/brokentales/

3. Restart Foundry VTT.

4. When creating or configuring a world, select **Broken Tales** as the Game System.

---

## 🗂 System Contents

- `system.json`: Defines the system information and compatibility.
- `template.json`: Base data template for Actors (Characters and NPCs).
- `templates/`: HTML sheets for Character and NPCs.
- `styles/`: Custom CSS with gothic theme and integrated font (GrobeDeutschmeister), the original font of the original Broken Tales game.
- `fonts/`: Manuscript font used by the system.
- `lang/`: Multi-language support (English and Spanish).
- `scripts/`: System scripts and macros for core functionality.
- `packs/`: Compendiums containing:
  - **Actors**:
    - Pre-generated Hunters (playable characters)
    - Pre-generated NPCs (mixed types)
    - **NPCs by Type:**
      - Adversaries (human enemies, organized opposition)
      - Broken Ones (corrupted former Hunters)
      - Creatures (supernatural beings, magical beasts)
      - Threats (environmental hazards, dangerous phenomena)
      - Villagers (common folk, citizens, peasants)
  - **Items**: Gifts and Descriptors for the system
  - **Playlists**: Environment sounds, Sound effects, and Background music
  - **Scenarios**: One-shots (including Red-Hood Iskra) and Campaign materials
  - **Maps**: Environment maps in both English and Spanish

---

## 🎲 Character Sheet Overview

- **Name**: Hunter's name.
- **Background**: Hunter's backstory.
- **Descriptors**: Narrative powers or traits.
- **Gifts**: Mechanical bonuses or powers.
- **Dark Ego**: Trigger and corrupted Gift.
- **Equipment**: Important narrative objects.
- **Conditions**: Current afflictions.
- **Soma**: Resource representing a character's willpower and supernatural potential, it can be spent to activate Gifts or add succeeded dices to your roll, Soma represents the character's connection to the dark side of fairy tales.
- **Wounds**: Physical and mental injuries that can be sustained before being incapacitated.
- **Notes**: Free text for additional character information.

---

## 🎲 NPC Sheet Overview

NPCs in Broken Tales are categorized into different types based on their narrative role:

### NPC Categories (by Importance)

- **Minor NPC**: 1-3 Wounds (usually 1) - Secondary characters, occasional encounters
- **Main NPC**: 1-6 Wounds (usually 3) - Important story characters
- **Dark Presence**: 1-6 Wounds (usually 3) - Supernatural entities from fairy tales

### NPC Types (by Nature)

- **Villager**: Common folk, peasants, citizens (OL: 3-5)
- **Adversary**: Human enemies, organized opposition (OL: 5-7)
- **Creature**: Supernatural beings, magical beasts (OL: 5-7)
- **Broken One**: Corrupted former Hunters (OL: 7)
- **Threat**: Environmental hazards, dangerous phenomena (OL: 3-7)
- **Object**: Animated objects (not yet implemented)
- **Obstacle**: Environmental challenges (not yet implemented)

### NPC Sheet Fields

- **Name**: NPC name
- **NPC Type**: Villager, Adversary, Creature, Broken One, or Threat
- **Opposition Level (OL)**: Difficulty (3 Easy, 5 Normal, 7 Hard)
- **Description**: Brief narrative description
- **Descriptor**: Narrative trait that modifies OL by ±1
- **Agenda**: Motivations and goals
- **Damage**: Base damage they deal (e.g., 1d6)
- **State**: Current status (active, wounded, incapacitated, etc.)
- **Gifts**: Powers or narrative abilities
- **Equipment**: Items the NPC may possess
- **Soma**: For supernatural creatures and Broken Ones
- **Wounds**: Damage track (current/max)

For detailed information about actor types, see `.github/instructions/actor_types_reference.md`

---

## ⚙️ Current Features

- Full support for Hunter (Character) and NPC types
  - **7 NPC Types**: Villagers, Adversaries, Creatures, Broken Ones, Threats, Objects*, Obstacles* (\*in development)
  - **3 NPC Categories**: Minor, Main, and Dark Presence
  - **3 Opposition Levels**: Easy (3), Normal (5), Hard (7)
- Automatic dice roll system using custom macros (Powered by the Apocalypse inspired)
- Full English language interface with Spanish translation available
- Comprehensive compendium collection including:
  - Pre-generated Hunters and NPCs of all types
  - Scenario-specific Gifts
  - Environmental and background music
  - Complete one-shot adventure (Red-Hood Iskra)
  - 8+ additional scenarios extracted from core book
- Ready for extension: add more moves, gifts, conditions as needed

---

## 🔮 Future Work (Optional)

- Advanced macros for quick activation of Gifts and Descriptors.
- Compendiums with official Broken Tales powers and characters.
- Advanced sheet styling and dynamic effects.

---

## 📝 Credits

Broken Tales is © by The World Anvil Publishing.  
This system is an independent adaptation for personal Foundry VTT usage.

---

"authors": [
{
"name": "Broken Tales System Developer",
"discord": "brokentales",
"url": "https://github.com/brokentales/foundryvtt-brokentales"
}
