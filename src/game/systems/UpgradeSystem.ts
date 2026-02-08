// ============================================
// UPGRADE SYSTEM
// Unified upgrade management for towers and boats
// Stats: accuracy, speed, damage, health, abilities
// ============================================

import type { FactionId } from '../../types/index.ts';

// === UPGRADE STAT TYPES ===

export type UpgradeStat = 
  | 'accuracy'      // Hit chance / projectile tracking
  | 'speed'         // Attack speed / projectile velocity
  | 'damage'        // Base damage output
  | 'health'        // Max health / durability
  | 'range'         // Attack range
  | 'aoeRadius'     // Area of effect size
  | 'critChance'    // Critical hit chance
  | 'critDamage';   // Critical hit multiplier

export type AbilityType =
  | 'piercing'       // Projectile pierces through enemies
  | 'multishot'      // Fire multiple projectiles
  | 'homing'         // Projectiles track targets
  | 'explosive'      // Enhanced AOE on impact
  | 'slow'           // Slows enemies on hit
  | 'burn'           // Damage over time
  | 'chain'          // Lightning chains to nearby enemies
  | 'armor_break'    // Reduces target armor
  | 'shield'         // Damage absorption barrier
  | 'rapidfire'      // Temporary attack speed boost
  | 'overcharge';    // Charged shot with bonus damage

// === UPGRADE COSTS ===

export interface UpgradeCost {
  gold: number;
  wood?: number;
  stone?: number;
  iron?: number;
}

// === STAT UPGRADE ===

export interface StatUpgrade {
  stat: UpgradeStat;
  level: number;
  maxLevel: number;
  currentValue: number;
  baseValue: number;
  incrementPerLevel: number;
  costs: UpgradeCost[];
}

// === ABILITY UPGRADE ===

export interface AbilityUpgrade {
  ability: AbilityType;
  unlocked: boolean;
  level: number;
  maxLevel: number;
  unlockCost: UpgradeCost;
  upgradeCosts: UpgradeCost[];
  effectValue: number;  // e.g., slow %, burn DPS, etc.
  effectIncrement: number;
}

// === UPGRADEABLE ENTITY ===

export interface UpgradeableStats {
  accuracy: StatUpgrade;
  speed: StatUpgrade;
  damage: StatUpgrade;
  health: StatUpgrade;
  range: StatUpgrade;
  aoeRadius: StatUpgrade;
  critChance: StatUpgrade;
  critDamage: StatUpgrade;
}

export interface UpgradeableAbilities {
  [key: string]: AbilityUpgrade;
}

export interface UpgradeableEntity {
  id: string;
  entityType: 'tower' | 'boat';
  subType: string;  // e.g., 'arrow', 'warship'
  faction: FactionId;
  stats: UpgradeableStats;
  abilities: UpgradeableAbilities;
  totalUpgradePoints: number;
}

// === DEFAULT STAT TEMPLATES ===

const createStatUpgrade = (
  stat: UpgradeStat,
  baseValue: number,
  increment: number,
  maxLevel: number,
  baseCost: number,
  costMultiplier: number = 1.5
): StatUpgrade => {
  const costs: UpgradeCost[] = [];
  for (let i = 0; i < maxLevel; i++) {
    costs.push({ gold: Math.floor(baseCost * Math.pow(costMultiplier, i)) });
  }
  
  return {
    stat,
    level: 1,
    maxLevel,
    currentValue: baseValue,
    baseValue,
    incrementPerLevel: increment,
    costs
  };
};

// === TOWER UPGRADE TEMPLATES ===

