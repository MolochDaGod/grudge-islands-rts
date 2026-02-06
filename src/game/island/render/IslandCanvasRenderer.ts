// ============================================
// ISLAND CANVAS RENDERER
// Pure canvas rendering for home island
// ============================================

import type { IslandEngine } from '../engine/IslandEngine.ts';
import type { CharacterActor } from '../actors/CharacterActor.ts';
import type { ResourceNodeActor } from '../actors/ResourceNodeActor.ts';

export class IslandCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: IslandEngine;
  
  private sprites: Map<string, HTMLImageElement> = new Map();
  private backgroundImage: HTMLImageElement | null = null;
  
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  
  public onTileClick: ((worldX: number, worldY: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, engine: IslandEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    this.engine.panCamera(dx, dy);
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = this.engine.screenToWorld(mouseX, mouseY, this.canvas.width, this.canvas.height);
    
    const delta = e.deltaY > 0 ? -1 : 1;
    this.engine.zoomCamera(delta, worldPos.x, worldPos.y);
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = this.engine.screenToWorld(mouseX, mouseY, this.canvas.width, this.canvas.height);
    
    this.onTileClick?.(worldPos.x, worldPos.y);
  }

  async loadSprite(src: string): Promise<HTMLImageElement> {
    if (this.sprites.has(src)) {
      return this.sprites.get(src)!;
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.sprites.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  async setBackgroundImage(src: string): Promise<void> {
    this.backgroundImage = await this.loadSprite(src);
  }

  render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    const camera = this.engine.getCamera();
    const scale = camera.zoom;
    const offsetX = width / 2 - camera.x * scale;
    const offsetY = height / 2 - camera.y * scale;
    
    if (this.backgroundImage) {
      ctx.drawImage(
        this.backgroundImage, 
        offsetX, offsetY, 
        this.backgroundImage.width * scale, 
        this.backgroundImage.height * scale
      );
    } else {
      // Default island ground
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 0, width, height);
      
      // Grid for visibility
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      const gridSize = 50 * scale;
      const startX = offsetX % gridSize;
      const startY = offsetY % gridSize;
      
      for (let x = startX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    // Draw resource nodes
    for (const node of this.engine.resourceNodes.values()) {
      const screen = this.engine.worldToScreen(node.x, node.y, width, height);
      if (screen.visible) {
        this.drawResourceNode(ctx, node, screen.x, screen.y);
      }
    }
    
    // Draw characters (sorted by Y for depth)
    const sortedCharacters = Array.from(this.engine.characters.values())
      .sort((a, b) => a.y - b.y);
    
    for (const character of sortedCharacters) {
      const screen = this.engine.worldToScreen(character.x, character.y, width, height);
      if (screen.visible) {
        this.drawCharacter(ctx, character, screen.x, screen.y);
      }
    }
    
    // Draw HUD
    this.drawHUD(ctx);
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, character: CharacterActor, screenX: number, screenY: number): void {
    const sprite = this.sprites.get(character.spriteConfig.spriteSheet);
    
    if (sprite) {
      const frame = character.getCurrentFrame();
      const scale = character.spriteConfig.scale || 1;
      const drawWidth = frame.width * scale;
      const drawHeight = frame.height * scale;
      
      ctx.save();
      
      if (character.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.drawImage(
          sprite,
          frame.x, frame.y, frame.width, frame.height,
          -screenX - drawWidth / 2, screenY - drawHeight / 2,
          drawWidth, drawHeight
        );
      } else {
        ctx.drawImage(
          sprite,
          frame.x, frame.y, frame.width, frame.height,
          screenX - drawWidth / 2, screenY - drawHeight / 2,
          drawWidth, drawHeight
        );
      }
      
      ctx.restore();
    } else {
      // Fallback circle
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#166534';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(character.id.slice(0, 3), screenX, screenY + 3);
    }
    
    // Sleeping indicator
    if (character.state === 'sleeping') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('zzz', screenX + 15, screenY - 20);
    }
    
    // Stamina bar
    const barWidth = 30;
    const barHeight = 4;
    const barX = screenX - barWidth / 2;
    const barY = screenY + 25;
    
    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const staminaPercent = character.stamina / character.maxStamina;
    ctx.fillStyle = staminaPercent > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * staminaPercent, barHeight);
  }

  private drawResourceNode(ctx: CanvasRenderingContext2D, node: ResourceNodeActor, screenX: number, screenY: number): void {
    const color = node.getRarityColor();
    
    // Node circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icon
    ctx.fillStyle = '#1f2937';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.nodeData.icon, screenX, screenY);
    
    // Harvesting indicator
    if (node.isBeingHarvested) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(screenX, screenY, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Node name
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText(node.nodeData.name, screenX, screenY + 25);
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, 40);
    
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏝️ Home Island', 15, 20);
    
    // Instructions
    ctx.fillStyle = '#a5b4d0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Click resource node to harvest | Drag to pan | Scroll to zoom', this.canvas.width - 15, 20);
  }

  destroy(): void {
    this.sprites.clear();
    this.backgroundImage = null;
  }
}
