// ============================================
// GAME SYSTEMS INTEGRATION
// Centralized wiring of all game subsystems
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { RaceId } from '../config/GameConfig.ts';
import { GAME_CONFIG } from '../config/GameConfig.ts';
import { getUnitDefinition } from '../config/UnitConfig.ts';
import { ISLAND_NODE_SPAWN } from '../config/ResourceConfig.ts';

// Systems
import { ProductionSystem, productionSystem, type ProductionCompleteEvent } from '../systems/ProductionSystem.ts';
import { MonsterSystem, monsterSystem, type MonsterKillEvent } from '../systems/MonsterSystem.ts';
import { WorkerSystem, workerSystem } from '../systems/WorkerSystem.ts';
import { CombatAI, combatAI } from '../systems/CombatAI.ts';
import { CollisionSystem, CollisionLayer, type EntityColliderType } from '../systems/CollisionSystem.ts';
import { AggroSystem, type AggroEntityType } from '../systems/AggroSystem.ts';
import { EffectsManager } from '../systems/EffectsManager.ts';

// === TYPES ===

export interface GameSystemsConfig {
  playerFaction: FactionId;
  playerRace: RaceId;
  campPosition: Position;
  campLevel: number;
}

export interface SpawnedUnit {
  id: string;
  unitId: string;
  position: Position;
  faction: FactionId;
  stats: {
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    attackRange: number;
    attackSpeed: number;
    moveSpeed: number;
  };
}

// === GAME SYSTEMS INTEGRATION ===

// Map unit category to collider type
function getColliderType(category: string): EntityColliderType {
  switch (category) {
    case 'melee': return 'unit';
    case 'ranged': return 'unit';
    case 'mounted': return 'unit';
    case 'siege': return 'tower';
    case 'worker': return 'unit';
    case 'hero': return 'hero';
    case 'monster': return 'enemy';
    default: return 'unit';
  }
}

// Map unit category to aggro entity type
function getAggroEntityType(category: string): AggroEntityType {
  switch (category) {
    case 'melee': return 'unit';
    case 'ranged': return 'unit';
    case 'mounted': return 'unit';
    case 'siege': return 'tower';
    case 'worker': return 'unit';
    case 'hero': return 'hero';
    case 'monster': return 'enemy';
    default: return 'unit';
  }
}

export class GameSystemsIntegration {
  private isInitialized: boolean = false;
  
  // System references
  public production: ProductionSystem = productionSystem;
  public monsters: MonsterSystem = monsterSystem;
  public workers: WorkerSystem = workerSystem;
  public combat: CombatAI = combatAI;
  
  // External system references (set by GameEngine)
  private collisionSystem: CollisionSystem | null = null;
  private aggroSystem: AggroSystem | null = null;
  private effectsManager: EffectsManager | null = null;
  
  // Spawned entities tracking
  private spawnedUnits: Map<string, SpawnedUnit> = new Map();
  private nextUnitId: number = 0;
  
  // Callbacks to GameEngine
  public onUnitSpawned: ((unit: SpawnedUnit) => void) | null = null;
  public onUnitKilled: ((unitId: string) => void) | null = null;
  public onGoldChanged: ((gold: number) => void) | null = null;
  public onResourcesChanged: (() => void) | null = null;
  public onHeroRecruited: ((heroClass: string, position: Position) => void) | null = null;
  
  constructor() {}
  
  // === INITIALIZATION ===
  
  /**
   * Initialize all game systems with configuration
   */
  init(config: GameSystemsConfig): void {
    if (this.isInitialized) {
      console.warn('[GameSystems] Already initialized');
      return;
    }
    
    // Configure production system
    this.production.setPlayerRace(config.playerRace);
    this.production.setCampLevel(config.campLevel);
    this.production.setGold(500); // Starting gold
    
    // Configure worker system
    this.workers.setCampPosition(config.campPosition);
    this.workers.setCampLevel(config.campLevel);
    
    // Wire up callbacks
    this.wireProductionCallbacks();
    this.wireMonsterCallbacks();
    this.wireCombatCallbacks();
    
    this.isInitialized = true;
    console.log('[GameSystems] Initialized');
  }
  
  /**
   * Set external system references
   */
  setExternalSystems(
    collision: CollisionSystem,
    aggro: AggroSystem,
    effects: EffectsManager
  ): void {
    this.collisionSystem = collision;
    this.aggroSystem = aggro;
    this.effectsManager = effects;
  }
  
  // === CALLBACK WIRING ===
  
  private wireProductionCallbacks(): void {
    // When production completes, spawn the unit/hero or apply upgrade
    this.production.onProductionComplete = (event: ProductionCompleteEvent) => {
      this.handleProductionComplete(event);
    };
    
    // Forward gold changes
    this.production.onGoldChanged = (gold: number) => {
      this.onGoldChanged?.(gold);
    };
  }
  
