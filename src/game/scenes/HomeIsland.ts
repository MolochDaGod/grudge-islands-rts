// ============================================
// HOME ISLAND SCENE
// Safe zone with harvesting, crafting, recruiting, inventory
// ============================================

import type { FactionId as _FactionId } from '../../types/index.ts';
import { saveSystem, type SavedGameState } from '../systems/SaveSystem.ts';

// === RESOURCE TYPES ===

export interface PlayerResources {
  gold: number;
  wood: number;
  stone: number;
  iron: number;
  food: number;
  crystal: number;
  population: number;
  maxPopulation: number;
}

export interface InventoryItem {
  id: string;
  type: 'material' | 'equipment' | 'consumable' | 'key';
  name: string;
  quantity: number;
  icon: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// === BUILDING DEFINITIONS ===

export type HomeIslandBuildingType = 
  | 'camp'        // Main building - always exists
  | 'barracks'    // Recruit soldiers
  | 'dock'        // Build boats
  | 'smithy'      // Craft weapons/armor
  | 'lumbermill'  // Produce wood
  | 'mine'        // Produce stone/iron
  | 'farm'        // Produce food
  | 'warehouse'   // Increase storage
  | 'tower'       // Defense
  | 'wall';       // Defense

export interface BuildingDefinition {
  type: HomeIslandBuildingType;
  name: string;
  emoji: string;
  sprite: string;
  size: { width: number; height: number }; // Grid cells
  cost: Partial<PlayerResources>;
  buildTime: number; // seconds
  hp: number;
  
  // Production
  produces?: Partial<PlayerResources>;
  productionRate?: number; // per minute
  maxStorage?: number;
  
  // Military
  power?: number;
  defense?: number;
  
  // Recruitment
  recruits?: string[];
  
  // Requirements
  requires?: HomeIslandBuildingType[];
  maxCount?: number;
  
  // Upgrade
  upgradeCost?: Partial<PlayerResources>[];
  maxLevel?: number;
}

export const BUILDING_DEFINITIONS: Record<HomeIslandBuildingType, BuildingDefinition> = {
  camp: {
    type: 'camp',
    name: 'Command Camp',
    emoji: '⛺',
    sprite: 'Buildings/Blue/BlueHouse.png',
    size: { width: 2, height: 2 },
    cost: {},
    buildTime: 0,
    hp: 2000,
    defense: 100,
    maxCount: 1,
    maxLevel: 5,
    upgradeCost: [
      { gold: 500, wood: 200, stone: 100 },
      { gold: 1000, wood: 400, stone: 200 },
      { gold: 2000, wood: 800, stone: 400 },
      { gold: 4000, wood: 1600, stone: 800 }
    ]
  },
  
  barracks: {
    type: 'barracks',
    name: 'Barracks',
    emoji: '🏰',
    sprite: 'Buildings/Blue/BlueBarracks.png',
    size: { width: 2, height: 2 },
    cost: { gold: 400, wood: 200, stone: 150 },
    buildTime: 30,
    hp: 800,
    power: 50,
    defense: 30,
    recruits: ['soldier', 'archer', 'knight'],
    maxCount: 3,
    requires: ['camp']
  },
  
  dock: {
    type: 'dock',
    name: 'Dock',
    emoji: '⚓',
    sprite: 'Buildings/Blue/BlueDock.png',
    size: { width: 3, height: 2 },
    cost: { gold: 600, wood: 400 },
    buildTime: 45,
    hp: 600,
    recruits: ['transport_ship', 'warship'],
    maxCount: 2,
    requires: ['camp']
  },
  
  smithy: {
    type: 'smithy',
    name: 'Smithy',
    emoji: '⚒️',
    sprite: 'Buildings/Blue/BlueSmith.png',
    size: { width: 2, height: 2 },
    cost: { gold: 500, wood: 150, stone: 200, iron: 100 },
    buildTime: 40,
    hp: 500,
    maxCount: 2,
    requires: ['camp', 'mine']
  },
  
  lumbermill: {
    type: 'lumbermill',
    name: 'Lumber Mill',
    emoji: '🪓',
    sprite: 'Buildings/Blue/BlueWoodHouse.png',
    size: { width: 2, height: 1 },
    cost: { gold: 200, wood: 100 },
    buildTime: 20,
    hp: 400,
    produces: { wood: 8 },
    productionRate: 60, // per minute
    maxStorage: 500,
    maxCount: 4
  },
  
  mine: {
    type: 'mine',
    name: 'Mine',
    emoji: '⛏️',
    sprite: 'Buildings/Blue/BlueMine.png',
    size: { width: 2, height: 1 },
    cost: { gold: 250, wood: 150 },
    buildTime: 25,
    hp: 500,
    produces: { stone: 5, iron: 3 },
    productionRate: 60,
    maxStorage: 500,
    maxCount: 3
  },
  
  farm: {
    type: 'farm',
    name: 'Farm',
    emoji: '🌾',
    sprite: 'Buildings/Blue/BlueFarm.png',
    size: { width: 2, height: 2 },
    cost: { gold: 150, wood: 80 },
    buildTime: 15,
    hp: 300,
    produces: { food: 10 },
    productionRate: 60,
    maxStorage: 500,
    maxCount: 5
  },
  
  warehouse: {
    type: 'warehouse',
    name: 'Warehouse',
    emoji: '📦',
    sprite: 'Buildings/Blue/BlueStorage.png',
    size: { width: 2, height: 2 },
    cost: { gold: 300, wood: 200, stone: 100 },
    buildTime: 25,
    hp: 600,
    maxCount: 2
  },
  
  tower: {
    type: 'tower',
    name: 'Watch Tower',
    emoji: '🗼',
    sprite: 'Buildings/Blue/BlueTower.png',
    size: { width: 1, height: 1 },
    cost: { gold: 300, stone: 200, iron: 50 },
    buildTime: 20,
    hp: 500,
    power: 30,
    defense: 50,
    maxCount: 8
  },
  
  wall: {
    type: 'wall',
    name: 'Wall',
    emoji: '🧱',
    sprite: 'Buildings/Blue/BlueWall.png',
    size: { width: 1, height: 1 },
    cost: { stone: 100, wood: 30 },
    buildTime: 10,
    hp: 400,
    defense: 25,
    maxCount: 50
  }
};

// === UNIT RECRUITMENT ===

export interface RecruitableUnit {
  id: string;
  name: string;
  sprite: string;
  cost: Partial<PlayerResources>;
  trainTime: number; // seconds
  population: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
  };
}

