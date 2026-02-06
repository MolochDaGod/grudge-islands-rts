// ============================================
// TINY SWORDS SPRITE SYSTEM
// Handles horizontal spritesheets with frame-based animations
// ============================================

import type { FactionId } from '../../types/index.ts';

// === TYPES ===

export type UnitAnimState = 'idle' | 'run' | 'attack1' | 'attack2' | 'guard' | 'shoot' | 'heal';
export type UnitType = 'warrior' | 'archer' | 'lancer' | 'monk';
export type FactionStyle = 'goblin' | 'crusade' | 'fabled' | 'legion';

export interface SpriteSheetConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameDuration: number; // ms per frame
  loop: boolean;
}

export interface UnitSpriteConfig {
  unitType: UnitType;
  faction: FactionStyle;
  animations: Partial<Record<UnitAnimState, SpriteSheetConfig>>;
  offsetX?: number;
  offsetY?: number;
}

// === SPRITE PATH BUILDER ===

const TINY_SWORDS_BASE = './sprites/tiny-swords/Units';
const MINIWORLD_BASE = './sprites/miniworld/Characters';

function getTinySwordsPath(faction: FactionStyle, unitType: UnitType, anim: string): string {
  const factionFolder = faction === 'goblin' ? 'Goblin Units' : 
                        faction === 'crusade' ? 'crusade Units' : 
                        faction === 'fabled' ? 'Fabled Units' : 'Legion Units';
  const unitFolder = unitType.charAt(0).toUpperCase() + unitType.slice(1);
  return `${TINY_SWORDS_BASE}/${factionFolder}/${unitFolder}/${anim}`;
}

// === UNIT SPRITE CONFIGURATIONS ===

