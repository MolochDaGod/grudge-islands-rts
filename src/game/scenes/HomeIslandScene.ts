// ============================================
// HOME ISLAND SCENE
// Manages home base with harvesting, crafting, and resource gathering
// ============================================

import { IslandEngine, HarvestEvent, ResourceNodeData, createCharacterAnimations } from '../island/index.ts';
import { IslandCanvasRenderer } from '../island/render/IslandCanvasRenderer.ts';

export interface PlayerInventory {
  wood: number;
  stone: number;
  ore: number;
  herb: number;
  gold: number;
  [key: string]: number;
}

export interface HomeIslandEvents {
  onResourceCollected?: (resource: string, amount: number) => void;
  onExitIsland?: () => void;
}

// Resource node templates
const RESOURCE_NODE_TEMPLATES: Record<string, Omit<ResourceNodeData, 'name'>> = {
  tree: {
    type: 'wood',
    profession: 'woodcutting',
    tier: 1,
    rarity: 'common',
    icon: '🌲',
    harvestIntervalMs: 2000,
    drops: [
      { itemId: 'wood', name: 'Wood', chance: 1.0, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'branch', name: 'Branch', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  rock: {
    type: 'stone',
    profession: 'mining',
    tier: 1,
    rarity: 'common',
    icon: '🪨',
    harvestIntervalMs: 2500,
    drops: [
      { itemId: 'stone', name: 'Stone', chance: 1.0, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'flint', name: 'Flint', chance: 0.2, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  oreVein: {
    type: 'ore',
    profession: 'mining',
    tier: 2,
    rarity: 'rare',
    icon: '⛏️',
    harvestIntervalMs: 3000,
    drops: [
      { itemId: 'ore', name: 'Iron Ore', chance: 0.8, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'coal', name: 'Coal', chance: 0.4, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  herb: {
    type: 'herb',
    profession: 'herbalism',
    tier: 1,
    rarity: 'common',
    icon: '🌿',
    harvestIntervalMs: 1500,
    drops: [
      { itemId: 'herb', name: 'Herb', chance: 1.0, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'flower', name: 'Flower', chance: 0.5, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  rareTree: {
    type: 'wood',
    profession: 'woodcutting',
    tier: 3,
    rarity: 'epic',
    icon: '🌳',
    harvestIntervalMs: 4000,
    drops: [
      { itemId: 'hardwood', name: 'Hardwood', chance: 0.7, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'sap', name: 'Tree Sap', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  goldVein: {
    type: 'gold',
    profession: 'mining',
    tier: 4,
    rarity: 'legendary',
    icon: '✨',
    harvestIntervalMs: 5000,
    drops: [
      { itemId: 'gold', name: 'Gold Nugget', chance: 0.5, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'gem', name: 'Gemstone', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
    ]
  }
};

export class HomeIslandScene {
  private engine: IslandEngine;
  private renderer: IslandCanvasRenderer | null = null;
  public canvas: HTMLCanvasElement | null = null;
  
  private inventory: PlayerInventory = {
    wood: 0,
    stone: 0,
    ore: 0,
    herb: 0,
    gold: 0
  };
  
  private events: HomeIslandEvents;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private heroCharacterId: string = 'hero';

  constructor(events: HomeIslandEvents = {}) {
    this.events = events;
    
    // Create island engine (800x600 world)
    this.engine = new IslandEngine(
      { worldWidth: 800, worldHeight: 600, tileSize: 32 },
      {
        onHarvest: (event) => this.handleHarvest(event),
        onStaminaDepleted: (characterId) => this.handleStaminaDepleted(characterId)
      }
    );
    
    this.setupIsland();
  }

  private setupIsland(): void {
    // Add hero character at center
    const heroAnimations = createCharacterAnimations(
      [0], // idle
      [0, 1, 2, 3], // walk
      [0, 1, 2], // harvest
      [0] // sleep
    );
    
    this.engine.addCharacter(this.heroCharacterId, 400, 300, {
      spriteSheet: '', // Will use fallback circle
      frameWidth: 64,
      frameHeight: 64,
      animations: heroAnimations,
      scale: 1
    });
    
    // Spawn resource nodes around the island
    this.spawnResourceNodes();
  }

  private spawnResourceNodes(): void {
    let nodeId = 0;
    
    // Trees in forest area (top-left)
    for (let i = 0; i < 5; i++) {
      const x = 100 + Math.random() * 150;
      const y = 100 + Math.random() * 150;
      this.addResourceNode(`tree_${nodeId++}`, x, y, 'tree', 'Oak Tree');
    }
    
    // Rocks in mountain area (top-right)
    for (let i = 0; i < 4; i++) {
      const x = 550 + Math.random() * 150;
      const y = 100 + Math.random() * 150;
      this.addResourceNode(`rock_${nodeId++}`, x, y, 'rock', 'Stone');
    }
    
    // Ore veins (scattered)
    for (let i = 0; i < 2; i++) {
      const x = 500 + Math.random() * 200;
      const y = 250 + Math.random() * 100;
      this.addResourceNode(`ore_${nodeId++}`, x, y, 'oreVein', 'Iron Vein');
    }
    
    // Herbs in meadow (bottom area)
    for (let i = 0; i < 6; i++) {
      const x = 200 + Math.random() * 400;
      const y = 400 + Math.random() * 150;
      this.addResourceNode(`herb_${nodeId++}`, x, y, 'herb', 'Wild Herb');
    }
    
    // Rare tree (center-left)
    this.addResourceNode('rare_tree', 150, 350, 'rareTree', 'Ancient Oak');
    
    // Gold vein (hidden corner)
    this.addResourceNode('gold_vein', 700, 500, 'goldVein', 'Gold Deposit');
  }

  private addResourceNode(id: string, x: number, y: number, template: string, name: string): void {
    const templateData = RESOURCE_NODE_TEMPLATES[template];
    if (!templateData) return;
    
    this.engine.addResourceNode(id, x, y, {
      name,
      ...templateData
    });
  }

  private handleHarvest(event: HarvestEvent): void {
    console.log(`Harvested from ${event.nodeId}:`, event.loot);
    
    // Add loot to inventory
    for (const drop of event.loot) {
      const resourceType = drop.itemId;
      const amount = drop.minQuantity; // minQuantity is set to actual quantity
      
      if (this.inventory[resourceType] !== undefined) {
        this.inventory[resourceType] += amount;
      } else {
        this.inventory[resourceType] = amount;
      }
      
      this.events.onResourceCollected?.(resourceType, amount);
    }
    
    // Update UI
    this.updateInventoryUI();
  }

  private handleStaminaDepleted(characterId: string): void {
    console.log(`${characterId} is exhausted and needs rest!`);
  }

  private updateInventoryUI(): void {
    // Update gold counter in HUD
    const goldEl = document.getElementById('goldCount');
    if (goldEl) {
      goldEl.textContent = String(Math.floor(this.inventory.gold + 500)); // Base 500 + gathered
    }
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.renderer = new IslandCanvasRenderer(canvas, this.engine);
    
    // Handle click to move hero or interact
    this.renderer.onTileClick = (worldX, worldY) => {
      // Check if clicking on a resource node
      let clickedNode = false;
      for (const node of this.engine.resourceNodes.values()) {
        const dist = Math.hypot(node.x - worldX, node.y - worldY);
        if (dist < 30) {
          // Move hero to node
          this.engine.moveCharacterTo(this.heroCharacterId, node.x, node.y);
          clickedNode = true;
          break;
        }
      }
      
      if (!clickedNode) {
        // Just move hero to clicked position
        this.engine.moveCharacterTo(this.heroCharacterId, worldX, worldY);
      }
    };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.engine.start();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.engine.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    this.renderer?.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  getInventory(): PlayerInventory {
    return { ...this.inventory };
  }

  addToInventory(resource: string, amount: number): void {
    if (this.inventory[resource] !== undefined) {
      this.inventory[resource] += amount;
    } else {
      this.inventory[resource] = amount;
    }
  }

  focusOnHero(): void {
    this.engine.focusOnCharacter(this.heroCharacterId);
  }

  destroy(): void {
    this.stop();
    this.renderer?.destroy();
    this.engine.destroy();
  }
}
