// ============================================
// PRODUCTION SYSTEM
// Handles building production queues: unit training,
// upgrade research, and hero recruitment
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { BuildingTypeId, RaceId, UpgradeDefinition } from '../config/GameConfig.ts';
import { getHeroLimit } from '../config/GameConfig.ts';
import { 
  UPGRADE_DEFINITIONS,
  getBuildingDefinition,
  getAvailableUpgrades,
  canBuildUnit 
} from '../config/BuildingConfig.ts';
import { getUnitDefinition, type UnitDefinition } from '../config/UnitConfig.ts';

// === TYPES ===

export type ProductionType = 'unit' | 'upgrade' | 'hero';

export interface ProductionItem {
  id: string;
  type: ProductionType;
  itemId: string;           // Unit ID, upgrade ID, or hero class
  buildingId: string;
  startTime: number;        // Game time when started
  duration: number;         // Total time in seconds
  progress: number;         // 0-100%
  cost: number;
  canceled: boolean;
}

export interface BuildingProduction {
  buildingId: string;
  buildingType: BuildingTypeId;
  owner: FactionId;
  position: Position;
  level: number;
  queue: ProductionItem[];
  completedUpgrades: Set<string>;
  isConstructing: boolean;
  constructionProgress: number;
}

export interface ProductionCompleteEvent {
  type: ProductionType;
  itemId: string;
  buildingId: string;
  position: Position;
  owner: FactionId;
}

// === PRODUCTION SYSTEM ===

export class ProductionSystem {
  private buildings: Map<string, BuildingProduction> = new Map();
  private nextItemId: number = 0;
  private gameTime: number = 0;
  
  // Global state
  private playerGold: number = 500;
  private playerRace: RaceId = 'human';
  private playerHeroCount: number = 0;
  private campLevel: number = 1;
  
  // Callbacks
  public onProductionComplete: ((event: ProductionCompleteEvent) => void) | null = null;
  public onGoldChanged: ((gold: number) => void) | null = null;
  public onQueueChanged: ((buildingId: string) => void) | null = null;
  
  constructor() {}
  
  // === INITIALIZATION ===
  
  /**
   * Set player race (affects available units)
   */
  setPlayerRace(race: RaceId): void {
    this.playerRace = race;
  }
  
  /**
   * Set current hero count
   */
  setHeroCount(count: number): void {
    this.playerHeroCount = count;
  }
  
  /**
   * Set camp level (affects max heroes)
   */
  setCampLevel(level: number): void {
    this.campLevel = level;
  }
  
  /**
   * Set player gold
   */
  setGold(gold: number): void {
    this.playerGold = gold;
    this.onGoldChanged?.(gold);
  }
  
  /**
   * Get player gold
   */
  getGold(): number {
    return this.playerGold;
  }
  
  /**
   * Add/remove gold
   */
  modifyGold(amount: number): boolean {
    if (this.playerGold + amount < 0) return false;
    this.playerGold += amount;
    this.onGoldChanged?.(this.playerGold);
    return true;
  }
  
  // === BUILDING MANAGEMENT ===
  
  /**
   * Register a building with the production system
   */
  registerBuilding(
    buildingId: string,
    buildingType: BuildingTypeId,
    owner: FactionId,
    position: Position,
    level: number = 1,
    isConstructing: boolean = false
  ): void {
    this.buildings.set(buildingId, {
      buildingId,
      buildingType,
      owner,
      position,
      level,
      queue: [],
      completedUpgrades: new Set(),
      isConstructing,
      constructionProgress: isConstructing ? 0 : 100
    });
  }
  
  /**
   * Remove a building
   */
  removeBuilding(buildingId: string): void {
    this.buildings.delete(buildingId);
  }
  
  /**
   * Update building level
   */
  setBuildingLevel(buildingId: string, level: number): void {
    const building = this.buildings.get(buildingId);
    if (building) {
      building.level = level;
      
      // Update camp level if this is the camp
      if (building.buildingType === 'camp' && building.owner === 1) {
        this.campLevel = level;
      }
    }
  }
  
  /**
   * Complete building construction
   */
  completeConstruction(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (building) {
      building.isConstructing = false;
      building.constructionProgress = 100;
    }
  }
  
  /**
   * Get building production state
   */
  getBuilding(buildingId: string): BuildingProduction | undefined {
    return this.buildings.get(buildingId);
  }
  
  // === QUEUE MANAGEMENT ===
  
