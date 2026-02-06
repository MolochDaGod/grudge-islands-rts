// ============================================
// HOME ISLAND MODULE
// Harvesting, crafting, and home base management
// ============================================

export { IslandEngine } from './engine/IslandEngine.ts';
export type { IslandEngineConfig, IslandEngineEvents } from './engine/IslandEngine.ts';

export { CameraController } from './engine/CameraController.ts';
export type { CameraState, CameraConfig } from './engine/CameraController.ts';

export { CharacterActor } from './actors/CharacterActor.ts';
export type { CharacterState, Direction, CharacterSpriteConfig, CharacterEvents } from './actors/CharacterActor.ts';

export { ResourceNodeActor } from './actors/ResourceNodeActor.ts';
export type { NodeRarity, LootDrop, ResourceNodeData } from './actors/ResourceNodeActor.ts';

export { HarvestController } from './actors/HarvestController.ts';
export type { HarvestEvent, HarvestJob, HarvestControllerEvents } from './actors/HarvestController.ts';

export { SpriteAnimator, createCharacterAnimations } from './render/SpriteAnimator.ts';
export type { AnimationConfig } from './render/SpriteAnimator.ts';

export { IslandCanvasRenderer } from './render/IslandCanvasRenderer.ts';
