// ============================================
// COMBAT AI
// Enhanced combat system with smart targeting,
// unit separation, collision avoidance, and tactics
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import { GAME_CONFIG } from '../config/GameConfig.ts';

// === TYPES ===

export type CombatState = 
  | 'idle'
  | 'moving'
  | 'pursuing'
  | 'attacking'
  | 'retreating'
  | 'holding'
  | 'forming';

export type TargetPriority = 
  | 'nearest'
  | 'lowest_health'
  | 'highest_threat'
  | 'ranged_first'
  | 'healers_first';

export interface CombatUnit {
  id: string;
  faction: FactionId;
  position: Position;
  velocity: Position;
  
  // Combat stats
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  
  // State
  state: CombatState;
  targetId: string | null;
  attackCooldown: number;
  
  // Behavior
  aggroRange: number;
  isRanged: boolean;
  threatLevel: number;
  
  // Collision
  radius: number;
  
  // Formation
  formationPosition: Position | null;
  groupId: string | null;
}

export interface DamageEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  damageType: 'physical' | 'magic' | 'fire' | 'frost';
}

export interface CombatGroup {
  id: string;
  units: Set<string>;
  formation: 'box' | 'line' | 'wedge' | 'circle';
  targetPosition: Position | null;
  aggressive: boolean;
}

// === CONSTANTS ===

const SEPARATION_RADIUS = 25;
const SEPARATION_FORCE = 100;
// Reserved for future flocking behavior
// const COHESION_FORCE = 20;
// const ALIGNMENT_FORCE = 10;
const TARGET_UPDATE_INTERVAL = 0.3;
// const COLLISION_RESPONSE = 150;
const KITING_DISTANCE = 30;
const CRITICAL_HIT_CHANCE = 0.1;
const CRITICAL_HIT_MULTIPLIER = 2.0;

// === COMBAT AI CLASS ===

export class CombatAI {
  private units: Map<string, CombatUnit> = new Map();
  private groups: Map<string, CombatGroup> = new Map();
  private targetUpdateTimer: number = 0;
  private gameTime: number = 0;
  
  // Spatial grid for efficient queries
  private spatialGrid: Map<string, Set<string>> = new Map();
  private gridCellSize: number = 100;
  
  // Callbacks
  public onDamageDealt: ((event: DamageEvent) => void) | null = null;
  public onUnitKilled: ((unitId: string, killerId: string) => void) | null = null;
  
  constructor() {}
  
  // === UNIT MANAGEMENT ===
  
  /**
   * Register a combat unit
   */
  registerUnit(config: {
    id: string;
    faction: FactionId;
    position: Position;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    attackRange: number;
    attackSpeed: number;
    moveSpeed: number;
    isRanged?: boolean;
    radius?: number;
  }): void {
    const unit: CombatUnit = {
      id: config.id,
      faction: config.faction,
      position: { ...config.position },
      velocity: { x: 0, y: 0 },
      health: config.health,
      maxHealth: config.maxHealth,
      attack: config.attack,
      defense: config.defense,
      attackRange: config.attackRange,
      attackSpeed: config.attackSpeed,
      moveSpeed: config.moveSpeed,
      state: 'idle',
      targetId: null,
      attackCooldown: 0,
      aggroRange: config.attackRange * 2,
      isRanged: config.isRanged ?? config.attackRange > GAME_CONFIG.ATTACK_RANGE_MELEE,
      threatLevel: config.attack * (config.isRanged ? 1.5 : 1),
      radius: config.radius ?? GAME_CONFIG.UNIT_COLLISION_RADIUS,
      formationPosition: null,
      groupId: null,
    };
    
    this.units.set(config.id, unit);
    this.updateSpatialGrid(unit);
  }
  
  /**
   * Remove a unit
   */
  removeUnit(id: string): void {
    const unit = this.units.get(id);
    if (unit) {
      this.removeFomSpatialGrid(unit);
      
      // Remove from group
      if (unit.groupId) {
        const group = this.groups.get(unit.groupId);
        if (group) {
          group.units.delete(id);
        }
      }
    }
    this.units.delete(id);
  }
  
  /**
   * Update unit position (external sync)
   */
  updateUnitPosition(id: string, position: Position): void {
    const unit = this.units.get(id);
    if (unit) {
      this.removeFomSpatialGrid(unit);
      unit.position = { ...position };
      this.updateSpatialGrid(unit);
    }
  }
  
  /**
   * Update unit health
   */
  updateUnitHealth(id: string, health: number): void {
    const unit = this.units.get(id);
    if (unit) {
      unit.health = health;
    }
  }
  
