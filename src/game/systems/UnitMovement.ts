// ============================================
// UNIT MOVEMENT SYSTEM
// Handles pathfinding, steering behaviors, and unit commands
// ============================================

import type { Position, FactionId } from '../../types/index.ts';

export interface MovementTarget {
  position: Position;
  type: 'move' | 'attack' | 'patrol' | 'follow';
  targetId?: string; // For attack/follow commands
}

export interface UnitMovementState {
  id: string;
  position: Position;
  velocity: { x: number; y: number };
  target: MovementTarget | null;
  patrolPoints: Position[];
  patrolIndex: number;
  speed: number;
  faction: FactionId;
  isMoving: boolean;
  arrivalThreshold: number;
}

export interface SteeringForce {
  x: number;
  y: number;
}

// Configuration
const SEPARATION_RADIUS = 30;
const SEPARATION_FORCE = 1.5;
// Future use: Flocking behaviors
// const COHESION_RADIUS = 100;
// const COHESION_FORCE = 0.3;
// const ALIGNMENT_FORCE = 0.2;
const ARRIVAL_SLOWDOWN_RADIUS = 50;
const MAX_STEERING_FORCE = 2.0;

export class UnitMovementSystem {
  private units: Map<string, UnitMovementState> = new Map();
  private isWalkableCallback: ((x: number, y: number) => boolean) | null = null;
  
  constructor() {}
  
  /**
   * Set the walkability check callback
   */
  setWalkableCallback(callback: (x: number, y: number) => boolean): void {
    this.isWalkableCallback = callback;
  }
  
  /**
   * Register a unit for movement tracking
   */
  registerUnit(
    id: string, 
    position: Position, 
    faction: FactionId,
    speed: number = 80
  ): void {
    this.units.set(id, {
      id,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      target: null,
      patrolPoints: [],
      patrolIndex: 0,
      speed,
      faction,
      isMoving: false,
      arrivalThreshold: 10
    });
  }
  
  /**
   * Remove a unit from movement tracking
   */
  removeUnit(id: string): void {
    this.units.delete(id);
  }
  
  /**
   * Issue a move command to a unit
   */
  commandMove(id: string, target: Position): void {
    const unit = this.units.get(id);
    if (!unit) return;
    
    unit.target = { position: target, type: 'move' };
    unit.isMoving = true;
  }
  
  /**
   * Issue an attack-move command (move and attack enemies along the way)
   */
  commandAttackMove(id: string, target: Position, targetId?: string): void {
    const unit = this.units.get(id);
    if (!unit) return;
    
    unit.target = { position: target, type: 'attack', targetId };
    unit.isMoving = true;
  }
  
  /**
   * Issue a patrol command
   */
  commandPatrol(id: string, points: Position[]): void {
    const unit = this.units.get(id);
    if (!unit || points.length === 0) return;
    
    unit.patrolPoints = points;
    unit.patrolIndex = 0;
    unit.target = { position: points[0], type: 'patrol' };
    unit.isMoving = true;
  }
  
  /**
   * Issue a follow command
   */
  commandFollow(id: string, targetId: string): void {
    const unit = this.units.get(id);
    const target = this.units.get(targetId);
    if (!unit || !target) return;
    
    unit.target = { 
      position: target.position, 
      type: 'follow', 
      targetId 
    };
    unit.isMoving = true;
  }
  
  /**
   * Stop a unit
   */
  commandStop(id: string): void {
    const unit = this.units.get(id);
    if (!unit) return;
    
    unit.target = null;
    unit.velocity = { x: 0, y: 0 };
    unit.isMoving = false;
    unit.patrolPoints = [];
  }
  
  /**
   * Update all units (called each frame)
   */
  update(deltaTime: number): Map<string, Position> {
    const updatedPositions = new Map<string, Position>();
    
    for (const [id, unit] of this.units) {
      if (!unit.isMoving || !unit.target) continue;
      
      // Calculate steering force
      const steering = this.calculateSteering(unit);
      
      // Apply steering to velocity
      unit.velocity.x += steering.x * deltaTime;
      unit.velocity.y += steering.y * deltaTime;
      
      // Limit velocity to max speed
      const speed = Math.sqrt(unit.velocity.x ** 2 + unit.velocity.y ** 2);
      if (speed > unit.speed) {
        unit.velocity.x = (unit.velocity.x / speed) * unit.speed;
        unit.velocity.y = (unit.velocity.y / speed) * unit.speed;
      }
      
      // Calculate new position
      const newX = unit.position.x + unit.velocity.x * deltaTime;
      const newY = unit.position.y + unit.velocity.y * deltaTime;
      
      // Check if new position is walkable
      if (!this.isWalkableCallback || this.isWalkableCallback(newX, newY)) {
        unit.position.x = newX;
        unit.position.y = newY;
      } else {
        // Try sliding along obstacles
        if (!this.isWalkableCallback || this.isWalkableCallback(newX, unit.position.y)) {
          unit.position.x = newX;
        } else if (!this.isWalkableCallback || this.isWalkableCallback(unit.position.x, newY)) {
          unit.position.y = newY;
        } else {
          // Completely blocked, stop
          unit.velocity = { x: 0, y: 0 };
        }
      }
      
      // Check arrival
      const distToTarget = this.distance(unit.position, unit.target.position);
      if (distToTarget < unit.arrivalThreshold) {
        this.onArrival(unit);
      }
      
      updatedPositions.set(id, { ...unit.position });
    }
    
    return updatedPositions;
  }
  
