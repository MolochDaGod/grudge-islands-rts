// ============================================
// COLLISION SYSTEM
// 2D colliders for units, buildings, ships, projectiles
// ============================================

import type { Position, FactionId } from '../../types/index.ts';

// === COLLIDER TYPES ===

export type ColliderType = 'circle' | 'box' | 'polygon';

export interface Collider {
  id: string;
  type: ColliderType;
  position: Position;
  layer: CollisionLayer;
  isTrigger: boolean; // Triggers don't block movement
  isStatic: boolean;  // Static objects don't move
  faction: FactionId;
  entityType: EntityColliderType;
  data: CircleCollider | BoxCollider | PolygonCollider;
}

export interface CircleCollider {
  radius: number;
}

export interface BoxCollider {
  width: number;
  height: number;
  rotation: number;
}

export interface PolygonCollider {
  vertices: Position[];
}

// Collision layers for filtering
export enum CollisionLayer {
  None = 0,
  Unit = 1 << 0,
  Building = 1 << 1,
  Ship = 1 << 2,
  Projectile = 1 << 3,
  Terrain = 1 << 4,
  Trigger = 1 << 5,
  All = 0xFFFF
}

export type EntityColliderType = 
  | 'hero'
  | 'unit'
  | 'enemy'
  | 'tower'
  | 'building'
  | 'ship'
  | 'projectile'
  | 'resource'
  | 'dock';

// Collision result
export interface CollisionResult {
  colliderA: Collider;
  colliderB: Collider;
  overlap: number;
  normal: Position;
  contactPoint: Position;
}

// === COLLISION SYSTEM ===

export class CollisionSystem {
  private colliders: Map<string, Collider> = new Map();
  private spatialGrid: Map<string, Set<string>> = new Map();
  private cellSize: number = 64;

  // Layer collision matrix
  private layerMatrix: Map<CollisionLayer, CollisionLayer> = new Map([
    [CollisionLayer.Unit, CollisionLayer.Unit | CollisionLayer.Building | CollisionLayer.Ship | CollisionLayer.Terrain],
    [CollisionLayer.Building, CollisionLayer.Unit | CollisionLayer.Building | CollisionLayer.Projectile],
    [CollisionLayer.Ship, CollisionLayer.Unit | CollisionLayer.Ship | CollisionLayer.Terrain],
    [CollisionLayer.Projectile, CollisionLayer.Unit | CollisionLayer.Building | CollisionLayer.Ship],
    [CollisionLayer.Terrain, CollisionLayer.Unit | CollisionLayer.Ship],
    [CollisionLayer.Trigger, CollisionLayer.Unit]
  ]);

  // Callbacks
  public onCollision: ((result: CollisionResult) => void) | null = null;
  public onTriggerEnter: ((trigger: Collider, other: Collider) => void) | null = null;
  public onTriggerExit: ((trigger: Collider, other: Collider) => void) | null = null;

  // Track trigger states
  private activeTriggers: Map<string, Set<string>> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  // === COLLIDER MANAGEMENT ===

  addCircleCollider(
    id: string,
    position: Position,
    radius: number,
    layer: CollisionLayer,
    entityType: EntityColliderType,
    faction: FactionId = 0 as FactionId,
    options: { isTrigger?: boolean; isStatic?: boolean } = {}
  ): Collider {
    const collider: Collider = {
      id,
      type: 'circle',
      position: { ...position },
      layer,
      isTrigger: options.isTrigger ?? false,
      isStatic: options.isStatic ?? false,
      faction,
      entityType,
      data: { radius }
    };

    this.colliders.set(id, collider);
    this.updateSpatialGrid(collider);

    return collider;
  }

