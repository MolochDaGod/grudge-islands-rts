// ============================================
// GAME SCENE
// Main gameplay scene with world, islands,
// units, combat, camera controls
// ============================================

import Phaser from 'phaser';
import { GAME_CONFIG, GameState, GameUnit, GameIsland, GameBuilding } from '../PhaserGame';
import { UNIT_CONFIGS, MONSTER_CONFIGS, BUILDING_CONFIGS, type Faction } from '../sprites/SpriteRegistry';

// Island type definitions
const ISLAND_TYPES = [
  { type: 'home', name: 'Home Island', emoji: '🏰', ownership: 'player' as const },
  { type: 'forest', name: 'Forest Isle', emoji: '🌲', ownership: 'neutral' as const },
  { type: 'mountain', name: 'Mountain Peak', emoji: '⛰️', ownership: 'neutral' as const },
  { type: 'gold', name: 'Gold Coast', emoji: '💰', ownership: 'neutral' as const },
  { type: 'enemy', name: 'Goblin Stronghold', emoji: '👺', ownership: 'enemy' as const },
  { type: 'ruins', name: 'Ancient Ruins', emoji: '🏛️', ownership: 'hostile' as const },
  { type: 'swamp', name: 'Murky Swamp', emoji: '🐸', ownership: 'hostile' as const },
  { type: 'volcanic', name: 'Volcanic Island', emoji: '🌋', ownership: 'hostile' as const },
];

export class GameScene extends Phaser.Scene {
  // Camera controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private cameraSpeed = 800;
  
  // Selection
  private selectionRect!: Phaser.GameObjects.Rectangle;
  private selectionStart: { x: number; y: number } | null = null;
  private isSelecting = false;
  
  // Groups
  private unitGroup!: Phaser.GameObjects.Group;
  private buildingGroup!: Phaser.GameObjects.Group;
  private islandGroup!: Phaser.GameObjects.Group;
  private projectileGroup!: Phaser.GameObjects.Group;
  private effectGroup!: Phaser.GameObjects.Group;
  private decorationGroup!: Phaser.GameObjects.Group;
  
  // Sprite containers
  private unitSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private healthBars: Map<number, Phaser.GameObjects.Graphics> = new Map();
  
  // Minimap camera
  private minimapCamera!: Phaser.Cameras.Scene2D.Camera;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create(): void {
    console.log('[GameScene] Creating game world...');
    
    // Setup world bounds
    this.physics.world.setBounds(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    
    // Create ocean background
    this.createOceanBackground();
    
    // Setup groups
    this.setupGroups();
    
    // Generate islands
    this.generateIslands();
    
    // Setup camera
    this.setupCamera();
    
    // Setup input
    this.setupInput();
    
    // Create initial player units
    this.createStartingUnits();
    
    // Spawn enemy units on hostile islands
    this.spawnEnemyUnits();
    
    // Create selection rectangle
    this.selectionRect = this.add.rectangle(0, 0, 0, 0, 0x00ff00, 0.2)
      .setStrokeStyle(2, 0x00ff00)
      .setVisible(false)
      .setDepth(1000);
    
    console.log('[GameScene] World created!');
  }
  
  private createOceanBackground(): void {
    // Tiled water background
    const waterColor = 0x1a4d7a;
    const deepWaterColor = 0x0a3d5a;
    
    // Create animated water tiles
    const tileSize = 256;
    for (let x = 0; x < GAME_CONFIG.WORLD_WIDTH; x += tileSize) {
      for (let y = 0; y < GAME_CONFIG.WORLD_HEIGHT; y += tileSize) {
        const shade = Math.random() * 0.1;
        const color = Phaser.Display.Color.IntegerToColor(waterColor);
        color.brighten(shade * 100 - 5);
        
        this.add.rectangle(x + tileSize / 2, y + tileSize / 2, tileSize, tileSize, color.color)
          .setDepth(-10);
      }
    }
    
    // Add water rocks scattered in the ocean
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
      const y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
      const rockNum = Math.ceil(Math.random() * 4);
      
      if (this.textures.exists(`water_rock_${rockNum}`)) {
        this.add.image(x, y, `water_rock_${rockNum}`)
          .setScale(0.3 + Math.random() * 0.3)
          .setAlpha(0.7)
          .setDepth(-5);
      }
    }
  }
  
  private setupGroups(): void {
    this.islandGroup = this.add.group();
    this.buildingGroup = this.add.group();
    this.unitGroup = this.add.group();
    this.projectileGroup = this.add.group();
    this.effectGroup = this.add.group();
    this.decorationGroup = this.add.group();
  }
  
