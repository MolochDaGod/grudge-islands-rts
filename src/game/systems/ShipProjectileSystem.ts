// ============================================
// SHIP PROJECTILE SYSTEM
// Beam-based projectiles with trails and AOE explosions
// ============================================

import type { Position, FactionId } from '../../types/index.ts';

// === BEAM COLORS ===

export type BeamColor = 'green' | 'orange' | 'purple' | 'red';

export interface BeamConfig {
  path: string;
  trailColor: string;
  glowColor: string;
  aoeDamageMultiplier: number;
}

// Beam sprites from bulletcolors folder
export const BEAM_CONFIGS: Record<BeamColor, BeamConfig> = {
  green: {
    path: 'sprites/bulletcolors/beam_green.png',
    trailColor: '#00ff88',
    glowColor: 'rgba(0, 255, 136, 0.6)',
    aoeDamageMultiplier: 0.8  // Poison/acid - lower initial, DOT potential
  },
  orange: {
    path: 'sprites/bulletcolors/beam_orange.png',
    trailColor: '#ff8800',
    glowColor: 'rgba(255, 136, 0, 0.6)',
    aoeDamageMultiplier: 1.2  // Fire - high damage
  },
  purple: {
    path: 'sprites/bulletcolors/beam_purple.png',
    trailColor: '#aa44ff',
    glowColor: 'rgba(170, 68, 255, 0.6)',
    aoeDamageMultiplier: 1.0  // Magic - balanced
  },
  red: {
    path: 'sprites/bulletcolors/beam_red.png',
    trailColor: '#ff2244',
    glowColor: 'rgba(255, 34, 68, 0.6)',
    aoeDamageMultiplier: 1.5  // Explosive - highest AOE
  }
};

// === AOE EFFECT CONFIG ===

export interface AOEEffectConfig {
  spritesheet: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  columns: number;
  radius: number;
  damageMultiplier: number;
}

// AOE effects from effects/pixel/ folder
export const AOE_EFFECTS: Record<string, AOEEffectConfig> = {
  fire_explosion: {
    spritesheet: 'effects/effects/pixel/11_fire_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 20,
    columns: 8,
    radius: 60,
    damageMultiplier: 0.5
  },
  magic_burst: {
    spritesheet: 'effects/effects/pixel/1_magicspell_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 20,
    columns: 8,
    radius: 50,
    damageMultiplier: 0.4
  },
  vortex: {
    spritesheet: 'effects/effects/pixel/13_vortex_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 15,
    columns: 8,
    radius: 70,
    damageMultiplier: 0.3
  },
  freeze_burst: {
    spritesheet: 'effects/effects/pixel/19_freezing_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 24,
    fps: 15,
    columns: 8,
    radius: 55,
    damageMultiplier: 0.35
  },
  weapon_impact: {
    spritesheet: 'effects/effects/pixel/10_weaponhit_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 16,
    fps: 24,
    columns: 8,
    radius: 40,
    damageMultiplier: 0.6
  },
  bright_fire: {
    spritesheet: 'effects/effects/pixel/9_brightfire_spritesheet.png',
    frameWidth: 100,
    frameHeight: 100,
    frameCount: 32,
    fps: 18,
    columns: 8,
    radius: 65,
    damageMultiplier: 0.55
  }
};

// Map beam colors to their AOE effects
export const BEAM_TO_AOE: Record<BeamColor, string> = {
  green: 'vortex',          // Poison/acid swirl
  orange: 'fire_explosion', // Fire burst
  purple: 'magic_burst',    // Magic explosion
  red: 'bright_fire'        // Intense fire/explosive
};

// === TRAIL PARTICLE ===

interface TrailParticle {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  age: number;
}

// === SHIP PROJECTILE ===

export interface ShipProjectile {
  id: string;
  shipId: string;
  targetId: string | null;
  
  // Position & motion
  position: Position;
  targetPosition: Position;
  velocity: Position;
  speed: number;
  rotation: number;
  
  // Appearance
  beamColor: BeamColor;
  scale: number;
  
  // Trail
  trail: TrailParticle[];
  trailSpawnTimer: number;
  
  // Combat
  damage: number;
  aoeRadius: number;
  faction: FactionId;
  
  // Lifetime
  lifetime: number;
  maxLifetime: number;
  isComplete: boolean;
}

// === ACTIVE AOE EFFECT ===

export interface ActiveAOE {
  id: string;
  position: Position;
  effectKey: string;
  currentFrame: number;
  elapsedTime: number;
  frameTime: number;
  scale: number;
  isComplete: boolean;
  