  addBoxCollider(
    id: string,
    position: Position,
    width: number,
    height: number,
    layer: CollisionLayer,
    entityType: EntityColliderType,
    faction: FactionId = 0 as FactionId,
    options: { isTrigger?: boolean; isStatic?: boolean; rotation?: number } = {}
  ): Collider {
    const collider: Collider = {
      id,
      type: 'box',
      position: { ...position },
      layer,
      isTrigger: options.isTrigger ?? false,
      isStatic: options.isStatic ?? false,
      faction,
      entityType,
      data: { width, height, rotation: options.rotation ?? 0 }
    };

    this.colliders.set(id, collider);
    this.updateSpatialGrid(collider);

    return collider;
  }

  removeCollider(id: string): void {
    const collider = this.colliders.get(id);
    if (collider) {
      this.removeFromSpatialGrid(collider);
      this.colliders.delete(id);
      this.activeTriggers.delete(id);
    }
  }

  updatePosition(id: string, position: Position): void {
    const collider = this.colliders.get(id);
    if (collider) {
      this.removeFromSpatialGrid(collider);
      collider.position = { ...position };
      this.updateSpatialGrid(collider);
    }
  }

  getCollider(id: string): Collider | undefined {
    return this.colliders.get(id);
  }

  // === SPATIAL GRID ===

