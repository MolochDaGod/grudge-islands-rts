// ============================================
// EQUIPMENT TYPES
// Weapons, Armor, and Items from Grudge Warlords
// Based on data-exports CSVs
// ============================================

// Types from Grudge Warlords data exports

// === ITEM TIERS ===
export type ItemTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TIER_COLORS: Record<ItemTier, string> = {
  0: '#9ca3af', // Gray - Common
  1: '#ffffff', // White - Basic
  2: '#22c55e', // Green - Uncommon
  3: '#3b82f6', // Blue - Rare
  4: '#a855f7', // Purple - Epic
  5: '#f97316', // Orange - Legendary
  6: '#ef4444', // Red - Mythic
  7: '#89f7fe', // Cyan - Divine
  8: '#fbbf24', // Gold - Transcendent
};

export const TIER_NAMES: Record<ItemTier, string> = {
  0: 'Common',
  1: 'Basic',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
  6: 'Mythic',
  7: 'Divine',
  8: 'Transcendent',
};

// === WEAPON TYPES ===
export type WeaponCategory = 
  | 'sword' | 'axe' | 'dagger' | 'bow' | 'crossbow' 
  | 'staff' | 'spear' | 'wand' | 'orb' | 'hammer' 
  | 'gun' | 'blunt';

export type WeaponSubCategory = 
  | 'sword-1h' | 'sword-2h' 
  | 'axe-1h' | 'axe-2h' 
  | 'dagger' | 'dagger-thrown'
  | 'bow-short' | 'bow-long' | 'bow-war'
  | 'crossbow-hand' | 'crossbow-heavy'
  | 'staff-battle' | 'staff-magic'
  | 'spear' | 'polearm' | 'halberd'
  | 'wand' | 'orb' | 'tome'
  | 'hammer-1h' | 'hammer-2h' | 'mace'
  | 'pistol' | 'rifle' | 'shotgun'
  | 'blunt-1h' | 'blunt-2h';

export type WeaponProfession = 'Universal' | 'Warrior' | 'Mage' | 'Ranger' | 'Worg' | 'Rogue';

export interface WeaponStats {
  ATK?: number;
  MATK?: number;
  CRITCHANCE?: number;
  CRITDMG?: number;
  ATTACKSPEED?: number;
  RANGE?: number;
  ACCURACY?: number;
  LIFESTEAL?: number;
  ARMORPEN?: number;
  STAGGER?: number;
}

export interface WeaponIngredient {
  itemId: string;
  quantity: number;
}

export interface Weapon {
  id: string;
  name: string;
  tier: ItemTier;
  category: WeaponCategory;
  subCategory: WeaponSubCategory;
  profession: WeaponProfession;
  description: string;
  icon: string;
  baseStats: WeaponStats;
  ingredients: WeaponIngredient[];
  isEquipped?: boolean;
}

// === ARMOR TYPES ===
export type ArmorSlot = 'Head' | 'Chest' | 'Legs' | 'Feet' | 'Hands' | 'Shoulders' | 'OffHand';
export type ArmorType = 'Plate' | 'Leather' | 'Cloth' | 'Shield';
export type ArmorProfession = 'Universal' | 'Warrior' | 'Mage' | 'Ranger' | 'Worg' | 'Rogue' | 'Miner' | 'Woodcutter' | 'Herbalist';

export interface ArmorStats {
  DEF?: number;
  MDEF?: number;
  HEALTH?: number;
  MANA?: number;
  STAMINA?: number;
  BLOCK?: number;
  EVASION?: number;
  RESISTANCE?: number;
  HEALTHREGEN?: number;
  MANAREGEN?: number;
}

export interface ArmorDropInfo {
  dropRate: number;
  dropSource: string;
  dropNode: string;
  dropActivity: string;
  guaranteed100: boolean;
  minHeroLevel: number;
}

export interface Armor {
  id: string;
  name: string;
  tier: ItemTier;
  slot: ArmorSlot;
  armorType: ArmorType;
  profession: ArmorProfession;
  baseStats: ArmorStats;
  dropInfo?: ArmorDropInfo;
  notes?: string;
  isEquipped?: boolean;
}

// === EQUIPMENT SLOTS ===
export interface EquipmentSlots {
  mainHand: Weapon | null;
  offHand: Weapon | Armor | null; // Can be weapon (dual wield) or shield
  head: Armor | null;
  chest: Armor | null;
  legs: Armor | null;
  feet: Armor | null;
  hands: Armor | null;
  shoulders: Armor | null;
  accessory1: Item | null;
  accessory2: Item | null;
}

// === GENERAL ITEMS ===
export type ItemType = 'material' | 'consumable' | 'quest' | 'currency' | 'recipe' | 'key';

