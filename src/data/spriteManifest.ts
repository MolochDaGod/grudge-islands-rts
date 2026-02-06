// ============================================
// SPRITE MANIFEST
// Maps unit types to sprite file paths and animation definitions
// ============================================

import type { AnimationState, SpriteDefinition, UnitTypeName } from '../types/index.ts';

// Base path to sprite assets (relative to src/dist/ where game.html is served)
export const SPRITE_BASE_PATH = '../../uuidsprites/dist/sprites/characters';

// Animation state configurations
const ANIMATION_CONFIGS: Record<AnimationState, { frameDuration: number; loop: boolean }> = {
  Idle: { frameDuration: 200, loop: true },
  Walk: { frameDuration: 120, loop: true },
  Attack01: { frameDuration: 100, loop: false },
  Attack02: { frameDuration: 100, loop: false },
  Attack03: { frameDuration: 100, loop: false },
  Block: { frameDuration: 150, loop: false },
  Hurt: { frameDuration: 150, loop: false },
  Death: { frameDuration: 200, loop: false }
};

/**
 * Create sprite definition for a character
 * Note: Sprite folders have double nesting: characters/{name}/{name}/
 */
function createSpriteDefinition(
  folderName: string,
  baseName: string,
  width: number = 64,
  height: number = 64
): SpriteDefinition {
  // Sprites are nested: characters/Skeleton/Skeleton/Skeleton-Idle.png
  const basePath = `${SPRITE_BASE_PATH}/${folderName}/${baseName}/${baseName}`;
  
  return {
    name: baseName,
    basePath,
    width,
    height,
    animations: {
      Idle: {
        state: 'Idle',
        frames: [`${basePath}-Idle.png`],
        frameDuration: ANIMATION_CONFIGS.Idle.frameDuration,
        loop: ANIMATION_CONFIGS.Idle.loop
      },
      Walk: {
        state: 'Walk',
        frames: [`${basePath}-Walk.png`],
        frameDuration: ANIMATION_CONFIGS.Walk.frameDuration,
        loop: ANIMATION_CONFIGS.Walk.loop
      },
      Attack01: {
        state: 'Attack01',
        frames: [`${basePath}-Attack01.png`],
        frameDuration: ANIMATION_CONFIGS.Attack01.frameDuration,
        loop: ANIMATION_CONFIGS.Attack01.loop
      },
      Attack02: {
        state: 'Attack02',
        frames: [`${basePath}-Attack02.png`],
        frameDuration: ANIMATION_CONFIGS.Attack02.frameDuration,
        loop: ANIMATION_CONFIGS.Attack02.loop
      },
      Attack03: {
        state: 'Attack03',
        // Attack03 may not exist for all units, use Attack02 as fallback
        frames: [`${basePath}-Attack02.png`],
        frameDuration: ANIMATION_CONFIGS.Attack03.frameDuration,
        loop: ANIMATION_CONFIGS.Attack03.loop
      },
      Block: {
        state: 'Block',
        frames: [`${basePath}-Block.png`],
        frameDuration: ANIMATION_CONFIGS.Block.frameDuration,
        loop: ANIMATION_CONFIGS.Block.loop
      },
      Hurt: {
        state: 'Hurt',
        frames: [`${basePath}-Hurt.png`],
        frameDuration: ANIMATION_CONFIGS.Hurt.frameDuration,
        loop: ANIMATION_CONFIGS.Hurt.loop
      },
      Death: {
        state: 'Death',
        frames: [`${basePath}-Death.png`],
        frameDuration: ANIMATION_CONFIGS.Death.frameDuration,
        loop: ANIMATION_CONFIGS.Death.loop
      }
    }
  };
}

// === SPRITE DEFINITIONS FOR ALL UNIT TYPES ===

