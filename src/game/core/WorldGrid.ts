// ============================================
// WORLD GRID SYSTEM
// Invisible XY grid for placement, projectiles, AOE, skills, attacks, and AI navmesh
// ============================================

import type { Position, FactionId } from '../../types/index.ts';

// === GRID CELL TYPES ===

export interface GridCell {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  walkable: boolean;
  buildable: boolean;
  terrainType: TerrainCellType;
  occupiedBy: string | null; // Entity ID
  buildingId: string | null;
  owner: FactionId;
  cost: number; // Movement cost multiplier
  elevation: number;
}

export type TerrainCellType = 
  | 'water' 
  | 'shallow_water' 
  | 'sand' 
  | 'grass' 
  | 'forest' 
  | 'rock' 
  | 'mountain'
  | 'road'
  | 'bridge';

// === PROJECTILE SYSTEM ===

export interface Projectile {
  id: string;
  type: ProjectileType;
  sourceId: string;
  targetId: string | null;
  targetPosition: Position;
  position: Position;
  velocity: Position;
  speed: number;
  damage: number;
  aoeRadius: number;
  maxRange: number;
  traveled: number;
  rotation: number;
  faction: FactionId;
  piercing: boolean;
  hitEntities: Set<string>;
}

export type ProjectileType = 
  | 'arrow' 
  | 'bolt' 
  | 'fireball' 
  | 'icebolt' 
  | 'cannonball' 
  | 'magic_missile'
  | 'spear'
  | 'rock';

// === AOE EFFECTS ===

export interface AOEEffect {
  id: string;
  type: AOEType;
  position: Position;
  radius: number;
  duration: number;
  elapsed: number;
  damage: number;
  damageInterval: number;
  lastDamageTick: number;
  faction: FactionId;
  affectedEntities: Set<string>;
  visualEffect: string;
}

export type AOEType = 
  | 'fire_zone' 
  | 'frost_zone' 
  | 'poison_cloud' 
  | 'healing_circle'
  | 'explosion'
  | 'shockwave';

// === SKILL EFFECTS ===

export interface SkillEffect {
  id: string;
  skillId: string;
  casterId: string;
  position: Position;
  targetPosition: Position | null;
  targetId: string | null;
  duration: number;
  elapsed: number;
  phase: 'cast' | 'active' | 'end';
  data: Record<string, any>;
}

// === WORLD GRID CLASS ===

export class WorldGrid {
  private cells: GridCell[][];
  private width: number;
  private height: number;
  private cellSize: number;
  private gridWidth: number;
  private gridHeight: number;

  // Active effects
  private projectiles: Map<string, Projectile> = new Map();
  private aoeEffects: Map<string, AOEEffect> = new Map();
  private skillEffects: Map<string, SkillEffect> = new Map();

  // Callbacks
  public onProjectileHit: ((projectile: Projectile, targetId: string) => void) | null = null;
  public onAOEDamage: ((effect: AOEEffect, targetId: string, damage: number) => void) | null = null;
  public onSkillEffect: ((effect: SkillEffect, targetIds: string[]) => void) | null = null;

  private idCounter: number = 0;

  constructor(worldWidth: number, worldHeight: number, cellSize: number = 32) {
    this.width = worldWidth;
    this.height = worldHeight;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(worldWidth / cellSize);
    this.gridHeight = Math.ceil(worldHeight / cellSize);

    // Initialize grid
    this.cells = [];
    for (let gy = 0; gy < this.gridHeight; gy++) {
      this.cells[gy] = [];
      for (let gx = 0; gx < this.gridWidth; gx++) {
        this.cells[gy][gx] = {
          x: gx * cellSize + cellSize / 2,
          y: gy * cellSize + cellSize / 2,
          gridX: gx,
          gridY: gy,
          walkable: true,
          buildable: true,
          terrainType: 'grass',
          occupiedBy: null,
          buildingId: null,
          owner: 0 as FactionId,
          cost: 1,
          elevation: 0
        };
      }
    }
  }

  // === GRID ACCESS ===

  private generateId(): string {
    return `${Date.now()}_${this.idCounter++}`;
  }

