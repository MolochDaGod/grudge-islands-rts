// ============================================
// GRUDGE WARLORDS ATTRIBUTE SYSTEM
// Ported directly from Ultimate Character Builder
// ============================================

import type { AttributeName, DerivedStats, Attributes, ClassTier } from '../types/index.ts';

// === ATTRIBUTE GAINS PER POINT ===
// Each attribute contributes to multiple derived stats

export interface AttributeGain {
  stat: keyof DerivedStats;
  label: string;
  value: number;
}

export interface AttributeDefinition {
  name: AttributeName;
  description: string;
  fullDescription: string;
  gains: AttributeGain[];
}

export const ATTRIBUTE_DEFINITIONS: Record<AttributeName, AttributeDefinition> = {
  Strength: {
    name: 'Strength',
    description: 'Physical might and raw power.',
    fullDescription: 'Increases raw damage output, physical defense, and health. Warriors and melee builds scale heavily with Strength.',
    gains: [
      { stat: 'health', label: 'Health', value: 5 },
      { stat: 'damage', label: 'Physical Damage', value: 1.25 },
      { stat: 'defense', label: 'Physical Defense', value: 4 },
      { stat: 'block', label: 'Block Chance', value: 0.2 },
      { stat: 'drainHealth', label: 'Lifesteal', value: 0.075 },
      { stat: 'stagger', label: 'Stagger on Hit', value: 0.04 },
      { stat: 'mana', label: 'Mana Pool', value: 1 },
      { stat: 'stamina', label: 'Stamina', value: 0.8 },
      { stat: 'accuracy', label: 'Attack Accuracy', value: 0.08 },
      { stat: 'healthRegen', label: 'Health Regen/s', value: 0.02 },
      { stat: 'damageReduction', label: 'Damage Reduction', value: 0.02 },
    ]
  },
  Intellect: {
    name: 'Intellect',
    description: 'Mental acuity and spellcasting power.',
    fullDescription: 'Powers magical damage, mana regeneration, and ability cooldown reduction. Casters scale directly with Intellect.',
    gains: [
      { stat: 'mana', label: 'Mana Pool', value: 9 },
      { stat: 'damage', label: 'Magical Damage', value: 1.5 },
      { stat: 'defense', label: 'Magical Defense', value: 2 },
      { stat: 'manaRegen', label: 'Mana Regen/s', value: 0.04 },
      { stat: 'cooldownReduction', label: 'Cooldown Reduction', value: 0.075 },
      { stat: 'spellAccuracy', label: 'Spell Accuracy', value: 0.15 },
      { stat: 'health', label: 'Health', value: 3 },
      { stat: 'stamina', label: 'Stamina', value: 0.4 },
      { stat: 'accuracy', label: 'Attack Accuracy', value: 0.1 },
      { stat: 'abilityCost', label: 'Ability Cost Reduction', value: 0.05 },
    ]
  },
  Vitality: {
    name: 'Vitality',
    description: 'Physical endurance and life force.',
    fullDescription: 'Maximizes health pool and provides passive health regeneration. Vital for tanks and sustained damage builds.',
    gains: [
      { stat: 'health', label: 'Health', value: 25 },
      { stat: 'defense', label: 'Physical Defense', value: 1.5 },
      { stat: 'healthRegen', label: 'Health Regen/s', value: 0.06 },
      { stat: 'damageReduction', label: 'Damage Reduction', value: 0.04 },
      { stat: 'bleedResist', label: 'Bleed Resistance', value: 0.15 },
      { stat: 'mana', label: 'Mana Pool', value: 1.5 },
      { stat: 'stamina', label: 'Stamina', value: 1 },
      { stat: 'resistance', label: 'Magic Resistance', value: 0.08 },
      { stat: 'armor', label: 'Armor Rating', value: 0.2 },
    ]
  },
  Dexterity: {
    name: 'Dexterity',
    description: 'Hand-eye coordination and finesse.',
    fullDescription: 'Dominates critical chance, attack speed, and accuracy. Rogues and archers scale with Dexterity.',
    gains: [
      { stat: 'damage', label: 'Damage', value: 0.9 },
      { stat: 'criticalChance', label: 'Critical Chance', value: 0.3 },
      { stat: 'accuracy', label: 'Attack Accuracy', value: 0.25 },
      { stat: 'attackSpeed', label: 'Attack Speed', value: 0.2 },
      { stat: 'evasion', label: 'Evasion Chance', value: 0.125 },
      { stat: 'criticalDamage', label: 'Critical Damage Multiplier', value: 0.2 },
      { stat: 'defense', label: 'Physical Defense', value: 1.2 },
      { stat: 'stamina', label: 'Stamina', value: 0.6 },
      { stat: 'movementSpeed', label: 'Movement Speed', value: 0.08 },
      { stat: 'reflexTime', label: 'Reaction Time Bonus', value: 0.03 },
      { stat: 'health', label: 'Health', value: 3 },
    ]
  },
  Endurance: {
    name: 'Endurance',
    description: 'Stamina reserves and physical resistance.',
    fullDescription: 'Builds stamina for abilities and provides armor scaling. High Endurance enables higher block effectiveness.',
    gains: [
      { stat: 'stamina', label: 'Stamina', value: 6 },
      { stat: 'defense', label: 'Physical Defense', value: 5 },
      { stat: 'blockEffect', label: 'Block Effectiveness', value: 0.175 },
      { stat: 'ccResistance', label: 'CC Duration Reduction', value: 0.1 },
      { stat: 'armor', label: 'Armor Rating', value: 0.6 },
      { stat: 'defenseBreakResist', label: 'Armor Break Resistance', value: 0.125 },
      { stat: 'health', label: 'Health', value: 8 },
      { stat: 'mana', label: 'Mana Pool', value: 1 },
      { stat: 'healthRegen', label: 'Health Regen/s', value: 0.02 },
      { stat: 'block', label: 'Block Chance', value: 0.12 },
    ]
  },
  Wisdom: {
    name: 'Wisdom',
    description: 'Mental fortitude and magical resilience.',
    fullDescription: 'Primary counter to magical damage. Scales resistance and provides magic immunity scaling.',
    gains: [
      { stat: 'mana', label: 'Mana Pool', value: 6 },
      { stat: 'defense', label: 'Magical Defense', value: 5.5 },
      { stat: 'resistance', label: 'Magic Resistance', value: 0.25 },
      { stat: 'cdrResist', label: 'CDR Resistance', value: 0.2 },
      { stat: 'statusEffect', label: 'Status Effect Duration Reduction', value: 0.075 },
      { stat: 'spellblock', label: 'Spell Block Chance', value: 0.125 },
      { stat: 'health', label: 'Health', value: 4 },
      { stat: 'stamina', label: 'Stamina', value: 0.5 },
      { stat: 'damageReduction', label: 'Damage Reduction', value: 0.03 },
      { stat: 'spellAccuracy', label: 'Spell Accuracy', value: 0.1 },
    ]
  },
  Agility: {
    name: 'Agility',
    description: 'Speed, reflexes, and positioning.',
    fullDescription: 'Increases movement speed, dodge chance, and evasion. Synergizes with high-risk playstyles.',
    gains: [
      { stat: 'movementSpeed', label: 'Movement Speed', value: 0.15 },
      { stat: 'evasion', label: 'Evasion Chance', value: 0.225 },
      { stat: 'dodge', label: 'Dodge Cooldown Reduction', value: 0.15 },
      { stat: 'reflexTime', label: 'Reaction Time Bonus', value: 0.04 },
      { stat: 'criticalEvasion', label: 'Crit Evasion', value: 0.25 },
      { stat: 'fallDamage', label: 'Fall Damage Reduction', value: 0.2 },
      { stat: 'stamina', label: 'Stamina', value: 1 },
      { stat: 'accuracy', label: 'Attack Accuracy', value: 0.1 },
      { stat: 'attackSpeed', label: 'Attack Speed', value: 0.05 },
      { stat: 'damage', label: 'Damage', value: 0.3 },
      { stat: 'health', label: 'Health', value: 3 },
    ]
  },
  Tactics: {
    name: 'Tactics',
    description: 'Strategic thinking and ability control.',
    fullDescription: 'Expertise in ability execution and resource management. Grants 0.5% bonus to all stats per point. Counters enemy Defense and Block.',
    gains: [
      { stat: 'stamina', label: 'Stamina', value: 3 },
      { stat: 'abilityCost', label: 'Ability Cost Reduction', value: 0.075 },
      { stat: 'armorPenetration', label: 'Armor Penetration', value: 0.2 },
      { stat: 'blockPenetration', label: 'Block Penetration', value: 0.175 },
      { stat: 'defenseBreak', label: 'Defense Break Power', value: 0.1 },
      { stat: 'comboCooldownRed', label: 'Combo Cooldown Reduction', value: 0.125 },
      { stat: 'damage', label: 'Damage', value: 0.4 },
      { stat: 'defense', label: 'Physical Defense', value: 1 },
      { stat: 'mana', label: 'Mana Pool', value: 1.5 },
      { stat: 'cooldownReduction', label: 'Cooldown Reduction', value: 0.05 },
      { stat: 'health', label: 'Health', value: 3 },
    ]
  }
};

