// ============================================
// RESOURCE HUD
// Displays player resources, workers, gold
// ============================================

import { gameSystems } from '../game/core/GameSystemsIntegration.ts';
import type { PlayerResources } from '../game/systems/WorkerSystem.ts';

// Resource display config
const RESOURCE_ICONS: Record<keyof PlayerResources, string> = {
  gold: '🪙',
  wood: '🪵',
  sticks: '🥢',
  stone: '🪨',
  ore: '⚫',
  metal: '🔩',
  food: '🍖',
  cloth: '🧵',
  leather: '🦴',
  meat: '🥩',
  string: '🧶',
  materials: '📦',
};

// Primary resources to always show
const PRIMARY_RESOURCES: (keyof PlayerResources)[] = [
  'gold', 'wood', 'stone', 'food', 'metal'
];

// Secondary resources to show only when > 0
const SECONDARY_RESOURCES: (keyof PlayerResources)[] = [
  'sticks', 'ore', 'cloth', 'leather', 'meat', 'string', 'materials'
];

export class ResourceHUD {
  private container: HTMLElement | null = null;
  private primaryRow: HTMLElement | null = null;
  private secondaryRow: HTMLElement | null = null;
  private workerInfo: HTMLElement | null = null;
  
  private lastResources: PlayerResources | null = null;
  private lastWorkerCount: number = -1;
  private lastMaxWorkers: number = -1;
  
  constructor() {}
  
  /**
   * Initialize the HUD - creates DOM elements
   */
  init(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'resourceHUD';
    this.container.style.cssText = `
      position: fixed;
      top: 60px;
      left: 10px;
      background: rgba(0, 0, 0, 0.75);
      border: 2px solid #8b7355;
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 100;
      min-width: 200px;
      pointer-events: none;
    `;
    
    // Primary resources row (always visible)
    this.primaryRow = document.createElement('div');
    this.primaryRow.style.cssText = `
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    `;
    this.container.appendChild(this.primaryRow);
    
    // Secondary resources row (conditional)
    this.secondaryRow = document.createElement('div');
    this.secondaryRow.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      opacity: 0.85;
      margin-bottom: 4px;
    `;
    this.container.appendChild(this.secondaryRow);
    
    // Worker info
    this.workerInfo = document.createElement('div');
    this.workerInfo.style.cssText = `
      border-top: 1px solid #555;
      padding-top: 6px;
      margin-top: 6px;
      display: flex;
      gap: 16px;
      font-size: 13px;
    `;
    this.container.appendChild(this.workerInfo);
    
    document.body.appendChild(this.container);
    
    // Initial render
    this.update();
  }
  
  /**
   * Update the HUD display (call each frame or when resources change)
   */
  update(): void {
    if (!this.container) return;
    
    const resources = gameSystems.getResources();
    const workerCount = gameSystems.getWorkerCount();
    const maxWorkers = gameSystems.getMaxWorkers();
    const gold = gameSystems.getGold();
    
    // Check if anything changed
    const resourcesChanged = this.hasResourcesChanged(resources);
    const workersChanged = workerCount !== this.lastWorkerCount || maxWorkers !== this.lastMaxWorkers;
    
    if (!resourcesChanged && !workersChanged) return;
    
    // Update primary resources
    if (this.primaryRow && resourcesChanged) {
      this.primaryRow.innerHTML = '';
      
      // Gold from production system
      this.primaryRow.appendChild(this.createResourceEl('gold', Math.floor(gold)));
      
      // Other primary resources from workers
      for (const key of PRIMARY_RESOURCES) {
        if (key === 'gold') continue; // Already added
        this.primaryRow.appendChild(this.createResourceEl(key, resources[key]));
      }
    }
    
    // Update secondary resources
    if (this.secondaryRow && resourcesChanged) {
      this.secondaryRow.innerHTML = '';
      
      for (const key of SECONDARY_RESOURCES) {
        if (resources[key] > 0) {
          this.secondaryRow.appendChild(this.createResourceEl(key, resources[key], true));
        }
      }
      
      // Hide row if empty
      this.secondaryRow.style.display = this.secondaryRow.children.length > 0 ? 'flex' : 'none';
    }
    
    // Update worker info
    if (this.workerInfo && workersChanged) {
      const heroLimit = gameSystems.getHeroLimit();
      
      this.workerInfo.innerHTML = `
        <span>👷 Workers: ${workerCount}/${maxWorkers}</span>
        <span>🦸 Heroes: ${heroLimit.current}/${heroLimit.max}</span>
      `;
    }
    
    // Cache for next comparison
    this.lastResources = { ...resources };
    this.lastWorkerCount = workerCount;
    this.lastMaxWorkers = maxWorkers;
  }
  
  /**
   * Create a resource display element
   */
  private createResourceEl(key: keyof PlayerResources, value: number, small: boolean = false): HTMLElement {
    const el = document.createElement('span');
    el.style.cssText = small 
      ? 'display: flex; align-items: center; gap: 2px;'
      : 'display: flex; align-items: center; gap: 4px; font-weight: 500;';
    
    const icon = RESOURCE_ICONS[key] || '❓';
    const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
    
    el.innerHTML = `<span>${icon}</span><span>${displayValue}</span>`;
    el.title = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
    
    return el;
  }
  
  /**
   * Check if resources have changed
   */
  private hasResourcesChanged(current: PlayerResources): boolean {
    if (!this.lastResources) return true;
    
    for (const key of Object.keys(current) as (keyof PlayerResources)[]) {
      if (current[key] !== this.lastResources[key]) return true;
    }
    
    return false;
  }
  
  /**
   * Show/hide the HUD
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}

// Singleton
export const resourceHUD = new ResourceHUD();
