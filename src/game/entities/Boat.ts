// ============================================
// BOAT SYSTEM
// Boats for traveling between islands and deploying units
// With combat capabilities using beam projectiles
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { Boat, DockPoint } from '../../types/world.ts';
import { generateId } from '../core/GridSystem.ts';
import { BOAT_STATS } from '../../types/world.ts';
import { ShipProjectileSystem, BeamColor } from '../systems/ShipProjectileSystem.ts';

export class BoatManager {
  private boats: Map<string, Boat> = new Map();
  private projectileSystem: ShipProjectileSystem;
  
  // Callback for damage
  public onDamageDealt: ((targetId: string, damage: number, shipId: string, isAOE: boolean) => void) | null = null;
  public onAOEDamage: ((position: Position, radius: number, damage: number, faction: FactionId, excludeIds: Set<string>) => string[]) | null = null;
  
  constructor() {
    this.projectileSystem = new ShipProjectileSystem();
    
    // Wire up damage callbacks
    this.projectileSystem.onDamage = (targetId, damage, projId, isAOE) => {
      // Extract ship ID from projectile
      const proj = Array.from(this.projectileSystem['projectiles'].values())
        .find(p => p.id === projId);
      const shipId = proj?.shipId ?? 'unknown';
      this.onDamageDealt?.(targetId, damage, shipId, isAOE);
    };
    
    this.projectileSystem.onAOEDamage = (pos, radius, damage, faction, excludeIds) => {
      return this.onAOEDamage?.(pos, radius, damage, faction, excludeIds) ?? [];
    };
  }
  
