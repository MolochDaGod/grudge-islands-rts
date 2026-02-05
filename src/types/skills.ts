// ============================================
// SKILL TREE TYPES
// Based on Grudge Warlords skill-tree-complete.html
// Classes: Warrior, Mage, Worg, Ranger
// ============================================

import type { Attributes, DerivedStats } from './index.ts';

// === SKILL CLASSES ===
export type SkillClass = 'warrior' | 'mage' | 'worg' | 'ranger';

export const SKILL_CLASS_COLORS: Record<SkillClass, string> = {
  warrior: '#ef4444', // Red
  mage: '#a855f7',    // Purple
  worg: '#f97316',    // Orange
  ranger: '#22c55e',  // Green
};

export const SKILL_CLASS_NAMES: Record<SkillClass, string> = {
  warrior: 'Warrior',
  mage: 'Mage',
  worg: 'Worg',
  ranger: 'Ranger',
};

// === SKILL TIERS ===
export type SkillTier = 1 | 2 | 3 | 4 | 5;

export const SKILL_TIER_REQUIREMENTS: Record<SkillTier, number> = {
  1: 0,   // Tier 1 unlocks at 0 total points spent in tree
  2: 5,   // Tier 2 unlocks after 5 points in tree
  3: 15,  // Tier 3 unlocks after 15 points in tree
  4: 30,  // Tier 4 unlocks after 30 points in tree
  5: 50,  // Tier 5 (ultimate) unlocks after 50 points in tree
};

// === SKILL NODE TYPES ===
export type SkillNodeType = 
  | 'passive'     // Permanent stat bonus
  | 'active'      // Usable ability
  | 'ultimate'    // Powerful tier 5 ability
  | 'mastery';    // Enhances other skills

// === STAT MODIFIERS ===
export type StatModifierType = 'flat' | 'percent' | 'multiplier';

export interface StatModifier {
  stat: keyof DerivedStats | keyof Attributes | string;
  type: StatModifierType;
  value: number;
  perLevel?: number; // Additional value per skill level
}

// === SKILL EFFECTS ===
export type SkillEffectType = 
  | 'damage'           // Deal damage
  | 'heal'             // Restore health
  | 'buff'             // Apply positive effect
  | 'debuff'           // Apply negative effect
  | 'summon'           // Create units
  | 'aura'             // Persistent area effect
  | 'dash'             // Movement ability
  | 'projectile'       // Ranged attack
  | 'transform'        // Change form (Worg)
  | 'companion';       // Pet/minion

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  scaling?: {
    attribute: keyof Attributes;
    ratio: number;
  };
  duration?: number;
  radius?: number;
  target?: 'self' | 'enemy' | 'ally' | 'area' | 'all';
}

// === SKILL NODE DEFINITION ===
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  skillClass: SkillClass;
  tier: SkillTier;
  nodeType: SkillNodeType;
  maxLevel: number;
  currentLevel: number;
  
  // Position in skill tree (for rendering)
  position: { x: number; y: number };
  
  // Requirements
  prerequisites: string[]; // Skill IDs that must be unlocked first
  pointCost: number;       // Points per level
  
  // Effects
  passiveModifiers?: StatModifier[];
  activeEffect?: {
    manaCost: number;
    staminaCost: number;
    cooldown: number;
    castTime?: number;
    effects: SkillEffect[];
  };
  
  // Per-level scaling
  levelScaling?: {
    modifiers?: StatModifier[];
    costReduction?: number;
    cooldownReduction?: number;
    effectIncrease?: number;
  };
}

// === SKILL TREE DEFINITION ===
export interface SkillTree {
  skillClass: SkillClass;
  name: string;
  description: string;
  nodes: SkillNode[];
  connections: SkillConnection[];
}

export interface SkillConnection {
  from: string; // Skill ID
  to: string;   // Skill ID
}

// === PLAYER SKILL STATE ===
export interface PlayerSkillState {
  availablePoints: number;
  totalPointsSpent: number;
  pointsPerTree: Record<SkillClass, number>;
  unlockedSkills: Map<string, number>; // skill id -> current level
  activeSkills: string[]; // Skill IDs equipped to hotbar (max 6)
}

// === SKILL SLOT (HOTBAR) ===
export interface SkillSlot {
  skillId: string | null;
  currentCooldown: number;
  hotkey: string;
}

