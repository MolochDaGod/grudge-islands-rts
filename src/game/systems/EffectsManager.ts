// ============================================
// EFFECTS MANAGER
// Projectile, explosion, and spell effect animations
// ============================================

import type { Position } from '../../types/index.ts';

// === EFFECT TYPES ===

export type EffectType = 
  | 'projectile'
  | 'explosion'
  | 'spell'
  | 'hit'
  | 'aoe'
  | 'buff'
  | 'debuff';

export type ProjectileStyle = 
  | 'arrow'
  | 'cannonball'
  | 'magic'
  | 'fire'
  | 'frost'
  | 'poison';

export type ExplosionStyle = 
  | 'fire'
  | 'magic'
  | 'frost'
  | 'smoke'
  | 'blood'
  | 'shockwave';

// === SPRITESHEET CONFIG ===

export interface SpritesheetConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  columns: number;
  scale?: number;
}

// Effect spritesheets from effects/effects/pixel/
export const EFFECT_SPRITESHEETS: Record<string, SpritesheetConfig> = {
  // Magic spells
  magic_spell: {
    path: 'effects/effects/pixel/1_magicspell_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 20,
    columns: 8
  },
  
  // Fire effects
  fire: {
    path: 'effects/effects/pixel/11_fire_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 15,
    columns: 8
  },
  bright_fire: {
    path: 'effects/effects/pixel/9_brightfire_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 15,
    columns: 8
  },
  
  // Hit effects  
  weapon_hit: {
    path: 'effects/effects/pixel/10_weaponhit_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 20,
    columns: 8
  },
  magic_hit: {
    path: 'effects/effects/pixel/5_magickahit_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 20,
    columns: 8
  },
  
  // Special effects
  nebula: {
    path: 'effects/effects/pixel/12_nebula_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 12,
    columns: 8
  },
  vortex: {
    path: 'effects/effects/pixel/13_vortex_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 15,
    columns: 8
  },
  phantom: {
    path: 'effects/effects/pixel/14_phantom_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 12,
    columns: 8
  },
  freezing: {
    path: 'effects/effects/pixel/19_freezing_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 24,
    fps: 15,
    columns: 8
  },
  
  // Explosions
  explosion_1: {
    path: 'effects/effects/pixel/2_explosion_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 20,
    columns: 8
  },
  explosion_2: {
    path: 'effects/effects/pixel/3_explosion_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 20,
    columns: 8
  },
  
  // Smoke
  smoke: {
    path: 'effects/effects/pixel/4_smokepuff_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 15,
    columns: 8
  },
  
  // Additional effects
  electric: {
    path: 'effects/effects/pixel/6_electric_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 24,
    fps: 20,
    columns: 8
  },
  slash: {
    path: 'effects/effects/pixel/7_slashfx_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 8,
    fps: 15,
    columns: 8
  },
  blood: {
    path: 'effects/effects/pixel/8_bloodfx_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 8,
    fps: 15,
    columns: 8
  }
};

// === ACTIVE EFFECT ===

export interface ActiveEffect {
  id: string;
  type: EffectType;
  spritesheet: string;
  position: Position;
  targetPosition?: Position;
  
  // Animation state
  currentFrame: number;
  frameTime: number;
  elapsedTime: number;
  isLooping: boolean;
  isComplete: boolean;
  
  // Transform
  scale: number;
  rotation: number;
  alpha: number;
  
  // Motion (for projectiles)
  velocity?: Position;
  speed?: number;
  
  // Callbacks
  onComplete?: () => void;
  onHit?: (position: Position) => void;
}

// === PROJECTILE ===

export interface Projectile extends ActiveEffect {
  type: 'projectile';
  sourceId: string;
  targetId: string;
  damage: number;
  speed: number;
  isHoming: boolean;
}

// === EFFECTS MANAGER ===

export class EffectsManager {
  private effects: Map<string, ActiveEffect> = new Map();
  private projectiles: Map<string, Projectile> = new Map();
  private loadedSpritesheets: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  
  private nextEffectId: number = 0;

  // Callbacks
  public onProjectileHit: ((projectile: Projectile, position: Position) => void) | null = null;

  constructor() {
    // Preload common effects
    this.preloadSpritesheets([
      'fire', 'explosion_1', 'magic_hit', 'weapon_hit', 'smoke'
    ]);
  }

  // === SPRITESHEET LOADING ===

