// ============================================
// BUILDING CONFIGURATION
// Production buildings, upgrades, and costs
// ============================================

import { GAME_CONFIG, type BuildingTypeId, type RaceId, type UpgradeDefinition } from './GameConfig.ts';
import { ALL_UNITS } from './UnitConfig.ts';

// === BUILDING DEFINITION ===

export interface BuildingDefinition {
  id: BuildingTypeId;
  name: string;
  description: string;
  
  // Base stats
  maxHealth: number;
  
  // Construction
  buildCost: number;
  buildTime: number;  // seconds
  
  // Level costs
  upgradeCosts: number[];  // Cost for level 2, 3
  upgradeTimes: number[];  // Time for level 2, 3
  
  // Production
  producesUnits: string[];      // Unit IDs that can be produced
  producesHeroes: boolean;      // Can recruit heroes?
  maxProductionQueue: number;   // Queue size
  
  // Available upgrades per level
  availableUpgrades: {
    level1: string[];
    level2: string[];
    level3: string[];
  };
  
  // Size
  width: number;
  height: number;
}

// === BUILDING DEFINITIONS ===

export const BUILDING_DEFINITIONS: Record<BuildingTypeId, BuildingDefinition> = {
  camp: {
    id: 'camp',
    name: 'Camp',
    description: 'Main base. Trains workers and basic soldiers. Higher levels allow more heroes.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE + 200,
    buildCost: 0,  // Starting building
    buildTime: 0,
    upgradeCosts: [500, 1000],
    upgradeTimes: [60, 120],
    producesUnits: ['worker', 'swordsman'],
    producesHeroes: true,
    maxProductionQueue: 5,
    availableUpgrades: {
      level1: ['improved_gathering'],
      level2: ['advanced_training', 'second_hero'],
      level3: ['master_craftsman', 'third_hero']
    },
    width: 96,
    height: 96
  },
  
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    description: 'Trains melee infantry and elite units. Upgrades improve attack and armor.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE,
    buildCost: 200,
    buildTime: 30,
    upgradeCosts: [400, 800],
    upgradeTimes: [45, 90],
    producesUnits: ['axeman', 'spearman', 'assassin', 'knight'],
    producesHeroes: false,
    maxProductionQueue: 5,
    availableUpgrades: {
      level1: ['iron_weapons', 'leather_armor'],
      level2: ['steel_weapons', 'chain_armor', 'combat_training'],
      level3: ['elite_weapons', 'plate_armor', 'battle_tactics']
    },
    width: 64,
    height: 64
  },
  
  archery: {
    id: 'archery',
    name: 'Archery Range',
    description: 'Trains ranged units. Upgrades improve range and damage.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE - 100,
    buildCost: 250,
    buildTime: 35,
    upgradeCosts: [450, 850],
    upgradeTimes: [50, 100],
    producesUnits: ['bowman', 'mage'],
    producesHeroes: false,
    maxProductionQueue: 4,
    availableUpgrades: {
      level1: ['improved_bows', 'fletching'],
      level2: ['longbows', 'fire_arrows', 'eagle_eye'],
      level3: ['composite_bows', 'enchanted_arrows', 'rapid_fire']
    },
    width: 64,
    height: 64
  },
  
  temple: {
    id: 'temple',
    name: 'Temple',
    description: 'Trains champion units and provides powerful auras. Grum available to all.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE + 100,
    buildCost: 400,
    buildTime: 60,
    upgradeCosts: [700, 1200],
    upgradeTimes: [75, 150],
    producesUnits: ['grum', 'necromancer'],  // necromancer only for undead
    producesHeroes: false,
    maxProductionQueue: 2,
    availableUpgrades: {
      level1: ['blessing_aura'],
      level2: ['divine_protection', 'mana_regeneration'],
      level3: ['holy_light', 'resurrection']
    },
    width: 80,
    height: 80
  },
  
  tower: {
    id: 'tower',
    name: 'Defense Tower',
    description: 'Automatically attacks nearby enemies.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE - 200,
    buildCost: 150,
    buildTime: 20,
    upgradeCosts: [250, 400],
    upgradeTimes: [30, 50],
    producesUnits: [],
    producesHeroes: false,
    maxProductionQueue: 0,
    availableUpgrades: {
      level1: ['improved_range'],
      level2: ['rapid_fire_tower', 'armor_piercing'],
      level3: ['flame_tower', 'frost_tower']
    },
    width: 48,
    height: 48
  },
  
  wall: {
    id: 'wall',
    name: 'Wall',
    description: 'Defensive barrier that blocks enemy movement.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE + 500,
    buildCost: 50,
    buildTime: 10,
    upgradeCosts: [100, 200],
    upgradeTimes: [15, 25],
    producesUnits: [],
    producesHeroes: false,
    maxProductionQueue: 0,
    availableUpgrades: {
      level1: [],
      level2: ['reinforced_walls'],
      level3: ['fortified_walls']
    },
    width: 32,
    height: 32
  },
  
  dock: {
    id: 'dock',
    name: 'Dock',
    description: 'Builds and repairs ships for naval warfare.',
    maxHealth: GAME_CONFIG.BUILDING_HP_BASE,
    buildCost: 300,
    buildTime: 45,
    upgradeCosts: [500, 900],
    upgradeTimes: [60, 120],
    producesUnits: [],  // Ships, not units
    producesHeroes: false,
    maxProductionQueue: 2,
    availableUpgrades: {
      level1: ['improved_hulls'],
      level2: ['ship_armor', 'naval_cannons'],
      level3: ['ironclad', 'siege_cannons']
    },
    width: 96,
    height: 64
  }
};