export interface Item {
  id: string;
  name: string;
  tier: ItemTier;
  type: ItemType;
  description: string;
  icon: string;
  stackable: boolean;
  maxStack: number;
  value: number; // Gold value
}

// === INVENTORY ===
export interface InventorySlot {
  item: Weapon | Armor | Item | null;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
  gold: number;
}

// === EQUIPMENT BONUS CALCULATION ===
export interface EquipmentBonuses {
  // From weapons
  attackPower: number;
  magicPower: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number;
  weaponRange: number;
  accuracy: number;
  lifesteal: number;
  armorPen: number;
  stagger: number;
  
  // From armor
  defense: number;
  magicDefense: number;
  health: number;
  mana: number;
  stamina: number;
  block: number;
  evasion: number;
  resistance: number;
  healthRegen: number;
  manaRegen: number;
}

// === HELPER FUNCTIONS ===
export function getEmptyEquipmentSlots(): EquipmentSlots {
  return {
    mainHand: null,
    offHand: null,
    head: null,
    chest: null,
    legs: null,
    feet: null,
    hands: null,
    shoulders: null,
    accessory1: null,
    accessory2: null,
  };
}

export function getEmptyInventory(maxSlots: number = 40): Inventory {
  return {
    slots: Array(maxSlots).fill(null).map(() => ({ item: null, quantity: 0 })),
    maxSlots,
    gold: 0,
  };
}

export function getEmptyEquipmentBonuses(): EquipmentBonuses {
  return {
    attackPower: 0,
    magicPower: 0,
    critChance: 0,
    critDamage: 0,
    attackSpeed: 0,
    weaponRange: 0,
    accuracy: 0,
    lifesteal: 0,
    armorPen: 0,
    stagger: 0,
    defense: 0,
    magicDefense: 0,
    health: 0,
    mana: 0,
    stamina: 0,
    block: 0,
    evasion: 0,
    resistance: 0,
    healthRegen: 0,
    manaRegen: 0,
  };
}

export function calculateEquipmentBonuses(slots: EquipmentSlots): EquipmentBonuses {
  const bonuses = getEmptyEquipmentBonuses();
  
  // Calculate weapon bonuses
  const processWeapon = (weapon: Weapon | null) => {
    if (!weapon) return;
    const stats = weapon.baseStats;
    bonuses.attackPower += stats.ATK || 0;
    bonuses.magicPower += stats.MATK || 0;
    bonuses.critChance += stats.CRITCHANCE || 0;
    bonuses.critDamage += stats.CRITDMG || 0;
    bonuses.attackSpeed += stats.ATTACKSPEED || 0;
    bonuses.weaponRange += stats.RANGE || 0;
    bonuses.accuracy += stats.ACCURACY || 0;
    bonuses.lifesteal += stats.LIFESTEAL || 0;
    bonuses.armorPen += stats.ARMORPEN || 0;
    bonuses.stagger += stats.STAGGER || 0;
  };
  
  processWeapon(slots.mainHand);
  if (slots.offHand && 'category' in slots.offHand) {
    processWeapon(slots.offHand as Weapon);
  }
  
  // Calculate armor bonuses
  const processArmor = (armor: Armor | null) => {
    if (!armor) return;
    const stats = armor.baseStats;
    bonuses.defense += stats.DEF || 0;
    bonuses.magicDefense += stats.MDEF || 0;
    bonuses.health += stats.HEALTH || 0;
    bonuses.mana += stats.MANA || 0;
    bonuses.stamina += stats.STAMINA || 0;
    bonuses.block += stats.BLOCK || 0;
    bonuses.evasion += stats.EVASION || 0;
    bonuses.resistance += stats.RESISTANCE || 0;
    bonuses.healthRegen += stats.HEALTHREGEN || 0;
    bonuses.manaRegen += stats.MANAREGEN || 0;
  };
  
  if (slots.offHand && 'armorType' in slots.offHand) {
    processArmor(slots.offHand as Armor);
  }
  processArmor(slots.head);
  processArmor(slots.chest);
  processArmor(slots.legs);
  processArmor(slots.feet);
  processArmor(slots.hands);
  processArmor(slots.shoulders);
  
  return bonuses;
}

// === ITEM RARITY SCALING ===
export function getTierMultiplier(tier: ItemTier): number {
  const multipliers: Record<ItemTier, number> = {
    0: 1.0,
    1: 1.2,
    2: 1.5,
    3: 2.0,
    4: 2.8,
    5: 4.0,
    6: 5.5,
    7: 7.5,
    8: 10.0,
  };
  return multipliers[tier];
}

export function getRequiredLevelForTier(tier: ItemTier): number {
  const levels: Record<ItemTier, number> = {
    0: 1,
    1: 1,
    2: 5,
    3: 10,
    4: 20,
    5: 35,
    6: 50,
    7: 70,
    8: 90,
  };
  return levels[tier];
}