// === BASE STATS (before any attribute allocation) ===
export const BASE_STATS: DerivedStats = {
  health: 250,
  mana: 100,
  stamina: 100,
  damage: 0,
  defense: 0,
  block: 0,
  blockEffect: 0,
  evasion: 0,
  accuracy: 0,
  criticalChance: 0,
  criticalDamage: 0,
  attackSpeed: 0,
  movementSpeed: 0,
  resistance: 0,
  cdrResist: 0,
  defenseBreakResist: 0,
  armorPenetration: 0,
  blockPenetration: 0,
  defenseBreak: 0,
  drainHealth: 0,
  manaRegen: 0,
  healthRegen: 0,
  cooldownReduction: 0,
  abilityCost: 0,
  spellAccuracy: 0,
  stagger: 0,
  ccResistance: 0,
  armor: 0,
  damageReduction: 0,
  bleedResist: 0,
  statusEffect: 0,
  spellblock: 0,
  dodge: 0,
  reflexTime: 0,
  criticalEvasion: 0,
  fallDamage: 0,
  comboCooldownRed: 0
};

// === CLASS TIER DEFINITIONS ===
export const CLASS_TIERS: ClassTier[] = [
  { minRank: 1, maxRank: 10, name: 'Legendary', className: 'mystic-diamond', description: 'Mythical power achieved through perfect synergy.' },
  { minRank: 11, maxRank: 50, name: 'Warlord', className: 'warlord-orange', description: 'A dominant force on the battlefield.' },
  { minRank: 51, maxRank: 100, name: 'Epic', className: 'epic-purple', description: 'A hero of renown and great skill.' },
  { minRank: 101, maxRank: 200, name: 'Hero', className: 'hero-blue', description: 'A capable adventurer with potential.' },
  { minRank: 201, maxRank: 300, name: 'Normal', className: 'normal-grey', description: 'A standard combatant.' }
];