  private wireMonsterCallbacks(): void {
    // When monster is killed, award loot
    this.monsters.onMonsterKilled = (event: MonsterKillEvent) => {
      this.handleMonsterKill(event);
    };
    
    // When monster attacks, deal damage to player unit
    this.monsters.onMonsterAttack = (monsterId: string, targetId: string, damage: number) => {
      this.handleMonsterAttack(monsterId, targetId, damage);
    };
  }
  
  private wireCombatCallbacks(): void {
    // When combat AI deals damage
    this.combat.onDamageDealt = (event) => {
      // Spawn hit effect
      const target = this.combat.getUnit(event.targetId);
      if (target && this.effectsManager) {
        this.effectsManager.spawnHit(target.position, event.damageType === 'magic');
      }
    };
    
    // When unit is killed
    this.combat.onUnitKilled = (unitId: string, killerId: string) => {
      console.log(`[Combat] Unit ${unitId} killed by ${killerId}`);
      this.handleUnitKilled(unitId);
    };
  }
  
  // === PRODUCTION HANDLING ===
  
  private handleProductionComplete(event: ProductionCompleteEvent): void {
    console.log(`[GameSystems] Production complete: ${event.type} - ${event.itemId}`);
    
    switch (event.type) {
      case 'unit':
        this.spawnTrainedUnit(event.itemId, event.position, event.owner);
        break;
        
      case 'hero':
        this.onHeroRecruited?.(event.itemId, event.position);
        break;
        
      case 'upgrade':
        // Upgrades are tracked in ProductionSystem
        console.log(`[GameSystems] Upgrade ${event.itemId} researched`);
        break;
    }
  }
  
  private spawnTrainedUnit(unitId: string, position: Position, faction: FactionId): void {
    const def = getUnitDefinition(unitId);
    if (!def) {
      console.warn(`[GameSystems] Unknown unit: ${unitId}`);
      return;
    }
    
    const id = `unit_${this.nextUnitId++}`;
    
    const unit: SpawnedUnit = {
      id,
      unitId,
      position: { ...position },
      faction,
      stats: {
        health: def.stats.health,
        maxHealth: def.stats.maxHealth,
        attack: def.stats.attack,
        defense: def.stats.defense,
        attackRange: def.stats.attackRange,
        attackSpeed: def.stats.attackSpeed,
        moveSpeed: def.stats.speed,
      }
    };
    
    this.spawnedUnits.set(id, unit);
    
    // Register with combat AI
    this.combat.registerUnit({
      id,
      faction,
      position: unit.position,
      health: unit.stats.health,
      maxHealth: unit.stats.maxHealth,
      attack: unit.stats.attack,
      defense: unit.stats.defense,
      attackRange: unit.stats.attackRange,
      attackSpeed: unit.stats.attackSpeed,
      moveSpeed: unit.stats.moveSpeed,
      isRanged: def.stats.attackRange > GAME_CONFIG.ATTACK_RANGE_MELEE,
    });
    
    // Register with collision system
    if (this.collisionSystem) {
      this.collisionSystem.addCircleCollider(
        id,
        unit.position,
        GAME_CONFIG.UNIT_COLLISION_RADIUS,
        CollisionLayer.Unit,
        getColliderType(def.category),
        faction
      );
    }
    
    // Register with aggro system
    if (this.aggroSystem) {
      this.aggroSystem.registerEntity({
        id,
        type: getAggroEntityType(def.category),
        position: unit.position,
        faction,
        health: unit.stats.health,
        maxHealth: unit.stats.maxHealth,
        attackDamage: unit.stats.attack,
        attackRange: unit.stats.attackRange,
        aggroRange: def.stats.aggroRange,
        behavior: 'aggressive'
      });
    }
    
    // Fire callback
    this.onUnitSpawned?.(unit);
    
    console.log(`[GameSystems] Spawned ${def.name} at`, position);
  }
  
  // === MONSTER HANDLING ===
  
  private handleMonsterKill(event: MonsterKillEvent): void {
    // Award gold
    this.production.modifyGold(event.loot.gold);
    
    // Award XP to killer (if it's a hero)
    // This would need hero reference - handled by GameEngine
    
    // Spawn loot effect
    if (this.effectsManager) {
      this.effectsManager.spawnExplosion(event.position, 'magic', 0.5);
    }
    
    console.log(`[GameSystems] Monster killed! +${event.loot.gold}g, +${event.loot.xp}xp`);
  }
  
  private handleMonsterAttack(_monsterId: string, targetId: string, damage: number): void {
    // Try combat AI first
    this.combat.damageUnit(targetId, damage, _monsterId);
    
    // Aggro system handles damage internally via attack events
  }
  