  /**
   * Queue a unit for training
   */
  queueUnit(buildingId: string, unitId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    if (building.isConstructing) return false;
    
    const def = getBuildingDefinition(building.buildingType);
    if (!def) return false;
    
    // Check queue capacity
    if (building.queue.length >= def.maxProductionQueue) {
      console.log(`[Production] Queue full for ${buildingId}`);
      return false;
    }
    
    // Check if building can produce this unit
    if (!canBuildUnit(building.buildingType, unitId, this.playerRace)) {
      console.log(`[Production] Building ${building.buildingType} cannot produce ${unitId}`);
      return false;
    }
    
    // Get unit definition
    const unit = getUnitDefinition(unitId);
    if (!unit) return false;
    
    // Check cost
    if (this.playerGold < unit.cost) {
      console.log(`[Production] Not enough gold for ${unitId}`);
      return false;
    }
    
    // Deduct cost
    this.modifyGold(-unit.cost);
    
    // Add to queue
    const item: ProductionItem = {
      id: `prod_${this.nextItemId++}`,
      type: 'unit',
      itemId: unitId,
      buildingId,
      startTime: building.queue.length === 0 ? this.gameTime : -1,
      duration: unit.trainTime,
      progress: 0,
      cost: unit.cost,
      canceled: false
    };
    
    building.queue.push(item);
    this.onQueueChanged?.(buildingId);
    
    console.log(`[Production] Queued ${unitId} at ${building.buildingType}`);
    return true;
  }
  
  /**
   * Queue a hero for recruitment
   */
  queueHero(buildingId: string, heroClass: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    if (building.buildingType !== 'camp') return false;
    if (building.isConstructing) return false;
    
    // Check hero limit
    const maxHeroes = getHeroLimit(this.campLevel);
    if (this.playerHeroCount >= maxHeroes) {
      console.log(`[Production] Hero limit reached (${this.playerHeroCount}/${maxHeroes})`);
      return false;
    }
    
    // Check queue
    const def = getBuildingDefinition('camp');
    if (building.queue.length >= def.maxProductionQueue) {
      return false;
    }
    
    // Hero recruitment cost (scales with count)
    const heroCost = 200 + this.playerHeroCount * 100;
    if (this.playerGold < heroCost) {
      console.log(`[Production] Not enough gold for hero (${heroCost})`);
      return false;
    }
    
    this.modifyGold(-heroCost);
    
    const item: ProductionItem = {
      id: `prod_${this.nextItemId++}`,
      type: 'hero',
      itemId: heroClass,
      buildingId,
      startTime: building.queue.length === 0 ? this.gameTime : -1,
      duration: 30, // 30 seconds for hero
      progress: 0,
      cost: heroCost,
      canceled: false
    };
    
    building.queue.push(item);
    this.onQueueChanged?.(buildingId);
    
    console.log(`[Production] Queued hero ${heroClass}`);
    return true;
  }
  
  /**
   * Queue an upgrade for research
   */
  queueUpgrade(buildingId: string, upgradeId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    if (building.isConstructing) return false;
    
    // Check if upgrade is available at this building level
    const availableUpgrades = getAvailableUpgrades(building.buildingType, building.level);
    if (!availableUpgrades.includes(upgradeId)) {
      console.log(`[Production] Upgrade ${upgradeId} not available at level ${building.level}`);
      return false;
    }
    
    // Check if already researched
    if (building.completedUpgrades.has(upgradeId)) {
      console.log(`[Production] Upgrade ${upgradeId} already researched`);
      return false;
    }
    
    // Check if already in queue
    if (building.queue.some(q => q.itemId === upgradeId)) {
      console.log(`[Production] Upgrade ${upgradeId} already in queue`);
      return false;
    }
    
    // Get upgrade definition
    const upgrade = UPGRADE_DEFINITIONS[upgradeId];
    if (!upgrade) return false;
    
    // Check prerequisites
    if (upgrade.requires) {
      for (const req of upgrade.requires) {
        if (!building.completedUpgrades.has(req)) {
          console.log(`[Production] Missing prerequisite: ${req}`);
          return false;
        }
      }
    }
    
    // Check cost
    if (this.playerGold < upgrade.cost) {
      console.log(`[Production] Not enough gold for upgrade ${upgradeId}`);
      return false;
    }
    
    this.modifyGold(-upgrade.cost);
    
    const item: ProductionItem = {
      id: `prod_${this.nextItemId++}`,
      type: 'upgrade',
      itemId: upgradeId,
      buildingId,
      startTime: building.queue.length === 0 ? this.gameTime : -1,
      duration: upgrade.researchTime,
      progress: 0,
      cost: upgrade.cost,
      canceled: false
    };
    
    building.queue.push(item);
    this.onQueueChanged?.(buildingId);
    
    console.log(`[Production] Queued upgrade ${upgradeId}`);
    return true;
  }
  
  /**
   * Cancel a queued item
   */
  cancelItem(buildingId: string, itemId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    
    const itemIndex = building.queue.findIndex(q => q.id === itemId);
    if (itemIndex === -1) return false;
    
    const item = building.queue[itemIndex];
    
    // Refund partial cost based on progress
    const refund = Math.floor(item.cost * (1 - item.progress / 100) * 0.75);
    this.modifyGold(refund);
    
    // Remove from queue
    building.queue.splice(itemIndex, 1);
    
    // Start next item if this was first
    if (itemIndex === 0 && building.queue.length > 0) {
      building.queue[0].startTime = this.gameTime;
    }
    
    this.onQueueChanged?.(buildingId);
    
    console.log(`[Production] Canceled ${item.itemId}, refunded ${refund} gold`);
    return true;
  }
  
