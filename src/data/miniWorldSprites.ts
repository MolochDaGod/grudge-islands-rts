// ============================================
// MINIWORLD SPRITES MANIFEST
// Sprite sheet definitions for terrain, buildings, units
// ============================================

// Path relative to src/dist/ where game.html is served
const SPRITE_BASE = '../../addons/MiniWorldSprites';

// === TERRAIN TILES (16x16 each) ===

export const TERRAIN_SPRITES = {
  grass: {
    path: `${SPRITE_BASE}/Ground/Grass.png`,
    tileSize: 16,
    variants: 4 // 4 grass variants in a row
  },
  texturedGrass: {
    path: `${SPRITE_BASE}/Ground/TexturedGrass.png`,
    tileSize: 16,
    variants: 4
  },
  deadGrass: {
    path: `${SPRITE_BASE}/Ground/DeadGrass.png`,
    tileSize: 16,
    variants: 4
  },
  shore: {
    path: `${SPRITE_BASE}/Ground/Shore.png`,
    tileSize: 16,
    variants: 4 // Sand/water transitions
  },
  cliff: {
    path: `${SPRITE_BASE}/Ground/Cliff.png`,
    tileSize: 16,
    variants: 4
  },
  cliffWater: {
    path: `${SPRITE_BASE}/Ground/Cliff-Water.png`,
    tileSize: 16,
    variants: 4
  },
  winter: {
    path: `${SPRITE_BASE}/Ground/Winter.png`,
    tileSize: 16,
    variants: 4
  }
};

// === NATURE SPRITES ===