  private handleUnitKilled(unitId: string): void {
    // Remove from tracking
    this.spawnedUnits.delete(unitId);
    
    // Remove from collision
    this.collisionSystem?.removeCollider(unitId);
    
    // Fire callback
    this.onUnitKilled?.(unitId);
  }
  
  // === ISLAND SETUP ===
  
  /**
   * Setup resource nodes and monsters for an island
   */
  setupIsland(
    islandId: string,
    bounds: { x: number; y: number; width: number; height: number },
    isPlayerIsland: boolean,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): void {
    // Get node counts from config based on size
    const nodeKey = size.toUpperCase() as 'SMALL' | 'MEDIUM' | 'LARGE';
    const nodeCounts = ISLAND_NODE_SPAWN[nodeKey];
    
    // Spawn resource nodes
    this.workers.spawnIslandNodes(bounds, nodeCounts as { bushes: number; rocks: number; trees: number; sheep: number });
    
    // Spawn monsters on non-player islands
    if (!isPlayerIsland) {
      const center = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
      };
      const radius = Math.min(bounds.width, bounds.height) / 2;
      
      this.monsters.spawnForIsland({
        islandId,
        islandCenter: center,
        islandRadius: radius,
        tier: size
      });
    }
    
    console.log(`[GameSystems] Setup island ${islandId} (${size}, player: ${isPlayerIsland})`);
  }
  
  /**
   * Setup starting workers
   */
  setupStartingWorkers(count: number = 2): void {
    for (let i = 0; i < count; i++) {
      this.workers.spawnWorker();
    }
    console.log(`[GameSystems] Spawned ${count} starting workers`);
  }
  
  // === BUILDING REGISTRATION ===
  
  /**
   * Register a building with production system
   */
  registerBuilding(
    buildingId: string,
    buildingType: 'camp' | 'barracks' | 'archery' | 'temple' | 'tower' | 'wall' | 'dock',
    position: Position,
    owner: FactionId = 1 as FactionId
  ): void {
    this.production.registerBuilding(
      buildingId,
      buildingType,
      owner,
      position,
      1,
      false
    );
    
    // If it's the camp, update worker system
    if (buildingType === 'camp' && owner === 1) {
      this.workers.setCampPosition(position);
    }
  }
  
  // === UPDATE ===
  
  /**
   * Update all systems (call each frame)
   */
  update(deltaTime: number, playerUnits: Map<string, { position: Position; health: number }>): void {
    // Update production queues
    this.production.update(deltaTime);
    
    // Update worker harvesting
    this.workers.update(deltaTime);
    
    // Update monster AI
    this.monsters.updatePlayerUnits(playerUnits);
    this.monsters.update(deltaTime);
    
    // Update combat AI
    this.combat.update(deltaTime);
    
    // Sync combat unit positions with spawned units
    for (const unit of this.spawnedUnits.values()) {
      const combatUnit = this.combat.getUnit(unit.id);
      if (combatUnit) {
        unit.position = combatUnit.position;
        unit.stats.health = combatUnit.health;
      }
    }
  }
  
  // === QUERIES ===
  
  getGold(): number {
    return this.production.getGold();
  }
  
  getResources() {
    return this.workers.getResources();
  }
  
  getWorkerCount(): number {
    return this.workers.getWorkerCount();
  }
  
  getMaxWorkers(): number {
    return this.workers.getMaxWorkers();
  }
  
  getHeroLimit(): { current: number; max: number } {
    return this.production.getHeroLimitInfo();
  }
  
  getSpawnedUnits(): SpawnedUnit[] {
    return Array.from(this.spawnedUnits.values());
  }
  
  getAllMonsters() {
    return this.monsters.getAllMonsters();
  }
  
  getAllWorkers() {
    return this.workers.getWorkers();
  }
  
  getAllResourceNodes() {
    return this.workers.getNodes();
  }
  
  // === COMMANDS ===
  
  /**
   * Train a unit at a building
   */
  trainUnit(buildingId: string, unitId: string): boolean {
    return this.production.queueUnit(buildingId, unitId);
  }
  
  /**
   * Research an upgrade at a building
   */
  researchUpgrade(buildingId: string, upgradeId: string): boolean {
    return this.production.queueUpgrade(buildingId, upgradeId);
  }
  
  /**
   * Recruit a hero at the camp
   */
  recruitHero(buildingId: string, heroClass: string): boolean {
    return this.production.queueHero(buildingId, heroClass);
  }
  
  /**
   * Spawn a new worker
   */
  spawnWorker(): boolean {
    const worker = this.workers.spawnWorker();
    return worker !== null;
  }
  
  /**
   * Damage a monster (from player attack)
   */
  attackMonster(monsterId: string, damage: number, attackerId: string): boolean {
    return this.monsters.damageMonster(monsterId, damage, attackerId);
  }
}

// Singleton
export const gameSystems = new GameSystemsIntegration();