export const UNIT_SPRITE_CONFIGS: Record<string, UnitSpriteConfig> = {
  // Goblin faction units (enemies)
  'goblin_warrior': {
    unitType: 'warrior',
    faction: 'goblin',
    animations: {
      idle: {
        path: getTinySwordsPath('goblin', 'warrior', 'Warrior_Idle'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: getTinySwordsPath('goblin', 'warrior', 'Warrior_Run'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      attack1: {
        path: getTinySwordsPath('goblin', 'warrior', 'Warrior_Attack1'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 80,
        loop: false
      },
      attack2: {
        path: getTinySwordsPath('goblin', 'warrior', 'Warrior_Attack2'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 80,
        loop: false
      },
      guard: {
        path: getTinySwordsPath('goblin', 'warrior', 'Warrior_Guard'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 4,
        frameDuration: 150,
        loop: false
      }
    }
  },
  'goblin_archer': {
    unitType: 'archer',
    faction: 'goblin',
    animations: {
      idle: {
        path: getTinySwordsPath('goblin', 'archer', 'Archer_Idle'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: getTinySwordsPath('goblin', 'archer', 'Archer_Run'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      shoot: {
        path: getTinySwordsPath('goblin', 'archer', 'Archer_Shoot'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 12,
        frameDuration: 60,
        loop: false
      }
    }
  },
  'goblin_lancer': {
    unitType: 'lancer',
    faction: 'goblin',
    animations: {
      idle: {
        path: getTinySwordsPath('goblin', 'lancer', 'Lancer_Idle'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: getTinySwordsPath('goblin', 'lancer', 'Lancer_Run'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      attack1: {
        path: getTinySwordsPath('goblin', 'lancer', 'Lancer_Right_Attack'),
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 80,
        loop: false
      }
    }
  },
  'goblin_monk': {
    unitType: 'monk',
    faction: 'goblin',
    animations: {
      idle: {
        path: `${TINY_SWORDS_BASE}/Goblin Units/Monk/Idle`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: `${TINY_SWORDS_BASE}/Goblin Units/Monk/Run`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      heal: {
        path: `${TINY_SWORDS_BASE}/Goblin Units/Monk/Heal`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: false
      }
    }
  },
  
  // Crusade faction units (player)
  'crusade_warrior': {
    unitType: 'warrior',
    faction: 'crusade',
    animations: {
      idle: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Warrior/Warrior_Idle`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Warrior/Warrior_Run`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      attack1: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Warrior/Warrior_Attack1`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 80,
        loop: false
      }
    }
  },
  'crusade_archer': {
    unitType: 'archer',
    faction: 'crusade',
    animations: {
      idle: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Archer/Archer_Idle`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 8,
        frameDuration: 120,
        loop: true
      },
      run: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Archer/Archer_Run`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6,
        frameDuration: 100,
        loop: true
      },
      shoot: {
        path: `${TINY_SWORDS_BASE}/crusade Units/Archer/Archer_Shoot`,
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 12,
        frameDuration: 60,
        loop: false
      }
    }
  }
};

// === MINIWORLD SPRITE CONFIGS (16x16 grid spritesheets) ===

export const MINIWORLD_SPRITE_CONFIGS: Record<string, {
  path: string;
  frameWidth: number;
  frameHeight: number;
  rows: { [key in UnitAnimState]?: { row: number; frameCount: number; } };
}> = {
  'orc': {
    path: `${MINIWORLD_BASE}/Monsters/Orcs/Orc.png`,
    frameWidth: 16,
    frameHeight: 16,
    rows: {
      idle: { row: 0, frameCount: 4 },
      run: { row: 1, frameCount: 4 },
      attack1: { row: 2, frameCount: 4 }
    }
  },
  'skeleton': {
    path: `${MINIWORLD_BASE}/Champions/Skeleton-Soldier.png`,
    frameWidth: 16,
    frameHeight: 16,
    rows: {
      idle: { row: 0, frameCount: 4 },
      run: { row: 1, frameCount: 4 },
      attack1: { row: 2, frameCount: 4 }
    }
  },
  'slime': {
    path: `${MINIWORLD_BASE}/Monsters/Slimes/Slime.png`,
    frameWidth: 16,
    frameHeight: 16,
    rows: {
      idle: { row: 0, frameCount: 4 },
      run: { row: 0, frameCount: 4 }
    }
  },
  'swordsman': {
    path: `${MINIWORLD_BASE}/Soldiers/Melee/SwordsmanTemplate.png`,
    frameWidth: 16,
    frameHeight: 16,
    rows: {
      idle: { row: 0, frameCount: 4 },
      run: { row: 1, frameCount: 4 },
      attack1: { row: 2, frameCount: 4 }
    }
  },
  'bowman': {
    path: `${MINIWORLD_BASE}/Soldiers/Ranged/BowmanTemplate.png`,
    frameWidth: 16,
    frameHeight: 16,
    rows: {
      idle: { row: 0, frameCount: 4 },
      run: { row: 1, frameCount: 4 },
      shoot: { row: 2, frameCount: 4 }
    }
  }
};

// === SPRITE LOADER ===

export class SpriteLoader {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loading: Map<string, Promise<HTMLImageElement>> = new Map();
  
  async load(path: string): Promise<HTMLImageElement> {
    // Check cache
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }
    
    // Check if already loading
    if (this.loading.has(path)) {
      return this.loading.get(path)!;
    }
    
    // Start loading
    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(path, img);
        this.loading.delete(path);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${path}`);
        this.loading.delete(path);
        resolve(img); // Return failed image, don't break game
      };
      img.src = path;
    });
    
    this.loading.set(path, promise);
    return promise;
  }
  
  get(path: string): HTMLImageElement | null {
    return this.cache.get(path) ?? null;
  }
  
  isLoaded(path: string): boolean {
    const img = this.cache.get(path);
    return (img?.complete && img.naturalWidth > 0) ?? false;
  }
}

// === ANIMATION STATE MACHINE ===

export class UnitAnimator {
  private currentState: UnitAnimState = 'idle';
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private config: UnitSpriteConfig | null = null;
  private queuedState: UnitAnimState | null = null;
  private facingLeft: boolean = false;
  
  constructor(configKey: string) {
    this.config = UNIT_SPRITE_CONFIGS[configKey] ?? null;
  }
  
  setConfig(configKey: string): void {
    this.config = UNIT_SPRITE_CONFIGS[configKey] ?? null;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }
  
  setState(state: UnitAnimState, force: boolean = false): void {
    if (!this.config) return;
    if (this.currentState === state && !force) return;
    
    const anim = this.config.animations[state];
    if (!anim) {
      // Fallback to idle if animation doesn't exist
      if (state !== 'idle') {
        this.setState('idle', force);
      }
      return;
    }
    
    // Don't interrupt attacks unless forced
    if (!force && this.isAttacking() && !this.isAnimComplete()) {
      this.queuedState = state;
      return;
    }
    
    this.currentState = state;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.queuedState = null;
  }
  
  setFacing(left: boolean): void {
    this.facingLeft = left;
  }
  
  update(deltaMs: number): void {
    if (!this.config) return;
    
    const anim = this.config.animations[this.currentState];
    if (!anim) return;
    
    this.frameTimer += deltaMs;
    
    if (this.frameTimer >= anim.frameDuration) {
      this.frameTimer -= anim.frameDuration;
      this.currentFrame++;
      
      if (this.currentFrame >= anim.frameCount) {
        if (anim.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = anim.frameCount - 1;
          // Animation complete - switch to queued or idle
          if (this.queuedState) {
            this.setState(this.queuedState, true);
          } else if (this.currentState !== 'idle') {
            this.setState('idle', true);
          }
        }
      }
    }
  }
  
  isAttacking(): boolean {
    return this.currentState === 'attack1' || this.currentState === 'attack2' || this.currentState === 'shoot';
  }
  
  isAnimComplete(): boolean {
    if (!this.config) return true;
    const anim = this.config.animations[this.currentState];
    if (!anim) return true;
    if (anim.loop) return false;
    return this.currentFrame >= anim.frameCount - 1;
  }
  
  triggerAttack(): void {
    const attacks: UnitAnimState[] = ['attack1', 'attack2'];
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    this.setState(this.config?.animations[attack] ? attack : 'attack1');
  }
  
  getState(): UnitAnimState {
    return this.currentState;
  }
  
  getFrame(): number {
    return this.currentFrame;
  }
  
  getCurrentSpriteInfo(): { path: string; frameWidth: number; frameHeight: number; frame: number; flipX: boolean } | null {
    if (!this.config) return null;
    const anim = this.config.animations[this.currentState];
    if (!anim) return null;
    
    // Add .png extension if not already present
    const path = anim.path.endsWith('.png') ? anim.path : anim.path + '.png';
    
    return {
      path,
      frameWidth: anim.frameWidth,
      frameHeight: anim.frameHeight,
      frame: this.currentFrame,
      flipX: this.facingLeft
    };
  }
}

// === SPRITE RENDERER ===

export class SpriteRenderer {
  private loader: SpriteLoader;
  private animators: Map<string, UnitAnimator> = new Map();
  
  constructor() {
    this.loader = new SpriteLoader();
  }
  
  async preloadTinySwords(): Promise<void> {
    const paths: string[] = [];
    
    for (const config of Object.values(UNIT_SPRITE_CONFIGS)) {
      for (const anim of Object.values(config.animations)) {
        if (anim) paths.push(anim.path + '.png');
      }
    }
    
    await Promise.all(paths.map(p => this.loader.load(p)));
    console.log(`Preloaded ${paths.length} Tiny Swords sprites`);
  }
  
  async preloadMiniWorld(): Promise<void> {
    const paths = Object.values(MINIWORLD_SPRITE_CONFIGS).map(c => c.path);
    await Promise.all(paths.map(p => this.loader.load(p)));
    console.log(`Preloaded ${paths.length} MiniWorld sprites`);
  }
  
  getOrCreateAnimator(entityId: string, configKey: string): UnitAnimator {
    let animator = this.animators.get(entityId);
    if (!animator) {
      animator = new UnitAnimator(configKey);
      this.animators.set(entityId, animator);
    }
    return animator;
  }
  
  removeAnimator(entityId: string): void {
    this.animators.delete(entityId);
  }
  
  updateAnimator(entityId: string, deltaMs: number): void {
    const animator = this.animators.get(entityId);
    if (animator) {
      animator.update(deltaMs);
    }
  }
  
  /**
   * Render a Tiny Swords sprite (horizontal spritesheet)
   */
  renderTinySwords(
    ctx: CanvasRenderingContext2D,
    entityId: string,
    x: number,
    y: number,
    scale: number = 0.5,
    _factionId: FactionId = 1 as FactionId
  ): boolean {
    const animator = this.animators.get(entityId);
    if (!animator) return false;
    
    const info = animator.getCurrentSpriteInfo();
    if (!info) return false;
    
    const img = this.loader.get(info.path);
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    
    const srcX = info.frame * info.frameWidth;
    const srcY = 0;
    const drawWidth = info.frameWidth * scale;
    const drawHeight = info.frameHeight * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    if (info.flipX) {
      ctx.scale(-1, 1);
    }
    
    // Draw sprite centered
    ctx.drawImage(
      img,
      srcX, srcY, info.frameWidth, info.frameHeight,
      -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
    );
    
    ctx.restore();
    return true;
  }
  
  /**
   * Render a MiniWorld sprite (grid spritesheet)
   */
  renderMiniWorld(
    ctx: CanvasRenderingContext2D,
    spriteKey: string,
    x: number,
    y: number,
    animState: UnitAnimState,
    frame: number,
    scale: number = 2,
    flipX: boolean = false
  ): boolean {
    const config = MINIWORLD_SPRITE_CONFIGS[spriteKey];
    if (!config) return false;
    
    const img = this.loader.get(config.path);
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    
    const rowConfig = config.rows[animState];
    if (!rowConfig) return false;
    
    const frameIndex = frame % rowConfig.frameCount;
    const srcX = frameIndex * config.frameWidth;
    const srcY = rowConfig.row * config.frameHeight;
    const drawWidth = config.frameWidth * scale;
    const drawHeight = config.frameHeight * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    if (flipX) {
      ctx.scale(-1, 1);
    }
    
    ctx.imageSmoothingEnabled = false; // Pixel art should be crisp
    ctx.drawImage(
      img,
      srcX, srcY, config.frameWidth, config.frameHeight,
      -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
    );
    
    ctx.restore();
    return true;
  }
  
  /**
   * Render a simple fallback circle if sprite fails to load
   */
  renderFallback(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// === GLOBAL INSTANCE ===

export const spriteRenderer = new SpriteRenderer();
