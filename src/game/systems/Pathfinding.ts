// ============================================
// PATHFINDING SYSTEM
// A* pathfinding with navmesh and collision awareness
// ============================================

import type { Position } from '../../types/index.ts';
import type { WorldGrid } from '../core/WorldGrid.ts';
import type { CollisionSystem } from './CollisionSystem.ts';

// === PATH TYPES ===

export interface PathNode {
  x: number;
  y: number;
  g: number;  // Cost from start
  h: number;  // Heuristic to goal
  f: number;  // Total cost (g + h)
  parent: PathNode | null;
  walkable: boolean;
}

export interface PathResult {
  path: Position[];
  found: boolean;
  cost: number;
  nodesExplored: number;
}

export interface PathfindingConfig {
  gridCellSize: number;
  maxSearchNodes: number;
  allowDiagonal: boolean;
  smoothPath: boolean;
  unitRadius: number;
}

// === PATHFINDING SYSTEM ===

export class PathfindingSystem {
  private worldGrid: WorldGrid | null = null;
  private collisionSystem: CollisionSystem | null = null;
  
  private config: PathfindingConfig = {
    gridCellSize: 32,
    maxSearchNodes: 2000,
    allowDiagonal: true,
    smoothPath: true,
    unitRadius: 16
  };

  // Cache for performance
  private nodeCache: Map<string, PathNode> = new Map();
  private lastCacheClear: number = 0;
  private cacheClearInterval: number = 5000; // Clear cache every 5 seconds