  /**
   * Calculate combined steering force for a unit
   */
  private calculateSteering(unit: UnitMovementState): SteeringForce {
    if (!unit.target) return { x: 0, y: 0 };
    
    // Seek/Arrive force
    const seekForce = this.calculateSeekForce(unit, unit.target.position);
    
    // Separation force (avoid nearby units)
    const separationForce = this.calculateSeparationForce(unit);
    
    // Combine forces
    let forceX = seekForce.x + separationForce.x * SEPARATION_FORCE;
    let forceY = seekForce.y + separationForce.y * SEPARATION_FORCE;
    
    // Limit total force
    const forceMag = Math.sqrt(forceX ** 2 + forceY ** 2);
    if (forceMag > MAX_STEERING_FORCE) {
      forceX = (forceX / forceMag) * MAX_STEERING_FORCE;
      forceY = (forceY / forceMag) * MAX_STEERING_FORCE;
    }
    
    return { x: forceX * unit.speed, y: forceY * unit.speed };
  }
  
  /**
   * Calculate seek/arrive steering force
   */
  private calculateSeekForce(unit: UnitMovementState, target: Position): SteeringForce {
    const dx = target.x - unit.position.x;
    const dy = target.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 0.01) return { x: 0, y: 0 };
    
    // Normalize
    let desiredX = dx / distance;
    let desiredY = dy / distance;
    
    // Apply arrival slowdown
    if (distance < ARRIVAL_SLOWDOWN_RADIUS) {
      const slowdownFactor = distance / ARRIVAL_SLOWDOWN_RADIUS;
      desiredX *= slowdownFactor;
      desiredY *= slowdownFactor;
    }
    
    // Steering = desired - current
    return {
      x: desiredX - (unit.velocity.x / unit.speed || 0),
      y: desiredY - (unit.velocity.y / unit.speed || 0)
    };
  }
  
  /**
   * Calculate separation steering force (avoid crowding)
   */
  private calculateSeparationForce(unit: UnitMovementState): SteeringForce {
    let forceX = 0;
    let forceY = 0;
    let neighborCount = 0;
    
    for (const [otherId, other] of this.units) {
      if (otherId === unit.id) continue;
      
      const dx = unit.position.x - other.position.x;
      const dy = unit.position.y - other.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < SEPARATION_RADIUS && distance > 0) {
        // Push away from neighbor, weighted by distance
        const weight = 1 - (distance / SEPARATION_RADIUS);
        forceX += (dx / distance) * weight;
        forceY += (dy / distance) * weight;
        neighborCount++;
      }
    }
    
    if (neighborCount > 0) {
      forceX /= neighborCount;
      forceY /= neighborCount;
    }
    
    return { x: forceX, y: forceY };
  }
  
  /**
   * Handle unit arriving at target
   */
  private onArrival(unit: UnitMovementState): void {
    if (!unit.target) return;
    
    switch (unit.target.type) {
      case 'move':
      case 'attack':
        unit.target = null;
        unit.isMoving = false;
        unit.velocity = { x: 0, y: 0 };
        break;
        
      case 'patrol':
        // Move to next patrol point
        unit.patrolIndex = (unit.patrolIndex + 1) % unit.patrolPoints.length;
        unit.target = {
          position: unit.patrolPoints[unit.patrolIndex],
          type: 'patrol'
        };
        break;
        
      case 'follow':
        // Update target position from followed unit
        if (unit.target.targetId) {
          const followed = this.units.get(unit.target.targetId);
          if (followed) {
            unit.target.position = { ...followed.position };
          } else {
            // Target lost, stop following
            unit.target = null;
            unit.isMoving = false;
          }
        }
        break;
    }
  }
  
  /**
   * Get unit's current state
   */
  getUnitState(id: string): UnitMovementState | undefined {
    return this.units.get(id);
  }
  
  /**
   * Get all units of a faction
   */
  getUnitsByFaction(faction: FactionId): UnitMovementState[] {
    return Array.from(this.units.values()).filter(u => u.faction === faction);
  }
  
  /**
   * Get units near a position
   */
  getUnitsNear(position: Position, radius: number): UnitMovementState[] {
    return Array.from(this.units.values()).filter(unit => {
      return this.distance(unit.position, position) <= radius;
    });
  }
  
  /**
   * Update a unit's position (for external sync)
   */
  updateUnitPosition(id: string, position: Position): void {
    const unit = this.units.get(id);
    if (unit) {
      unit.position = { ...position };
    }
  }
  
  private distance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}

export const unitMovement = new UnitMovementSystem();
