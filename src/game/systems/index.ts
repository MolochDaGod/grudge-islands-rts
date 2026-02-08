// ============================================
// SYSTEMS BARREL EXPORT
// ============================================

// Collision System
export { 
  CollisionSystem,
  CollisionLayer,
  type Collider,
  type ColliderType,
  type CircleCollider,
  type BoxCollider,
  type PolygonCollider,
  type EntityColliderType,
  type CollisionResult
} from './CollisionSystem.ts';

// Aggro System
export {
  AggroSystem,
  type AggroEntity,
  type AggroEntityType,
  type AIBehavior,
  type TargetPriority,
  type AttackEvent
} from './AggroSystem.ts';

// Effects Manager
export {
  EffectsManager,
  EFFECT_SPRITESHEETS,
  type EffectType,
  type ProjectileStyle,
  type ExplosionStyle,
  type SpritesheetConfig,
  type ActiveEffect,
  type Projectile
} from './EffectsManager.ts';

// Pathfinding System
export {
  PathfindingSystem,
  type PathNode,
  type PathResult,
  type PathfindingConfig
} from './Pathfinding.ts';

// Audio Manager
export {
  AudioManager,
  audioManager,
  SOUND_DEFINITIONS,
  type SoundCategory,
  type SoundDefinition
} from './AudioManager.ts';

// Production System
export {
  ProductionSystem,
  productionSystem,
  type ProductionType,
  type ProductionItem,
  type BuildingProduction,
  type ProductionCompleteEvent
} from './ProductionSystem.ts';

// Monster System
export {
  MonsterSystem,
  monsterSystem,
  type Monster,
  type MonsterTier,
  type MonsterState,
  type MonsterSpawnConfig,
  type MonsterKillEvent
} from './MonsterSystem.ts';

// Combat AI
export {
  CombatAI,
  combatAI,
  type CombatState,
  type CombatUnit,
  type DamageEvent,
  type CombatGroup,
  type TargetPriority as CombatTargetPriority
} from './CombatAI.ts';

// AI Controller (basic)
export {
  AIController,
  aiController,
  type AIState,
  type AIUnit,
  type AIDecision
} from './AIController.ts';

// Hero Manager
export {
  HeroManager,
  heroManager,
  type ManagedHero,
  type HeroSlot,
  type HeroSaveData
} from './HeroManager.ts';

// Worker System
export {
  WorkerSystem,
  workerSystem,
  type Worker,
  type WorkerState,
  type ResourceNode,
  type PlayerResources,
} from './WorkerSystem.ts';

// Ship Projectile System
export {
  ShipProjectileSystem,
  BEAM_CONFIGS,
  AOE_EFFECTS,
  BEAM_TO_AOE,
  type BeamColor,
  type BeamConfig,
  type AOEEffectConfig,
  type ShipProjectile,
  type ActiveAOE
} from './ShipProjectileSystem.ts';

// Upgrade System
export {
  UpgradeSystem,
  upgradeSystem,
  TOWER_UPGRADE_TEMPLATES,
  BOAT_UPGRADE_TEMPLATES,
  ABILITY_TEMPLATES,
  TOWER_ABILITIES,
  BOAT_ABILITIES,
  type UpgradeStat,
  type AbilityType,
  type UpgradeCost,
  type StatUpgrade,
  type AbilityUpgrade,
  type UpgradeableStats,
  type UpgradeableAbilities,
  type UpgradeableEntity
} from './UpgradeSystem.ts';
