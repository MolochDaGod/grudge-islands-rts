// ============================================
// SKILL TREE MANAGER
// Handles skill points, unlocking skills, and applying effects
// ============================================

import type { DerivedStats, Attributes } from '../../types/index.ts';
import type { 
  SkillNode, SkillClass, SkillTree, PlayerSkillState, SkillSlot, StatModifier
} from '../../types/skills.ts';
import { 
  getEmptyPlayerSkillState, canUnlockSkill, unlockSkillLevel,
  calculatePassiveBonuses, getEmptySkillSlots, assignSkillToSlot,
  SKILL_TIER_REQUIREMENTS
} from '../../types/skills.ts';
import { 
  ALL_SKILL_TREES, getAllSkills
} from '../../data/skillTreeData.ts';

export class SkillTreeManager {
  private playerState: PlayerSkillState;
  private skillSlots: SkillSlot[];
  private allSkills: Map<string, SkillNode>;
  private cachedPassiveBonuses: StatModifier[] | null = null;
  
  constructor() {
    this.playerState = getEmptyPlayerSkillState();
    this.skillSlots = getEmptySkillSlots();
    this.allSkills = getAllSkills();
  }
  
  // === SKILL POINT MANAGEMENT ===
  
  /**
   * Grant skill points (typically from leveling)
   */
  grantSkillPoints(amount: number): void {
    this.playerState.availablePoints += amount;
  }
  
  /**
   * Attempt to unlock or upgrade a skill
   */
  unlockSkill(skillId: string): boolean {
    const skill = this.allSkills.get(skillId);
    if (!skill) return false;
    
    if (!canUnlockSkill(skill, this.playerState, this.allSkills)) {
      return false;
    }
    
    const success = unlockSkillLevel(skillId, skill, this.playerState);
    if (success) {
      this.cachedPassiveBonuses = null;
    }
    return success;
  }
  
  /**
   * Get current level of a skill
   */
  getSkillLevel(skillId: string): number {
    return this.playerState.unlockedSkills.get(skillId) || 0;
  }
  
  /**
   * Check if a skill can be unlocked
   */
  canUnlock(skillId: string): boolean {
    const skill = this.allSkills.get(skillId);
    if (!skill) return false;
    return canUnlockSkill(skill, this.playerState, this.allSkills);
  }
  
  // === SKILL SLOT MANAGEMENT ===
  
  /**
   * Assign a skill to a hotbar slot
   */
  assignToSlot(slotIndex: number, skillId: string | null): boolean {
    // Verify skill is unlocked and is an active skill
    if (skillId) {
      const level = this.playerState.unlockedSkills.get(skillId);
      if (!level || level < 1) return false;
      
      const skill = this.allSkills.get(skillId);
      if (!skill || (skill.nodeType !== 'active' && skill.nodeType !== 'ultimate')) {
        return false;
      }
    }
    
    assignSkillToSlot(this.skillSlots, slotIndex, skillId);
    
    // Update active skills list
    this.playerState.activeSkills = this.skillSlots
      .filter(slot => slot.skillId !== null)
      .map(slot => slot.skillId!);
    
    return true;
  }
  
  /**
   * Use a skill from hotbar slot
   */
  useSkill(
    slotIndex: number, 
    casterStats: DerivedStats, 
    casterAttributes: Attributes,
    currentMana: number,
    currentStamina: number
  ): { success: boolean; manaCost: number; staminaCost: number; cooldown: number; effects: any[] } | null {
    const slot = this.skillSlots[slotIndex];
    if (!slot || !slot.skillId) return null;
    
    // Check cooldown
    if (slot.currentCooldown > 0) return null;
    
    const skill = this.allSkills.get(slot.skillId);
    if (!skill || !skill.activeEffect) return null;
    
    const level = this.playerState.unlockedSkills.get(slot.skillId) || 1;
    
    // Calculate costs (with level scaling)
    let manaCost = skill.activeEffect.manaCost;
    let staminaCost = skill.activeEffect.staminaCost;
    let cooldown = skill.activeEffect.cooldown;
    
    if (skill.levelScaling) {
      if (skill.levelScaling.costReduction) {
        const reduction = 1 - (skill.levelScaling.costReduction * (level - 1));
        manaCost *= reduction;
        staminaCost *= reduction;
      }
      if (skill.levelScaling.cooldownReduction) {
        cooldown *= 1 - (skill.levelScaling.cooldownReduction * (level - 1));
      }
    }
    
    // Apply CDR from stats
    cooldown *= (1 - casterStats.cooldownReduction / 100);
    
    // Check resources
    if (currentMana < manaCost || currentStamina < staminaCost) {
      return null;
    }
    
    // Start cooldown
    slot.currentCooldown = cooldown;
    
    // Calculate effect values
    const effects = skill.activeEffect.effects.map(effect => {
      let value = effect.value;
      
      // Apply level scaling
      if (skill.levelScaling?.effectIncrease) {
        value *= 1 + (skill.levelScaling.effectIncrease * (level - 1));
      }
      
      // Apply attribute scaling
      if (effect.scaling) {
        const attrValue = casterAttributes[effect.scaling.attribute];
        value += attrValue * effect.scaling.ratio;
      }
      
      return {
        ...effect,
        value: Math.round(value),
      };
    });
    
    return {
      success: true,
      manaCost: Math.round(manaCost),
      staminaCost: Math.round(staminaCost),
      cooldown,
      effects,
    };
  }
  