  // Damage info
  damage: number;
  radius: number;
  faction: FactionId;
  hitEntities: Set<string>;  // Track what we've already damaged
}

// === SHIP PROJECTILE SYSTEM ===

export class ShipProjectileSystem {
  private projectiles: Map<string, ShipProjectile> = new Map();
  private aoeEffects: Map<string, ActiveAOE> = new Map();
  private beamSprites: Map<BeamColor, HTMLImageElement> = new Map();
  private aoeSprites: Map<string, HTMLImageElement> = new Map();
  
  private nextId: number = 0;
  
  // Callbacks
  public onDamage: ((targetId: string, damage: number, projectileId: string, isAOE: boolean) => void) | null = null;
  public onAOEDamage: ((position: Position, radius: number, damage: number, faction: FactionId, excludeIds: Set<string>) => string[]) | null = null;

  constructor() {
    this.loadAssets();
  }

  private async loadAssets(): Promise<void> {
    // Load beam sprites
    for (const [color, config] of Object.entries(BEAM_CONFIGS)) {
      const img = new Image();
      img.onload = () => {
        this.beamSprites.set(color as BeamColor, img);
      };
      img.onerror = () => {
        console.warn(`[ShipProjectileSystem] Failed to load beam: ${config.path}`);
      };
      img.src = config.path;
    }

    // Load AOE effect spritesheets
    for (const [key, config] of Object.entries(AOE_EFFECTS)) {
      const img = new Image();
      img.onload = () => {
        this.aoeSprites.set(key, img);
      };
      img.onerror = () => {
        console.warn(`[ShipProjectileSystem] Failed to load AOE: ${config.spritesheet}`);
      };
      img.src = config.spritesheet;
    }
  }

  private generateId(): string {
    return `ship_proj_${this.nextId++}`;
  }

  // === PROJECTILE CREATION ===

  fireProjectile(config: {
    shipId: string;
    targetId: string | null;
    sourcePosition: Position;
    targetPosition: Position;
    damage: number;
    faction: FactionId;
    beamColor?: BeamColor;
    speed?: number;
    aoeRadius?: number;
  }): string {
    const id = this.generateId();
    
    // Calculate velocity toward target
    const dx = config.targetPosition.x - config.sourcePosition.x;
    const dy = config.targetPosition.y - config.sourcePosition.y;
    const dist = Math.hypot(dx, dy);
    const speed = config.speed ?? 450;
    
    const velocity = {
      x: dist > 0 ? (dx / dist) * speed : 0,
      y: dist > 0 ? (dy / dist) * speed : 0
    };
    
    const rotation = Math.atan2(dy, dx);
    
    // Determine beam color based on faction or random
    let beamColor = config.beamColor;
    if (!beamColor) {
      const colors: BeamColor[] = ['green', 'orange', 'purple', 'red'];
      // Use faction to pick default color
      switch (config.faction) {
        case 1: beamColor = 'green'; break;
        case 2: beamColor = 'red'; break;
        case 3: beamColor = 'purple'; break;
        default: beamColor = colors[Math.floor(Math.random() * colors.length)];
      }
    }
    
    const projectile: ShipProjectile = {
      id,
      shipId: config.shipId,
      targetId: config.targetId,
      position: { ...config.sourcePosition },
      targetPosition: { ...config.targetPosition },
      velocity,
      speed,
      rotation,
      beamColor,
      scale: 1.0,
      trail: [],
      trailSpawnTimer: 0,
      damage: config.damage,
      aoeRadius: config.aoeRadius ?? 50,
      faction: config.faction,
      lifetime: 0,
      maxLifetime: 5000,  // 5 second max
      isComplete: false
    };
    
    this.projectiles.set(id, projectile);
    return id;
  }

  // === UPDATE ===

  update(deltaTime: number, getTargetPosition?: (id: string) => Position | null): void {
    const dt = deltaTime / 1000;  // Convert to seconds for physics
    
    // Update projectiles
    for (const projectile of this.projectiles.values()) {
      this.updateProjectile(projectile, dt, deltaTime, getTargetPosition);
      
      if (projectile.isComplete) {
        this.projectiles.delete(projectile.id);
      }
    }
    
    // Update AOE effects
    for (const aoe of this.aoeEffects.values()) {
      this.updateAOE(aoe, deltaTime);
      
      if (aoe.isComplete) {
        this.aoeEffects.delete(aoe.id);
      }
    }
  }

