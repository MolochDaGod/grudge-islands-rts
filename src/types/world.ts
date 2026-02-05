// ============================================
// WORLD TYPES
// Islands, terrain, boats, buildings
// ============================================

import type { Position, FactionId } from './index.ts';

// === TERRAIN ===

export type TerrainType = 'deep_water' | 'shallow_water' | 'sand' | 'grass' | 'rock' | 'forest';

export interface TerrainTile {
  type: TerrainType;
  elevation: number; // 0 = deep water, 1 = shallow, 2+ = land
  walkable: boolean;
  buildable: boolean;
}

// === ISLANDS ===

export interface Island {
  id: string;
  name: string;
  center: Position;
  radius: number; // Approximate size
  vertices: Position[]; // Polygon outline
  owner: FactionId; // 0 = neutral, 1 = player, 2+ = enemies
  nodes: IslandNode[];
  camp: Camp | null;
  dockPoints: DockPoint[];
  buildings: Building[];
}

export interface IslandNode {
  id: string;
  islandId: string;
  position: Position;
  owner: FactionId;
  captureProgress: number; // 0-100
  capturingFaction: FactionId | null;
  spawnTimer: number;
  spawnInterval: number; // seconds between spawns
  unitTier: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
}

export interface Camp {
  id: string;
  islandId: string;
  position: Position;
  owner: FactionId;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  level: number; // Determines what can be built
}

export interface DockPoint {
  id: string;
  islandId: string;
  position: Position;
  direction: number; // Angle facing outward (radians)
  isOccupied: boolean;
  occupyingBoatId: string | null;
}

// === BOATS ===
// Enhanced with World Boats models (Anglerfish, Speed Boat, Sail Boat)

export type BoatState = 'docked' | 'sailing' | 'approaching' | 'deploying' | 'combat';
export type BoatModel = 'anglerfish' | 'speedboat' | 'sailboat' | 'warship' | 'transport';

export interface BoatDefinition {
  model: BoatModel;
  name: string;
  description: string;
  capacity: number;
  speed: number;
  health: number;
  armor: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  cost: number;
  buildTime: number;
  modelPath: string; // GLB model path
}

export interface Boat {
  id: string;
  model: BoatModel;
  owner: FactionId;
  position: Position;
  targetPosition: Position | null;
  targetDock: DockPoint | null;
  state: BoatState;
  speed: number;
  rotation: number;
  capacity: number; // Max units
  units: string[]; // Unit IDs on board
  health: number;
  maxHealth: number;
  armor: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  targetBoatId: string | null; // For naval combat
  spawnQueue: number; // Units left to deploy
  spawnTimer: number;
}

// Boat definitions based on World Boats assets
export const BOAT_DEFINITIONS: Record<BoatModel, BoatDefinition> = {
  anglerfish: {
    model: 'anglerfish',
    name: 'Anglerfish',
    description: 'A fearsome warship with powerful cannons. Slow but deadly.',
    capacity: 15,
    speed: 40,
    health: 800,
    armor: 30,
    attackDamage: 50,
    attackRange: 300,
    attackSpeed: 3.0,
    cost: 500,
    buildTime: 30,
    modelPath: 'addons/World Boats/Anglerfish.glb'
  },
  speedboat: {
    model: 'speedboat',
    name: 'Speed Boat',
    description: 'Fast scout vessel. Low capacity but excellent for quick raids.',
    capacity: 8,
    speed: 120,
    health: 250,
    armor: 5,
    attackDamage: 15,
    attackRange: 150,
    attackSpeed: 1.5,
    cost: 150,
    buildTime: 10,
    modelPath: 'addons/World Boats/Boat Speed A.glb'
  },
  sailboat: {
    model: 'sailboat',
    name: 'Sail Boat',
    description: 'Standard transport vessel. Good balance of speed and capacity.',
    capacity: 25,
    speed: 60,
    health: 400,
    armor: 10,
    attackDamage: 20,
    attackRange: 180,
    attackSpeed: 2.0,
    cost: 200,
    buildTime: 15,
    modelPath: 'addons/World Boats/Boat Sail A.glb'
  },
  warship: {
    model: 'warship',
    name: 'Warship',
    description: 'Heavy battleship with maximum firepower and armor.',
    capacity: 30,
    speed: 35,
    health: 1200,
    armor: 50,
    attackDamage: 80,
    attackRange: 350,
    attackSpeed: 4.0,
    cost: 800,
    buildTime: 45,
    modelPath: 'addons/World Boats/Anglerfish.glb' // Reuse anglerfish model
  },
  transport: {
    model: 'transport',
    name: 'Transport Ship',
    description: 'Massive cargo vessel. Maximum unit capacity but defenseless.',
    capacity: 50,
    speed: 30,
    health: 600,
    armor: 15,
    attackDamage: 0,
    attackRange: 0,
    attackSpeed: 0,
    cost: 350,
    buildTime: 25,
    modelPath: 'addons/World Boats/Boat Sail A.glb' // Reuse sailboat model
  }
};

