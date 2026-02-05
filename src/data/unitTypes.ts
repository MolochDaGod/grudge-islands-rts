// ============================================
// UNIT TYPE DEFINITIONS
// Base attributes and properties for all unit types
// ============================================

import type { UnitTypeName, UnitTypeDefinition, Attributes, AttributeName } from '../types/index.ts';

/**
 * Create base attributes with primary focus
 */
function createUnitAttributes(
  primary: AttributeName,
  primaryValue: number,
  secondary?: AttributeName,
  secondaryValue?: number,
  tertiary?: AttributeName,
  tertiaryValue?: number
): Attributes {
  const attrs: Attributes = {
    Strength: 5,
    Intellect: 5,
    Vitality: 5,
    Dexterity: 5,
    Endurance: 5,
    Wisdom: 5,
    Agility: 5,
    Tactics: 5
  };
  
  attrs[primary] = primaryValue;
  if (secondary && secondaryValue) attrs[secondary] = secondaryValue;
  if (tertiary && tertiaryValue) attrs[tertiary] = tertiaryValue;
  
  return attrs;
}

// === UNIT TYPE DEFINITIONS ===

export const UNIT_TYPES: Record<UnitTypeName, UnitTypeDefinition> = {
  // ========== TIER 1 (Base Units) ==========
  Skeleton: {
    name: 'Skeleton',
    displayName: 'Skeleton',
    tier: 1,
    baseAttributes: createUnitAttributes('Strength', 10, 'Agility', 8),
    primaryAttribute: 'Strength',
    spriteName: 'Skeleton',
    attackRange: 30,
    attackDelay: 2.0,
    size: 16
  },
  Orc: {
    name: 'Orc',
    displayName: 'Orc',
    tier: 1,
    baseAttributes: createUnitAttributes('Strength', 12, 'Vitality', 10),
    primaryAttribute: 'Strength',
    spriteName: 'Orc',
    attackRange: 30,
    attackDelay: 2.5,
    size: 20
  },
  Soldier: {
    name: 'Soldier',
    displayName: 'Soldier',
    tier: 1,
    baseAttributes: createUnitAttributes('Strength', 10, 'Endurance', 10),
    primaryAttribute: 'Strength',
    spriteName: 'Soldier',
    attackRange: 30,
    attackDelay: 2.0,
    size: 18
  },
  Slime: {
    name: 'Slime',
    displayName: 'Slime',
    tier: 1,
    baseAttributes: createUnitAttributes('Vitality', 15, 'Agility', 6),
    primaryAttribute: 'Vitality',
    spriteName: 'Slime',
    attackRange: 20,
    attackDelay: 3.0,
    size: 14
  },

  // ========== TIER 2 (Upgraded Units) ==========
  Archer: {
    name: 'Archer',
    displayName: 'Archer',
    tier: 2,
    baseAttributes: createUnitAttributes('Dexterity', 18, 'Agility', 12),
    primaryAttribute: 'Dexterity',
    spriteName: 'Archer',
    attackRange: 120,
    attackDelay: 2.5,
    size: 16
  },
  Swordsman: {
    name: 'Swordsman',
    displayName: 'Swordsman',
    tier: 2,
    baseAttributes: createUnitAttributes('Strength', 16, 'Dexterity', 12),
    primaryAttribute: 'Strength',
    spriteName: 'Swordsman',
    attackRange: 35,
    attackDelay: 1.8,
    size: 18
  },
  SkeletonArcher: {
    name: 'SkeletonArcher',
    displayName: 'Skeleton Archer',
    tier: 2,
    baseAttributes: createUnitAttributes('Dexterity', 16, 'Agility', 10),
    primaryAttribute: 'Dexterity',
    spriteName: 'Skeleton Archer',
    attackRange: 100,
    attackDelay: 2.8,
    size: 16
  },

  // ========== TIER 3 (Advanced Units) ==========
  Knight: {
    name: 'Knight',
    displayName: 'Knight',
    tier: 3,
    baseAttributes: createUnitAttributes('Strength', 22, 'Endurance', 18, 'Vitality', 15),
    primaryAttribute: 'Strength',
    spriteName: 'Knight',
    attackRange: 35,
    attackDelay: 2.0,
    size: 22
  },
  Wizard: {
    name: 'Wizard',
    displayName: 'Wizard',
    tier: 3,
    baseAttributes: createUnitAttributes('Intellect', 25, 'Wisdom', 18),
    primaryAttribute: 'Intellect',
    spriteName: 'Wizard',
    attackRange: 100,
    attackDelay: 3.0,
    size: 16
  },
  Lancer: {
    name: 'Lancer',
    displayName: 'Lancer',
    tier: 3,
    baseAttributes: createUnitAttributes('Strength', 20, 'Dexterity', 16, 'Agility', 14),
    primaryAttribute: 'Strength',
    spriteName: 'Lancer',
    attackRange: 50,
    attackDelay: 2.2,
    size: 20
  },
  Priest: {
    name: 'Priest',
    displayName: 'Priest',
    tier: 3,
    baseAttributes: createUnitAttributes('Wisdom', 22, 'Intellect', 18, 'Vitality', 12),
    primaryAttribute: 'Wisdom',
    spriteName: 'Priest',
    attackRange: 80,
    attackDelay: 3.5,
    size: 16
  },

  // ========== TIER 4 (Elite Units) ==========
  KnightTemplar: {
    name: 'KnightTemplar',
    displayName: 'Knight Templar',
    tier: 4,
    baseAttributes: createUnitAttributes('Strength', 28, 'Endurance', 24, 'Wisdom', 18),
    primaryAttribute: 'Strength',
    spriteName: 'Knight Templar',
    attackRange: 40,
    attackDelay: 2.2,
    size: 24
  },
  EliteOrc: {
    name: 'EliteOrc',
    displayName: 'Elite Orc',
    tier: 4,
    baseAttributes: createUnitAttributes('Strength', 30, 'Vitality', 25, 'Endurance', 20),
    primaryAttribute: 'Strength',
    spriteName: 'Elite Orc',
    attackRange: 35,
    attackDelay: 2.8,
    size: 26
  },
  Werebear: {
    name: 'Werebear',
    displayName: 'Werebear',
    tier: 4,
    baseAttributes: createUnitAttributes('Strength', 32, 'Vitality', 28),
    primaryAttribute: 'Strength',
    spriteName: 'Werebear',
    attackRange: 40,
    attackDelay: 3.0,
    size: 30
  },
  Werewolf: {
    name: 'Werewolf',
    displayName: 'Werewolf',
    tier: 4,
    baseAttributes: createUnitAttributes('Agility', 28, 'Dexterity', 24, 'Strength', 20),
    primaryAttribute: 'Agility',
    spriteName: 'Werewolf',
    attackRange: 35,
    attackDelay: 1.5,
    size: 22
  },

  // ========== TIER 5 (Boss Units) ==========
  ArmoredAxeman: {
    name: 'ArmoredAxeman',
    displayName: 'Armored Axeman',
    tier: 5,
    baseAttributes: createUnitAttributes('Strength', 38, 'Endurance', 32, 'Vitality', 28),
    primaryAttribute: 'Strength',
    spriteName: 'Armored Axeman',
    attackRange: 45,
    attackDelay: 3.0,
    size: 28
  },
  ArmoredOrc: {
    name: 'ArmoredOrc',
    displayName: 'Armored Orc',
    tier: 5,
    baseAttributes: createUnitAttributes('Vitality', 35, 'Strength', 32, 'Endurance', 28),
    primaryAttribute: 'Vitality',
    spriteName: 'Armored Orc',
    attackRange: 40,
    attackDelay: 3.2,
    size: 30
  },
  ArmoredSkeleton: {
    name: 'ArmoredSkeleton',
    displayName: 'Armored Skeleton',
    tier: 5,
    baseAttributes: createUnitAttributes('Endurance', 35, 'Strength', 30, 'Wisdom', 20),
    primaryAttribute: 'Endurance',
    spriteName: 'Armored Skeleton',
    attackRange: 40,
    attackDelay: 2.8,
    size: 26
  },
  GreatswordSkeleton: {
    name: 'GreatswordSkeleton',
    displayName: 'Greatsword Skeleton',
    tier: 5,
    baseAttributes: createUnitAttributes('Strength', 40, 'Dexterity', 28, 'Agility', 22),
    primaryAttribute: 'Strength',
    spriteName: 'Greatsword Skeleton',
    attackRange: 50,
    attackDelay: 3.5,
    size: 28
  },
  OrcRider: {
    name: 'OrcRider',
    displayName: 'Orc Rider',
    tier: 5,
    baseAttributes: createUnitAttributes('Strength', 35, 'Agility', 30, 'Vitality', 25),
    primaryAttribute: 'Strength',
    spriteName: 'Orc rider',
    attackRange: 45,
    attackDelay: 2.5,
    size: 32
  }
};