  private updateProjectile(
    proj: ShipProjectile,
    dt: number,
    deltaTimeMs: number,
    getTargetPosition?: (id: string) => Position | null
  ): void {
    // Update lifetime
    proj.lifetime += deltaTimeMs;
    if (proj.lifetime >= proj.maxLifetime) {
      proj.isComplete = true;
      return;
    }
    
    // Homing: recalculate velocity if target moved
    if (proj.targetId && getTargetPosition) {
      const targetPos = getTargetPosition(proj.targetId);
      if (targetPos) {
        proj.targetPosition = targetPos;
        const dx = targetPos.x - proj.position.x;
        const dy = targetPos.y - proj.position.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
          // Smooth homing - interpolate toward target direction
          const targetVelX = (dx / dist) * proj.speed;
          const targetVelY = (dy / dist) * proj.speed;
          
          proj.velocity.x += (targetVelX - proj.velocity.x) * dt * 3;
          proj.velocity.y += (targetVelY - proj.velocity.y) * dt * 3;
          
          // Normalize speed
          const currentSpeed = Math.hypot(proj.velocity.x, proj.velocity.y);
          if (currentSpeed > 0) {
            proj.velocity.x = (proj.velocity.x / currentSpeed) * proj.speed;
            proj.velocity.y = (proj.velocity.y / currentSpeed) * proj.speed;
          }
          
          proj.rotation = Math.atan2(proj.velocity.y, proj.velocity.x);
        }
      }
    }
    
    // Move projectile
    proj.position.x += proj.velocity.x * dt;
    proj.position.y += proj.velocity.y * dt;
    
    // Update trail
    this.updateTrail(proj, deltaTimeMs);
    
    // Check if reached target
    const distToTarget = Math.hypot(
      proj.targetPosition.x - proj.position.x,
      proj.targetPosition.y - proj.position.y
    );
    
