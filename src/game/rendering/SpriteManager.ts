// ============================================
// SPRITE MANAGER
// Handles sprite loading, caching, and animation state management
// ============================================

import type { AnimationState, UnitTypeName } from '../../types/index.ts';
import { SPRITE_DEFINITIONS, getAllSpritePaths } from '../../data/spriteManifest.ts';

export interface LoadedSprite {
  image: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

export class SpriteManager {
  private sprites: Map<string, LoadedSprite> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  
  /**
   * Preload all sprites for a unit type
   */
  async preloadUnitSprites(unitType: UnitTypeName): Promise<void> {
    const paths = getAllSpritePaths(unitType);
    await Promise.all(paths.map(path => this.loadSprite(path)));
  }
  
  /**
   * Preload sprites for multiple unit types
   */
  async preloadMultipleUnits(unitTypes: UnitTypeName[]): Promise<void> {
    await Promise.all(unitTypes.map(type => this.preloadUnitSprites(type)));
  }
  
  /**
   * Load a single sprite image
   */
  loadSprite(path: string): Promise<HTMLImageElement> {
    // Return cached promise if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }
    
    // Return immediately if already loaded
    const cached = this.sprites.get(path);
    if (cached?.loaded) {
      return Promise.resolve(cached.image);
    }
    
    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, _reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.sprites.set(path, { image: img, loaded: true, error: false });
        this.loadingPromises.delete(path);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${path}`);
        this.sprites.set(path, { image: img, loaded: false, error: true });
        this.loadingPromises.delete(path);
        // Still resolve with a placeholder - don't break the game
        resolve(img);
      };
      
      img.src = path;
    });
    
    this.loadingPromises.set(path, promise);
    return promise;
  }
  
  /**
   * Get a loaded sprite image
   */
  getSprite(path: string): HTMLImageElement | null {
    const sprite = this.sprites.get(path);
    if (sprite?.loaded && !sprite.error) {
      return sprite.image;
    }
    return null;
  }
  
  /**
   * Get the sprite for a specific unit animation state
   */
  getUnitSprite(unitType: UnitTypeName, state: AnimationState): HTMLImageElement | null {
    const definition = SPRITE_DEFINITIONS[unitType];
    if (!definition) return null;
    
    const animation = definition.animations[state];
    if (!animation || animation.frames.length === 0) return null;
    
    return this.getSprite(animation.frames[0]);
  }
  
  /**
   * Check if all sprites for a unit type are loaded
   */
  isUnitLoaded(unitType: UnitTypeName): boolean {
    const paths = getAllSpritePaths(unitType);
    return paths.every(path => {
      const sprite = this.sprites.get(path);
      return sprite?.loaded && !sprite.error;
    });
  }
  
  /**
   * Get loading progress (0-1)
   */
  getLoadingProgress(): number {
    if (this.sprites.size === 0) return 0;
    
    let loaded = 0;
    this.sprites.forEach(sprite => {
      if (sprite.loaded) loaded++;
    });
    
    return loaded / this.sprites.size;
  }
  
  /**
   * Clear all cached sprites
   */
  clear(): void {
    this.sprites.clear();
    this.loadingPromises.clear();
  }
}

// === ANIMATION STATE MACHINE ===

export class AnimationController {
  private currentState: AnimationState = 'Idle';
  private currentFrame: number = 0;
  private frameTime: number = 0;
  private stateTime: number = 0;
  private queuedState: AnimationState | null = null;
  
  private readonly unitType: UnitTypeName;
  
  constructor(unitType: UnitTypeName) {
    this.unitType = unitType;
  }
  
  /**
   * Update animation state
   * @param deltaTime Time since last update in milliseconds
   */
  update(deltaTime: number): void {
    const definition = SPRITE_DEFINITIONS[this.unitType];
    if (!definition) return;
    
    const animation = definition.animations[this.currentState];
    if (!animation) return;
    
    this.frameTime += deltaTime;
    this.stateTime += deltaTime;
    
    // Advance frame if needed
    if (this.frameTime >= animation.frameDuration) {
      this.frameTime -= animation.frameDuration;
      this.currentFrame++;
      
      // Handle animation end
      if (this.currentFrame >= animation.frames.length) {
        if (animation.loop) {
          this.currentFrame = 0;
        } else {
          // Animation complete, switch to queued or idle
          this.currentFrame = animation.frames.length - 1;
          if (this.queuedState) {
            this.setState(this.queuedState);
            this.queuedState = null;
          } else if (this.currentState !== 'Idle' && this.currentState !== 'Death') {
            this.setState('Idle');
          }
        }
      }
    }
  }
  
  /**
   * Set animation state
   */
  setState(state: AnimationState, force: boolean = false): void {
    if (this.currentState === state && !force) return;
    
    // Don't interrupt death
    if (this.currentState === 'Death' && !force) return;
    
    // Don't interrupt attacks unless forced
    if (!force && this.isAttacking() && !this.isAnimationComplete()) {
      this.queuedState = state;
      return;
    }
    
    this.currentState = state;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.stateTime = 0;
    this.queuedState = null;
  }
  
  /**
   * Get current animation state
   */
  getState(): AnimationState {
    return this.currentState;
  }
  
  /**
   * Get current frame index
   */
  getFrame(): number {
    return this.currentFrame;
  }
  
  /**
   * Get current frame image path
   */
  getCurrentFramePath(): string {
    const definition = SPRITE_DEFINITIONS[this.unitType];
    if (!definition) return '';
    
    const animation = definition.animations[this.currentState];
    if (!animation || animation.frames.length === 0) return '';
    
    const frameIndex = Math.min(this.currentFrame, animation.frames.length - 1);
    return animation.frames[frameIndex];
  }
  
  /**
   * Check if current animation is complete
   */
  isAnimationComplete(): boolean {
    const definition = SPRITE_DEFINITIONS[this.unitType];
    if (!definition) return true;
    
    const animation = definition.animations[this.currentState];
    if (!animation) return true;
    
    if (animation.loop) return false;
    
    return this.currentFrame >= animation.frames.length - 1;
  }
  
  /**
   * Check if currently in an attack state
   */
  isAttacking(): boolean {
    return this.currentState === 'Attack01' || 
           this.currentState === 'Attack02' || 
           this.currentState === 'Attack03';
  }
  
  /**
   * Trigger a random attack animation
   */
  triggerAttack(): void {
    const attacks: AnimationState[] = ['Attack01', 'Attack02', 'Attack03'];
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    this.setState(randomAttack);
  }
  
  /**
   * Get time spent in current state (ms)
   */
  getStateTime(): number {
    return this.stateTime;
  }
}

// === GLOBAL SPRITE MANAGER INSTANCE ===
export const spriteManager = new SpriteManager();