export const TOWER_UPGRADE_TEMPLATES: Record<string, Partial<UpgradeableStats>> = {
  arrow: {
    accuracy: createStatUpgrade('accuracy', 85, 3, 10, 50),      // 85% -> 112%
    speed: createStatUpgrade('speed', 1.5, -0.1, 10, 75),        // 1.5s -> 0.6s cooldown
    damage: createStatUpgrade('damage', 15, 8, 10, 100),         // 15 -> 87 damage
    health: createStatUpgrade('health', 400, 100, 10, 60),       // 400 -> 1300 HP
    range: createStatUpgrade('range', 180, 15, 10, 80),          // 180 -> 315 range
    aoeRadius: createStatUpgrade('aoeRadius', 0, 5, 5, 150),     // 0 -> 25 AOE
    critChance: createStatUpgrade('critChance', 5, 3, 10, 120),  // 5% -> 32%
    critDamage: createStatUpgrade('critDamage', 150, 15, 10, 100) // 150% -> 285%
  },
  cannon: {
    accuracy: createStatUpgrade('accuracy', 75, 4, 10, 60),
    speed: createStatUpgrade('speed', 3.0, -0.15, 10, 100),
    damage: createStatUpgrade('damage', 40, 18, 10, 150),
    health: createStatUpgrade('health', 600, 120, 10, 80),
    range: createStatUpgrade('range', 150, 12, 10, 90),
    aoeRadius: createStatUpgrade('aoeRadius', 60, 10, 10, 120),
    critChance: createStatUpgrade('critChance', 8, 2, 10, 100),
    critDamage: createStatUpgrade('critDamage', 200, 20, 10, 120)
  },
  magic: {
    accuracy: createStatUpgrade('accuracy', 95, 1, 10, 80),
    speed: createStatUpgrade('speed', 2.0, -0.1, 10, 90),
    damage: createStatUpgrade('damage', 25, 12, 10, 130),
    health: createStatUpgrade('health', 350, 80, 10, 70),
    range: createStatUpgrade('range', 200, 15, 10, 100),
    aoeRadius: createStatUpgrade('aoeRadius', 30, 8, 10, 110),
    critChance: createStatUpgrade('critChance', 10, 3, 10, 140),
    critDamage: createStatUpgrade('critDamage', 175, 18, 10, 110)
  },
  frost: {
    accuracy: createStatUpgrade('accuracy', 90, 2, 10, 60),
    speed: createStatUpgrade('speed', 1.8, -0.08, 10, 80),
    damage: createStatUpgrade('damage', 10, 5, 10, 80),
    health: createStatUpgrade('health', 400, 90, 10, 65),
    range: createStatUpgrade('range', 160, 12, 10, 85),
    aoeRadius: createStatUpgrade('aoeRadius', 40, 8, 10, 100),
    critChance: createStatUpgrade('critChance', 5, 2, 10, 90),
    critDamage: createStatUpgrade('critDamage', 125, 10, 10, 85)
  },
  fire: {
    accuracy: createStatUpgrade('accuracy', 80, 3, 10, 70),
    speed: createStatUpgrade('speed', 2.2, -0.1, 10, 85),
    damage: createStatUpgrade('damage', 20, 10, 10, 110),
    health: createStatUpgrade('health', 450, 95, 10, 75),
    range: createStatUpgrade('range', 170, 12, 10, 90),
    aoeRadius: createStatUpgrade('aoeRadius', 40, 10, 10, 115),
    critChance: createStatUpgrade('critChance', 7, 3, 10, 100),
    critDamage: createStatUpgrade('critDamage', 160, 15, 10, 95)
  }
};

// === BOAT UPGRADE TEMPLATES ===

export const BOAT_UPGRADE_TEMPLATES: Record<string, Partial<UpgradeableStats>> = {
  speedboat: {
    accuracy: createStatUpgrade('accuracy', 70, 4, 10, 80),
    speed: createStatUpgrade('speed', 0.8, -0.05, 10, 100),
    damage: createStatUpgrade('damage', 15, 6, 10, 90),
    health: createStatUpgrade('health', 200, 50, 10, 70),
    range: createStatUpgrade('range', 150, 15, 10, 85),
    aoeRadius: createStatUpgrade('aoeRadius', 30, 5, 10, 100),
    critChance: createStatUpgrade('critChance', 10, 3, 10, 110),
    critDamage: createStatUpgrade('critDamage', 180, 15, 10, 100)
  },
  sailboat: {
    accuracy: createStatUpgrade('accuracy', 80, 3, 10, 70),
    speed: createStatUpgrade('speed', 1.5, -0.08, 10, 90),
    damage: createStatUpgrade('damage', 20, 8, 10, 100),
    health: createStatUpgrade('health', 400, 80, 10, 80),
    range: createStatUpgrade('range', 180, 15, 10, 90),
    aoeRadius: createStatUpgrade('aoeRadius', 50, 8, 10, 110),
    critChance: createStatUpgrade('critChance', 8, 2, 10, 95),
    critDamage: createStatUpgrade('critDamage', 160, 12, 10, 90)
  },
  warship: {
    accuracy: createStatUpgrade('accuracy', 75, 3, 10, 100),
    speed: createStatUpgrade('speed', 2.5, -0.12, 10, 120),
    damage: createStatUpgrade('damage', 50, 15, 10, 150),
    health: createStatUpgrade('health', 700, 150, 10, 100),
    range: createStatUpgrade('range', 300, 20, 10, 120),
    aoeRadius: createStatUpgrade('aoeRadius', 80, 12, 10, 140),
    critChance: createStatUpgrade('critChance', 5, 2, 10, 100),
    critDamage: createStatUpgrade('critDamage', 200, 20, 10, 110)
  }
};