export const RECRUITABLE_UNITS: Record<string, RecruitableUnit> = {
  soldier: {
    id: 'soldier',
    name: 'Soldier',
    sprite: 'Troops/Blue/Blue_Troop_Idle.png',
    cost: { gold: 50, food: 20 },
    trainTime: 10,
    population: 1,
    stats: { hp: 100, attack: 12, defense: 8, speed: 80, range: 40 }
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    sprite: 'Troops/Blue/Blue_Archer_Idle.png',
    cost: { gold: 75, food: 15, wood: 10 },
    trainTime: 15,
    population: 1,
    stats: { hp: 60, attack: 18, defense: 4, speed: 90, range: 200 }
  },
  knight: {
    id: 'knight',
    name: 'Knight',
    sprite: 'Troops/Blue/Blue_Knight_Idle.png',
    cost: { gold: 150, food: 30, iron: 20 },
    trainTime: 25,
    population: 2,
    stats: { hp: 200, attack: 25, defense: 20, speed: 60, range: 50 }
  },
  transport_ship: {
    id: 'transport_ship',
    name: 'Transport Ship',
    sprite: 'Buildings/Blue/BlueShip.png',
    cost: { gold: 300, wood: 200 },
    trainTime: 45,
    population: 0,
    stats: { hp: 300, attack: 0, defense: 10, speed: 100, range: 0 }
  },
  warship: {
    id: 'warship',
    name: 'Warship',
    sprite: 'Buildings/Blue/BlueWarship.png',
    cost: { gold: 500, wood: 300, iron: 50 },
    trainTime: 60,
    population: 0,
    stats: { hp: 500, attack: 40, defense: 25, speed: 80, range: 300 }
  }
};

// === PLACED BUILDING ===

export interface PlacedBuilding {
  id: string;
  type: HomeIslandBuildingType;
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
  level: number;
  hp: number;
  maxHp: number;
  isConstructing: boolean;
  constructionProgress: number; // 0-1
  
  // Production
  storage: number;
  lastHarvestTime: number;
  
  // Training queue
  trainingQueue: { unitId: string; startTime: number; duration: number }[];
}