  constructor(config?: Partial<PathfindingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  setWorldGrid(grid: WorldGrid): void {
    this.worldGrid = grid;
    this.clearCache();
  }

  setCollisionSystem(system: CollisionSystem): void {
    this.collisionSystem = system;
  }

  // === A* PATHFINDING ===

  findPath(start: Position, goal: Position, unitRadius?: number): PathResult {
    const radius = unitRadius ?? this.config.unitRadius;
    
    // Check if goal is reachable
    if (!this.isWalkable(goal, radius)) {
      // Find nearest walkable point to goal
      const nearestGoal = this.findNearestWalkable(goal, radius);
      if (!nearestGoal) {
        return { path: [], found: false, cost: 0, nodesExplored: 0 };
      }
      goal = nearestGoal;
    }

    // Grid coordinates
    const startGrid = this.worldToGrid(start);
    const goalGrid = this.worldToGrid(goal);

    // Open and closed sets
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    
    // Start node
    const startNode = this.createNode(startGrid.x, startGrid.y, radius);
    startNode.g = 0;
    startNode.h = this.heuristic(startGrid, goalGrid);
    startNode.f = startNode.h;
    openSet.push(startNode);

    let nodesExplored = 0;

    while (openSet.length > 0 && nodesExplored < this.config.maxSearchNodes) {
      // Get node with lowest f cost
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.x},${current.y}`;
      
      nodesExplored++;

      // Goal reached
      if (current.x === goalGrid.x && current.y === goalGrid.y) {
        const path = this.reconstructPath(current);
        const smoothed = this.config.smoothPath ? this.smoothPath(path, radius) : path;
        
        return {
          path: smoothed,
          found: true,
          cost: current.g,
          nodesExplored
        };
      }

      closedSet.add(currentKey);

      // Get neighbors
      const neighbors = this.getNeighbors(current, radius);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        if (!neighbor.walkable) continue;

        // Calculate tentative g score
        const moveCost = this.getMovementCost(current, neighbor);
        const tentativeG = current.g + moveCost;

        // Check if this path is better
        const existingIndex = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (existingIndex === -1) {
          // New node
          neighbor.g = tentativeG;
          neighbor.h = this.heuristic(neighbor, goalGrid);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          openSet.push(neighbor);
        } else if (tentativeG < openSet[existingIndex].g) {
          // Better path found
          openSet[existingIndex].g = tentativeG;
          openSet[existingIndex].f = tentativeG + openSet[existingIndex].h;
          openSet[existingIndex].parent = current;
        }
      }
    }

    // No path found
    return { path: [], found: false, cost: 0, nodesExplored };
  }

  // === HELPERS ===

  private worldToGrid(pos: Position): { x: number; y: number } {
    return {
      x: Math.floor(pos.x / this.config.gridCellSize),
      y: Math.floor(pos.y / this.config.gridCellSize)
    };
  }

  private gridToWorld(x: number, y: number): Position {
    return {
      x: (x + 0.5) * this.config.gridCellSize,
      y: (y + 0.5) * this.config.gridCellSize
    };
  }

  private createNode(x: number, y: number, unitRadius: number): PathNode {
    const key = `${x},${y}`;
    
    // Check cache
    if (this.nodeCache.has(key)) {
      const cached = this.nodeCache.get(key)!;
      return {
        ...cached,
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null
      };
    }

    const worldPos = this.gridToWorld(x, y);
    const walkable = this.isWalkable(worldPos, unitRadius);

    const node: PathNode = {
      x, y,
      g: Infinity,
      h: 0,
      f: Infinity,
      parent: null,
      walkable
    };

    this.nodeCache.set(key, node);
    return node;
  }

  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    // Octile distance for diagonal movement
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    
    if (this.config.allowDiagonal) {
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    }
    
    return dx + dy; // Manhattan distance
  }

  private getMovementCost(from: PathNode, to: PathNode): number {
    // Base cost
    let cost = (from.x !== to.x && from.y !== to.y) ? Math.SQRT2 : 1;
    
    // Terrain cost
    if (this.worldGrid) {
      const worldPos = this.gridToWorld(to.x, to.y);
      const terrainCost = this.worldGrid.getMovementCost(worldPos.x, worldPos.y);
      cost *= terrainCost;
    }

    return cost;
  }

  private getNeighbors(node: PathNode, unitRadius: number): PathNode[] {
    const neighbors: PathNode[] = [];
    
    // 8-directional movement
    const directions = [
      { x: 0, y: -1 },   // N
      { x: 1, y: 0 },    // E
      { x: 0, y: 1 },    // S
      { x: -1, y: 0 },   // W
    ];

    if (this.config.allowDiagonal) {
      directions.push(
        { x: 1, y: -1 },   // NE
        { x: 1, y: 1 },    // SE
        { x: -1, y: 1 },   // SW
        { x: -1, y: -1 }   // NW
      );
    }

    for (const dir of directions) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;
      
      // Diagonal movement: ensure we can move through corners
      if (dir.x !== 0 && dir.y !== 0) {
        const cardinal1 = this.createNode(node.x + dir.x, node.y, unitRadius);
        const cardinal2 = this.createNode(node.x, node.y + dir.y, unitRadius);
        if (!cardinal1.walkable || !cardinal2.walkable) continue;
      }

      neighbors.push(this.createNode(nx, ny, unitRadius));
    }

    return neighbors;
  }

  private reconstructPath(endNode: PathNode): Position[] {
    const path: Position[] = [];
    let current: PathNode | null = endNode;

    while (current) {
      path.unshift(this.gridToWorld(current.x, current.y));
      current = current.parent;
    }

    return path;
  }

  // === PATH SMOOTHING ===

  private smoothPath(path: Position[], unitRadius: number): Position[] {
    if (path.length <= 2) return path;

    const smoothed: Position[] = [path[0]];
    let i = 0;

    while (i < path.length - 1) {
      let furthest = i + 1;

      // Find furthest visible point
      for (let j = path.length - 1; j > i + 1; j--) {
        if (this.hasLineOfSight(path[i], path[j], unitRadius)) {
          furthest = j;
          break;
        }
      }

      smoothed.push(path[furthest]);
      i = furthest;
    }

    return smoothed;
  }

  private hasLineOfSight(from: Position, to: Position, unitRadius: number): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / (this.config.gridCellSize / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;

      if (!this.isWalkable({ x, y }, unitRadius)) {
        return false;
      }
    }

    return true;
  }

  // === WALKABILITY ===

  isWalkable(position: Position, unitRadius?: number): boolean {
    const radius = unitRadius ?? this.config.unitRadius;

    // Check world grid
    if (this.worldGrid) {
      if (!this.worldGrid.isWalkable(position.x, position.y)) {
        return false;
      }
    }

    // Check collision system for static obstacles
    if (this.collisionSystem) {
      const colliders = this.collisionSystem.queryRadius(
        position,
        radius,
        (1 << 1) | (1 << 4) // Building | Terrain layers
      );

      for (const collider of colliders) {
        if (collider.isStatic && !collider.isTrigger) {
          return false;
        }
      }
    }

    return true;
  }

  private findNearestWalkable(position: Position, unitRadius: number): Position | null {
    const cellSize = this.config.gridCellSize;
    const maxRadius = 10; // Search up to 10 cells away

    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const testPos = {
            x: position.x + dx * cellSize,
            y: position.y + dy * cellSize
          };

          if (this.isWalkable(testPos, unitRadius)) {
            return testPos;
          }
        }
      }
    }

    return null;
  }

  // === CACHE MANAGEMENT ===

  clearCache(): void {
    this.nodeCache.clear();
    this.lastCacheClear = performance.now();
  }

  maybeClearCache(): void {
    const now = performance.now();
    if (now - this.lastCacheClear > this.cacheClearInterval) {
      this.clearCache();
    }
  }

  // === FLOW FIELD (for multiple units) ===

  generateFlowField(goal: Position, bounds: { minX: number; minY: number; maxX: number; maxY: number }): Map<string, Position> {
    const flowField = new Map<string, Position>();
    
    const goalGrid = this.worldToGrid(goal);
    
    // BFS from goal
    const queue: { x: number; y: number; dist: number }[] = [{ ...goalGrid, dist: 0 }];
    const visited = new Set<string>();
    visited.add(`${goalGrid.x},${goalGrid.y}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (visited.has(key)) continue;
        
        const worldPos = this.gridToWorld(neighbor.x, neighbor.y);
        if (worldPos.x < bounds.minX || worldPos.x > bounds.maxX ||
            worldPos.y < bounds.minY || worldPos.y > bounds.maxY) continue;
        
        if (!this.isWalkable(worldPos)) continue;

        visited.add(key);
        queue.push({ ...neighbor, dist: current.dist + 1 });

        // Point toward parent (current)
        const parentWorld = this.gridToWorld(current.x, current.y);
        const dx = parentWorld.x - worldPos.x;
        const dy = parentWorld.y - worldPos.y;
        const len = Math.hypot(dx, dy);
        
        flowField.set(key, { x: dx / len, y: dy / len });
      }
    }

    // Goal points to itself
    flowField.set(`${goalGrid.x},${goalGrid.y}`, { x: 0, y: 0 });

    return flowField;
  }

  getFlowDirection(flowField: Map<string, Position>, position: Position): Position | null {
    const grid = this.worldToGrid(position);
    return flowField.get(`${grid.x},${grid.y}`) ?? null;
  }

  // === DEBUG ===

  debugRender(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, path?: Position[]): void {
    if (!path || path.length === 0) return;

    ctx.save();

    // Draw path
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(path[0].x - cameraX, path[0].y - cameraY);
    
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x - cameraX, path[i].y - cameraY);
    }
    ctx.stroke();

    // Draw waypoints
    ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
    for (const point of path) {
      ctx.beginPath();
      ctx.arc(point.x - cameraX, point.y - cameraY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Goal marker
    const goal = path[path.length - 1];
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(goal.x - cameraX, goal.y - cameraY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
