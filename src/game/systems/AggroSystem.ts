// ============================================
// AGGRO SYSTEM
// Auto-targeting, turret AI, aggro ranges
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import { CollisionSystem, CollisionLayer, type Collider } from './CollisionSystem.ts';

// === AGGRO ENTITY TYPES ===

export type AggroEntityType = 
  | 'hero'
  | 'unit'
  | 'enemy'
  | 'tower'
  | 'ship'
  | 'building';

export type AIBehavior = 
  | 'passive'      // Never attacks
  | 'defensive'    // Only attacks when attacked
  | 'aggressive'   // Attacks enemies in range
  | 'turret'       // Auto-attacks continuously
  | 'patrol'       // Moves between points, attacks in range
  | 'guard'        // Guards a position, attacks in range
  | 'chase';       // Chases and attacks enemies

export type TargetPriority = 
  | 'closest'
  | 'weakest'
  | 'strongest'
  | 'hero_first'
  | 'building_first'
  | 'random';

// === AGGRO ENTITY ===

export interface AggroEntity {
  id: string;
  type: AggroEntityType;
  position: Position;
  faction: FactionId;
  
  // Combat stats
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;  // ms between attacks
  lastAttackTime: number;
  
  // Aggro settings
  aggroRange: number;      // Detection range
  leashRange: number;      // Max chase distance from origin
  originPosition: Position;
  
  // AI
  behavior: AIBehavior;
  targetPriority: TargetPriority;
  currentTargetId: string | null;
  aggroList: Map<string, number>;  // Entity ID -> threat level
  
  // State
  isAttacking: boolean;
  isAggroed: boolean;
  
  // Callbacks (optional)
  onAggro?: (target: AggroEntity) => void;
  onDeaggro?: () => void;
  onAttack?: (target: AggroEntity, damage: number) => void;
  onTakeDamage?: (attacker: AggroEntity, damage: number) => void;
}

// === ATTACK EVENT ===

export interface AttackEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  position: Position;
  isRanged: boolean;
  projectileType?: string;
}

// === AGGRO SYSTEM ===

export class AggroSystem {
  private entities: Map<string, AggroEntity> = new Map();
  private collisionSystem: CollisionSystem | null = null;
  
  // Events
  public onAttack: ((event: AttackEvent) => void) | null = null;
  public onEntityDeath: ((entity: AggroEntity, killer: AggroEntity | null) => void) | null = null;
  
  // Default aggro ranges by type
  private static readonly DEFAULT_AGGRO_RANGES: Record<AggroEntityType, number> = {
    hero: 200,
    unit: 150,
    enemy: 180,
    tower: 300,
    ship: 350,
    building: 0  // Buildings don't aggro by default
  };
  
  // Default attack ranges
  private static readonly DEFAULT_ATTACK_RANGES: Record<AggroEntityType, number> = {
    hero: 50,
    unit: 40,
    enemy: 45,
    tower: 280,
    ship: 320,
    building: 0
  };

  constructor(collisionSystem?: CollisionSystem) {
    this.collisionSystem = collisionSystem ?? null;
  }

  setCollisionSystem(system: CollisionSystem): void {
    this.collisionSystem = system;
  }

  // === ENTITY MANAGEMENT ===

  registerEntity(config: {
    id: string;
    type: AggroEntityType;
    position: Position;
    faction: FactionId;
    health: number;
    maxHealth?: number;
    attackDamage?: number;
    attackRange?: number;
    attackCooldown?: number;
    aggroRange?: number;
    leashRange?: number;
    behavior?: AIBehavior;
    targetPriority?: TargetPriority;
  }): AggroEntity {
    const entity: AggroEntity = {
      id: config.id,
      type: config.type,
      position: { ...config.position },
      faction: config.faction,
      health: config.health,
      maxHealth: config.maxHealth ?? config.health,
      attackDamage: config.attackDamage ?? 10,
      attackRange: config.attackRange ?? AggroSystem.DEFAULT_ATTACK_RANGES[config.type],
      attackCooldown: config.attackCooldown ?? 1000,
      lastAttackTime: 0,
      aggroRange: config.aggroRange ?? AggroSystem.DEFAULT_AGGRO_RANGES[config.type],
      leashRange: config.leashRange ?? 500,
      originPosition: { ...config.position },
      behavior: config.behavior ?? this.getDefaultBehavior(config.type),
      targetPriority: config.targetPriority ?? 'closest',
      currentTargetId: null,
      aggroList: new Map(),
      isAttacking: false,
      isAggroed: false
    };

    this.entities.set(config.id, entity);
    return entity;
  }