  async preloadSpritesheets(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.loadSpritesheet(key));
    await Promise.all(promises);
  }

  async loadSpritesheet(key: string): Promise<HTMLImageElement> {
    // Already loaded
    if (this.loadedSpritesheets.has(key)) {
      return this.loadedSpritesheets.get(key)!;
    }

    // Currently loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const config = EFFECT_SPRITESHEETS[key];
    if (!config) {
      console.warn(`[EffectsManager] Unknown spritesheet: ${key}`);
      return this.createFallbackImage();
    }

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.loadedSpritesheets.set(key, img);
        this.loadingPromises.delete(key);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`[EffectsManager] Failed to load: ${config.path}`);
        const fallback = this.createFallbackImage();
        this.loadedSpritesheets.set(key, fallback);
        this.loadingPromises.delete(key);
        resolve(fallback);
      };
      img.src = config.path;
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  private createFallbackImage(): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, 100, 100);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  // === EFFECT CREATION ===

  private generateId(): string {
    return `effect_${this.nextEffectId++}`;
  }

  spawnEffect(config: {
    spritesheet: string;
    position: Position;
    scale?: number;
    rotation?: number;
    loop?: boolean;
    onComplete?: () => void;
  }): string {
    const id = this.generateId();
    const spritesheetConfig = EFFECT_SPRITESHEETS[config.spritesheet];
    
    const effect: ActiveEffect = {
      id,
      type: 'explosion',
      spritesheet: config.spritesheet,
      position: { ...config.position },
      currentFrame: 0,
      frameTime: 1000 / (spritesheetConfig?.fps ?? 15),
      elapsedTime: 0,
      isLooping: config.loop ?? false,
      isComplete: false,
      scale: config.scale ?? 1,
      rotation: config.rotation ?? 0,
      alpha: 1,
      onComplete: config.onComplete
    };

    this.effects.set(id, effect);
    this.loadSpritesheet(config.spritesheet);

    return id;
  }

  // === EXPLOSION EFFECTS ===

  spawnExplosion(position: Position, style: ExplosionStyle = 'fire', scale: number = 1): string {
    const spritesheetMap: Record<ExplosionStyle, string> = {
      fire: 'explosion_1',
      magic: 'magic_spell',
      frost: 'freezing',
      smoke: 'smoke',
      blood: 'blood',
      shockwave: 'vortex'
    };

    return this.spawnEffect({
      spritesheet: spritesheetMap[style] ?? 'explosion_1',
      position,
      scale
    });
  }

  // === HIT EFFECTS ===

  spawnHit(position: Position, isMagic: boolean = false, scale: number = 0.5): string {
    return this.spawnEffect({
      spritesheet: isMagic ? 'magic_hit' : 'weapon_hit',
      position,
      scale
    });
  }

  // === PROJECTILE CREATION ===

  spawnProjectile(config: {
    sourceId: string;
    targetId: string;
    sourcePosition: Position;
    targetPosition: Position;
    damage: number;
    speed?: number;
    style?: ProjectileStyle;
    isHoming?: boolean;
    onHit?: (position: Position) => void;
  }): string {
    const id = this.generateId();
    
    // Calculate initial velocity
    const dx = config.targetPosition.x - config.sourcePosition.x;
    const dy = config.targetPosition.y - config.sourcePosition.y;
    const dist = Math.hypot(dx, dy);
    const speed = config.speed ?? 400;
    
    const velocity = {
      x: (dx / dist) * speed,
      y: (dy / dist) * speed
    };

    // Calculate rotation to face target
    const rotation = Math.atan2(dy, dx);

    // Map style to spritesheet
    const styleMap: Record<ProjectileStyle, string> = {
      arrow: 'slash',
      cannonball: 'smoke',
      magic: 'magic_spell',
      fire: 'bright_fire',
      frost: 'freezing',
      poison: 'vortex'
    };

    const spritesheet = styleMap[config.style ?? 'arrow'] ?? 'slash';
    const spritesheetConfig = EFFECT_SPRITESHEETS[spritesheet];

    const projectile: Projectile = {
      id,
      type: 'projectile',
      spritesheet,
      position: { ...config.sourcePosition },
      targetPosition: { ...config.targetPosition },
      currentFrame: 0,
      frameTime: 1000 / (spritesheetConfig?.fps ?? 15),
      elapsedTime: 0,
      isLooping: true,
      isComplete: false,
      scale: 0.5,
      rotation,
      alpha: 1,
      velocity,
      speed,
      sourceId: config.sourceId,
      targetId: config.targetId,
      damage: config.damage,
      isHoming: config.isHoming ?? false,
      onHit: config.onHit
    };

    this.projectiles.set(id, projectile);
    this.loadSpritesheet(spritesheet);

    return id;
  }

  // === UPDATE ===

  update(deltaTime: number, getTargetPosition?: (id: string) => Position | null): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update effects
    for (const effect of this.effects.values()) {
      this.updateEffect(effect, deltaTime);
      
      if (effect.isComplete) {
        effect.onComplete?.();
        this.effects.delete(effect.id);
      }
    }

    // Update projectiles
    for (const projectile of this.projectiles.values()) {
      this.updateProjectile(projectile, dt, getTargetPosition);
      
      if (projectile.isComplete) {
        this.projectiles.delete(projectile.id);
      }
    }
  }

  private updateEffect(effect: ActiveEffect, deltaTime: number): void {
    effect.elapsedTime += deltaTime;

    const config = EFFECT_SPRITESHEETS[effect.spritesheet];
    if (!config) return;

    // Update frame
    if (effect.elapsedTime >= effect.frameTime) {
      effect.elapsedTime -= effect.frameTime;
      effect.currentFrame++;

      if (effect.currentFrame >= config.frameCount) {
        if (effect.isLooping) {
          effect.currentFrame = 0;
        } else {
          effect.isComplete = true;
          effect.currentFrame = config.frameCount - 1;
        }
      }
    }
  }

  private updateProjectile(
    projectile: Projectile, 
    dt: number,
    getTargetPosition?: (id: string) => Position | null
  ): void {
    // Update animation
    this.updateEffect(projectile, dt * 1000);

    // Homing: recalculate velocity toward target
    if (projectile.isHoming && getTargetPosition) {
      const targetPos = getTargetPosition(projectile.targetId);
      if (targetPos) {
        projectile.targetPosition = targetPos;
        const dx = targetPos.x - projectile.position.x;
        const dy = targetPos.y - projectile.position.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
          projectile.velocity = {
            x: (dx / dist) * projectile.speed!,
            y: (dy / dist) * projectile.speed!
          };
          projectile.rotation = Math.atan2(dy, dx);
        }
      }
    }

    // Move projectile
    if (projectile.velocity) {
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;
    }

    // Check if reached target
    if (projectile.targetPosition) {
      const dist = Math.hypot(
        projectile.targetPosition.x - projectile.position.x,
        projectile.targetPosition.y - projectile.position.y
      );

      if (dist < 20) {
        projectile.isComplete = true;
        
        // Spawn hit effect
        this.spawnHit(projectile.position, true, 0.6);
        
        // Fire callbacks
        projectile.onHit?.(projectile.position);
        this.onProjectileHit?.(projectile, projectile.position);
      }
    }

    // Timeout safety (10 seconds max)
    if (projectile.elapsedTime > 10000) {
      projectile.isComplete = true;
    }
  }

  // === REMOVE ===

  removeEffect(id: string): void {
    this.effects.delete(id);
    this.projectiles.delete(id);
  }

  clear(): void {
    this.effects.clear();
    this.projectiles.clear();
  }

  // === RENDER ===

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    // Render effects
    for (const effect of this.effects.values()) {
      this.renderEffect(ctx, effect, cameraX, cameraY);
    }

    // Render projectiles
    for (const projectile of this.projectiles.values()) {
      this.renderEffect(ctx, projectile, cameraX, cameraY);
    }
  }

  private renderEffect(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffect,
    cameraX: number,
    cameraY: number
  ): void {
    const spritesheet = this.loadedSpritesheets.get(effect.spritesheet);
    if (!spritesheet || !spritesheet.complete) return;

    const config = EFFECT_SPRITESHEETS[effect.spritesheet];
    if (!config) return;

    const x = effect.position.x - cameraX;
    const y = effect.position.y - cameraY;

    // Calculate source rect
    const col = effect.currentFrame % config.columns;
    const row = Math.floor(effect.currentFrame / config.columns);
    const sx = col * config.frameWidth;
    const sy = row * config.frameHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(effect.rotation);
    ctx.globalAlpha = effect.alpha;
    ctx.scale(effect.scale, effect.scale);

    // Center the sprite
    const halfW = config.frameWidth / 2;
    const halfH = config.frameHeight / 2;

    ctx.drawImage(
      spritesheet,
      sx, sy, config.frameWidth, config.frameHeight,
      -halfW, -halfH, config.frameWidth, config.frameHeight
    );

    ctx.restore();
  }

  // === DEBUG ===

  debugRender(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'white';

    // Show projectile info
    for (const projectile of this.projectiles.values()) {
      const x = projectile.position.x - cameraX;
      const y = projectile.position.y - cameraY;

      ctx.strokeStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();

      if (projectile.targetPosition) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(projectile.targetPosition.x - cameraX, projectile.targetPosition.y - cameraY);
        ctx.stroke();
      }

      ctx.fillText(`dmg:${projectile.damage}`, x + 15, y);
    }

    // Show effect count
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Effects: ${this.effects.size}`, 10, 20);
    ctx.fillText(`Projectiles: ${this.projectiles.size}`, 10, 32);

    ctx.restore();
  }

  // === UTILITY ===

  getEffectCount(): number {
    return this.effects.size;
  }

  getProjectileCount(): number {
    return this.projectiles.size;
  }

  getProjectilesBySource(sourceId: string): Projectile[] {
    const results: Projectile[] = [];
    for (const projectile of this.projectiles.values()) {
      if (projectile.sourceId === sourceId) {
        results.push(projectile);
      }
    }
    return results;
  }
}
