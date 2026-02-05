// ============================================
// ITEMS DATA
// Weapons and Armor from Grudge Warlords data exports
// ============================================

import type { 
  Weapon, Armor, WeaponStats, ArmorStats,
  ItemTier, WeaponCategory, WeaponSubCategory, WeaponProfession,
  ArmorSlot, ArmorType, ArmorProfession, WeaponIngredient
} from '../types/equipment.ts';

// === WEAPON DEFINITIONS ===
// Based on weapons.csv from data-exports
export const WEAPONS: Weapon[] = [
  // === TIER 0 - COMMON ===
  { id: 'wooden-club', name: 'Wooden Club', tier: 0, category: 'blunt', subCategory: 'blunt-1h', profession: 'Universal', description: 'Crude bludgeon', icon: '🪵', baseStats: { ATK: 5 }, ingredients: [{ itemId: 'pine-log', quantity: 2 }] },
  { id: 'rusty-shortsword', name: 'Rusty Shortsword', tier: 0, category: 'sword', subCategory: 'sword-1h', profession: 'Universal', description: 'Dull blade', icon: '⚔️', baseStats: { ATK: 8 }, ingredients: [{ itemId: 'stone', quantity: 2 }, { itemId: 'string', quantity: 1 }] },
  { id: 'training-bow', name: 'Training Bow', tier: 0, category: 'bow', subCategory: 'bow-short', profession: 'Universal', description: 'Basic practice bow', icon: '🏹', baseStats: { ATK: 6 }, ingredients: [{ itemId: 'pine-log', quantity: 2 }, { itemId: 'string', quantity: 1 }] },
  { id: 'apprentice-wand', name: 'Apprentice Wand', tier: 0, category: 'wand', subCategory: 'wand', profession: 'Universal', description: 'Novice focus', icon: '🪄', baseStats: { MATK: 5 }, ingredients: [{ itemId: 'pine-log', quantity: 1 }, { itemId: 'minor-essence', quantity: 1 }] },
  { id: 'stone-knife', name: 'Stone Knife', tier: 0, category: 'dagger', subCategory: 'dagger', profession: 'Universal', description: 'Primitive blade', icon: '🗡️', baseStats: { ATK: 4 }, ingredients: [{ itemId: 'stone', quantity: 2 }] },

  // === TIER 1 - BASIC SWORDS ===
  { id: 'gladius', name: 'Gladius', tier: 1, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Short Roman blade', icon: '⚔️', baseStats: { ATK: 15 }, ingredients: [{ itemId: 'copper-ingot', quantity: 2 }, { itemId: 'rawhide', quantity: 1 }] },
  { id: 'bronze-claymore', name: 'Bronze Claymore', tier: 1, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Heavy two-hand blade', icon: '🗡️', baseStats: { ATK: 22 }, ingredients: [{ itemId: 'copper-ingot', quantity: 4 }, { itemId: 'oak-plank', quantity: 1 }] },
  
  // === TIER 2 - UNCOMMON SWORDS ===
  { id: 'falchion', name: 'Falchion', tier: 2, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Curved single-edge blade', icon: '⚔️', baseStats: { ATK: 28 }, ingredients: [{ itemId: 'iron-ingot', quantity: 3 }, { itemId: 'thick-hide', quantity: 1 }] },
  { id: 'bastard-sword', name: 'Bastard Sword', tier: 2, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Hand-and-a-half sword', icon: '🗡️', baseStats: { ATK: 40 }, ingredients: [{ itemId: 'iron-ingot', quantity: 5 }, { itemId: 'oak-plank', quantity: 2 }] },
  
  // === TIER 3 - RARE SWORDS ===
  { id: 'scimitar', name: 'Scimitar', tier: 3, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Crescent moon blade', icon: '⚔️', baseStats: { ATK: 45 }, ingredients: [{ itemId: 'steel-ingot', quantity: 3 }, { itemId: 'rugged-leather', quantity: 1 }] },
  { id: 'zweihander', name: 'Zweihander', tier: 3, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'German great sword', icon: '🗡️', baseStats: { ATK: 65 }, ingredients: [{ itemId: 'steel-ingot', quantity: 5 }, { itemId: 'maple-plank', quantity: 2 }] },
  
  // === TIER 4 - EPIC SWORDS ===
  { id: 'rapier', name: 'Rapier', tier: 4, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Elegant thrusting sword', icon: '⚔️', baseStats: { ATK: 68, CRITCHANCE: 5 }, ingredients: [{ itemId: 'mithril-ingot', quantity: 3 }, { itemId: 'hardened-leather', quantity: 1 }] },
  { id: 'nodachi', name: 'Nodachi', tier: 4, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Japanese field sword', icon: '🗡️', baseStats: { ATK: 95, CRITCHANCE: 3 }, ingredients: [{ itemId: 'mithril-ingot', quantity: 5 }, { itemId: 'ash-plank', quantity: 2 }] },
  
  // === TIER 5 - LEGENDARY SWORDS ===
  { id: 'katana', name: 'Katana', tier: 5, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Eastern folded steel', icon: '⚔️', baseStats: { ATK: 95, CRITCHANCE: 8, CRITDMG: 15 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 4 }, { itemId: 'wyrm-leather', quantity: 1 }] },
  { id: 'flamberge', name: 'Flamberge', tier: 5, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Wavy flame blade', icon: '🗡️', baseStats: { ATK: 135, CRITCHANCE: 5, CRITDMG: 20 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 6 }, { itemId: 'ironwood-plank', quantity: 2 }] },
  
  // === TIER 6 - MYTHIC SWORDS ===
  { id: 'soulblade', name: 'Soulblade', tier: 6, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Spirit-bound edge', icon: '⚔️', baseStats: { ATK: 130, CRITCHANCE: 10, LIFESTEAL: 5 }, ingredients: [{ itemId: 'orichalcum-ingot', quantity: 4 }, { itemId: 'infernal-leather', quantity: 1 }, { itemId: 'flawless-gem', quantity: 1 }] },
  { id: 'soul-reaver', name: 'Soul Reaver', tier: 6, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Life-draining blade', icon: '🗡️', baseStats: { ATK: 185, CRITCHANCE: 8, LIFESTEAL: 8 }, ingredients: [{ itemId: 'orichalcum-ingot', quantity: 6 }, { itemId: 'ebony-plank', quantity: 2 }, { itemId: 'flawless-gem', quantity: 1 }] },
  
  // === TIER 7 - DIVINE SWORDS ===
  { id: 'starfall-edge', name: 'Starfall Edge', tier: 7, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Celestial meteor blade', icon: '⚔️', baseStats: { ATK: 175, CRITCHANCE: 12, CRITDMG: 25, ARMORPEN: 10 }, ingredients: [{ itemId: 'starmetal-ingot', quantity: 5 }, { itemId: 'titan-leather', quantity: 1 }, { itemId: 'radiant-gem', quantity: 1 }] },
  { id: 'cosmos-cleaver', name: 'Cosmos Cleaver', tier: 7, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Reality-splitting blade', icon: '🗡️', baseStats: { ATK: 250, CRITCHANCE: 10, CRITDMG: 30, ARMORPEN: 15 }, ingredients: [{ itemId: 'starmetal-ingot', quantity: 7 }, { itemId: 'wyrmwood-plank', quantity: 2 }, { itemId: 'radiant-gem', quantity: 1 }] },
  
  // === TIER 8 - TRANSCENDENT SWORDS ===
  { id: 'excalibur', name: 'Excalibur', tier: 8, category: 'sword', subCategory: 'sword-1h', profession: 'Warrior', description: 'Legendary holy sword', icon: '⚔️', baseStats: { ATK: 250, CRITCHANCE: 15, CRITDMG: 40, ARMORPEN: 20, LIFESTEAL: 10 }, ingredients: [{ itemId: 'divine-ingot', quantity: 5 }, { itemId: 'divine-leather', quantity: 2 }, { itemId: 'divine-gem', quantity: 1 }] },
  { id: 'worldender', name: 'Worldender', tier: 8, category: 'sword', subCategory: 'sword-2h', profession: 'Warrior', description: 'Apocalyptic blade', icon: '🗡️', baseStats: { ATK: 350, CRITCHANCE: 12, CRITDMG: 50, ARMORPEN: 25, STAGGER: 20 }, ingredients: [{ itemId: 'divine-ingot', quantity: 8 }, { itemId: 'worldtree-plank', quantity: 2 }, { itemId: 'divine-gem', quantity: 2 }] },

  // === AXES ===
  { id: 'hatchet', name: 'Hatchet', tier: 1, category: 'axe', subCategory: 'axe-1h', profession: 'Warrior', description: 'Light throwing axe', icon: '🪓', baseStats: { ATK: 18 }, ingredients: [{ itemId: 'copper-ingot', quantity: 2 }, { itemId: 'pine-plank', quantity: 1 }] },
  { id: 'tomahawk', name: 'Tomahawk', tier: 2, category: 'axe', subCategory: 'axe-1h', profession: 'Warrior', description: 'Balanced throwing axe', icon: '🪓', baseStats: { ATK: 32 }, ingredients: [{ itemId: 'iron-ingot', quantity: 3 }, { itemId: 'oak-plank', quantity: 1 }] },
  { id: 'berserker-axe', name: 'Berserker Axe', tier: 5, category: 'axe', subCategory: 'axe-1h', profession: 'Warrior', description: 'Rage-infused axe', icon: '🪓', baseStats: { ATK: 105, CRITCHANCE: 10, STAGGER: 15 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 4 }, { itemId: 'ironwood-plank', quantity: 1 }, { itemId: 'refined-essence', quantity: 1 }] },
  { id: 'godslayer', name: 'Godslayer', tier: 8, category: 'axe', subCategory: 'axe-1h', profession: 'Warrior', description: 'Divine executioner', icon: '🪓', baseStats: { ATK: 275, CRITCHANCE: 15, CRITDMG: 35, ARMORPEN: 30 }, ingredients: [{ itemId: 'divine-ingot', quantity: 6 }, { itemId: 'worldtree-plank', quantity: 1 }, { itemId: 'divine-gem', quantity: 1 }] },

  // === DAGGERS ===
  { id: 'stiletto', name: 'Stiletto', tier: 1, category: 'dagger', subCategory: 'dagger', profession: 'Rogue', description: 'Thin stabbing blade', icon: '🗡️', baseStats: { ATK: 12, CRITCHANCE: 5 }, ingredients: [{ itemId: 'copper-ingot', quantity: 1 }, { itemId: 'rawhide', quantity: 1 }] },
  { id: 'dirk', name: 'Dirk', tier: 2, category: 'dagger', subCategory: 'dagger', profession: 'Rogue', description: 'Scottish fighting knife', icon: '🗡️', baseStats: { ATK: 22, CRITCHANCE: 8 }, ingredients: [{ itemId: 'iron-ingot', quantity: 2 }, { itemId: 'thick-hide', quantity: 1 }] },
  { id: 'assassins-fang', name: "Assassin's Fang", tier: 5, category: 'dagger', subCategory: 'dagger', profession: 'Rogue', description: 'Poison-grooved blade', icon: '🗡️', baseStats: { ATK: 75, CRITCHANCE: 20, CRITDMG: 30, ATTACKSPEED: 15 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 3 }, { itemId: 'wyrm-leather', quantity: 1 }] },
  { id: 'deaths-whisper', name: "Death's Whisper", tier: 8, category: 'dagger', subCategory: 'dagger', profession: 'Rogue', description: 'Silent killing edge', icon: '🗡️', baseStats: { ATK: 200, CRITCHANCE: 30, CRITDMG: 60, ATTACKSPEED: 25, ARMORPEN: 20 }, ingredients: [{ itemId: 'divine-ingot', quantity: 4 }, { itemId: 'divine-leather', quantity: 1 }, { itemId: 'divine-gem', quantity: 1 }] },

  // === BOWS ===
  { id: 'hunting-bow', name: 'Hunting Bow', tier: 1, category: 'bow', subCategory: 'bow-short', profession: 'Ranger', description: 'Simple hunting weapon', icon: '🏹', baseStats: { ATK: 14, RANGE: 200 }, ingredients: [{ itemId: 'pine-plank', quantity: 2 }, { itemId: 'string', quantity: 2 }] },
  { id: 'shortbow', name: 'Shortbow', tier: 2, category: 'bow', subCategory: 'bow-short', profession: 'Ranger', description: 'Compact ranged weapon', icon: '🏹', baseStats: { ATK: 26, RANGE: 220 }, ingredients: [{ itemId: 'oak-plank', quantity: 3 }, { itemId: 'bowstring', quantity: 1 }] },
  { id: 'elven-longbow', name: 'Elven Longbow', tier: 5, category: 'bow', subCategory: 'bow-long', profession: 'Ranger', description: 'Ancient elven design', icon: '🏹', baseStats: { ATK: 88, RANGE: 300, CRITCHANCE: 10, ACCURACY: 15 }, ingredients: [{ itemId: 'ironwood-plank', quantity: 4 }, { itemId: 'silk-string', quantity: 2 }, { itemId: 'wyrm-leather', quantity: 1 }] },
  { id: 'yggdrasil-bow', name: 'Yggdrasil Bow', tier: 8, category: 'bow', subCategory: 'bow-war', profession: 'Ranger', description: 'World tree weapon', icon: '🏹', baseStats: { ATK: 230, RANGE: 400, CRITCHANCE: 18, CRITDMG: 40, ACCURACY: 25 }, ingredients: [{ itemId: 'worldtree-plank', quantity: 6 }, { itemId: 'dragon-sinew', quantity: 3 }, { itemId: 'divine-leather', quantity: 1 }] },

  // === WANDS ===
  { id: 'pine-wand', name: 'Pine Wand', tier: 1, category: 'wand', subCategory: 'wand', profession: 'Mage', description: 'Basic channeling wand', icon: '🪄', baseStats: { MATK: 15 }, ingredients: [{ itemId: 'pine-plank', quantity: 1 }, { itemId: 'minor-essence', quantity: 2 }] },
  { id: 'oak-wand', name: 'Oak Wand', tier: 2, category: 'wand', subCategory: 'wand', profession: 'Mage', description: 'Sturdy focus wand', icon: '🪄', baseStats: { MATK: 28 }, ingredients: [{ itemId: 'oak-plank', quantity: 2 }, { itemId: 'lesser-essence', quantity: 2 }] },
  { id: 'elder-wand', name: 'Elder Wand', tier: 4, category: 'wand', subCategory: 'wand', profession: 'Mage', description: 'Ancient power focus', icon: '🪄', baseStats: { MATK: 68, CRITCHANCE: 5 }, ingredients: [{ itemId: 'ash-plank', quantity: 3 }, { itemId: 'superior-essence', quantity: 2 }] },
  { id: 'divine-wand', name: 'Divine Wand', tier: 8, category: 'wand', subCategory: 'wand', profession: 'Mage', description: 'Holy power focus', icon: '🪄', baseStats: { MATK: 245, CRITCHANCE: 15, CRITDMG: 40 }, ingredients: [{ itemId: 'worldtree-plank', quantity: 4 }, { itemId: 'divine-essence', quantity: 3 }, { itemId: 'divine-cloth', quantity: 1 }] },

  // === ORBS ===
  { id: 'glass-orb', name: 'Glass Orb', tier: 1, category: 'orb', subCategory: 'orb', profession: 'Mage', description: 'Clear focus sphere', icon: '🔮', baseStats: { MATK: 12 }, ingredients: [{ itemId: 'rough-gem', quantity: 1 }, { itemId: 'linen-cloth', quantity: 1 }] },
  { id: 'crystal-ball', name: 'Crystal Ball', tier: 2, category: 'orb', subCategory: 'orb', profession: 'Mage', description: 'Scrying sphere', icon: '🔮', baseStats: { MATK: 24 }, ingredients: [{ itemId: 'flawed-gem', quantity: 2 }, { itemId: 'wool-cloth', quantity: 1 }] },
  { id: 'starlight-sphere', name: 'Starlight Sphere', tier: 5, category: 'orb', subCategory: 'orb', profession: 'Mage', description: 'Celestial orb', icon: '🔮', baseStats: { MATK: 85, CRITCHANCE: 10 }, ingredients: [{ itemId: 'pristine-gem', quantity: 2 }, { itemId: 'moonweave-cloth', quantity: 1 }] },
  { id: 'divine-sphere', name: 'Divine Sphere', tier: 8, category: 'orb', subCategory: 'orb', profession: 'Mage', description: 'Holy power sphere', icon: '🔮', baseStats: { MATK: 230, CRITCHANCE: 18, CRITDMG: 35 }, ingredients: [{ itemId: 'divine-gem', quantity: 2 }, { itemId: 'divine-cloth', quantity: 1 }] },

  // === STAFFS ===
  { id: 'quarterstaff', name: 'Quarterstaff', tier: 1, category: 'staff', subCategory: 'staff-battle', profession: 'Mage', description: 'Wooden fighting staff', icon: '🪄', baseStats: { ATK: 12, MATK: 8 }, ingredients: [{ itemId: 'pine-plank', quantity: 3 }, { itemId: 'string', quantity: 1 }] },
  { id: 'druid-staff', name: 'Druid Staff', tier: 3, category: 'staff', subCategory: 'staff-magic', profession: 'Mage', description: 'Nature-touched staff', icon: '🪄', baseStats: { ATK: 35, MATK: 25 }, ingredients: [{ itemId: 'maple-plank', quantity: 4 }, { itemId: 'greater-essence', quantity: 1 }] },
  { id: 'treant-staff', name: 'Treant Staff', tier: 5, category: 'staff', subCategory: 'staff-magic', profession: 'Mage', description: 'Living wood staff', icon: '🪄', baseStats: { ATK: 72, MATK: 55 }, ingredients: [{ itemId: 'ironwood-plank', quantity: 5 }, { itemId: 'refined-essence', quantity: 2 }] },
  { id: 'yggdrasil-staff', name: 'Yggdrasil Staff', tier: 8, category: 'staff', subCategory: 'staff-magic', profession: 'Mage', description: 'World tree staff', icon: '🪄', baseStats: { ATK: 190, MATK: 150 }, ingredients: [{ itemId: 'worldtree-plank', quantity: 7 }, { itemId: 'divine-essence', quantity: 2 }] },

  // === SPEARS ===
  { id: 'javelin', name: 'Javelin', tier: 1, category: 'spear', subCategory: 'spear', profession: 'Warrior', description: 'Throwing spear', icon: '🔱', baseStats: { ATK: 16, RANGE: 150 }, ingredients: [{ itemId: 'pine-plank', quantity: 2 }, { itemId: 'copper-ingot', quantity: 1 }] },
  { id: 'halberd', name: 'Halberd', tier: 4, category: 'spear', subCategory: 'halberd', profession: 'Warrior', description: 'Axe-spear hybrid', icon: '🔱', baseStats: { ATK: 70, RANGE: 180 }, ingredients: [{ itemId: 'ash-plank', quantity: 4 }, { itemId: 'mithril-ingot', quantity: 2 }] },
  { id: 'naginata', name: 'Naginata', tier: 5, category: 'spear', subCategory: 'polearm', profession: 'Warrior', description: 'Japanese pole weapon', icon: '🔱', baseStats: { ATK: 98, RANGE: 200 }, ingredients: [{ itemId: 'ironwood-plank', quantity: 4 }, { itemId: 'adamantine-ingot', quantity: 2 }] },
  { id: 'gungnir', name: 'Gungnir', tier: 8, category: 'spear', subCategory: 'spear', profession: 'Warrior', description: "Odin's divine spear", icon: '🔱', baseStats: { ATK: 260, RANGE: 250, ARMORPEN: 25, ACCURACY: 100 }, ingredients: [{ itemId: 'worldtree-plank', quantity: 6 }, { itemId: 'divine-ingot', quantity: 3 }, { itemId: 'divine-essence', quantity: 1 }] },

  // === HAMMERS ===
  { id: 'mallet', name: 'Mallet', tier: 1, category: 'hammer', subCategory: 'hammer-1h', profession: 'Warrior', description: 'Light work hammer', icon: '🔨', baseStats: { ATK: 14, STAGGER: 5 }, ingredients: [{ itemId: 'copper-ingot', quantity: 2 }, { itemId: 'pine-plank', quantity: 1 }] },
  { id: 'sledgehammer', name: 'Sledgehammer', tier: 1, category: 'hammer', subCategory: 'hammer-2h', profession: 'Warrior', description: 'Heavy demolition hammer', icon: '⚒️', baseStats: { ATK: 20, STAGGER: 10 }, ingredients: [{ itemId: 'copper-ingot', quantity: 4 }, { itemId: 'pine-plank', quantity: 2 }] },
  { id: 'titan-hammer', name: 'Titan Hammer', tier: 5, category: 'hammer', subCategory: 'hammer-2h', profession: 'Warrior', description: "Giant's weapon", icon: '⚒️', baseStats: { ATK: 130, STAGGER: 25 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 7 }, { itemId: 'ironwood-plank', quantity: 2 }, { itemId: 'clockwork-core', quantity: 1 }] },
  { id: 'mjolnir', name: 'Mjolnir', tier: 8, category: 'hammer', subCategory: 'hammer-1h', profession: 'Warrior', description: "Thor's divine hammer", icon: '🔨', baseStats: { ATK: 230, STAGGER: 40, ARMORPEN: 20, CRITCHANCE: 10 }, ingredients: [{ itemId: 'divine-ingot', quantity: 5 }, { itemId: 'worldtree-plank', quantity: 1 }, { itemId: 'divine-gear', quantity: 1 }] },
  { id: 'godforge-hammer', name: 'Godforge Hammer', tier: 8, category: 'hammer', subCategory: 'hammer-2h', profession: 'Warrior', description: "Divine smith's hammer", icon: '⚒️', baseStats: { ATK: 345, STAGGER: 50, ARMORPEN: 30 }, ingredients: [{ itemId: 'divine-ingot', quantity: 9 }, { itemId: 'worldtree-plank', quantity: 2 }, { itemId: 'divine-gear', quantity: 2 }] },

  // === GUNS ===
  { id: 'flintlock-pistol', name: 'Flintlock Pistol', tier: 1, category: 'gun', subCategory: 'pistol', profession: 'Ranger', description: 'Single-shot firearm', icon: '🔫', baseStats: { ATK: 18, RANGE: 150, ARMORPEN: 5 }, ingredients: [{ itemId: 'copper-ingot', quantity: 2 }, { itemId: 'gunpowder', quantity: 2 }, { itemId: 'lens', quantity: 1 }] },
  { id: 'revolver', name: 'Revolver', tier: 3, category: 'gun', subCategory: 'pistol', profession: 'Ranger', description: 'Six-shooter pistol', icon: '🔫', baseStats: { ATK: 55, RANGE: 180, ARMORPEN: 10, ATTACKSPEED: 10 }, ingredients: [{ itemId: 'steel-ingot', quantity: 4 }, { itemId: 'black-powder', quantity: 3 }, { itemId: 'spring', quantity: 2 }] },
  { id: 'clockwork-pistol', name: 'Clockwork Pistol', tier: 5, category: 'gun', subCategory: 'pistol', profession: 'Ranger', description: 'Mechanical marvel', icon: '🔫', baseStats: { ATK: 115, RANGE: 200, ARMORPEN: 15, ATTACKSPEED: 20 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 5 }, { itemId: 'thunder-powder', quantity: 3 }, { itemId: 'clockwork-core', quantity: 1 }] },
  { id: 'divine-pistol', name: 'Divine Pistol', tier: 8, category: 'gun', subCategory: 'pistol', profession: 'Ranger', description: 'Holy handcannon', icon: '🔫', baseStats: { ATK: 305, RANGE: 280, ARMORPEN: 30, ATTACKSPEED: 25, CRITCHANCE: 15 }, ingredients: [{ itemId: 'divine-ingot', quantity: 6 }, { itemId: 'divine-powder', quantity: 5 }, { itemId: 'quantum-circuit', quantity: 2 }] },
  { id: 'musket', name: 'Musket', tier: 1, category: 'gun', subCategory: 'rifle', profession: 'Ranger', description: 'Basic long gun', icon: '🎯', baseStats: { ATK: 22, RANGE: 250, ARMORPEN: 8 }, ingredients: [{ itemId: 'copper-ingot', quantity: 3 }, { itemId: 'gunpowder', quantity: 3 }, { itemId: 'oak-plank', quantity: 2 }] },
  { id: 'bolt-action', name: 'Bolt Action Rifle', tier: 5, category: 'gun', subCategory: 'rifle', profession: 'Ranger', description: 'Precision rifle', icon: '🎯', baseStats: { ATK: 140, RANGE: 350, ARMORPEN: 20, CRITCHANCE: 12 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 6 }, { itemId: 'thunder-powder', quantity: 4 }, { itemId: 'ironwood-plank', quantity: 2 }] },
  { id: 'divine-rifle', name: 'Divine Rifle', tier: 8, category: 'gun', subCategory: 'rifle', profession: 'Ranger', description: 'Holy long rifle', icon: '🎯', baseStats: { ATK: 375, RANGE: 450, ARMORPEN: 35, CRITCHANCE: 20, CRITDMG: 50 }, ingredients: [{ itemId: 'divine-ingot', quantity: 8 }, { itemId: 'divine-powder', quantity: 6 }, { itemId: 'arcane-lens', quantity: 3 }] },
  { id: 'blunderbuss', name: 'Blunderbuss', tier: 1, category: 'gun', subCategory: 'shotgun', profession: 'Ranger', description: 'Spread-shot firearm', icon: '💥', baseStats: { ATK: 24, RANGE: 100, ARMORPEN: 3 }, ingredients: [{ itemId: 'copper-ingot', quantity: 3 }, { itemId: 'gunpowder', quantity: 4 }, { itemId: 'spring', quantity: 1 }] },
  { id: 'combat-shotgun', name: 'Combat Shotgun', tier: 5, category: 'gun', subCategory: 'shotgun', profession: 'Ranger', description: 'Military shotgun', icon: '💥', baseStats: { ATK: 150, RANGE: 150, ARMORPEN: 12, STAGGER: 15 }, ingredients: [{ itemId: 'adamantine-ingot', quantity: 7 }, { itemId: 'thunder-powder', quantity: 5 }, { itemId: 'clockwork-core', quantity: 1 }] },
  { id: 'divine-shotgun', name: 'Divine Shotgun', tier: 8, category: 'gun', subCategory: 'shotgun', profession: 'Ranger', description: 'Holy scattergun', icon: '💥', baseStats: { ATK: 400, RANGE: 200, ARMORPEN: 25, STAGGER: 30 }, ingredients: [{ itemId: 'divine-ingot', quantity: 9 }, { itemId: 'divine-powder', quantity: 7 }, { itemId: 'quantum-circuit', quantity: 3 }] },
];

// === ARMOR DEFINITIONS ===
// Based on armor_with_drops.csv from data-exports
export const ARMOR: Armor[] = [
  // === PLATE HELMS ===
  { id: 'copper-helm', name: 'Copper Helm', tier: 1, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 8, HEALTH: 20 }, dropInfo: { dropRate: 15.0, dropSource: 'Goblins, Bandits', dropNode: 'Bandit Camp|Goblin Cave', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic metal helm' },
  { id: 'iron-helm', name: 'Iron Helm', tier: 2, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 15, HEALTH: 35 }, dropInfo: { dropRate: 8.0, dropSource: 'Orc Warriors, Knights', dropNode: 'Orc Fort|Castle', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Sturdy iron helm' },
  { id: 'steel-helm', name: 'Steel Helm', tier: 3, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 25, HEALTH: 55 }, dropInfo: { dropRate: 5.0, dropSource: 'Elite Guards, Champions', dropNode: 'Fortress|Arena', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 6 }, notes: 'Heavy steel helm' },
  { id: 'mithril-helm', name: 'Mithril Helm', tier: 4, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 40, HEALTH: 80, MDEF: 15 }, dropInfo: { dropRate: 4.0, dropSource: 'Enchanted Knights, Mithril Golems', dropNode: 'Magic Castle|Mithril Mine', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Magical helm' },
  { id: 'adamantine-helm', name: 'Adamantine Helm', tier: 5, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 60, HEALTH: 120, MDEF: 25 }, dropInfo: { dropRate: 3.0, dropSource: 'Adamantine Guards, Dragon Knights', dropNode: 'Deep Fortress|Dragon Gate', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Legendary helm' },
  { id: 'orichalcum-helm', name: 'Orichalcum Helm', tier: 6, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 85, HEALTH: 175, MDEF: 40 }, dropInfo: { dropRate: 2.5, dropSource: 'Titan Guards, Ancient Warriors', dropNode: 'Titan Hall|Ancient Ruins', dropActivity: 'Raid Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Ancient helm' },
  { id: 'starmetal-helm', name: 'Starmetal Helm', tier: 7, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 115, HEALTH: 250, MDEF: 60 }, dropInfo: { dropRate: 2.0, dropSource: 'Celestial Knights, Star Guards', dropNode: 'Star Temple|Celestial Gate', dropActivity: 'World Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Celestial helm' },
  { id: 'divine-helm', name: 'Divine Helm', tier: 8, slot: 'Head', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 160, HEALTH: 350, MDEF: 90, HEALTHREGEN: 5 }, dropInfo: { dropRate: 1.0, dropSource: "Divine Warrior, God's Champion", dropNode: 'Divine Arena|Holy Sanctum', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy helm' },

  // === PLATE CHESTPLATES ===
  { id: 'copper-chestplate', name: 'Copper Chestplate', tier: 1, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 15, HEALTH: 40 }, dropInfo: { dropRate: 15.0, dropSource: 'Armored Goblins, Bandit Leaders', dropNode: 'Bandit Hideout|Goblin King', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic chest armor' },
  { id: 'iron-chestplate', name: 'Iron Chestplate', tier: 2, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 28, HEALTH: 70 }, dropInfo: { dropRate: 8.0, dropSource: 'Orc Chiefs, Knight Captains', dropNode: 'Orc Stronghold|Knight Barracks', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Sturdy chest armor' },
  { id: 'steel-chestplate', name: 'Steel Chestplate', tier: 3, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 45, HEALTH: 110 }, dropInfo: { dropRate: 5.0, dropSource: 'Elite Commanders, Arena Champions', dropNode: 'War Room|Grand Arena', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 6 }, notes: 'Heavy chest armor' },
  { id: 'mithril-chestplate', name: 'Mithril Chestplate', tier: 4, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 70, HEALTH: 160, MDEF: 25 }, dropInfo: { dropRate: 4.0, dropSource: 'Mithril Knights, Enchanted Guardians', dropNode: 'Crystal Palace|Magic Vault', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Magical chest armor' },
  { id: 'adamantine-chestplate', name: 'Adamantine Chestplate', tier: 5, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 105, HEALTH: 230, MDEF: 40 }, dropInfo: { dropRate: 3.0, dropSource: 'Legendary Knights, Dragon Riders', dropNode: 'Dragon Roost|Legend Hall', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Legendary chest armor' },
  { id: 'orichalcum-chestplate', name: 'Orichalcum Chestplate', tier: 6, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 145, HEALTH: 320, MDEF: 60 }, dropInfo: { dropRate: 2.5, dropSource: 'Titan Warriors, Ancient Champions', dropNode: 'Titan Throne|Ancient Arena', dropActivity: 'Raid Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Ancient chest armor' },
  { id: 'starmetal-chestplate', name: 'Starmetal Chestplate', tier: 7, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 195, HEALTH: 450, MDEF: 85 }, dropInfo: { dropRate: 2.0, dropSource: 'Star Knights, Celestial Champions', dropNode: 'Celestial Arena|Star Forge', dropActivity: 'World Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Celestial chest armor' },
  { id: 'divine-chestplate', name: 'Divine Chestplate', tier: 8, slot: 'Chest', armorType: 'Plate', profession: 'Warrior', baseStats: { DEF: 270, HEALTH: 600, MDEF: 120, HEALTHREGEN: 10 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine Champion, War God', dropNode: 'Divine Forge|Holy War', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy chest armor' },

  // === LEATHER ARMOR ===
  { id: 'leather-cap', name: 'Leather Cap', tier: 1, slot: 'Head', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 5, EVASION: 3 }, dropInfo: { dropRate: 15.0, dropSource: 'Scouts, Hunters', dropNode: 'Forest|Hunting Ground', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic leather helm' },
  { id: 'hardened-leather-cap', name: 'Hardened Leather Cap', tier: 4, slot: 'Head', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 25, EVASION: 12 }, dropInfo: { dropRate: 4.0, dropSource: 'Elite Rangers, War Scouts', dropNode: 'War Camp|Ranger HQ', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Reinforced leather helm' },
  { id: 'wyrm-leather-cap', name: 'Wyrm Leather Cap', tier: 5, slot: 'Head', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 38, EVASION: 18, RESISTANCE: 10 }, dropInfo: { dropRate: 3.0, dropSource: 'Dragon Hunters, Wyrm Riders', dropNode: 'Dragon Territory|Wyrm Nest', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Dragon leather helm' },
  { id: 'divine-leather-cap', name: 'Divine Leather Cap', tier: 8, slot: 'Head', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 95, EVASION: 35, RESISTANCE: 30 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine Hunter, Nature God', dropNode: 'Divine Hunt|Holy Forest', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy leather helm' },
  { id: 'leather-vest', name: 'Leather Vest', tier: 1, slot: 'Chest', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 10, EVASION: 5 }, dropInfo: { dropRate: 15.0, dropSource: 'Bandits, Rogues', dropNode: 'Road|Thieves Guild', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic leather chest' },
  { id: 'wyrm-leather-vest', name: 'Wyrm Leather Vest', tier: 5, slot: 'Chest', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 65, EVASION: 25, RESISTANCE: 15 }, dropInfo: { dropRate: 3.0, dropSource: 'Shadow Dragons, Dark Riders', dropNode: 'Shadow Realm|Dragon Shadow', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Dragon leather chest' },
  { id: 'divine-leather-vest', name: 'Divine Leather Vest', tier: 8, slot: 'Chest', armorType: 'Leather', profession: 'Ranger', baseStats: { DEF: 160, EVASION: 50, RESISTANCE: 45 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine Rogue, Shadow God', dropNode: 'Divine Shadows|Holy Thieves', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy leather chest' },

  // === CLOTH ARMOR ===
  { id: 'linen-hood', name: 'Linen Hood', tier: 1, slot: 'Head', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 8, MANA: 15 }, dropInfo: { dropRate: 15.0, dropSource: 'Apprentice Mages, Cultists', dropNode: 'Mage Tower|Cult Lair', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic cloth helm' },
  { id: 'silk-hood', name: 'Silk Hood', tier: 4, slot: 'Head', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 35, MANA: 60 }, dropInfo: { dropRate: 4.0, dropSource: 'Archmages, High Priests', dropNode: 'Grand Temple|Arcane Library', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Luxury cloth helm' },
  { id: 'moonweave-hood', name: 'Moonweave Hood', tier: 5, slot: 'Head', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 52, MANA: 90, MANAREGEN: 3 }, dropInfo: { dropRate: 3.0, dropSource: 'Moon Mages, Lunar Priests', dropNode: 'Moon Temple|Lunar Altar', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Lunar cloth helm' },
  { id: 'divine-hood', name: 'Divine Hood', tier: 8, slot: 'Head', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 130, MANA: 200, MANAREGEN: 10 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine Mage, Magic God', dropNode: 'Divine Temple|Holy Altar', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy cloth helm' },
  { id: 'linen-robe', name: 'Linen Robe', tier: 1, slot: 'Chest', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 12, MANA: 25 }, dropInfo: { dropRate: 15.0, dropSource: 'Mages, Priests', dropNode: 'Temple|Magic School', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic cloth chest' },
  { id: 'silk-robe', name: 'Silk Robe', tier: 4, slot: 'Chest', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 55, MANA: 100 }, dropInfo: { dropRate: 4.0, dropSource: 'Grand Mages, Arch Priests', dropNode: 'Grand Cathedral|Magic Castle', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Luxury cloth chest' },
  { id: 'moonweave-robe', name: 'Moonweave Robe', tier: 5, slot: 'Chest', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 85, MANA: 150, MANAREGEN: 5 }, dropInfo: { dropRate: 3.0, dropSource: 'Lunar Mages, Moon Priests', dropNode: 'Lunar Palace|Moon Sanctum', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Lunar cloth chest' },
  { id: 'divine-robe', name: 'Divine Robe', tier: 8, slot: 'Chest', armorType: 'Cloth', profession: 'Mage', baseStats: { MDEF: 210, MANA: 350, MANAREGEN: 15 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine High Mage, God of Wisdom', dropNode: 'Divine Palace|Holy Sanctum', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy cloth chest' },

  // === SHIELDS ===
  { id: 'copper-shield', name: 'Copper Shield', tier: 1, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 12, BLOCK: 10 }, dropInfo: { dropRate: 15.0, dropSource: 'Goblin Shieldbearers, Bandit Guards', dropNode: 'Bandit Camp|Goblin Fort', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Basic shield' },
  { id: 'iron-shield', name: 'Iron Shield', tier: 2, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 22, BLOCK: 15 }, dropInfo: { dropRate: 8.0, dropSource: 'Orc Defenders, Knight Guards', dropNode: 'Orc Fort|Castle Guard', dropActivity: 'Combat', guaranteed100: false, minHeroLevel: 1 }, notes: 'Sturdy shield' },
  { id: 'steel-shield', name: 'Steel Shield', tier: 3, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 38, BLOCK: 22 }, dropInfo: { dropRate: 5.0, dropSource: 'Elite Defenders, Arena Guards', dropNode: 'Fortress|Arena', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 6 }, notes: 'Heavy shield' },
  { id: 'mithril-shield', name: 'Mithril Shield', tier: 4, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 58, BLOCK: 30, MDEF: 20 }, dropInfo: { dropRate: 4.0, dropSource: 'Mithril Guards, Enchanted Defenders', dropNode: 'Magic Castle|Mithril Hall', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 11 }, notes: 'Magical shield' },
  { id: 'adamantine-shield', name: 'Adamantine Shield', tier: 5, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 85, BLOCK: 40, MDEF: 30 }, dropInfo: { dropRate: 3.0, dropSource: 'Legendary Defenders, Dragon Guards', dropNode: 'Deep Fortress|Dragon Hall', dropActivity: 'Combat|Boss', guaranteed100: false, minHeroLevel: 16 }, notes: 'Legendary shield' },
  { id: 'orichalcum-shield', name: 'Orichalcum Shield', tier: 6, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 120, BLOCK: 50, MDEF: 45 }, dropInfo: { dropRate: 2.5, dropSource: 'Titan Defenders, Ancient Guards', dropNode: 'Titan Hall|Ancient Gate', dropActivity: 'Raid Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Ancient shield' },
  { id: 'starmetal-shield', name: 'Starmetal Shield', tier: 7, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 165, BLOCK: 62, MDEF: 65 }, dropInfo: { dropRate: 2.0, dropSource: 'Celestial Defenders, Star Guards', dropNode: 'Star Temple|Celestial Hall', dropActivity: 'World Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Celestial shield' },
  { id: 'divine-shield', name: 'Divine Shield', tier: 8, slot: 'OffHand', armorType: 'Shield', profession: 'Warrior', baseStats: { DEF: 230, BLOCK: 75, MDEF: 90, HEALTHREGEN: 5 }, dropInfo: { dropRate: 1.0, dropSource: 'Divine Defender, Shield of Gods', dropNode: 'Divine Gate|Holy Hall', dropActivity: 'Divine Boss', guaranteed100: false, minHeroLevel: 20 }, notes: 'Holy shield' },
];

// === HELPER FUNCTIONS ===

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}

export function getArmorById(id: string): Armor | undefined {
  return ARMOR.find(a => a.id === id);
}

export function getWeaponsByTier(tier: ItemTier): Weapon[] {
  return WEAPONS.filter(w => w.tier === tier);
}

export function getArmorByTier(tier: ItemTier): Armor[] {
  return ARMOR.filter(a => a.tier === tier);
}

export function getWeaponsByCategory(category: WeaponCategory): Weapon[] {
  return WEAPONS.filter(w => w.category === category);
}

export function getArmorBySlot(slot: ArmorSlot): Armor[] {
  return ARMOR.filter(a => a.slot === slot);
}

export function getArmorByType(armorType: ArmorType): Armor[] {
  return ARMOR.filter(a => a.armorType === armorType);
}

export function getWeaponsByProfession(profession: WeaponProfession): Weapon[] {
  return WEAPONS.filter(w => w.profession === profession || w.profession === 'Universal');
}

export function getArmorByProfession(profession: ArmorProfession): Armor[] {
  return ARMOR.filter(a => a.profession === profession || a.profession === 'Universal');
}

// Get all equipment suitable for a hero class
export function getEquipmentForClass(heroClass: 'Warrior' | 'Mage' | 'Ranger' | 'Worg' | 'Rogue'): { weapons: Weapon[], armor: Armor[] } {
  return {
    weapons: getWeaponsByProfession(heroClass as WeaponProfession),
    armor: getArmorByProfession(heroClass as ArmorProfession),
  };
}

// Get starter equipment for a new character
export function getStarterEquipment(heroClass: 'Warrior' | 'Mage' | 'Ranger' | 'Worg' | 'Rogue'): { weapon: Weapon, armor: Armor[] } {
  const starterWeapons: Record<string, string> = {
    Warrior: 'rusty-shortsword',
    Mage: 'apprentice-wand',
    Ranger: 'training-bow',
    Worg: 'stone-knife',
    Rogue: 'stone-knife',
  };

  const starterArmorIds: Record<string, string[]> = {
    Warrior: ['copper-helm', 'copper-chestplate', 'copper-shield'],
    Mage: ['linen-hood', 'linen-robe'],
    Ranger: ['leather-cap', 'leather-vest'],
    Worg: ['leather-cap', 'leather-vest'],
    Rogue: ['leather-cap', 'leather-vest'],
  };

  return {
    weapon: getWeaponById(starterWeapons[heroClass]) || WEAPONS[0],
    armor: starterArmorIds[heroClass].map(id => getArmorById(id)).filter((a): a is Armor => a !== undefined),
  };
}

// Calculate total stats from all equipment
export function calculateTotalEquipmentStats(weapons: Weapon[], armor: Armor[]): { attack: number, magicAttack: number, defense: number, magicDefense: number, health: number, mana: number } {
  let attack = 0, magicAttack = 0, defense = 0, magicDefense = 0, health = 0, mana = 0;
  
  for (const weapon of weapons) {
    attack += weapon.baseStats.ATK || 0;
    magicAttack += weapon.baseStats.MATK || 0;
  }
  
  for (const piece of armor) {
    defense += piece.baseStats.DEF || 0;
    magicDefense += piece.baseStats.MDEF || 0;
    health += piece.baseStats.HEALTH || 0;
    mana += piece.baseStats.MANA || 0;
  }
  
  return { attack, magicAttack, defense, magicDefense, health, mana };
}
