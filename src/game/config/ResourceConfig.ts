// ============================================
// RESOURCE CONFIGURATION
// Harvest nodes, resource types, loot tables
// Uses Tiny Swords decoration sprites
// ============================================

// === RESOURCE TYPES ===

export type ResourceType = 
  | 'wood'       // From trees
  | 'sticks'     // From trees, bushes
  | 'stone'      // From rocks
  | 'ore'        // From rocks
  | 'metal'      // From rocks (rare)
  | 'gold'       // Currency
  | 'food'       // From bushes, trees, sheep
  | 'cloth'      // From bushes, sheep
  | 'leather'    // From sheep
  | 'meat'       // From sheep
  | 'string'     // From sheep
  | 'materials'; // Generic crafting mats

export type NodeType = 'bush' | 'rock' | 'tree' | 'sheep' | 'skinning';

// === RESOURCE NODE DEFINITIONS ===

export interface ResourceDrop {
  resource: ResourceType;
  minAmount: number;
  maxAmount: number;
  chance: number;  // 0-1 probability
}

export interface NodeDefinition {
  type: NodeType;
  name: string;
  maxHealth: number;          // How much harvesting before depleted
  harvestTime: number;        // Seconds per harvest tick
  respawnTime: number;        // Seconds to respawn after depleted
  drops: ResourceDrop[];
  sprites: string[];          // Available sprite variants
  spriteSize: { width: number; height: number };
  isAnimated?: boolean;       // For sheep movement
  canMove?: boolean;          // Sheep wander around
}

// === SPRITE PATHS ===

const DECORATION_BASE = './assets/tiny-swords/Decorations';

export const NODE_SPRITES = {
  bush: [
    `${DECORATION_BASE}/Bushes/Bushe1.png`,
    `${DECORATION_BASE}/Bushes/Bushe2.png`,
    `${DECORATION_BASE}/Bushes/Bushe3.png`,
    `${DECORATION_BASE}/Bushes/Bushe4.png`,
  ],
  rock: [
    `${DECORATION_BASE}/Rocks/Rock1.png`,
    `${DECORATION_BASE}/Rocks/Rock2.png`,
    `${DECORATION_BASE}/Rocks/Rock3.png`,
    `${DECORATION_BASE}/Rocks/Rock4.png`,
  ],
  tree: [
    `${DECORATION_BASE}/Trees/Tree1.png`,
    `${DECORATION_BASE}/Trees/Tree2.png`,
    `${DECORATION_BASE}/Trees/Tree3.png`,
    `${DECORATION_BASE}/Trees/Tree4.png`,
  ],
  sheep: {
    idle: `${DECORATION_BASE}/Sheep/Sheep_Idle.png`,
    move: `${DECORATION_BASE}/Sheep/Sheep_Move.png`,
    grass: `${DECORATION_BASE}/Sheep/Sheep_Grass.png`,
  },
  skinning: `${DECORATION_BASE}/Rocks/Rock1.png`, // Placeholder for skinning pile
};

// === NODE DEFINITIONS ===

export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  bush: {
    type: 'bush',
    name: 'Berry Bush',
    maxHealth: 50,
    harvestTime: 3,
    respawnTime: 60,
    drops: [
      { resource: 'food', minAmount: 1, maxAmount: 3, chance: 0.8 },
      { resource: 'sticks', minAmount: 1, maxAmount: 2, chance: 0.6 },
      { resource: 'cloth', minAmount: 0, maxAmount: 1, chance: 0.3 },
      { resource: 'materials', minAmount: 0, maxAmount: 1, chance: 0.2 },
    ],
    sprites: NODE_SPRITES.bush,
    spriteSize: { width: 64, height: 64 },
  },

  rock: {
    type: 'rock',
    name: 'Stone Deposit',
    maxHealth: 80,
    harvestTime: 4,
    respawnTime: 90,
    drops: [
      { resource: 'stone', minAmount: 2, maxAmount: 5, chance: 0.9 },
      { resource: 'ore', minAmount: 1, maxAmount: 2, chance: 0.4 },
      { resource: 'metal', minAmount: 0, maxAmount: 1, chance: 0.1 },
      { resource: 'gold', minAmount: 0, maxAmount: 5, chance: 0.15 },
    ],
    sprites: NODE_SPRITES.rock,
    spriteSize: { width: 32, height: 32 },
  },

  tree: {
    type: 'tree',
    name: 'Oak Tree',
    maxHealth: 100,
    harvestTime: 5,
    respawnTime: 120,
    drops: [
      { resource: 'wood', minAmount: 3, maxAmount: 6, chance: 0.95 },
      { resource: 'sticks', minAmount: 1, maxAmount: 3, chance: 0.7 },
      { resource: 'food', minAmount: 0, maxAmount: 2, chance: 0.25 },
      { resource: 'materials', minAmount: 0, maxAmount: 1, chance: 0.15 },
    ],
    sprites: NODE_SPRITES.tree,
    spriteSize: { width: 128, height: 128 },
  },

  sheep: {
    type: 'sheep',
    name: 'Wild Sheep',
    maxHealth: 30,
    harvestTime: 2,        // Time to kill
    respawnTime: 180,
    drops: [],             // Drops handled by skinning node
    sprites: [NODE_SPRITES.sheep.idle],
    spriteSize: { width: 64, height: 64 },
    isAnimated: true,
    canMove: true,
  },

  skinning: {
    type: 'skinning',
    name: 'Skinning Pile',
    maxHealth: 40,
    harvestTime: 3,
    respawnTime: 0,        // Doesn't respawn - created from sheep
    drops: [
      { resource: 'meat', minAmount: 2, maxAmount: 4, chance: 0.95 },
      { resource: 'leather', minAmount: 1, maxAmount: 3, chance: 0.8 },
      { resource: 'string', minAmount: 1, maxAmount: 2, chance: 0.5 },
      { resource: 'cloth', minAmount: 0, maxAmount: 1, chance: 0.3 },
      { resource: 'materials', minAmount: 0, maxAmount: 1, chance: 0.2 },
    ],
    sprites: [NODE_SPRITES.skinning],
    spriteSize: { width: 32, height: 32 },
  },
};