export const SPRITE_DEFINITIONS: Record<UnitTypeName, SpriteDefinition> = {
  // Tier 1
  Skeleton: createSpriteDefinition('Skeleton', 'Skeleton'),
  Orc: createSpriteDefinition('Orc', 'Orc'),
  Soldier: createSpriteDefinition('Soldier', 'Soldier'),
  Slime: createSpriteDefinition('Slime', 'Slime'),
  
  // Tier 2
  Archer: createSpriteDefinition('Archer', 'Archer'),
  Swordsman: createSpriteDefinition('Swordsman', 'Swordsman'),
  SkeletonArcher: createSpriteDefinition('Skeleton Archer', 'Skeleton Archer'),
  
  // Tier 3
  Knight: createSpriteDefinition('Knight', 'Knight'),
  Wizard: createSpriteDefinition('Wizard', 'Wizard'),
  Lancer: createSpriteDefinition('Lancer', 'Lancer'),
  Priest: createSpriteDefinition('Priest', 'Priest'),
  
  // Tier 4
  KnightTemplar: createSpriteDefinition('Knight Templar', 'Knight Templar'),
  EliteOrc: createSpriteDefinition('Elite Orc', 'Elite Orc'),
  Werebear: createSpriteDefinition('Werebear', 'Werebear'),
  Werewolf: createSpriteDefinition('Werewolf', 'Werewolf'),
  
  // Tier 5
  ArmoredAxeman: createSpriteDefinition('Armored Axeman', 'Armored Axeman'),
  ArmoredOrc: createSpriteDefinition('Armored Orc', 'Armored Orc'),
  ArmoredSkeleton: createSpriteDefinition('Armored Skeleton', 'Armored Skeleton'),
  GreatswordSkeleton: createSpriteDefinition('Greatsword Skeleton', 'Greatsword Skeleton'),
  OrcRider: createSpriteDefinition('Orc rider', 'Orc rider')
};

/**
 * Get sprite definition for a unit type
 */
export function getSpriteDefinition(unitType: UnitTypeName): SpriteDefinition {
  return SPRITE_DEFINITIONS[unitType];
}

/**
 * Get the image path for a specific animation state
 */
export function getAnimationPath(unitType: UnitTypeName, state: AnimationState): string {
  const sprite = SPRITE_DEFINITIONS[unitType];
  return sprite.animations[state].frames[0];
}

/**
 * Get all image paths needed for a unit type (for preloading)
 */
export function getAllSpritePaths(unitType: UnitTypeName): string[] {
  const sprite = SPRITE_DEFINITIONS[unitType];
  const paths: string[] = [];
  
  for (const animation of Object.values(sprite.animations)) {
    paths.push(...animation.frames);
  }
  
  // Add base sprite (shadow is in subfolder, skip for now)
  paths.push(`${sprite.basePath}.png`);
  
  return [...new Set(paths)]; // Remove duplicates
}

/**
 * Get animation duration in milliseconds
 */
export function getAnimationDuration(unitType: UnitTypeName, state: AnimationState): number {
  const sprite = SPRITE_DEFINITIONS[unitType];
  const animation = sprite.animations[state];
  return animation.frameDuration * animation.frames.length;
}

// === FACTION COLORS FOR TINTING ===
export const FACTION_COLORS = {
  0: { main: '#FFFFFF', attack: '#FFFFFF' }, // Neutral - white
  1: { main: '#0066FF', attack: '#00FF00' }, // Player - blue/green
  2: { main: '#FF0000', attack: '#FFFF00' }, // Goblin - red/yellow
  3: { main: '#9900FF', attack: '#FF00FF' }  // Enemy - purple/magenta
};

// === GENERAL SPRITE MAPPING (for class selection) ===
export const GENERAL_SPRITES: Record<string, UnitTypeName> = {
  Warrior: 'Knight',
  Mage: 'Wizard',
  Rogue: 'Archer',
  Tank: 'KnightTemplar',
  Ranger: 'Archer',
  Tactician: 'Priest'
};
