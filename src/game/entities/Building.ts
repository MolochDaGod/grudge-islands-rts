// ============================================
// BUILDING SYSTEM
// Hero can build towers, walls, buildings on owned islands
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { Building, BuildingType, Island } from '../../types/world.ts';
import { BUILDING_DEFINITIONS } from '../../types/world.ts';
import { generateId } from '../core/GridSystem.ts';
import { getTinySwordsBuildingPath, gameToTinySwordsFaction } from '../../data/miniWorldSprites.ts';

// === BUILD MENU STATE ===

export interface BuildMenuState {
  isOpen: boolean;
  selectedBuilding: BuildingType | null;
  canBuild: boolean;
  placementValid: boolean;
  placementPosition: Position | null;
  currentIsland: Island | null;
}

export class BuildingManager {
  private buildings: Map<string, Building> = new Map();
  private buildingSprites: Map<string, HTMLImageElement> = new Map();
  private menuState: BuildMenuState = {
    isOpen: false,
    selectedBuilding: null,
    canBuild: false,
    placementValid: false,
    placementPosition: null,
    currentIsland: null
  };
  
  constructor() {
    this.loadSprites();
  }
  
  private async loadSprites(): Promise<void> {
    const factions = ['crusade', 'goblin', 'legion', 'fabled'] as const;
    const buildingTypes = ['castle', 'barracks', 'archery', 'tower', 'monastery', 'house1', 'house2', 'house3'];
    
    for (const faction of factions) {
      for (const type of buildingTypes) {
        const path = getTinySwordsBuildingPath(faction, type);
        if (path) {
          const img = new Image();
          img.onload = () => {
            this.buildingSprites.set(`${faction}-${type}`, img);
          };
          img.onerror = () => {
            console.warn(`Failed to load building sprite: ${path}`);
          };
          img.src = path;
        }
      }
    }
  }
  
  private getBuildingSprite(owner: FactionId, buildingType: string): HTMLImageElement | null {
    const faction = gameToTinySwordsFaction(owner);
    // Map game building types to Tiny Swords types
    const typeMap: Record<string, string> = {
      'tower': 'tower',
      'wall': 'house1', // Use house as placeholder for walls
      'barracks': 'barracks',
      'armory': 'monastery',
      'shrine': 'monastery',
      'watchtower': 'archery'
    };
    const tinySwordsType = typeMap[buildingType] || 'house1';
    return this.buildingSprites.get(`${faction}-${tinySwordsType}`) || null;
  }
  
  // === BUILD MENU ===
  
  /**
   * Toggle build menu (B hotkey)
   */
  toggleBuildMenu(heroIsland: Island | null): void {
    if (this.menuState.isOpen) {
      this.closeBuildMenu();
    } else {
      this.openBuildMenu(heroIsland);
    }
  }
  
  openBuildMenu(heroIsland: Island | null): void {
    this.menuState.isOpen = true;
    this.menuState.currentIsland = heroIsland;
    this.menuState.canBuild = this.canBuildOnIsland(heroIsland);
    this.menuState.selectedBuilding = null;
    this.menuState.placementValid = false;
  }
  
  closeBuildMenu(): void {
    this.menuState.isOpen = false;
    this.menuState.selectedBuilding = null;
    this.menuState.placementValid = false;
    this.menuState.placementPosition = null;
  }
  
  /**
   * Check if player can build on this island
   * Must own the island (destroyed enemy camp, built own camp)
   */
  canBuildOnIsland(island: Island | null): boolean {
    if (!island) return false;
    if (island.owner !== 1) return false; // Not player owned
    if (!island.camp || island.camp.owner !== 1) return false;
    return true;
  }
  
  /**
   * Select a building type to place
   */
  selectBuilding(type: BuildingType): void {
    if (!this.menuState.isOpen) return;
    
    const def = BUILDING_DEFINITIONS[type];
    const island = this.menuState.currentIsland;
    
    // Check if unlocked
    if (island?.camp && def.unlockRequirement && island.camp.level < def.unlockRequirement) {
      console.log(`Building ${type} requires camp level ${def.unlockRequirement}`);
      return;
    }
    
    this.menuState.selectedBuilding = type;
  }
  
