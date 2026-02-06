// ============================================
// GAME ENGINE
// Main game loop, state management, and coordination
// ============================================

import type { GamePhase, FactionId, Position } from '../../types/index.ts';
import type { BuildingType, TowerType } from '../../types/world.ts';
import { TOWER_DEFINITIONS, getTowerUpgradeCost } from '../../types/world.ts';
import { GridSystem, EntitySystem, GRID_SIZE, GAME_SPEED_MULTIPLIER, generateId } from './GridSystem.ts';
import { spriteManager } from '../rendering/SpriteManager.ts';
import { Renderer } from '../rendering/Renderer.ts';
import { TerrainRenderer } from '../rendering/TerrainRenderer.ts';
import { WorldGenerator, WORLD_CONFIG } from '../world/WorldGenerator.ts';
import { BoatManager } from '../entities/Boat.ts';
import { BuildingManager } from '../entities/Building.ts';
import { TowerManager } from '../entities/TowerSystem.ts';
import { TowerUI } from '../../ui/TowerUI.ts';
import { getAllUnitTypes } from '../../data/unitTypes.ts';
import { sceneManager, HeroCreationData } from './SceneManager.ts';
import { Hero } from '../entities/Hero.ts';
import { UnitMovementSystem } from '../systems/UnitMovement.ts';
import { AIController } from '../systems/AIController.ts';
import { InputManager } from './InputManager.ts';

// New combat and collision systems
import {
  CollisionSystem,
  CollisionLayer,
  AggroSystem,
  EffectsManager,
  PathfindingSystem
} from '../systems/index.ts';

export class GameEngine {
  // Core systems
  private locationGrid!: GridSystem;
  private destinationGrid!: GridSystem;
  private entitySystem!: EntitySystem;
  private renderer!: Renderer;
  private worldGenerator!: WorldGenerator;
  private terrainRenderer!: TerrainRenderer;
  private boatManager!: BoatManager;
  private buildingManager!: BuildingManager;
  private towerManager!: TowerManager;
  private towerUI!: TowerUI;
  
  // Movement and AI systems
  private movementSystem!: UnitMovementSystem;
  private aiController!: AIController;
  private inputManager!: InputManager;
  
  // Combat and collision systems
  private collisionSystem!: CollisionSystem;
  private aggroSystem!: AggroSystem;
  private effectsManager!: EffectsManager;
  private pathfindingSystem!: PathfindingSystem;
  
  // Debug flags
  private debugCollision: boolean = false;
  private debugAggro: boolean = false;
  
  // Player resources
  private playerGold: number = 500;
  
  // Player hero
  private playerHero: Hero | null = null;
  
  // Canvas elements
  private bgCanvas!: HTMLCanvasElement;
  private fgCanvas!: HTMLCanvasElement;
  private uiCanvas!: HTMLCanvasElement;
  
  // Game state
  private gamePhase: GamePhase = 'menu';
  private gameTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  private fpsFrameCount: number = 0;
  
  // Animation frame handle
  private animationFrameId: number = 0;
  private isRunning: boolean = false;
  
  // UI Elements
  private loadingProgress!: HTMLElement;
  private loadingText!: HTMLElement;
  private fpsCounter!: HTMLElement;
  private unitCountEl!: HTMLElement;
  private playerNodesEl!: HTMLElement;
  private enemyNodesEl!: HTMLElement;
  private goldCountEl!: HTMLElement;
  
  constructor() {
    // Constructor intentionally empty - init() does the work
  }
  
  /**
   * Initialize the game engine
   */
  async init(): Promise<void> {
    console.log('Grudge Islands RTS - Initializing...');
    
    // Get UI elements
    this.loadingProgress = document.getElementById('loadingProgress')!;
    this.loadingText = document.getElementById('loadingText')!;
    this.fpsCounter = document.getElementById('fpsCounter')!;
    this.unitCountEl = document.getElementById('unitCount')!;
    this.playerNodesEl = document.getElementById('playerNodes')!;
    this.enemyNodesEl = document.getElementById('enemyNodes')!;
    this.goldCountEl = document.getElementById('goldCount')!;
    
    // Get canvas elements
    this.bgCanvas = document.getElementById('bgCanvas') as HTMLCanvasElement;
    this.fgCanvas = document.getElementById('fgCanvas') as HTMLCanvasElement;
    this.uiCanvas = document.getElementById('uiCanvas') as HTMLCanvasElement;
    
    // Setup canvas sizes
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());
    
