// ============================================
// RENDERER
// Dual-canvas rendering with camera, zoom, selection
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import { GridSystem, EntitySystem } from '../core/GridSystem.ts';
import { spriteRenderer, type UnitAnimState } from './TinySwordsSprites.ts';
import type { TerrainRenderer } from './TerrainRenderer.ts';
import type { BoatManager } from '../entities/Boat.ts';
import type { BuildingManager } from '../entities/Building.ts';
import type { TowerManager } from '../entities/TowerSystem.ts';
import type { EffectsManager } from '../systems/EffectsManager.ts';
import type { Hero } from '../entities/Hero.ts';
import { WORLD_CONFIG } from '../world/WorldGenerator.ts';

// Faction colors
const FACTION_COLORS: Record<number, string> = {
  0: '#888888', // Neutral
  1: '#0066FF', // Player (Blue)
  2: '#FF0000', // Goblin (Red)
  3: '#00FF00', // Ally (Green)
  4: '#FFAA00', // Enemy 2 (Orange)
};

export class Renderer {
  // Canvas contexts
  private bgCtx: CanvasRenderingContext2D;
  private fgCtx: CanvasRenderingContext2D;
  private uiCtx: CanvasRenderingContext2D;
  private minimapCtx: CanvasRenderingContext2D;
  
  // Screen dimensions
  private screenWidth: number;
  private screenHeight: number;
  
  // Camera state
  private cameraX: number = 0;
  private cameraY: number = 0;
  private zoomLevel: number = 1;
  private minZoom: number = 0.25;
  private maxZoom: number = 2;
  
  // Selection state
  private isSelecting: boolean = false;
  private selectionStart: Position = { x: 0, y: 0 };
  private selectionEnd: Position = { x: 0, y: 0 };
  private selectedEntityIds: Set<string> = new Set();
  
  // Mouse state
  private mouseX: number = 0;
  private mouseY: number = 0;
  
  // Grid systems reference
  private entitySystem: EntitySystem;
  
  // Cached background (only redraw when camera moves)
  private bgDirty: boolean = true;
  
  constructor(
    bgCanvas: HTMLCanvasElement,
    fgCanvas: HTMLCanvasElement,
    uiCanvas: HTMLCanvasElement,
    _locationGrid: GridSystem,
    entitySystem: EntitySystem
  ) {
    this.bgCtx = bgCanvas.getContext('2d')!;
    this.fgCtx = fgCanvas.getContext('2d')!;
    this.uiCtx = uiCanvas.getContext('2d')!;
    
    const minimapCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement;
    this.minimapCtx = minimapCanvas.getContext('2d')!;
    
    this.screenWidth = bgCanvas.width;
    this.screenHeight = bgCanvas.height;
    
    // Store reference to entity system for queries
    this.entitySystem = entitySystem;
  }
  
