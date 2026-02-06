// ============================================
// UI FRAME MANAGER
// DOM-based panel management with glass morphism UI
// ============================================

import { UIFrame, UIFrameConfig, injectUIStyles } from './UIFrame.ts';

export class UIFrameManager {
  private container: HTMLElement;
  private panels: Map<string, UIFrame> = new Map();
  private zIndexCounter: number = 100;
  private focusedPanelId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    injectUIStyles();
    this.injectManagerStyles();
  }

  private injectManagerStyles(): void {
    if (document.getElementById('ui-frame-manager-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ui-frame-manager-styles';
    style.textContent = `
      /* Button styles */
      .ui-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, rgba(110, 231, 183, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
        border: 1px solid rgba(110, 231, 183, 0.4);
        border-radius: 8px;
        color: #e8eaf6;
        font-family: 'Jost', sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ui-btn:hover {
        background: linear-gradient(135deg, rgba(110, 231, 183, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%);
        border-color: #6ee7b7;
        transform: translateY(-1px);
      }

      .ui-btn-primary {
        background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
        color: #0b1020;
        font-weight: 600;
      }

      .ui-btn-danger {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%);
        border-color: rgba(239, 68, 68, 0.4);
      }

      .ui-btn-sm { padding: 6px 12px; font-size: 12px; }

      /* Hotkey badge */
      .ui-hotkey {
        display: inline-block;
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        font-size: 10px;
        font-family: monospace;
        color: #a5b4d0;
      }

      /* Stat row */
      .ui-stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .ui-stat-label { color: #a5b4d0; font-size: 13px; }
      .ui-stat-value { color: #e8eaf6; font-weight: 600; font-family: monospace; }
      .ui-stat-value.positive { color: #4ade80; }
      .ui-stat-value.negative { color: #ef4444; }

      /* Progress bar */
      .ui-progress {
        height: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
      }

      .ui-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #6ee7b7, #10b981);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .ui-progress-bar.health { background: linear-gradient(90deg, #4ade80, #16a34a); }
      .ui-progress-bar.mana { background: linear-gradient(90deg, #60a5fa, #2563eb); }
      .ui-progress-bar.stamina { background: linear-gradient(90deg, #fbbf24, #d97706); }

      /* Resource display */
      .ui-resource {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
      }

      .ui-resource-icon { font-size: 16px; }
      .ui-resource-value { font-family: monospace; font-weight: 600; color: #e8eaf6; }

      /* Action bar */
      .ui-action-slot {
        position: relative;
        width: 50px;
        height: 50px;
        background: rgba(20, 26, 43, 0.8);
        border: 2px solid rgba(110, 231, 183, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ui-action-slot:hover {
        border-color: #6ee7b7;
        background: rgba(110, 231, 183, 0.1);
      }

      .ui-action-slot.active {
        border-color: #6ee7b7;
        box-shadow: 0 0 15px rgba(110, 231, 183, 0.3);
      }

      .ui-action-slot .icon { font-size: 24px; }
      .ui-action-slot .hotkey {
        position: absolute;
        bottom: 2px;
        right: 4px;
        font-size: 10px;
        color: #a5b4d0;
        font-family: monospace;
      }

      /* Game border frame */
      .game-border-frame {
        position: fixed;
        pointer-events: none;
        z-index: 50;
      }

      .game-border-top {
        top: 0; left: 0; right: 0;
        height: 60px;
        background: linear-gradient(180deg, rgba(11, 16, 32, 0.95) 0%, transparent 100%);
        border-bottom: 1px solid rgba(110, 231, 183, 0.2);
      }

      .game-border-bottom {
        bottom: 0; left: 0; right: 0;
        height: 80px;
        background: linear-gradient(0deg, rgba(11, 16, 32, 0.95) 0%, transparent 100%);
        border-top: 1px solid rgba(110, 231, 183, 0.2);
      }

      .game-border-left {
        top: 60px; bottom: 80px; left: 0;
        width: 10px;
        background: linear-gradient(90deg, rgba(11, 16, 32, 0.8) 0%, transparent 100%);
      }

      .game-border-right {
        top: 60px; bottom: 80px; right: 0;
        width: 10px;
        background: linear-gradient(-90deg, rgba(11, 16, 32, 0.8) 0%, transparent 100%);
      }

      /* Corner decorations */
      .game-corner {
        position: fixed;
        width: 40px;
        height: 40px;
        pointer-events: none;
        z-index: 51;
      }

      .game-corner-tl { top: 0; left: 0; }
      .game-corner-tr { top: 0; right: 0; transform: scaleX(-1); }
      .game-corner-bl { bottom: 0; left: 0; transform: scaleY(-1); }
      .game-corner-br { bottom: 0; right: 0; transform: scale(-1, -1); }

      .game-corner::before {
        content: '';
        position: absolute;
        top: 5px;
        left: 5px;
        width: 25px;
        height: 25px;
        border-left: 3px solid #6ee7b7;
        border-top: 3px solid #6ee7b7;
      }
    `;
    
    document.head.appendChild(style);
  }

  // === PANEL MANAGEMENT ===

  createPanel(config: UIFrameConfig): UIFrame {
    const panel = new UIFrame(config);
    
    panel.onFocus = () => this.focusPanel(config.id);
    
    this.panels.set(config.id, panel);
    this.container.appendChild(panel.element);
    
    return panel;
  }

  getPanel(id: string): UIFrame | undefined {
    return this.panels.get(id);
  }

  removePanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.destroy();
      this.panels.delete(id);
    }
  }

  showPanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      panel.show();
      this.focusPanel(id);
    }
  }

  hidePanel(id: string): void {
    this.panels.get(id)?.hide();
  }

  togglePanel(id: string): void {
    const panel = this.panels.get(id);
    if (panel) {
      if (panel.isVisible()) panel.hide();
      else { panel.show(); this.focusPanel(id); }
    }
  }

  focusPanel(id: string): void {
    if (this.focusedPanelId === id) return;
    this.focusedPanelId = id;
    this.zIndexCounter++;
    this.panels.get(id)?.bringToFront(this.zIndexCounter);
  }

  // === CREATE GAME BORDER FRAME ===

  createGameBorder(): void {
    // Top border
    const top = document.createElement('div');
    top.className = 'game-border-frame game-border-top';
    this.container.appendChild(top);

    // Bottom border
    const bottom = document.createElement('div');
    bottom.className = 'game-border-frame game-border-bottom';
    this.container.appendChild(bottom);

    // Left border
    const left = document.createElement('div');
    left.className = 'game-border-frame game-border-left';
    this.container.appendChild(left);

    // Right border
    const right = document.createElement('div');
    right.className = 'game-border-frame game-border-right';
    this.container.appendChild(right);

    // Corner decorations
    ['tl', 'tr', 'bl', 'br'].forEach(corner => {
      const el = document.createElement('div');
      el.className = `game-corner game-corner-${corner}`;
      this.container.appendChild(el);
    });
  }

  // === CONVENIENCE CREATORS ===

  createSelectionPanel(): UIFrame {
    const panel = this.createPanel({
      id: 'selectionPanel',
      title: '⚔️ Selection',
      x: 20,
      y: 100,
      width: 280,
      height: 0,
      anchor: 'bottom-left',
      draggable: true,
      closable: true
    });
    
    panel.setContent(`
      <div class="ui-stat-row">
        <span class="ui-stat-label">No unit selected</span>
      </div>
    `);
    
    return panel;
  }

  createBoatDockPanel(): UIFrame {
    return this.createPanel({
      id: 'boatDockPanel',
      title: '⚓ Boat Dock',
      x: 0,
      y: 0,
      width: 350,
      height: 400,
      anchor: 'center',
      draggable: true,
      closable: true,
      visible: false
    });
  }

  createHomeIslandButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'ui-btn';
    btn.innerHTML = '🏝️ Home Island <span class="ui-hotkey">H</span>';
    btn.style.position = 'absolute';
    btn.style.top = '10px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.pointerEvents = 'auto';
    this.container.appendChild(btn);
    return btn;
  }

  destroy(): void {
    for (const panel of this.panels.values()) {
      panel.destroy();
    }
    this.panels.clear();
  }
}