  /**
   * Update placement preview position
   */
  updatePlacementPosition(worldX: number, worldY: number, checkBuildable: (x: number, y: number) => boolean): void {
    if (!this.menuState.selectedBuilding) return;
    
    this.menuState.placementPosition = { x: worldX, y: worldY };
    
    // Check if position is valid
    const def = BUILDING_DEFINITIONS[this.menuState.selectedBuilding];
    this.menuState.placementValid = this.isValidPlacement(worldX, worldY, def.size, checkBuildable);
  }
  
  /**
   * Check if placement is valid
   */
  private isValidPlacement(
    x: number, 
    y: number, 
    size: number,
    checkBuildable: (x: number, y: number) => boolean
  ): boolean {
    // Check corners and center
    const points = [
      { x, y },
      { x: x - size, y: y - size },
      { x: x + size, y: y - size },
      { x: x - size, y: y + size },
      { x: x + size, y: y + size }
    ];
    
    for (const p of points) {
      if (!checkBuildable(p.x, p.y)) return false;
    }
    
    // Check no collision with other buildings
    for (const building of this.buildings.values()) {
      const dist = Math.hypot(building.position.x - x, building.position.y - y);
      const minDist = BUILDING_DEFINITIONS[building.type].size + size + 5;
      if (dist < minDist) return false;
    }
    
    return true;
  }
  
  /**
   * Attempt to place building
   */
  placeBuilding(owner: FactionId): Building | null {
    if (!this.menuState.selectedBuilding) return null;
    if (!this.menuState.placementValid) return null;
    if (!this.menuState.placementPosition) return null;
    if (!this.menuState.currentIsland) return null;
    
    const type = this.menuState.selectedBuilding;
    const def = BUILDING_DEFINITIONS[type];
    const pos = this.menuState.placementPosition;
    
    const building: Building = {
      id: generateId(),
      type,
      islandId: this.menuState.currentIsland.id,
      position: { ...pos },
      owner,
      health: def.health,
      maxHealth: def.health,
      isConstructing: true,
      constructionProgress: 0,
      rotation: 0
    };
    
    this.buildings.set(building.id, building);
    this.menuState.currentIsland.buildings.push(building);
    
    // Close menu after placing
    this.closeBuildMenu();
    
    return building;
  }
  
  // === BUILDING UPDATES ===
  
  /**
   * Update all buildings (construction progress, tower attacks)
   */
  update(deltaTime: number): { attacks: { buildingId: string; targetId: string; damage: number }[] } {
    const attacks: { buildingId: string; targetId: string; damage: number }[] = [];
    
    for (const building of this.buildings.values()) {
      if (building.isConstructing) {
        this.updateConstruction(building, deltaTime);
      }
      
      // Tower attacks handled by combat system
    }
    
    return { attacks };
  }
  
  private updateConstruction(building: Building, deltaTime: number): void {
    const def = BUILDING_DEFINITIONS[building.type];
    const progressPerSecond = 100 / def.buildTime;
    
    building.constructionProgress += progressPerSecond * deltaTime;
    
    if (building.constructionProgress >= 100) {
      building.constructionProgress = 100;
      building.isConstructing = false;
    }
  }
  
  /**
   * Damage a building
   */
  damageBuilding(buildingId: string, damage: number): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;
    
    building.health -= damage;
    
    if (building.health <= 0) {
      this.destroyBuilding(buildingId);
      return true; // Building destroyed
    }
    