    // Generate world
    this.updateLoadingState('Generating island world...', 10);
    this.worldGenerator = new WorldGenerator();
    this.worldGenerator.generate();
    
    // Initialize grid systems with world size
    this.updateLoadingState('Initializing game systems...', 15);
    this.locationGrid = new GridSystem(WORLD_CONFIG.width, WORLD_CONFIG.height, GRID_SIZE);
    this.destinationGrid = new GridSystem(WORLD_CONFIG.width, WORLD_CONFIG.height, GRID_SIZE);
    this.entitySystem = new EntitySystem(this.locationGrid, this.destinationGrid);
    
    // Initialize terrain renderer
    this.terrainRenderer = new TerrainRenderer(this.worldGenerator);
    
    // Initialize game entity managers
    this.boatManager = new BoatManager();
    this.buildingManager = new BuildingManager();
    this.towerManager = new TowerManager();
    this.towerUI = new TowerUI();
    
    // Initialize movement and AI systems
    this.movementSystem = new UnitMovementSystem();
    this.aiController = new AIController();
    
    // Setup walkability check for movement system
    this.movementSystem.setWalkableCallback((x, y) => this.worldGenerator.isWalkable(x, y));
    
    // Connect AI to movement system
    this.aiController.setMovementSystem(this.movementSystem);
    
    // Setup AI attack callback
    this.aiController.onAttack = (attackerId, targetId, damage) => {
      console.log(`AI ${attackerId} attacks ${targetId} for ${damage} damage`);
      // TODO: Apply damage to target entity
    };
    
    // Initialize collision and combat systems
    this.updateLoadingState('Initializing combat systems...', 18);
    this.collisionSystem = new CollisionSystem(32);
    this.aggroSystem = new AggroSystem(this.collisionSystem);
    this.effectsManager = new EffectsManager();
    this.pathfindingSystem = new PathfindingSystem({ gridCellSize: 32 });
    this.pathfindingSystem.setCollisionSystem(this.collisionSystem);
    
    // Wire up aggro system attack events to effects manager
    this.aggroSystem.onAttack = (event) => {
      if (event.isRanged && event.projectileType) {
        // Spawn projectile visual
        const attackerEntity = this.aggroSystem.getEntity(event.attackerId);
        if (attackerEntity) {
          this.effectsManager.spawnProjectile({
            sourceId: event.attackerId,
            targetId: event.targetId,
            sourcePosition: attackerEntity.position,
            targetPosition: event.position,
            damage: event.damage,
            style: event.projectileType as any,
            isHoming: true
          });
        }
      } else {
        // Melee hit effect
        this.effectsManager.spawnHit(event.position, false, 0.5);
      }
    };
    
    // Wire up death events
    this.aggroSystem.onEntityDeath = (entity, killer) => {
      console.log(`Entity ${entity.id} killed by ${killer?.id ?? 'unknown'}`);
      // Spawn death effect
      this.effectsManager.spawnExplosion(entity.position, 'blood', 0.6);
      // Remove collider
      this.collisionSystem.removeCollider(entity.id);
    };
    
    // Setup tower callbacks
    this.towerUI.onUpgrade = (towerId) => this.handleTowerUpgrade(towerId);
    this.towerUI.onSell = (towerId) => this.handleTowerSell(towerId);
    
    // Initialize renderer
    this.updateLoadingState('Setting up renderer...', 20);
    this.renderer = new Renderer(
      this.bgCanvas,
      this.fgCanvas,
      this.uiCanvas,
      this.locationGrid,
      this.entitySystem
    );
    
    // Load sprites
    await this.loadSprites();
    
    // Setup input handlers
    this.updateLoadingState('Setting up controls...', 95);
    this.setupInputHandlers();
    
    // Initialize input manager for advanced camera controls
    this.inputManager = new InputManager(this.fgCanvas);
    
    // Connect input manager to renderer camera
    this.inputManager.onCameraMove = (x: number, y: number) => {
      this.renderer.setCameraPosition(x, y);
    };
    
