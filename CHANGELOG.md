# Changelog - Broken Tales System

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-12-20

### 🔧 Critical System.json Path Corrections

**BREAKING FIX**: Corrected all compendium paths to point to actual `.db` files instead of folders.

#### Path Corrections Applied:

- ✅ **66 compendium paths** corrected from folder paths to `.db` file paths
- ✅ **10 Item compendiums** - All paths now include `.db` extension
- ✅ **44 Actor compendiums** - All scenario and NPC paths corrected
- ✅ **10 Scenario-Gifts compendiums** - All paths corrected
- ✅ **2 Playlist compendiums** - Environment and sounds paths corrected

#### Removed Entries:

- ❌ **Maps compendiums** (4 entries) - Removed as no `.db` files exist yet
- ❌ **Scenarios compendiums** (2 entries) - Removed as no `.db` files exist yet

**Impact**: Foundry VTT will now correctly load all 66 compendiums. Previous paths would have caused loading failures.

**See**: `COMPENDIUM_AUDIT.md` for complete verification report.

---

### Added - Complete Items & Clues Extraction (83 items total)

#### 🎯 New Item Compendiums

Extracted and created complete item collections for all 10 adventures:

1. **A Soldier's Duty** (6 items)

   - Nils War Diary, Hans Experimental Pistols, Hans Smoke Bombs
   - Seashells from the Cliff, Letter from Nils to Riksrad, Coral of the Sea Fairy

2. **Wonderbedlam** (6 items)

   - Message from Director, Hattas Wonder Blueprint, Hattas Time Clocks
   - Alices Special Tea, White Rabbit Message Holders, Alissas Letters to Family

3. **Tuvstarr's Reflection** (7 items)

   - Tuvstarrs Golden Crown, White Dress, Lance of Fallen Knight
   - Knights Crest, Reflection in Black Pond, Heart Necklace, Plate Armor

4. **The City of Pigs** (8 items)

   - Williams Black Book, Rusty Key, Mine Map, Flesh of The God
   - Grotesque Pig Masks, Franks Pincer Arm, Brand of Greed, Browne Family Sign

5. **Saint George - The Dragon Slayer** (6 items)

   - Fervor Tokens, Suspicion Tokens, Judgment Tokens
   - Trebizonds Magic Dust, Whip Sharp as Blade, Saint Georges Holy Authority

6. **OZena - The Suffering and Desperate** (12 items)

   - Margaretas Compass Piece, Dorotheas Silver Slippers, Infusion of Purity
   - Elderberry Sprig, Helgas Blood Vials, Mirror of Thousand Wishes
   - Porcelain Doll Masks, Hammerhead Helmet, Henkles Penicillin
   - Wishing Well of Smaragd, Hot-Air Balloon, Key to Helgas Palace

7. **The Smile in the Darkness** (8 items)

   - Yvonnes Untouched Candle, Adriens Absinthe Laboratory, Cemetery Keys
   - Comet Morituris, Yvonnes Shining Teeth, Smuggled Absinthe
   - Ravens Hideout Evidence, Yvonnes Alcove with Flowers

8. **Of Flesh and Wood** (12 items)

   - Geppettos Chisel, Ancient Alchemical Text, Magical Oak Wood
   - Carlos Shoes, Bloodstained Mannequins, Geppettos Vials
   - School Books, False Gold Coins, Whale Painting Secret Door
   - Antonios Vials, Magical Brazier, Nino the Flayed Apprentice

9. **One Thousand and One Nightmares** (8 items)

   - Shadow Focus Objects, Sherazades Storytelling Performance
   - Dinarzads Smile Memory, Shadows Warning Words
   - Story Entrapment Technique, Sultans Rejected Offering
   - Black Shadows from Stories, Alliance with Stooped Writer

10. **Red-Hood Iskra** (10 items - pre-existing)
    - Blood Drawings, Elizavetas Poison, Gerards Letter, Iskras Pendant
    - Red Cape, Wolf Mask, Bones/Corpses, Portrait, Secret Map, Wolf Tracks

#### 📚 Documentation

- Created comprehensive `ITEMS_STATUS.md` tracking all 83 items across 10 adventures
- 100% extraction complete from official "Broken Tales.txt" manual
- All items verified against source material for accuracy

### Changed

- Updated `system.json` version from 1.0.0 to 1.1.0
- Enhanced system description to reflect complete content coverage
- Verified all compendium pack paths and labels

### Technical Details

- **Item Types**: `clue` (with location, importance, found, scenario fields) and `object` (with quantity, weight, value, equipped, properties)
- **Importance Levels**: minor, important, crucial
- **Format**: Foundry VTT Item document structure (v11-13 compatible)
- **Organization**: Items organized by scenario folder structure

---

## [1.0.0] - 2024-12-XX

### Initial Release

- Core Broken Tales system implementation
- Character sheet for Hunters
- NPC sheet system
- Roll mechanics (d6 pools, critical failures, Soma spending)
- Actor types: Character (Hunter) and NPC (multiple subtypes)
- Item types: Descriptor and Gift
- Basic compendium structure
- Pre-generated Hunters
- Red-Hood Iskra adventure complete with items
- Spanish and English language support

### Features

- Soma resource management
- Wounds tracking system
- Dark Ego mechanics
- Descriptor-based character building
- Gift system with Soma costs
- Opposition Level (OL) system for NPCs
- Gothic dark theme UI
- Handlebars templates for sheets
- Roll macros (roll.js, soma.js, darknessEgo.js, reroll.js)

---

## Development Notes

### Extraction Methodology

All items extracted manually from official "Broken Tales.txt" source document:

- No AI-invented content
- Accurate descriptions matching source material
- Proper context preservation
- Mechanical effects as described in manual
- Story significance maintained

### Future Enhancements

- [ ] Automated XP tracking system
- [ ] Interlude mechanics between sessions
- [ ] Active Effects integration for conditions
- [ ] Macro hotbar integration for Gifts
- [ ] Dice So Nice module integration
- [ ] Additional language support

---

**Maintained by**: Atsushiai Hiroshi  
**Repository**: https://github.com/AtsushiaiHiroshi/brokentales  
**License**: Proprietary (Broken Tales © The World Anvil Publishing)
