// ============================================
// GRID SYSTEM
// Spatial partitioning for efficient collision detection and entity queries
// Ported and scaled from Swarm RTS
// ============================================

import type { Position, FactionId } from '../../types/index.ts';

// === UTILITY FUNCTIONS ===

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function isPointInRect(
  px: number, py: number, 
  x1: number, y1: number, x2: number, y2: number
): boolean {
  return px >= x1 && px <= x2 && py >= y1 && py <= y2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// === GRID SECTOR ===

export class GridSector {
  public sx: number;
  public sy: number;
  public entities: Set<string> = new Set();
  public entityCount: number[] = [0, 0, 0, 0]; // Per faction
  public entitySizeSum: number = 0;
  
  constructor(sx: number, sy: number) {
    this.sx = sx;
    this.sy = sy;
  }
  
  registerEntity(entityId: string, faction: FactionId, size: number): void {
    if (!this.entities.has(entityId)) {
      this.entities.add(entityId);
      this.entityCount[faction]++;
      this.entitySizeSum += size;
    }
  }
  
  removeEntity(entityId: string, faction: FactionId, size: number): void {
    if (this.entities.has(entityId)) {
      this.entities.delete(entityId);
      this.entityCount[faction]--;
      this.entitySizeSum -= size;
    }
  }
  
  getEnemyEntityCount(faction: FactionId): number {
    let count = 0;
    for (let f = 0; f < this.entityCount.length; f++) {
      if (f !== faction && f !== 0) {
        count += this.entityCount[f];
      }
    }
    return count;
  }
  
  equals(other: GridSector): boolean {
    return this.sx === other.sx && this.sy === other.sy;
  }
  
  clear(): void {
    this.entities.clear();
    this.entityCount = [0, 0, 0, 0];
    this.entitySizeSum = 0;
  }
}

// === GRID SYSTEM ===

export class GridSystem {
  public width: number;
  public height: number;
  public gridSize: number;
  public sectorsX: number;
  public sectorsY: number;
  public sectors: GridSector[][];
  public maximumSizeSumPerSector: number;
  
  constructor(
    width: number, 
    height: number, 
    gridSize: number = 50,
    maxSizePerSector: number = 200
  ) {
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
    this.sectorsX = Math.ceil(width / gridSize);
    this.sectorsY = Math.ceil(height / gridSize);
    this.maximumSizeSumPerSector = maxSizePerSector;
    
    // Initialize sectors
    this.sectors = [];
    for (let x = 0; x < this.sectorsX; x++) {
      this.sectors[x] = [];
      for (let y = 0; y < this.sectorsY; y++) {
        this.sectors[x][y] = new GridSector(x, y);
      }
    }
  }
  
  // Convert world coordinates to sector indices
  private toSectorX(x: number): number {
    return Math.floor(clamp(x, 0, this.width - 1) / this.gridSize);
  }
  
  private toSectorY(y: number): number {
    return Math.floor(clamp(y, 0, this.height - 1) / this.gridSize);
  }
  
  // Get sector at world coordinates
  getSectorByCoord(x: number, y: number): GridSector {
    const sx = this.toSectorX(x);
    const sy = this.toSectorY(y);
    return this.sectors[sx][sy];
  }
  
  getSectorByCoordSafe(x: number, y: number): GridSector | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.getSectorByCoord(x, y);
  }
  
  // Get all sectors within a radius from a point
  getSectorsInRange(x: number, y: number, radius: number): GridSector[] {
    const result: GridSector[] = [];
    
    const minSx = Math.max(0, this.toSectorX(x - radius));
    const maxSx = Math.min(this.sectorsX - 1, this.toSectorX(x + radius));
    const minSy = Math.max(0, this.toSectorY(y - radius));
    const maxSy = Math.min(this.sectorsY - 1, this.toSectorY(y + radius));
    
    for (let sx = minSx; sx <= maxSx; sx++) {
      for (let sy = minSy; sy <= maxSy; sy++) {
        result.push(this.sectors[sx][sy]);
      }
    }
    
    return result;
  }
  
  // Get all sectors within a rectangle
  getSectorsByRect(x1: number, y1: number, x2: number, y2: number): GridSector[] {
    const result: GridSector[] = [];
    
    const minSx = Math.max(0, this.toSectorX(Math.min(x1, x2)));
    const maxSx = Math.min(this.sectorsX - 1, this.toSectorX(Math.max(x1, x2)));
    const minSy = Math.max(0, this.toSectorY(Math.min(y1, y2)));
    const maxSy = Math.min(this.sectorsY - 1, this.toSectorY(Math.max(y1, y2)));
    
    for (let sx = minSx; sx <= maxSx; sx++) {
      for (let sy = minSy; sy <= maxSy; sy++) {
        result.push(this.sectors[sx][sy]);
      }
    }
    
    return result;
  }
  
  // Get a random location in an adjacent sector
  randomLocationInAdjacentSector(x: number, y: number): [number, number] {
    const sx = this.toSectorX(x);
    const sy = this.toSectorY(y);
    
    const adjacentOffsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],          [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];
    
    const validOffsets = adjacentOffsets.filter(([dx, dy]) => {
      const nx = sx + dx;
      const ny = sy + dy;
      return nx >= 0 && nx < this.sectorsX && ny >= 0 && ny < this.sectorsY;
    });
    
    if (validOffsets.length === 0) {
      return [x, y];
    }
    
    const [dx, dy] = validOffsets[Math.floor(Math.random() * validOffsets.length)];
    const targetSx = sx + dx;
    const targetSy = sy + dy;
    
    return [
      targetSx * this.gridSize + Math.random() * this.gridSize,
      targetSy * this.gridSize + Math.random() * this.gridSize
    ];
  }
  
  // Clamp coordinates to world bounds
  safeCoordX(x: number): number {
    return clamp(x, 0, this.width - 1);
  }
  
  safeCoordY(y: number): number {
    return clamp(y, 0, this.height - 1);
  }
  
  // Clear all sectors
  clear(): void {
    for (let x = 0; x < this.sectorsX; x++) {
      for (let y = 0; y < this.sectorsY; y++) {
        this.sectors[x][y].clear();
      }
    }
  }
}

