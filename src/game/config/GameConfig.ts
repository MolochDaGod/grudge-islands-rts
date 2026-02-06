// ============================================
// GAME CONFIGURATION
// Global constants, resource rates, game settings
// ============================================

import type { FactionId } from '../../types/index.ts';

// === GAME SPEED & TIMING ===

export const GAME_CONFIG = {
  // Time settings
  TICK_RATE: 60,                    // Updates per second
  GAME_SPEED_MULTIPLIER: 1.0,       // Global speed multiplier
  
  // Resource income
  GOLD_PER_SECOND: 2,               // Base passive gold income
  GOLD_PER_NODE: 5,                 // Gold per captured node per second
  XP_KILL_BASE: 10,                 // Base XP for killing a unit
  XP_LEVEL_MULTIPLIER: 1.5,         // XP multiplier per enemy level
  
  // Hero settings
  HERO_BASE_XP_TO_LEVEL: 100,       // XP needed for level 2
  HERO_XP_SCALING: 1.5,             // XP requirement multiplier per level
  HERO_MAX_LEVEL: 20,               // Maximum hero level
  
  // Camp hero recruitment
  CAMP_LEVEL_1_HEROES: 1,           // Max heroes at camp level 1
  CAMP_LEVEL_2_HEROES: 2,           // Max heroes at camp level 2
  CAMP_LEVEL_3_HEROES: 3,           // Max heroes at camp level 3
  
  // Unit limits
  MAX_ARMY_SIZE: 50,                // Max combat units
  MAX_WORKERS: 10,                  // Max worker units
  
  // Combat settings
  AGGRO_RANGE_DEFAULT: 200,         // Default detection range
  ATTACK_RANGE_MELEE: 40,           // Melee attack range
  ATTACK_RANGE_RANGED: 200,         // Ranged attack range
  ATTACK_RANGE_SIEGE: 350,          // Siege weapon range
  
  // Movement
  UNIT_SPEED_SLOW: 60,              // Slow unit speed
  UNIT_SPEED_NORMAL: 80,            // Normal unit speed
  UNIT_SPEED_FAST: 100,             // Fast unit speed
  HERO_SPEED_BASE: 100,             // Hero base speed
  
  // Collision
  UNIT_COLLISION_RADIUS: 12,        // Default unit collision radius
  HERO_COLLISION_RADIUS: 20,        // Hero collision radius
  BUILDING_COLLISION_RADIUS: 40,    // Building collision radius
  
  // Boat settings
  BOAT_CAPACITY_SMALL: 5,           // Small boat capacity
  BOAT_CAPACITY_MEDIUM: 10,         // Medium boat capacity
  BOAT_CAPACITY_LARGE: 20,          // Large boat capacity
  BOAT_SPEED: 50,                   // Boat movement speed
  BOAT_TURRET_RANGE: 250,           // Auto-turret range
  BOAT_TURRET_DAMAGE: 15,           // Auto-turret damage
  BOAT_TURRET_COOLDOWN: 1500,       // Auto-turret cooldown (ms)
  
  // Building settings
  BUILDING_HP_BASE: 500,            // Base building HP
  BUILDING_HP_PER_LEVEL: 200,       // HP increase per level
  BUILDING_MAX_LEVEL: 3,            // Max building level
  
  // Island settings
  NODES_PER_ISLAND_MIN: 2,          // Min resource nodes per island
  NODES_PER_ISLAND_MAX: 5,          // Max resource nodes per island
  MONSTERS_PER_ISLAND_MIN: 3,       // Min monsters on neutral island
  MONSTERS_PER_ISLAND_MAX: 8,       // Max monsters on neutral island
};

// === FACTION COLORS ===

export const FACTION_COLORS: Record<number, { primary: string; secondary: string; name: string }> = {
  0: { primary: '#888888', secondary: '#666666', name: 'Neutral' },
  1: { primary: '#0066FF', secondary: '#0044AA', name: 'Player' },
  2: { primary: '#FF0000', secondary: '#AA0000', name: 'Enemy' },
  3: { primary: '#00FF00', secondary: '#00AA00', name: 'Ally' },
  4: { primary: '#FFAA00', secondary: '#AA7700', name: 'Enemy 2' },
};

// === RACE TYPES ===

export type RaceId = 'human' | 'elf' | 'dwarf' | 'orc' | 'undead' | 'barbarian';

export const RACE_NAMES: Record<RaceId, string> = {
  human: 'Human Kingdom',
  elf: 'Elven Alliance',
  dwarf: 'Dwarven Clans',
  orc: 'Orcish Horde',
  undead: 'Undead Legion',
  barbarian: 'Barbarian Tribes'
};

