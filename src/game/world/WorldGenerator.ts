// ============================================
// WORLD GENERATOR
// Procedural island archipelago generation
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { Island, IslandNode, Camp, DockPoint, TerrainTile, TerrainType } from '../../types/world.ts';
import { generateId } from '../core/GridSystem.ts';

// === WORLD CONSTANTS ===

export const WORLD_CONFIG = {
  width: 6000,
  height: 6000,
  tileSize: 16, // Matches MiniWorld terrain tiles
  
  // Island generation
  minIslands: 12,
  maxIslands: 20,
  minIslandRadius: 150,
  maxIslandRadius: 400,
  islandSpacing: 300, // Minimum distance between island centers
  
  // Gameplay
  nodesPerIsland: { min: 2, max: 5 },
  docksPerIsland: { min: 2, max: 4 },
  
  // Starting conditions
  playerStartIslandRadius: 350,
  enemyIslandsMin: 3,
  neutralIslandsMin: 4
};

// === NOISE FUNCTIONS ===

// Simple seeded random for reproducible generation
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Simplex-like noise for terrain
function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  
  const fx = sx - x0;
  const fy = sy - y0;
  
  // Smooth interpolation
  const sfx = fx * fx * (3 - 2 * fx);
  const sfy = fy * fy * (3 - 2 * fy);
  
  const n00 = noise2D(x0, y0, seed);
  const n10 = noise2D(x1, y0, seed);
  const n01 = noise2D(x0, y1, seed);
  const n11 = noise2D(x1, y1, seed);
  
  const nx0 = n00 * (1 - sfx) + n10 * sfx;
  const nx1 = n01 * (1 - sfx) + n11 * sfx;
  
  return nx0 * (1 - sfy) + nx1 * sfy;
}

// === ISLAND SHAPE GENERATION ===

function generateIslandShape(center: Position, baseRadius: number, rng: SeededRandom): Position[] {
  const vertices: Position[] = [];
  const numPoints = rng.int(8, 16);
  const angleStep = (Math.PI * 2) / numPoints;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    // Vary radius for organic shape
    const radiusVariation = 0.6 + rng.next() * 0.8;
    const radius = baseRadius * radiusVariation;
    
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  
  return vertices;
}

