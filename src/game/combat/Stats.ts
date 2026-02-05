// ============================================
// STATS CALCULATOR
// Calculates derived stats from attributes using Grudge Warlords formulas
// ============================================

import type { Attributes, DerivedStats, ClassInfo } from '../../types/index.ts';
import { 
  ATTRIBUTE_DEFINITIONS, 
  BASE_STATS, 
  CLASS_TIERS,
  generateClassName,
  TOTAL_ATTRIBUTE_POINTS,
  getTotalPointsSpent
} from '../../data/attributes.ts';

/**
 * Calculate all derived stats from attributes
 * This is the core calculation ported from the Character Builder
 */
export function calculateStats(attributes: Attributes): DerivedStats {
  // Start with base stats
  const stats: DerivedStats = { ...BASE_STATS };
  
  // Apply gains from each attribute
  for (const [attrName, points] of Object.entries(attributes)) {
    if (points <= 0) continue;
    
    const definition = ATTRIBUTE_DEFINITIONS[attrName as keyof Attributes];
    if (!definition) continue;
    
    for (const gain of definition.gains) {
      const statKey = gain.stat as keyof DerivedStats;
      if (stats[statKey] !== undefined) {
        stats[statKey] += gain.value * points;
      }
    }
  }
  
  // Apply Tactics bonus (0.5% per point to all percentage-based stats)
  const tacticsPoints = attributes.Tactics || 0;
  if (tacticsPoints > 0) {
    const tacticsBonus = tacticsPoints * 0.5 / 100; // Convert to multiplier
    
    // Apply to percentage-based stats only
    const percentageStats: (keyof DerivedStats)[] = [
      'block', 'blockEffect', 'evasion', 'accuracy', 'criticalChance', 'criticalDamage',
      'attackSpeed', 'movementSpeed', 'resistance', 'cdrResist', 'defenseBreakResist',
      'armorPenetration', 'blockPenetration', 'defenseBreak', 'drainHealth',
      'cooldownReduction', 'abilityCost', 'spellAccuracy', 'stagger', 'ccResistance',
      'damageReduction', 'bleedResist', 'statusEffect', 'spellblock', 'dodge',
      'reflexTime', 'criticalEvasion', 'fallDamage', 'comboCooldownRed'
    ];
    
    for (const statKey of percentageStats) {
      stats[statKey] *= (1 + tacticsBonus);
    }
  }
  
  return stats;
}

/**
 * Calculate Combat Power - a single number representing unit effectiveness
 * Formula from Character Builder:
 * - Effective Health = Health * (1 + Defense/100) * (1 + Resistance/100)
 * - DPS Factor = Damage * (1 + CritChance * CritDmg) * (1 + AttackSpeed)
 * - Utility Factor = CDR + ManaRegen + MoveSpeed
 * - Combat Power = EHP * 0.4 + DPS * 2.5 + Utility * 5
 */
export function calculateCombatPower(stats: DerivedStats): number {
  // Effective Health Pool
  const ehp = stats.health * (1 + stats.defense / 100) * (1 + stats.resistance / 100);
  
  // DPS Factor (add 10 base damage to prevent 0 calculations)
  const dps = (stats.damage + 10) * 
              (1 + (stats.criticalChance / 100) * (stats.criticalDamage / 100)) * 
              (1 + stats.attackSpeed / 100);
  
  // Utility Factor
  const utility = (stats.cooldownReduction * 2) + (stats.manaRegen * 10) + (stats.movementSpeed * 2);
  
  // Final Combat Power
  return Math.floor((ehp * 0.4) + (dps * 2.5) + (utility * 5));
}

/**
 * Calculate Build Score (0-100) based on combat power and synergy
 */