// === ABILITY TEMPLATES ===

export const ABILITY_TEMPLATES: Record<AbilityType, Omit<AbilityUpgrade, 'unlocked'>> = {
  piercing: {
    ability: 'piercing',
    level: 0,
    maxLevel: 3,
    unlockCost: { gold: 500 },
    upgradeCosts: [{ gold: 300 }, { gold: 600 }, { gold: 1000 }],
    effectValue: 1,      // Pierces 1 enemy
    effectIncrement: 1   // +1 per level
  },
  multishot: {
    ability: 'multishot',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 400 },
    upgradeCosts: [{ gold: 250 }, { gold: 400 }, { gold: 600 }, { gold: 900 }, { gold: 1200 }],
    effectValue: 2,      // 2 projectiles
    effectIncrement: 1   // +1 per level
  },
  homing: {
    ability: 'homing',
    level: 0,
    maxLevel: 3,
    unlockCost: { gold: 350 },
    upgradeCosts: [{ gold: 200 }, { gold: 400 }, { gold: 700 }],
    effectValue: 30,     // 30% tracking strength
    effectIncrement: 20  // +20% per level
  },
  explosive: {
    ability: 'explosive',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 600 },
    upgradeCosts: [{ gold: 350 }, { gold: 550 }, { gold: 800 }, { gold: 1100 }, { gold: 1500 }],
    effectValue: 25,     // +25% AOE damage
    effectIncrement: 15  // +15% per level
  },
  slow: {
    ability: 'slow',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 300 },
    upgradeCosts: [{ gold: 180 }, { gold: 300 }, { gold: 450 }, { gold: 650 }, { gold: 900 }],
    effectValue: 20,     // 20% slow
    effectIncrement: 10  // +10% per level
  },
  burn: {
    ability: 'burn',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 400 },
    upgradeCosts: [{ gold: 220 }, { gold: 380 }, { gold: 580 }, { gold: 820 }, { gold: 1100 }],
    effectValue: 5,      // 5 DPS
    effectIncrement: 4   // +4 DPS per level
  },
  chain: {
    ability: 'chain',
    level: 0,
    maxLevel: 4,
    unlockCost: { gold: 550 },
    upgradeCosts: [{ gold: 300 }, { gold: 500 }, { gold: 750 }, { gold: 1100 }],
    effectValue: 2,      // Chains to 2 enemies
    effectIncrement: 1   // +1 per level
  },
  armor_break: {
    ability: 'armor_break',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 450 },
    upgradeCosts: [{ gold: 250 }, { gold: 400 }, { gold: 600 }, { gold: 850 }, { gold: 1150 }],
    effectValue: 10,     // -10 armor
    effectIncrement: 8   // -8 per level
  },
  shield: {
    ability: 'shield',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 500 },
    upgradeCosts: [{ gold: 280 }, { gold: 450 }, { gold: 680 }, { gold: 950 }, { gold: 1300 }],
    effectValue: 100,    // 100 damage shield
    effectIncrement: 75  // +75 per level
  },
  rapidfire: {
    ability: 'rapidfire',
    level: 0,
    maxLevel: 3,
    unlockCost: { gold: 380 },
    upgradeCosts: [{ gold: 220 }, { gold: 400 }, { gold: 650 }],
    effectValue: 50,     // 50% faster for 3s
    effectIncrement: 25  // +25% per level
  },
  overcharge: {
    ability: 'overcharge',
    level: 0,
    maxLevel: 5,
    unlockCost: { gold: 450 },
    upgradeCosts: [{ gold: 260 }, { gold: 420 }, { gold: 640 }, { gold: 900 }, { gold: 1200 }],
    effectValue: 200,    // 200% damage charged shot
    effectIncrement: 50  // +50% per level
  }
};

