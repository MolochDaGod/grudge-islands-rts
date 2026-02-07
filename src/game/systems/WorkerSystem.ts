// ============================================
// WORKER SYSTEM
// Auto-harvesting workers from camp
// Max 4 workers per camp, auto-collect resources
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import {
  NodeType,
  ResourceType,
  WORKER_CONFIG,
  NODE_DEFINITIONS,
  rollDrops,
  getRandomNodeSprite,
} from '../config/ResourceConfig.ts';

// === TYPES ===

export type WorkerState = 'idle' | 'moving_to_node' | 'harvesting' | 'returning' | 'depositing';

export interface ResourceNode {
  id: string;
  type: NodeType;
  position: Position;
  health: number;
  maxHealth: number;
  isDepleted: boolean;
  respawnTimer: number;
  sprite: string;
  spriteSize: { width: number; height: number };
  // For sheep
  velocity?: { x: number; y: number };
  wanderTimer?: number;
}

export interface Worker {
  id: string;
  factionId: FactionId;
  position: Position;
  state: WorkerState;
  targetNode: ResourceNode | null;
  campPosition: Position;
  carryingResources: Map<ResourceType, number>;
  totalCarrying: number;
  harvestProgress: number;
  moveTarget: Position | null;
  spriteFrame: number;
  facingRight: boolean;
}

export interface PlayerResources {
  wood: number;
  sticks: number;
  stone: number;
  ore: number;
  metal: number;
  gold: number;
  food: number;
  cloth: number;
  leather: number;
  meat: number;
  string: number;
  materials: number;
}

// === WORKER SYSTEM CLASS ===

export class WorkerSystem {
  private workers: Map<string, Worker> = new Map();
  private nodes: Map<string, ResourceNode> = new Map();
  private playerResources: PlayerResources = {
    wood: 0, sticks: 0, stone: 0, ore: 0, metal: 0, gold: 100,
    food: 50, cloth: 0, leather: 0, meat: 0, string: 0, materials: 0,
  };
  private factionId: FactionId = 1 as FactionId;
  private campPosition: Position = { x: 400, y: 300 };
  private campLevel: number = 1;

  constructor() {}

  // === INITIALIZATION ===

  /**
   * Set the camp position for workers to return to
   */
  setCampPosition(position: Position): void {
    this.campPosition = { ...position };
    // Update all workers' camp position
    for (const worker of this.workers.values()) {
      worker.campPosition = { ...position };
    }
  }

  /**
   * Set camp level (affects max workers)
   */
  setCampLevel(level: number): void {
    this.campLevel = level;
  }

  /**
   * Get max workers based on camp level
   */
  getMaxWorkers(): number {
    return Math.min(WORKER_CONFIG.MAX_PER_CAMP, this.campLevel + 1);
  }

  // === WORKER MANAGEMENT ===