export function calculateBuildScore(attributes: Attributes, stats: DerivedStats): number {
  if (getTotalPointsSpent(attributes) < TOTAL_ATTRIBUTE_POINTS) {
    return 0;
  }
  
  const combatPower = calculateCombatPower(stats);
  
  // Normalize CP to a 0-100 scale (6000 is considered "perfect")
  let score = (combatPower / 6000) * 100;
  
  // Calculate synergy bonus based on attribute distribution
  const total = TOTAL_ATTRIBUTE_POINTS;
  const norm = {
    Strength: attributes.Strength / total,
    Intellect: attributes.Intellect / total,
    Vitality: attributes.Vitality / total,
    Dexterity: attributes.Dexterity / total,
    Endurance: attributes.Endurance / total,
    Wisdom: attributes.Wisdom / total,
    Agility: attributes.Agility / total,
    Tactics: attributes.Tactics / total
  };
  
  // Synergy archetypes
  const synergy = Math.max(
    (norm.Strength + norm.Vitality + norm.Endurance), // Tank
    (norm.Intellect + norm.Wisdom + norm.Tactics),     // Mage
    (norm.Dexterity + norm.Agility + norm.Strength),   // Rogue/Warrior
    (norm.Tactics + norm.Endurance + norm.Wisdom)      // Support
  ) * 20;
  
  return Math.min(100, score + synergy);
}

/**
 * Get rank from build score (higher score = lower rank number = better)
 */
export function getRankFromScore(score: number): number {
  const maxRank = 300;
  return Math.max(1, Math.floor(maxRank - (score * 2.8)));
}

/**
 * Detect class tier and name from attributes
 */
export function detectClass(attributes: Attributes): ClassInfo {
  const totalSpent = getTotalPointsSpent(attributes);
  
  if (totalSpent < TOTAL_ATTRIBUTE_POINTS) {
    return {
      name: '...',
      tier: 'Unclassified',
      description: 'Incomplete attribute allocation.',
      className: 'unclassified',
      rank: 999,
      combatPower: 0
    };
  }
  
  const stats = calculateStats(attributes);
  const score = calculateBuildScore(attributes, stats);
  const rank = getRankFromScore(score);
  const combatPower = calculateCombatPower(stats);
  
  // Find tier
  const tier = CLASS_TIERS.find(t => rank >= t.minRank && rank <= t.maxRank) 
               || CLASS_TIERS[CLASS_TIERS.length - 1];
  
  // Generate name
  const name = generateClassName(rank);
  
  return {
    name,
    tier: `${tier.name} (Rank ${rank})`,
    description: tier.description,
    className: tier.className,
    rank,
    combatPower
  };
}

/**
 * Calculate stats for a unit with base attributes + upgrade bonus
 */
export function calculateUnitStats(
  baseAttributes: Attributes, 
  upgradeLevel: number = 0,
  primaryAttribute: keyof Attributes = 'Strength'
): DerivedStats {
  // Apply upgrade bonus to primary attribute
  const attributes = { ...baseAttributes };
  attributes[primaryAttribute] += upgradeLevel * 5;
  
  return calculateStats(attributes);
}

/**
 * Get effective attack speed in attacks per second
 * Base is 1 attack per 2 seconds, modified by attackSpeed %
 */
export function getAttacksPerSecond(stats: DerivedStats, baseDelay: number = 2): number {
  const speedMultiplier = 1 + (stats.attackSpeed / 100);
  return speedMultiplier / baseDelay;
}

/**
 * Get effective movement speed in pixels per second
 * Base is 24 px/s (from original swarm RTS), modified by movementSpeed %
 */
export function getMovementPixelsPerSecond(stats: DerivedStats, baseSpeed: number = 24): number {
  const speedMultiplier = 1 + (stats.movementSpeed / 100);
  return baseSpeed * speedMultiplier;
}

/**
 * Calculate effective health (accounting for defense and resistance)
 */
export function getEffectiveHealth(stats: DerivedStats): number {
  return stats.health * (1 + stats.defense / 100) * (1 + stats.resistance / 100);
}

/**
 * Calculate expected damage per hit
 */
export function getExpectedDamagePerHit(stats: DerivedStats): number {
  const baseDamage = stats.damage + 10; // Minimum 10 damage
  const critMultiplier = 1 + (stats.criticalChance / 100) * (stats.criticalDamage / 100);
  return baseDamage * critMultiplier;
}