  // === SPATIAL GRID ===
  
  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.gridCellSize);
    const cy = Math.floor(y / this.gridCellSize);
    return `${cx},${cy}`;
  }
  
  private updateSpatialGrid(unit: CombatUnit): void {
    const key = this.getCellKey(unit.position.x, unit.position.y);
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, new Set());
    }
    this.spatialGrid.get(key)!.add(unit.id);
  }
  
  private removeFomSpatialGrid(unit: CombatUnit): void {
    const key = this.getCellKey(unit.position.x, unit.position.y);
    const cell = this.spatialGrid.get(key);
    if (cell) {
      cell.delete(unit.id);
    }
  }
  
  /**
   * Get units near a position
   */
  private getUnitsNear(position: Position, radius: number): CombatUnit[] {
    const results: CombatUnit[] = [];
    const cells = Math.ceil(radius / this.gridCellSize) + 1;
    const baseCx = Math.floor(position.x / this.gridCellSize);
    const baseCy = Math.floor(position.y / this.gridCellSize);
    
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dy = -cells; dy <= cells; dy++) {
        const key = `${baseCx + dx},${baseCy + dy}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          for (const id of cell) {
            const unit = this.units.get(id);
            if (unit && this.distance(position, unit.position) <= radius) {
              results.push(unit);
            }
          }
        }
      }
    }
    
    return results;
  }
  
  // === MAIN UPDATE ===
  
  /**
   * Update all combat units
   */
  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    // Update targets periodically
    this.targetUpdateTimer += deltaTime;
    if (this.targetUpdateTimer >= TARGET_UPDATE_INTERVAL) {
      this.targetUpdateTimer = 0;
      this.updateTargets();
    }
    
    // Update each unit
    for (const unit of this.units.values()) {
      // Update cooldown
      if (unit.attackCooldown > 0) {
        unit.attackCooldown -= deltaTime;
      }
      
      // State machine
      this.updateUnitBehavior(unit, deltaTime);
      
      // Apply separation and collision avoidance
      this.applySeparation(unit, deltaTime);
      
      // Apply velocity
      this.applyVelocity(unit, deltaTime);
      
      // Update spatial grid
      this.updateSpatialGrid(unit);
    }
  }
  
  /**
   * Update all unit targets
   */
  private updateTargets(): void {
    for (const unit of this.units.values()) {
      if (unit.state === 'holding' || unit.state === 'forming') continue;
      
      // Find best target
      const enemies = this.getEnemiesInRange(unit, unit.aggroRange);
      if (enemies.length > 0) {
        const bestTarget = this.selectTarget(unit, enemies);
        unit.targetId = bestTarget?.id || null;
      } else {
        unit.targetId = null;
      }
    }
  }
  
  /**
   * Update single unit behavior
   */
  private updateUnitBehavior(unit: CombatUnit, deltaTime: number): void {
    const target = unit.targetId ? this.units.get(unit.targetId) : null;
    
    // No target - idle
    if (!target || target.health <= 0) {
      unit.state = 'idle';
      unit.targetId = null;
      unit.velocity.x *= 0.9;
      unit.velocity.y *= 0.9;
      return;
    }
    
    const distance = this.distance(unit.position, target.position);
    
    // In attack range
    if (distance <= unit.attackRange) {
      unit.state = 'attacking';
      
      // Ranged units kite backwards if enemy is close
      if (unit.isRanged && distance < unit.attackRange * 0.5) {
        const dx = unit.position.x - target.position.x;
        const dy = unit.position.y - target.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        
        unit.velocity.x += (dx / dist) * KITING_DISTANCE;
        unit.velocity.y += (dy / dist) * KITING_DISTANCE;
      }
      
      // Attack if cooldown ready
      if (unit.attackCooldown <= 0) {
        this.performAttack(unit, target);
      }
    }
    // Pursue target
    else {
      unit.state = 'pursuing';
      
      const dx = target.position.x - unit.position.x;
      const dy = target.position.y - unit.position.y;
      const dist = Math.hypot(dx, dy) || 1;
      
      // Move toward target
      const speed = unit.moveSpeed;
      unit.velocity.x += (dx / dist) * speed * deltaTime;
      unit.velocity.y += (dy / dist) * speed * deltaTime;
      
      // Cap velocity
      const velMag = Math.hypot(unit.velocity.x, unit.velocity.y);
      if (velMag > speed) {
        unit.velocity.x = (unit.velocity.x / velMag) * speed;
        unit.velocity.y = (unit.velocity.y / velMag) * speed;
      }
    }
  }
  
  // === TARGETING ===
  
  /**
   * Get enemies within range
   */
  private getEnemiesInRange(unit: CombatUnit, range: number): CombatUnit[] {
    return this.getUnitsNear(unit.position, range)
      .filter(u => u.faction !== unit.faction && u.health > 0);
  }
  
  /**
   * Select best target based on priority
   */
  private selectTarget(
    unit: CombatUnit,
    enemies: CombatUnit[],
    priority: TargetPriority = 'highest_threat'
  ): CombatUnit | null {
    if (enemies.length === 0) return null;
    
    switch (priority) {
      case 'nearest':
        return enemies.reduce((best, e) => {
          const dist = this.distance(unit.position, e.position);
          const bestDist = this.distance(unit.position, best.position);
          return dist < bestDist ? e : best;
        });
        
      case 'lowest_health':
        return enemies.reduce((best, e) => 
          e.health < best.health ? e : best
        );
        
      case 'highest_threat':
        return enemies.reduce((best, e) => 
          e.threatLevel > best.threatLevel ? e : best
        );
        
      case 'ranged_first':
        const ranged = enemies.filter(e => e.isRanged);
        if (ranged.length > 0) {
          return ranged.reduce((best, e) => {
            const dist = this.distance(unit.position, e.position);
            const bestDist = this.distance(unit.position, best.position);
            return dist < bestDist ? e : best;
          });
        }
        // Fall through to nearest melee
        return this.selectTarget(unit, enemies, 'nearest');
        
      default:
        return enemies[0];
    }
  }
  
  // === COMBAT ===
  
  /**
   * Perform an attack
   */
  private performAttack(attacker: CombatUnit, target: CombatUnit): void {
    // Calculate damage
    const baseDamage = attacker.attack;
    const defense = target.defense;
    const mitigated = Math.floor(defense * 0.5);
    
    // Critical hit check
    const isCritical = Math.random() < CRITICAL_HIT_CHANCE;
    const critMultiplier = isCritical ? CRITICAL_HIT_MULTIPLIER : 1;
    
    const damage = Math.max(1, Math.floor((baseDamage - mitigated) * critMultiplier));
    
    // Apply damage
    target.health -= damage;
    
    // Reset cooldown
    attacker.attackCooldown = 1 / attacker.attackSpeed;
    
    // Fire event
    this.onDamageDealt?.({
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      isCritical,
      damageType: 'physical',
    });
    
    // Check death
    if (target.health <= 0) {
      target.health = 0;
      this.onUnitKilled?.(target.id, attacker.id);
    }
  }
  
  /**
   * Apply external damage to a unit
   */
  damageUnit(unitId: string, damage: number, attackerId: string): boolean {
    const unit = this.units.get(unitId);
    if (!unit || unit.health <= 0) return false;
    
    unit.health -= damage;
    
    this.onDamageDealt?.({
      attackerId,
      targetId: unitId,
      damage,
      isCritical: false,
      damageType: 'physical',
    });
    
    if (unit.health <= 0) {
      unit.health = 0;
      this.onUnitKilled?.(unitId, attackerId);
      return true;
    }
    
    return false;
  }
  
  // === SEPARATION & COLLISION ===
  
  /**
   * Apply separation forces to avoid unit overlap
   */
  private applySeparation(unit: CombatUnit, deltaTime: number): void {
    const nearby = this.getUnitsNear(unit.position, SEPARATION_RADIUS * 2)
      .filter(u => u.id !== unit.id);
    
    let separationX = 0;
    let separationY = 0;
    
    for (const other of nearby) {
      const dx = unit.position.x - other.position.x;
      const dy = unit.position.y - other.position.y;
      const dist = Math.hypot(dx, dy);
      
      // Minimum separation distance
      const minDist = unit.radius + other.radius;
      
      if (dist < minDist && dist > 0.1) {
        // Push away proportional to overlap
        const overlap = minDist - dist;
        const force = (overlap / minDist) * SEPARATION_FORCE;
        
        separationX += (dx / dist) * force;
        separationY += (dy / dist) * force;
      }
      // Soft separation
      else if (dist < SEPARATION_RADIUS && dist > 0.1) {
        const force = (1 - dist / SEPARATION_RADIUS) * SEPARATION_FORCE * 0.3;
        separationX += (dx / dist) * force;
        separationY += (dy / dist) * force;
      }
    }
    
    unit.velocity.x += separationX * deltaTime;
    unit.velocity.y += separationY * deltaTime;
  }
  
  /**
   * Apply velocity to position
   */
  private applyVelocity(unit: CombatUnit, deltaTime: number): void {
    this.removeFomSpatialGrid(unit);
    
    unit.position.x += unit.velocity.x * deltaTime;
    unit.position.y += unit.velocity.y * deltaTime;
    
    // Damping
    unit.velocity.x *= 0.85;
    unit.velocity.y *= 0.85;
    
    // Clamp tiny velocities
    if (Math.abs(unit.velocity.x) < 0.1) unit.velocity.x = 0;
    if (Math.abs(unit.velocity.y) < 0.1) unit.velocity.y = 0;
    
    this.updateSpatialGrid(unit);
  }
  
  // === FORMATIONS ===
  
  /**
   * Create a formation group
   */
  createGroup(
    unitIds: string[],
    formation: CombatGroup['formation'] = 'box'
  ): string {
    const groupId = `group_${Date.now()}`;
    
    const group: CombatGroup = {
      id: groupId,
      units: new Set(unitIds),
      formation,
      targetPosition: null,
      aggressive: true,
    };
    
    this.groups.set(groupId, group);
    
    // Assign group to units
    for (const id of unitIds) {
      const unit = this.units.get(id);
      if (unit) {
        unit.groupId = groupId;
      }
    }
    
    return groupId;
  }
  
  /**
   * Move group to position with formation
   */
  moveGroupTo(groupId: string, position: Position): void {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    group.targetPosition = position;
    
    // Calculate formation positions
    const positions = this.calculateFormationPositions(
      group.formation,
      position,
      group.units.size
    );
    
    let i = 0;
    for (const unitId of group.units) {
      const unit = this.units.get(unitId);
      if (unit && positions[i]) {
        unit.formationPosition = positions[i];
        unit.state = 'forming';
      }
      i++;
    }
  }
  
  /**
   * Calculate formation positions
   */
  private calculateFormationPositions(
    formation: CombatGroup['formation'],
    center: Position,
    count: number
  ): Position[] {
    const positions: Position[] = [];
    const spacing = 35;
    
    switch (formation) {
      case 'box': {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const offsetX = ((cols - 1) * spacing) / 2;
        const offsetY = ((rows - 1) * spacing) / 2;
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols && positions.length < count; c++) {
            positions.push({
              x: center.x + c * spacing - offsetX,
              y: center.y + r * spacing - offsetY,
            });
          }
        }
        break;
      }
      
      case 'line': {
        const offsetX = ((count - 1) * spacing) / 2;
        for (let i = 0; i < count; i++) {
          positions.push({
            x: center.x + i * spacing - offsetX,
            y: center.y,
          });
        }
        break;
      }
      
      case 'wedge': {
        let row = 0;
        let placed = 0;
        while (placed < count) {
          const rowCount = row + 1;
          const offsetX = (rowCount - 1) * spacing / 2;
          
          for (let c = 0; c < rowCount && placed < count; c++) {
            positions.push({
              x: center.x + c * spacing - offsetX,
              y: center.y + row * spacing,
            });
            placed++;
          }
          row++;
        }
        break;
      }
      
      case 'circle': {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const radius = count * spacing / (Math.PI * 2);
          positions.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          });
        }
        break;
      }
    }
    
    return positions;
  }
  
  // === COMMANDS ===
  
  /**
   * Command unit to attack target
   */
  commandAttack(unitId: string, targetId: string): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.targetId = targetId;
      unit.state = 'pursuing';
    }
  }
  
  /**
   * Command unit to move to position
   */
  commandMove(unitId: string, position: Position): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.formationPosition = position;
      unit.state = 'moving';
      unit.targetId = null;
    }
  }
  
  /**
   * Command unit to hold position
   */
  commandHold(unitId: string): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.state = 'holding';
      unit.velocity = { x: 0, y: 0 };
    }
  }
  
  /**
   * Command unit to stop
   */
  commandStop(unitId: string): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.state = 'idle';
      unit.targetId = null;
      unit.velocity = { x: 0, y: 0 };
    }
  }
  
  // === QUERIES ===
  
  /**
   * Get unit state
   */
  getUnit(id: string): CombatUnit | undefined {
    return this.units.get(id);
  }
  
  /**
   * Get all units
   */
  getAllUnits(): CombatUnit[] {
    return Array.from(this.units.values());
  }
  
  /**
   * Get units by faction
   */
  getUnitsByFaction(faction: FactionId): CombatUnit[] {
    return Array.from(this.units.values())
      .filter(u => u.faction === faction);
  }
  
  /**
   * Get unit at position
   */
  getUnitAt(x: number, y: number, radius: number = 20): CombatUnit | null {
    for (const unit of this.units.values()) {
      if (unit.health <= 0) continue;
      const dist = this.distance(unit.position, { x, y });
      if (dist <= radius) return unit;
    }
    return null;
  }
  
  /**
   * Get group by ID
   */
  getGroup(id: string): CombatGroup | undefined {
    return this.groups.get(id);
  }
  
  // === UTILITY ===
  
  private distance(a: Position, b: Position): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}

// Singleton instance
export const combatAI = new CombatAI();