// === HELPER FUNCTIONS ===

export function getUnitDefinition(unitType: UnitTypeName): UnitTypeDefinition {
  return UNIT_TYPES[unitType];
}

export function getUnitsByTier(tier: 1 | 2 | 3 | 4 | 5): UnitTypeDefinition[] {
  return Object.values(UNIT_TYPES).filter(u => u.tier === tier);
}

export function getAllUnitTypes(): UnitTypeName[] {
  return Object.keys(UNIT_TYPES) as UnitTypeName[];
}

// === GOBLIN UNIT POOL (for AI spawning) ===
export const GOBLIN_UNIT_POOL: Record<1 | 2 | 3 | 4 | 5, UnitTypeName[]> = {
  1: ['Orc', 'Skeleton', 'Slime'],
  2: ['SkeletonArcher', 'Swordsman'],
  3: ['Lancer'],
  4: ['EliteOrc', 'Werewolf'],
  5: ['ArmoredOrc', 'OrcRider']
};

// === PLAYER UNIT POOL (for player spawning) ===
export const PLAYER_UNIT_POOL: Record<1 | 2 | 3 | 4 | 5, UnitTypeName[]> = {
  1: ['Soldier', 'Skeleton'],
  2: ['Archer', 'Swordsman'],
  3: ['Knight', 'Wizard', 'Priest'],
  4: ['KnightTemplar', 'Werebear'],
  5: ['ArmoredAxeman', 'ArmoredSkeleton', 'GreatswordSkeleton']
};

// === SPAWN WEIGHTS (probability within tier) ===
export const SPAWN_WEIGHTS: Record<UnitTypeName, number> = {
  // Tier 1
  Skeleton: 40,
  Orc: 35,
  Soldier: 40,
  Slime: 25,
  // Tier 2
  Archer: 35,
  Swordsman: 40,
  SkeletonArcher: 30,
  // Tier 3
  Knight: 30,
  Wizard: 25,
  Lancer: 25,
  Priest: 20,
  // Tier 4
  KnightTemplar: 20,
  EliteOrc: 25,
  Werebear: 15,
  Werewolf: 20,
  // Tier 5
  ArmoredAxeman: 10,
  ArmoredOrc: 12,
  ArmoredSkeleton: 12,
  GreatswordSkeleton: 8,
  OrcRider: 8
};