    this.inputManager.onCameraZoom = (zoom: number, _centerX: number, _centerY: number) => {
      this.renderer.setZoom(zoom);
    };
    
    this.inputManager.onSelectionEnd = (screenX: number, screenY: number) => {
      // Forward to renderer selection system
      this.renderer.endSelection(screenX, screenY);
    };
    
    // Complete loading
    this.updateLoadingState('Ready!', 100);
    await this.delay(500);
    
    // Initialize scene manager
    sceneManager.init();
    
    // Setup scene change callback
    sceneManager.onSceneChange = (from, to) => {
      console.log(`Scene transition: ${from} -> ${to}`);
      if (to === 'playing') {
        this.gamePhase = 'playing';
      } else if (to === 'paused') {
        this.gamePhase = 'paused';
      } else if (to === 'menu') {
        this.gamePhase = 'menu';
      }
    };
    
    // Setup hero creation callback
    sceneManager.onHeroCreated = (heroData: HeroCreationData) => {
      console.log('Hero created:', heroData);
      this.setupInitialState(heroData);
    };
    
    // Transition to main menu
    sceneManager.transitionTo('menu');
    
    // Start game loop (runs even in menu for background rendering)
    this.start();
    
    console.log('Grudge Islands RTS - Initialized!');
  }
  
  /**
   * Load all required sprites
   */
  private async loadSprites(): Promise<void> {
    const unitTypes = getAllUnitTypes();
    const totalUnits = unitTypes.length;
    let loaded = 0;
    
    for (const unitType of unitTypes) {
      this.updateLoadingState(`Loading ${unitType} sprites...`, 20 + (loaded / totalUnits) * 70);
      
      try {
        await spriteManager.preloadUnitSprites(unitType);
      } catch (error) {
        console.warn(`Failed to load sprites for ${unitType}:`, error);
      }
      
      loaded++;
    }
  }
  
  /**
   * Setup initial game state with islands, units, and boats
   */
  private setupInitialState(heroData?: HeroCreationData): void {
    const playerIsland = this.worldGenerator.getPlayerStartIsland();
    const enemyIslands = this.worldGenerator.getEnemyIslands();
    
    // Create player hero if hero data provided
    if (heroData) {
      // Find a valid walkable spawn point for the hero
      const heroSpawn = this.findWalkablePosition(playerIsland.center.x, playerIsland.center.y, 50);
      this.playerHero = new Hero(heroData, heroSpawn);
      console.log(`Hero ${heroData.name} (${heroData.heroClass}) spawned at`, heroSpawn);
      
      // Register hero with collision system
      this.collisionSystem.addCircleCollider(
        this.playerHero.id,
        heroSpawn,
        20, // hero radius
        CollisionLayer.Unit,
        'hero',
        1 as FactionId
      );
      
      // Register hero with aggro system
      this.aggroSystem.registerEntity({
        id: this.playerHero.id,
        type: 'hero',
        position: heroSpawn,
        faction: 1 as FactionId,
        health: this.playerHero.stats.health,
        maxHealth: this.playerHero.stats.maxHealth,
        attackDamage: 25,
        attackRange: 60,
        aggroRange: 250,
        behavior: 'aggressive'
      });
    }
    
    // Spawn player units on their starting island (only on walkable terrain)
    let spawnedPlayerUnits = 0;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (spawnedPlayerUnits < 15 && attempts < maxAttempts) {
      const angle = (spawnedPlayerUnits / 15) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 80 + Math.random() * 60;
      const x = playerIsland.center.x + Math.cos(angle) * radius;
      const y = playerIsland.center.y + Math.sin(angle) * radius;
      
      // Only spawn if position is walkable
      if (this.worldGenerator.isWalkable(x, y)) {
        const unitId = generateId();
        const pos = { x, y };
        
        this.entitySystem.registerEntity({
          id: unitId,
          faction: 1 as FactionId,
          size: 16,
          position: pos
        });
        
        // Register with movement system
        this.movementSystem.registerUnit(unitId, pos, 1 as FactionId, 80);
        
        // Register with collision system
        this.collisionSystem.addCircleCollider(
          unitId, pos, 12, CollisionLayer.Unit, 'unit', 1 as FactionId
        );
        
        // Register with aggro system
        this.aggroSystem.registerEntity({
          id: unitId,
          type: 'unit',
          position: pos,
          faction: 1 as FactionId,
          health: 100,
          attackDamage: 12,
          attackRange: 45,
          aggroRange: 180,
          behavior: 'aggressive'
        });
        
        spawnedPlayerUnits++;
      }
      attempts++;
    }
    
    // Spawn enemy units on enemy islands (only on walkable terrain)
    for (const island of enemyIslands) {
      let spawnedEnemyUnits = 0;
      attempts = 0;
      
      while (spawnedEnemyUnits < 10 && attempts < maxAttempts) {
        const angle = (spawnedEnemyUnits / 10) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 60 + Math.random() * 50;
        const x = island.center.x + Math.cos(angle) * radius;
        const y = island.center.y + Math.sin(angle) * radius;
        
        // Only spawn if position is walkable
        if (this.worldGenerator.isWalkable(x, y)) {
          const unitId = generateId();
          const pos = { x, y };
          
          this.entitySystem.registerEntity({
            id: unitId,
            faction: 2 as FactionId,
            size: 16,
            position: pos
          });
          
          // Register with movement and AI systems
          this.movementSystem.registerUnit(unitId, pos, 2 as FactionId, 60);
          this.aiController.registerUnit(unitId, pos, 2 as FactionId, {
            health: 100,
            maxHealth: 100,
            attackDamage: 10,
            attackRange: 50,
            aggroRange: 200
          });
          
          // Register with collision system
          this.collisionSystem.addCircleCollider(
            unitId, pos, 12, CollisionLayer.Unit, 'enemy', 2 as FactionId
          );
          
          // Register with aggro system
          this.aggroSystem.registerEntity({
            id: unitId,
            type: 'enemy',
            position: pos,
            faction: 2 as FactionId,
            health: 100,
            attackDamage: 10,
            attackRange: 50,
            aggroRange: 200,
            behavior: 'aggressive'
          });
          
          spawnedEnemyUnits++;
        }
        attempts++;
      }
    }
    
    // Create player's starting boat at first dock
    if (playerIsland.dockPoints.length > 0) {
      const dock = playerIsland.dockPoints[0];
      this.boatManager.createBoat(1 as FactionId, dock, 'medium');
    }
    
    // Center camera on player's island (or hero)
    const focusX = this.playerHero ? this.playerHero.position.x : playerIsland.center.x;
    const focusY = this.playerHero ? this.playerHero.position.y : playerIsland.center.y;
    this.renderer.setCameraPosition(
      focusX - window.innerWidth / 2,
      focusY - window.innerHeight / 2
    );
  }
  
  /**
   * Find a walkable position near the given coordinates
   */
  private findWalkablePosition(centerX: number, centerY: number, maxRadius: number): { x: number; y: number } {
    // Try center first
    if (this.worldGenerator.isWalkable(centerX, centerY)) {
      return { x: centerX, y: centerY };
    }
    
    // Spiral outward to find walkable position
    for (let radius = 10; radius <= maxRadius; radius += 10) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (this.worldGenerator.isWalkable(x, y)) {
          return { x, y };
        }
      }
    }
    
    // Fallback to center
    return { x: centerX, y: centerY };
  }
  
  /**
   * Setup keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Mouse events on foreground canvas
    this.fgCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.fgCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.fgCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    // Must use { passive: false } to enable preventDefault for wheel zoom
    this.fgCanvas.addEventListener('wheel', (e) => this.handleMouseWheel(e), { passive: false });
    this.fgCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Pause menu buttons
    document.getElementById('resumeBtn')?.addEventListener('click', () => this.resume());
    document.getElementById('quitBtn')?.addEventListener('click', () => this.quit());
  }
  
  /**
   * Resize canvases to window size
   */
  private resizeCanvases(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    [this.bgCanvas, this.fgCanvas, this.uiCanvas].forEach(canvas => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });
    
    if (this.renderer) {
      this.renderer.onResize(width, height);
    }
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }
  
  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
    this.lastFrameTime = now;
    
    // Update FPS counter
    this.fpsFrameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.fpsFrameCount;
      this.fpsFrameCount = 0;
      this.fpsUpdateTime = now;
      this.fpsCounter.textContent = `FPS: ${this.fps}`;
    }
    
    // Update game state
    if (this.gamePhase === 'playing' && sceneManager.isPlaying()) {
      this.update(deltaTime * GAME_SPEED_MULTIPLIER);
    }
    
    // Only render game if not in menu/hero creation
    if (sceneManager.isPlaying() || sceneManager.isPaused()) {
      this.render(deltaTime);
    }
    
    // Update HUD
    this.updateHUD();
    
    // Continue loop
    this.frameCount++;
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
  
  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    // Update terrain animations
    this.terrainRenderer.update(deltaTime);
    
    // Update boats
    const boatResult = this.boatManager.update(deltaTime);
    // Handle deployed units from boats
    for (const deployed of boatResult.deployedUnits) {
      // Reactivate unit on land
      console.log(`Unit ${deployed.unitId} deployed at`, deployed.position);
    }
    
    // Update buildings (construction, attacks)
    this.buildingManager.update(deltaTime);
    
    // Update building placement preview
    const buildMenu = this.buildingManager.getMenuState();
    if (buildMenu.selectedBuilding && !buildMenu.isOpen) {
      const worldX = this.renderer.screenToWorldX(this.mouseX);
      const worldY = this.renderer.screenToWorldY(this.mouseY);
      this.buildingManager.updatePlacementPosition(
        worldX, worldY,
        (x, y) => this.worldGenerator.isBuildable(x, y)
      );
    }
    
    // Update towers (targeting and attacking)
    this.towerManager.update(deltaTime, (pos, range, ownerFaction) => {
      return this.getEnemiesInRange(pos, range, ownerFaction);
    });
    
    // Update tower placement preview
    const towerMenu = this.towerManager.getMenuState();
    if (towerMenu.selectedTower && !towerMenu.isOpen) {
      const worldX = this.renderer.screenToWorldX(this.mouseX);
      const worldY = this.renderer.screenToWorldY(this.mouseY);
      this.towerManager.updatePlacementPosition(
        worldX, worldY,
        (x, y) => this.worldGenerator.isBuildable(x, y)
      );
    }
    
    // Update tower UI state
    this.towerUI.handleMouseMove(this.mouseX, this.mouseY);
    
    // Update player hero
    if (this.playerHero && !this.playerHero.isDead()) {
      this.playerHero.update(deltaTime);
    }
    
    // Update movement system
    const updatedPositions = this.movementSystem.update(deltaTime);
    
    // Sync positions with entity system
    for (const [id, pos] of updatedPositions) {
      this.entitySystem.updateEntityPosition(id, pos);
      this.aiController.updateUnitPosition(id, pos);
    }
    
    // Update AI controller (for enemy units)
    const playerUnitsMap = new Map<string, { position: Position; health: number }>();
    const allEntities = this.entitySystem.getAllEntities();
    for (const entity of allEntities) {
      if ((entity.faction as number) === 1) {
        playerUnitsMap.set(entity.id, {
          position: entity.position,
          health: 100 // TODO: Track actual health
        });
      }
    }
    // Add hero to player units
    if (this.playerHero && !this.playerHero.isDead()) {
      playerUnitsMap.set(this.playerHero.id, {
        position: this.playerHero.position,
        health: this.playerHero.stats.health
      });
    }
    this.aiController.updatePlayerUnits(playerUnitsMap);
    this.aiController.update(deltaTime);
    
    // Update collision system and resolve collisions
    const collisionResults = this.collisionSystem.update();
    for (const result of collisionResults) {
      // Resolve collision (separate overlapping entities)
      const resolved = this.collisionSystem.resolveCollision(result);
      
      // Update entity positions based on resolution
      const entityA = this.entitySystem.getEntity(result.colliderA.id);
      const entityB = this.entitySystem.getEntity(result.colliderB.id);
      
      if (entityA && !result.colliderA.isStatic) {
        this.entitySystem.updateEntityPosition(result.colliderA.id, resolved.posA);
        this.collisionSystem.updatePosition(result.colliderA.id, resolved.posA);
        this.movementSystem.updateUnitPosition?.(result.colliderA.id, resolved.posA);
      }
      if (entityB && !result.colliderB.isStatic) {
        this.entitySystem.updateEntityPosition(result.colliderB.id, resolved.posB);
        this.collisionSystem.updatePosition(result.colliderB.id, resolved.posB);
        this.movementSystem.updateUnitPosition?.(result.colliderB.id, resolved.posB);
      }
    }
    
    // Update aggro/combat system
    this.aggroSystem.update(deltaTime * 1000); // AggroSystem expects ms
    
    // Update effects and projectiles
    this.effectsManager.update(deltaTime * 1000, (targetId) => {
      const entity = this.aggroSystem.getEntity(targetId);
      return entity?.position ?? null;
    });
    
    // Update input manager edge panning
    this.inputManager?.updateEdgePan(deltaTime);
    
    // Passive gold income
    this.playerGold += deltaTime * 2; // 2 gold per second
  }
  
  /**
   * Get enemies in range for tower targeting
   */
  private getEnemiesInRange(pos: Position, range: number, ownerFaction: FactionId): { id: string; position: Position; health: number }[] {
    const enemies: { id: string; position: Position; health: number }[] = [];
    
    // Get all entities that are enemies of the owner faction
    const allEntities = this.entitySystem.getAllEntities();
    for (const entity of allEntities) {
      // Skip friendly units
      if (entity.faction === ownerFaction) continue;
      
      // Check if in range
      const dist = Math.hypot(entity.position.x - pos.x, entity.position.y - pos.y);
      if (dist <= range) {
        enemies.push({
          id: entity.id,
          position: entity.position,
          health: (entity as any).health || 100
        });
      }
    }
    
    return enemies;
  }
  
  private mouseX: number = 0;
  private mouseY: number = 0;
  
  /**
   * Render the game
   */
  private render(deltaTime: number): void {
    // Render terrain first (on background canvas via renderer)
    this.renderer.renderWithTerrain(
      deltaTime,
      this.gameTime,
      this.terrainRenderer,
      this.boatManager,
      this.buildingManager,
      this.towerManager,
      this.effectsManager
    );
    
    // Render tower UI elements on UI canvas (no world transform needed)
    const uiCtx = this.uiCanvas.getContext('2d')!;
    const towerMenu = this.towerManager.getMenuState();
    
    // Render tower build menu if open
    if (towerMenu.isOpen) {
      this.towerManager.renderTowerMenu(uiCtx, window.innerWidth, window.innerHeight);
    }
    
    // Render tower info panel if tower is selected
    this.towerUI.render(uiCtx, window.innerWidth, window.innerHeight);
    
    // Debug rendering (needs camera offset since it's outside transform)
    const fgCtx = this.fgCanvas.getContext('2d')!;
    const cameraPos = this.renderer.getCameraPosition();
    const zoom = this.renderer.getZoom();
    
    if (this.debugCollision || this.debugAggro) {
      fgCtx.save();
      fgCtx.scale(zoom, zoom);
      fgCtx.translate(-cameraPos.x, -cameraPos.y);
      
      if (this.debugCollision) {
        this.collisionSystem.debugRender(fgCtx, 0, 0);
      }
      if (this.debugAggro) {
        this.aggroSystem.debugRender(fgCtx, 0, 0);
      }
      
      fgCtx.restore();
    }
  }
  
  /**
   * Update HUD elements
   */
  private updateHUD(): void {
    this.unitCountEl.textContent = this.entitySystem.unitCount[1].toString();
    this.goldCountEl.textContent = Math.floor(this.playerGold).toString();
    // TODO: Count nodes
    this.playerNodesEl.textContent = '1';
    this.enemyNodesEl.textContent = '1';
    
    // Update tower UI with current gold
    this.towerUI.updatePlayerGold(Math.floor(this.playerGold));
  }
  
  // === INPUT HANDLERS ===
  
  private handleKeyDown(e: KeyboardEvent): void {
    // Check if build menu is handling input
    const buildMenu = this.buildingManager.getMenuState();
    const towerMenu = this.towerManager.getMenuState();
    
    // Tower menu hotkeys
    if (towerMenu.isOpen) {
      const towerHotkeys: Record<string, TowerType> = {
        '1': 'arrow',
        '2': 'cannon',
        '3': 'magic',
        '4': 'frost',
        '5': 'fire'
      };
      
      if (towerHotkeys[e.key]) {
        this.towerManager.selectTowerType(towerHotkeys[e.key]);
        return;
      }
    }
    
    if (buildMenu.isOpen) {
      // Building hotkeys
      const buildingHotkeys: Record<string, BuildingType> = {
        '1': 'tower',
        '2': 'wall',
        '3': 'barracks',
        '4': 'watchtower',
        '5': 'armory',
        '6': 'shrine'
      };
      
      if (buildingHotkeys[e.key]) {
        this.buildingManager.selectBuilding(buildingHotkeys[e.key]);
        return;
      }
    }
    
    switch (e.key.toLowerCase()) {
      case 'escape':
        if (towerMenu.isOpen) {
          this.towerManager.closeTowerMenu();
        } else if (towerMenu.selectedTower) {
          this.towerManager.closeTowerMenu();
        } else if (buildMenu.isOpen) {
          this.buildingManager.closeBuildMenu();
        } else if (buildMenu.selectedBuilding) {
          this.buildingManager.closeBuildMenu();
        } else if (this.towerUI.isVisible()) {
          this.towerUI.hide();
          this.towerManager.selectTower(null);
        } else {
          this.togglePause();
        }
        break;
      case 't':
        // Toggle tower menu - get hero's current island
        const heroIslandT = this.getHeroIsland();
        this.towerManager.toggleTowerMenu(heroIslandT, Math.floor(this.playerGold));
        // Close other menus
        this.buildingManager.closeBuildMenu();
        break;
      case 'b':
        // Toggle build menu - get hero's current island
        const heroIsland = this.getHeroIsland();
        this.buildingManager.toggleBuildMenu(heroIsland);
        // Close tower menu
        this.towerManager.closeTowerMenu();
        break;
      case 'u':
        // Upgrade selected tower hotkey
        if (this.towerUI.isVisible()) {
          const selectedTower = this.towerUI.getTower();
          if (selectedTower) {
            this.handleTowerUpgrade(selectedTower.id);
          }
        }
        break;
      case 'p':
        this.togglePause();
        break;
      case 'w':
      case 'arrowup':
        this.renderer.panCamera(0, -20);
        break;
      case 's':
      case 'arrowdown':
        if (!buildMenu.isOpen && !towerMenu.isOpen) {
          this.renderer.panCamera(0, 20);
        }
        break;
      case 'a':
      case 'arrowleft':
        this.renderer.panCamera(-20, 0);
        break;
      case 'd':
      case 'arrowright':
        this.renderer.panCamera(20, 0);
        break;
    }
  }
  
  /**
   * Get the island the hero is currently on
   */
  private getHeroIsland() {
    // For now, assume hero is near camera center
    const cameraPos = this.renderer.getCameraPosition();
    const centerX = cameraPos.x + window.innerWidth / 2 / this.renderer.getZoom();
    const centerY = cameraPos.y + window.innerHeight / 2 / this.renderer.getZoom();
    return this.worldGenerator.getIslandAt(centerX, centerY);
  }
  
  private handleKeyUp(_e: KeyboardEvent): void {
    // Handle key releases if needed
  }
  
  private handleMouseDown(e: MouseEvent): void {
    const buildMenu = this.buildingManager.getMenuState();
    const towerMenu = this.towerManager.getMenuState();
    
    if (e.button === 0) {
      // Left click
      
      // Check if tower UI consumed the click
      if (this.towerUI.handleClick(e.clientX, e.clientY)) {
        return;
      }
      
      // Tower placement
      if (towerMenu.selectedTower && towerMenu.placementValid) {
        const tower = this.towerManager.placeTower(1 as FactionId);
        if (tower) {
          // Deduct gold
          const def = TOWER_DEFINITIONS[tower.type];
          this.playerGold -= def.baseCost;
        }
        return;
      }
      
      // Building placement
      if (buildMenu.selectedBuilding && buildMenu.placementValid) {
        this.buildingManager.placeBuilding(1 as FactionId);
        return;
      }
      
      // Check if clicking on a tower
      if (!buildMenu.isOpen && !towerMenu.isOpen) {
        const worldX = this.renderer.screenToWorldX(e.clientX);
        const worldY = this.renderer.screenToWorldY(e.clientY);
        const clickedTower = this.towerManager.getTowerAt(worldX, worldY);
        
        if (clickedTower) {
          this.towerManager.selectTower(clickedTower.id);
          this.towerUI.show(clickedTower, Math.floor(this.playerGold));
          return;
        } else {
          // Clicked elsewhere, deselect tower
          if (this.towerUI.isVisible()) {
            this.towerUI.hide();
            this.towerManager.selectTower(null);
          }
        }
        
        // Start selection
        this.renderer.startSelection(e.clientX, e.clientY);
      }
    } else if (e.button === 2) {
      // Right click
      if (towerMenu.selectedTower) {
        // Cancel tower placement
        this.towerManager.closeTowerMenu();
      } else if (buildMenu.selectedBuilding) {
        // Cancel building placement
        this.buildingManager.closeBuildMenu();
      } else {
        // Issue move command to selected units
        const worldX = this.renderer.screenToWorldX(e.clientX);
        const worldY = this.renderer.screenToWorldY(e.clientY);
        
        // Get selected entities from renderer
        const selectedIds = this.renderer.getSelectedEntityIds();
        
        if (selectedIds.length > 0) {
          // Issue move commands to all selected units
          for (const id of selectedIds) {
            this.movementSystem.commandMove(id, { x: worldX, y: worldY });
          }
        } else if (this.playerHero) {
          // No selection - move hero
          this.playerHero.moveTo(worldX, worldY);
        }
        
        // Also call renderer's issueCommand for visual feedback
        this.renderer.issueCommand(e.clientX, e.clientY);
      }
    }
  }
  
  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      // Left click release - finish selection
      this.renderer.endSelection(e.clientX, e.clientY);
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.renderer.updateMousePosition(e.clientX, e.clientY);
  }
  
  private handleMouseWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    this.renderer.zoom(zoomDelta, e.clientX, e.clientY);
  }
  
  // === GAME STATE METHODS ===
  
  private togglePause(): void {
    sceneManager.togglePause();
  }
  
  pause(): void {
    sceneManager.transitionTo('paused');
  }
  
  resume(): void {
    sceneManager.transitionTo('playing');
  }
  
  quit(): void {
    this.stop();
    sceneManager.transitionTo('menu');
  }
  
  // === UTILITY METHODS ===
  
  private updateLoadingState(text: string, percent: number): void {
    this.loadingText.textContent = text;
    this.loadingProgress.style.width = `${percent}%`;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // === GETTERS ===
  
  getGameTime(): number {
    return this.gameTime;
  }
  
  getGamePhase(): GamePhase {
    return this.gamePhase;
  }
  
  getPlayerHero(): Hero | null {
    return this.playerHero;
  }
  
  getFps(): number {
    return this.fps;
  }
  
  // === TOWER MANAGEMENT ===
  
  /**
   * Handle tower upgrade request
   */
  private handleTowerUpgrade(towerId: string): void {
    const tower = this.towerManager.getTower(towerId);
    if (!tower) return;
    
    const upgradeCost = getTowerUpgradeCost(tower.type, tower.level);
    if (upgradeCost === null) return; // Max level
    
    if (this.playerGold < upgradeCost) {
      console.log('Not enough gold to upgrade tower');
      return;
    }
    
    const cost = this.towerManager.upgradeTower(towerId);
    if (cost !== null) {
      this.playerGold -= cost;
      
      // Update tower UI with new tower state
      const updatedTower = this.towerManager.getTower(towerId);
      if (updatedTower) {
        this.towerUI.show(updatedTower, Math.floor(this.playerGold));
      }
    }
  }
  
  /**
   * Handle tower sell request
   */
  private handleTowerSell(towerId: string): void {
    const tower = this.towerManager.getTower(towerId);
    if (!tower) return;
    
    // Calculate sell value (60% of total invested)
    const def = TOWER_DEFINITIONS[tower.type];
    let totalInvested = def.baseCost;
    for (let i = 1; i < tower.level; i++) {
      totalInvested += def.levels[i].cost;
    }
    const sellValue = Math.floor(totalInvested * 0.6);
    
    // Add gold back
    this.playerGold += sellValue;
    
    // Destroy tower
    this.towerManager.damageTower(towerId, tower.health + 1); // Force destroy
    
    // Hide tower UI
    this.towerUI.hide();
    this.towerManager.selectTower(null);
  }
}