  /**
   * Spawn a new worker at the camp
   */
  spawnWorker(): Worker | null {
    if (this.workers.size >= this.getMaxWorkers()) {
      console.warn('Max workers reached');
      return null;
    }

    const worker: Worker = {
      id: `worker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      factionId: this.factionId,
      position: { ...this.campPosition },
      state: 'idle',
      targetNode: null,
      campPosition: { ...this.campPosition },
      carryingResources: new Map(),
      totalCarrying: 0,
      harvestProgress: 0,
      moveTarget: null,
      spriteFrame: 0,
      facingRight: true,
    };

    this.workers.set(worker.id, worker);
    console.log(`Worker ${worker.id} spawned at camp`);
    return worker;
  }

  /**
   * Remove a worker
   */
  removeWorker(workerId: string): boolean {
    return this.workers.delete(workerId);
  }

  /**
   * Get all workers
   */
  getWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get worker count
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  // === NODE MANAGEMENT ===

  /**
   * Spawn a resource node
   */
  spawnNode(type: NodeType, position: Position): ResourceNode {
    const definition = NODE_DEFINITIONS[type];
    
    const node: ResourceNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      position: { ...position },
      health: definition.maxHealth,
      maxHealth: definition.maxHealth,
      isDepleted: false,
      respawnTimer: 0,
      sprite: getRandomNodeSprite(type),
      spriteSize: { ...definition.spriteSize },
    };

    // Initialize sheep movement
    if (type === 'sheep') {
      node.velocity = { x: 0, y: 0 };
      node.wanderTimer = Math.random() * 5;
    }

    this.nodes.set(node.id, node);
    return node;
  }

  /**
   * Spawn nodes for an island
   */
  spawnIslandNodes(
    bounds: { x: number; y: number; width: number; height: number },
    counts: { bushes: number; rocks: number; trees: number; sheep: number }
  ): void {
    const padding = 30;
    const minSpacing = 50;
    const positions: Position[] = [];

    const trySpawnAt = (type: NodeType): boolean => {
      for (let attempts = 0; attempts < 20; attempts++) {
        const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
        const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);
        
        // Check spacing
        let tooClose = false;
        for (const pos of positions) {
          const dx = pos.x - x;
          const dy = pos.y - y;
          if (Math.sqrt(dx * dx + dy * dy) < minSpacing) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          this.spawnNode(type, { x, y });
          positions.push({ x, y });
          return true;
        }
      }
      return false;
    };

    // Spawn in order: trees first (largest), then bushes, rocks, sheep
    for (let i = 0; i < counts.trees; i++) trySpawnAt('tree');
    for (let i = 0; i < counts.bushes; i++) trySpawnAt('bush');
    for (let i = 0; i < counts.rocks; i++) trySpawnAt('rock');
    for (let i = 0; i < counts.sheep; i++) trySpawnAt('sheep');

    console.log(`Spawned ${positions.length} nodes on island`);
  }

  /**
   * Get all nodes
   */
  getNodes(): ResourceNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get available (non-depleted) nodes
   */
  getAvailableNodes(): ResourceNode[] {
    return this.getNodes().filter(n => !n.isDepleted);
  }

  // === UPDATE LOOP ===

  /**
   * Main update - call each frame
   */
  update(deltaTime: number): void {
    // Update nodes (respawn, sheep movement)
    this.updateNodes(deltaTime);

    // Update workers
    for (const worker of this.workers.values()) {
      this.updateWorker(worker, deltaTime);
    }
  }

  private updateNodes(deltaTime: number): void {
    for (const node of this.nodes.values()) {
      // Handle respawn timers
      if (node.isDepleted && node.respawnTimer > 0) {
        node.respawnTimer -= deltaTime;
        if (node.respawnTimer <= 0) {
          node.isDepleted = false;
          node.health = node.maxHealth;
          console.log(`Node ${node.id} respawned`);
        }
      }

      // Handle sheep movement
      if (node.type === 'sheep' && !node.isDepleted && node.velocity) {
        this.updateSheepMovement(node, deltaTime);
      }
    }
  }

  private updateSheepMovement(sheep: ResourceNode, deltaTime: number): void {
    if (!sheep.velocity || sheep.wanderTimer === undefined) return;

    // Update wander timer
    sheep.wanderTimer -= deltaTime;
    
    if (sheep.wanderTimer <= 0) {
      // Pick new random direction or stop
      if (Math.random() < 0.3) {
        // Stop and graze
        sheep.velocity = { x: 0, y: 0 };
        sheep.wanderTimer = 2 + Math.random() * 4;
      } else {
        // Move in random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 10;
        sheep.velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        };
        sheep.wanderTimer = 1 + Math.random() * 3;
      }
    }

    // Apply velocity
    sheep.position.x += sheep.velocity.x * deltaTime;
    sheep.position.y += sheep.velocity.y * deltaTime;
  }

  private updateWorker(worker: Worker, deltaTime: number): void {
    // Animate sprite
    worker.spriteFrame += deltaTime * 8;

    switch (worker.state) {
      case 'idle':
        this.handleIdleWorker(worker);
        break;
      case 'moving_to_node':
        this.handleMovingToNode(worker, deltaTime);
        break;
      case 'harvesting':
        this.handleHarvesting(worker, deltaTime);
        break;
      case 'returning':
        this.handleReturning(worker, deltaTime);
        break;
      case 'depositing':
        this.handleDepositing(worker);
        break;
    }
  }

  private handleIdleWorker(worker: Worker): void {
    // Find nearest available node
    const node = this.findNearestNode(worker.position);
    
    if (node) {
      worker.targetNode = node;
      worker.moveTarget = { ...node.position };
      worker.state = 'moving_to_node';
    }
  }

  private handleMovingToNode(worker: Worker, deltaTime: number): void {
    if (!worker.targetNode || !worker.moveTarget) {
      worker.state = 'idle';
      return;
    }

    // Check if node became depleted
    if (worker.targetNode.isDepleted) {
      worker.targetNode = null;
      worker.state = 'idle';
      return;
    }

    // Move towards target
    const arrived = this.moveTowards(worker, worker.moveTarget, deltaTime);
    
    if (arrived) {
      worker.state = 'harvesting';
      worker.harvestProgress = 0;
    }
  }

  private handleHarvesting(worker: Worker, deltaTime: number): void {
    if (!worker.targetNode || worker.targetNode.isDepleted) {
      worker.targetNode = null;
      
      // Check if should return to deposit
      if (worker.totalCarrying >= WORKER_CONFIG.CARRY_CAPACITY * 0.5) {
        worker.state = 'returning';
        worker.moveTarget = { ...worker.campPosition };
      } else {
        worker.state = 'idle';
      }
      return;
    }

    const definition = NODE_DEFINITIONS[worker.targetNode.type];
    worker.harvestProgress += deltaTime;

    if (worker.harvestProgress >= definition.harvestTime) {
      worker.harvestProgress = 0;
      
      // Deal damage to node
      const damage = 10;
      worker.targetNode.health -= damage;

      // Special handling for sheep - becomes skinning node
      if (worker.targetNode.type === 'sheep' && worker.targetNode.health <= 0) {
        const sheepPos = { ...worker.targetNode.position };
        worker.targetNode.isDepleted = true;
        worker.targetNode.respawnTimer = definition.respawnTime;
        
        // Create skinning node at sheep location
        const skinning = this.spawnNode('skinning', sheepPos);
        worker.targetNode = skinning;
        return;
      }

      // Roll for loot
      const drops = rollDrops(definition.drops);
      for (const [resource, amount] of drops) {
        const current = worker.carryingResources.get(resource) || 0;
        worker.carryingResources.set(resource, current + amount);
        worker.totalCarrying += amount;
      }

      // Check if node depleted
      if (worker.targetNode.health <= 0) {
        worker.targetNode.isDepleted = true;
        worker.targetNode.respawnTimer = definition.respawnTime;
        
        // Skinning nodes don't respawn - remove them
        if (worker.targetNode.type === 'skinning') {
          this.nodes.delete(worker.targetNode.id);
        }
        
        worker.targetNode = null;
      }

      // Check if worker is full
      if (worker.totalCarrying >= WORKER_CONFIG.CARRY_CAPACITY) {
        worker.state = 'returning';
        worker.moveTarget = { ...worker.campPosition };
      }
    }
  }

  private handleReturning(worker: Worker, deltaTime: number): void {
    if (!worker.moveTarget) {
      worker.moveTarget = { ...worker.campPosition };
    }

    const arrived = this.moveTowards(worker, worker.moveTarget, deltaTime);
    
    if (arrived) {
      worker.state = 'depositing';
    }
  }

  private handleDepositing(worker: Worker): void {
    // Transfer all resources to player stockpile
    for (const [resource, amount] of worker.carryingResources) {
      this.playerResources[resource] += amount;
    }

    // Clear worker inventory
    worker.carryingResources.clear();
    worker.totalCarrying = 0;

    // Go back to idle
    worker.state = 'idle';
  }

  // === MOVEMENT ===

  private moveTowards(worker: Worker, target: Position, deltaTime: number): boolean {
    const dx = target.x - worker.position.x;
    const dy = target.y - worker.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < WORKER_CONFIG.HARVEST_RANGE) {
      return true;
    }

    // Normalize and move
    const speed = WORKER_CONFIG.MOVE_SPEED * deltaTime;
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    worker.position.x += moveX;
    worker.position.y += moveY;
    worker.facingRight = dx > 0;

    return false;
  }

  // === PATHFINDING ===

  private findNearestNode(position: Position): ResourceNode | null {
    let nearest: ResourceNode | null = null;
    let nearestDist = Infinity;

    for (const node of this.nodes.values()) {
      if (node.isDepleted) continue;

      const dx = node.position.x - position.x;
      const dy = node.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist && dist < WORKER_CONFIG.SEARCH_RANGE) {
        nearest = node;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  // === RESOURCES ===

  /**
   * Get player resource stockpile
   */
  getResources(): PlayerResources {
    return { ...this.playerResources };
  }

  /**
   * Get specific resource amount
   */
  getResourceAmount(resource: ResourceType): number {
    return this.playerResources[resource];
  }

  /**
   * Spend resources (for building, training, etc.)
   */
  spendResources(costs: Partial<PlayerResources>): boolean {
    // Check if we have enough
    for (const [resource, amount] of Object.entries(costs)) {
      if (this.playerResources[resource as ResourceType] < (amount || 0)) {
        return false;
      }
    }

    // Deduct
    for (const [resource, amount] of Object.entries(costs)) {
      this.playerResources[resource as ResourceType] -= (amount || 0);
    }

    return true;
  }

  /**
   * Add resources directly (from loot, rewards, etc.)
   */
  addResources(resources: Partial<PlayerResources>): void {
    for (const [resource, amount] of Object.entries(resources)) {
      this.playerResources[resource as ResourceType] += (amount || 0);
    }
  }

  // === SERIALIZATION ===

  /**
   * Save state
   */
  toJSON(): object {
    return {
      resources: this.playerResources,
      workers: Array.from(this.workers.values()).map(w => ({
        id: w.id,
        position: w.position,
      })),
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        health: n.health,
        isDepleted: n.isDepleted,
        respawnTimer: n.respawnTimer,
        sprite: n.sprite,
      })),
    };
  }

  /**
   * Load state
   */
  fromJSON(data: any): void {
    if (data.resources) {
      this.playerResources = { ...this.playerResources, ...data.resources };
    }
    // Nodes and workers would need to be reconstructed
  }
}

// === SINGLETON EXPORT ===

export const workerSystem = new WorkerSystem();
export default workerSystem;
