// ============================================
// ACTION BAR COMPONENT
// Bottom bar with ability buttons and hotkeys
// ============================================

// ActionBar component - standalone

export interface ActionSlot {
  id: string;
  icon: string;
  label: string;
  hotkey: string;
  cooldown?: number;
  enabled?: boolean;
  onClick?: () => void;
}

export class ActionBar {
  private element: HTMLElement;
  private slots: Map<string, ActionSlot> = new Map();
  private slotElements: Map<string, HTMLElement> = new Map();
  private maxSlots: number = 10;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'action-bar';
    this.element.innerHTML = `
      <div class="action-bar-inner">
        <div class="action-slots"></div>
      </div>
    `;
    
    this.injectStyles();
    container.appendChild(this.element);
    this.setupKeyboardShortcuts();
  }

  private injectStyles(): void {
    if (document.getElementById('action-bar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'action-bar-styles';
    style.textContent = `
      .action-bar {
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        pointer-events: auto;
      }

      .action-bar-inner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        background: linear-gradient(180deg, rgba(20, 26, 43, 0.95) 0%, rgba(11, 16, 32, 0.98) 100%);
        border: 1px solid rgba(110, 231, 183, 0.3);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .action-slots {
        display: flex;
        gap: 8px;
      }

      .action-slot {
        position: relative;
        width: 54px;
        height: 54px;
        background: rgba(20, 26, 43, 0.8);
        border: 2px solid rgba(110, 231, 183, 0.2);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        overflow: hidden;
      }

      .action-slot:hover {
        border-color: #6ee7b7;
        background: rgba(110, 231, 183, 0.15);
        transform: translateY(-2px);
      }

      .action-slot.active {
        border-color: #6ee7b7;
        box-shadow: 0 0 20px rgba(110, 231, 183, 0.4);
        background: rgba(110, 231, 183, 0.2);
      }

      .action-slot.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      .action-slot .slot-icon {
        font-size: 24px;
        line-height: 1;
      }

      .action-slot .slot-hotkey {
        position: absolute;
        bottom: 2px;
        right: 4px;
        font-size: 10px;
        color: #a5b4d0;
        font-family: monospace;
        background: rgba(0, 0, 0, 0.4);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .action-slot .slot-cooldown {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: #ef4444;
      }

      .action-slot .slot-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 8px;
        padding: 6px 10px;
        background: rgba(11, 16, 32, 0.95);
        border: 1px solid rgba(110, 231, 183, 0.3);
        border-radius: 6px;
        white-space: nowrap;
        font-size: 12px;
        color: #e8eaf6;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .action-slot:hover .slot-tooltip {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(style);
  }

  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      // Number keys 1-0
      const key = e.key;
      if (key >= '1' && key <= '9') {
        this.activateSlotByHotkey(key);
      } else if (key === '0') {
        this.activateSlotByHotkey('0');
      }
    });
  }

  private activateSlotByHotkey(hotkey: string): void {
    for (const [id, slot] of this.slots) {
      if (slot.hotkey === hotkey && slot.enabled !== false && slot.onClick) {
        this.flashSlot(id);
        slot.onClick();
        break;
      }
    }
  }

  private flashSlot(id: string): void {
    const el = this.slotElements.get(id);
    if (el) {
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 150);
    }
  }

  setSlots(slots: ActionSlot[]): void {
    this.slots.clear();
    this.slotElements.clear();
    
    const container = this.element.querySelector('.action-slots')!;
    container.innerHTML = '';
    
    slots.slice(0, this.maxSlots).forEach((slot, index) => {
      const hotkey = slot.hotkey || String((index + 1) % 10);
      const slotWithHotkey = { ...slot, hotkey };
      
      this.slots.set(slot.id, slotWithHotkey);
      
      const el = document.createElement('div');
      el.className = `action-slot ${slot.enabled === false ? 'disabled' : ''}`;
      el.innerHTML = `
        <span class="slot-icon">${slot.icon}</span>
        <span class="slot-hotkey">${hotkey}</span>
        <span class="slot-tooltip">${slot.label}</span>
        ${slot.cooldown ? `<div class="slot-cooldown">${slot.cooldown}</div>` : ''}
      `;
      
      el.addEventListener('click', () => {
        if (slot.enabled !== false && slot.onClick) {
          this.flashSlot(slot.id);
          slot.onClick();
        }
      });
      
      this.slotElements.set(slot.id, el);
      container.appendChild(el);
    });
  }

  updateSlot(id: string, updates: Partial<ActionSlot>): void {
    const slot = this.slots.get(id);
    const el = this.slotElements.get(id);
    if (!slot || !el) return;
    
    Object.assign(slot, updates);
    
    if (updates.icon !== undefined) {
      el.querySelector('.slot-icon')!.textContent = updates.icon;
    }
    if (updates.label !== undefined) {
      el.querySelector('.slot-tooltip')!.textContent = updates.label;
    }
    if (updates.enabled !== undefined) {
      el.classList.toggle('disabled', !updates.enabled);
    }
    if (updates.cooldown !== undefined) {
      let cooldownEl = el.querySelector('.slot-cooldown') as HTMLElement;
      if (updates.cooldown > 0) {
        if (!cooldownEl) {
          cooldownEl = document.createElement('div');
          cooldownEl.className = 'slot-cooldown';
          el.appendChild(cooldownEl);
        }
        cooldownEl.textContent = String(updates.cooldown);
      } else if (cooldownEl) {
        cooldownEl.remove();
      }
    }
  }

  show(): void {
    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  destroy(): void {
    this.element.remove();
  }
}

// Default ability sets for different unit types
export const HERO_ABILITIES: Record<string, ActionSlot[]> = {
  Warrior: [
    { id: 'attack', icon: '⚔️', label: 'Attack', hotkey: '1', onClick: () => {} },
    { id: 'shield', icon: '🛡️', label: 'Shield Bash', hotkey: '2', onClick: () => {} },
    { id: 'charge', icon: '💨', label: 'Charge', hotkey: '3', onClick: () => {} },
    { id: 'rally', icon: '📯', label: 'Rally', hotkey: '4', onClick: () => {} },
  ],
  Mage: [
    { id: 'attack', icon: '✨', label: 'Magic Bolt', hotkey: '1', onClick: () => {} },
    { id: 'fireball', icon: '🔥', label: 'Fireball', hotkey: '2', onClick: () => {} },
    { id: 'frost', icon: '❄️', label: 'Frost Nova', hotkey: '3', onClick: () => {} },
    { id: 'teleport', icon: '🌀', label: 'Teleport', hotkey: '4', onClick: () => {} },
  ],
  Ranger: [
    { id: 'attack', icon: '🏹', label: 'Shoot', hotkey: '1', onClick: () => {} },
    { id: 'multishot', icon: '🎯', label: 'Multi-Shot', hotkey: '2', onClick: () => {} },
    { id: 'trap', icon: '🪤', label: 'Set Trap', hotkey: '3', onClick: () => {} },
    { id: 'stealth', icon: '👤', label: 'Stealth', hotkey: '4', onClick: () => {} },
  ],
  Worg: [
    { id: 'attack', icon: '🐺', label: 'Bite', hotkey: '1', onClick: () => {} },
    { id: 'howl', icon: '🌙', label: 'Howl', hotkey: '2', onClick: () => {} },
    { id: 'pounce', icon: '💨', label: 'Pounce', hotkey: '3', onClick: () => {} },
    { id: 'pack', icon: '🐾', label: 'Call Pack', hotkey: '4', onClick: () => {} },
  ]
};