// === CLASS NAME GENERATOR ===
const PREFIXES = ['Void', 'Solar', 'Lunar', 'Star', 'Chaos', 'Holy', 'Dark', 'Blood', 'Iron', 'Storm', 
                  'Frost', 'Fire', 'Wind', 'Earth', 'Spirit', 'Mind', 'Soul', 'Time', 'Space', 'Life'];
const SUFFIXES = ['Walker', 'Weaver', 'Lord', 'King', 'Queen', 'God', 'Titan', 'Slayer', 'Breaker', 'Maker', 
                  'Seer', 'Sage', 'Guard', 'Blade', 'Fist', 'Shield', 'Heart', 'Eye', 'Hand', 'Wing'];

export function generateClassName(rank: number): string {
  if (rank <= 10) {
    const legendaryNames = [
      'Primordial God-King', 'Eternal Void Walker', 'Celestial Archon', 'Omniscient Sage',
      'Timeless Sentinel', 'Reality Weaver', 'Abyssal Sovereign', 'Divine Arbiter',
      'Cosmic Guardian', 'Transcendent Being'
    ];
    return legendaryNames[rank - 1] || 'Unknown Legend';
  }
  
  const prefixIndex = (rank - 1) % PREFIXES.length;
  const suffixIndex = (rank - 1) % SUFFIXES.length;
  
  if (rank <= 50) {
    return `${PREFIXES[prefixIndex]} ${SUFFIXES[suffixIndex]} Warlord`;
  } else if (rank <= 100) {
    return `Epic ${PREFIXES[prefixIndex]} ${SUFFIXES[suffixIndex]}`;
  } else if (rank <= 200) {
    return `${PREFIXES[prefixIndex]} ${SUFFIXES[suffixIndex]}`;
  } else {
    return `Novice ${SUFFIXES[suffixIndex]}`;
  }
}

// === EMPTY/DEFAULT ATTRIBUTES ===
export function createEmptyAttributes(): Attributes {
  return {
    Strength: 0,
    Intellect: 0,
    Vitality: 0,
    Dexterity: 0,
    Endurance: 0,
    Wisdom: 0,
    Agility: 0,
    Tactics: 0
  };
}

// === TOTAL POINTS ===
export const TOTAL_ATTRIBUTE_POINTS = 160;
export const POINTS_PER_LEVEL = 3;
export const MAX_GENERAL_LEVEL = 50;

// === ATTRIBUTE NAMES LIST ===
export const ATTRIBUTE_NAMES: AttributeName[] = [
  'Strength', 'Intellect', 'Vitality', 'Dexterity', 
  'Endurance', 'Wisdom', 'Agility', 'Tactics'
];

// === HELPER: Get total points spent ===
export function getTotalPointsSpent(attributes: Attributes): number {
  return Object.values(attributes).reduce((sum, val) => sum + val, 0);
}