// === TOWERS ===

export type TowerType = 'arrow' | 'cannon' | 'magic' | 'frost' | 'fire';

export interface TowerLevel {
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number; // Upgrade cost
  health: number;
}

export interface TowerDefinition {
  type: TowerType;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  levels: TowerLevel[];
  projectileType: 'arrow' | 'cannonball' | 'magic_bolt' | 'frost_shard' | 'fireball';
  splashRadius?: number; // For AOE towers
  slowEffect?: number; // For frost tower (0-1)
  burnDamage?: number; // For fire tower (damage per second)
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Position;
  owner: FactionId;
  level: number;
  health: number;
  maxHealth: number;
  isConstructing: boolean;
  constructionProgress: number;
  targetId: string | null;
  attackCooldown: number;
  kills: number; // Track kills for hero XP
  totalDamageDealt: number;
}

// === BUILDINGS ===

export type BuildingType = 'tower' | 'wall' | 'barracks' | 'armory' | 'shrine' | 'watchtower';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  cost: number;
  buildTime: number; // seconds
  health: number;
  size: number; // radius
  attackDamage?: number;
  attackRange?: number;
  attackSpeed?: number;
  providesVision?: number;
  unlockRequirement?: number; // Camp level required
}

export interface Building {
  id: string;
  type: BuildingType;
  islandId: string;
  position: Position;
  owner: FactionId;
  health: number;
  maxHealth: number;
  isConstructing: boolean;
  constructionProgress: number; // 0-100
  rotation: number;
}

// === WORLD STATE ===

export interface WorldState {
  islands: Map<string, Island>;
  boats: Map<string, Boat>;
  buildings: Map<string, Building>;
  oceanBounds: { width: number; height: number };
}

// === BUILD MENU ===

export interface BuildOption {
  type: BuildingType;
  name: string;
  cost: number;
  icon: string;
  hotkey: string;
  description: string;
  unlocked: boolean;
}

// === CONSTANTS ===

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  tower: {
    type: 'tower',
    name: 'Arrow Tower',
    cost: 100,
    buildTime: 10,
    health: 500,
    size: 30,
    attackDamage: 25,
    attackRange: 200,
    attackSpeed: 1.5,
    unlockRequirement: 1
  },
  wall: {
    type: 'wall',
    name: 'Stone Wall',
    cost: 50,
    buildTime: 5,
    health: 800,
    size: 20,
    unlockRequirement: 1
  },
  barracks: {
    type: 'barracks',
    name: 'Barracks',
    cost: 200,
    buildTime: 20,
    health: 600,
    size: 50,
    unlockRequirement: 1
  },
  armory: {
    type: 'armory',
    name: 'Armory',
    cost: 300,
    buildTime: 25,
    health: 500,
    size: 45,
    unlockRequirement: 2
  },
  shrine: {
    type: 'shrine',
    name: 'War Shrine',
    cost: 400,
    buildTime: 30,
    health: 400,
    size: 40,
    unlockRequirement: 2
  },
  watchtower: {
    type: 'watchtower',
    name: 'Watchtower',
    cost: 150,
    buildTime: 15,
    health: 300,
    size: 25,
    providesVision: 400,
    unlockRequirement: 1
  }
};

export const BOAT_STATS = {
  small: { capacity: 10, speed: 80, health: 200 },
  medium: { capacity: 25, speed: 60, health: 400 },
  large: { capacity: 50, speed: 40, health: 700 }
};

export const CAMP_STATS = {
  maxHealth: 1000,
  visionRange: 300,
  healRate: 5 // HP per second for nearby friendly units
};

// === TOWER DEFINITIONS ===