  /**
   * Update cooldowns (called each frame)
   */
  updateCooldowns(deltaTime: number): void {
    for (const slot of this.skillSlots) {
      if (slot.currentCooldown > 0) {
        slot.currentCooldown = Math.max(0, slot.currentCooldown - deltaTime);
      }
    }
  }
  
  // === PASSIVE BONUSES ===
  
  /**
   * Get all passive bonuses from unlocked skills
   */
  getPassiveBonuses(): StatModifier[] {
    if (!this.cachedPassiveBonuses) {
      this.cachedPassiveBonuses = calculatePassiveBonuses(this.playerState, this.allSkills);
    }
    return this.cachedPassiveBonuses;
  }
  
  /**
   * Apply passive bonuses to derived stats
   */
  applyPassivesToStats(baseStats: DerivedStats): DerivedStats {
    const bonuses = this.getPassiveBonuses();
    const modifiedStats = { ...baseStats };
    
    // Group bonuses by stat
    const statBonuses: Record<string, { flat: number; percent: number; multiplier: number }> = {};
    
    for (const bonus of bonuses) {
      const stat = bonus.stat as string;
      if (!statBonuses[stat]) {
        statBonuses[stat] = { flat: 0, percent: 0, multiplier: 1 };
      }
      
      switch (bonus.type) {
        case 'flat':
          statBonuses[stat].flat += bonus.value;
          break;
        case 'percent':
          statBonuses[stat].percent += bonus.value;
          break;
        case 'multiplier':
          statBonuses[stat].multiplier *= bonus.value;
          break;
      }
    }
    
    // Apply bonuses to stats
    for (const [stat, bonus] of Object.entries(statBonuses)) {
      if (stat in modifiedStats) {
        const key = stat as keyof DerivedStats;
        let value = modifiedStats[key] as number;
        value = (value + bonus.flat) * (1 + bonus.percent / 100) * bonus.multiplier;
        (modifiedStats[key] as number) = value;
      }
    }
    
    return modifiedStats;
  }
  
  // === GETTERS ===
  
  getPlayerState(): PlayerSkillState {
    return this.playerState;
  }
  
  getSkillSlots(): SkillSlot[] {
    return this.skillSlots;
  }
  
  getAvailablePoints(): number {
    return this.playerState.availablePoints;
  }
  
  getTotalPointsSpent(): number {
    return this.playerState.totalPointsSpent;
  }
  
  getPointsInTree(skillClass: SkillClass): number {
    return this.playerState.pointsPerTree[skillClass];
  }
  
  getSkillTree(skillClass: SkillClass): SkillTree {
    return ALL_SKILL_TREES[skillClass];
  }
  
  getAllSkillTrees(): Record<SkillClass, SkillTree> {
    return ALL_SKILL_TREES;
  }
  
  getUnlockedActiveSkills(): SkillNode[] {
    const activeSkills: SkillNode[] = [];
    
    for (const [skillId, level] of this.playerState.unlockedSkills) {
      if (level < 1) continue;
      
      const skill = this.allSkills.get(skillId);
      if (skill && (skill.nodeType === 'active' || skill.nodeType === 'ultimate')) {
        activeSkills.push(skill);
      }
    }
    
    return activeSkills;
  }
  
  /**
   * Get tier unlock status for a skill class
   */
  getTierUnlockStatus(skillClass: SkillClass): Record<number, boolean> {
    const pointsInTree = this.playerState.pointsPerTree[skillClass];
    return {
      1: pointsInTree >= SKILL_TIER_REQUIREMENTS[1],
      2: pointsInTree >= SKILL_TIER_REQUIREMENTS[2],
      3: pointsInTree >= SKILL_TIER_REQUIREMENTS[3],
      4: pointsInTree >= SKILL_TIER_REQUIREMENTS[4],
      5: pointsInTree >= SKILL_TIER_REQUIREMENTS[5],
    };
  }
  