    if (distToTarget < 25) {
      this.onProjectileHit(proj);
    }
  }

  private updateTrail(proj: ShipProjectile, deltaTimeMs: number): void {
    // Spawn new trail particles
    proj.trailSpawnTimer += deltaTimeMs;
    const spawnInterval = 15;  // Spawn every 15ms for dense trail
    
    while (proj.trailSpawnTimer >= spawnInterval) {
      proj.trailSpawnTimer -= spawnInterval;
      
      // Add new particle at current position with slight offset
      proj.trail.push({
        x: proj.position.x + (Math.random() - 0.5) * 4,
        y: proj.position.y + (Math.random() - 0.5) * 4,
        alpha: 1.0,
        scale: 0.8 + Math.random() * 0.4,
        age: 0
      });
    }
    
    // Update and remove old particles
    const maxAge = 300;  // Trail particles last 300ms
    for (let i = proj.trail.length - 1; i >= 0; i--) {
      const particle = proj.trail[i];
      particle.age += deltaTimeMs;
      particle.alpha = 1 - (particle.age / maxAge);
      particle.scale *= 0.98;  // Shrink over time
      
      if (particle.age >= maxAge || particle.alpha <= 0) {
        proj.trail.splice(i, 1);
      }
    }
  }

  private onProjectileHit(proj: ShipProjectile): void {
    proj.isComplete = true;
    
    // Deal direct damage to target
    if (proj.targetId && this.onDamage) {
      this.onDamage(proj.targetId, proj.damage, proj.id, false);
    }
    
    // Spawn AOE effect at impact point
    this.spawnAOEEffect(proj);
  }

  private spawnAOEEffect(proj: ShipProjectile): void {
    const id = this.generateId();
    const effectKey = BEAM_TO_AOE[proj.beamColor];
    const effectConfig = AOE_EFFECTS[effectKey];
    const beamConfig = BEAM_CONFIGS[proj.beamColor];
    
    if (!effectConfig) return;
    
    // Calculate AOE damage
    const aoeDamage = Math.floor(proj.damage * effectConfig.damageMultiplier * beamConfig.aoeDamageMultiplier);
    
    const aoe: ActiveAOE = {
      id,
      position: { ...proj.position },
      effectKey,
      currentFrame: 0,
      elapsedTime: 0,
      frameTime: 1000 / effectConfig.fps,
      scale: proj.aoeRadius / 50,  // Scale based on AOE radius
      isComplete: false,
      damage: aoeDamage,
      radius: proj.aoeRadius,
      faction: proj.faction,
      hitEntities: new Set(proj.targetId ? [proj.targetId] : [])  // Exclude direct hit target
    };
    
    this.aoeEffects.set(id, aoe);
    
    // Deal AOE damage immediately
    if (this.onAOEDamage) {
      const hitIds = this.onAOEDamage(aoe.position, aoe.radius, aoe.damage, aoe.faction, aoe.hitEntities);
      hitIds.forEach(id => aoe.hitEntities.add(id));
    }
  }

  private updateAOE(aoe: ActiveAOE, deltaTime: number): void {
    aoe.elapsedTime += deltaTime;
    
    const config = AOE_EFFECTS[aoe.effectKey];
    if (!config) {
      aoe.isComplete = true;
      return;
    }
    
    // Update frame
    if (aoe.elapsedTime >= aoe.frameTime) {
      aoe.elapsedTime -= aoe.frameTime;
      aoe.currentFrame++;
      
      if (aoe.currentFrame >= config.frameCount) {
        aoe.isComplete = true;
      }
    }
  }

  // === RENDER ===

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    // Render trails first (behind projectiles)
    for (const proj of this.projectiles.values()) {
      this.renderTrail(ctx, proj, cameraX, cameraY);
    }
    
    // Render projectiles
    for (const proj of this.projectiles.values()) {
      this.renderProjectile(ctx, proj, cameraX, cameraY);
    }
    
    // Render AOE effects on top
    for (const aoe of this.aoeEffects.values()) {
      this.renderAOE(ctx, aoe, cameraX, cameraY);
    }
  }

  private renderTrail(ctx: CanvasRenderingContext2D, proj: ShipProjectile, cameraX: number, cameraY: number): void {
    const config = BEAM_CONFIGS[proj.beamColor];
    
    ctx.save();
    
    for (const particle of proj.trail) {
      const x = particle.x - cameraX;
      const y = particle.y - cameraY;
      
      // Glow effect
      ctx.globalAlpha = particle.alpha * 0.5;
      ctx.fillStyle = config.glowColor;
      ctx.beginPath();
      ctx.arc(x, y, 8 * particle.scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = config.trailColor;
      ctx.beginPath();
      ctx.arc(x, y, 4 * particle.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  private renderProjectile(ctx: CanvasRenderingContext2D, proj: ShipProjectile, cameraX: number, cameraY: number): void {
    const x = proj.position.x - cameraX;
    const y = proj.position.y - cameraY;
    const config = BEAM_CONFIGS[proj.beamColor];
    const sprite = this.beamSprites.get(proj.beamColor);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(proj.rotation);
    
    // Draw glow
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = config.glowColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * proj.scale, 10 * proj.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
    
    if (sprite && sprite.complete) {
      // Draw beam sprite
      const w = sprite.width * proj.scale;
      const h = sprite.height * proj.scale;
      ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    } else {
      // Fallback: draw beam shape
      ctx.fillStyle = config.trailColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15 * proj.scale, 6 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * proj.scale, 3 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  private renderAOE(ctx: CanvasRenderingContext2D, aoe: ActiveAOE, cameraX: number, cameraY: number): void {
    const config = AOE_EFFECTS[aoe.effectKey];
    const sprite = this.aoeSprites.get(aoe.effectKey);
    
    if (!config) return;
    
    const x = aoe.position.x - cameraX;
    const y = aoe.position.y - cameraY;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(aoe.scale, aoe.scale);
    
    if (sprite && sprite.complete) {
      // Calculate source rect from spritesheet
      const col = aoe.currentFrame % config.columns;
      const row = Math.floor(aoe.currentFrame / config.columns);
      const sx = col * config.frameWidth;
      const sy = row * config.frameHeight;
      
      ctx.drawImage(
        sprite,
        sx, sy, config.frameWidth, config.frameHeight,
        -config.frameWidth / 2, -config.frameHeight / 2, 
        config.frameWidth, config.frameHeight
      );
    } else {
      // Fallback: simple explosion circle
      const progress = aoe.currentFrame / config.frameCount;
      const alpha = 1 - progress;
      const radius = aoe.radius * (0.5 + progress * 0.5);
      
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  // === UTILITY ===

  clear(): void {
    this.projectiles.clear();
    this.aoeEffects.clear();
  }

  getProjectileCount(): number {
    return this.projectiles.size;
  }

  getAOECount(): number {
    return this.aoeEffects.size;
  }

  getProjectilesByShip(shipId: string): ShipProjectile[] {
    const results: ShipProjectile[] = [];
    for (const proj of this.projectiles.values()) {
      if (proj.shipId === shipId) {
        results.push(proj);
      }
    }
    return results;
  }
}
