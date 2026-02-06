// ============================================
// TERRAIN RENDERER
// Renders islands, water, and terrain with MiniWorld sprites
// ============================================

import type { TerrainType, Island, Camp, IslandNode, DockPoint } from '../../types/world.ts';
import { WorldGenerator, WORLD_CONFIG } from '../world/WorldGenerator.ts';
import { TERRAIN_SPRITES, NATURE_SPRITES, getTinySwordsBuildingPath, gameToTinySwordsFaction } from '../../data/miniWorldSprites.ts';

// === TERRAIN COLORS (fallback when sprites not loaded) ===

const TERRAIN_COLORS: Record<TerrainType, string> = {
  deep_water: '#1a4c7a',
  shallow_water: '#2d6a9f',
  sand: '#e6d5a8',
  grass: '#4a7c3f',
  rock: '#6b6b6b',
  forest: '#2d5a27'
};

const FACTION_COLORS: Record<number, string> = {
  0: '#888888', // Neutral
  1: '#00aaff', // Player (Cyan)
  2: '#ff4444', // Enemy (Red)
  3: '#44ff44', // Ally (Lime)
  4: '#aa44ff'  // Enemy 2 (Purple)
};

export class TerrainRenderer {
  private worldGen: WorldGenerator;
  private terrainCanvas: OffscreenCanvas;
  private terrainCtx: OffscreenCanvasRenderingContext2D;
  private isDirty: boolean = true;
  
  // Sprite loading
  private spriteImages: Map<string, HTMLImageElement> = new Map();
  private castleSprites: Map<string, HTMLImageElement> = new Map();
  
  // Water animation
  private waterOffset: number = 0;
  
  constructor(worldGen: WorldGenerator) {
    this.worldGen = worldGen;
    
    // Create offscreen canvas for terrain caching
    this.terrainCanvas = new OffscreenCanvas(
      WORLD_CONFIG.width,
      WORLD_CONFIG.height
    );
    this.terrainCtx = this.terrainCanvas.getContext('2d')!;
    
    // Start loading sprites
    this.loadSprites();
    this.loadCastleSprites();
  }
  
  private loadCastleSprites(): void {
    const factions = ['crusade', 'goblin', 'legion', 'fabled'] as const;
    for (const faction of factions) {
      const path = getTinySwordsBuildingPath(faction, 'castle');
      const img = new Image();
      img.onload = () => {
        this.castleSprites.set(faction, img);
        this.isDirty = true;
      };
      img.src = path;
    }
  }
  