// Available abilities per entity type
export const TOWER_ABILITIES: Record<string, AbilityType[]> = {
  arrow: ['piercing', 'multishot', 'homing', 'rapidfire'],
  cannon: ['explosive', 'armor_break', 'slow', 'overcharge'],
  magic: ['chain', 'homing', 'piercing', 'overcharge'],
  frost: ['slow', 'chain', 'armor_break', 'shield'],
  fire: ['burn', 'explosive', 'chain', 'rapidfire']
};

export const BOAT_ABILITIES: Record<string, AbilityType[]> = {
  speedboat: ['rapidfire', 'homing', 'multishot', 'piercing'],
  sailboat: ['slow', 'burn', 'explosive', 'armor_break'],
  warship: ['explosive', 'multishot', 'shield', 'overcharge']
};

// === UPGRADE SYSTEM CLASS ===

export class UpgradeSystem {
  private entities: Map<string, UpgradeableEntity> = new Map();
  
  // Create upgradeable entity from tower/boat
  createUpgradeableEntity(
    id: string,
    entityType: 'tower' | 'boat',
    subType: string,
    faction: FactionId
  ): UpgradeableEntity {
    const template = entityType === 'tower' 
      ? TOWER_UPGRADE_TEMPLATES[subType] 
      : BOAT_UPGRADE_TEMPLATES[subType];
    
    const availableAbilities = entityType === 'tower'
      ? TOWER_ABILITIES[subType] || []
      : BOAT_ABILITIES[subType] || [];
    
    // Create stats from template
    const stats: UpgradeableStats = {
      accuracy: template?.accuracy || createStatUpgrade('accuracy', 80, 2, 10, 50),
      speed: template?.speed || createStatUpgrade('speed', 1.5, -0.1, 10, 75),
      damage: template?.damage || createStatUpgrade('damage', 20, 8, 10, 100),
      health: template?.health || createStatUpgrade('health', 400, 100, 10, 60),
      range: template?.range || createStatUpgrade('range', 180, 15, 10, 80),
      aoeRadius: template?.aoeRadius || createStatUpgrade('aoeRadius', 30, 5, 10, 100),
      critChance: template?.critChance || createStatUpgrade('critChance', 5, 2, 10, 90),
      critDamage: template?.critDamage || createStatUpgrade('critDamage', 150, 15, 10, 100)
    };
    
    // Create abilities
    const abilities: UpgradeableAbilities = {};
    for (const abilityType of availableAbilities) {
      const template = ABILITY_TEMPLATES[abilityType];
      abilities[abilityType] = {
        ...template,
        unlocked: false
      };
    }
    
    const entity: UpgradeableEntity = {
      id,
      entityType,
      subType,
      faction,
      stats,
      abilities,
      totalUpgradePoints: 0
    };
    
    this.entities.set(id, entity);
    return entity;
  }
  
  // Upgrade a stat
  upgradeStat(entityId: string, stat: UpgradeStat, playerGold: number): { success: boolean; cost: number; newValue: number } {
    const entity = this.entities.get(entityId);
    if (!entity) return { success: false, cost: 0, newValue: 0 };
    
    const statUpgrade = entity.stats[stat];
    if (!statUpgrade) return { success: false, cost: 0, newValue: 0 };
    
    if (statUpgrade.level >= statUpgrade.maxLevel) {
      return { success: false, cost: 0, newValue: statUpgrade.currentValue };
    }
    
    const cost = statUpgrade.costs[statUpgrade.level - 1]?.gold ?? 0;
    if (playerGold < cost) {
      return { success: false, cost, newValue: statUpgrade.currentValue };
    }
    
    // Apply upgrade
    statUpgrade.level++;
    statUpgrade.currentValue = statUpgrade.baseValue + (statUpgrade.incrementPerLevel * (statUpgrade.level - 1));
    entity.totalUpgradePoints++;
    
    return { success: true, cost, newValue: statUpgrade.currentValue };
  }
  