// === ENTITY SYSTEM ===
// Manages all game entities and provides fast lookups

export interface EntityReference {
  id: string;
  faction: FactionId;
  size: number;
  position: Position;
}

export class EntitySystem {
  private entities: Map<string, EntityReference> = new Map();
  private locationGrid: GridSystem;
  private destinationGrid: GridSystem;
  
  public unitCount: number[] = [0, 0, 0, 0]; // Per faction
  public unitCountSum: number = 0;
  
  constructor(locationGrid: GridSystem, destinationGrid: GridSystem) {
    this.locationGrid = locationGrid;
    this.destinationGrid = destinationGrid;
  }
  
  registerEntity(ref: EntityReference): void {
    this.entities.set(ref.id, ref);
    
    const sector = this.locationGrid.getSectorByCoord(ref.position.x, ref.position.y);
    sector.registerEntity(ref.id, ref.faction, ref.size);
    
    this.unitCount[ref.faction]++;
    this.unitCountSum++;
  }
  
  removeEntity(id: string): void {
    const ref = this.entities.get(id);
    if (!ref) return;
    
    const sector = this.locationGrid.getSectorByCoord(ref.position.x, ref.position.y);
    sector.removeEntity(id, ref.faction, ref.size);
    
    this.unitCount[ref.faction]--;
    this.unitCountSum--;
    
    this.entities.delete(id);
  }
  
  updateEntityPosition(id: string, newPosition: Position): void {
    const ref = this.entities.get(id);
    if (!ref) return;
    
    const oldSector = this.locationGrid.getSectorByCoord(ref.position.x, ref.position.y);
    const newSector = this.locationGrid.getSectorByCoord(newPosition.x, newPosition.y);
    
    if (!oldSector.equals(newSector)) {
      oldSector.removeEntity(id, ref.faction, ref.size);
      newSector.registerEntity(id, ref.faction, ref.size);
    }
    
    ref.position = { ...newPosition };
  }
  
  getEntity(id: string): EntityReference | undefined {
    return this.entities.get(id);
  }
  
  getEntitiesInRange(x: number, y: number, radius: number): string[] {
    const sectors = this.locationGrid.getSectorsInRange(x, y, radius);
    const result: string[] = [];
    const radiusSq = radius * radius;
    
    for (const sector of sectors) {
      for (const entityId of sector.entities) {
        const ref = this.entities.get(entityId);
        if (ref && distanceSquared(x, y, ref.position.x, ref.position.y) <= radiusSq) {
          result.push(entityId);
        }
      }
    }
    
    return result;
  }
  
  getEntitiesInRect(x1: number, y1: number, x2: number, y2: number): EntityReference[] {
    const sectors = this.locationGrid.getSectorsByRect(x1, y1, x2, y2);
    const result: EntityReference[] = [];
    
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (const sector of sectors) {
      for (const entityId of sector.entities) {
        const ref = this.entities.get(entityId);
        if (ref && isPointInRect(ref.position.x, ref.position.y, minX, minY, maxX, maxY)) {
          result.push(ref);
        }
      }
    }
    
    return result;
  }
  
  getEnemiesInRange(x: number, y: number, radius: number, faction: FactionId): string[] {
    const sectors = this.locationGrid.getSectorsInRange(x, y, radius);
    const result: string[] = [];
    const radiusSq = radius * radius;
    
    for (const sector of sectors) {
      if (sector.getEnemyEntityCount(faction) === 0) continue;
      
      for (const entityId of sector.entities) {
        const ref = this.entities.get(entityId);
        if (ref && 
            ref.faction !== faction && 
            ref.faction !== 0 &&
            distanceSquared(x, y, ref.position.x, ref.position.y) <= radiusSq) {
          result.push(entityId);
        }
      }
    }
    
    return result;
  }
  
  getAllEntityIds(): string[] {
    return Array.from(this.entities.keys());
  }
  
  getAllEntities(): EntityReference[] {
    return Array.from(this.entities.values());
  }
  
  getEntityCount(): number {
    return this.entities.size;
  }
  
  clear(): void {
    this.entities.clear();
    this.locationGrid.clear();
    this.destinationGrid.clear();
    this.unitCount = [0, 0, 0, 0];
    this.unitCountSum = 0;
  }
}

// === WORLD CONSTANTS ===
// Scaled up significantly from original 1200x680

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;
export const GRID_SIZE = 50;
export const GAME_SPEED_MULTIPLIER = 0.25; // 4x slower than original
