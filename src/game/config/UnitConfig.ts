// ============================================
// UNIT CONFIGURATION
// All unit types: workers, soldiers, champions, monsters
// ============================================

import { GAME_CONFIG, type RaceId, type UnitCategory, SPRITE_PATHS } from './GameConfig.ts';

// === UNIT STAT INTERFACE ===

export interface UnitStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;     // attacks per second
  aggroRange: number;
}

// === UNIT DEFINITION ===

export interface UnitDefinition {
  id: string;
  name: string;
  category: UnitCategory;
  description: string;
  
  // Stats
  stats: UnitStats;
  
  // Production
  cost: number;
  trainTime: number;       // seconds
  buildingRequired: string;
  raceRequired?: RaceId[];  // Empty = all races, specific = only those races
  
  // Sprite
  spriteSheet: string;
  spriteSize: { width: number; height: number };
  animations: {
    idle: { row: number; frames: number };
    walk: { row: number; frames: number };
    attack: { row: number; frames: number };
    death?: { row: number; frames: number };
  };
  
  // Abilities
  abilities?: string[];
  
  // Loot (for monsters)
  loot?: {
    gold: { min: number; max: number };
    xp: number;
  };
}

// === WORKER UNITS ===

export const WORKER_UNITS: Record<string, UnitDefinition> = {
  worker: {
    id: 'worker',
    name: 'Worker',
    category: 'worker',
    description: 'Gathers resources and constructs buildings',
    stats: {
      health: 40,
      maxHealth: 40,
      attack: 5,
      defense: 0,
      speed: GAME_CONFIG.UNIT_SPEED_NORMAL,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 0.5,
      aggroRange: 50
    },
    cost: 50,
    trainTime: 10,
    buildingRequired: 'camp',
    spriteSheet: `${SPRITE_PATHS.WORKERS}/FarmerTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    }
  }
};

// === INFANTRY UNITS (Melee) ===

export const INFANTRY_UNITS: Record<string, UnitDefinition> = {
  swordsman: {
    id: 'swordsman',
    name: 'Swordsman',
    category: 'infantry',
    description: 'Basic melee fighter with balanced stats',
    stats: {
      health: 100,
      maxHealth: 100,
      attack: 12,
      defense: 5,
      speed: GAME_CONFIG.UNIT_SPEED_NORMAL,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.0,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 80,
    trainTime: 15,
    buildingRequired: 'camp',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_MELEE}/SwordsmanTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    }
  },
  
  axeman: {
    id: 'axeman',
    name: 'Axeman',
    category: 'infantry',
    description: 'Heavy melee fighter with high damage',
    stats: {
      health: 120,
      maxHealth: 120,
      attack: 18,
      defense: 3,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 0.8,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 120,
    trainTime: 20,
    buildingRequired: 'barracks',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_MELEE}/AxemanTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    }
  },
  
  spearman: {
    id: 'spearman',
    name: 'Spearman',
    category: 'infantry',
    description: 'Anti-cavalry specialist with extended reach',
    stats: {
      health: 80,
      maxHealth: 80,
      attack: 10,
      defense: 4,
      speed: GAME_CONFIG.UNIT_SPEED_NORMAL,
      attackRange: 60, // Longer than melee
      attackSpeed: 1.2,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 100,
    trainTime: 18,
    buildingRequired: 'barracks',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_MELEE}/SpearmanTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    }
  },
  
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    category: 'infantry',
    description: 'Fast striker with critical hits',
    stats: {
      health: 60,
      maxHealth: 60,
      attack: 20,
      defense: 1,
      speed: GAME_CONFIG.UNIT_SPEED_FAST,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.5,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 150,
    trainTime: 25,
    buildingRequired: 'barracks',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_MELEE}/AssasinTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['critical_strike']
  }
};

// === RANGED UNITS ===

export const RANGED_UNITS: Record<string, UnitDefinition> = {
  bowman: {
    id: 'bowman',
    name: 'Bowman',
    category: 'ranged',
    description: 'Basic ranged attacker',
    stats: {
      health: 60,
      maxHealth: 60,
      attack: 10,
      defense: 2,
      speed: GAME_CONFIG.UNIT_SPEED_NORMAL,
      attackRange: GAME_CONFIG.ATTACK_RANGE_RANGED,
      attackSpeed: 0.8,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 100,
    trainTime: 18,
    buildingRequired: 'archery',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_RANGED}/BowmanTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    }
  },
  
  mage: {
    id: 'mage',
    name: 'Battle Mage',
    category: 'ranged',
    description: 'Magical ranged attacker with area damage',
    stats: {
      health: 50,
      maxHealth: 50,
      attack: 15,
      defense: 1,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: 180,
      attackSpeed: 0.6,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 150,
    trainTime: 25,
    buildingRequired: 'archery',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_RANGED}/MageTemplate.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['fireball']
  }
};

// === CAVALRY UNITS ===

export const CAVALRY_UNITS: Record<string, UnitDefinition> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    category: 'cavalry',
    description: 'Heavy mounted warrior',
    stats: {
      health: 150,
      maxHealth: 150,
      attack: 20,
      defense: 8,
      speed: GAME_CONFIG.UNIT_SPEED_FAST + 20,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 0.9,
      aggroRange: GAME_CONFIG.AGGRO_RANGE_DEFAULT
    },
    cost: 250,
    trainTime: 35,
    buildingRequired: 'barracks',
    spriteSheet: `${SPRITE_PATHS.SOLDIERS_MOUNTED}/CyanKnight.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['charge']
  }
};