export const TOWER_DEFINITIONS: Record<TowerType, TowerDefinition> = {
  arrow: {
    type: 'arrow',
    name: 'Arrow Tower',
    description: 'Basic tower that fires arrows at enemies. Good all-around defense.',
    baseCost: 100,
    maxLevel: 5,
    projectileType: 'arrow',
    levels: [
      { level: 1, damage: 15, range: 180, attackSpeed: 1.5, cost: 0, health: 400 },
      { level: 2, damage: 22, range: 200, attackSpeed: 1.4, cost: 75, health: 500 },
      { level: 3, damage: 32, range: 220, attackSpeed: 1.3, cost: 150, health: 600 },
      { level: 4, damage: 45, range: 240, attackSpeed: 1.2, cost: 250, health: 750 },
      { level: 5, damage: 60, range: 260, attackSpeed: 1.0, cost: 400, health: 900 }
    ]
  },
  cannon: {
    type: 'cannon',
    name: 'Cannon Tower',
    description: 'Powerful tower with splash damage. Slow but devastating.',
    baseCost: 200,
    maxLevel: 5,
    projectileType: 'cannonball',
    splashRadius: 60,
    levels: [
      { level: 1, damage: 40, range: 150, attackSpeed: 3.0, cost: 0, health: 600 },
      { level: 2, damage: 60, range: 165, attackSpeed: 2.8, cost: 125, health: 750 },
      { level: 3, damage: 85, range: 180, attackSpeed: 2.6, cost: 250, health: 900 },
      { level: 4, damage: 115, range: 195, attackSpeed: 2.4, cost: 400, health: 1100 },
      { level: 5, damage: 150, range: 210, attackSpeed: 2.2, cost: 600, health: 1300 }
    ]
  },
  magic: {
    type: 'magic',
    name: 'Magic Tower',
    description: 'Arcane tower that ignores armor. Perfect against heavily armored foes.',
    baseCost: 250,
    maxLevel: 5,
    projectileType: 'magic_bolt',
    levels: [
      { level: 1, damage: 25, range: 200, attackSpeed: 2.0, cost: 0, health: 350 },
      { level: 2, damage: 38, range: 220, attackSpeed: 1.9, cost: 150, health: 450 },
      { level: 3, damage: 55, range: 240, attackSpeed: 1.8, cost: 300, health: 550 },
      { level: 4, damage: 75, range: 260, attackSpeed: 1.7, cost: 500, health: 700 },
      { level: 5, damage: 100, range: 280, attackSpeed: 1.5, cost: 750, health: 850 }
    ]
  },
  frost: {
    type: 'frost',
    name: 'Frost Tower',
    description: 'Slows enemies in range. Great for chokepoints.',
    baseCost: 175,
    maxLevel: 5,
    projectileType: 'frost_shard',
    slowEffect: 0.3, // 30% slow at level 1
    levels: [
      { level: 1, damage: 10, range: 160, attackSpeed: 1.8, cost: 0, health: 400 },
      { level: 2, damage: 15, range: 175, attackSpeed: 1.7, cost: 100, health: 500 },
      { level: 3, damage: 22, range: 190, attackSpeed: 1.6, cost: 200, health: 600 },
      { level: 4, damage: 30, range: 205, attackSpeed: 1.5, cost: 350, health: 750 },
      { level: 5, damage: 40, range: 220, attackSpeed: 1.4, cost: 550, health: 900 }
    ]
  },
  fire: {
    type: 'fire',
    name: 'Fire Tower',
    description: 'Sets enemies ablaze, dealing damage over time.',
    baseCost: 225,
    maxLevel: 5,
    projectileType: 'fireball',
    burnDamage: 5, // DPS at level 1
    splashRadius: 40,
    levels: [
      { level: 1, damage: 20, range: 170, attackSpeed: 2.2, cost: 0, health: 450 },
      { level: 2, damage: 30, range: 185, attackSpeed: 2.1, cost: 125, health: 550 },
      { level: 3, damage: 42, range: 200, attackSpeed: 2.0, cost: 250, health: 700 },
      { level: 4, damage: 58, range: 215, attackSpeed: 1.9, cost: 400, health: 850 },
      { level: 5, damage: 78, range: 230, attackSpeed: 1.8, cost: 650, health: 1000 }
    ]
  }
};

// Helper to get tower stats at a specific level
export function getTowerStats(type: TowerType, level: number): TowerLevel {
  const def = TOWER_DEFINITIONS[type];
  const clampedLevel = Math.max(1, Math.min(level, def.maxLevel));
  return def.levels[clampedLevel - 1];
}

// Helper to get upgrade cost
export function getTowerUpgradeCost(type: TowerType, currentLevel: number): number | null {
  const def = TOWER_DEFINITIONS[type];
  if (currentLevel >= def.maxLevel) return null;
  return def.levels[currentLevel].cost; // Next level's cost
}
