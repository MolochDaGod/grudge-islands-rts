// ============================================
// INPUT MANAGER
// Handles mouse/keyboard input for camera, selection, commands
// ============================================

import type { Position } from '../../types/index.ts';
import { WORLD_CONFIG } from '../world/WorldGenerator.ts';

export interface InputState {
  // Mouse buttons
  leftDown: boolean;
  rightDown: boolean;
  middleDown: boolean;
  
  // Mouse position
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  
  // Dragging
  isDragging: boolean;
  dragStart: Position;
  dragDelta: Position;
  
  // Keyboard modifiers
  shiftHeld: boolean;
  ctrlHeld: boolean;
  altHeld: boolean;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private minimapCanvas: HTMLCanvasElement | null;
  
  // Input state
  private state: InputState = {
    leftDown: false,
    rightDown: false,
    middleDown: false,
    screenX: 0,
    screenY: 0,
    worldX: 0,
    worldY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragDelta: { x: 0, y: 0 },
    shiftHeld: false,
    ctrlHeld: false,
    altHeld: false
  };
  
  // Camera state
  private camera: CameraState = {
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.25,
    maxZoom: 2
  };
  
  // Pan state for middle mouse
  private isPanning: boolean = false;
  private panStart: Position = { x: 0, y: 0 };
  private cameraPanStart: Position = { x: 0, y: 0 };
  
  // Edge pan settings
  private edgePanEnabled: boolean = true;
  private edgePanSpeed: number = 500;
  private edgePanMargin: number = 30;
  
