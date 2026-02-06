// ============================================
// UI FRAME
// Base panel component with glass morphism styling
// ============================================

export interface UIFrameConfig {
  id: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable?: boolean;
  closable?: boolean;
  resizable?: boolean;
  visible?: boolean;
  className?: string;
  anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export class UIFrame {
  public readonly id: string;
  public element: HTMLDivElement;
  public contentElement: HTMLDivElement;
  public headerElement: HTMLDivElement | null = null;
  
  private config: UIFrameConfig;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  
  public onClose: (() => void) | null = null;
  public onFocus: (() => void) | null = null;

  constructor(config: UIFrameConfig) {
    this.id = config.id;
    this.config = {
      draggable: false,
      closable: false,
      resizable: false,
      visible: true,
      anchor: 'top-left',
      ...config
    };
    
    this.element = this.createElement();
    this.contentElement = this.element.querySelector('.ui-frame-content')!;
    
    if (this.config.title) {
      this.headerElement = this.element.querySelector('.ui-frame-header')!;
    }
    
    this.setupDragging();
    this.applyPosition();
  }

  private createElement(): HTMLDivElement {
    const frame = document.createElement('div');
    frame.id = this.id;
    frame.className = `ui-frame ${this.config.className || ''}`;
    frame.style.width = `${this.config.width}px`;
    frame.style.height = this.config.height === 0 ? 'auto' : `${this.config.height}px`;
    frame.style.display = this.config.visible ? 'flex' : 'none';
    
    // Build HTML
    let html = '';
    
    if (this.config.title) {
      html += `
        <div class="ui-frame-header">
          <span class="ui-frame-title">${this.config.title}</span>
          ${this.config.closable ? '<button class="ui-frame-close">✕</button>' : ''}
        </div>
      `;
    }
    
    html += '<div class="ui-frame-content"></div>';
    
    if (this.config.resizable) {
      html += '<div class="ui-frame-resize-handle"></div>';
    }
    
    frame.innerHTML = html;
    
    // Setup close button
    if (this.config.closable) {
      const closeBtn = frame.querySelector('.ui-frame-close');
      closeBtn?.addEventListener('click', () => {
        this.hide();
        this.onClose?.();
      });
    }
    
    // Focus on click
    frame.addEventListener('mousedown', () => {
      this.onFocus?.();
    });
    
    return frame;
  }

  private applyPosition(): void {
    const { x, y, anchor } = this.config;
    
    this.element.style.position = 'absolute';
    
    switch (anchor) {
      case 'top-left':
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        break;
      case 'top-right':
        this.element.style.right = `${x}px`;
        this.element.style.top = `${y}px`;
        break;
      case 'bottom-left':
        this.element.style.left = `${x}px`;
        this.element.style.bottom = `${y}px`;
        break;
      case 'bottom-right':
        this.element.style.right = `${x}px`;
        this.element.style.bottom = `${y}px`;
        break;
      case 'center':
        this.element.style.left = '50%';
        this.element.style.top = '50%';
        this.element.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  private setupDragging(): void {
    if (!this.config.draggable) return;
    
    const header = this.element.querySelector('.ui-frame-header') || this.element;
    header.classList.add('draggable');
    
    header.addEventListener('mousedown', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if ((mouseEvent.target as HTMLElement).classList.contains('ui-frame-close')) return;
      
      this.isDragging = true;
      const rect = this.element.getBoundingClientRect();
      this.dragOffsetX = mouseEvent.clientX - rect.left;
      this.dragOffsetY = mouseEvent.clientY - rect.top;
      
      // Reset anchoring for manual positioning
      this.element.style.right = '';
      this.element.style.bottom = '';
      this.element.style.transform = '';
    });
    
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffsetX;
      const y = e.clientY - this.dragOffsetY;
      
      this.element.style.left = `${Math.max(0, x)}px`;
      this.element.style.top = `${Math.max(0, y)}px`;
    });
    
    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  // === PUBLIC METHODS ===

  show(): void {
    this.element.style.display = 'flex';
    this.config.visible = true;
  }

  hide(): void {
    this.element.style.display = 'none';
    this.config.visible = false;
  }

  toggle(): void {
    if (this.config.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.config.visible || false;
  }

  setContent(html: string): void {
    this.contentElement.innerHTML = html;
  }

  appendContent(element: HTMLElement): void {
    this.contentElement.appendChild(element);
  }

  clearContent(): void {
    this.contentElement.innerHTML = '';
  }

  setTitle(title: string): void {
    if (this.headerElement) {
      const titleEl = this.headerElement.querySelector('.ui-frame-title');
      if (titleEl) titleEl.textContent = title;
    }
  }

  setPosition(x: number, y: number): void {
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.right = '';
    this.element.style.bottom = '';
    this.element.style.transform = '';
  }

  setSize(width: number, height: number): void {
    this.element.style.width = `${width}px`;
    this.element.style.height = height === 0 ? 'auto' : `${height}px`;
  }

  bringToFront(zIndex: number): void {
    this.element.style.zIndex = String(zIndex);
  }

  destroy(): void {
    this.element.remove();
  }
}

// === CSS INJECTION ===
export function injectUIStyles(): void {
  if (document.getElementById('ui-frame-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ui-frame-styles';
  style.textContent = `
    .ui-frame {
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, rgba(20, 26, 43, 0.95) 0%, rgba(30, 40, 60, 0.9) 100%);
      border: 2px solid rgba(110, 231, 183, 0.3);
      border-radius: 12px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      overflow: hidden;
      font-family: 'Jost', sans-serif;
      color: #e8eaf6;
      pointer-events: auto;
    }

    .ui-frame-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: linear-gradient(90deg, rgba(110, 231, 183, 0.15) 0%, transparent 100%);
      border-bottom: 1px solid rgba(110, 231, 183, 0.2);
    }

    .ui-frame-header.draggable {
      cursor: grab;
    }

    .ui-frame-header.draggable:active {
      cursor: grabbing;
    }

    .ui-frame-title {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      font-weight: 600;
      color: #6ee7b7;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .ui-frame-close {
      background: none;
      border: none;
      color: #a5b4d0;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .ui-frame-close:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .ui-frame-content {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
    }

    .ui-frame-resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 15px;
      height: 15px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, rgba(110, 231, 183, 0.3) 50%);
    }

    /* Corner decorations */
    .ui-frame::before,
    .ui-frame::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(110, 231, 183, 0.5);
    }

    .ui-frame::before {
      top: -2px;
      left: -2px;
      border-right: none;
      border-bottom: none;
      border-radius: 10px 0 0 0;
    }

    .ui-frame::after {
      bottom: -2px;
      right: -2px;
      border-left: none;
      border-top: none;
      border-radius: 0 0 10px 0;
    }

    /* Scrollbar styling */
    .ui-frame-content::-webkit-scrollbar {
      width: 6px;
    }

    .ui-frame-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }

    .ui-frame-content::-webkit-scrollbar-thumb {
      background: rgba(110, 231, 183, 0.3);
      border-radius: 3px;
    }

    .ui-frame-content::-webkit-scrollbar-thumb:hover {
      background: rgba(110, 231, 183, 0.5);
    }
  `;
  
  document.head.appendChild(style);
}