// === HELPER FUNCTIONS ===
export function getEmptyPlayerSkillState(): PlayerSkillState {
  return {
    availablePoints: 0,
    totalPointsSpent: 0,
    pointsPerTree: {
      warrior: 0,
      mage: 0,
      worg: 0,
      ranger: 0,
    },
    unlockedSkills: new Map(),
    activeSkills: [],
  };
}

export function canUnlockSkill(
  skill: SkillNode,
  playerState: PlayerSkillState,
  allSkills: Map<string, SkillNode>
): boolean {
  // Check if player has available points
  if (playerState.availablePoints < skill.pointCost) {
    return false;
  }
  
  // Check tier requirement
  const pointsInTree = playerState.pointsPerTree[skill.skillClass];
  if (pointsInTree < SKILL_TIER_REQUIREMENTS[skill.tier]) {
    return false;
  }
  
  // Check prerequisites
  for (const prereqId of skill.prerequisites) {
    const prereqLevel = playerState.unlockedSkills.get(prereqId) || 0;
    if (prereqLevel < 1) {
      return false;
    }
  }
  
  // Check if skill is already at max level
  const currentLevel = playerState.unlockedSkills.get(skill.id) || 0;
  if (currentLevel >= skill.maxLevel) {
    return false;
  }
  
  return true;
}

export function unlockSkillLevel(
  skillId: string,
  skill: SkillNode,
  playerState: PlayerSkillState
): boolean {
  const currentLevel = playerState.unlockedSkills.get(skillId) || 0;
  
  if (currentLevel >= skill.maxLevel) {
    return false;
  }
  
  if (playerState.availablePoints < skill.pointCost) {
    return false;
  }
  
  // Spend points
  playerState.availablePoints -= skill.pointCost;
  playerState.totalPointsSpent += skill.pointCost;
  playerState.pointsPerTree[skill.skillClass] += skill.pointCost;
  
  // Unlock/upgrade skill
  playerState.unlockedSkills.set(skillId, currentLevel + 1);
  
  return true;
}

export function getSkillEffectValue(
  skill: SkillNode,
  level: number,
  attributes: Attributes
): number {
  if (!skill.activeEffect) return 0;
  
  let totalValue = 0;
  
  for (const effect of skill.activeEffect.effects) {
    let value = effect.value;
    
    // Apply level scaling
    if (skill.levelScaling?.effectIncrease) {
      value *= 1 + (skill.levelScaling.effectIncrease * (level - 1));
    }
    
    // Apply attribute scaling
    if (effect.scaling) {
      const attrValue = attributes[effect.scaling.attribute];
      value += attrValue * effect.scaling.ratio;
    }
    
    totalValue += value;
  }
  
  return totalValue;
}

export function calculatePassiveBonuses(
  playerState: PlayerSkillState,
  allSkills: Map<string, SkillNode>
): StatModifier[] {
  const bonuses: StatModifier[] = [];
  
  for (const [skillId, level] of playerState.unlockedSkills) {
    const skill = allSkills.get(skillId);
    if (!skill || !skill.passiveModifiers) continue;
    
    for (const modifier of skill.passiveModifiers) {
      // Apply per-level scaling
      let value = modifier.value;
      if (modifier.perLevel) {
        value += modifier.perLevel * (level - 1);
      }
      
      bonuses.push({
        ...modifier,
        value,
      });
    }
  }
  
  return bonuses;
}

// === SKILL HOTBAR ===
export function getEmptySkillSlots(): SkillSlot[] {
  return [
    { skillId: null, currentCooldown: 0, hotkey: 'Q' },
    { skillId: null, currentCooldown: 0, hotkey: 'W' },
    { skillId: null, currentCooldown: 0, hotkey: 'E' },
    { skillId: null, currentCooldown: 0, hotkey: 'R' },
    { skillId: null, currentCooldown: 0, hotkey: 'F' },
    { skillId: null, currentCooldown: 0, hotkey: 'G' },
  ];
}

export function assignSkillToSlot(
  slots: SkillSlot[],
  slotIndex: number,
  skillId: string | null
): void {
  if (slotIndex >= 0 && slotIndex < slots.length) {
    // Remove skill from other slots if already assigned
    if (skillId) {
      for (const slot of slots) {
        if (slot.skillId === skillId) {
          slot.skillId = null;
        }
      }
    }
    slots[slotIndex].skillId = skillId;
  }
}