  // === UPDATE ===
  
  /**
   * Update production progress (call each frame)
   */
  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    for (const building of this.buildings.values()) {
      // Skip if constructing
      if (building.isConstructing) {
        continue;
      }
      
      // Process queue
      if (building.queue.length === 0) continue;
      
      const current = building.queue[0];
      if (current.canceled) {
        building.queue.shift();
        continue;
      }
      
      // Set start time if not set
      if (current.startTime < 0) {
        current.startTime = this.gameTime;
      }
      
      // Calculate progress
      const elapsed = this.gameTime - current.startTime;
      current.progress = Math.min(100, (elapsed / current.duration) * 100);
      
      // Check completion
      if (current.progress >= 100) {
        this.completeItem(building, current);
        building.queue.shift();
        
        // Start next item
        if (building.queue.length > 0) {
          building.queue[0].startTime = this.gameTime;
        }
      }
    }
  }
  
  /**
   * Complete a production item
   */
  private completeItem(building: BuildingProduction, item: ProductionItem): void {
    console.log(`[Production] Completed ${item.type}: ${item.itemId}`);
    
    if (item.type === 'upgrade') {
      building.completedUpgrades.add(item.itemId);
    }
    
    if (item.type === 'hero') {
      this.playerHeroCount++;
    }
    
    // Fire callback
    this.onProductionComplete?.({
      type: item.type,
      itemId: item.itemId,
      buildingId: building.buildingId,
      position: building.position,
      owner: building.owner
    });
    
    this.onQueueChanged?.(building.buildingId);
  }
  
  // === QUERIES ===
  
  /**
   * Get available units for a building
   */
  getAvailableUnits(buildingId: string): UnitDefinition[] {
    const building = this.buildings.get(buildingId);
    if (!building) return [];
    
    const def = getBuildingDefinition(building.buildingType);
    if (!def) return [];
    
    return def.producesUnits
      .map(id => getUnitDefinition(id))
      .filter((u): u is UnitDefinition => {
        if (!u) return false;
        return canBuildUnit(building.buildingType, u.id, this.playerRace);
      });
  }
  
  /**
   * Get available upgrades for a building
   */
  getAvailableUpgradesForBuilding(buildingId: string): UpgradeDefinition[] {
    const building = this.buildings.get(buildingId);
    if (!building) return [];
    
    const upgradeIds = getAvailableUpgrades(building.buildingType, building.level);
    
    return upgradeIds
      .filter(id => !building.completedUpgrades.has(id))
      .map(id => UPGRADE_DEFINITIONS[id])
      .filter((u): u is UpgradeDefinition => !!u);
  }
  
  /**
   * Check if an upgrade is researched
   */
  hasUpgrade(buildingId: string, upgradeId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    return building.completedUpgrades.has(upgradeId);
  }
  
  /**
   * Get all completed upgrades for a building type
   */
  getCompletedUpgrades(buildingType: BuildingTypeId): string[] {
    const completed: string[] = [];
    
    for (const building of this.buildings.values()) {
      if (building.buildingType === buildingType) {
        completed.push(...building.completedUpgrades);
      }
    }
    
    return [...new Set(completed)];
  }
  
  /**
   * Get current production queue for a building
   */
  getQueue(buildingId: string): ProductionItem[] {
    const building = this.buildings.get(buildingId);
    return building?.queue || [];
  }
  
  /**
   * Check if building can recruit hero
   */
  canRecruitHero(buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    if (building.buildingType !== 'camp') return false;
    if (building.isConstructing) return false;
    
    const maxHeroes = getHeroLimit(this.campLevel);
    return this.playerHeroCount < maxHeroes;
  }
  
  /**
   * Get hero limit info
   */
  getHeroLimitInfo(): { current: number; max: number } {
    return {
      current: this.playerHeroCount,
      max: getHeroLimit(this.campLevel)
    };
  }
  
  // === RENDERING HELPERS ===
  
  /**
   * Get production progress bar data for UI
   */
  getProgressForBuilding(buildingId: string): { 
    itemName: string; 
    progress: number; 
    queueLength: number;
    type: ProductionType;
  } | null {
    const building = this.buildings.get(buildingId);
    if (!building || building.queue.length === 0) return null;
    
    const current = building.queue[0];
    
    let itemName = current.itemId;
    if (current.type === 'unit') {
      const unit = getUnitDefinition(current.itemId);
      itemName = unit?.name || current.itemId;
    } else if (current.type === 'upgrade') {
      const upgrade = UPGRADE_DEFINITIONS[current.itemId];
      itemName = upgrade?.name || current.itemId;
    }
    
    return {
      itemName,
      progress: current.progress,
      queueLength: building.queue.length,
      type: current.type
    };
  }
}

// Singleton instance
export const productionSystem = new ProductionSystem();