  // Callbacks
  public onCameraMove: ((x: number, y: number) => void) | null = null;
  public onCameraZoom: ((zoom: number, centerX: number, centerY: number) => void) | null = null;
  public onLeftClick: ((worldX: number, worldY: number, screenX: number, screenY: number) => void) | null = null;
  public onRightClick: ((worldX: number, worldY: number) => void) | null = null;
  public onSelectionStart: ((screenX: number, screenY: number) => void) | null = null;
  public onSelectionUpdate: ((screenX: number, screenY: number) => void) | null = null;
  public onSelectionEnd: ((screenX: number, screenY: number) => void) | null = null;
  public onMinimapClick: ((worldX: number, worldY: number) => void) | null = null;
  public onKeyDown: ((key: string, state: InputState) => void) | null = null;
  public onKeyUp: ((key: string, state: InputState) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.minimapCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events on main canvas
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Minimap events
    if (this.minimapCanvas) {
      this.minimapCanvas.addEventListener('mousedown', this.handleMinimapClick.bind(this));
      this.minimapCanvas.addEventListener('mousemove', this.handleMinimapDrag.bind(this));
      this.minimapCanvas.addEventListener('mouseup', this.handleMinimapRelease.bind(this));
    }
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  // === MOUSE HANDLERS ===

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    this.state.screenX = screenX;
    this.state.screenY = screenY;
    this.updateWorldPosition();
    
    switch (e.button) {
      case 0: // Left click
        this.state.leftDown = true;
        this.state.isDragging = true;
        this.state.dragStart = { x: screenX, y: screenY };
        if (this.onSelectionStart) {
          this.onSelectionStart(screenX, screenY);
        }
        break;
        
      case 1: // Middle click - start panning
        this.state.middleDown = true;
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.cameraPanStart = { x: this.camera.x, y: this.camera.y };
        this.canvas.style.cursor = 'grabbing';
        e.preventDefault();
        break;
        
      case 2: // Right click
        this.state.rightDown = true;
        if (this.onRightClick) {
          this.onRightClick(this.state.worldX, this.state.worldY);
        }
        break;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    switch (e.button) {
      case 0: // Left click release
        this.state.leftDown = false;
        if (this.state.isDragging) {
          this.state.isDragging = false;
          const dragDist = Math.hypot(
            screenX - this.state.dragStart.x,
            screenY - this.state.dragStart.y
          );
          
          if (dragDist < 5) {
            // Click, not drag
            if (this.onLeftClick) {
              this.onLeftClick(this.state.worldX, this.state.worldY, screenX, screenY);
            }
          } else {
            // Selection box complete
            if (this.onSelectionEnd) {
              this.onSelectionEnd(screenX, screenY);
            }
          }
        }
        break;
        
      case 1: // Middle click release
        this.state.middleDown = false;
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
        break;
        
      case 2: // Right click release
        this.state.rightDown = false;
        break;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.screenX = e.clientX - rect.left;
    this.state.screenY = e.clientY - rect.top;
    this.updateWorldPosition();
    
    // Middle mouse panning
    if (this.isPanning && this.state.middleDown) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      
      // Pan camera (inverted - drag right moves camera left)
      const newX = this.cameraPanStart.x - dx / this.camera.zoom;
      const newY = this.cameraPanStart.y - dy / this.camera.zoom;
      
      this.setCameraPosition(newX, newY);
    }
    
    // Selection box update
    if (this.state.isDragging && this.state.leftDown) {
      this.state.dragDelta = {
        x: this.state.screenX - this.state.dragStart.x,
        y: this.state.screenY - this.state.dragStart.y
      };
      
      if (this.onSelectionUpdate) {
        this.onSelectionUpdate(this.state.screenX, this.state.screenY);
      }
    }
  }

  private handleMouseLeave(_e: MouseEvent): void {
    // Cancel panning if mouse leaves canvas
    if (this.isPanning) {
      this.isPanning = false;
      this.state.middleDown = false;
      this.canvas.style.cursor = 'default';
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.zoom + delta));
    
    if (newZoom !== this.camera.zoom) {
      // Zoom toward mouse position
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // World position before zoom
      const worldX = this.camera.x + mouseX / this.camera.zoom;
      const worldY = this.camera.y + mouseY / this.camera.zoom;
      
      this.camera.zoom = newZoom;
      
      // Adjust camera to keep mouse point stable
      this.camera.x = worldX - mouseX / this.camera.zoom;
      this.camera.y = worldY - mouseY / this.camera.zoom;
      
      this.clampCamera();
      this.updateWorldPosition();
      
      if (this.onCameraZoom) {
        this.onCameraZoom(this.camera.zoom, mouseX, mouseY);
      }
      if (this.onCameraMove) {
        this.onCameraMove(this.camera.x, this.camera.y);
      }
    }
  }

  // === MINIMAP HANDLERS ===

  private minimapDragging: boolean = false;

  private handleMinimapClick(e: MouseEvent): void {
    if (e.button !== 0) return;
    
    this.minimapDragging = true;
    this.moveCameraFromMinimap(e);
  }

  private handleMinimapDrag(e: MouseEvent): void {
    if (!this.minimapDragging) return;
    this.moveCameraFromMinimap(e);
  }

  private handleMinimapRelease(_e: MouseEvent): void {
    this.minimapDragging = false;
  }

  private moveCameraFromMinimap(e: MouseEvent): void {
    if (!this.minimapCanvas) return;
    
    const rect = this.minimapCanvas.getBoundingClientRect();
    const minimapX = e.clientX - rect.left;
    const minimapY = e.clientY - rect.top;
    
    // Convert minimap coords to world coords
    const worldX = (minimapX / this.minimapCanvas.width) * WORLD_CONFIG.width;
    const worldY = (minimapY / this.minimapCanvas.height) * WORLD_CONFIG.height;
    
    // Center camera on clicked position
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    const newCameraX = worldX - (screenWidth / 2) / this.camera.zoom;
    const newCameraY = worldY - (screenHeight / 2) / this.camera.zoom;
    
    this.setCameraPosition(newCameraX, newCameraY);
    
    if (this.onMinimapClick) {
      this.onMinimapClick(worldX, worldY);
    }
  }

  // === KEYBOARD HANDLERS ===

