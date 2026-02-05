// ============================================
// AI CONTROLLER
// Handles enemy unit behavior, decision making, and tactics
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import { UnitMovementSystem } from './UnitMovement.ts';

export type AIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'defend' | 'regroup';

export interface AIUnit {
  id: string;
  position: Position;
  faction: FactionId;
  state: AIState;
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  currentCooldown: number;
  aggroRange: number;
  targetId: string | null;
  homePosition: Position;
  leashRange: number; // Max distance from home before returning
}

export interface AIDecision {
  unitId: string;
  action: 'move' | 'attack' | 'stop' | 'flee';
  targetPosition?: Position;
  targetId?: string;
}

// Configuration
const AI_UPDATE_INTERVAL = 0.2; // Seconds between AI decisions
const AGGRO_RANGE = 200;
const ATTACK_RANGE = 50;
const FLEE_HEALTH_THRESHOLD = 0.2; // 20% health
const LEASH_RANGE = 400;
// Future use: const CHASE_TIMEOUT = 5; // Seconds before giving up chase

export class AIController {
  private units: Map<string, AIUnit> = new Map();
  private movementSystem: UnitMovementSystem | null = null;
  private updateTimer: number = 0;
  private playerUnits: Map<string, { position: Position; health: number }> = new Map();
  
  // Callbacks
  public onAttack: ((attackerId: string, targetId: string, damage: number) => void) | null = null;
  
  constructor() {}
  
  /**
   * Set the movement system reference
   */
  setMovementSystem(movement: UnitMovementSystem): void {
    this.movementSystem = movement;
  }
  
  /**
   * Register an AI-controlled unit
   */
  registerUnit(
    id: string,
    position: Position,
    faction: FactionId,
    stats: {
      health: number;
      maxHealth: number;
      attackDamage: number;
      attackRange?: number;
      aggroRange?: number;
    }
  ): void {
    this.units.set(id, {
      id,
      position: { ...position },
      faction,
      state: 'idle',
      health: stats.health,
      maxHealth: stats.maxHealth,
      attackDamage: stats.attackDamage,
      attackRange: stats.attackRange || ATTACK_RANGE,
      attackCooldown: 1.0,
      currentCooldown: 0,
      aggroRange: stats.aggroRange || AGGRO_RANGE,
      targetId: null,
      homePosition: { ...position },
      leashRange: LEASH_RANGE
    });
  }
  
  /**
   * Remove an AI unit
   */
  removeUnit(id: string): void {
    this.units.delete(id);
  }
  
  /**
   * Update player unit positions (for AI targeting)
   */
  updatePlayerUnits(units: Map<string, { position: Position; health: number }>): void {
    this.playerUnits = units;
  }
  
  /**
   * Update AI controller (called each frame)
   */
  update(deltaTime: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Update attack cooldowns
    for (const unit of this.units.values()) {
      if (unit.currentCooldown > 0) {
        unit.currentCooldown -= deltaTime;
      }
    }
    
    // Rate-limited decision making
    this.updateTimer += deltaTime;
    if (this.updateTimer < AI_UPDATE_INTERVAL) {
      return decisions;
    }
    this.updateTimer = 0;
    
    // Make decisions for each AI unit
    for (const unit of this.units.values()) {
      const decision = this.makeDecision(unit);
      if (decision) {
        decisions.push(decision);
        this.executeDecision(unit, decision);
      }
    }
    
    return decisions;
  }
  