  private getColliderCells(collider: Collider): string[] {
    const cells: string[] = [];
    let minX: number, maxX: number, minY: number, maxY: number;

    if (collider.type === 'circle') {
      const data = collider.data as CircleCollider;
      minX = collider.position.x - data.radius;
      maxX = collider.position.x + data.radius;
      minY = collider.position.y - data.radius;
      maxY = collider.position.y + data.radius;
    } else if (collider.type === 'box') {
      const data = collider.data as BoxCollider;
      const diagonal = Math.hypot(data.width, data.height) / 2;
      minX = collider.position.x - diagonal;
      maxX = collider.position.x + diagonal;
      minY = collider.position.y - diagonal;
      maxY = collider.position.y + diagonal;
    } else {
      // Fallback for polygon
      minX = collider.position.x - 32;
      maxX = collider.position.x + 32;
      minY = collider.position.y - 32;
      maxY = collider.position.y + 32;
    }

    for (let x = Math.floor(minX / this.cellSize); x <= Math.floor(maxX / this.cellSize); x++) {
      for (let y = Math.floor(minY / this.cellSize); y <= Math.floor(maxY / this.cellSize); y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }

  private updateSpatialGrid(collider: Collider): void {
    const cells = this.getColliderCells(collider);
    for (const cell of cells) {
      if (!this.spatialGrid.has(cell)) {
        this.spatialGrid.set(cell, new Set());
      }
      this.spatialGrid.get(cell)!.add(collider.id);
    }
  }

  private removeFromSpatialGrid(collider: Collider): void {
    const cells = this.getColliderCells(collider);
    for (const cell of cells) {
      this.spatialGrid.get(cell)?.delete(collider.id);
    }
  }

  // === COLLISION DETECTION ===

  update(): CollisionResult[] {
    const results: CollisionResult[] = [];
    const checked = new Set<string>();

    for (const collider of this.colliders.values()) {
      if (collider.isStatic) continue;

      const cells = this.getColliderCells(collider);
      const nearbyIds = new Set<string>();

      for (const cell of cells) {
        const cellColliders = this.spatialGrid.get(cell);
        if (cellColliders) {
          for (const id of cellColliders) {
            if (id !== collider.id) {
              nearbyIds.add(id);
            }
          }
        }
      }

      for (const otherId of nearbyIds) {
        const pairKey = [collider.id, otherId].sort().join(':');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const other = this.colliders.get(otherId);
        if (!other) continue;

        // Check layer collision
        if (!this.canCollide(collider.layer, other.layer)) continue;

        // Check for collision
        const result = this.checkCollision(collider, other);
        if (result) {
          results.push(result);

          // Handle triggers
          if (collider.isTrigger || other.isTrigger) {
            this.handleTrigger(collider, other);
          } else if (this.onCollision) {
            this.onCollision(result);
          }
        }
      }
    }

    // Check for trigger exits
    this.checkTriggerExits();

    return results;
  }

  private canCollide(layerA: CollisionLayer, layerB: CollisionLayer): boolean {
    const matrixA = this.layerMatrix.get(layerA) ?? CollisionLayer.None;
    return (matrixA & layerB) !== 0;
  }

  private checkCollision(a: Collider, b: Collider): CollisionResult | null {
    if (a.type === 'circle' && b.type === 'circle') {
      return this.circleVsCircle(a, b);
    }
    if (a.type === 'circle' && b.type === 'box') {
      return this.circleVsBox(a, b);
    }
    if (a.type === 'box' && b.type === 'circle') {
      const result = this.circleVsBox(b, a);
      if (result) {
        // Swap and invert
        return {
          ...result,
          colliderA: a,
          colliderB: b,
          normal: { x: -result.normal.x, y: -result.normal.y }
        };
      }
      return null;
    }
    if (a.type === 'box' && b.type === 'box') {
      return this.boxVsBox(a, b);
    }
    return null;
  }

  private circleVsCircle(a: Collider, b: Collider): CollisionResult | null {
    const dataA = a.data as CircleCollider;
    const dataB = b.data as CircleCollider;

    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dist = Math.hypot(dx, dy);
    const combinedRadius = dataA.radius + dataB.radius;

    if (dist < combinedRadius && dist > 0) {
      const overlap = combinedRadius - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      return {
        colliderA: a,
        colliderB: b,
        overlap,
        normal: { x: nx, y: ny },
        contactPoint: {
          x: a.position.x + nx * dataA.radius,
          y: a.position.y + ny * dataA.radius
        }
      };
    }

    return null;
  }

  private circleVsBox(circle: Collider, box: Collider): CollisionResult | null {
    const circleData = circle.data as CircleCollider;
    const boxData = box.data as BoxCollider;

    // Simplified AABB check (no rotation support yet)
    const halfW = boxData.width / 2;
    const halfH = boxData.height / 2;

    // Find closest point on box to circle center
    const closestX = Math.max(box.position.x - halfW, Math.min(circle.position.x, box.position.x + halfW));
    const closestY = Math.max(box.position.y - halfH, Math.min(circle.position.y, box.position.y + halfH));

    const dx = circle.position.x - closestX;
    const dy = circle.position.y - closestY;
    const dist = Math.hypot(dx, dy);

    if (dist < circleData.radius && dist > 0) {
      const overlap = circleData.radius - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      return {
        colliderA: circle,
        colliderB: box,
        overlap,
        normal: { x: nx, y: ny },
        contactPoint: { x: closestX, y: closestY }
      };
    }

    return null;
  }

  private boxVsBox(a: Collider, b: Collider): CollisionResult | null {
    const dataA = a.data as BoxCollider;
    const dataB = b.data as BoxCollider;

    // AABB collision
    const halfWA = dataA.width / 2;
    const halfHA = dataA.height / 2;
    const halfWB = dataB.width / 2;
    const halfHB = dataB.height / 2;

    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;

    const overlapX = halfWA + halfWB - Math.abs(dx);
    const overlapY = halfHA + halfHB - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      let normal: Position;
      let overlap: number;

      if (overlapX < overlapY) {
        overlap = overlapX;
        normal = { x: dx > 0 ? 1 : -1, y: 0 };
      } else {
        overlap = overlapY;
        normal = { x: 0, y: dy > 0 ? 1 : -1 };
      }

      return {
        colliderA: a,
        colliderB: b,
        overlap,
        normal,
        contactPoint: {
          x: (a.position.x + b.position.x) / 2,
          y: (a.position.y + b.position.y) / 2
        }
      };
    }

    return null;
  }

  // === TRIGGER HANDLING ===

  private handleTrigger(a: Collider, b: Collider): void {
    const trigger = a.isTrigger ? a : b;
    const other = a.isTrigger ? b : a;

    if (!this.activeTriggers.has(trigger.id)) {
      this.activeTriggers.set(trigger.id, new Set());
    }

    const active = this.activeTriggers.get(trigger.id)!;
    if (!active.has(other.id)) {
      active.add(other.id);
      if (this.onTriggerEnter) {
        this.onTriggerEnter(trigger, other);
      }
    }
  }

  private checkTriggerExits(): void {
    for (const [triggerId, activeIds] of this.activeTriggers) {
      const trigger = this.colliders.get(triggerId);
      if (!trigger) {
        this.activeTriggers.delete(triggerId);
        continue;
      }

      const toRemove: string[] = [];
      for (const otherId of activeIds) {
        const other = this.colliders.get(otherId);
        if (!other || !this.checkCollision(trigger, other)) {
          toRemove.push(otherId);
          if (other && this.onTriggerExit) {
            this.onTriggerExit(trigger, other);
          }
        }
      }

      for (const id of toRemove) {
        activeIds.delete(id);
      }
    }
  }

  // === SEPARATION ===

  resolveCollision(result: CollisionResult): { posA: Position; posB: Position } {
    const { colliderA, colliderB, overlap, normal } = result;

    // Skip if either is a trigger
    if (colliderA.isTrigger || colliderB.isTrigger) {
      return { posA: colliderA.position, posB: colliderB.position };
    }

    let moveA = 0.5;
    let moveB = 0.5;

    // Static objects don't move
    if (colliderA.isStatic && !colliderB.isStatic) {
      moveA = 0;
      moveB = 1;
    } else if (!colliderA.isStatic && colliderB.isStatic) {
      moveA = 1;
      moveB = 0;
    } else if (colliderA.isStatic && colliderB.isStatic) {
      return { posA: colliderA.position, posB: colliderB.position };
    }

    const separation = overlap + 1; // Small buffer

    return {
      posA: {
        x: colliderA.position.x - normal.x * separation * moveA,
        y: colliderA.position.y - normal.y * separation * moveA
      },
      posB: {
        x: colliderB.position.x + normal.x * separation * moveB,
        y: colliderB.position.y + normal.y * separation * moveB
      }
    };
  }

  // === QUERIES ===

  queryRadius(position: Position, radius: number, layerMask: CollisionLayer = CollisionLayer.All): Collider[] {
    const results: Collider[] = [];

    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);

    const checked = new Set<string>();

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const cellColliders = this.spatialGrid.get(`${x},${y}`);
        if (!cellColliders) continue;

        for (const id of cellColliders) {
          if (checked.has(id)) continue;
          checked.add(id);

          const collider = this.colliders.get(id);
          if (!collider) continue;
          if ((collider.layer & layerMask) === 0) continue;

          const dist = Math.hypot(
            collider.position.x - position.x,
            collider.position.y - position.y
          );

          let colliderRadius = 0;
          if (collider.type === 'circle') {
            colliderRadius = (collider.data as CircleCollider).radius;
          } else if (collider.type === 'box') {
            const data = collider.data as BoxCollider;
            colliderRadius = Math.hypot(data.width, data.height) / 2;
          }

          if (dist <= radius + colliderRadius) {
            results.push(collider);
          }
        }
      }
    }

    return results;
  }

  queryPoint(position: Position, layerMask: CollisionLayer = CollisionLayer.All): Collider[] {
    return this.queryRadius(position, 1, layerMask);
  }

  // === DEBUG ===

  debugRender(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    ctx.save();

    for (const collider of this.colliders.values()) {
      const x = collider.position.x - cameraX;
      const y = collider.position.y - cameraY;

      ctx.strokeStyle = collider.isTrigger ? 'rgba(255, 255, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;

      if (collider.type === 'circle') {
        const data = collider.data as CircleCollider;
        ctx.beginPath();
        ctx.arc(x, y, data.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (collider.type === 'box') {
        const data = collider.data as BoxCollider;
        ctx.strokeRect(x - data.width / 2, y - data.height / 2, data.width, data.height);
      }
    }

    ctx.restore();
  }
}