    return false;
  }
  
  /**
   * Destroy a building
   */
  private destroyBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (!building) return;
    
    this.buildings.delete(buildingId);
    // TODO: Remove from island.buildings array
  }
  
  // === GETTERS ===
  
  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }
  
  getBuildingsOnIsland(islandId: string): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.islandId === islandId);
  }
  
  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }
  
  getTowers(owner: FactionId): Building[] {
    return Array.from(this.buildings.values()).filter(
      b => b.owner === owner && b.type === 'tower' && !b.isConstructing
    );
  }
  
  getMenuState(): BuildMenuState {
    return this.menuState;
  }
  
  // === RENDERING ===
  
  /**
   * Render all buildings
   */
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    gameTime: number
  ): void {
    for (const building of this.buildings.values()) {
      this.renderBuilding(ctx, building, cameraX, cameraY, gameTime);
    }
  }
  
  private renderBuilding(
    ctx: CanvasRenderingContext2D,
    building: Building,
    cameraX: number,
    cameraY: number,
    gameTime: number
  ): void {
    const x = building.position.x - cameraX;
    const y = building.position.y - cameraY;
    const def = BUILDING_DEFINITIONS[building.type];
    const size = def.size;
    
    // Try to use Tiny Swords sprite
    const sprite = this.getBuildingSprite(building.owner, building.type);
    
    ctx.save();
    ctx.translate(x, y);
    
    // Construction scaffold
    if (building.isConstructing) {
      ctx.globalAlpha = 0.5 + Math.sin(gameTime * 5) * 0.2;
    }
    
    if (sprite && sprite.complete) {
      // Draw sprite centered on position, scaled appropriately
      const scale = (size * 2) / Math.max(sprite.width, sprite.height);
      const drawW = sprite.width * scale;
      const drawH = sprite.height * scale;
      ctx.drawImage(sprite, -drawW / 2, -drawH + size * 0.5, drawW, drawH);
    } else {
      // Fallback to simple shapes
      switch (building.type) {
        case 'tower':
          this.renderTower(ctx, building, size);
          break;
        case 'wall':
          this.renderWall(ctx, building, size);
          break;
        case 'barracks':
          this.renderBarracks(ctx, building, size);
          break;
        default:
          this.renderGenericBuilding(ctx, building, size);
      }
    }
    
    ctx.restore();
    
    // Construction progress bar
    if (building.isConstructing) {
      const barWidth = size * 2;
      const barHeight = 6;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y + size + 10, barWidth, barHeight);
      
      ctx.fillStyle = '#ff0';
      ctx.fillRect(x - barWidth / 2, y + size + 10, barWidth * (building.constructionProgress / 100), barHeight);
    }
    
    // Health bar (if damaged)
    if (!building.isConstructing && building.health < building.maxHealth) {
      const barWidth = size * 2;
      const barHeight = 4;
      const healthPercent = building.health / building.maxHealth;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y + size + 5, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : '#a44';
      ctx.fillRect(x - barWidth / 2, y + size + 5, barWidth * healthPercent, barHeight);
    }
  }
  
  private renderTower(ctx: CanvasRenderingContext2D, building: Building, size: number): void {
    const factionColor = building.owner === 1 ? '#00aaff' : building.owner === 2 ? '#ff4444' : '#888';
    
    // Tower base
    ctx.fillStyle = '#555';
    ctx.fillRect(-size, -size * 0.5, size * 2, size * 1.5);
    
    // Tower body
    ctx.fillStyle = '#777';
    ctx.fillRect(-size * 0.7, -size * 1.5, size * 1.4, size * 2);
    
    // Battlements
    ctx.fillStyle = '#666';
    for (let i = 0; i < 4; i++) {
      const bx = -size * 0.7 + (i * size * 0.5);
      ctx.fillRect(bx, -size * 1.7, size * 0.3, size * 0.3);
    }
    
    // Flag
    ctx.fillStyle = factionColor;
    ctx.fillRect(0, -size * 2.5, size * 0.8, size * 0.5);
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(-2, -size * 2.5, 4, size * 1);
  }
  
  private renderWall(ctx: CanvasRenderingContext2D, _building: Building, size: number): void {
    ctx.fillStyle = '#666';
    ctx.fillRect(-size, -size * 0.3, size * 2, size * 0.6);
    
    // Stone texture
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-size + i * size * 0.5, -size * 0.3);
      ctx.lineTo(-size + i * size * 0.5, size * 0.3);
      ctx.stroke();
    }
  }
  
  private renderBarracks(ctx: CanvasRenderingContext2D, building: Building, size: number): void {
    const factionColor = building.owner === 1 ? '#00aaff' : building.owner === 2 ? '#ff4444' : '#888';
    
    // Main building
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-size, -size * 0.8, size * 2, size * 1.6);
    
    // Roof
    ctx.fillStyle = factionColor;
    ctx.beginPath();
    ctx.moveTo(-size * 1.1, -size * 0.8);
    ctx.lineTo(0, -size * 1.4);
    ctx.lineTo(size * 1.1, -size * 0.8);
    ctx.closePath();
    ctx.fill();
    
    // Door
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 1.1);
  }
  
  private renderGenericBuilding(ctx: CanvasRenderingContext2D, building: Building, size: number): void {
    const factionColor = building.owner === 1 ? '#00aaff' : building.owner === 2 ? '#ff4444' : '#888';
    
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(-size, -size, size * 2, size * 2);
    
    ctx.fillStyle = factionColor;
    ctx.fillRect(-size * 0.8, -size * 0.8, size * 1.6, size * 0.3);
  }
  
  /**
   * Render build menu UI
   */
  renderBuildMenu(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.menuState.isOpen) return;
    
    const menuWidth = 300;
    const menuHeight = 250;
    const menuX = screenWidth / 2 - menuWidth / 2;
    const menuY = screenHeight / 2 - menuHeight / 2;
    
    // Background
    ctx.fillStyle = 'rgba(20, 26, 43, 0.95)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.strokeStyle = this.menuState.canBuild ? '#6ee7b7' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔨 Build Menu (B)', menuX + menuWidth / 2, menuY + 30);
    
    if (!this.menuState.canBuild) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px sans-serif';
      ctx.fillText('Must capture island first!', menuX + menuWidth / 2, menuY + 60);
      ctx.fillText('Press B to close', menuX + menuWidth / 2, menuY + 80);
      return;
    }
    
    // Building options
    const buildings: { type: BuildingType; icon: string; hotkey: string }[] = [
      { type: 'tower', icon: '🗼', hotkey: '1' },
      { type: 'wall', icon: '🧱', hotkey: '2' },
      { type: 'barracks', icon: '⚔️', hotkey: '3' },
      { type: 'watchtower', icon: '👁️', hotkey: '4' },
      { type: 'armory', icon: '🛡️', hotkey: '5' },
      { type: 'shrine', icon: '⛩️', hotkey: '6' }
    ];
    
    const campLevel = this.menuState.currentIsland?.camp?.level ?? 0;
    
    let y = menuY + 70;
    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];
      const unlocked = !def.unlockRequirement || campLevel >= def.unlockRequirement;
      const selected = this.menuState.selectedBuilding === b.type;
      
      // Button background
      ctx.fillStyle = selected ? 'rgba(110, 231, 183, 0.3)' : 
                      unlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(menuX + 10, y, menuWidth - 20, 25);
      
      if (selected) {
        ctx.strokeStyle = '#6ee7b7';
        ctx.strokeRect(menuX + 10, y, menuWidth - 20, 25);
      }
      
      // Icon and name
      ctx.fillStyle = unlocked ? '#fff' : '#666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${b.icon} [${b.hotkey}] ${def.name}`, menuX + 20, y + 17);
      
      // Cost
      ctx.textAlign = 'right';
      ctx.fillText(`${def.cost}g`, menuX + menuWidth - 20, y + 17);
      
      y += 28;
    }
    
    // Instructions
    ctx.fillStyle = '#a5b4d0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select building then click to place', menuX + menuWidth / 2, menuY + menuHeight - 20);
  }
  
  /**
   * Render placement preview
   */
  renderPlacementPreview(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    if (!this.menuState.selectedBuilding) return;
    if (!this.menuState.placementPosition) return;
    
    const pos = this.menuState.placementPosition;
    const x = pos.x - cameraX;
    const y = pos.y - cameraY;
    const def = BUILDING_DEFINITIONS[this.menuState.selectedBuilding];
    const size = def.size;
    
    // Placement circle
    ctx.beginPath();
    ctx.arc(x, y, size + 5, 0, Math.PI * 2);
    ctx.strokeStyle = this.menuState.placementValid ? '#6ee7b7' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Building preview
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.menuState.placementValid ? '#6ee7b7' : '#ef4444';
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.globalAlpha = 1;
    
    // Range circle for towers
    if (this.menuState.selectedBuilding === 'tower' && def.attackRange) {
      ctx.beginPath();
      ctx.arc(x, y, def.attackRange, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