// Check if point is inside polygon
function isPointInPolygon(point: Position, vertices: Position[]): boolean {
  let inside = false;
  const n = vertices.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// === ISLAND NAME GENERATION ===

const ISLAND_PREFIXES = ['Storm', 'Shadow', 'Dragon', 'Serpent', 'Iron', 'Golden', 'Crystal', 'Ember', 'Frost', 'Thunder', 'Mystic', 'Ancient', 'Lost', 'Forgotten', 'Sacred'];
const ISLAND_SUFFIXES = ['Isle', 'Cove', 'Haven', 'Reef', 'Rock', 'Point', 'Bay', 'Shore', 'Landing', 'Atoll'];

function generateIslandName(rng: SeededRandom): string {
  return `${rng.pick(ISLAND_PREFIXES)} ${rng.pick(ISLAND_SUFFIXES)}`;
}

// === MAIN GENERATOR ===

export class WorldGenerator {
  private rng: SeededRandom;
  private seed: number;
  
  // Generated data
  public islands: Map<string, Island> = new Map();
  public terrainGrid: TerrainTile[][] = [];
  public gridWidth: number;
  public gridHeight: number;
  
  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(this.seed);
    this.gridWidth = Math.ceil(WORLD_CONFIG.width / WORLD_CONFIG.tileSize);
    this.gridHeight = Math.ceil(WORLD_CONFIG.height / WORLD_CONFIG.tileSize);
  }
  
  generate(): void {
    console.log(`Generating world with seed: ${this.seed}`);
    
    // 1. Generate island positions
    const islandCenters = this.generateIslandPositions();
    
    // 2. Create island structures
    this.createIslands(islandCenters);
    
    // 3. Generate terrain grid
    this.generateTerrainGrid();
    
    // 4. Assign factions
    this.assignFactions();
    
    // 5. Generate nodes and docks for each island
    this.generateIslandFeatures();
    
    console.log(`Generated ${this.islands.size} islands`);
  }
  
  private generateIslandPositions(): Position[] {
    const positions: Position[] = [];
    const numIslands = this.rng.int(WORLD_CONFIG.minIslands, WORLD_CONFIG.maxIslands);
    const margin = WORLD_CONFIG.maxIslandRadius + 100;
    
    // Player start island in bottom-left quadrant
    positions.push({
      x: this.rng.range(margin, WORLD_CONFIG.width * 0.3),
      y: this.rng.range(WORLD_CONFIG.height * 0.7, WORLD_CONFIG.height - margin)
    });
    
    // Try to place remaining islands
    let attempts = 0;
    while (positions.length < numIslands && attempts < 1000) {
      const candidate: Position = {
        x: this.rng.range(margin, WORLD_CONFIG.width - margin),
        y: this.rng.range(margin, WORLD_CONFIG.height - margin)
      };
      
      // Check distance from all existing islands
      let valid = true;
      for (const pos of positions) {
        const dist = Math.hypot(candidate.x - pos.x, candidate.y - pos.y);
        if (dist < WORLD_CONFIG.islandSpacing + WORLD_CONFIG.minIslandRadius * 2) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        positions.push(candidate);
      }
      attempts++;
    }
    
    return positions;
  }
  
  private createIslands(centers: Position[]): void {
    centers.forEach((center, index) => {
      const id = generateId();
      const isPlayerStart = index === 0;
      
      const radius = isPlayerStart 
        ? WORLD_CONFIG.playerStartIslandRadius
        : this.rng.range(WORLD_CONFIG.minIslandRadius, WORLD_CONFIG.maxIslandRadius);
      
      const island: Island = {
        id,
        name: isPlayerStart ? 'Homeland' : generateIslandName(this.rng),
        center,
        radius,
        vertices: generateIslandShape(center, radius, this.rng),
        owner: 0 as FactionId, // Will be assigned later
        nodes: [],
        camp: null,
        dockPoints: [],
        buildings: []
      };
      
      this.islands.set(id, island);
    });
  }
  
  private generateTerrainGrid(): void {
    // Initialize grid with deep water
    this.terrainGrid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.terrainGrid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.terrainGrid[y][x] = {
          type: 'deep_water',
          elevation: 0,
          walkable: false,
          buildable: false
        };
      }
    }
    
    // Fill in islands
    for (const island of this.islands.values()) {
      this.fillIslandTerrain(island);
    }
  }
  
  private fillIslandTerrain(island: Island): void {
    const { center, vertices, radius } = island;
    const tileSize = WORLD_CONFIG.tileSize;
    
    // Bounding box for island
    const minX = Math.floor((center.x - radius - 50) / tileSize);
    const maxX = Math.ceil((center.x + radius + 50) / tileSize);
    const minY = Math.floor((center.y - radius - 50) / tileSize);
    const maxY = Math.ceil((center.y + radius + 50) / tileSize);
    
    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) continue;
        
        const worldX = gx * tileSize + tileSize / 2;
        const worldY = gy * tileSize + tileSize / 2;
        const point = { x: worldX, y: worldY };
        
        const distToCenter = Math.hypot(worldX - center.x, worldY - center.y);
        const inPolygon = isPointInPolygon(point, vertices);
        
        if (inPolygon) {
          // Core island - grass or rock
          const noiseVal = smoothNoise(worldX, worldY, this.seed, 80);
          const edgeDist = this.getDistanceToEdge(point, vertices);
          
          let terrainType: TerrainType;
          let elevation: number;
          
          if (edgeDist < 20) {
            // Beach/shore
            terrainType = 'sand';
            elevation = 2;
          } else if (noiseVal > 0.7) {
            // Rocky areas
            terrainType = 'rock';
            elevation = 4;
          } else if (noiseVal > 0.5) {
            // Forest
            terrainType = 'forest';
            elevation = 3;
          } else {
            // Grass
            terrainType = 'grass';
            elevation = 3;
          }
          
          this.terrainGrid[gy][gx] = {
            type: terrainType,
            elevation,
            walkable: true,
            buildable: terrainType === 'grass' || terrainType === 'sand'
          };
        } else if (distToCenter < radius + 30) {
          // Shallow water around island
          this.terrainGrid[gy][gx] = {
            type: 'shallow_water',
            elevation: 1,
            walkable: false,
            buildable: false
          };
        }
      }
    }
  }
  
  private getDistanceToEdge(point: Position, vertices: Position[]): number {
    let minDist = Infinity;
    
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      
      // Distance from point to line segment
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      
      if (len === 0) continue;
      
      const t = Math.max(0, Math.min(1, 
        ((point.x - a.x) * dx + (point.y - a.y) * dy) / (len * len)
      ));
      
      const closestX = a.x + t * dx;
      const closestY = a.y + t * dy;
      
      const dist = Math.hypot(point.x - closestX, point.y - closestY);
      minDist = Math.min(minDist, dist);
    }
    
    return minDist;
  }
  
  private assignFactions(): void {
    const islandArray = Array.from(this.islands.values());
    
    // Player gets first island
    islandArray[0].owner = 1 as FactionId;
    
    // Assign enemy islands (far from player)
    const playerPos = islandArray[0].center;
    const sortedByDistance = islandArray.slice(1).sort((a, b) => {
      const distA = Math.hypot(a.center.x - playerPos.x, a.center.y - playerPos.y);
      const distB = Math.hypot(b.center.x - playerPos.x, b.center.y - playerPos.y);
      return distB - distA; // Furthest first
    });
    
    // Furthest islands are enemy
    const enemyCount = Math.min(WORLD_CONFIG.enemyIslandsMin + this.rng.int(0, 2), sortedByDistance.length);
    for (let i = 0; i < enemyCount; i++) {
      sortedByDistance[i].owner = 2 as FactionId; // Goblin faction
    }
    
    // Rest are neutral
    for (let i = enemyCount; i < sortedByDistance.length; i++) {
      sortedByDistance[i].owner = 0 as FactionId;
    }
  }
  
  private generateIslandFeatures(): void {
    for (const island of this.islands.values()) {
      // Generate camp at center
      island.camp = this.generateCamp(island);
      
      // Generate nodes
      const numNodes = this.rng.int(
        WORLD_CONFIG.nodesPerIsland.min,
        WORLD_CONFIG.nodesPerIsland.max
      );
      island.nodes = this.generateNodes(island, numNodes);
      
      // Generate dock points
      const numDocks = this.rng.int(
        WORLD_CONFIG.docksPerIsland.min,
        WORLD_CONFIG.docksPerIsland.max
      );
      island.dockPoints = this.generateDocks(island, numDocks);
    }
  }
  
  private generateCamp(island: Island): Camp {
    return {
      id: generateId(),
      islandId: island.id,
      position: { ...island.center },
      owner: island.owner,
      health: 1000,
      maxHealth: 1000,
      isDestroyed: false,
      level: island.owner === 0 ? 0 : 1
    };
  }
  
  private generateNodes(island: Island, count: number): IslandNode[] {
    const nodes: IslandNode[] = [];
    const usedPositions: Position[] = [island.center]; // Avoid camp
    
    for (let i = 0; i < count; i++) {
      // Find valid position on island
      let pos: Position | null = null;
      let attempts = 0;
      
      while (!pos && attempts < 50) {
        const angle = this.rng.next() * Math.PI * 2;
        const dist = this.rng.range(60, island.radius * 0.7);
        const candidate = {
          x: island.center.x + Math.cos(angle) * dist,
          y: island.center.y + Math.sin(angle) * dist
        };
        
        // Check if on walkable terrain and not too close to other nodes
        if (isPointInPolygon(candidate, island.vertices)) {
          const tooClose = usedPositions.some(
            p => Math.hypot(p.x - candidate.x, p.y - candidate.y) < 80
          );
          if (!tooClose) {
            pos = candidate;
            usedPositions.push(pos);
          }
        }
        attempts++;
      }
      
      if (pos) {
        nodes.push({
          id: generateId(),
          islandId: island.id,
          position: pos,
          owner: island.owner,
          captureProgress: island.owner === 0 ? 0 : 100,
          capturingFaction: null,
          spawnTimer: 0,
          spawnInterval: 15 + this.rng.next() * 10, // 15-25 seconds
          unitTier: Math.min(5, Math.max(1, Math.floor(this.rng.next() * 3) + 1)) as 1|2|3|4|5,
          isActive: island.owner !== 0
        });
      }
    }
    
    return nodes;
  }
  
  private generateDocks(island: Island, count: number): DockPoint[] {
    const docks: DockPoint[] = [];
    const angleStep = (Math.PI * 2) / count;
    const startAngle = this.rng.next() * Math.PI * 2;
    
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep + this.rng.range(-0.3, 0.3);
      
      // Find edge of island at this angle
      const rayStart = island.center;
      const rayDir = { x: Math.cos(angle), y: Math.sin(angle) };
      
      // March outward until we exit the polygon
      let dist = 10;
      while (dist < island.radius + 100) {
        const testPoint = {
          x: rayStart.x + rayDir.x * dist,
          y: rayStart.y + rayDir.y * dist
        };
        
        if (!isPointInPolygon(testPoint, island.vertices)) {
          // Found edge - dock is slightly outside
          docks.push({
            id: generateId(),
            islandId: island.id,
            position: {
              x: rayStart.x + rayDir.x * (dist + 20),
              y: rayStart.y + rayDir.y * (dist + 20)
            },
            direction: angle + Math.PI, // Face toward island
            isOccupied: false,
            occupyingBoatId: null
          });
          break;
        }
        dist += 10;
      }
    }
    
    return docks;
  }
  
  // === UTILITY METHODS ===
  
  getIslandAt(worldX: number, worldY: number): Island | null {
    for (const island of this.islands.values()) {
      if (isPointInPolygon({ x: worldX, y: worldY }, island.vertices)) {
        return island;
      }
    }
    return null;
  }
  
  getTerrainAt(worldX: number, worldY: number): TerrainTile | null {
    const gx = Math.floor(worldX / WORLD_CONFIG.tileSize);
    const gy = Math.floor(worldY / WORLD_CONFIG.tileSize);
    
    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) {
      return null;
    }
    
    return this.terrainGrid[gy][gx];
  }
  
  isWalkable(worldX: number, worldY: number): boolean {
    const terrain = this.getTerrainAt(worldX, worldY);
    return terrain?.walkable ?? false;
  }
  
  isBuildable(worldX: number, worldY: number): boolean {
    const terrain = this.getTerrainAt(worldX, worldY);
    return terrain?.buildable ?? false;
  }
  
  getPlayerStartIsland(): Island {
    return Array.from(this.islands.values())[0];
  }
  
  getEnemyIslands(): Island[] {
    return Array.from(this.islands.values()).filter(i => i.owner === 2);
  }
  
  getNeutralIslands(): Island[] {
    return Array.from(this.islands.values()).filter(i => i.owner === 0);
  }
}
