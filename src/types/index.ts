// ============================================
// GRUDGE ISLANDS RTS - TYPE DEFINITIONS
// ============================================

// === ATTRIBUTES (8 core stats from Character Builder) ===
export type AttributeName = 
  | 'Strength' | 'Intellect' | 'Vitality' | 'Dexterity' 
  | 'Endurance' | 'Wisdom' | 'Agility' | 'Tactics';

export interface Attributes {
  Strength: number;
  Intellect: number;
  Vitality: number;
  Dexterity: number;
  Endurance: number;
  Wisdom: number;
  Agility: number;
  Tactics: number;
}

// === DERIVED STATS (37 stats calculated from attributes) ===
export interface DerivedStats {
  // Resource Pools
  health: number;
  mana: number;
  stamina: number;
  
  // Combat Base
  damage: number;
  defense: number;
  
  // Defensive
  block: number;
  blockEffect: number;
  evasion: number;
  armor: number;
  resistance: number;
  damageReduction: number;
  
  // Offensive
  accuracy: number;
  criticalChance: number;
  criticalDamage: number;
  attackSpeed: number;
  armorPenetration: number;
  blockPenetration: number;
  defenseBreak: number;
  
  // Utility
  movementSpeed: number;
  cooldownReduction: number;
  abilityCost: number;
  spellAccuracy: number;
  drainHealth: number;
  stagger: number;
  
  // Regeneration
  manaRegen: number;
  healthRegen: number;
  
  // Resistances
  cdrResist: number;
  defenseBreakResist: number;
  bleedResist: number;
  statusEffect: number;
  spellblock: number;
  ccResistance: number;
  criticalEvasion: number;
  
  // Misc
  dodge: number;
  reflexTime: number;
  fallDamage: number;
  comboCooldownRed: number;
}

// === CLASS TIERS ===
export type ClassTierName = 'Legendary' | 'Warlord' | 'Epic' | 'Hero' | 'Normal' | 'Unclassified';

export interface ClassTier {
  minRank: number;
  maxRank: number;
  name: ClassTierName;
  className: string;
  description: string;
}

export interface ClassInfo {
  name: string;
  tier: string;
  description: string;
  className: string;
  rank: number;
  combatPower: number;
}

// === FACTIONS ===
export type FactionId = 0 | 1 | 2 | 3; // 0=neutral, 1=player, 2=goblin, 3=other players
export type FactionName = 'Neutral' | 'Player' | 'Goblin' | 'Enemy';

export interface Faction {
  id: FactionId;
  name: FactionName;
  color: string;
  attackColor: string;
}

// === UNIT TYPES ===
export type UnitTypeName = 
  | 'Skeleton' | 'Orc' | 'Soldier' | 'Slime'                    // Tier 1
  | 'Archer' | 'Swordsman' | 'SkeletonArcher'                   // Tier 2
  | 'Knight' | 'Wizard' | 'Lancer' | 'Priest'                   // Tier 3
  | 'KnightTemplar' | 'EliteOrc' | 'Werebear' | 'Werewolf'     // Tier 4
  | 'ArmoredAxeman' | 'ArmoredOrc' | 'ArmoredSkeleton' | 'GreatswordSkeleton' | 'OrcRider'; // Tier 5

export type UnitTier = 1 | 2 | 3 | 4 | 5;

export interface UnitTypeDefinition {
  name: UnitTypeName;
  displayName: string;
  tier: UnitTier;
  baseAttributes: Attributes;
  primaryAttribute: AttributeName;
  spriteName: string;
  attackRange: number;  // pixels
  attackDelay: number;  // seconds between attacks
  size: number;         // collision radius
}

// === SPRITE ANIMATIONS ===
export type AnimationState = 'Idle' | 'Walk' | 'Attack01' | 'Attack02' | 'Attack03' | 'Block' | 'Hurt' | 'Death';

export interface SpriteAnimation {
  state: AnimationState;
  frames: string[];
  frameDuration: number; // ms per frame
  loop: boolean;
}

export interface SpriteDefinition {
  name: string;
  basePath: string;
  animations: Record<AnimationState, SpriteAnimation>;
  width: number;
  height: number;
}

// === ENTITIES ===
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export type EntityType = 'unit' | 'general' | 'spawner' | 'projectile';
export type EntityState = 'alive' | 'dying' | 'dead';