  private generateIslands(): void {
    const { WORLD_WIDTH, WORLD_HEIGHT, ISLAND_GRID_COLS, ISLAND_GRID_ROWS, ISLAND_SIZE, ISLAND_SPACING } = GAME_CONFIG;
    
    const cellWidth = WORLD_WIDTH / ISLAND_GRID_COLS;
    const cellHeight = WORLD_HEIGHT / ISLAND_GRID_ROWS;
    
    let islandId = 0;
    
    // Generate island grid with some randomization
    for (let row = 0; row < ISLAND_GRID_ROWS; row++) {
      for (let col = 0; col < ISLAND_GRID_COLS; col++) {
        // Skip some cells for variety (not the home cell)
        if (row === 0 && col === 0) {
          // Home island - always place
        } else if (Math.random() < 0.25) {
          continue; // Skip 25% of cells
        }
        
        // Calculate position with jitter
        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.4);
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.4);
        const x = baseX + jitterX;
        const y = baseY + jitterY;
        
        // Determine island type
        let islandType;
        if (row === 0 && col === 0) {
          islandType = ISLAND_TYPES[0]; // Home island
        } else {
          // Distance from home determines enemy likelihood
          const distFromHome = Math.sqrt(row * row + col * col);
          const enemyChance = Math.min(0.6, distFromHome * 0.1);
          
          if (Math.random() < enemyChance) {
            // Enemy or hostile island
            islandType = ISLAND_TYPES[Math.floor(Math.random() * 3) + 4];
          } else {
            // Neutral resource island
            islandType = ISLAND_TYPES[Math.floor(Math.random() * 3) + 1];
          }
        }
        
        // Create island data
        const island: GameIsland = {
          id: islandId++,
          name: `${islandType.name} ${islandId}`,
          type: islandType.type,
          x,
          y,
          ownership: islandType.ownership,
          emoji: islandType.emoji,
          buildings: [],
          resources: [],
          radius: ISLAND_SIZE * (0.8 + Math.random() * 0.4),
          shapePoints: this.generateIslandShape(x, y, ISLAND_SIZE),
        };
        
        // Generate resources on island
        this.generateIslandResources(island);
        
        // Add buildings for enemy islands
        if (island.ownership === 'enemy') {
          this.generateEnemyBuildings(island);
        }
        
        // Home island gets starting buildings
        if (island.type === 'home') {
          this.generateHomeBuildings(island);
        }
        
        GameState.islands.push(island);
        
        // Render island
        this.renderIsland(island);
      }
    }
    
    console.log(`[GameScene] Generated ${GameState.islands.length} islands`);
  }
  
  private generateIslandShape(centerX: number, centerY: number, baseRadius: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const segments = 12 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radiusVariation = 0.7 + Math.random() * 0.6;
      const radius = baseRadius * radiusVariation;
      
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
    
    return points;
  }
  
  private renderIsland(island: GameIsland): void {
    const graphics = this.add.graphics();
    
    // Island base color based on type
    const colorMap: Record<string, number> = {
      home: 0x4a7c3f,
      forest: 0x3d6b3d,
      mountain: 0x6b6b6b,
      gold: 0x8b7355,
      enemy: 0x5a3a3a,
      ruins: 0x5c5c4a,
      swamp: 0x3d5a3d,
      volcanic: 0x4a3a3a,
    };
    
    const baseColor = colorMap[island.type] || 0x4a7c3f;
    
    // Draw island polygon
    if (island.shapePoints && island.shapePoints.length > 0) {
      // Beach/sand edge
      graphics.fillStyle(0xd4b896, 1);
      graphics.beginPath();
      const firstPoint = island.shapePoints[0];
      graphics.moveTo(firstPoint.x, firstPoint.y);
      island.shapePoints.forEach(point => {
        graphics.lineTo(point.x, point.y);
      });
      graphics.closePath();
      graphics.fillPath();
      
      // Inner grass/terrain (slightly smaller)
      graphics.fillStyle(baseColor, 1);
      graphics.beginPath();
      const scale = 0.85;
      const innerPoints = island.shapePoints.map(p => ({
        x: island.x + (p.x - island.x) * scale,
        y: island.y + (p.y - island.y) * scale,
      }));
      graphics.moveTo(innerPoints[0].x, innerPoints[0].y);
      innerPoints.forEach(point => {
        graphics.lineTo(point.x, point.y);
      });
      graphics.closePath();
      graphics.fillPath();
    }
    
    graphics.setDepth(0);
    this.islandGroup.add(graphics);
    
    // Add decorations
    this.addIslandDecorations(island);
    
    // Render buildings
    island.buildings.forEach(building => {
      this.renderBuilding(building, island);
    });
    
    // Add island name label
    const label = this.add.text(island.x, island.y - (island.radius || 300) - 20, 
      `${island.emoji} ${island.name}`, {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
  }
  
  private addIslandDecorations(island: GameIsland): void {
    const radius = island.radius || 300;
    const decorCount = Math.floor(radius / 40);
    
    for (let i = 0; i < decorCount; i++) {
      // Random position within island
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.7;
      const x = island.x + Math.cos(angle) * dist;
      const y = island.y + Math.sin(angle) * dist;
      
      // Choose decoration based on island type
      let decorKey = '';
      const roll = Math.random();
      
      if (island.type === 'forest' || roll < 0.4) {
        const treeNum = Math.ceil(Math.random() * 4);
        decorKey = `tree_${treeNum}`;
      } else if (roll < 0.6) {
        const bushNum = Math.ceil(Math.random() * 4);
        decorKey = `bush_${bushNum}`;
      } else if (roll < 0.8) {
        const rockNum = Math.ceil(Math.random() * 4);
        decorKey = `rock_${rockNum}`;
      }
      
      if (decorKey && this.textures.exists(decorKey)) {
        const sprite = this.add.image(x, y, decorKey)
          .setScale(0.3 + Math.random() * 0.2)
          .setDepth(2);
        this.decorationGroup.add(sprite);
      }
    }
  }
  
  private generateIslandResources(island: GameIsland): void {
    const radius = island.radius || 300;
    
    // Resource types based on island type
    const resourceMap: Record<string, string[]> = {
      home: ['wood', 'food'],
      forest: ['wood', 'wood', 'food'],
      mountain: ['stone', 'iron', 'gold'],
      gold: ['gold', 'gold', 'iron'],
      enemy: ['gold', 'iron'],
      ruins: ['gold', 'stone'],
      swamp: ['wood', 'food'],
      volcanic: ['iron', 'stone'],
    };
    
    const resourceTypes = resourceMap[island.type] || ['wood', 'stone'];
    const numResources = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numResources; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.3 * radius + Math.random() * radius * 0.5;
      
      island.resources.push({
        type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        x: island.x + Math.cos(angle) * dist,
        y: island.y + Math.sin(angle) * dist,
        amount: 500 + Math.floor(Math.random() * 1000),
      });
    }
  }
  
  private generateHomeBuildings(island: GameIsland): void {
    const buildingId = GameState.buildingIdCounter++;
    
    // Castle at center
    const castle: GameBuilding = {
      id: buildingId,
      type: 'castle',
      x: island.x,
      y: island.y,
      islandId: island.id,
      hp: 2000,
      maxHp: 2000,
      faction: 'crusade',
      isEnemy: false,
    };
    island.buildings.push(castle);
    GameState.buildings.push(castle);
    
    // Barracks
    const barracks: GameBuilding = {
      id: GameState.buildingIdCounter++,
      type: 'barracks',
      x: island.x - 150,
      y: island.y + 100,
      islandId: island.id,
      hp: 500,
      maxHp: 500,
      faction: 'crusade',
      isEnemy: false,
    };
    island.buildings.push(barracks);
    GameState.buildings.push(barracks);
    
    // Archery
    const archery: GameBuilding = {
      id: GameState.buildingIdCounter++,
      type: 'archery',
      x: island.x + 150,
      y: island.y + 100,
      islandId: island.id,
      hp: 400,
      maxHp: 400,
      faction: 'crusade',
      isEnemy: false,
    };
    island.buildings.push(archery);
    GameState.buildings.push(archery);
  }
  
  private generateEnemyBuildings(island: GameIsland): void {
    // Enemy castle
    const castle: GameBuilding = {
      id: GameState.buildingIdCounter++,
      type: 'castle',
      x: island.x,
      y: island.y,
      islandId: island.id,
      hp: 1500,
      maxHp: 1500,
      faction: 'goblin',
      isEnemy: true,
    };
    island.buildings.push(castle);
    GameState.buildings.push(castle);
    
    // Towers
    const towerPositions = [
      { x: -120, y: -80 },
      { x: 120, y: -80 },
      { x: 0, y: 120 },
    ];
    
    towerPositions.forEach(pos => {
      if (Math.random() < 0.7) {
        const tower: GameBuilding = {
          id: GameState.buildingIdCounter++,
          type: 'tower',
          x: island.x + pos.x,
          y: island.y + pos.y,
          islandId: island.id,
          hp: 400,
          maxHp: 400,
          faction: 'goblin',
          isEnemy: true,
        };
        island.buildings.push(tower);
        GameState.buildings.push(tower);
      }
    });
  }
  
  private renderBuilding(building: GameBuilding, island: GameIsland): void {
    const faction = building.faction as Faction;
    const buildingKey = `building_${faction}_${building.type}`;
    
    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
    
    if (this.textures.exists(buildingKey)) {
      sprite = this.add.image(building.x, building.y, buildingKey)
        .setScale(0.4)
        .setDepth(3);
    } else {
      // Fallback to colored rectangle with emoji
      const config = BUILDING_CONFIGS[building.type];
      const rect = this.add.rectangle(building.x, building.y, 64, 64, 
        building.isEnemy ? 0x8b0000 : 0x4169e1, 0.8)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(3);
      
      this.add.text(building.x, building.y, config?.emoji || '🏠', {
        fontSize: '24px',
      }).setOrigin(0.5).setDepth(4);
      
      sprite = rect as any;
    }
    
    this.buildingSprites.set(building.id, sprite as Phaser.GameObjects.Sprite);
    this.buildingGroup.add(sprite);
    
    // Health bar
    this.createHealthBar(building.id, building.x, building.y - 40, building.hp, building.maxHp, building.isEnemy);
  }
  
  private setupCamera(): void {
    const mainCam = this.cameras.main;
    
    // Set bounds and zoom
    mainCam.setBounds(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    mainCam.setZoom(GAME_CONFIG.CAMERA_ZOOM_DEFAULT);
    
    // Center on home island
    const homeIsland = GameState.islands.find(i => i.type === 'home');
    if (homeIsland) {
      mainCam.centerOn(homeIsland.x, homeIsland.y);
    } else {
      mainCam.centerOn(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2);
    }
    
    // Mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      const zoomChange = deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Phaser.Math.Clamp(
        mainCam.zoom + zoomChange,
        GAME_CONFIG.CAMERA_ZOOM_MIN,
        GAME_CONFIG.CAMERA_ZOOM_MAX
      );
      mainCam.setZoom(newZoom);
    });
    
    // Middle mouse drag for panning
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        isPanning = true;
        panStart = { x: pointer.x, y: pointer.y };
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isPanning) {
        const dx = (panStart.x - pointer.x) / mainCam.zoom;
        const dy = (panStart.y - pointer.y) / mainCam.zoom;
        mainCam.scrollX += dx;
        mainCam.scrollY += dy;
        panStart = { x: pointer.x, y: pointer.y };
      }
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonReleased()) {
        isPanning = false;
      }
    });
  }
  
  private setupInput(): void {
    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    
    // Control groups (1-5)
    for (let i = 1; i <= 5; i++) {
      const key = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes[`ONE` as keyof typeof Phaser.Input.Keyboard.KeyCodes] + i - 1);
      key.on('down', () => {
        if (this.input.keyboard!.checkDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL))) {
          // Ctrl+number: assign control group
          GameState.controlGroups[i] = [...GameState.selectedUnits];
          console.log(`[GameScene] Control group ${i} assigned: ${GameState.selectedUnits.length} units`);
        } else {
          // Number: select control group
          if (GameState.controlGroups[i]) {
            this.selectUnits(GameState.controlGroups[i]);
          }
        }
      });
    }
    
    // Selection box
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !pointer.middleButtonDown()) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.selectionStart = { x: worldPoint.x, y: worldPoint.y };
        this.isSelecting = true;
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isSelecting && this.selectionStart) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const x = Math.min(this.selectionStart.x, worldPoint.x);
        const y = Math.min(this.selectionStart.y, worldPoint.y);
        const w = Math.abs(worldPoint.x - this.selectionStart.x);
        const h = Math.abs(worldPoint.y - this.selectionStart.y);
        
        this.selectionRect.setPosition(x + w / 2, y + h / 2);
        this.selectionRect.setSize(w, h);
        this.selectionRect.setVisible(true);
      }
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonReleased() && this.isSelecting) {
        this.handleSelection(pointer);
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionRect.setVisible(false);
      }
      
      // Right click - move/attack command
      if (pointer.rightButtonReleased()) {
        this.handleRightClick(pointer);
      }
    });
    
    // Attack move key (A)
    this.input.keyboard!.addKey('A').on('down', () => {
      GameState.mode = 'attack';
    });
    
    // Move key (M)
    this.input.keyboard!.addKey('M').on('down', () => {
      GameState.mode = 'move';
    });
    
    // Stop key (S)
    this.input.keyboard!.addKey('H').on('down', () => {
      // Stop all selected units
      GameState.selectedUnits.forEach(unit => {
        unit.moving = false;
        unit.attacking = false;
        unit.target = null;
        unit.targetX = unit.x;
        unit.targetY = unit.y;
      });
    });
  }
  
  private handleSelection(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Deselect all
    if (!this.input.keyboard!.checkDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT))) {
      GameState.selectedUnits.forEach(u => u.selected = false);
      GameState.selectedUnits = [];
    }
    
    // Box or click selection
    if (this.selectionStart) {
      const minX = Math.min(this.selectionStart.x, worldPoint.x);
      const maxX = Math.max(this.selectionStart.x, worldPoint.x);
      const minY = Math.min(this.selectionStart.y, worldPoint.y);
      const maxY = Math.max(this.selectionStart.y, worldPoint.y);
      
      // If box is small, treat as click
      if (maxX - minX < 10 && maxY - minY < 10) {
        // Click selection - find closest unit
        let closestUnit: GameUnit | null = null;
        let closestDist = 50;
        
        for (const unit of GameState.units) {
          if (unit.isEnemy) continue;
          const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, unit.x, unit.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestUnit = unit;
          }
        }
        
        if (closestUnit) {
          closestUnit.selected = true;
          GameState.selectedUnits.push(closestUnit);
        }
      } else {
        // Box selection
        for (const unit of GameState.units) {
          if (unit.isEnemy) continue;
          if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
            unit.selected = true;
            GameState.selectedUnits.push(unit);
          }
        }
      }
    }
    
    // Emit event for UI
    this.events.emit('selectionChanged', GameState.selectedUnits);
  }
  
  private handleRightClick(pointer: Phaser.Input.Pointer): void {
    if (GameState.selectedUnits.length === 0) return;
    
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Check if clicking on enemy
    let targetEnemy: GameUnit | null = null;
    for (const unit of GameState.units) {
      if (!unit.isEnemy) continue;
      const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, unit.x, unit.y);
      if (dist < 40) {
        targetEnemy = unit;
        break;
      }
    }
    
    // Check if clicking on enemy building
    let targetBuilding: GameBuilding | null = null;
    if (!targetEnemy) {
      for (const building of GameState.buildings) {
        if (!building.isEnemy) continue;
        const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, building.x, building.y);
        if (dist < 60) {
          targetBuilding = building;
          break;
        }
      }
    }
    
    // Issue commands
    if (targetEnemy) {
      // Attack enemy unit
      GameState.selectedUnits.forEach(unit => {
        unit.target = targetEnemy;
        unit.attacking = true;
        unit.moving = true;
        unit.targetX = targetEnemy!.x;
        unit.targetY = targetEnemy!.y;
      });
      this.playEffect('effect_weapon_hit', targetEnemy.x, targetEnemy.y);
    } else if (targetBuilding) {
      // Attack building
      GameState.selectedUnits.forEach(unit => {
        unit.targetX = targetBuilding!.x;
        unit.targetY = targetBuilding!.y;
        unit.attacking = true;
        unit.moving = true;
      });
    } else {
      // Move to location
      const formationSpacing = 40;
      const cols = Math.ceil(Math.sqrt(GameState.selectedUnits.length));
      
      GameState.selectedUnits.forEach((unit, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const offsetX = (col - cols / 2) * formationSpacing;
        const offsetY = (row - Math.floor(GameState.selectedUnits.length / cols) / 2) * formationSpacing;
        
        unit.targetX = worldPoint.x + offsetX;
        unit.targetY = worldPoint.y + offsetY;
        unit.moving = true;
        unit.attacking = false;
        unit.target = null;
      });
      
      // Move command visual
      this.playEffect('effect_magic', worldPoint.x, worldPoint.y);
    }
  }
  
  private selectUnits(units: GameUnit[]): void {
    // Deselect current
    GameState.selectedUnits.forEach(u => u.selected = false);
    GameState.selectedUnits = [];
    
    // Select new
    units.forEach(unit => {
      if (GameState.units.includes(unit)) {
        unit.selected = true;
        GameState.selectedUnits.push(unit);
      }
    });
    
    this.events.emit('selectionChanged', GameState.selectedUnits);
  }
  
  private createStartingUnits(): void {
    const homeIsland = GameState.islands.find(i => i.type === 'home');
    if (!homeIsland) return;
    
    // Create workers
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const dist = 100;
      this.createUnit('worker', 'crusade', homeIsland.x + Math.cos(angle) * dist, homeIsland.y + Math.sin(angle) * dist, false);
    }
    
    // Create warriors
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dist = 150;
      this.createUnit('warrior', 'crusade', homeIsland.x + Math.cos(angle) * dist, homeIsland.y + Math.sin(angle) * dist, false);
    }
    
    // Create archers
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2 + 0.5;
      const dist = 180;
      this.createUnit('archer', 'crusade', homeIsland.x + Math.cos(angle) * dist, homeIsland.y + Math.sin(angle) * dist, false);
    }
    
    // Create hero
    this.createUnit('hero', 'crusade', homeIsland.x, homeIsland.y - 80, false, true);
    
    console.log(`[GameScene] Created ${GameState.units.length} starting units`);
  }
  
  private spawnEnemyUnits(): void {
    const enemyIslands = GameState.islands.filter(i => i.ownership === 'enemy' || i.ownership === 'hostile');
    
    enemyIslands.forEach(island => {
      const unitCount = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < unitCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 100;
        const x = island.x + Math.cos(angle) * dist;
        const y = island.y + Math.sin(angle) * dist;
        
        // Random enemy type
        const types = ['goblin', 'orc', 'slime'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.createUnit(type, 'goblin', x, y, true);
      }
    });
  }
  
  private createUnit(type: string, faction: string, x: number, y: number, isEnemy: boolean, isHero: boolean = false): GameUnit {
    const config = UNIT_CONFIGS[type] || MONSTER_CONFIGS[type] || UNIT_CONFIGS.warrior;
    
    const unit: GameUnit = {
      id: GameState.unitIdCounter++,
      type,
      x,
      y,
      targetX: x,
      targetY: y,
      hp: config.hp,
      maxHp: config.hp,
      attack: config.attack,
      speed: config.speed,
      faction,
      isHero,
      isEnemy,
      selected: false,
      moving: false,
      attacking: false,
      target: null,
      gathering: null,
      level: 1,
    };
    
    GameState.units.push(unit);
    
    // Create sprite
    this.createUnitSprite(unit);
    
    return unit;
  }
  
  private createUnitSprite(unit: GameUnit): void {
    // Try faction-specific sprite first with correct mappings
    let spriteKey = '';
    const faction = unit.faction as Faction;

    if (unit.isHero) {
      spriteKey = `champion_neutral_Gangblanc`; // Default hero
    } else if (unit.type === 'worker') {
      spriteKey = `worker_${faction}`;
    } else if (unit.type === 'warrior') {
      spriteKey = `melee_swordsman_${faction}`;
    } else if (unit.type === 'archer') {
      spriteKey = `ranged_${faction}`;
    } else if (unit.type === 'lancer') {
      spriteKey = `melee_spearman_${faction}`; // best MiniWorld proxy
    } else if (unit.type === 'monk') {
      spriteKey = `ranged_${faction}`; // proxy visuals
    } else {
      // Monster type
      const monsterMap: Record<string, string> = {
        goblin: 'monster_goblin_club',
        orc: 'monster_orc',
        slime: 'monster_slime',
        demon: 'monster_demon_red',
        dragon: 'monster_dragon_red',
      };
      spriteKey = monsterMap[unit.type] || 'monster_slime';
    }

    let sprite: any;

    if (this.textures.exists(spriteKey)) {
      const s = this.add.sprite(unit.x, unit.y, spriteKey)
        .setScale(2)
        .setDepth(10);

      // Play idle animation if available and this GameObject supports animations
      const idleAnim = `${spriteKey}_idle`;
      if ((s as any).play && this.anims.exists(idleAnim)) {
        (s as any).play(idleAnim);
      }
      sprite = s as any;
    } else {
      // Fallback to colored circle with emoji
      const config = UNIT_CONFIGS[unit.type] || MONSTER_CONFIGS[unit.type];
      const color = unit.isEnemy ? 0xff0000 : 0x00ff00;

      const circle = this.add.circle(unit.x, unit.y, 16, color, 0.8)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(10);

      if (config) {
        this.add.text(unit.x, unit.y, config.emoji, {
          fontSize: '16px',
        }).setOrigin(0.5).setDepth(11);
      }

      sprite = circle as any;
    }

    this.unitSprites.set(unit.id, sprite as any);
    this.unitGroup.add(sprite as any);

    // Create health bar
    this.createHealthBar(unit.id, unit.x, unit.y - 25, unit.hp, unit.maxHp, unit.isEnemy);
  }
  
  private createHealthBar(entityId: number, x: number, y: number, hp: number, maxHp: number, isEnemy: boolean): void {
    const graphics = this.add.graphics().setDepth(15);
    this.healthBars.set(entityId, graphics);
    this.updateHealthBar(entityId, x, y, hp, maxHp, isEnemy);
  }
  
  private updateHealthBar(entityId: number, x: number, y: number, hp: number, maxHp: number, isEnemy: boolean): void {
    const graphics = this.healthBars.get(entityId);
    if (!graphics) return;
    
    graphics.clear();
    
    const width = 30;
    const height = 4;
    const hpPercent = hp / maxHp;
    
    // Background
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(x - width / 2, y, width, height);
    
    // Health
    const hpColor = isEnemy ? 0xff0000 : (hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.25 ? 0xffff00 : 0xff0000));
    graphics.fillStyle(hpColor, 1);
    graphics.fillRect(x - width / 2, y, width * hpPercent, height);
  }
  
  private playEffect(effectKey: string, x: number, y: number): void {
    const animKey = `${effectKey}_anim`;
    
    if (this.anims.exists(animKey)) {
      const effect = this.add.sprite(x, y, effectKey)
        .setScale(0.5)
        .setDepth(20);
      
      effect.play(animKey);
      effect.once('animationcomplete', () => {
        effect.destroy();
      });
    }
  }
  
  update(time: number, delta: number): void {
    // Reset idle timer on any input
    if (this.input.activePointer.isDown || this.cursors.left.isDown || this.cursors.right.isDown) {
      GameState.resetIdleTimer();
    } else {
      GameState.updateIdleTimer(delta);
    }
    
    // Camera movement
    this.updateCamera(delta);
    
    // Update units
    this.updateUnits(delta);
    
    // Update combat
    this.updateCombat(delta);
    
    // Update resource gathering
    this.updateGathering(delta);
    
    // Auto-attack for towers
    this.updateTowers(delta);
  }
  
  private updateCamera(delta: number): void {
    const cam = this.cameras.main;
    const speed = this.cameraSpeed / cam.zoom;
    const dt = delta / 1000;
    
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      cam.scrollX -= speed * dt;
    }
    if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      cam.scrollX += speed * dt;
    }
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      cam.scrollY -= speed * dt;
    }
    if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      cam.scrollY += speed * dt;
    }
  }
  
  private updateUnits(delta: number): void {
    const dt = delta / 1000;
    
    for (const unit of GameState.units) {
      if (unit.hp <= 0) continue;
      
      const sprite = this.unitSprites.get(unit.id);
      if (!sprite) continue;
      
      // Movement
      if (unit.moving) {
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          const moveSpeed = unit.speed * dt;
          unit.x += (dx / dist) * moveSpeed;
          unit.y += (dy / dist) * moveSpeed;

          // Flip sprite based on direction (if supported)
          if (typeof (sprite as any).setFlipX === 'function') {
            (sprite as any).setFlipX(dx < 0);
          }

          // Play walk animation (if supported)
          const baseKey = (sprite as any).texture?.key;
          const walkAnim = baseKey ? `${baseKey}_walk` : '';
          if ((sprite as any).play && walkAnim && this.anims.exists(walkAnim)) {
            const current = (sprite as any).anims?.currentAnim?.key;
            if (current !== walkAnim) (sprite as any).play(walkAnim);
          }
        } else {
          unit.moving = false;

          // Play idle animation (if supported)
          const baseKey = (sprite as any).texture?.key;
          const idleAnim = baseKey ? `${baseKey}_idle` : '';
          if ((sprite as any).play && idleAnim && this.anims.exists(idleAnim)) {
            (sprite as any).play(idleAnim);
          }
        }
      }
      
      // Update sprite position
      sprite.setPosition(unit.x, unit.y);
      
      // Selection indicator (guard for shapes)
      // Check if this is a Sprite (has texture) vs Shape (Arc/Circle)
      const isSprite = sprite instanceof Phaser.GameObjects.Sprite;
      
      if (unit.selected) {
        if (isSprite) {
          (sprite as Phaser.GameObjects.Sprite).setTint(0x00ff00);
        } else if (typeof (sprite as any).setStrokeStyle === 'function') {
          (sprite as any).setStrokeStyle(3, 0x00ff00);
        }
      } else {
        if (isSprite) {
          (sprite as Phaser.GameObjects.Sprite).clearTint();
        } else if (typeof (sprite as any).setStrokeStyle === 'function') {
          (sprite as any).setStrokeStyle(2, 0xffffff);
        }
      }
      
      // Update health bar
      this.updateHealthBar(unit.id, unit.x, unit.y - 25, unit.hp, unit.maxHp, unit.isEnemy);
    }
    
    // Remove dead units
    const deadUnits = GameState.units.filter(u => u.hp <= 0);
    deadUnits.forEach(unit => {
      this.playEffect('effect_explosion', unit.x, unit.y);
      
      const sprite = this.unitSprites.get(unit.id);
      if (sprite) sprite.destroy();
      this.unitSprites.delete(unit.id);
      
      const healthBar = this.healthBars.get(unit.id);
      if (healthBar) healthBar.destroy();
      this.healthBars.delete(unit.id);
      
      // Remove from selection
      GameState.selectedUnits = GameState.selectedUnits.filter(u => u.id !== unit.id);
    });
    
    GameState.units = GameState.units.filter(u => u.hp > 0);
  }
  
  private updateCombat(delta: number): void {
    const dt = delta / 1000;
    
    for (const unit of GameState.units) {
      if (!unit.attacking || !unit.target) continue;
      
      const target = unit.target;
      if (target.hp <= 0) {
        unit.attacking = false;
        unit.target = null;
        continue;
      }
      
      const dist = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
      const config = UNIT_CONFIGS[unit.type] || MONSTER_CONFIGS[unit.type] || UNIT_CONFIGS.warrior;
      
      if (dist <= config.attackRange) {
        // In range - attack
        unit.moving = false;
        
        // Deal damage (simplified - would normally use attack cooldown)
        const damage = unit.attack * dt;
        target.hp -= damage;
        
        // Play attack animation (if supported)
        const sprite = this.unitSprites.get(unit.id) as any;
        const baseKey = sprite?.texture?.key;
        const attackAnim = baseKey ? `${baseKey}_attack` : '';
        if (sprite && sprite.play && attackAnim && this.anims.exists(attackAnim)) {
          const current = sprite.anims?.currentAnim?.key;
          if (current !== attackAnim) sprite.play(attackAnim);
        }
      } else {
        // Move towards target
        unit.targetX = target.x;
        unit.targetY = target.y;
        unit.moving = true;
      }
    }
    
    // Auto-aggro for enemy units
    for (const enemy of GameState.units.filter(u => u.isEnemy)) {
      if (enemy.target && enemy.target.hp > 0) continue;
      
      // Find nearby player units
      let closestPlayer: GameUnit | null = null;
      let closestDist = 300;
      
      for (const player of GameState.units.filter(u => !u.isEnemy)) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestPlayer = player;
        }
      }
      
      if (closestPlayer) {
        enemy.target = closestPlayer;
        enemy.attacking = true;
        enemy.moving = true;
        enemy.targetX = closestPlayer.x;
        enemy.targetY = closestPlayer.y;
      }
    }
  }
  
  private updateGathering(delta: number): void {
    const dt = delta / 1000;
    
    for (const unit of GameState.units) {
      if (unit.type !== 'worker' || unit.isEnemy || !unit.gathering) continue;
      
      const resource = unit.gathering;
      const dist = Phaser.Math.Distance.Between(unit.x, unit.y, resource.x, resource.y);
      
      if (dist < 30) {
        // Gather
        const gatherRate = 20 * dt;
        const gathered = Math.min(gatherRate, resource.amount);
        resource.amount -= gathered;
        
        // Add to player resources
        const resourceType = resource.type as keyof typeof GameState.resources;
        if (GameState.resources[resourceType] !== undefined) {
          GameState.resources[resourceType] += gathered;
        }
        
        if (resource.amount <= 0) {
          unit.gathering = null;
          unit.moving = false;
        }
      } else {
        // Move to resource
        unit.targetX = resource.x;
        unit.targetY = resource.y;
        unit.moving = true;
      }
    }
  }
  
  private updateTowers(delta: number): void {
    const dt = delta / 1000;
    
    for (const building of GameState.buildings) {
      if (building.type !== 'tower') continue;
      
      // Find enemy target
      let target: GameUnit | null = null;
      let minDist = 300;
      
      const enemies = building.isEnemy 
        ? GameState.units.filter(u => !u.isEnemy) 
        : GameState.units.filter(u => u.isEnemy);
      
      for (const enemy of enemies) {
        const dist = Phaser.Math.Distance.Between(building.x, building.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
      
      if (target) {
        // Deal damage
        target.hp -= 15 * dt;
        
        // Visual effect occasionally
        if (Math.random() < 0.05) {
          this.playEffect('effect_weapon_hit', target.x, target.y);
        }
      }
    }
  }
  
  // Public method for UI to call
  public trainUnit(unitType: string): void {
    const homeIsland = GameState.islands.find(i => i.type === 'home');
    if (!homeIsland) return;
    
    const config = UNIT_CONFIGS[unitType];
    if (!config) return;
    
    // Check resources
    if (GameState.resources.gold < config.cost.gold) return;
    if (config.cost.food && GameState.resources.food < config.cost.food) return;
    
    // Deduct resources
    GameState.resources.gold -= config.cost.gold;
    if (config.cost.food) GameState.resources.food -= config.cost.food;
    
    // Create unit
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 50;
    const x = homeIsland.x + Math.cos(angle) * dist;
    const y = homeIsland.y + Math.sin(angle) * dist;
    
    this.createUnit(unitType, 'crusade', x, y, false);
    
    console.log(`[GameScene] Trained ${unitType}`);
  }
  
  // Public method for building placement
  public placeBuilding(buildingType: string, x: number, y: number): boolean {
    const config = BUILDING_CONFIGS[buildingType];
    if (!config) return false;
    
    // Check resources
    if (GameState.resources.gold < config.cost.gold) return false;
    if (config.cost.wood && GameState.resources.wood < config.cost.wood) return false;
    if (config.cost.stone && GameState.resources.stone < config.cost.stone) return false;
    
    // Find island at position
    let targetIsland: GameIsland | null = null;
    for (const island of GameState.islands) {
      const dist = Phaser.Math.Distance.Between(x, y, island.x, island.y);
      if (dist < (island.radius || 300)) {
        targetIsland = island;
        break;
      }
    }
    
    if (!targetIsland || targetIsland.ownership !== 'player') return false;
    
    // Deduct resources
    GameState.resources.gold -= config.cost.gold;
    if (config.cost.wood) GameState.resources.wood -= config.cost.wood;
    if (config.cost.stone) GameState.resources.stone -= config.cost.stone;
    
    // Create building
    const building: GameBuilding = {
      id: GameState.buildingIdCounter++,
      type: buildingType,
      x,
      y,
      islandId: targetIsland.id,
      hp: config.hp,
      maxHp: config.hp,
      faction: 'crusade',
      isEnemy: false,
    };
    
    targetIsland.buildings.push(building);
    GameState.buildings.push(building);
    this.renderBuilding(building, targetIsland);
    
    console.log(`[GameScene] Placed ${buildingType}`);
    return true;
  }
}