  private getDefaultBehavior(type: AggroEntityType): AIBehavior {
    switch (type) {
      case 'tower': return 'turret';
      case 'ship': return 'turret';
      case 'hero': return 'aggressive';
      case 'unit': return 'aggressive';
      case 'enemy': return 'aggressive';
      case 'building': return 'passive';
      default: return 'passive';
    }
  }

  unregisterEntity(id: string): void {
    this.entities.delete(id);
    
    // Remove from all aggro lists
    for (const entity of this.entities.values()) {
      entity.aggroList.delete(id);
      if (entity.currentTargetId === id) {
        entity.currentTargetId = null;
        entity.isAggroed = false;
      }
    }
  }

  getEntity(id: string): AggroEntity | undefined {
    return this.entities.get(id);
  }

  updatePosition(id: string, position: Position): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.position = { ...position };
    }
  }

  // === FACTION HELPERS ===

  isEnemy(a: AggroEntity, b: AggroEntity): boolean {
    // Same faction = not enemy
    if (a.faction === b.faction) return false;
    
    // Faction 0 is neutral (enemies to all)
    if (a.faction === 0 || b.faction === 0) return true;
    
    // Different factions = enemies
    return true;
  }

  // === AGGRO LOGIC ===

  update(deltaTime: number): AttackEvent[] {
    const attacks: AttackEvent[] = [];
    const currentTime = performance.now();

    for (const entity of this.entities.values()) {
      if (entity.behavior === 'passive') continue;
      if (entity.health <= 0) continue;

      // Find potential targets
      const targets = this.findTargetsInRange(entity);
      
      // Update aggro
      this.updateAggro(entity, targets);
      
      // Select best target
      const target = this.selectTarget(entity, targets);
      
      // Handle target changes
      if (target && entity.currentTargetId !== target.id) {
        entity.currentTargetId = target.id;
        entity.isAggroed = true;
        entity.onAggro?.(target);
      } else if (!target && entity.isAggroed) {
        entity.currentTargetId = null;
        entity.isAggroed = false;
        entity.onDeaggro?.();
      }

      // Attack if possible
      if (target && this.canAttack(entity, target, currentTime)) {
        const attack = this.performAttack(entity, target, currentTime);
        attacks.push(attack);
      }
    }

    return attacks;
  }

  private findTargetsInRange(entity: AggroEntity): AggroEntity[] {
    const targets: AggroEntity[] = [];

    if (this.collisionSystem) {
      // Use collision system for efficient spatial query
      const colliders = this.collisionSystem.queryRadius(
        entity.position,
        entity.aggroRange,
        CollisionLayer.Unit | CollisionLayer.Building | CollisionLayer.Ship
      );

      for (const collider of colliders) {
        const target = this.entities.get(collider.id);
        if (target && this.isEnemy(entity, target) && target.health > 0) {
          targets.push(target);
        }
      }
    } else {
      // Fallback: check all entities
      for (const target of this.entities.values()) {
        if (target.id === entity.id) continue;
        if (!this.isEnemy(entity, target)) continue;
        if (target.health <= 0) continue;

        const dist = this.getDistance(entity.position, target.position);
        if (dist <= entity.aggroRange) {
          targets.push(target);
        }
      }
    }

    return targets;
  }

  private updateAggro(entity: AggroEntity, targets: AggroEntity[]): void {
    // Decay aggro over time
    for (const [id, threat] of entity.aggroList) {
      const newThreat = threat * 0.99; // Decay
      if (newThreat < 1) {
        entity.aggroList.delete(id);
      } else {
        entity.aggroList.set(id, newThreat);
      }
    }

    // Add new targets to aggro list
    for (const target of targets) {
      if (!entity.aggroList.has(target.id)) {
        entity.aggroList.set(target.id, 10); // Base aggro
      }
    }
  }

  private selectTarget(entity: AggroEntity, targets: AggroEntity[]): AggroEntity | null {
    if (targets.length === 0) return null;

    // Check if current target is still valid
    if (entity.currentTargetId) {
      const current = targets.find(t => t.id === entity.currentTargetId);
      if (current) {
        // Stick with current target unless there's a much better option
        const currentDist = this.getDistance(entity.position, current.position);
        if (currentDist <= entity.attackRange * 1.5) {
          return current;
        }
      }
    }

    // Select based on priority
    switch (entity.targetPriority) {
      case 'closest':
        return this.selectClosest(entity, targets);
      case 'weakest':
        return this.selectWeakest(targets);
      case 'strongest':
        return this.selectStrongest(targets);
      case 'hero_first':
        return this.selectHeroFirst(entity, targets);
      case 'building_first':
        return this.selectBuildingFirst(entity, targets);
      case 'random':
        return targets[Math.floor(Math.random() * targets.length)];
      default:
        return this.selectClosest(entity, targets);
    }
  }

  private selectClosest(entity: AggroEntity, targets: AggroEntity[]): AggroEntity {
    let closest = targets[0];
    let minDist = this.getDistance(entity.position, closest.position);

    for (let i = 1; i < targets.length; i++) {
      const dist = this.getDistance(entity.position, targets[i].position);
      if (dist < minDist) {
        minDist = dist;
        closest = targets[i];
      }
    }

    return closest;
  }

  private selectWeakest(targets: AggroEntity[]): AggroEntity {
    let weakest = targets[0];
    let minHealth = weakest.health;

    for (let i = 1; i < targets.length; i++) {
      if (targets[i].health < minHealth) {
        minHealth = targets[i].health;
        weakest = targets[i];
      }
    }

    return weakest;
  }

  private selectStrongest(targets: AggroEntity[]): AggroEntity {
    let strongest = targets[0];
    let maxHealth = strongest.maxHealth;

    for (let i = 1; i < targets.length; i++) {
      if (targets[i].maxHealth > maxHealth) {
        maxHealth = targets[i].maxHealth;
        strongest = targets[i];
      }
    }

    return strongest;
  }

  private selectHeroFirst(entity: AggroEntity, targets: AggroEntity[]): AggroEntity {
    const heroes = targets.filter(t => t.type === 'hero');
    if (heroes.length > 0) {
      return this.selectClosest(entity, heroes);
    }
    return this.selectClosest(entity, targets);
  }

  private selectBuildingFirst(entity: AggroEntity, targets: AggroEntity[]): AggroEntity {
    const buildings = targets.filter(t => t.type === 'building' || t.type === 'tower');
    if (buildings.length > 0) {
      return this.selectClosest(entity, buildings);
    }
    return this.selectClosest(entity, targets);
  }

  // === ATTACK LOGIC ===

  private canAttack(entity: AggroEntity, target: AggroEntity, currentTime: number): boolean {
    // Check cooldown
    if (currentTime - entity.lastAttackTime < entity.attackCooldown) {
      return false;
    }

    // Check range
    const dist = this.getDistance(entity.position, target.position);
    if (dist > entity.attackRange) {
      return false;
    }

    // Check behavior restrictions
    if (entity.behavior === 'defensive' && !entity.aggroList.has(target.id)) {
      return false;
    }

    return true;
  }

  private performAttack(entity: AggroEntity, target: AggroEntity, currentTime: number): AttackEvent {
    entity.lastAttackTime = currentTime;
    entity.isAttacking = true;

    const damage = this.calculateDamage(entity, target);
    const isRanged = entity.attackRange > 80;

    // Apply damage
    target.health -= damage;

    // Add threat to target's aggro list
    target.aggroList.set(entity.id, (target.aggroList.get(entity.id) ?? 0) + damage);

    // Callbacks
    entity.onAttack?.(target, damage);
    target.onTakeDamage?.(entity, damage);

    // Check death
    if (target.health <= 0) {
      this.handleDeath(target, entity);
    }

    // Fire event
    const event: AttackEvent = {
      attackerId: entity.id,
      targetId: target.id,
      damage,
      position: target.position,
      isRanged,
      projectileType: isRanged ? this.getProjectileType(entity) : undefined
    };

    this.onAttack?.(event);

    return event;
  }

  private calculateDamage(attacker: AggroEntity, target: AggroEntity): number {
    // Base damage with small variance
    const variance = 0.9 + Math.random() * 0.2;
    return Math.floor(attacker.attackDamage * variance);
  }

  private getProjectileType(entity: AggroEntity): string {
    switch (entity.type) {
      case 'tower': return 'arrow';
      case 'ship': return 'cannonball';
      case 'hero': return 'magic';
      default: return 'arrow';
    }
  }

  private handleDeath(entity: AggroEntity, killer: AggroEntity | null): void {
    this.onEntityDeath?.(entity, killer);
    this.unregisterEntity(entity.id);
  }

  // === THREAT MANAGEMENT ===

  addThreat(entityId: string, targetId: string, amount: number): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      const current = entity.aggroList.get(targetId) ?? 0;
      entity.aggroList.set(targetId, current + amount);
    }
  }

  clearThreat(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.aggroList.clear();
      entity.currentTargetId = null;
      entity.isAggroed = false;
    }
  }

  // === MANUAL TARGETING ===

  setTarget(entityId: string, targetId: string): boolean {
    const entity = this.entities.get(entityId);
    const target = this.entities.get(targetId);

    if (!entity || !target) return false;
    if (!this.isEnemy(entity, target)) return false;

    entity.currentTargetId = targetId;
    entity.isAggroed = true;
    entity.aggroList.set(targetId, 100); // High priority

    return true;
  }

  clearTarget(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.currentTargetId = null;
      entity.isAggroed = false;
    }
  }

  // === UTILITY ===

  private getDistance(a: Position, b: Position): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  // === QUERIES ===

  getEntitiesInRange(position: Position, range: number, faction?: FactionId): AggroEntity[] {
    const results: AggroEntity[] = [];

    for (const entity of this.entities.values()) {
      if (faction !== undefined && entity.faction !== faction) continue;
      const dist = this.getDistance(position, entity.position);
      if (dist <= range) {
        results.push(entity);
      }
    }

    return results;
  }

  getEnemiesOf(entity: AggroEntity): AggroEntity[] {
    const enemies: AggroEntity[] = [];

    for (const other of this.entities.values()) {
      if (other.id !== entity.id && this.isEnemy(entity, other)) {
        enemies.push(other);
      }
    }

    return enemies;
  }

  // === DEBUG ===

  debugRender(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    ctx.save();

    for (const entity of this.entities.values()) {
      const x = entity.position.x - cameraX;
      const y = entity.position.y - cameraY;

      // Draw aggro range
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, entity.aggroRange, 0, Math.PI * 2);
      ctx.stroke();

      // Draw attack range
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, entity.attackRange, 0, Math.PI * 2);
      ctx.stroke();

      // Draw line to current target
      if (entity.currentTargetId) {
        const target = this.entities.get(entity.currentTargetId);
        if (target) {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(target.position.x - cameraX, target.position.y - cameraY);
          ctx.stroke();
        }
      }

      // Draw health bar
      const barWidth = 40;
      const barHeight = 4;
      const healthPercent = entity.health / entity.maxHealth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x - barWidth / 2, y - 30, barWidth, barHeight);

      ctx.fillStyle = healthPercent > 0.5 ? '#4f4' : healthPercent > 0.25 ? '#ff4' : '#f44';
      ctx.fillRect(x - barWidth / 2, y - 30, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }
}