// === HOME ISLAND STATE ===

export interface HomeIslandState {
  resources: PlayerResources;
  inventory: InventoryItem[];
  buildings: PlacedBuilding[];
  workers: { id: string; assignedTo: string | null }[];
  
  // Stats
  totalPower: number;
  totalDefense: number;
  
  // Time tracking
  lastUpdateTime: number;
}

// === HOME ISLAND MANAGER ===

export class HomeIslandManager {
  private state: HomeIslandState;
  private gridSize: number = 32;
  private islandWidth: number = 40;  // Grid cells
  private islandHeight: number = 30; // Grid cells
  
  // Callbacks
  public onResourceChange: ((resources: PlayerResources) => void) | null = null;
  public onBuildingComplete: ((building: PlacedBuilding) => void) | null = null;
  public onUnitTrained: ((unitId: string, buildingId: string) => void) | null = null;
  
  constructor() {
    this.state = this.createDefaultState();
  }
  
  private createDefaultState(): HomeIslandState {
    return {
      resources: {
        gold: 1000,
        wood: 500,
        stone: 300,
        iron: 100,
        food: 200,
        crystal: 0,
        population: 0,
        maxPopulation: 20
      },
      inventory: [],
      buildings: [],
      workers: [],
      totalPower: 0,
      totalDefense: 0,
      lastUpdateTime: Date.now()
    };
  }
  
  // === INITIALIZATION ===
  
  async init(): Promise<void> {
    // Try to load saved state
    const savedGame = await saveSystem.loadGame();
    if (savedGame && savedGame.hero) {
      // Restore state from save
      // For now, use defaults with starting camp
    }
    
    // Place starting camp if no buildings
    if (this.state.buildings.length === 0) {
      this.placeStartingBuildings();
    }
    
    this.calculateStats();
  }
  
  private placeStartingBuildings(): void {
    // Place camp at center
    const centerX = Math.floor(this.islandWidth / 2);
    const centerY = Math.floor(this.islandHeight / 2);
    
    this.placeBuilding('camp', centerX - 1, centerY - 1, true);
    
    // Place starting farm
    this.placeBuilding('farm', centerX + 2, centerY - 1, true);
    
    // Place starting lumbermill
    this.placeBuilding('lumbermill', centerX - 4, centerY, true);
  }
  
  // === RESOURCE MANAGEMENT ===
  
  getResources(): PlayerResources {
    return { ...this.state.resources };
  }
  
  canAfford(cost: Partial<PlayerResources>): boolean {
    for (const [resource, amount] of Object.entries(cost)) {
      if ((this.state.resources[resource as keyof PlayerResources] || 0) < (amount || 0)) {
        return false;
      }
    }
    return true;
  }
  
  deductResources(cost: Partial<PlayerResources>): boolean {
    if (!this.canAfford(cost)) return false;
    
    for (const [resource, amount] of Object.entries(cost)) {
      (this.state.resources as any)[resource] -= amount || 0;
    }
    
    this.onResourceChange?.(this.state.resources);
    return true;
  }
  
  addResources(resources: Partial<PlayerResources>): void {
    for (const [resource, amount] of Object.entries(resources)) {
      (this.state.resources as any)[resource] = 
        ((this.state.resources as any)[resource] || 0) + (amount || 0);
    }
    
    this.onResourceChange?.(this.state.resources);
  }
  
  // === BUILDING MANAGEMENT ===
  
  canPlaceBuilding(type: HomeIslandBuildingType, gridX: number, gridY: number): boolean {
    const def = BUILDING_DEFINITIONS[type];
    
    // Check max count
    if (def.maxCount !== undefined) {
      const count = this.state.buildings.filter(b => b.type === type).length;
      if (count >= def.maxCount) return false;
    }
    
    // Check requirements
    if (def.requires) {
      for (const req of def.requires) {
        const hasReq = this.state.buildings.some(b => b.type === req && !b.isConstructing);
        if (!hasReq) return false;
      }
    }
    
    // Check cost
    if (!this.canAfford(def.cost)) return false;
    
    // Check grid bounds
    if (gridX < 0 || gridY < 0 || 
        gridX + def.size.width > this.islandWidth ||
        gridY + def.size.height > this.islandHeight) {
      return false;
    }
    
    // Check overlap with existing buildings
    for (const building of this.state.buildings) {
      const bDef = BUILDING_DEFINITIONS[building.type];
      const overlap = this.checkOverlap(
        gridX, gridY, def.size.width, def.size.height,
        building.gridX, building.gridY, bDef.size.width, bDef.size.height
      );
      if (overlap) return false;
    }
    
    return true;
  }
  