// === RESOURCE VALUES ===

export const RESOURCE_VALUES: Record<ResourceType, { name: string; icon: string; sellValue: number }> = {
  wood: { name: 'Wood', icon: '🪵', sellValue: 2 },
  sticks: { name: 'Sticks', icon: '🥢', sellValue: 1 },
  stone: { name: 'Stone', icon: '🪨', sellValue: 2 },
  ore: { name: 'Ore', icon: '�ite', sellValue: 5 },
  metal: { name: 'Metal', icon: '🔩', sellValue: 10 },
  gold: { name: 'Gold', icon: '🪙', sellValue: 1 },
  food: { name: 'Food', icon: '🍖', sellValue: 3 },
  cloth: { name: 'Cloth', icon: '🧵', sellValue: 4 },
  leather: { name: 'Leather', icon: '🛡️', sellValue: 6 },
  meat: { name: 'Meat', icon: '🥩', sellValue: 5 },
  string: { name: 'String', icon: '🧶', sellValue: 3 },
  materials: { name: 'Materials', icon: '📦', sellValue: 2 },
};

// === WORKER CONFIGURATION ===

export const WORKER_CONFIG = {
  MAX_PER_CAMP: 4,              // Max workers per camp building
  HARVEST_RANGE: 30,            // How close to node to harvest
  MOVE_SPEED: 50,               // Worker movement speed
  CARRY_CAPACITY: 20,           // Max resources before returning
  RETURN_DISTANCE: 100,         // Distance to camp to deposit
  IDLE_WANDER_RANGE: 150,       // How far workers wander when idle
  SEARCH_RANGE: 400,            // Range to find new nodes
  SPRITE_PATH: './assets/miniworld/Characters/Workers/FarmerTemplate.png',
  SPRITE_SIZE: { width: 16, height: 16 },
  FRAMES_PER_ROW: 4,
};

// === ISLAND NODE SPAWN CONFIG ===

export const ISLAND_NODE_SPAWN = {
  // Nodes per island size tier
  SMALL: { bushes: 3, rocks: 2, trees: 4, sheep: 1 },
  MEDIUM: { bushes: 5, rocks: 4, trees: 6, sheep: 2 },
  LARGE: { bushes: 8, rocks: 6, trees: 10, sheep: 4 },
  
  // Minimum spacing between nodes
  MIN_SPACING: 50,
  
  // Border padding (don't spawn at edges)
  EDGE_PADDING: 30,
};

// === HELPER FUNCTIONS ===

export function rollDrops(drops: ResourceDrop[]): Map<ResourceType, number> {
  const result = new Map<ResourceType, number>();
  
  for (const drop of drops) {
    if (Math.random() <= drop.chance) {
      const amount = Math.floor(
        Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount
      );
      if (amount > 0) {
        result.set(drop.resource, (result.get(drop.resource) || 0) + amount);
      }
    }
  }
  
  return result;
}

export function getRandomNodeSprite(nodeType: NodeType): string {
  const definition = NODE_DEFINITIONS[nodeType];
  if (!definition) return '';
  
  const index = Math.floor(Math.random() * definition.sprites.length);
  return definition.sprites[index];
}

export function getNodeDefinition(nodeType: NodeType): NodeDefinition {
  return NODE_DEFINITIONS[nodeType];
}