  // === UTILITY ===
  
  /**
   * Get skill tooltip text
   */
  getSkillTooltip(skillId: string): string {
    const skill = this.allSkills.get(skillId);
    if (!skill) return '';
    
    const level = this.playerState.unlockedSkills.get(skillId) || 0;
    let tooltip = `${skill.name} (${level}/${skill.maxLevel})\n`;
    tooltip += `${skill.description}\n\n`;
    
    if (skill.activeEffect) {
      tooltip += `Cost: ${skill.activeEffect.manaCost} MP, ${skill.activeEffect.staminaCost} SP\n`;
      tooltip += `Cooldown: ${skill.activeEffect.cooldown}s\n`;
    }
    
    if (skill.passiveModifiers) {
      tooltip += 'Passive Effects:\n';
      for (const mod of skill.passiveModifiers) {
        const value = mod.value + (mod.perLevel || 0) * Math.max(0, level - 1);
        const sign = value >= 0 ? '+' : '';
        const suffix = mod.type === 'percent' ? '%' : '';
        tooltip += `  ${mod.stat}: ${sign}${value}${suffix}\n`;
      }
    }
    
    if (skill.prerequisites.length > 0) {
      tooltip += '\nRequires: ';
      tooltip += skill.prerequisites.map(id => {
        const prereq = this.allSkills.get(id);
        return prereq ? prereq.name : id;
      }).join(', ');
    }
    
    return tooltip;
  }
  
  /**
   * Reset all skill points
   */
  resetSkills(): void {
    const totalRefund = this.playerState.totalPointsSpent;
    this.playerState = getEmptyPlayerSkillState();
    this.playerState.availablePoints = totalRefund;
    this.skillSlots = getEmptySkillSlots();
    this.cachedPassiveBonuses = null;
  }
  
  /**
   * Reset skills for a specific tree
   */
  resetTree(skillClass: SkillClass): void {
    const refund = this.playerState.pointsPerTree[skillClass];
    
    // Remove skills from this tree
    for (const [skillId, _level] of [...this.playerState.unlockedSkills]) {
      const skill = this.allSkills.get(skillId);
      if (skill && skill.skillClass === skillClass) {
        this.playerState.unlockedSkills.delete(skillId);
      }
    }
    
    // Clear slots that had skills from this tree
    for (const slot of this.skillSlots) {
      if (slot.skillId) {
        const skill = this.allSkills.get(slot.skillId);
        if (skill && skill.skillClass === skillClass) {
          slot.skillId = null;
          slot.currentCooldown = 0;
        }
      }
    }
    
    // Refund points
    this.playerState.totalPointsSpent -= refund;
    this.playerState.pointsPerTree[skillClass] = 0;
    this.playerState.availablePoints += refund;
    
    this.cachedPassiveBonuses = null;
  }
  
  /**
   * Serialize skill state for saving
   */
  serialize(): object {
    return {
      availablePoints: this.playerState.availablePoints,
      totalPointsSpent: this.playerState.totalPointsSpent,
      pointsPerTree: this.playerState.pointsPerTree,
      unlockedSkills: Array.from(this.playerState.unlockedSkills.entries()),
      activeSkills: this.playerState.activeSkills,
      skillSlots: this.skillSlots.map(slot => ({
        skillId: slot.skillId,
        hotkey: slot.hotkey,
      })),
    };
  }
  
  /**
   * Deserialize skill state from save
   */
  deserialize(data: any): void {
    if (data.availablePoints !== undefined) {
      this.playerState.availablePoints = data.availablePoints;
    }
    if (data.totalPointsSpent !== undefined) {
      this.playerState.totalPointsSpent = data.totalPointsSpent;
    }
    if (data.pointsPerTree) {
      this.playerState.pointsPerTree = data.pointsPerTree;
    }
    if (data.unlockedSkills) {
      this.playerState.unlockedSkills = new Map(data.unlockedSkills);
    }
    if (data.activeSkills) {
      this.playerState.activeSkills = data.activeSkills;
    }
    if (data.skillSlots) {
      for (let i = 0; i < data.skillSlots.length && i < this.skillSlots.length; i++) {
        this.skillSlots[i].skillId = data.skillSlots[i].skillId;
      }
    }
    
    this.cachedPassiveBonuses = null;
  }
}