  /**
   * Create a new boat at a dock
   */
  createBoat(
    owner: FactionId,
    dock: DockPoint,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Boat {
    const stats = BOAT_STATS[size];
    
    const boat: Boat = {
      id: generateId(),
      model: size === 'small' ? 'speedboat' : size === 'large' ? 'warship' : 'sailboat',
      owner,
      position: { ...dock.position },
      targetPosition: null,
      targetDock: null,
      state: 'docked',
      speed: stats.speed,
      rotation: dock.direction,
      capacity: stats.capacity,
      units: [],
      health: stats.health,
      maxHealth: stats.health,
      armor: size === 'small' ? 5 : size === 'large' ? 30 : 10,
      attackDamage: size === 'small' ? 15 : size === 'large' ? 50 : 20,
      attackRange: size === 'small' ? 150 : size === 'large' ? 300 : 180,
      attackCooldown: 0,
      targetBoatId: null,
      spawnQueue: 0,
      spawnTimer: 0
    };
    
    this.boats.set(boat.id, boat);
    
    // Mark dock as occupied
    dock.isOccupied = true;
    dock.occupyingBoatId = boat.id;
    
    return boat;
  }
  
  /**
   * Send boat to target dock
   */
  sailTo(boatId: string, targetDock: DockPoint): boolean {
    const boat = this.boats.get(boatId);
    if (!boat) return false;
    
    if (boat.state !== 'docked') return false;
    if (targetDock.isOccupied) return false;
    
    boat.targetDock = targetDock;
    boat.targetPosition = { ...targetDock.position };
    boat.state = 'sailing';
    
    return true;
  }
  
  /**
   * Load a unit onto a boat
   */
  loadUnit(boatId: string, unitId: string): boolean {
    const boat = this.boats.get(boatId);
    if (!boat) return false;
    
    if (boat.state !== 'docked') return false;
    if (boat.units.length >= boat.capacity) return false;
    
    boat.units.push(unitId);
    return true;
  }
  
  /**
   * Start deploying units from boat
   */
  startDeployment(boatId: string): boolean {
    const boat = this.boats.get(boatId);
    if (!boat) return false;
    
    if (boat.state !== 'docked') return false;
    if (boat.units.length === 0) return false;
    
    boat.state = 'deploying';
    boat.spawnQueue = boat.units.length;
    boat.spawnTimer = 0;
    
    return true;
  }
  
  /**
   * Fire projectile at target
   */
  fireAtTarget(
    boat: Boat,
    targetPosition: Position,
    targetId: string | null = null,
    beamColor?: BeamColor
  ): void {
    // Determine beam color based on boat model or faction
    let color = beamColor;
    if (!color) {
      switch (boat.model) {
        case 'warship': color = 'red'; break;      // Warships use explosive red
        case 'speedboat': color = 'green'; break;  // Speedboats use fast green
        default: color = 'orange'; break;          // Sailboats use fire orange
      }
    }
    
    this.projectileSystem.fireProjectile({
      shipId: boat.id,
      targetId,
      sourcePosition: boat.position,
      targetPosition,
      damage: boat.attackDamage,
      faction: boat.owner,
      beamColor: color,
      speed: boat.model === 'speedboat' ? 550 : 400,
      aoeRadius: boat.model === 'warship' ? 80 : 50
    });
    
    boat.attackCooldown = boat.model === 'speedboat' ? 0.8 : 
                          boat.model === 'warship' ? 2.5 : 1.5;
  }
  
  /**
   * Update all boats
   */
  update(
    deltaTime: number,
    getEnemyTargets?: (boat: Boat) => { id: string; position: Position }[],
    getTargetPosition?: (id: string) => Position | null
  ): { deployedUnits: { boatId: string; unitId: string; position: Position }[] } {
    const deployedUnits: { boatId: string; unitId: string; position: Position }[] = [];
    
    for (const boat of this.boats.values()) {
      // Update attack cooldown
      if (boat.attackCooldown > 0) {
        boat.attackCooldown -= deltaTime;
      }
      
      switch (boat.state) {
        case 'sailing':
          this.updateSailing(boat, deltaTime);
          // Ships can attack while sailing
          this.updateCombat(boat, getEnemyTargets);
          break;
          
        case 'approaching':
          this.updateApproaching(boat, deltaTime);
          break;
          
        case 'docked':
          // Docked ships can still defend
          this.updateCombat(boat, getEnemyTargets);
          break;
          
        case 'deploying':
          const deployed = this.updateDeploying(boat, deltaTime);
          if (deployed) {
            deployedUnits.push({
              boatId: boat.id,
              unitId: deployed,
              position: this.getDeployPosition(boat)
            });
          }
          break;
      }
    }
    
    // Update projectiles
    this.projectileSystem.update(deltaTime * 1000, getTargetPosition);
    
    return { deployedUnits };
  }
  
  private updateCombat(
    boat: Boat, 
    getEnemyTargets?: (boat: Boat) => { id: string; position: Position }[]
  ): void {
    if (boat.attackCooldown > 0 || !getEnemyTargets) return;
    
    const targets = getEnemyTargets(boat);
    if (targets.length === 0) {
      boat.targetBoatId = null;
      return;
    }
    
    // Find closest target in range
    let bestTarget = targets[0];
    let bestDist = Math.hypot(
      bestTarget.position.x - boat.position.x,
      bestTarget.position.y - boat.position.y
    );
    
    for (const target of targets) {
      const dist = Math.hypot(
        target.position.x - boat.position.x,
        target.position.y - boat.position.y
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }
    
    // Check if in range
    if (bestDist <= boat.attackRange) {
      boat.targetBoatId = bestTarget.id;
      this.fireAtTarget(boat, bestTarget.position, bestTarget.id);
    }
  }
  
  private updateSailing(boat: Boat, deltaTime: number): void {
    if (!boat.targetPosition) {
      boat.state = 'docked';
      return;
    }
    
    const dx = boat.targetPosition.x - boat.position.x;
    const dy = boat.targetPosition.y - boat.position.y;
    const dist = Math.hypot(dx, dy);
    
    // Update rotation to face target
    boat.rotation = Math.atan2(dy, dx);
    
    if (dist < 100) {
      // Close enough - start approaching dock
      boat.state = 'approaching';
      return;
    }
    
    // Move toward target
    const moveSpeed = boat.speed * deltaTime;
    const ratio = Math.min(1, moveSpeed / dist);
    
    boat.position.x += dx * ratio;
    boat.position.y += dy * ratio;
  }
  
  private updateApproaching(boat: Boat, deltaTime: number): void {
    if (!boat.targetDock || !boat.targetPosition) {
      boat.state = 'docked';
      return;
    }
    
    const dx = boat.targetPosition.x - boat.position.x;
    const dy = boat.targetPosition.y - boat.position.y;
    const dist = Math.hypot(dx, dy);
    
    // Slow approach
    boat.rotation = Math.atan2(dy, dx);
    
    if (dist < 5) {
      // Arrived at dock
      boat.position = { ...boat.targetPosition };
      boat.state = 'docked';
      boat.targetDock.isOccupied = true;
      boat.targetDock.occupyingBoatId = boat.id;
      boat.rotation = boat.targetDock.direction;
      boat.targetDock = null;
      boat.targetPosition = null;
      return;
    }
    
    // Slow movement for docking
    const moveSpeed = boat.speed * 0.3 * deltaTime;
    const ratio = Math.min(1, moveSpeed / dist);
    
    boat.position.x += dx * ratio;
    boat.position.y += dy * ratio;
  }
  
  private updateDeploying(boat: Boat, deltaTime: number): string | null {
    if (boat.spawnQueue <= 0) {
      boat.state = 'docked';
      return null;
    }
    
    boat.spawnTimer += deltaTime;
    
    // Deploy one unit every 0.5 seconds
    if (boat.spawnTimer >= 0.5) {
      boat.spawnTimer = 0;
      boat.spawnQueue--;
      
      // Get unit from boat
      const unitId = boat.units.shift();
      return unitId || null;
    }
    
    return null;
  }
  
  private getDeployPosition(boat: Boat): Position {
    // Deploy position is in front of boat toward island
    const deployDist = 30;
    return {
      x: boat.position.x + Math.cos(boat.rotation) * deployDist,
      y: boat.position.y + Math.sin(boat.rotation) * deployDist
    };
  }
  
  // === GETTERS ===
  
  getBoat(id: string): Boat | undefined {
    return this.boats.get(id);
  }
  
  getBoatsByFaction(faction: FactionId): Boat[] {
    return Array.from(this.boats.values()).filter(b => b.owner === faction);
  }
  
  getAllBoats(): Boat[] {
    return Array.from(this.boats.values());
  }
  
  getDockedBoatsAt(dock: DockPoint): Boat | undefined {
    if (!dock.occupyingBoatId) return undefined;
    return this.boats.get(dock.occupyingBoatId);
  }
  
  /**
   * Render all boats and projectiles
   */
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    gameTime: number
  ): void {
    // Render projectiles behind boats
    this.projectileSystem.render(ctx, cameraX, cameraY);
    
    // Render boats
    for (const boat of this.boats.values()) {
      this.renderBoat(ctx, boat, cameraX, cameraY, gameTime);
    }
  }
  
  /**
   * Get the projectile system for external access
   */
  getProjectileSystem(): ShipProjectileSystem {
    return this.projectileSystem;
  }
  
  private renderBoat(
    ctx: CanvasRenderingContext2D,
    boat: Boat,
    _cameraX: number,
    _cameraY: number,
    gameTime: number
  ): void {
    // Camera offset is already applied via canvas transform
    const x = boat.position.x;
    const y = boat.position.y;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(boat.rotation);
    
    // Boat body
    const boatLength = 40;
    const boatWidth = 20;
    
    // Hull
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.beginPath();
    ctx.ellipse(0, 0, boatLength / 2, boatWidth / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Deck
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(0, 0, boatLength / 2 - 4, boatWidth / 2 - 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bow (front point)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(boatLength / 2, 0);
    ctx.lineTo(boatLength / 2 + 10, 0);
    ctx.lineTo(boatLength / 2, -5);
    ctx.lineTo(boatLength / 2, 5);
    ctx.closePath();
    ctx.fill();
    
    // Mast
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(-3, -boatWidth, 6, boatWidth * 1.5);
    
    // Sail (if sailing)
    if (boat.state === 'sailing' || boat.state === 'approaching') {
      const sailBillow = Math.sin(gameTime * 3) * 2;
      ctx.fillStyle = boat.owner === 1 ? '#00aaff' : boat.owner === 2 ? '#ff4444' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-3, -boatWidth);
      ctx.quadraticCurveTo(-15 - sailBillow, -boatWidth / 2, -3, 0);
      ctx.lineTo(-3, -boatWidth);
      ctx.fill();
    }
    
    ctx.restore();
    
    // Unit count indicator
    if (boat.units.length > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${boat.units.length}`, x, y - 30);
    }
    
    // Health bar
    if (boat.health < boat.maxHealth) {
      const barWidth = 30;
      const barHeight = 4;
      const healthPercent = boat.health / boat.maxHealth;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : '#a44';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth * healthPercent, barHeight);
    }
  }
}