  /**
   * Handle window resize
   */
  onResize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.bgDirty = true;
  }
  
  /**
   * Set camera position directly
   */
  setCameraPosition(x: number, y: number): void {
    this.cameraX = this.clampCameraX(x);
    this.cameraY = this.clampCameraY(y);
    this.bgDirty = true;
  }
  
  /**
   * Pan camera by delta
   */
  panCamera(dx: number, dy: number): void {
    this.cameraX = this.clampCameraX(this.cameraX + dx / this.zoomLevel);
    this.cameraY = this.clampCameraY(this.cameraY + dy / this.zoomLevel);
    this.bgDirty = true;
  }
  
  /**
   * Zoom camera around a point
   */
  zoom(delta: number, centerX: number, centerY: number): void {
    const oldZoom = this.zoomLevel;
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    
    // Adjust camera to zoom toward mouse position
    if (oldZoom !== this.zoomLevel) {
      const worldX = this.screenToWorldX(centerX);
      const worldY = this.screenToWorldY(centerY);
      
      this.cameraX = worldX - (centerX / this.zoomLevel);
      this.cameraY = worldY - (centerY / this.zoomLevel);
      
      this.cameraX = this.clampCameraX(this.cameraX);
      this.cameraY = this.clampCameraY(this.cameraY);
      this.bgDirty = true;
    }
  }
  
  private clampCameraX(x: number): number {
    const maxX = WORLD_CONFIG.width - this.screenWidth / this.zoomLevel;
    return Math.max(0, Math.min(maxX, x));
  }
  
  private clampCameraY(y: number): number {
    const maxY = WORLD_CONFIG.height - this.screenHeight / this.zoomLevel;
    return Math.max(0, Math.min(maxY, y));
  }
  
  // === COORDINATE CONVERSION ===
  
  screenToWorldX(screenX: number): number {
    return this.cameraX + screenX / this.zoomLevel;
  }
  
  screenToWorldY(screenY: number): number {
    return this.cameraY + screenY / this.zoomLevel;
  }
  
  worldToScreenX(worldX: number): number {
    return (worldX - this.cameraX) * this.zoomLevel;
  }
  
  worldToScreenY(worldY: number): number {
    return (worldY - this.cameraY) * this.zoomLevel;
  }
  
  // === SELECTION ===
  
  startSelection(screenX: number, screenY: number): void {
    this.isSelecting = true;
    this.selectionStart = { x: screenX, y: screenY };
    this.selectionEnd = { x: screenX, y: screenY };
  }
  
  updateMousePosition(screenX: number, screenY: number): void {
    this.mouseX = screenX;
    this.mouseY = screenY;
    
    if (this.isSelecting) {
      this.selectionEnd = { x: screenX, y: screenY };
    }
  }
  
  endSelection(screenX: number, screenY: number): void {
    if (!this.isSelecting) return;
    
    this.selectionEnd = { x: screenX, y: screenY };
    this.isSelecting = false;
    
    // Calculate selection box in world coordinates
    const x1 = this.screenToWorldX(Math.min(this.selectionStart.x, this.selectionEnd.x));
    const y1 = this.screenToWorldY(Math.min(this.selectionStart.y, this.selectionEnd.y));
    const x2 = this.screenToWorldX(Math.max(this.selectionStart.x, this.selectionEnd.x));
    const y2 = this.screenToWorldY(Math.max(this.selectionStart.y, this.selectionEnd.y));
    
    // Find entities in selection box
    this.selectedEntityIds.clear();
    
    // Query entities in selection area
    const entities = this.entitySystem.getEntitiesInRect(x1, y1, x2 - x1, y2 - y1);
    
    for (const entity of entities) {
      // Only select player units (faction 1)
      if (entity.faction === 1) {
        this.selectedEntityIds.add(entity.id);
      }
    }
  }
  
  issueCommand(screenX: number, screenY: number): void {
    if (this.selectedEntityIds.size === 0) return;
    
    const worldX = this.screenToWorldX(screenX);
    const worldY = this.screenToWorldY(screenY);
    
    // TODO: Set destination for selected units
    console.log(`Move command to (${worldX.toFixed(0)}, ${worldY.toFixed(0)}) for ${this.selectedEntityIds.size} units`);
  }
  
  // === RENDERING ===
  
  render(deltaTime: number, gameTime: number): void {
    // Clear canvases
    this.fgCtx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    this.uiCtx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    
    // Render background (terrain grid)
    if (this.bgDirty) {
      this.renderBackground();
      this.bgDirty = false;
    }
    
    // Apply camera transform to foreground
    this.fgCtx.save();
    this.fgCtx.scale(this.zoomLevel, this.zoomLevel);
    this.fgCtx.translate(-this.cameraX, -this.cameraY);
    
    // Render entities
    this.renderEntities(deltaTime, gameTime);
    
    this.fgCtx.restore();
    
    // Render UI elements (no camera transform)
    this.renderUI();
    
    // Render minimap
    this.renderMinimap();
  }
  
  /**
   * Render with full terrain, boats, buildings, towers, and effects
   */
  renderWithTerrain(
    deltaTime: number,
    gameTime: number,
    terrainRenderer: TerrainRenderer,
    boatManager: BoatManager,
    buildingManager: BuildingManager,
    towerManager?: TowerManager,
    effectsManager?: EffectsManager,
    hero?: Hero | null
  ): void {
    // Clear canvases
    this.bgCtx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    this.fgCtx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    this.uiCtx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    
    // Render terrain on background canvas
    this.bgCtx.save();
    this.bgCtx.scale(this.zoomLevel, this.zoomLevel);
    this.bgCtx.translate(-this.cameraX, -this.cameraY);
    
    terrainRenderer.render(
      this.bgCtx,
      this.cameraX,
      this.cameraY,
      this.screenWidth,
      this.screenHeight,
      this.zoomLevel,
      gameTime
    );
    
    this.bgCtx.restore();
    
    // Render game objects on foreground canvas
    this.fgCtx.save();
    this.fgCtx.scale(this.zoomLevel, this.zoomLevel);
    this.fgCtx.translate(-this.cameraX, -this.cameraY);
    
    // Render boats (camera offset NOT needed - canvas transform handles it)
    boatManager.render(this.fgCtx, 0, 0, gameTime);
    
    // Render buildings (camera offset NOT needed - canvas transform handles it)
    buildingManager.render(this.fgCtx, 0, 0, gameTime);
    
    // Render building placement preview
    buildingManager.renderPlacementPreview(this.fgCtx, 0, 0);
    
    // Render towers (camera offset NOT needed - canvas transform handles it)
    if (towerManager) {
      towerManager.render(this.fgCtx, 0, 0, gameTime);
      
      // Render tower placement preview
      const towerMenu = towerManager.getMenuState();
      if (towerMenu.selectedTower) {
        towerManager.renderPlacementPreview(this.fgCtx, 0, 0);
      }
    }
    
    // Render entities (units)
    this.renderEntities(deltaTime, gameTime);
    
    // Render hero (if exists and alive)
    if (hero && !hero.isDead()) {
      this.renderHero(hero, gameTime);
    }
    
    // Render effects and projectiles (camera offset NOT needed - canvas transform handles it)
    if (effectsManager) {
      effectsManager.render(this.fgCtx, 0, 0);
    }
    
    this.fgCtx.restore();
    
    // Render UI elements (no camera transform)
    this.renderUI();
    
    // Render build menu if open
    buildingManager.renderBuildMenu(this.uiCtx, this.screenWidth, this.screenHeight);
    
    // Render minimap with new terrain
    this.renderMinimapWithTerrain(terrainRenderer, boatManager);
  }
  
  private renderMinimapWithTerrain(terrainRenderer: TerrainRenderer, boatManager: BoatManager): void {
    const ctx = this.minimapCtx;
    const mapW = 196;
    const mapH = 196;
    
    // Clear minimap with ocean color
    ctx.fillStyle = '#1a4c7a';
    ctx.fillRect(0, 0, mapW, mapH);
    
    // Calculate scale
    const scaleX = mapW / WORLD_CONFIG.width;
    const scaleY = mapH / WORLD_CONFIG.height;
    
    // Draw islands from world generator
    const worldGen = terrainRenderer.getWorldGenerator();
    for (const island of worldGen.islands.values()) {
      // Island fill
      ctx.fillStyle = island.owner === 1 ? '#2d6040' : 
                      island.owner === 2 ? '#604040' : '#405040';
      ctx.beginPath();
      if (island.vertices.length > 0) {
        ctx.moveTo(island.vertices[0].x * scaleX, island.vertices[0].y * scaleY);
        for (let i = 1; i < island.vertices.length; i++) {
          ctx.lineTo(island.vertices[i].x * scaleX, island.vertices[i].y * scaleY);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    
    // Draw boats
    for (const boat of boatManager.getAllBoats()) {
      const x = boat.position.x * scaleX;
      const y = boat.position.y * scaleY;
      ctx.fillStyle = boat.owner === 1 ? '#00aaff' : '#ff4444';
      ctx.fillRect(x - 2, y - 1, 4, 2);
    }
    
    // Draw all entities as dots
    const allEntities = this.entitySystem.getAllEntities();
    for (const entity of allEntities) {
      const x = entity.position.x * scaleX;
      const y = entity.position.y * scaleY;
      ctx.fillStyle = entity.faction === 1 ? '#00aaff' : 
                      entity.faction === 2 ? '#ff4444' : '#888888';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    
    // Draw viewport rectangle
    const viewX = this.cameraX * scaleX;
    const viewY = this.cameraY * scaleY;
    const viewW = (this.screenWidth / this.zoomLevel) * scaleX;
    const viewH = (this.screenHeight / this.zoomLevel) * scaleY;
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
  }
  
  private renderBackground(): void {
    const ctx = this.bgCtx;
    
    // Fill with ocean background
    ctx.fillStyle = '#1a4c7a';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    // Draw grid lines
    ctx.save();
    ctx.scale(this.zoomLevel, this.zoomLevel);
    ctx.translate(-this.cameraX, -this.cameraY);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 100;
    const startX = Math.floor(this.cameraX / gridSize) * gridSize;
    const startY = Math.floor(this.cameraY / gridSize) * gridSize;
    const endX = this.cameraX + this.screenWidth / this.zoomLevel;
    const endY = this.cameraY + this.screenHeight / this.zoomLevel;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Draw world bounds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, WORLD_CONFIG.width, WORLD_CONFIG.height);
    
    ctx.restore();
  }
  
  private renderEntities(deltaTime: number, _gameTime: number): void {
    const ctx = this.fgCtx;
    
    // Get visible area
    const viewX = this.cameraX;
    const viewY = this.cameraY;
    const viewW = this.screenWidth / this.zoomLevel;
    const viewH = this.screenHeight / this.zoomLevel;
    
    // Query entities in view
    const visibleEntities = this.entitySystem.getEntitiesInRect(
      viewX - 100, viewY - 100,
      viewW + 200, viewH + 200
    );
    
    // Sort by Y for depth ordering
    visibleEntities.sort((a, b) => a.position.y - b.position.y);
    
    const deltaMs = deltaTime * 1000;
    
    for (const entity of visibleEntities) {
      const x = entity.position.x;
      const y = entity.position.y;
      const size = entity.size;
      const isSelected = this.selectedEntityIds.has(entity.id);
      const faction = entity.faction as FactionId;
      
      // Determine sprite config key based on faction
      // Faction 1 = player (crusade warriors), Faction 2 = enemy (goblin warriors)
      const configKey = faction === 1 ? 'crusade_warrior' : 'goblin_warrior';
      
      // Get or create animator for this entity
      const animator = spriteRenderer.getOrCreateAnimator(entity.id, configKey);
      
      // Determine animation state based on entity movement
      const prevPos = this.entityPrevPositions.get(entity.id);
      const isMoving = prevPos && (Math.abs(x - prevPos.x) > 0.1 || Math.abs(y - prevPos.y) > 0.1);
      this.entityPrevPositions.set(entity.id, { x, y });
      
      // Set facing based on movement direction
      if (prevPos && x !== prevPos.x) {
        animator.setFacing(x < prevPos.x);
      }
      
      // Update animation state
      const animState: UnitAnimState = isMoving ? 'run' : 'idle';
      animator.setState(animState);
      animator.update(deltaMs);
      
      // Draw selection circle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Try to render sprite, fallback to colored circle
      const rendered = spriteRenderer.renderTinySwords(ctx, entity.id, x, y, 0.4, faction);
      
      if (!rendered) {
        // Fallback to colored circle
        const color = FACTION_COLORS[faction] || FACTION_COLORS[0];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw faction indicator
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = faction === 1 ? '#0066FF' : '#FF0000';
        ctx.fill();
      }
      
      // Draw health bar above unit
      const healthPercent = 1.0; // TODO: Get actual health
      const barWidth = 30;
      const barHeight = 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y - 45, barWidth, barHeight);
      ctx.fillStyle = faction === 1 ? '#4ade80' : '#ef4444';
      ctx.fillRect(x - barWidth / 2, y - 45, barWidth * healthPercent, barHeight);
    }
  }
  
  // Track previous positions for movement detection
  private entityPrevPositions: Map<string, Position> = new Map();
  
  private renderHero(hero: Hero, gameTime: number): void {
    const ctx = this.fgCtx;
    const x = hero.position.x;
    const y = hero.position.y;
    const size = 24; // Hero is larger than regular units
    
    // Hero glow effect
    const glowIntensity = 0.3 + Math.sin(gameTime * 3) * 0.1;
    ctx.shadowColor = '#6ee7b7';
    ctx.shadowBlur = 15;
    
    // Selection circle (hero is always "selected")
    ctx.beginPath();
    ctx.arc(x, y, size + 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(110, 231, 183, ${glowIntensity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Hero body - class-colored
    const classColors: Record<string, string> = {
      Warrior: '#4a90d9',
      Mage: '#9b59b6',
      Ranger: '#27ae60',
      Worg: '#8b4513'
    };
    const bodyColor = classColors[hero.heroClass] || '#4a90d9';
    
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Class icon in center
    const classIcons: Record<string, string> = {
      Warrior: '⚔️',
      Mage: '🔮',
      Ranger: '🏹',
      Worg: '🐺'
    };
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(classIcons[hero.heroClass] || '⚔️', x, y);
    
    // Health bar above hero
    const barWidth = 50;
    const barHeight = 6;
    const healthPercent = hero.stats.health / hero.stats.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barWidth / 2, y - size - 15, barWidth, barHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(x - barWidth / 2, y - size - 15, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, y - size - 15, barWidth, barHeight);
    
    // Mana bar (smaller, below health)
    const manaPercent = hero.stats.mana / hero.stats.maxMana;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barWidth / 2, y - size - 8, barWidth, 4);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x - barWidth / 2, y - size - 8, barWidth * manaPercent, 4);
    
    // Hero name and level
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.heroName} Lv.${hero.level}`, x, y + size + 15);
    
    // Move target indicator
    if (hero.moveTarget && hero.isMoving) {
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(hero.moveTarget.x, hero.moveTarget.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Target marker
      ctx.beginPath();
      ctx.arc(hero.moveTarget.x, hero.moveTarget.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  private renderUI(): void {
    const ctx = this.uiCtx;
    
    // Draw selection box
    if (this.isSelecting) {
      const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
      const w = Math.abs(this.selectionEnd.x - this.selectionStart.x);
      const h = Math.abs(this.selectionEnd.y - this.selectionStart.y);
      
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fillRect(x, y, w, h);
      
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
    
    // Draw zoom level indicator
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${(this.zoomLevel * 100).toFixed(0)}%`, this.screenWidth - 20, this.screenHeight - 20);
    
    // Draw coordinates
    const worldX = this.screenToWorldX(this.mouseX);
    const worldY = this.screenToWorldY(this.mouseY);
    ctx.fillText(`(${worldX.toFixed(0)}, ${worldY.toFixed(0)})`, this.screenWidth - 20, this.screenHeight - 40);
  }
  
  private renderMinimap(): void {
    const ctx = this.minimapCtx;
    const mapW = 196;
    const mapH = 196;
    
    // Clear minimap
    ctx.fillStyle = '#0a0f0a';
    ctx.fillRect(0, 0, mapW, mapH);
    
    // Calculate scale
    const scaleX = mapW / WORLD_CONFIG.width;
    const scaleY = mapH / WORLD_CONFIG.height;
    
    // Draw all entities as dots
    const allEntities = this.entitySystem.getAllEntities();
    
    for (const entity of allEntities) {
      const x = entity.position.x * scaleX;
      const y = entity.position.y * scaleY;
      const color = FACTION_COLORS[entity.faction] || FACTION_COLORS[0];
      
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - 1, 3, 3);
    }
    
    // Draw viewport rectangle
    const viewX = this.cameraX * scaleX;
    const viewY = this.cameraY * scaleY;
    const viewW = (this.screenWidth / this.zoomLevel) * scaleX;
    const viewH = (this.screenHeight / this.zoomLevel) * scaleY;
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
  }
  
  // === GETTERS ===
  
  getSelectedCount(): number {
    return this.selectedEntityIds.size;
  }
  
  getSelectedEntityIds(): string[] {
    return Array.from(this.selectedEntityIds);
  }
  
  getZoom(): number {
    return this.zoomLevel;
  }
  
  getCameraPosition(): Position {
    return { x: this.cameraX, y: this.cameraY };
  }
  
  /**
   * Set zoom level directly
   */
  setZoom(zoom: number): void {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.bgDirty = true;
  }
  
  /**
   * Set selection bounds from InputManager
   */
  setSelectionBounds(bounds: { startX: number; startY: number; endX: number; endY: number } | null): void {
    if (!bounds) {
      this.isSelecting = false;
      return;
    }
    
    // Update selection state
    this.selectionStart = { x: bounds.startX, y: bounds.startY };
    this.selectionEnd = { x: bounds.endX, y: bounds.endY };
    
    // Calculate selection box in world coordinates
    const x1 = this.screenToWorldX(Math.min(bounds.startX, bounds.endX));
    const y1 = this.screenToWorldY(Math.min(bounds.startY, bounds.endY));
    const x2 = this.screenToWorldX(Math.max(bounds.startX, bounds.endX));
    const y2 = this.screenToWorldY(Math.max(bounds.startY, bounds.endY));
    
    // Find entities in selection box
    this.selectedEntityIds.clear();
    const entities = this.entitySystem.getEntitiesInRect(x1, y1, x2 - x1, y2 - y1);
    
    for (const entity of entities) {
      // Only select player units (faction 1)
      if (entity.faction === 1) {
        this.selectedEntityIds.add(entity.id);
      }
    }
  }
}