// === UPGRADE DEFINITIONS ===

export const UPGRADE_DEFINITIONS: Record<string, UpgradeDefinition> = {
  // Camp upgrades
  improved_gathering: {
    id: 'improved_gathering',
    name: 'Improved Gathering',
    description: 'Workers gather resources 25% faster',
    cost: 100,
    researchTime: 30,
    effects: [{ stat: 'speed', bonus: 25, isPercent: true }]
  },
  advanced_training: {
    id: 'advanced_training',
    name: 'Advanced Training',
    description: 'All units gain +10% health',
    cost: 200,
    researchTime: 45,
    effects: [{ stat: 'health', bonus: 10, isPercent: true }]
  },
  second_hero: {
    id: 'second_hero',
    name: 'Second Hero Slot',
    description: 'Allows recruiting a second hero',
    cost: 300,
    researchTime: 60,
    effects: []
  },
  master_craftsman: {
    id: 'master_craftsman',
    name: 'Master Craftsman',
    description: 'Buildings construct 20% faster',
    cost: 400,
    researchTime: 90,
    effects: []
  },
  third_hero: {
    id: 'third_hero',
    name: 'Third Hero Slot',
    description: 'Allows recruiting a third hero',
    cost: 500,
    researchTime: 120,
    effects: []
  },
  
  // Barracks upgrades
  iron_weapons: {
    id: 'iron_weapons',
    name: 'Iron Weapons',
    description: 'Melee units deal +2 damage',
    cost: 100,
    researchTime: 25,
    effects: [{ stat: 'attack', bonus: 2, isPercent: false }]
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Melee units gain +1 defense',
    cost: 100,
    researchTime: 25,
    effects: [{ stat: 'defense', bonus: 1, isPercent: false }]
  },
  steel_weapons: {
    id: 'steel_weapons',
    name: 'Steel Weapons',
    description: 'Melee units deal +4 damage',
    cost: 200,
    researchTime: 40,
    effects: [{ stat: 'attack', bonus: 4, isPercent: false }],
    requires: ['iron_weapons']
  },
  chain_armor: {
    id: 'chain_armor',
    name: 'Chain Armor',
    description: 'Melee units gain +2 defense',
    cost: 200,
    researchTime: 40,
    effects: [{ stat: 'defense', bonus: 2, isPercent: false }],
    requires: ['leather_armor']
  },
  combat_training: {
    id: 'combat_training',
    name: 'Combat Training',
    description: 'Melee units attack 15% faster',
    cost: 250,
    researchTime: 50,
    effects: [{ stat: 'speed', bonus: 15, isPercent: true }]
  },
  elite_weapons: {
    id: 'elite_weapons',
    name: 'Elite Weapons',
    description: 'Melee units deal +6 damage',
    cost: 350,
    researchTime: 60,
    effects: [{ stat: 'attack', bonus: 6, isPercent: false }],
    requires: ['steel_weapons']
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Plate Armor',
    description: 'Melee units gain +4 defense',
    cost: 350,
    researchTime: 60,
    effects: [{ stat: 'defense', bonus: 4, isPercent: false }],
    requires: ['chain_armor']
  },
  battle_tactics: {
    id: 'battle_tactics',
    name: 'Battle Tactics',
    description: 'Melee units gain +20% health',
    cost: 400,
    researchTime: 75,
    effects: [{ stat: 'health', bonus: 20, isPercent: true }]
  },
  
  // Archery upgrades
  improved_bows: {
    id: 'improved_bows',
    name: 'Improved Bows',
    description: 'Ranged units deal +2 damage',
    cost: 100,
    researchTime: 25,
    effects: [{ stat: 'attack', bonus: 2, isPercent: false }]
  },
  fletching: {
    id: 'fletching',
    name: 'Fletching',
    description: 'Ranged units gain +10% range',
    cost: 100,
    researchTime: 25,
    effects: [{ stat: 'range', bonus: 10, isPercent: true }]
  },
  longbows: {
    id: 'longbows',
    name: 'Longbows',
    description: 'Ranged units gain +20% range',
    cost: 200,
    researchTime: 40,
    effects: [{ stat: 'range', bonus: 20, isPercent: true }],
    requires: ['fletching']
  },
  fire_arrows: {
    id: 'fire_arrows',
    name: 'Fire Arrows',
    description: 'Ranged attacks deal bonus fire damage',
    cost: 250,
    researchTime: 50,
    effects: [{ stat: 'attack', bonus: 4, isPercent: false }]
  },
  eagle_eye: {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'Ranged units gain +25% accuracy (crit chance)',
    cost: 200,
    researchTime: 45,
    effects: []
  },
  composite_bows: {
    id: 'composite_bows',
    name: 'Composite Bows',
    description: 'Ranged units deal +6 damage',
    cost: 350,
    researchTime: 60,
    effects: [{ stat: 'attack', bonus: 6, isPercent: false }],
    requires: ['improved_bows']
  },
  enchanted_arrows: {
    id: 'enchanted_arrows',
    name: 'Enchanted Arrows',
    description: 'Arrows slow enemies by 20%',
    cost: 400,
    researchTime: 75,
    effects: []
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: 'Ranged units attack 25% faster',
    cost: 350,
    researchTime: 60,
    effects: [{ stat: 'speed', bonus: 25, isPercent: true }]
  },
  
  // Temple upgrades
  blessing_aura: {
    id: 'blessing_aura',
    name: 'Blessing Aura',
    description: 'Nearby friendly units regenerate health',
    cost: 200,
    researchTime: 40,
    effects: []
  },
  divine_protection: {
    id: 'divine_protection',
    name: 'Divine Protection',
    description: 'All units gain +3 defense',
    cost: 300,
    researchTime: 55,
    effects: [{ stat: 'defense', bonus: 3, isPercent: false }]
  },
  mana_regeneration: {
    id: 'mana_regeneration',
    name: 'Mana Regeneration',
    description: 'Heroes and mages regenerate mana faster',
    cost: 350,
    researchTime: 60,
    effects: []
  },
  holy_light: {
    id: 'holy_light',
    name: 'Holy Light',
    description: 'Champions deal +10 damage to monsters',
    cost: 450,
    researchTime: 80,
    effects: [{ stat: 'attack', bonus: 10, isPercent: false }]
  },
  resurrection: {
    id: 'resurrection',
    name: 'Resurrection',
    description: 'Heroes can resurrect once per battle',
    cost: 600,
    researchTime: 120,
    effects: []
  },
  
  // Tower upgrades
  improved_range: {
    id: 'improved_range',
    name: 'Improved Range',
    description: 'Tower range +20%',
    cost: 75,
    researchTime: 20,
    effects: [{ stat: 'range', bonus: 20, isPercent: true }]
  },
  rapid_fire_tower: {
    id: 'rapid_fire_tower',
    name: 'Rapid Fire',
    description: 'Tower attacks 30% faster',
    cost: 150,
    researchTime: 35,
    effects: [{ stat: 'speed', bonus: 30, isPercent: true }]
  },
  armor_piercing: {
    id: 'armor_piercing',
    name: 'Armor Piercing',
    description: 'Tower ignores 50% of enemy armor',
    cost: 200,
    researchTime: 45,
    effects: []
  },
  flame_tower: {
    id: 'flame_tower',
    name: 'Flame Tower',
    description: 'Tower deals fire damage in area',
    cost: 300,
    researchTime: 60,
    effects: []
  },
  frost_tower: {
    id: 'frost_tower',
    name: 'Frost Tower',
    description: 'Tower slows enemies by 40%',
    cost: 300,
    researchTime: 60,
    effects: []
  }
};