  private checkOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }
  
  placeBuilding(
    type: HomeIslandBuildingType, 
    gridX: number, 
    gridY: number,
    instant: boolean = false
  ): PlacedBuilding | null {
    if (!instant && !this.canPlaceBuilding(type, gridX, gridY)) {
      return null;
    }
    
    const def = BUILDING_DEFINITIONS[type];
    
    // Deduct cost
    if (!instant) {
      this.deductResources(def.cost);
    }
    
    const building: PlacedBuilding = {
      id: `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      gridX,
      gridY,
      worldX: (gridX + def.size.width / 2) * this.gridSize,
      worldY: (gridY + def.size.height / 2) * this.gridSize,
      level: 1,
      hp: instant ? def.hp : 0,
      maxHp: def.hp,
      isConstructing: !instant,
      constructionProgress: instant ? 1 : 0,
      storage: 0,
      lastHarvestTime: Date.now(),
      trainingQueue: []
    };
    
    this.state.buildings.push(building);
    this.calculateStats();
    
    return building;
  }
  
  removeBuilding(buildingId: string): boolean {
    const index = this.state.buildings.findIndex(b => b.id === buildingId);
    if (index === -1) return false;
    
    const building = this.state.buildings[index];
    
    // Can't remove camp
    if (building.type === 'camp') return false;
    
    // Return 50% of resources
    const def = BUILDING_DEFINITIONS[building.type];
    const refund: Partial<PlayerResources> = {};
    for (const [resource, amount] of Object.entries(def.cost)) {
      refund[resource as keyof PlayerResources] = Math.floor((amount || 0) * 0.5);
    }
    this.addResources(refund);
    
    this.state.buildings.splice(index, 1);
    this.calculateStats();
    
    return true;
  }
  
  upgradeBuilding(buildingId: string): boolean {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building) return false;
    
    const def = BUILDING_DEFINITIONS[building.type];
    if (!def.maxLevel || building.level >= def.maxLevel) return false;
    if (!def.upgradeCost) return false;
    
    const cost = def.upgradeCost[building.level - 1];
    if (!cost || !this.canAfford(cost)) return false;
    
    this.deductResources(cost);
    building.level++;
    building.maxHp = Math.floor(def.hp * (1 + building.level * 0.25));
    building.hp = building.maxHp;
    
    this.calculateStats();
    return true;
  }
  
  // === UNIT TRAINING ===
  
  canTrainUnit(buildingId: string, unitId: string): boolean {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building || building.isConstructing) return false;
    
    const def = BUILDING_DEFINITIONS[building.type];
    if (!def.recruits?.includes(unitId)) return false;
    
    const unit = RECRUITABLE_UNITS[unitId];
    if (!unit) return false;
    
    // Check cost
    if (!this.canAfford(unit.cost)) return false;
    
    // Check population
    if (this.state.resources.population + unit.population > this.state.resources.maxPopulation) {
      return false;
    }
    
    // Check queue size (max 5)
    if (building.trainingQueue.length >= 5) return false;
    
    return true;
  }
  
  trainUnit(buildingId: string, unitId: string): boolean {
    if (!this.canTrainUnit(buildingId, unitId)) return false;
    
    const building = this.state.buildings.find(b => b.id === buildingId)!;
    const unit = RECRUITABLE_UNITS[unitId];
    
    this.deductResources(unit.cost);
    
    building.trainingQueue.push({
      unitId,
      startTime: Date.now(),
      duration: unit.trainTime * 1000
    });
    
    return true;
  }
  
  cancelTraining(buildingId: string, queueIndex: number): boolean {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building || queueIndex >= building.trainingQueue.length) return false;
    
    const item = building.trainingQueue[queueIndex];
    const unit = RECRUITABLE_UNITS[item.unitId];
    
    // Refund 75% of cost
    const refund: Partial<PlayerResources> = {};
    for (const [resource, amount] of Object.entries(unit.cost)) {
      refund[resource as keyof PlayerResources] = Math.floor((amount || 0) * 0.75);
    }
    this.addResources(refund);
    
    building.trainingQueue.splice(queueIndex, 1);
    return true;
  }
  
  // === HARVESTING ===
  
  collectFromBuilding(buildingId: string): number {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building || building.isConstructing) return 0;
    
    const collected = building.storage;
    if (collected <= 0) return 0;
    
    const def = BUILDING_DEFINITIONS[building.type];
    if (def.produces) {
      for (const [resource, rate] of Object.entries(def.produces)) {
        const amount = Math.floor(collected * (rate || 0) / Object.values(def.produces).reduce((a, b) => (a || 0) + (b || 0), 0));
        (this.state.resources as any)[resource] += amount;
      }
    }
    
    building.storage = 0;
    this.onResourceChange?.(this.state.resources);
    
    return collected;
  }
  
  collectAll(): number {
    let totalCollected = 0;
    
    for (const building of this.state.buildings) {
      totalCollected += this.collectFromBuilding(building.id);
    }
    
    return totalCollected;
  }
  
  // === UPDATE LOOP ===
  
  update(deltaTime: number): void {
    const now = Date.now();
    
    for (const building of this.state.buildings) {
      // Update construction
      if (building.isConstructing) {
        const def = BUILDING_DEFINITIONS[building.type];
        building.constructionProgress += deltaTime / (def.buildTime * 1000);
        
        if (building.constructionProgress >= 1) {
          building.constructionProgress = 1;
          building.isConstructing = false;
          building.hp = building.maxHp;
          this.onBuildingComplete?.(building);
        }
        continue;
      }
      
      // Update production
      const def = BUILDING_DEFINITIONS[building.type];
      if (def.produces && def.productionRate && def.maxStorage) {
        const elapsed = (now - building.lastHarvestTime) / 60000; // minutes
        const produced = elapsed * def.productionRate / 60; // Normalize rate
        
        building.storage = Math.min(building.storage + produced, def.maxStorage);
        building.lastHarvestTime = now;
      }
      
      // Update training queue
      if (building.trainingQueue.length > 0) {
        const training = building.trainingQueue[0];
        if (now - training.startTime >= training.duration) {
          // Unit trained
          building.trainingQueue.shift();
          const unit = RECRUITABLE_UNITS[training.unitId];
          this.state.resources.population += unit.population;
          this.onUnitTrained?.(training.unitId, building.id);
        }
      }
    }
    
    this.state.lastUpdateTime = now;
  }
  
  // === STATS ===
  
  private calculateStats(): void {
    let power = 0;
    let defense = 0;
    
    for (const building of this.state.buildings) {
      if (building.isConstructing) continue;
      
      const def = BUILDING_DEFINITIONS[building.type];
      power += (def.power || 0) * building.level;
      defense += (def.defense || 0) * building.level;
    }
    
    this.state.totalPower = power;
    this.state.totalDefense = defense;
  }
  
  getStats(): { power: number; defense: number } {
    return {
      power: this.state.totalPower,
      defense: this.state.totalDefense
    };
  }
  
  // === PERSISTENCE ===
  
  async save(): Promise<boolean> {
    // Convert state to SavedGameState format
    const saveData: SavedGameState = {
      version: '0.1.0',
      timestamp: Date.now(),
      playTime: 0, // TODO: track
      hero: null, // TODO: hero data
      playerUnits: [],
      enemyUnits: [],
      playerGold: this.state.resources.gold,
      cameraPosition: { x: 0, y: 0 }
    };
    
    return saveSystem.saveGame(saveData);
  }
  
  // === GETTERS ===
  
  getBuildings(): PlacedBuilding[] {
    return [...this.state.buildings];
  }
  
  getBuilding(id: string): PlacedBuilding | undefined {
    return this.state.buildings.find(b => b.id === id);
  }
  
  getBuildingsByType(type: HomeIslandBuildingType): PlacedBuilding[] {
    return this.state.buildings.filter(b => b.type === type);
  }
  
  getInventory(): InventoryItem[] {
    return [...this.state.inventory];
  }
  
  getGridSize(): number {
    return this.gridSize;
  }
  
  getIslandDimensions(): { width: number; height: number } {
    return { width: this.islandWidth, height: this.islandHeight };
  }
}

// Singleton instance
export const homeIslandManager = new HomeIslandManager();
