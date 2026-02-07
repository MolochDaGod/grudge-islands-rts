// ============================================
// MONSTER SYSTEM
// Spawns and manages neutral PvE monsters on islands
// Handles aggro, combat, and loot rewards
// ============================================

import type { Position } from '../../types/index.ts';
import { GAME_CONFIG } from '../config/GameConfig.ts';
import { 
  getUnitDefinition, 
  rollLoot 
} from '../config/UnitConfig.ts';

// === TYPES ===

export type MonsterTier = 'common' | 'elite' | 'boss';

export interface Monster {
  id: string;
  unitId: string;           // Reference to UnitConfig
  name: string;
  tier: MonsterTier;
  position: Position;
  homePosition: Position;   // Spawn point to return to
  islandId: string;
  
  // Stats
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;
  aggroRange: number;
  
  // Combat state
  targetId: string | null;
  attackCooldown: number;
  state: MonsterState;
  
  // Leash
  leashRange: number;
  
  // Animation
  direction: 'left' | 'right';
  animState: 'idle' | 'walk' | 'attack';
  animFrame: number;
  animTimer: number;
}

export type MonsterState = 
  | 'idle'
  | 'wander'
  | 'chase'
  | 'attack'
  | 'return'
  | 'dead';

export interface MonsterSpawnConfig {
  islandId: string;
  islandCenter: Position;
  islandRadius: number;
  tier: 'small' | 'medium' | 'large';
}

export interface MonsterKillEvent {
  monsterId: string;
  killedBy: string;       // Entity ID that killed
  position: Position;
  loot: {
    gold: number;
    xp: number;
  };
}

// === SPAWN TABLES ===

const SPAWN_TABLES: Record<string, { weight: number; tier: MonsterTier }[]> = {
  common: [
    { weight: 40, tier: 'common' },
    { weight: 10, tier: 'elite' },
  ],
  medium: [
    { weight: 30, tier: 'common' },
    { weight: 15, tier: 'elite' },
    { weight: 3, tier: 'boss' },
  ],
  large: [
    { weight: 20, tier: 'common' },
    { weight: 20, tier: 'elite' },
    { weight: 5, tier: 'boss' },
  ],
};

const MONSTER_POOL: Record<MonsterTier, string[]> = {
  common: ['goblin_club', 'slime', 'orc'],
  elite: ['orc', 'king_slime'],
  boss: ['minotaur', 'red_dragon'],
};

// === MONSTER SYSTEM ===

export class MonsterSystem {
  private monsters: Map<string, Monster> = new Map();
  private nextMonsterId: number = 0;
  private gameTime: number = 0;
  
  // Player units for aggro
  private playerUnits: Map<string, { position: Position; health: number }> = new Map();
  
  // Callbacks
  public onMonsterKilled: ((event: MonsterKillEvent) => void) | null = null;
  public onMonsterDamaged: ((monsterId: string, damage: number, remaining: number) => void) | null = null;
  public onMonsterAttack: ((monsterId: string, targetId: string, damage: number) => void) | null = null;
  
  constructor() {}
  
  // === SPAWNING ===
  
  /**
   * Spawn monsters for an island
   */
  spawnForIsland(config: MonsterSpawnConfig): Monster[] {
    const spawned: Monster[] = [];
    const spawnTable = SPAWN_TABLES[config.tier] || SPAWN_TABLES.common;
    
    // Determine count based on tier
    const counts = {
      small: { min: GAME_CONFIG.MONSTERS_PER_ISLAND_MIN, max: GAME_CONFIG.MONSTERS_PER_ISLAND_MIN + 2 },
      medium: { min: GAME_CONFIG.MONSTERS_PER_ISLAND_MIN + 1, max: GAME_CONFIG.MONSTERS_PER_ISLAND_MAX - 1 },
      large: { min: GAME_CONFIG.MONSTERS_PER_ISLAND_MAX - 2, max: GAME_CONFIG.MONSTERS_PER_ISLAND_MAX },
    };
    
    const range = counts[config.tier];
    const count = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    for (let i = 0; i < count; i++) {
      // Roll tier from spawn table
      const tier = this.rollTier(spawnTable);
      
      // Pick random monster from pool
      const pool = MONSTER_POOL[tier];
      const unitId = pool[Math.floor(Math.random() * pool.length)];
      
      // Random position within island
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (config.islandRadius * 0.6);
      const position = {
        x: config.islandCenter.x + Math.cos(angle) * radius,
        y: config.islandCenter.y + Math.sin(angle) * radius,
      };
      
      const monster = this.spawnMonster(unitId, position, config.islandId, tier);
      if (monster) {
        spawned.push(monster);
      }
    }
    
    console.log(`[MonsterSystem] Spawned ${spawned.length} monsters on ${config.islandId}`);
    return spawned;
  }
  