// === HELPER FUNCTIONS ===

export function getBuildingDefinition(buildingId: BuildingTypeId): BuildingDefinition {
  return BUILDING_DEFINITIONS[buildingId];
}

export function getUpgradeDefinition(upgradeId: string): UpgradeDefinition | undefined {
  return UPGRADE_DEFINITIONS[upgradeId];
}

export function getBuildingUpgradeCost(buildingId: BuildingTypeId, currentLevel: number): number {
  const building = BUILDING_DEFINITIONS[buildingId];
  if (currentLevel >= GAME_CONFIG.BUILDING_MAX_LEVEL) return Infinity;
  return building.upgradeCosts[currentLevel - 1] || 0;
}

export function getBuildingMaxHealth(buildingId: BuildingTypeId, level: number): number {
  const building = BUILDING_DEFINITIONS[buildingId];
  return building.maxHealth + (level - 1) * GAME_CONFIG.BUILDING_HP_PER_LEVEL;
}

export function getAvailableUpgrades(buildingId: BuildingTypeId, level: number): string[] {
  const building = BUILDING_DEFINITIONS[buildingId];
  switch (level) {
    case 1: return building.availableUpgrades.level1;
    case 2: return building.availableUpgrades.level2;
    case 3: return building.availableUpgrades.level3;
    default: return [];
  }
}

export function canBuildUnit(buildingId: BuildingTypeId, unitId: string, race: RaceId): boolean {
  const building = BUILDING_DEFINITIONS[buildingId];
  if (!building.producesUnits.includes(unitId)) return false;
  
  // Check race requirements for champions
  const unit = ALL_UNITS[unitId];
  if (!unit) return false;
  
  if (unit.raceRequired && unit.raceRequired.length > 0) {
    return unit.raceRequired.includes(race);
  }
  
  return true;
}