  /**
   * Make a decision for a single AI unit
   */
  private makeDecision(unit: AIUnit): AIDecision | null {
    // Check if should flee (low health)
    if (unit.health / unit.maxHealth < FLEE_HEALTH_THRESHOLD) {
      return this.decideFlee(unit);
    }
    
    // Check for nearby enemies
    const nearestEnemy = this.findNearestEnemy(unit);
    
    if (nearestEnemy) {
      const distance = this.distance(unit.position, nearestEnemy.position);
      
      // Within attack range - attack
      if (distance <= unit.attackRange) {
        return this.decideAttack(unit, nearestEnemy);
      }
      
      // Within aggro range - chase
      if (distance <= unit.aggroRange) {
        // Check leash range
        const distFromHome = this.distance(unit.position, unit.homePosition);
        if (distFromHome < unit.leashRange) {
          return this.decideChase(unit, nearestEnemy);
        } else {
          // Too far from home, return
          return this.decideReturn(unit);
        }
      }
    }
    
    // No enemies nearby
    switch (unit.state) {
      case 'chase':
      case 'attack':
        // Lost target, return home or idle
        return this.decideReturn(unit);
        
      case 'flee':
        // Safe now, return to normal
        return this.decideReturn(unit);
        
      case 'idle':
        // Maybe start patrolling
        if (Math.random() < 0.1) {
          return this.decidePatrol(unit);
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Find nearest enemy unit
   */
  private findNearestEnemy(unit: AIUnit): { id: string; position: Position; health: number } | null {
    let nearest: { id: string; position: Position; health: number } | null = null;
    let nearestDist = Infinity;
    
    for (const [id, enemy] of this.playerUnits) {
      if (enemy.health <= 0) continue;
      
      const dist = this.distance(unit.position, enemy.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id, ...enemy };
      }
    }
    
    return nearest;
  }
  
  /**
   * Decide to attack
   */
  private decideAttack(unit: AIUnit, target: { id: string; position: Position }): AIDecision {
    unit.state = 'attack';
    unit.targetId = target.id;
    
    // Perform attack if cooldown ready
    if (unit.currentCooldown <= 0) {
      unit.currentCooldown = unit.attackCooldown;
      
      if (this.onAttack) {
        this.onAttack(unit.id, target.id, unit.attackDamage);
      }
    }
    
    return {
      unitId: unit.id,
      action: 'attack',
      targetId: target.id,
      targetPosition: target.position
    };
  }
  
  /**
   * Decide to chase
   */
  private decideChase(unit: AIUnit, target: { id: string; position: Position }): AIDecision {
    unit.state = 'chase';
    unit.targetId = target.id;
    
    return {
      unitId: unit.id,
      action: 'move',
      targetPosition: target.position,
      targetId: target.id
    };
  }
  
  /**
   * Decide to flee
   */
  private decideFlee(unit: AIUnit): AIDecision {
    unit.state = 'flee';
    unit.targetId = null;
    
    // Run away from nearest enemy
    const nearestEnemy = this.findNearestEnemy(unit);
    let fleeTarget: Position;
    
    if (nearestEnemy) {
      // Run in opposite direction
      const dx = unit.position.x - nearestEnemy.position.x;
      const dy = unit.position.y - nearestEnemy.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      fleeTarget = {
        x: unit.position.x + (dx / dist) * 200,
        y: unit.position.y + (dy / dist) * 200
      };
    } else {
      // Run towards home
      fleeTarget = unit.homePosition;
    }
    
    return {
      unitId: unit.id,
      action: 'flee',
      targetPosition: fleeTarget
    };
  }
  
  /**
   * Decide to return home
   */
  private decideReturn(unit: AIUnit): AIDecision {
    unit.state = 'idle';
    unit.targetId = null;
    
    const distFromHome = this.distance(unit.position, unit.homePosition);
    
    if (distFromHome > 20) {
      return {
        unitId: unit.id,
        action: 'move',
        targetPosition: unit.homePosition
      };
    }
    
    return {
      unitId: unit.id,
      action: 'stop'
    };
  }
  
  /**
   * Decide to patrol
   */
  private decidePatrol(unit: AIUnit): AIDecision {
    unit.state = 'patrol';
    
    // Generate random patrol point near home
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 100;
    
    const patrolTarget = {
      x: unit.homePosition.x + Math.cos(angle) * radius,
      y: unit.homePosition.y + Math.sin(angle) * radius
    };
    
    return {
      unitId: unit.id,
      action: 'move',
      targetPosition: patrolTarget
    };
  }
  
  /**
   * Execute a decision using the movement system
   */
  private executeDecision(unit: AIUnit, decision: AIDecision): void {
    if (!this.movementSystem) return;
    
    switch (decision.action) {
      case 'move':
      case 'flee':
        if (decision.targetPosition) {
          this.movementSystem.commandMove(unit.id, decision.targetPosition);
        }
        break;
        
      case 'attack':
        if (decision.targetPosition) {
          // Move within attack range
          const dx = decision.targetPosition.x - unit.position.x;
          const dy = decision.targetPosition.y - unit.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > unit.attackRange * 0.8) {
            // Get closer
            const targetDist = unit.attackRange * 0.5;
            const moveTarget = {
              x: decision.targetPosition.x - (dx / dist) * targetDist,
              y: decision.targetPosition.y - (dy / dist) * targetDist
            };
            this.movementSystem.commandMove(unit.id, moveTarget);
          } else {
            // In range, stop and attack
            this.movementSystem.commandStop(unit.id);
          }
        }
        break;
        
      case 'stop':
        this.movementSystem.commandStop(unit.id);
        break;
    }
  }
  
  /**
   * Apply damage to an AI unit
   */
  damageUnit(id: string, damage: number): boolean {
    const unit = this.units.get(id);
    if (!unit) return false;
    
    unit.health -= damage;
    
    if (unit.health <= 0) {
      unit.health = 0;
      this.removeUnit(id);
      return true; // Unit died
    }
    
    return false;
  }
  
  /**
   * Update unit position (sync with movement system)
   */
  updateUnitPosition(id: string, position: Position): void {
    const unit = this.units.get(id);
    if (unit) {
      unit.position = { ...position };
    }
  }
  
  /**
   * Get AI unit state
   */
  getUnit(id: string): AIUnit | undefined {
    return this.units.get(id);
  }
  
  /**
   * Get all AI units
   */
  getAllUnits(): AIUnit[] {
    return Array.from(this.units.values());
  }
  
  /**
   * Get units by faction
   */
  getUnitsByFaction(faction: FactionId): AIUnit[] {
    return Array.from(this.units.values()).filter(u => u.faction === faction);
  }
  
  private distance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}

export const aiController = new AIController();
