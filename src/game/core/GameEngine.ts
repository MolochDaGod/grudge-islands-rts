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
  
  // Player resources
  private playerGold: number = 500;
  
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
  private loadingScreen!: HTMLElement;
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
    this.loadingScreen = document.getElementById('loadingScreen')!;
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
    
    // Complete loading
    this.updateLoadingState('Ready!', 100);
    await this.delay(500);
    
    // Hide loading screen and start game
    this.loadingScreen.style.display = 'none';
    this.gamePhase = 'playing';
    
    // Setup initial game state
    this.setupInitialState();
    
    // Start game loop
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
  private setupInitialState(): void {
    const playerIsland = this.worldGenerator.getPlayerStartIsland();
    const enemyIslands = this.worldGenerator.getEnemyIslands();
    
    // Spawn player units on their starting island
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      const x = playerIsland.center.x + Math.cos(angle) * radius;
      const y = playerIsland.center.y + Math.sin(angle) * radius;
      
      this.entitySystem.registerEntity({
        id: generateId(),
        faction: 1 as FactionId,
        size: 16,
        position: { x, y }
      });
    }
    
    // Spawn enemy units on enemy islands
    for (const island of enemyIslands) {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 60 + Math.random() * 40;
        const x = island.center.x + Math.cos(angle) * radius;
        const y = island.center.y + Math.sin(angle) * radius;
        
        this.entitySystem.registerEntity({
          id: generateId(),
          faction: 2 as FactionId,
          size: 16,
          position: { x, y }
        });
      }
    }
    
    // Create player's starting boat at first dock
    if (playerIsland.dockPoints.length > 0) {
      const dock = playerIsland.dockPoints[0];
      this.boatManager.createBoat(1 as FactionId, dock, 'medium');
    }
    
    // Center camera on player's island
    this.renderer.setCameraPosition(
      playerIsland.center.x - window.innerWidth / 2,
      playerIsland.center.y - window.innerHeight / 2
    );
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
    this.fgCanvas.addEventListener('wheel', (e) => this.handleMouseWheel(e));
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
    if (this.gamePhase === 'playing') {
      this.update(deltaTime * GAME_SPEED_MULTIPLIER);
    }
    
    // Render
    this.render(deltaTime);
    
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
    
    // Passive gold income
    this.playerGold += deltaTime * 2; // 2 gold per second
    
    // TODO: Update remaining systems
    // - Unit AI and movement
    // - Combat calculations
    // - Node capture mechanics
    // - AI controller updates
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
          health: entity.health || 100
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
      this.buildingManager
    );
    
    // Render towers on foreground canvas
    const fgCtx = this.fgCanvas.getContext('2d')!;
    const cameraPos = this.renderer.getCameraPosition();
    this.towerManager.render(fgCtx, cameraPos.x, cameraPos.y, this.gameTime);
    
    // Render tower placement preview
    const towerMenu = this.towerManager.getMenuState();
    if (towerMenu.selectedTower) {
      this.towerManager.renderPlacementPreview(fgCtx, cameraPos.x, cameraPos.y);
    }
    
    // Render tower UI elements on UI canvas
    const uiCtx = this.uiCanvas.getContext('2d')!;
    
    // Render tower build menu if open
    if (towerMenu.isOpen) {
      this.towerManager.renderTowerMenu(uiCtx, window.innerWidth, window.innerHeight);
    }
    
    // Render tower info panel if tower is selected
    this.towerUI.render(uiCtx, window.innerWidth, window.innerHeight);
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
        // Issue command
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
    if (this.gamePhase === 'playing') {
      this.pause();
    } else if (this.gamePhase === 'paused') {
      this.resume();
    }
  }
  
  pause(): void {
    this.gamePhase = 'paused';
    document.getElementById('pauseMenu')?.classList.add('visible');
  }
  
  resume(): void {
    this.gamePhase = 'playing';
    document.getElementById('pauseMenu')?.classList.remove('visible');
  }
  
  quit(): void {
    this.stop();
    this.gamePhase = 'menu';
    // TODO: Show main menu
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