  private async loadSprites(): Promise<void> {
    const spritesToLoad = [
      { key: 'grass', path: TERRAIN_SPRITES.grass.path },
      { key: 'shore', path: TERRAIN_SPRITES.shore.path },
      { key: 'texturedGrass', path: TERRAIN_SPRITES.texturedGrass.path },
      { key: 'trees', path: NATURE_SPRITES.trees.path },
      { key: 'rocks', path: NATURE_SPRITES.rocks.path },
      { key: 'coconutTrees', path: NATURE_SPRITES.coconutTrees.path }
    ];
    
    const loadPromises = spritesToLoad.map(sprite => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.spriteImages.set(sprite.key, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${sprite.path}`);
          resolve();
        };
        img.src = sprite.path;
      });
    });
    
    await Promise.all(loadPromises);
    this.isDirty = true;
    console.log('Terrain sprites loaded');
  }
  
  /**
   * Mark terrain as needing re-render
   */
  invalidate(): void {
    this.isDirty = true;
  }
  
  /**
   * Update water animation
   */
  update(deltaTime: number): void {
    this.waterOffset += deltaTime * 20;
    if (this.waterOffset > 100) {
      this.waterOffset -= 100;
    }
  }
  
  /**
   * Render terrain to offscreen canvas if dirty
   */
  private renderTerrainCache(): void {
    if (!this.isDirty) return;
    
    const ctx = this.terrainCtx;
    const tileSize = WORLD_CONFIG.tileSize;
    
    // Clear canvas
    ctx.fillStyle = TERRAIN_COLORS.deep_water;
    ctx.fillRect(0, 0, WORLD_CONFIG.width, WORLD_CONFIG.height);
    
    // Render terrain tiles
    for (let gy = 0; gy < this.worldGen.gridHeight; gy++) {
      for (let gx = 0; gx < this.worldGen.gridWidth; gx++) {
        const tile = this.worldGen.terrainGrid[gy]?.[gx];
        if (!tile || tile.type === 'deep_water') continue;
        
        const x = gx * tileSize;
        const y = gy * tileSize;
        
        // Draw terrain color
        ctx.fillStyle = TERRAIN_COLORS[tile.type];
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    
    // Render nature decorations on islands
    this.renderNatureDecorations(ctx);
    
    // Render island features
    for (const island of this.worldGen.islands.values()) {
      this.renderIslandFeatures(ctx, island);
    }
    
    this.isDirty = false;
  }
  
  private renderNatureDecorations(ctx: OffscreenCanvasRenderingContext2D): void {
    // Add trees and rocks based on terrain type
    const tileSize = WORLD_CONFIG.tileSize;
    
    for (let gy = 0; gy < this.worldGen.gridHeight; gy += 3) {
      for (let gx = 0; gx < this.worldGen.gridWidth; gx += 3) {
        const tile = this.worldGen.terrainGrid[gy]?.[gx];
        if (!tile) continue;
        
        const x = gx * tileSize;
        const y = gy * tileSize;
        
        if (tile.type === 'forest') {
          // Draw tree indicator
          ctx.fillStyle = '#1d4a1a';
          ctx.beginPath();
          ctx.arc(x + tileSize * 1.5, y + tileSize * 1.5, tileSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Tree trunk
          ctx.fillStyle = '#5a3a20';
          ctx.fillRect(x + tileSize * 1.2, y + tileSize * 2, tileSize * 0.6, tileSize * 0.8);
        } else if (tile.type === 'rock') {
          // Draw rock indicator
          ctx.fillStyle = '#555555';
          ctx.beginPath();
          ctx.ellipse(x + tileSize * 1.5, y + tileSize * 1.5, tileSize, tileSize * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  
  private renderIslandFeatures(ctx: OffscreenCanvasRenderingContext2D, island: Island): void {
    // Draw island outline for debugging/visibility
    ctx.strokeStyle = FACTION_COLORS[island.owner];
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (island.vertices.length > 0) {
      ctx.moveTo(island.vertices[0].x, island.vertices[0].y);
      for (let i = 1; i < island.vertices.length; i++) {
        ctx.lineTo(island.vertices[i].x, island.vertices[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Draw island name at center
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(island.name, island.center.x, island.center.y - island.radius - 20);
  }
  
  /**
   * Render terrain to main canvas with camera transform
   */
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number,
    zoom: number,
    gameTime: number
  ): void {
    // Ensure terrain cache is up to date
    this.renderTerrainCache();
    
    // Calculate visible region
    const startX = Math.max(0, Math.floor(cameraX));
    const startY = Math.max(0, Math.floor(cameraY));
    const endX = Math.min(WORLD_CONFIG.width, Math.ceil(cameraX + viewWidth / zoom));
    const endY = Math.min(WORLD_CONFIG.height, Math.ceil(cameraY + viewHeight / zoom));
    
    // Draw animated water background (fills visible area in world coords)
    this.renderWater(ctx, cameraX, cameraY, viewWidth, viewHeight, zoom, gameTime);
    
    // Draw terrain from cache at world coordinates
    // Context is already transformed, so draw at world position
    ctx.drawImage(
      this.terrainCanvas,
      startX, startY, endX - startX, endY - startY,
      startX, startY, endX - startX, endY - startY
    );
    
    // Render dynamic island elements (camps, nodes, docks)
    // These use world coordinates since context is already transformed
    for (const island of this.worldGen.islands.values()) {
      this.renderDynamicIslandFeatures(ctx, island, gameTime);
    }
  }
  
  private renderWater(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number,
    zoom: number,
    gameTime: number
  ): void {
    // Animated water with wave effect
    const waveOffset = Math.sin(gameTime * 0.5) * 5;
    
    // Calculate visible area in world coordinates
    const visibleWidth = viewWidth / zoom;
    const visibleHeight = viewHeight / zoom;
    
    // Create gradient for deep water (in world coordinates)
    const gradient = ctx.createLinearGradient(cameraX, cameraY, cameraX, cameraY + visibleHeight);
    gradient.addColorStop(0, '#0a3050');
    gradient.addColorStop(0.5, '#1a4c7a');
    gradient.addColorStop(1, '#0a3050');
    
    // Fill the entire world with water
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_CONFIG.width, WORLD_CONFIG.height);
    
    // Draw wave lines in visible area
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const waveSpacing = 50;
    const startY = Math.floor(cameraY / waveSpacing) * waveSpacing;
    const endY = cameraY + visibleHeight + waveSpacing;
    
    for (let y = startY; y < endY; y += waveSpacing) {
      ctx.beginPath();
      for (let x = cameraX; x < cameraX + visibleWidth; x += 10) {
        const waveY = y + Math.sin((x + gameTime * 30) * 0.02) * 5 + waveOffset;
        if (x === cameraX) {
          ctx.moveTo(x, waveY);
        } else {
          ctx.lineTo(x, waveY);
        }
      }
      ctx.stroke();
    }
  }
  
  private renderDynamicIslandFeatures(
    ctx: CanvasRenderingContext2D,
    island: Island,
    gameTime: number
  ): void {
    // Render camp (context is already transformed to world coordinates)
    if (island.camp && !island.camp.isDestroyed) {
      this.renderCamp(ctx, island.camp, gameTime);
    }
    
    // Render nodes
    for (const node of island.nodes) {
      this.renderNode(ctx, node, gameTime);
    }
    
    // Render dock points
    for (const dock of island.dockPoints) {
      this.renderDock(ctx, dock);
    }
  }
  
  private renderCamp(
    ctx: CanvasRenderingContext2D,
    camp: Camp,
    _gameTime: number
  ): void {
    // Use world coordinates directly (context is transformed)
    const x = camp.position.x;
    const y = camp.position.y;
    const size = 60;
    
    // Try to use Tiny Swords castle sprite
    const faction = gameToTinySwordsFaction(camp.owner);
    const castleSprite = this.castleSprites.get(faction);
    
    if (castleSprite && castleSprite.complete) {
      // Draw castle sprite
      const scale = (size * 2.5) / castleSprite.width;
      const drawW = castleSprite.width * scale;
      const drawH = castleSprite.height * scale;
      ctx.drawImage(castleSprite, x - drawW / 2, y - drawH + size * 0.3, drawW, drawH);
    } else {
      // Fallback to simple shape
      ctx.fillStyle = FACTION_COLORS[camp.owner];
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size * 0.8);
      
      ctx.fillStyle = FACTION_COLORS[camp.owner];
      ctx.beginPath();
      ctx.moveTo(x - size * 0.6, y - size * 0.5);
      ctx.lineTo(x, y - size * 0.9);
      ctx.lineTo(x + size * 0.6, y - size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Health bar
    const healthPercent = camp.health / camp.maxHealth;
    const barWidth = size * 1.6;
    const barHeight = 6;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barWidth / 2, y + size * 0.5, barWidth, barHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : healthPercent > 0.25 ? '#aa4' : '#a44';
    ctx.fillRect(x - barWidth / 2, y + size * 0.5, barWidth * healthPercent, barHeight);
    
    // Camp level indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Lv.${camp.level}`, x, y + size * 0.5 + 10);
  }
  
  private renderNode(
    ctx: CanvasRenderingContext2D,
    node: IslandNode,
    gameTime: number
  ): void {
    // Use world coordinates directly (context is transformed)
    const x = node.position.x;
    const y = node.position.y;
    const size = 25;
    
    // Pulsing effect for active nodes
    const pulse = node.isActive ? Math.sin(gameTime * 3) * 3 : 0;
    
    // Node circle
    ctx.fillStyle = node.owner === 0 ? '#666' : FACTION_COLORS[node.owner];
    ctx.beginPath();
    ctx.arc(x, y, size + pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner circle
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Capture progress ring
    if (node.capturingFaction !== null && node.captureProgress > 0) {
      ctx.strokeStyle = FACTION_COLORS[node.capturingFaction];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, size + 5, -Math.PI / 2, -Math.PI / 2 + (node.captureProgress / 100) * Math.PI * 2);
      ctx.stroke();
    }
    
    // Tier indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`T${node.unitTier}`, x, y);
  }
  
  private renderDock(
    ctx: CanvasRenderingContext2D,
    dock: DockPoint
  ): void {
    // Use world coordinates directly (context is transformed)
    const x = dock.position.x;
    const y = dock.position.y;
    const size = 15;
    
    // Dock marker
    ctx.fillStyle = dock.isOccupied ? '#aa8844' : '#665533';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Dock direction indicator
    ctx.strokeStyle = '#443322';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(dock.direction) * size * 1.5,
      y + Math.sin(dock.direction) * size * 1.5
    );
    ctx.stroke();
    
    // Anchor symbol
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚓', x, y);
  }
  
  // === UTILITY ===
  
  getWorldGenerator(): WorldGenerator {
    return this.worldGen;
  }
}