  private handleKeyDown(e: KeyboardEvent): void {
    // Update modifiers
    this.state.shiftHeld = e.shiftKey;
    this.state.ctrlHeld = e.ctrlKey;
    this.state.altHeld = e.altKey;
    
    // Camera movement with arrow keys or WASD
    const panAmount = 100 / this.camera.zoom;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.setCameraPosition(this.camera.x, this.camera.y - panAmount);
        return;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.setCameraPosition(this.camera.x, this.camera.y + panAmount);
        return;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.setCameraPosition(this.camera.x - panAmount, this.camera.y);
        return;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.setCameraPosition(this.camera.x + panAmount, this.camera.y);
        return;
    }
    
    if (this.onKeyDown) {
      this.onKeyDown(e.key, this.state);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.state.shiftHeld = e.shiftKey;
    this.state.ctrlHeld = e.ctrlKey;
    this.state.altHeld = e.altKey;
    
    if (this.onKeyUp) {
      this.onKeyUp(e.key, this.state);
    }
  }

  // === CAMERA CONTROL ===

  setCameraPosition(x: number, y: number): void {
    this.camera.x = x;
    this.camera.y = y;
    this.clampCamera();
    this.updateWorldPosition();
    
    if (this.onCameraMove) {
      this.onCameraMove(this.camera.x, this.camera.y);
    }
  }

  private clampCamera(): void {
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    const maxX = WORLD_CONFIG.width - screenWidth / this.camera.zoom;
    const maxY = WORLD_CONFIG.height - screenHeight / this.camera.zoom;
    
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  }

  centerCameraOn(worldX: number, worldY: number): void {
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    this.setCameraPosition(
      worldX - (screenWidth / 2) / this.camera.zoom,
      worldY - (screenHeight / 2) / this.camera.zoom
    );
  }

  // === EDGE PANNING (called in game loop) ===

  updateEdgePan(deltaTime: number): void {
    if (!this.edgePanEnabled || this.isPanning) return;
    
    const margin = this.edgePanMargin;
    const speed = this.edgePanSpeed * deltaTime / this.camera.zoom;
    
    let dx = 0;
    let dy = 0;
    
    if (this.state.screenX < margin) {
      dx = -speed * (1 - this.state.screenX / margin);
    } else if (this.state.screenX > this.canvas.width - margin) {
      dx = speed * (1 - (this.canvas.width - this.state.screenX) / margin);
    }
    
    if (this.state.screenY < margin) {
      dy = -speed * (1 - this.state.screenY / margin);
    } else if (this.state.screenY > this.canvas.height - margin) {
      dy = speed * (1 - (this.canvas.height - this.state.screenY) / margin);
    }
    
    if (dx !== 0 || dy !== 0) {
      this.setCameraPosition(this.camera.x + dx, this.camera.y + dy);
    }
  }

  // === COORDINATE CONVERSION ===

  private updateWorldPosition(): void {
    this.state.worldX = this.camera.x + this.state.screenX / this.camera.zoom;
    this.state.worldY = this.camera.y + this.state.screenY / this.camera.zoom;
  }

  screenToWorld(screenX: number, screenY: number): Position {
    return {
      x: this.camera.x + screenX / this.camera.zoom,
      y: this.camera.y + screenY / this.camera.zoom
    };
  }

  worldToScreen(worldX: number, worldY: number): Position {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom
    };
  }

  // === GETTERS ===

  getState(): InputState {
    return { ...this.state };
  }

  getCamera(): CameraState {
    return { ...this.camera };
  }

  getCameraPosition(): Position {
    return { x: this.camera.x, y: this.camera.y };
  }

  getZoom(): number {
    return this.camera.zoom;
  }

  setZoom(zoom: number): void {
    this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, zoom));
    this.clampCamera();
  }

  setEdgePanEnabled(enabled: boolean): void {
    this.edgePanEnabled = enabled;
  }
}