  /**
   * Spawn a single monster
   */
  spawnMonster(
    unitId: string,
    position: Position,
    islandId: string,
    tier: MonsterTier = 'common'
  ): Monster | null {
    const def = getUnitDefinition(unitId);
    if (!def || def.category !== 'monster') {
      console.warn(`[MonsterSystem] Invalid monster: ${unitId}`);
      return null;
    }
    
    // Apply tier scaling
    const statScale = tier === 'elite' ? 1.5 : tier === 'boss' ? 3.0 : 1.0;
    
    const monster: Monster = {
      id: `monster_${this.nextMonsterId++}`,
      unitId,
      name: def.name,
      tier,
      position: { ...position },
      homePosition: { ...position },
      islandId,
      
      health: Math.floor(def.stats.health * statScale),
      maxHealth: Math.floor(def.stats.health * statScale),
      attack: Math.floor(def.stats.attack * statScale),
      defense: Math.floor(def.stats.defense * statScale),
      speed: def.stats.speed,
      attackRange: def.stats.attackRange,
      attackSpeed: def.stats.attackSpeed,
      aggroRange: def.stats.aggroRange * (tier === 'boss' ? 1.5 : 1),
      
      targetId: null,
      attackCooldown: 0,
      state: 'idle',
      
      leashRange: 300 + (tier === 'boss' ? 200 : 0),
      
      direction: 'left',
      animState: 'idle',
      animFrame: 0,
      animTimer: 0,
    };
    
    this.monsters.set(monster.id, monster);
    return monster;
  }
  
  /**
   * Roll monster tier from spawn table
   */
  private rollTier(table: { weight: number; tier: MonsterTier }[]): MonsterTier {
    const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.tier;
    }
    
