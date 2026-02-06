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