// === CHAMPION UNITS (Temple) ===

export const CHAMPION_UNITS: Record<string, UnitDefinition> = {
  grum: {
    id: 'grum',
    name: 'Grum the Mage',
    category: 'champion',
    description: 'Powerful archmage available to all races. Casts devastating spells.',
    stats: {
      health: 120,
      maxHealth: 120,
      attack: 30,
      defense: 3,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: 220,
      attackSpeed: 0.5,
      aggroRange: 300
    },
    cost: 400,
    trainTime: 45,
    buildingRequired: 'temple',
    raceRequired: [], // All races
    spriteSheet: `${SPRITE_PATHS.CHAMPIONS}/Grum.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['meteor_strike', 'frost_nova', 'arcane_shield']
  },
  
  arthax: {
    id: 'arthax',
    name: 'Arthax',
    category: 'champion',
    description: 'Dwarven champion with high defense',
    stats: {
      health: 200,
      maxHealth: 200,
      attack: 25,
      defense: 15,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 0.7,
      aggroRange: 250
    },
    cost: 350,
    trainTime: 40,
    buildingRequired: 'barracks',
    raceRequired: ['dwarf'],
    spriteSheet: `${SPRITE_PATHS.CHAMPIONS}/Arthax.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['shield_wall', 'ground_slam']
  },
  
  zhinja: {
    id: 'zhinja',
    name: 'Zhinja',
    category: 'champion',
    description: 'Swift assassin champion',
    stats: {
      health: 100,
      maxHealth: 100,
      attack: 35,
      defense: 5,
      speed: GAME_CONFIG.UNIT_SPEED_FAST + 30,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.8,
      aggroRange: 200
    },
    cost: 350,
    trainTime: 40,
    buildingRequired: 'barracks',
    raceRequired: ['elf', 'human'],
    spriteSheet: `${SPRITE_PATHS.CHAMPIONS}/Zhinja.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['shadow_step', 'blade_fury']
  },
  
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    category: 'champion',
    description: 'Undead summoner and dark magic user',
    stats: {
      health: 80,
      maxHealth: 80,
      attack: 20,
      defense: 2,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: 200,
      attackSpeed: 0.6,
      aggroRange: 280
    },
    cost: 400,
    trainTime: 45,
    buildingRequired: 'temple',
    raceRequired: ['undead'],
    spriteSheet: `${SPRITE_PATHS.CHAMPIONS}/Necromancer.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['raise_dead', 'life_drain', 'death_coil']
  },
  
  katan: {
    id: 'katan',
    name: 'Katan',
    category: 'champion',
    description: 'Orcish berserker with rage abilities',
    stats: {
      health: 180,
      maxHealth: 180,
      attack: 30,
      defense: 5,
      speed: GAME_CONFIG.UNIT_SPEED_FAST,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.2,
      aggroRange: 250
    },
    cost: 350,
    trainTime: 40,
    buildingRequired: 'barracks',
    raceRequired: ['orc', 'barbarian'],
    spriteSheet: `${SPRITE_PATHS.CHAMPIONS}/Katan.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    abilities: ['berserker_rage', 'war_cry']
  }
};

// === MONSTER UNITS ===

export const MONSTER_UNITS: Record<string, UnitDefinition> = {
  // Orcs
  orc: {
    id: 'orc',
    name: 'Orc Grunt',
    category: 'monster',
    description: 'Basic orcish warrior',
    stats: {
      health: 80,
      maxHealth: 80,
      attack: 10,
      defense: 3,
      speed: GAME_CONFIG.UNIT_SPEED_NORMAL,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.0,
      aggroRange: 150
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_ORCS}/Orc.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    loot: { gold: { min: 10, max: 25 }, xp: 15 }
  },
  
  goblin_club: {
    id: 'goblin_club',
    name: 'Club Goblin',
    category: 'monster',
    description: 'Weak but numerous goblin',
    stats: {
      health: 40,
      maxHealth: 40,
      attack: 6,
      defense: 1,
      speed: GAME_CONFIG.UNIT_SPEED_FAST,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 1.2,
      aggroRange: 120
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_ORCS}/ClubGoblin.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    loot: { gold: { min: 5, max: 15 }, xp: 8 }
  },
  
  minotaur: {
    id: 'minotaur',
    name: 'Minotaur',
    category: 'monster',
    description: 'Powerful beast guardian',
    stats: {
      health: 300,
      maxHealth: 300,
      attack: 35,
      defense: 10,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: 50,
      attackSpeed: 0.6,
      aggroRange: 200
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_ORCS}/Minotaur.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    loot: { gold: { min: 50, max: 100 }, xp: 75 }
  },
  
  // Slimes
  slime: {
    id: 'slime',
    name: 'Slime',
    category: 'monster',
    description: 'Weak gelatinous creature',
    stats: {
      health: 30,
      maxHealth: 30,
      attack: 4,
      defense: 0,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW,
      attackRange: GAME_CONFIG.ATTACK_RANGE_MELEE,
      attackSpeed: 0.8,
      aggroRange: 80
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_SLIMES}/Slime.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 0, frames: 4 },
      attack: { row: 0, frames: 4 }
    },
    loot: { gold: { min: 3, max: 8 }, xp: 5 }
  },
  
  king_slime: {
    id: 'king_slime',
    name: 'King Slime',
    category: 'monster',
    description: 'Giant slime boss',
    stats: {
      health: 200,
      maxHealth: 200,
      attack: 20,
      defense: 5,
      speed: GAME_CONFIG.UNIT_SPEED_SLOW - 20,
      attackRange: 60,
      attackSpeed: 0.5,
      aggroRange: 150
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_SLIMES}/KingSlimeGreen.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 0, frames: 4 },
      attack: { row: 0, frames: 4 }
    },
    loot: { gold: { min: 40, max: 80 }, xp: 50 }
  },
  
  // Dragons
  red_dragon: {
    id: 'red_dragon',
    name: 'Red Dragon',
    category: 'monster',
    description: 'Fearsome fire-breathing dragon',
    stats: {
      health: 500,
      maxHealth: 500,
      attack: 50,
      defense: 15,
      speed: GAME_CONFIG.UNIT_SPEED_FAST,
      attackRange: 250,
      attackSpeed: 0.4,
      aggroRange: 350
    },
    cost: 0,
    trainTime: 0,
    buildingRequired: '',
    spriteSheet: `${SPRITE_PATHS.MONSTERS_DRAGONS}/RedDragon.png`,
    spriteSize: { width: 16, height: 16 },
    animations: {
      idle: { row: 0, frames: 4 },
      walk: { row: 1, frames: 4 },
      attack: { row: 2, frames: 4 }
    },
    loot: { gold: { min: 150, max: 300 }, xp: 200 },
    abilities: ['fire_breath']
  }
};

// === COMBINED UNIT LOOKUP ===

export const ALL_UNITS: Record<string, UnitDefinition> = {
  ...WORKER_UNITS,
  ...INFANTRY_UNITS,
  ...RANGED_UNITS,
  ...CAVALRY_UNITS,
  ...CHAMPION_UNITS,
  ...MONSTER_UNITS
};

// === HELPER FUNCTIONS ===

export function getUnitDefinition(unitId: string): UnitDefinition | undefined {
  return ALL_UNITS[unitId];
}

export function getUnitsForBuilding(buildingId: string): UnitDefinition[] {
  return Object.values(ALL_UNITS).filter(u => u.buildingRequired === buildingId);
}

export function getUnitsForRace(race: RaceId): UnitDefinition[] {
  return Object.values(ALL_UNITS).filter(u => {
    if (!u.raceRequired || u.raceRequired.length === 0) return true;
    return u.raceRequired.includes(race);
  });
}

export function getMonsters(): UnitDefinition[] {
  return Object.values(MONSTER_UNITS);
}

export function rollLoot(unit: UnitDefinition): { gold: number; xp: number } {
  if (!unit.loot) return { gold: 0, xp: 0 };
  
  const gold = Math.floor(
    unit.loot.gold.min + Math.random() * (unit.loot.gold.max - unit.loot.gold.min)
  );
  
  return { gold, xp: unit.loot.xp };
}