    return 'common';
  }
  
  // === UPDATE ===
  
  /**
   * Update all monsters (call each frame)
   */
  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    for (const monster of this.monsters.values()) {
      if (monster.state === 'dead') continue;
      
      // Update cooldown
      if (monster.attackCooldown > 0) {
        monster.attackCooldown -= deltaTime;
      }
      
      // Update animation timer
      monster.animTimer += deltaTime;
      if (monster.animTimer >= 0.15) {
        monster.animTimer = 0;
        monster.animFrame = (monster.animFrame + 1) % 4;
      }
      
      // AI decision making
      this.updateMonsterAI(monster, deltaTime);
    }
  }
  
  /**
   * Update single monster AI
   */
  private updateMonsterAI(monster: Monster, deltaTime: number): void {
    // Find nearest player unit
    const target = this.findNearestTarget(monster);
    
    if (target) {
      const distance = this.distance(monster.position, target.position);
      const distFromHome = this.distance(monster.position, monster.homePosition);
      
      // Check leash
      if (distFromHome > monster.leashRange) {
        monster.state = 'return';
        monster.targetId = null;
        monster.animState = 'walk';
      }
      // Within attack range
      else if (distance <= monster.attackRange) {
        monster.state = 'attack';
        monster.targetId = target.id;
        monster.animState = 'attack';
        this.performAttack(monster, target);
      }
      // Within aggro range - chase
      else if (distance <= monster.aggroRange) {
        monster.state = 'chase';
        monster.targetId = target.id;
        monster.animState = 'walk';
        this.moveToward(monster, target.position, deltaTime);
      }
      // Lost target
      else {
        monster.state = 'idle';
        monster.targetId = null;
        monster.animState = 'idle';
      }
    } else {
      // No target
      switch (monster.state) {
        case 'chase':
        case 'attack':
          monster.state = 'return';
          monster.targetId = null;
          break;
          
        case 'return':
          const distHome = this.distance(monster.position, monster.homePosition);
          if (distHome < 20) {
            monster.state = 'idle';
            monster.animState = 'idle';
          } else {
            this.moveToward(monster, monster.homePosition, deltaTime);
            monster.animState = 'walk';
          }
          break;
          
        case 'idle':
          // Occasionally wander
          if (Math.random() < 0.005) {
            monster.state = 'wander';
            monster.animState = 'walk';
          }
          break;
          
        case 'wander':
          // Pick random nearby point
          const wanderTarget = {
            x: monster.homePosition.x + (Math.random() - 0.5) * 100,
            y: monster.homePosition.y + (Math.random() - 0.5) * 100,
          };
          this.moveToward(monster, wanderTarget, deltaTime);
          
          // Stop wandering after a bit
          if (Math.random() < 0.02) {
            monster.state = 'idle';
            monster.animState = 'idle';
          }
          break;
      }
    }
  }
  
  /**
   * Move monster toward target position
   */
  private moveToward(monster: Monster, target: Position, deltaTime: number): void {
    const dx = target.x - monster.position.x;
    const dy = target.y - monster.position.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 5) return;
    
    const moveSpeed = monster.speed * deltaTime;
    monster.position.x += (dx / dist) * moveSpeed;
    monster.position.y += (dy / dist) * moveSpeed;
    
    // Update direction
    monster.direction = dx < 0 ? 'left' : 'right';
  }
  
  /**
   * Perform attack on target
   */
  private performAttack(
    monster: Monster,
    target: { id: string; position: Position; health: number }
  ): void {
    if (monster.attackCooldown > 0) return;
    
    // Calculate damage
    const baseDamage = monster.attack;
    const finalDamage = Math.max(1, baseDamage);
    
    // Fire callback
    this.onMonsterAttack?.(monster.id, target.id, finalDamage);
    
    // Reset cooldown
    monster.attackCooldown = 1 / monster.attackSpeed;
  }
  
  /**
   * Find nearest valid target for monster
   */
  private findNearestTarget(monster: Monster): { id: string; position: Position; health: number } | null {
    let nearest: { id: string; position: Position; health: number } | null = null;
    let nearestDist = Infinity;
    
    for (const [id, unit] of this.playerUnits) {
      if (unit.health <= 0) continue;
      
      const dist = this.distance(monster.position, unit.position);
      if (dist < nearestDist && dist <= monster.aggroRange) {
        nearestDist = dist;
        nearest = { id, position: unit.position, health: unit.health };
      }
    }
    
    return nearest;
  }
  
  // === COMBAT ===
  
  /**
   * Deal damage to a monster
   */
  damageMonster(monsterId: string, damage: number, attackerId: string): boolean {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.state === 'dead') return false;
    
    // Apply defense reduction
    const reducedDamage = Math.max(1, damage - Math.floor(monster.defense / 2));
    monster.health -= reducedDamage;
    
    // Aggro on attacker
    if (monster.state === 'idle' || monster.state === 'wander') {
      monster.targetId = attackerId;
      monster.state = 'chase';
    }
    
    this.onMonsterDamaged?.(monsterId, reducedDamage, monster.health);
    
    // Check death
    if (monster.health <= 0) {
      this.killMonster(monster, attackerId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Kill a monster and drop loot
   */
  private killMonster(monster: Monster, killedBy: string): void {
    monster.state = 'dead';
    monster.health = 0;
    monster.animState = 'idle';
    
    // Roll loot
    const def = getUnitDefinition(monster.unitId);
    const loot = def ? rollLoot(def) : { gold: 0, xp: 0 };
    
    // Apply tier bonus
    const tierMultiplier = monster.tier === 'elite' ? 2 : monster.tier === 'boss' ? 5 : 1;
    loot.gold = Math.floor(loot.gold * tierMultiplier);
    loot.xp = Math.floor(loot.xp * tierMultiplier);
    
    console.log(`[MonsterSystem] ${monster.name} killed! Loot: ${loot.gold}g, ${loot.xp}xp`);
    
    // Fire callback
    this.onMonsterKilled?.({
      monsterId: monster.id,
      killedBy,
      position: monster.position,
      loot,
    });
    
    // Remove after delay (for death animation)
    setTimeout(() => {
      this.monsters.delete(monster.id);
    }, 2000);
  }
  
  // === PLAYER TRACKING ===
  
  /**
   * Update player unit positions for aggro
   */
  updatePlayerUnits(units: Map<string, { position: Position; health: number }>): void {
    this.playerUnits = units;
  }
  
  /**
   * Add a single player unit
   */
  addPlayerUnit(id: string, position: Position, health: number): void {
    this.playerUnits.set(id, { position, health });
  }
  
  /**
   * Remove a player unit
   */
  removePlayerUnit(id: string): void {
    this.playerUnits.delete(id);
  }
  
  // === QUERIES ===
  
  /**
   * Get monster by ID
   */
  getMonster(id: string): Monster | undefined {
    return this.monsters.get(id);
  }
  
  /**
   * Get all monsters
   */
  getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }
  
  /**
   * Get monsters on an island
   */
  getMonstersOnIsland(islandId: string): Monster[] {
    return Array.from(this.monsters.values())
      .filter(m => m.islandId === islandId && m.state !== 'dead');
  }
  
  /**
   * Get monsters near a position
   */
  getMonstersNear(position: Position, radius: number): Monster[] {
    return Array.from(this.monsters.values())
      .filter(m => m.state !== 'dead' && this.distance(m.position, position) <= radius);
  }
  
  /**
   * Check if island is cleared of monsters
   */
  isIslandCleared(islandId: string): boolean {
    return this.getMonstersOnIsland(islandId).length === 0;
  }
  
  /**
   * Remove all monsters from island
   */
  clearIsland(islandId: string): void {
    for (const monster of this.monsters.values()) {
      if (monster.islandId === islandId) {
        this.monsters.delete(monster.id);
      }
    }
  }
  
  /**
   * Get monster at world position
   */
  getMonsterAt(x: number, y: number, radius: number = 20): Monster | null {
    for (const monster of this.monsters.values()) {
      if (monster.state === 'dead') continue;
      const dist = this.distance(monster.position, { x, y });
      if (dist <= radius) return monster;
    }
    return null;
  }
  
  // === RENDERING DATA ===
  
  /**
   * Get rendering data for a monster
   */
  getRenderData(monsterId: string): {
    position: Position;
    spriteSheet: string;
    frame: number;
    row: number;
    direction: 'left' | 'right';
    health: number;
    maxHealth: number;
    tier: MonsterTier;
    name: string;
  } | null {
    const monster = this.monsters.get(monsterId);
    if (!monster) return null;
    
    const def = getUnitDefinition(monster.unitId);
    if (!def) return null;
    
    // Determine animation row
    let row = 0;
    switch (monster.animState) {
      case 'idle': row = def.animations.idle.row; break;
      case 'walk': row = def.animations.walk.row; break;
      case 'attack': row = def.animations.attack.row; break;
    }
    
    return {
      position: monster.position,
      spriteSheet: def.spriteSheet,
      frame: monster.animFrame,
      row,
      direction: monster.direction,
      health: monster.health,
      maxHealth: monster.maxHealth,
      tier: monster.tier,
      name: monster.name,
    };
  }
  
  // === UTILITY ===
  
  private distance(a: Position, b: Position): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}

// Singleton instance
export const monsterSystem = new MonsterSystem();