export const RACE_COLORS: Record<RaceId, { primary: string; secondary: string }> = {
  human: { primary: '#4a90d9', secondary: '#2d5a87' },
  elf: { primary: '#27ae60', secondary: '#1e8449' },
  dwarf: { primary: '#c0392b', secondary: '#922b21' },
  orc: { primary: '#27ae60', secondary: '#1e8449' },
  undead: { primary: '#9b59b6', secondary: '#7d3c98' },
  barbarian: { primary: '#e67e22', secondary: '#a04000' }
};

// === BUILDING TYPES ===

export type BuildingTypeId = 'camp' | 'barracks' | 'archery' | 'temple' | 'tower' | 'wall' | 'dock';

export const BUILDING_NAMES: Record<BuildingTypeId, string> = {
  camp: 'Camp',
  barracks: 'Barracks',
  archery: 'Archery Range',
  temple: 'Temple',
  tower: 'Defense Tower',
  wall: 'Wall',
  dock: 'Dock'
};

// === UNIT CATEGORIES ===

export type UnitCategory = 'worker' | 'infantry' | 'ranged' | 'cavalry' | 'siege' | 'champion' | 'hero' | 'monster';

// === ABILITY TYPES ===

export type AbilityType = 
  | 'passive_aura'      // Affects nearby allies
  | 'active_damage'     // Deals damage
  | 'active_heal'       // Heals allies
  | 'active_buff'       // Temporary buff
  | 'active_debuff'     // Debuff enemies
  | 'summon'            // Summon units
  | 'teleport';         // Movement ability

// === EFFECT TYPES ===

export type EffectType = 
  | 'damage'            // Direct damage
  | 'heal'              // Heal over time or instant
  | 'slow'              // Movement slow
  | 'stun'              // Prevents action
  | 'poison'            // Damage over time
  | 'burn'              // Fire damage over time
  | 'freeze'            // Slows and damages
  | 'buff_attack'       // Increases attack
  | 'buff_defense'      // Increases defense
  | 'buff_speed';       // Increases speed

// === SPRITE PATHS ===

export const SPRITE_PATHS = {
  // Hero sprites (GIF animations)
  HEROES: './sprites/heroes',
  
  // Unit sprites (MiniWorld)
  WORKERS: './sprites/miniworld/Characters/Workers',
  SOLDIERS_MELEE: './sprites/miniworld/Characters/Soldiers/Melee',
  SOLDIERS_RANGED: './sprites/miniworld/Characters/Soldiers/Ranged',
  SOLDIERS_MOUNTED: './sprites/miniworld/Characters/Soldiers/Mounted',
  CHAMPIONS: './sprites/miniworld/Characters/Champions',
  
  // Monsters
  MONSTERS_ORCS: './sprites/miniworld/Characters/Monsters/Orcs',
  MONSTERS_SLIMES: './sprites/miniworld/Characters/Monsters/Slimes',
  MONSTERS_DRAGONS: './sprites/miniworld/Characters/Monsters/Dragons',
  MONSTERS_FROSTBORN: './sprites/miniworld/Characters/Monsters/Frostborn',
  MONSTERS_PIRATES: './sprites/miniworld/Characters/Monsters/Pirates',
  MONSTERS_DEMONS: './sprites/miniworld/Characters/Monsters/Demons',
  
  // Tiny Swords units
  TINY_SWORDS: './sprites/tiny-swords/Units',
  
  // Buildings
  BUILDINGS: './sprites/miniworld/Buildings',
  
  // Effects
  EFFECTS: './effects'
};

// === LOOT TABLE TYPES ===

export interface LootDrop {
  gold: number;
  xp: number;
  itemChance?: number;
  itemPool?: string[];
}

// === UPGRADE TYPES ===

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  researchTime: number;  // seconds
  effects: {
    stat: 'attack' | 'defense' | 'health' | 'speed' | 'range';
    bonus: number;       // percentage or flat
    isPercent: boolean;
  }[];
  requires?: string[];   // Prerequisite upgrades
}

// === HELPER FUNCTIONS ===

export function getFactionColor(factionId: FactionId): string {
  return FACTION_COLORS[factionId]?.primary ?? FACTION_COLORS[0].primary;
}

export function getRaceColor(race: RaceId): string {
  return RACE_COLORS[race]?.primary ?? '#888888';
}

export function getXPForLevel(level: number): number {
  return Math.floor(
    GAME_CONFIG.HERO_BASE_XP_TO_LEVEL * 
    Math.pow(GAME_CONFIG.HERO_XP_SCALING, level - 1)
  );
}

export function getHeroLimit(campLevel: number): number {
  switch (campLevel) {
    case 1: return GAME_CONFIG.CAMP_LEVEL_1_HEROES;
    case 2: return GAME_CONFIG.CAMP_LEVEL_2_HEROES;
    case 3: return GAME_CONFIG.CAMP_LEVEL_3_HEROES;
    default: return 1;
  }
}