export interface BaseEntity {
  id: string;
  type: EntityType;
  faction: FactionId;
  position: Position;
  destination: Position;
  state: EntityState;
  size: number;
  time: number;
}

export interface UnitEntity extends BaseEntity {
  type: 'unit';
  unitType: UnitTypeName;
  attributes: Attributes;
  stats: DerivedStats;
  currentHealth: number;
  currentMana: number;
  currentStamina: number;
  target: string | null;  // entity id
  aiTarget: number;       // spawner index for AI
  lastAttackTime: number;
  idleSince: number;
  animationState: AnimationState;
  animationFrame: number;
  animationTime: number;
  facingRight: boolean;
  upgradeLevel: number;
}

export interface GeneralEntity extends Omit<UnitEntity, 'type'> {
  type: 'general';
  level: number;
  experience: number;
  className: string;
  abilities: GeneralAbility[];
  respawnTime: number;
}

export interface GeneralAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
  staminaCost: number;
  range: number;
}

export interface SpawnerEntity extends BaseEntity {
  type: 'spawner';
  isHQ: boolean;
  capturedByFaction: FactionId;
  capturePoints: number;
  maxCapturePoints: number;
  captureRadius: number;
  spawnRate: number;        // units per second
  lastSpawnTime: number;
  totalSpawned: number;
  producesUnits: boolean;
  spawnUnitType: UnitTypeName;
}

// === WORLD STRUCTURE ===
export interface Island {
  id: string;
  name: string;
  position: Position;
  width: number;
  height: number;
  nodes: SpawnerEntity[];
  terrain: TerrainTile[][];
}

export type TerrainType = 'grass' | 'sand' | 'stone' | 'water' | 'void';

export interface TerrainTile {
  type: TerrainType;
  passable: boolean;
}

export interface WorldMap {
  width: number;
  height: number;
  islands: Island[];
}

// === GAME STATE ===
export type GamePhase = 'menu' | 'generalCreation' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface GameState {
  phase: GamePhase;
  time: number;
  frameCount: number;
  selectedUnits: string[];
  commandWaypoints: CommandWaypoint[];
  commandRects: CommandRect[];
}

export interface CommandWaypoint {
  x: number;
  y: number;
  destX: number;
  destY: number;
  radius: number;
  lastMoveTime: number;
}

export interface CommandRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  destX: number;
  destY: number;
}

// === CAMERA ===
export interface Camera {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

// === GRID SYSTEM ===
export interface GridSector {
  sx: number;
  sy: number;
  entities: string[];  // entity ids
  entityCount: number[];  // count per faction
  entitySizeSum: number;
}

export interface GridSystem {
  width: number;
  height: number;
  gridSize: number;
  sectorsX: number;
  sectorsY: number;
  sectors: GridSector[][];
  maximumSizeSumPerSector: number;
}

// === AI STRATEGY ===
export type AIStrategy = 'Defend' | 'Maintain' | 'Attack';

export interface AIState {
  faction: FactionId;
  strategy: AIStrategy;
  planRate: number;
  nextPlanTime: number;
  spawnerAnalysis: SpawnerAnalysis[];
  unitBalance: number;
}

export interface SpawnerAnalysis {
  spawnerIndex: number;
  distanceToHQ: number;
  priority: number;
  enemyDepth: number;
  unitsToSend: number;
  unitCounts: [number, number]; // [own, enemy]
}

// === GENERAL CLASS DEFINITIONS ===
export type GeneralClassName = 'Warrior' | 'Mage' | 'Rogue' | 'Tank' | 'Ranger' | 'Tactician';

export interface GeneralClassDefinition {
  name: GeneralClassName;
  displayName: string;
  description: string;
  primaryAttributes: AttributeName[];
  startingAttributes: Partial<Attributes>;
  sprite: UnitTypeName;
  abilities: string[];
}

// === COMBAT ===
export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  wasBlocked: boolean;
  wasCrit: boolean;
  wasEvaded: boolean;
  lifestealHealing: number;
}

export interface CombatEvent {
  attackerId: string;
  defenderId: string;
  timestamp: number;
  result: DamageResult;
}

// === UPGRADE SYSTEM ===
export interface UnitUpgrade {
  unitType: UnitTypeName;
  level: number;
  maxLevel: number;
  attributeBonus: number;  // +5 per upgrade level
}

export interface PlayerUpgrades {
  units: Record<UnitTypeName, UnitUpgrade>;
  researched: string[];
}
