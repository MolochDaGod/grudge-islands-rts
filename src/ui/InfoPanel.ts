// ============================================
// INFO PANEL COMPONENT
// Selection info panel with unit/building stats
// ============================================

// Entity/Hero types for stat conversion
interface EntityLike {
  type: string;
  team: string;
  health: number;
  maxHealth: number;
  attackDamage: number;
  defense: number;
  speed: number;
  attackRange: number;
}

interface HeroLike extends EntityLike {
  level: number;
}

export interface UnitStats {
  name: string;
  icon: string;
  level?: number;
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  range?: number;
}

export interface BuildingStats {
  name: string;
  icon: string;
  health: number;
  maxHealth: number;
  productionQueue?: string[];
  garrisoned?: number;
  maxGarrison?: number;
}

export class InfoPanel {
  private element: HTMLElement;
  private contentEl: HTMLElement;
  private visible: boolean = true;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'info-panel';
    this.element.innerHTML = `
      <div class="info-panel-header">
        <span class="info-panel-icon">ℹ️</span>
        <span class="info-panel-title">Selection</span>
      </div>
      <div class="info-panel-content">
        <div class="info-empty">No unit selected</div>
      </div>
    `;
    
    this.contentEl = this.element.querySelector('.info-panel-content')!;
    
    this.injectStyles();
    container.appendChild(this.element);
  }

  private injectStyles(): void {
    if (document.getElementById('info-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'info-panel-styles';
    style.textContent = `
      .info-panel {
        position: fixed;
        bottom: 80px;
        left: 20px;
        width: 280px;
        background: linear-gradient(180deg, rgba(20, 26, 43, 0.95) 0%, rgba(11, 16, 32, 0.98) 100%);
        border: 1px solid rgba(110, 231, 183, 0.3);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        z-index: 100;
        overflow: hidden;
        pointer-events: auto;
      }

      .info-panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(110, 231, 183, 0.1);
        border-bottom: 1px solid rgba(110, 231, 183, 0.2);
      }

      .info-panel-icon {
        font-size: 18px;
      }

      .info-panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #e8eaf6;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .info-panel-content {
        padding: 16px;
      }

      .info-empty {
        color: #a5b4d0;
        font-style: italic;
        text-align: center;
        padding: 20px 0;
      }

      /* Unit display */
      .unit-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .unit-portrait {
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(110, 231, 183, 0.3);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
      }

      .unit-info {
        flex: 1;
      }

      .unit-name {
        font-size: 16px;
        font-weight: 600;
        color: #e8eaf6;
        margin-bottom: 4px;
      }

      .unit-level {
        font-size: 12px;
        color: #6ee7b7;
      }

      /* Health/Mana bars */
      .stat-bar-container {
        margin-bottom: 12px;
      }

      .stat-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        margin-bottom: 4px;
      }

      .stat-bar-name { color: #a5b4d0; }
      .stat-bar-value { color: #e8eaf6; font-family: monospace; }

      .stat-bar {
        height: 8px;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 4px;
        overflow: hidden;
      }

      .stat-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .stat-bar-fill.health {
        background: linear-gradient(90deg, #4ade80, #16a34a);
      }

      .stat-bar-fill.mana {
        background: linear-gradient(90deg, #60a5fa, #2563eb);
      }

      .stat-bar-fill.low {
        background: linear-gradient(90deg, #ef4444, #dc2626);
      }

      /* Stat grid */
      .stat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
      }

      .stat-item-icon {
        font-size: 16px;
      }

      .stat-item-value {
        font-size: 14px;
        font-weight: 600;
        color: #e8eaf6;
        font-family: monospace;
      }

      .stat-item-label {
        font-size: 10px;
        color: #a5b4d0;
      }

      /* Multi-selection */
      .multi-select {
        text-align: center;
      }

      .multi-select-count {
        font-size: 32px;
        font-weight: bold;
        color: #6ee7b7;
      }

      .multi-select-label {
        color: #a5b4d0;
        font-size: 14px;
      }

      .multi-select-icons {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .multi-select-icon {
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(110, 231, 183, 0.2);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
    `;
    
    document.head.appendChild(style);
  }

  showUnit(stats: UnitStats): void {
    const healthPercent = (stats.health / stats.maxHealth) * 100;
    const healthClass = healthPercent < 25 ? 'low' : 'health';
    
    let manaBar = '';
    if (stats.mana !== undefined && stats.maxMana !== undefined) {
      const manaPercent = (stats.mana / stats.maxMana) * 100;
      manaBar = `
        <div class="stat-bar-container">
          <div class="stat-bar-label">
            <span class="stat-bar-name">Mana</span>
            <span class="stat-bar-value">${stats.mana}/${stats.maxMana}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill mana" style="width: ${manaPercent}%"></div>
          </div>
        </div>
      `;
    }
    
    this.contentEl.innerHTML = `
      <div class="unit-header">
        <div class="unit-portrait">${stats.icon}</div>
        <div class="unit-info">
          <div class="unit-name">${stats.name}</div>
          ${stats.level !== undefined ? `<div class="unit-level">Level ${stats.level}</div>` : ''}
        </div>
      </div>
      
      <div class="stat-bar-container">
        <div class="stat-bar-label">
          <span class="stat-bar-name">Health</span>
          <span class="stat-bar-value">${stats.health}/${stats.maxHealth}</span>
        </div>
        <div class="stat-bar">
          <div class="stat-bar-fill ${healthClass}" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      
      ${manaBar}
      
      <div class="stat-grid">
        ${stats.attack !== undefined ? `
          <div class="stat-item">
            <span class="stat-item-icon">⚔️</span>
            <div>
              <div class="stat-item-value">${stats.attack}</div>
              <div class="stat-item-label">Attack</div>
            </div>
          </div>
        ` : ''}
        ${stats.defense !== undefined ? `
          <div class="stat-item">
            <span class="stat-item-icon">🛡️</span>
            <div>
              <div class="stat-item-value">${stats.defense}</div>
              <div class="stat-item-label">Defense</div>
            </div>
          </div>
        ` : ''}
        ${stats.speed !== undefined ? `
          <div class="stat-item">
            <span class="stat-item-icon">👟</span>
            <div>
              <div class="stat-item-value">${stats.speed}</div>
              <div class="stat-item-label">Speed</div>
            </div>
          </div>
        ` : ''}
        ${stats.range !== undefined ? `
          <div class="stat-item">
            <span class="stat-item-icon">🎯</span>
            <div>
              <div class="stat-item-value">${stats.range}</div>
              <div class="stat-item-label">Range</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  showBuilding(stats: BuildingStats): void {
    const healthPercent = (stats.health / stats.maxHealth) * 100;
    
    let garrisonInfo = '';
    if (stats.maxGarrison !== undefined) {
      garrisonInfo = `
        <div class="stat-item" style="grid-column: span 2;">
          <span class="stat-item-icon">🏠</span>
          <div>
            <div class="stat-item-value">${stats.garrisoned || 0}/${stats.maxGarrison}</div>
            <div class="stat-item-label">Garrisoned</div>
          </div>
        </div>
      `;
    }
    
    this.contentEl.innerHTML = `
      <div class="unit-header">
        <div class="unit-portrait">${stats.icon}</div>
        <div class="unit-info">
          <div class="unit-name">${stats.name}</div>
        </div>
      </div>
      
      <div class="stat-bar-container">
        <div class="stat-bar-label">
          <span class="stat-bar-name">Health</span>
          <span class="stat-bar-value">${stats.health}/${stats.maxHealth}</span>
        </div>
        <div class="stat-bar">
          <div class="stat-bar-fill health" style="width: ${healthPercent}%"></div>
        </div>
      </div>
      
      <div class="stat-grid">
        ${garrisonInfo}
      </div>
    `;
  }

  showMultiSelection(units: { icon: string; count: number }[]): void {
    const total = units.reduce((sum, u) => sum + u.count, 0);
    
    const icons = units.flatMap(u => 
      Array(Math.min(u.count, 5)).fill(u.icon)
    ).slice(0, 12);
    
    this.contentEl.innerHTML = `
      <div class="multi-select">
        <div class="multi-select-count">${total}</div>
        <div class="multi-select-label">Units Selected</div>
        <div class="multi-select-icons">
          ${icons.map(icon => `<div class="multi-select-icon">${icon}</div>`).join('')}
        </div>
      </div>
    `;
  }

  showEmpty(): void {
    this.contentEl.innerHTML = `<div class="info-empty">No unit selected</div>`;
  }

  // Helper to convert Entity to UnitStats
  static entityToStats(entity: EntityLike, isHero: boolean = false): UnitStats {
    return {
      name: entity.type,
      icon: isHero ? '🦸' : (entity.team === 'player' ? '⚔️' : '👹'),
      level: isHero && 'level' in entity ? (entity as HeroLike).level : undefined,
      health: entity.health,
      maxHealth: entity.maxHealth,
      attack: entity.attackDamage,
      defense: entity.defense,
      speed: Math.round(entity.speed * 10) / 10,
      range: entity.attackRange
    };
  }

  setTitle(title: string, icon?: string): void {
    const titleEl = this.element.querySelector('.info-panel-title');
    const iconEl = this.element.querySelector('.info-panel-icon');
    if (titleEl) titleEl.textContent = title;
    if (iconEl && icon) iconEl.textContent = icon;
  }

  show(): void {
    this.element.style.display = 'block';
    this.visible = true;
  }

  hide(): void {
    this.element.style.display = 'none';
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.element.remove();
  }
}
