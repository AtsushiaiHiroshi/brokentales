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
  - **Actors**: Pre-generated Hunters, NPCs (Adversaries, Broken Ones, Creatures, Villagers)
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

## 🎲 NPC Sheet Overview (Villager/Creature)

- **Name**: Adversary, Broken One, Creature or Villager name.
- **Description**: Brief narrative description.
- **Threat**: What danger or narrative role the NPC represents.
- **Damage**: Base damage they deal (e.g., 1d6).
- **State**: Current status (active, wounded, incapacitated, etc.).
- **Gifts**: Powers or narrative abilities.
- **Equipment**: Items the NPC may possess.
- **Soma**: For supernatural creatures and Broken Ones, represents their dark power and ability to use supernatural abilities.
- **Wounds**: Damage track determining how much harm they can take before being defeated.

---

## ⚙️ Current Features

- Full support for Hunter (Character) and NPC types (Adversaries, Broken Ones, Creatures, Villagers)
- Automatic dice roll system using custom macros (Powered by the Apocalypse System)
- Full English language interface with Spanish translation available
- Comprehensive compendium collection including:
  - Pre-generated characters and NPCs
  - Scenario-specific Gifts
  - Environmental and background music
  - Complete one-shot adventure (Red-Hood Iskra)
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