  // Unlock an ability
  unlockAbility(entityId: string, ability: AbilityType, playerGold: number): { success: boolean; cost: number } {
    const entity = this.entities.get(entityId);
    if (!entity) return { success: false, cost: 0 };
    
    const abilityUpgrade = entity.abilities[ability];
    if (!abilityUpgrade) return { success: false, cost: 0 };
    if (abilityUpgrade.unlocked) return { success: false, cost: 0 };
    
    const cost = abilityUpgrade.unlockCost.gold;
    if (playerGold < cost) return { success: false, cost };
    
    abilityUpgrade.unlocked = true;
    abilityUpgrade.level = 1;
    entity.totalUpgradePoints++;
    
    return { success: true, cost };
  }
  
  // Upgrade an ability
  upgradeAbility(entityId: string, ability: AbilityType, playerGold: number): { success: boolean; cost: number; newEffect: number } {
    const entity = this.entities.get(entityId);
    if (!entity) return { success: false, cost: 0, newEffect: 0 };
    
    const abilityUpgrade = entity.abilities[ability];
    if (!abilityUpgrade) return { success: false, cost: 0, newEffect: 0 };
    if (!abilityUpgrade.unlocked) return { success: false, cost: 0, newEffect: 0 };
    if (abilityUpgrade.level >= abilityUpgrade.maxLevel) {
      return { success: false, cost: 0, newEffect: abilityUpgrade.effectValue };
    }
    
    const cost = abilityUpgrade.upgradeCosts[abilityUpgrade.level - 1]?.gold ?? 0;
    if (playerGold < cost) {
      return { success: false, cost, newEffect: abilityUpgrade.effectValue };
    }
    
    // Apply upgrade
    abilityUpgrade.level++;
    abilityUpgrade.effectValue += abilityUpgrade.effectIncrement;
    entity.totalUpgradePoints++;
    
    return { success: true, cost, newEffect: abilityUpgrade.effectValue };
  }
  
  // Get computed stats for an entity
  getComputedStats(entityId: string): {
    accuracy: number;
    attackSpeed: number;
    damage: number;
    maxHealth: number;
    range: number;
    aoeRadius: number;
    critChance: number;
    critDamage: number;
  } | null {
    const entity = this.entities.get(entityId);
    if (!entity) return null;
    
    return {
      accuracy: entity.stats.accuracy.currentValue,
      attackSpeed: entity.stats.speed.currentValue,
      damage: entity.stats.damage.currentValue,
      maxHealth: entity.stats.health.currentValue,
      range: entity.stats.range.currentValue,
      aoeRadius: entity.stats.aoeRadius.currentValue,
      critChance: entity.stats.critChance.currentValue,
      critDamage: entity.stats.critDamage.currentValue
    };
  }
  
  // Get active abilities for an entity
  getActiveAbilities(entityId: string): { ability: AbilityType; level: number; effect: number }[] {
    const entity = this.entities.get(entityId);
    if (!entity) return [];
    
    const active: { ability: AbilityType; level: number; effect: number }[] = [];
    for (const [key, upgrade] of Object.entries(entity.abilities)) {
      if (upgrade.unlocked) {
        active.push({
          ability: key as AbilityType,
          level: upgrade.level,
          effect: upgrade.effectValue
        });
      }
    }
    return active;
  }
  
  // Check if entity has ability
  hasAbility(entityId: string, ability: AbilityType): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;
    return entity.abilities[ability]?.unlocked ?? false;
  }
  
  // Get ability effect value
  getAbilityEffect(entityId: string, ability: AbilityType): number {
    const entity = this.entities.get(entityId);
    if (!entity) return 0;
    const upgrade = entity.abilities[ability];
    return upgrade?.unlocked ? upgrade.effectValue : 0;
  }
  
  // Get entity
  getEntity(entityId: string): UpgradeableEntity | undefined {
    return this.entities.get(entityId);
  }
  
  // Remove entity
  removeEntity(entityId: string): void {
    this.entities.delete(entityId);
  }
  
  // Get all entities by type
  getEntitiesByType(entityType: 'tower' | 'boat'): UpgradeableEntity[] {
    return Array.from(this.entities.values()).filter(e => e.entityType === entityType);
  }
}

// Singleton instance
export const upgradeSystem = new UpgradeSystem();