export const NATURE_SPRITES = {
  trees: {
    path: `${SPRITE_BASE}/Nature/Trees.png`,
    frameWidth: 32,
    frameHeight: 48,
    variants: 6
  },
  pineTrees: {
    path: `${SPRITE_BASE}/Nature/PineTrees.png`,
    frameWidth: 32,
    frameHeight: 48,
    variants: 6
  },
  coconutTrees: {
    path: `${SPRITE_BASE}/Nature/CoconutTrees.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  deadTrees: {
    path: `${SPRITE_BASE}/Nature/DeadTrees.png`,
    frameWidth: 32,
    frameHeight: 48,
    variants: 4
  },
  rocks: {
    path: `${SPRITE_BASE}/Nature/Rocks.png`,
    frameWidth: 32,
    frameHeight: 32,
    variants: 6
  },
  cactus: {
    path: `${SPRITE_BASE}/Nature/Cactus.png`,
    frameWidth: 16,
    frameHeight: 32,
    variants: 4
  },
  wheatfield: {
    path: `${SPRITE_BASE}/Nature/Wheatfield.png`,
    frameWidth: 16,
    frameHeight: 16,
    variants: 4
  }
};

// === FACTION COLORS ===
export type FactionColor = 'Cyan' | 'Lime' | 'Purple' | 'Red' | 'Wood';

export const FACTION_TO_COLOR: Record<number, FactionColor> = {
  0: 'Wood',    // Neutral
  1: 'Cyan',    // Player
  2: 'Red',     // Goblin/Enemy
  3: 'Lime',    // Ally
  4: 'Purple'   // Enemy 2
};

// === BUILDING SPRITES ===

export interface BuildingSpriteConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  variants: number; // Different building stages or types
  rows: number;
}

function getBuildingPath(type: string, faction: FactionColor): string {
  if (faction === 'Wood') {
    return `${SPRITE_BASE}/Buildings/Wood/${type}.png`;
  }
  return `${SPRITE_BASE}/Buildings/${faction}/${faction}${type}.png`;
}

export const BUILDING_SPRITE_CONFIGS: Record<string, { frameWidth: number; frameHeight: number; variants: number; rows: number }> = {
  Barracks: { frameWidth: 64, frameHeight: 64, variants: 3, rows: 2 },
  Tower: { frameWidth: 32, frameHeight: 64, variants: 4, rows: 3 },
  Keep: { frameWidth: 96, frameHeight: 96, variants: 2, rows: 2 },
  Docks: { frameWidth: 64, frameHeight: 48, variants: 3, rows: 1 },
  Houses: { frameWidth: 48, frameHeight: 48, variants: 4, rows: 2 },
  Huts: { frameWidth: 32, frameHeight: 32, variants: 4, rows: 2 },
  Market: { frameWidth: 64, frameHeight: 48, variants: 2, rows: 2 },
  Taverns: { frameWidth: 64, frameHeight: 64, variants: 2, rows: 1 },
  Well: { frameWidth: 32, frameHeight: 32, variants: 2, rows: 1 },
  Workshops: { frameWidth: 64, frameHeight: 48, variants: 3, rows: 2 },
  Chapels: { frameWidth: 48, frameHeight: 64, variants: 2, rows: 1 },
  Resources: { frameWidth: 32, frameHeight: 32, variants: 6, rows: 2 },
  Ship: { frameWidth: 48, frameHeight: 32, variants: 3, rows: 1 }
};

export function getBuildingSprite(buildingType: string, faction: FactionColor): { path: string; config: typeof BUILDING_SPRITE_CONFIGS[string] } {
  const config = BUILDING_SPRITE_CONFIGS[buildingType];
  return {
    path: getBuildingPath(buildingType, faction),
    config
  };
}

// === SPECIAL BUILDINGS ===

export const SPECIAL_BUILDINGS = {
  mausoleum: {
    path: `${SPRITE_BASE}/Buildings/Enemy/Mausoleum.png`,
    frameWidth: 64,
    frameHeight: 80,
    variants: 1
  },
  spearWall: {
    path: `${SPRITE_BASE}/Buildings/Enemy/SpearWall.png`,
    frameWidth: 32,
    frameHeight: 48,
    variants: 4
  },
  cave: {
    path: `${SPRITE_BASE}/Buildings/Wood/CaveV2.png`,
    frameWidth: 64,
    frameHeight: 64,
    variants: 2
  }
};

// === CHARACTER SPRITES ===
// 8-direction sprite sheets with animations

export interface CharacterSpriteConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  directions: number; // Usually 8
  framesPerDirection: number;
  animations: {
    idle: { row: number; frames: number };
    walk: { row: number; frames: number };
    attack: { row: number; frames: number };
    death?: { row: number; frames: number };
  };
}

// Soldier unit paths by faction
function getSoldierPath(unitType: string, faction: FactionColor, category: 'Melee' | 'Ranged'): string {
  if (faction === 'Wood') {
    return `${SPRITE_BASE}/Characters/Soldiers/${category}/${unitType}Template.png`;
  }
  return `${SPRITE_BASE}/Characters/Soldiers/${category}/${faction}${category}/${unitType}${faction}.png`;
}

// Standard soldier sprite config (8 directions, 6 frames per direction)
const SOLDIER_SPRITE_CONFIG = {
  frameWidth: 16,
  frameHeight: 16,
  directions: 8,
  framesPerDirection: 6,
  animations: {
    idle: { row: 0, frames: 1 },
    walk: { row: 0, frames: 6 },
    attack: { row: 1, frames: 6 },
    death: { row: 2, frames: 4 }
  }
};

export const SOLDIER_TYPES = {
  melee: ['Assassin', 'Axeman', 'Spearman', 'Swordsman'] as const,
  ranged: ['Bowman', 'Mage', 'Musketeer'] as const,
  mounted: ['Knight'] as const
};

export function getSoldierSprite(unitType: string, faction: FactionColor): CharacterSpriteConfig {
  let category: 'Melee' | 'Ranged' = 'Melee';
  if (SOLDIER_TYPES.ranged.includes(unitType as any)) {
    category = 'Ranged';
  }
  
  return {
    path: getSoldierPath(unitType, faction, category),
    ...SOLDIER_SPRITE_CONFIG
  };
}

// === MONSTER SPRITES ===

export const MONSTER_SPRITES: Record<string, CharacterSpriteConfig> = {
  // Goblins
  ArcherGoblin: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/ArcherGoblin.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  ClubGoblin: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/ClubGoblin.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  SpearGoblin: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/SpearGoblin.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  KamikazeGoblin: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/KamikazeGoblin.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Orc: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/Orc.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  OrcMage: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/OrcMage.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  OrcShaman: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/OrcShaman.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Minotaur: {
    path: `${SPRITE_BASE}/Characters/Monsters/Goblins/Minotaur.png`,
    frameWidth: 32, frameHeight: 32, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  
  // Slimes
  Slime: {
    path: `${SPRITE_BASE}/Characters/Monsters/Slimes/Slime.png`,
    frameWidth: 16, frameHeight: 16, directions: 1, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 4 }, walk: { row: 0, frames: 4 }, attack: { row: 0, frames: 4 } }
  },
  SlimeBlue: {
    path: `${SPRITE_BASE}/Characters/Monsters/Slimes/SlimeBlue.png`,
    frameWidth: 16, frameHeight: 16, directions: 1, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 4 }, walk: { row: 0, frames: 4 }, attack: { row: 0, frames: 4 } }
  },
  MegaSlimeGreen: {
    path: `${SPRITE_BASE}/Characters/Monsters/Slimes/MegaSlimeGreen.png`,
    frameWidth: 32, frameHeight: 32, directions: 1, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 4 }, walk: { row: 0, frames: 4 }, attack: { row: 0, frames: 4 } }
  },
  KingSlimeGreen: {
    path: `${SPRITE_BASE}/Characters/Monsters/Slimes/KingSlimeGreen.png`,
    frameWidth: 48, frameHeight: 48, directions: 1, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 4 }, walk: { row: 0, frames: 4 }, attack: { row: 0, frames: 4 } }
  },
  
  // Giants
  Mammoth: {
    path: `${SPRITE_BASE}/Characters/Monsters/Giants/Mammoth.png`,
    frameWidth: 64, frameHeight: 64, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  Wendigo: {
    path: `${SPRITE_BASE}/Characters/Monsters/Giants/Wendigo.png`,
    frameWidth: 48, frameHeight: 64, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  Yeti: {
    path: `${SPRITE_BASE}/Characters/Monsters/Giants/Yeti.png`,
    frameWidth: 48, frameHeight: 48, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  
  // Demons
  RedDemon: {
    path: `${SPRITE_BASE}/Characters/Monsters/Demons/RedDemon.png`,
    frameWidth: 32, frameHeight: 32, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  ArmouredRedDemon: {
    path: `${SPRITE_BASE}/Characters/Monsters/Demons/ArmouredRedDemon.png`,
    frameWidth: 32, frameHeight: 32, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  
  // Dragons
  RedDragon: {
    path: `${SPRITE_BASE}/Characters/Monsters/Dragons/RedDragon.png`,
    frameWidth: 64, frameHeight: 64, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  BlackDragon: {
    path: `${SPRITE_BASE}/Characters/Monsters/Dragons/BlackDragon.png`,
    frameWidth: 64, frameHeight: 64, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  
  // Sea
  GiantCrab: {
    path: `${SPRITE_BASE}/Characters/Monsters/Sea/GiantCrab.png`,
    frameWidth: 32, frameHeight: 32, directions: 4, framesPerDirection: 4,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 4 }, attack: { row: 1, frames: 4 } }
  },
  
  // Pirates
  PirateCaptain: {
    path: `${SPRITE_BASE}/Characters/Monsters/Pirates/PirateCaptain.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  PirateGrunt: {
    path: `${SPRITE_BASE}/Characters/Monsters/Pirates/PirateGrunt.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  PirateGunner: {
    path: `${SPRITE_BASE}/Characters/Monsters/Pirates/PirateGunner.png`,
    frameWidth: 16, frameHeight: 16, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  }
};

// === CHAMPION/HERO SPRITES ===

export const CHAMPION_SPRITES: Record<string, CharacterSpriteConfig> = {
  Arthax: {
    path: `${SPRITE_BASE}/Characters/Champions/Arthax.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Grum: {
    path: `${SPRITE_BASE}/Characters/Champions/Grum.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Kanji: {
    path: `${SPRITE_BASE}/Characters/Champions/Kanji.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Katan: {
    path: `${SPRITE_BASE}/Characters/Champions/Katan.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Necromancer: {
    path: `${SPRITE_BASE}/Characters/Champions/Necromancer.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Okomo: {
    path: `${SPRITE_BASE}/Characters/Champions/Okomo.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  },
  Zhinja: {
    path: `${SPRITE_BASE}/Characters/Champions/Zhinja.png`,
    frameWidth: 24, frameHeight: 24, directions: 8, framesPerDirection: 6,
    animations: { idle: { row: 0, frames: 1 }, walk: { row: 0, frames: 6 }, attack: { row: 1, frames: 6 } }
  }
};

// === PROJECTILE SPRITES ===

export const PROJECTILE_SPRITES = {
  arrowShort: { path: `${SPRITE_BASE}/Objects/ArrowShort.png`, width: 16, height: 4 },
  arrowLong: { path: `${SPRITE_BASE}/Objects/ArrowLong.png`, width: 24, height: 4 },
  ballistaBolt: { path: `${SPRITE_BASE}/Objects/BallistaBolt.png`, width: 32, height: 8 },
  fireball: { path: `${SPRITE_BASE}/Objects/FireballProjectile.png`, width: 16, height: 16, animated: true, frames: 4 },
  bullet: { path: `${SPRITE_BASE}/Objects/Bullet.png`, width: 8, height: 4 },
  spear: { path: `${SPRITE_BASE}/Objects/Spear.png`, width: 32, height: 6 }
};

// === UI SPRITES ===

export const UI_SPRITES = {
  boxSelector: { path: `${SPRITE_BASE}/User Interface/BoxSelector.png` },
  highlightedBoxes: { path: `${SPRITE_BASE}/User Interface/Highlighted-Boxes.png` },
  iconsEssentials: { path: `${SPRITE_BASE}/User Interface/Icons-Essentials.png` },
  uiIcons: { path: `${SPRITE_BASE}/User Interface/UiIcons.png` }
};

// === ANIMAL SPRITES ===

export const ANIMAL_SPRITES = {
  boar: { path: `${SPRITE_BASE}/Animals/Boar.png`, frameWidth: 16, frameHeight: 16 },
  chicken: { path: `${SPRITE_BASE}/Animals/Chicken.png`, frameWidth: 16, frameHeight: 16 },
  sheep: { path: `${SPRITE_BASE}/Animals/Sheep.png`, frameWidth: 16, frameHeight: 16 },
  horse: { path: `${SPRITE_BASE}/Animals/Horse(32x32).png`, frameWidth: 32, frameHeight: 32 },
  pig: { path: `${SPRITE_BASE}/Animals/Pig.png`, frameWidth: 16, frameHeight: 16 },
  marineAnimals: { path: `${SPRITE_BASE}/Animals/MarineAnimals.png`, frameWidth: 32, frameHeight: 32 }
};

// === TINY SWORDS FACTION BUILDINGS ===
// High-quality building sprites for each faction

// Path relative to src/dist/ where game.html is served
const TINY_SWORDS_BASE = '../../Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets/Buildings';

export type TinySwordsFaction = 'crusade' | 'goblin' | 'legion' | 'fabled';

export const FACTION_BUILDING_PATHS: Record<TinySwordsFaction, string> = {
  crusade: `${TINY_SWORDS_BASE}/crusade buildings`,
  goblin: `${TINY_SWORDS_BASE}/Goblin Buildings`,
  legion: `${TINY_SWORDS_BASE}/Legion buildings`,
  fabled: `${TINY_SWORDS_BASE}/Fabled Buildings`
};

export interface TinySwordsBuildingConfig {
  type: string;
  filename: string;
  width: number;
  height: number;
  footprint: { w: number; h: number }; // Grid footprint for placement
}

// Building configurations (same for all factions, just different colors)
export const TINY_SWORDS_BUILDINGS: TinySwordsBuildingConfig[] = [
  { type: 'castle', filename: 'Castle.png', width: 192, height: 160, footprint: { w: 3, h: 2 } },
  { type: 'barracks', filename: 'Barracks.png', width: 128, height: 144, footprint: { w: 2, h: 2 } },
  { type: 'archery', filename: 'Archery.png', width: 128, height: 144, footprint: { w: 2, h: 2 } },
  { type: 'tower', filename: 'Tower.png', width: 96, height: 128, footprint: { w: 1, h: 1 } },
  { type: 'monastery', filename: 'Monastery.png', width: 128, height: 160, footprint: { w: 2, h: 2 } },
  { type: 'house1', filename: 'House1.png', width: 96, height: 112, footprint: { w: 1, h: 1 } },
  { type: 'house2', filename: 'House2.png', width: 96, height: 112, footprint: { w: 1, h: 1 } },
  { type: 'house3', filename: 'House3.png', width: 96, height: 112, footprint: { w: 1, h: 1 } }
];

/**
 * Get the full path to a faction building sprite
 */
export function getTinySwordsBuildingPath(faction: TinySwordsFaction, buildingType: string): string {
  const building = TINY_SWORDS_BUILDINGS.find(b => b.type === buildingType);
  if (!building) {
    console.warn(`Unknown building type: ${buildingType}`);
    return '';
  }
  return `${FACTION_BUILDING_PATHS[faction]}/${building.filename}`;
}

/**
 * Get building config by type
 */
export function getTinySwordsBuildingConfig(buildingType: string): TinySwordsBuildingConfig | undefined {
  return TINY_SWORDS_BUILDINGS.find(b => b.type === buildingType);
}

/**
 * Map game faction ID to Tiny Swords faction
 */
export function gameToTinySwordsFaction(factionId: number): TinySwordsFaction {
  switch (factionId) {
    case 1: return 'crusade';   // Player - blue buildings
    case 2: return 'goblin';    // Enemy - red/brown buildings  
    case 3: return 'legion';    // Ally
    case 4: return 'fabled';    // Enemy 2
    default: return 'goblin';   // Neutral defaults to goblin style
  }
}

// === TOWER SPRITES ===
// Tower sprites by faction color from MiniWorldSprites

export const TOWER_SPRITES = {
  cyan: {
    path: `${SPRITE_BASE}/Buildings/Cyan/CyanTower.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  lime: {
    path: `${SPRITE_BASE}/Buildings/Lime/LimeTower.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  purple: {
    path: `${SPRITE_BASE}/Buildings/Purple/PurpleTower.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  red: {
    path: `${SPRITE_BASE}/Buildings/Red/RedTower.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  wood: {
    path: `${SPRITE_BASE}/Buildings/Wood/Tower.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  },
  wood2: {
    path: `${SPRITE_BASE}/Buildings/Wood/Tower2.png`,
    frameWidth: 32,
    frameHeight: 64,
    variants: 4
  }
};

/**
 * Get tower sprite path by faction ID
 */
export function getTowerSpritePath(factionId: number): string {
  switch (factionId) {
    case 1: return TOWER_SPRITES.cyan.path;
    case 2: return TOWER_SPRITES.red.path;
    case 3: return TOWER_SPRITES.lime.path;
    case 4: return TOWER_SPRITES.purple.path;
    default: return TOWER_SPRITES.wood.path;
  }
}

// === SIEGE/SPECIAL UNITS ===

export const SIEGE_SPRITES = {
  ballista: {
    path: `${SPRITE_BASE}/Characters/Soldiers/Ranged/Ballista.png`,
    frameWidth: 48,
    frameHeight: 32,
    directions: 8,
    framesPerDirection: 4,
    animations: {
      idle: { row: 0, frames: 1 },
      walk: { row: 0, frames: 4 },
      attack: { row: 1, frames: 4 }
    }
  }
};

// === TINY SWORDS UNIT SPRITES ===
// High-quality faction unit sprites with animations

// Path relative to src/dist/ where game.html is served
const TINY_SWORDS_UNITS_BASE = '../../Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets/Units';

export type TinySwordsUnitType = 'archer' | 'lancer' | 'monk' | 'warrior';

export interface TinySwordsUnitAnimation {
  filename: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
}

export interface TinySwordsUnitConfig {
  type: TinySwordsUnitType;
  displayName: string;
  role: 'ranged' | 'melee' | 'support' | 'cavalry';
  animations: {
    idle: TinySwordsUnitAnimation;
    run: TinySwordsUnitAnimation;
    attack: TinySwordsUnitAnimation;
    guard?: TinySwordsUnitAnimation;
  };
  projectile?: string; // For ranged units
}

// Unit configurations - animations are sprite sheets
export const TINY_SWORDS_UNITS: Record<TinySwordsUnitType, TinySwordsUnitConfig> = {
  archer: {
    type: 'archer',
    displayName: 'Archer',
    role: 'ranged',
    animations: {
      idle: { filename: 'Archer_Idle.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      run: { filename: 'Archer_Run.png', frameWidth: 192, frameHeight: 192, frames: 8 },
      attack: { filename: 'Archer_Shoot.png', frameWidth: 192, frameHeight: 192, frames: 10 }
    },
    projectile: 'Arrow.png'
  },
  lancer: {
    type: 'lancer',
    displayName: 'Lancer',
    role: 'cavalry',
    animations: {
      idle: { filename: 'Lancer_Idle.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      run: { filename: 'Lancer_Run.png', frameWidth: 192, frameHeight: 192, frames: 8 },
      attack: { filename: 'Lancer_Right_Attack.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      guard: { filename: 'Lancer_Right_Defence.png', frameWidth: 192, frameHeight: 192, frames: 4 }
    }
  },
  monk: {
    type: 'monk',
    displayName: 'Monk',
    role: 'support',
    animations: {
      idle: { filename: 'Idle.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      run: { filename: 'Run.png', frameWidth: 192, frameHeight: 192, frames: 8 },
      attack: { filename: 'Heal.png', frameWidth: 192, frameHeight: 192, frames: 8 }
    }
  },
  warrior: {
    type: 'warrior',
    displayName: 'Warrior',
    role: 'melee',
    animations: {
      idle: { filename: 'Warrior_Idle.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      run: { filename: 'Warrior_Run.png', frameWidth: 192, frameHeight: 192, frames: 8 },
      attack: { filename: 'Warrior_Attack1.png', frameWidth: 192, frameHeight: 192, frames: 6 },
      guard: { filename: 'Warrior_Guard.png', frameWidth: 192, frameHeight: 192, frames: 4 }
    }
  }
};

// Faction folder names for units
export const FACTION_UNIT_PATHS: Record<TinySwordsFaction, string> = {
  crusade: `${TINY_SWORDS_UNITS_BASE}/crusade Units`,
  goblin: `${TINY_SWORDS_UNITS_BASE}/Goblin Units`,
  legion: `${TINY_SWORDS_UNITS_BASE}/legion Units`,
  fabled: `${TINY_SWORDS_UNITS_BASE}/fabled Units`
};

/**
 * Get the full path to a unit animation sprite
 */
export function getTinySwordsUnitPath(
  faction: TinySwordsFaction,
  unitType: TinySwordsUnitType,
  animation: 'idle' | 'run' | 'attack' | 'guard'
): string {
  const unit = TINY_SWORDS_UNITS[unitType];
  if (!unit) return '';
  
  const anim = unit.animations[animation];
  if (!anim) return '';
  
  // Capitalize unit type for folder name
  const folderName = unitType.charAt(0).toUpperCase() + unitType.slice(1);
  return `${FACTION_UNIT_PATHS[faction]}/${folderName}/${anim.filename}`;
}

/**
 * Get projectile path for ranged units
 */
export function getTinySwordsProjectilePath(faction: TinySwordsFaction, unitType: TinySwordsUnitType): string {
  const unit = TINY_SWORDS_UNITS[unitType];
  if (!unit?.projectile) return '';
  
  const folderName = unitType.charAt(0).toUpperCase() + unitType.slice(1);
  return `${FACTION_UNIT_PATHS[faction]}/${folderName}/${unit.projectile}`;
}

// === GOBLIN SPECIAL PROPS ===
// Extra goblin-themed props and buildings from Goblins folder

export const GOBLIN_PROPS = {
  goblinHouse: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Goblin_House.png`,
  goblinHouseDestroyed: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Goblin_House_Destroyed.png`,
  woodTower: {
    blue: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_Blue.png`,
    purple: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_Purple.png`,
    red: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_Red.png`,
    yellow: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_Yellow.png`,
    destroyed: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_Destroyed.png`,
    construction: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Wood_Tower_InConstruction.png`
  },
  barrel: {
    blue: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Barrel_Blue.png`,
    purple: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Barrel_Purple.png`,
    red: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Barrel_Red.png`,
    yellow: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Barrel_Yellow.png`
  },
  tnt: {
    blue: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/TNT_Blue.png`,
    purple: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/TNT_Purple.png`,
    red: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/TNT_Red.png`,
    yellow: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/TNT_Yellow.png`,
    dynamite: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Dynamite.png`
  },
  torch: {
    blue: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Torch_Blue.png`,
    purple: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Torch_Purple.png`,
    red: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Torch_Red.png`,
    yellow: `${TINY_SWORDS_UNITS_BASE}/Goblin Units/Goblins/Torch_Yellow.png`
  }
};