  getCell(gridX: number, gridY: number): GridCell | null {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return null;
    }
    return this.cells[gridY][gridX];
  }

  getCellAt(worldX: number, worldY: number): GridCell | null {
    const gridX = Math.floor(worldX / this.cellSize);
    const gridY = Math.floor(worldY / this.cellSize);
    return this.getCell(gridX, gridY);
  }

  worldToGrid(worldX: number, worldY: number): { gridX: number; gridY: number } {
    return {
      gridX: Math.floor(worldX / this.cellSize),
      gridY: Math.floor(worldY / this.cellSize)
    };
  }

  gridToWorld(gridX: number, gridY: number): Position {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    };
  }

  snapToGrid(worldX: number, worldY: number): Position {
    const { gridX, gridY } = this.worldToGrid(worldX, worldY);
    return this.gridToWorld(gridX, gridY);
  }

  // === TERRAIN SETUP ===

  setTerrain(gridX: number, gridY: number, type: TerrainCellType): void {
    const cell = this.getCell(gridX, gridY);
    if (!cell) return;

    cell.terrainType = type;

    // Set properties based on terrain
    switch (type) {
      case 'water':
        cell.walkable = false;
        cell.buildable = false;
        cell.cost = Infinity;
        break;
      case 'shallow_water':
        cell.walkable = true;
        cell.buildable = false;
        cell.cost = 2;
        break;
      case 'sand':
        cell.walkable = true;
        cell.buildable = true;
        cell.cost = 1.2;
        break;
      case 'grass':
        cell.walkable = true;
        cell.buildable = true;
        cell.cost = 1;
        break;
      case 'forest':
        cell.walkable = true;
        cell.buildable = false;
        cell.cost = 1.5;
        break;
      case 'rock':
        cell.walkable = true;
        cell.buildable = false;
        cell.cost = 1.3;
        break;
      case 'mountain':
        cell.walkable = false;
        cell.buildable = false;
        cell.cost = Infinity;
        break;
      case 'road':
        cell.walkable = true;
        cell.buildable = false;
        cell.cost = 0.8;
        break;
      case 'bridge':
        cell.walkable = true;
        cell.buildable = false;
        cell.cost = 0.9;
        break;
    }
  }

  setTerrainArea(startX: number, startY: number, width: number, height: number, type: TerrainCellType): void {
    const startGX = Math.floor(startX / this.cellSize);
    const startGY = Math.floor(startY / this.cellSize);
    const endGX = Math.ceil((startX + width) / this.cellSize);
    const endGY = Math.ceil((startY + height) / this.cellSize);

    for (let gy = startGY; gy < endGY; gy++) {
      for (let gx = startGX; gx < endGX; gx++) {
        this.setTerrain(gx, gy, type);
      }
    }
  }

  // === BUILDING PLACEMENT ===

  canPlaceBuilding(worldX: number, worldY: number, width: number, height: number): boolean {
    const startGX = Math.floor((worldX - width / 2) / this.cellSize);
    const startGY = Math.floor((worldY - height / 2) / this.cellSize);
    const endGX = Math.ceil((worldX + width / 2) / this.cellSize);
    const endGY = Math.ceil((worldY + height / 2) / this.cellSize);

    for (let gy = startGY; gy < endGY; gy++) {
      for (let gx = startGX; gx < endGX; gx++) {
        const cell = this.getCell(gx, gy);
        if (!cell || !cell.buildable || cell.buildingId) {
          return false;
        }
      }
    }
    return true;
  }

  placeBuilding(buildingId: string, worldX: number, worldY: number, width: number, height: number): boolean {
    if (!this.canPlaceBuilding(worldX, worldY, width, height)) {
      return false;
    }

    const startGX = Math.floor((worldX - width / 2) / this.cellSize);
    const startGY = Math.floor((worldY - height / 2) / this.cellSize);
    const endGX = Math.ceil((worldX + width / 2) / this.cellSize);
    const endGY = Math.ceil((worldY + height / 2) / this.cellSize);

    for (let gy = startGY; gy < endGY; gy++) {
      for (let gx = startGX; gx < endGX; gx++) {
        const cell = this.getCell(gx, gy);
        if (cell) {
          cell.buildingId = buildingId;
          cell.walkable = false;
          cell.buildable = false;
        }
      }
    }
    return true;
  }

  removeBuilding(buildingId: string): void {
    for (let gy = 0; gy < this.gridHeight; gy++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        const cell = this.cells[gy][gx];
        if (cell.buildingId === buildingId) {
          cell.buildingId = null;
          // Restore walkability based on terrain
          this.setTerrain(gx, gy, cell.terrainType);
        }
      }
    }
  }

  // === ENTITY OCCUPANCY ===

  setOccupied(worldX: number, worldY: number, entityId: string | null): void {
    const cell = this.getCellAt(worldX, worldY);
    if (cell) {
      cell.occupiedBy = entityId;
    }
  }

  isOccupied(worldX: number, worldY: number): boolean {
    const cell = this.getCellAt(worldX, worldY);
    return cell?.occupiedBy !== null;
  }

  getOccupant(worldX: number, worldY: number): string | null {
    return this.getCellAt(worldX, worldY)?.occupiedBy ?? null;
  }

  // === PATHFINDING HELPERS ===

  isWalkable(worldX: number, worldY: number): boolean {
    const cell = this.getCellAt(worldX, worldY);
    return cell?.walkable ?? false;
  }

  getMovementCost(worldX: number, worldY: number): number {
    return this.getCellAt(worldX, worldY)?.cost ?? Infinity;
  }

  getNeighbors(gridX: number, gridY: number, allowDiagonal: boolean = true): GridCell[] {
    const neighbors: GridCell[] = [];
    const dirs = allowDiagonal
      ? [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]
      : [[0,-1],[-1,0],[1,0],[0,1]];

    for (const [dx, dy] of dirs) {
      const cell = this.getCell(gridX + dx, gridY + dy);
      if (cell && cell.walkable) {
        neighbors.push(cell);
      }
    }
    return neighbors;
  }

  // === PROJECTILE SYSTEM ===

  createProjectile(config: {
    type: ProjectileType;
    sourceId: string;
    sourcePosition: Position;
    targetId?: string;
    targetPosition: Position;
    speed: number;
    damage: number;
    aoeRadius?: number;
    maxRange?: number;
    faction: FactionId;
    piercing?: boolean;
  }): Projectile {
    const dx = config.targetPosition.x - config.sourcePosition.x;
    const dy = config.targetPosition.y - config.sourcePosition.y;
    const dist = Math.hypot(dx, dy);
    const rotation = Math.atan2(dy, dx);

    const projectile: Projectile = {
      id: this.generateId(),
      type: config.type,
      sourceId: config.sourceId,
      targetId: config.targetId ?? null,
      targetPosition: { ...config.targetPosition },
      position: { ...config.sourcePosition },
      velocity: {
        x: (dx / dist) * config.speed,
        y: (dy / dist) * config.speed
      },
      speed: config.speed,
      damage: config.damage,
      aoeRadius: config.aoeRadius ?? 0,
      maxRange: config.maxRange ?? 1000,
      traveled: 0,
      rotation,
      faction: config.faction,
      piercing: config.piercing ?? false,
      hitEntities: new Set()
    };

    this.projectiles.set(projectile.id, projectile);
    return projectile;
  }

  updateProjectiles(deltaTime: number, getEntityPosition: (id: string) => Position | null): void {
    const toRemove: string[] = [];

    for (const [id, proj] of this.projectiles) {
      // Update position
      proj.position.x += proj.velocity.x * deltaTime;
      proj.position.y += proj.velocity.y * deltaTime;
      proj.traveled += proj.speed * deltaTime;

      // Track moving target
      if (proj.targetId) {
        const targetPos = getEntityPosition(proj.targetId);
        if (targetPos) {
          proj.targetPosition = targetPos;
          const dx = targetPos.x - proj.position.x;
          const dy = targetPos.y - proj.position.y;
          const dist = Math.hypot(dx, dy);
          proj.velocity.x = (dx / dist) * proj.speed;
          proj.velocity.y = (dy / dist) * proj.speed;
          proj.rotation = Math.atan2(dy, dx);
        }
      }

      // Check if reached target or max range
      const distToTarget = Math.hypot(
        proj.targetPosition.x - proj.position.x,
        proj.targetPosition.y - proj.position.y
      );

      if (distToTarget < 10 || proj.traveled > proj.maxRange) {
        // Hit! Apply damage
        if (proj.aoeRadius > 0) {
          this.createAOE({
            type: 'explosion',
            position: proj.position,
            radius: proj.aoeRadius,
            duration: 0.1,
            damage: proj.damage,
            faction: proj.faction
          });
        } else if (proj.targetId && this.onProjectileHit) {
          this.onProjectileHit(proj, proj.targetId);
        }
        toRemove.push(id);
      }

      // Check out of bounds
      if (proj.position.x < 0 || proj.position.x > this.width ||
          proj.position.y < 0 || proj.position.y > this.height) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.projectiles.delete(id);
    }
  }

  // === AOE SYSTEM ===

  createAOE(config: {
    type: AOEType;
    position: Position;
    radius: number;
    duration: number;
    damage: number;
    damageInterval?: number;
    faction: FactionId;
    visualEffect?: string;
  }): AOEEffect {
    const effect: AOEEffect = {
      id: this.generateId(),
      type: config.type,
      position: { ...config.position },
      radius: config.radius,
      duration: config.duration,
      elapsed: 0,
      damage: config.damage,
      damageInterval: config.damageInterval ?? 0.5,
      lastDamageTick: 0,
      faction: config.faction,
      affectedEntities: new Set(),
      visualEffect: config.visualEffect ?? config.type
    };

    this.aoeEffects.set(effect.id, effect);
    return effect;
  }

  updateAOE(deltaTime: number, getEntitiesInRadius: (pos: Position, radius: number) => string[]): void {
    const toRemove: string[] = [];

    for (const [id, effect] of this.aoeEffects) {
      effect.elapsed += deltaTime;

      // Apply damage at intervals
      if (effect.elapsed - effect.lastDamageTick >= effect.damageInterval) {
        effect.lastDamageTick = effect.elapsed;
        
        const entities = getEntitiesInRadius(effect.position, effect.radius);
        for (const entityId of entities) {
          if (this.onAOEDamage) {
            this.onAOEDamage(effect, entityId, effect.damage);
          }
          effect.affectedEntities.add(entityId);
        }
      }

      if (effect.elapsed >= effect.duration) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.aoeEffects.delete(id);
    }
  }

  // === SKILL EFFECTS ===

  createSkillEffect(config: {
    skillId: string;
    casterId: string;
    position: Position;
    targetPosition?: Position;
    targetId?: string;
    duration: number;
    data?: Record<string, any>;
  }): SkillEffect {
    const effect: SkillEffect = {
      id: this.generateId(),
      skillId: config.skillId,
      casterId: config.casterId,
      position: { ...config.position },
      targetPosition: config.targetPosition ? { ...config.targetPosition } : null,
      targetId: config.targetId ?? null,
      duration: config.duration,
      elapsed: 0,
      phase: 'cast',
      data: config.data ?? {}
    };

    this.skillEffects.set(effect.id, effect);
    return effect;
  }

  updateSkillEffects(deltaTime: number): void {
    const toRemove: string[] = [];

    for (const [id, effect] of this.skillEffects) {
      effect.elapsed += deltaTime;

      // Phase transitions
      const progress = effect.elapsed / effect.duration;
      if (progress < 0.2) {
        effect.phase = 'cast';
      } else if (progress < 0.8) {
        effect.phase = 'active';
      } else {
        effect.phase = 'end';
      }

      if (effect.elapsed >= effect.duration) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.skillEffects.delete(id);
    }
  }

  // === UPDATE ALL ===

  update(
    deltaTime: number,
    getEntityPosition: (id: string) => Position | null,
    getEntitiesInRadius: (pos: Position, radius: number) => string[]
  ): void {
    this.updateProjectiles(deltaTime, getEntityPosition);
    this.updateAOE(deltaTime, getEntitiesInRadius);
    this.updateSkillEffects(deltaTime);
  }

  // === GETTERS ===

  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values());
  }

  getAOEEffects(): AOEEffect[] {
    return Array.from(this.aoeEffects.values());
  }

  getSkillEffects(): SkillEffect[] {
    return Array.from(this.skillEffects.values());
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getGridDimensions(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }

  // === DEBUG RENDERING ===

  debugRender(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, showGrid: boolean = false): void {
    ctx.save();

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let gx = 0; gx <= this.gridWidth; gx++) {
        const x = gx * this.cellSize - cameraX;
        ctx.beginPath();
        ctx.moveTo(x, -cameraY);
        ctx.lineTo(x, this.height - cameraY);
        ctx.stroke();
      }

      for (let gy = 0; gy <= this.gridHeight; gy++) {
        const y = gy * this.cellSize - cameraY;
        ctx.beginPath();
        ctx.moveTo(-cameraX, y);
        ctx.lineTo(this.width - cameraX, y);
        ctx.stroke();
      }
    }

    // Draw projectiles
    for (const proj of this.projectiles.values()) {
      const x = proj.position.x - cameraX;
      const y = proj.position.y - cameraY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(proj.rotation);

      ctx.fillStyle = proj.type === 'fireball' ? '#ff6600' :
                      proj.type === 'icebolt' ? '#66ccff' :
                      '#ffcc00';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw AOE effects
    for (const aoe of this.aoeEffects.values()) {
      const x = aoe.position.x - cameraX;
      const y = aoe.position.y - cameraY;
      const alpha = 1 - (aoe.elapsed / aoe.duration);

      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = aoe.type === 'fire_zone' ? '#ff4400' :
                      aoe.type === 'frost_zone' ? '#44aaff' :
                      aoe.type === 'healing_circle' ? '#44ff44' :
                      '#ffaa00';
      ctx.beginPath();
      ctx.arc(x, y, aoe.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}
