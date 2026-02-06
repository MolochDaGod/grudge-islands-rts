// ============================================
// RESOURCE BAR COMPONENT
// Top bar with resources, gold, unit counts
// ============================================

export interface ResourceData {
  gold: number;
  wood: number;
  stone: number;
  food: number;
  iron?: number;
  mana?: number;
  population: { current: number; max: number };
}

export class ResourceBar {
  private element: HTMLElement;
  private resources: ResourceData;

  constructor(container: HTMLElement) {
    this.resources = {
      gold: 0,
      wood: 0,
      stone: 0,
      food: 0,
      population: { current: 0, max: 10 }
    };

    this.element = document.createElement('div');
    this.element.className = 'resource-bar';
    
    this.injectStyles();
    this.render();
    container.appendChild(this.element);
  }

  private injectStyles(): void {
    if (document.getElementById('resource-bar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'resource-bar-styles';
    style.textContent = `
      .resource-bar {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 20px;
        background: linear-gradient(180deg, rgba(20, 26, 43, 0.95) 0%, rgba(11, 16, 32, 0.98) 100%);
        border: 1px solid rgba(110, 231, 183, 0.3);
        border-radius: 30px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        z-index: 100;
        pointer-events: auto;
      }

      .resource-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 20px;
        transition: all 0.2s;
      }

      .resource-item:hover {
        background: rgba(110, 231, 183, 0.1);
      }

      .resource-icon {
        font-size: 18px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }

      .resource-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: #e8eaf6;
        min-width: 40px;
        text-align: right;
      }

      .resource-value.gold { color: #fbbf24; }
      .resource-value.wood { color: #a3e635; }
      .resource-value.stone { color: #94a3b8; }
      .resource-value.food { color: #fb923c; }
      .resource-value.iron { color: #60a5fa; }
      .resource-value.mana { color: #c084fc; }

      .resource-divider {
        width: 1px;
        height: 24px;
        background: rgba(110, 231, 183, 0.2);
      }

      .population-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: rgba(110, 231, 183, 0.1);
        border: 1px solid rgba(110, 231, 183, 0.2);
        border-radius: 20px;
      }

      .population-icon {
        font-size: 16px;
      }

      .population-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
      }

      .population-current { color: #6ee7b7; }
      .population-divider { color: #a5b4d0; }
      .population-max { color: #a5b4d0; }

      .population-item.full .population-current {
        color: #ef4444;
      }

      /* Gain/loss animation */
      .resource-change {
        position: absolute;
        font-size: 12px;
        font-weight: bold;
        pointer-events: none;
        animation: resourceFloat 1s ease-out forwards;
      }

      .resource-change.gain { color: #4ade80; }
      .resource-change.loss { color: #ef4444; }

      @keyframes resourceFloat {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }

      /* Mini map toggle */
      .minimap-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(110, 231, 183, 0.2);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
      }

      .minimap-toggle:hover {
        background: rgba(110, 231, 183, 0.2);
        border-color: #6ee7b7;
      }
    `;
    
    document.head.appendChild(style);
  }

  private render(): void {
    const { gold, wood, stone, food, iron, mana, population } = this.resources;
    const popFull = population.current >= population.max;
    
    this.element.innerHTML = `
      <div class="resource-item">
        <span class="resource-icon">🪙</span>
        <span class="resource-value gold">${this.formatNumber(gold)}</span>
      </div>
      
      <div class="resource-item">
        <span class="resource-icon">🪵</span>
        <span class="resource-value wood">${this.formatNumber(wood)}</span>
      </div>
      
      <div class="resource-item">
        <span class="resource-icon">🪨</span>
        <span class="resource-value stone">${this.formatNumber(stone)}</span>
      </div>
      
      <div class="resource-item">
        <span class="resource-icon">🍖</span>
        <span class="resource-value food">${this.formatNumber(food)}</span>
      </div>
      
      ${iron !== undefined ? `
        <div class="resource-item">
          <span class="resource-icon">⚙️</span>
          <span class="resource-value iron">${this.formatNumber(iron)}</span>
        </div>
      ` : ''}
      
      ${mana !== undefined ? `
        <div class="resource-item">
          <span class="resource-icon">💎</span>
          <span class="resource-value mana">${this.formatNumber(mana)}</span>
        </div>
      ` : ''}
      
      <div class="resource-divider"></div>
      
      <div class="population-item ${popFull ? 'full' : ''}">
        <span class="population-icon">👥</span>
        <span class="population-current">${population.current}</span>
        <span class="population-divider">/</span>
        <span class="population-max">${population.max}</span>
      </div>
    `;
  }

  private formatNumber(num: number): string {
    if (num >= 10000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  update(resources: Partial<ResourceData>): void {
    // Track changes for animations
    const oldResources = { ...this.resources };
    Object.assign(this.resources, resources);
    
    // Show change animations
    if (resources.gold !== undefined && resources.gold !== oldResources.gold) {
      this.showChange(0, resources.gold - oldResources.gold);
    }
    
    this.render();
  }

  private showChange(index: number, amount: number): void {
    const item = this.element.querySelectorAll('.resource-item')[index];
    if (!item) return;
    
    const change = document.createElement('span');
    change.className = `resource-change ${amount > 0 ? 'gain' : 'loss'}`;
    change.textContent = amount > 0 ? `+${amount}` : String(amount);
    change.style.left = '50%';
    change.style.top = '0';
    
    item.appendChild(change);
    setTimeout(() => change.remove(), 1000);
  }

  setGold(value: number): void {
    this.update({ gold: value });
  }

  setWood(value: number): void {
    this.update({ wood: value });
  }

  setStone(value: number): void {
    this.update({ stone: value });
  }

  setFood(value: number): void {
    this.update({ food: value });
  }

  setPopulation(current: number, max: number): void {
    this.update({ population: { current, max } });
  }

  addGold(amount: number): void {
    this.setGold(this.resources.gold + amount);
  }

  addWood(amount: number): void {
    this.setWood(this.resources.wood + amount);
  }

  show(): void {
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  destroy(): void {
    this.element.remove();
  }
}
