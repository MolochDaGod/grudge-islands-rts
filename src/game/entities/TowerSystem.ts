// ============================================
// TOWER SYSTEM
// Manages tower placement, upgrades, targeting, and attacks
// ============================================

import type { Position, FactionId } from '../../types/index.ts';
import type { 
  Tower, 
  TowerType, 
  TowerDefinition,
  Island 
} from '../../types/world.ts';
import { 
  TOWER_DEFINITIONS, 
  getTowerStats, 
  getTowerUpgradeCost 
} from '../../types/world.ts';
import { generateId } from '../core/GridSystem.ts';

// === PROJECTILE ===

export interface TowerProjectile {
  id: string;
  towerId: string;
  type: 'arrow' | 'cannonball' | 'magic_bolt' | 'frost_shard' | 'fireball';
  position: Position;
  targetPosition: Position;
  targetId: string | null;
  damage: number;
  speed: number;
  splashRadius?: number;
  slowEffect?: number;
  burnDamage?: number;
  lifetime: number;
}

// === TOWER BUILD MENU STATE ===

export interface TowerMenuState {
  isOpen: boolean;
  selectedTower: TowerType | null;
  canBuild: boolean;
  placementValid: boolean;
  placementPosition: Position | null;
  currentIsland: Island | null;
  playerGold: number;
}

// === TOWER MANAGER ===

export class TowerManager {
  private towers: Map<string, Tower> = new Map();
  private projectiles: TowerProjectile[] = [];
  private towerSprites: Map<string, HTMLImageElement> = new Map();
  private selectedTowerId: string | null = null;
  
  private menuState: TowerMenuState = {
    isOpen: false,
    selectedTower: null,
    canBuild: false,
    placementValid: false,
    placementPosition: null,
    currentIsland: null,
    playerGold: 0
  };
  
  // Callback for when damage is dealt
  public onDamageDealt: ((targetId: string, damage: number, towerId: string, isBurn?: boolean) => void) | null = null;
  public onKill: ((targetId: string, towerId: string) => void) | null = null;
  
  constructor() {
    this.loadSprites();
  }
  
  private async loadSprites(): Promise<void> {
    // Load tower sprites for each faction color (paths relative to src/dist/)
    const towerPaths = [
      { key: 'cyan', path: '../../addons/MiniWorldSprites/Buildings/Cyan/CyanTower.png' },
      { key: 'lime', path: '../../addons/MiniWorldSprites/Buildings/Lime/LimeTower.png' },
      { key: 'purple', path: '../../addons/MiniWorldSprites/Buildings/Purple/PurpleTower.png' },
      { key: 'red', path: '../../addons/MiniWorldSprites/Buildings/Red/RedTower.png' },
      { key: 'wood', path: '../../addons/MiniWorldSprites/Buildings/Wood/Tower.png' },
      { key: 'wood2', path: '../../addons/MiniWorldSprites/Buildings/Wood/Tower2.png' }
    ];
    
    for (const { key, path } of towerPaths) {
      const img = new Image();
      img.onload = () => {
        this.towerSprites.set(key, img);
      };
      img.onerror = () => {
        console.warn(`Failed to load tower sprite: ${path}`);
      };
      img.src = path;
    }
  }
  
  private getTowerSprite(owner: FactionId, level: number): HTMLImageElement | null {
    // Map faction to sprite key
    let key: string;
    switch (owner as number) {
      case 1: key = 'cyan'; break;
      case 2: key = 'red'; break;
      case 3: key = 'lime'; break;
      case 4: key = 'purple'; break;
      default: key = 'wood'; break;
    }
    
    // Use wood2 for higher level towers
    if (level >= 4 && key === 'wood') {
      return this.towerSprites.get('wood2') || this.towerSprites.get(key) || null;
    }
    
    return this.towerSprites.get(key) || null;
  }
  
  // === TOWER BUILD MENU ===
  
  toggleTowerMenu(heroIsland: Island | null, playerGold: number): void {
    if (this.menuState.isOpen) {
      this.closeTowerMenu();
    } else {
      this.openTowerMenu(heroIsland, playerGold);
    }
  }
  
  openTowerMenu(heroIsland: Island | null, playerGold: number): void {
    this.menuState.isOpen = true;
    this.menuState.currentIsland = heroIsland;
    this.menuState.canBuild = this.canBuildOnIsland(heroIsland);
    this.menuState.selectedTower = null;
    this.menuState.placementValid = false;
    this.menuState.playerGold = playerGold;
  }
  
  closeTowerMenu(): void {
    this.menuState.isOpen = false;
    this.menuState.selectedTower = null;
    this.menuState.placementValid = false;
    this.menuState.placementPosition = null;
  }
  
  canBuildOnIsland(island: Island | null): boolean {
    if (!island) return false;
    if (island.owner !== 1) return false;
    return true;
  }
  
  selectTowerType(type: TowerType): void {
    if (!this.menuState.isOpen) return;
    
    const def = TOWER_DEFINITIONS[type];
    if (this.menuState.playerGold < def.baseCost) {
      console.log(`Not enough gold for ${type} tower. Need ${def.baseCost}, have ${this.menuState.playerGold}`);
      return;
    }
    
    this.menuState.selectedTower = type;
    this.menuState.isOpen = false; // Close menu, enter placement mode
  }
  
  updatePlacementPosition(
    worldX: number, 
    worldY: number, 
    checkBuildable: (x: number, y: number) => boolean
  ): void {
    if (!this.menuState.selectedTower) return;
    
    this.menuState.placementPosition = { x: worldX, y: worldY };
    
    // Check if position is valid
    const size = 30; // Tower footprint
    this.menuState.placementValid = this.isValidPlacement(worldX, worldY, size, checkBuildable);
  }
  
  private isValidPlacement(
    x: number,
    y: number,
    size: number,
    checkBuildable: (x: number, y: number) => boolean
  ): boolean {
    // Check corners and center
    const points = [
      { x, y },
      { x: x - size, y: y - size },
      { x: x + size, y: y - size },
      { x: x - size, y: y + size },
      { x: x + size, y: y + size }
    ];
    
    for (const p of points) {
      if (!checkBuildable(p.x, p.y)) return false;
    }
    
    // Check no collision with other towers
    for (const tower of this.towers.values()) {
      const dist = Math.hypot(tower.position.x - x, tower.position.y - y);
      if (dist < size * 2 + 10) return false;
    }
    
    return true;
  }
  
  // === TOWER PLACEMENT ===
  
  placeTower(owner: FactionId): Tower | null {
    if (!this.menuState.selectedTower) return null;
    if (!this.menuState.placementValid) return null;
    if (!this.menuState.placementPosition) return null;
    
    const type = this.menuState.selectedTower;
    const pos = this.menuState.placementPosition;
    const stats = getTowerStats(type, 1);
    
    const tower: Tower = {
      id: generateId(),
      type,
      position: { ...pos },
      owner,
      level: 1,
      health: stats.health,
      maxHealth: stats.health,
      isConstructing: true,
      constructionProgress: 0,
      targetId: null,
      attackCooldown: 0,
      kills: 0,
      totalDamageDealt: 0
    };
    
    this.towers.set(tower.id, tower);
    
    // Reset menu state
    this.menuState.selectedTower = null;
    this.menuState.placementValid = false;
    this.menuState.placementPosition = null;
    
    return tower;
  }
  
  // === TOWER UPGRADES ===
  
  canUpgradeTower(towerId: string, playerGold: number): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) return false;
    if (tower.isConstructing) return false;
    
    const upgradeCost = getTowerUpgradeCost(tower.type, tower.level);
    if (upgradeCost === null) return false; // Max level
    
    return playerGold >= upgradeCost;
  }
  
  upgradeTower(towerId: string): number | null {
    const tower = this.towers.get(towerId);
    if (!tower) return null;
    if (tower.isConstructing) return null;
    
    const def = TOWER_DEFINITIONS[tower.type];
    if (tower.level >= def.maxLevel) return null;
    
    const upgradeCost = getTowerUpgradeCost(tower.type, tower.level);
    if (upgradeCost === null) return null;
    
    // Upgrade the tower
    tower.level++;
    const newStats = getTowerStats(tower.type, tower.level);
    
    // Increase max health and heal proportionally
    const healthRatio = tower.health / tower.maxHealth;
    tower.maxHealth = newStats.health;
    tower.health = Math.floor(tower.maxHealth * healthRatio);
    
    return upgradeCost;
  }
  
  // === TOWER UPDATES ===
  
  update(
    deltaTime: number,
    getEnemiesInRange: (pos: Position, range: number, faction: FactionId) => { id: string; position: Position; health: number }[]
  ): void {
    // Update construction
    for (const tower of this.towers.values()) {
      if (tower.isConstructing) {
        this.updateConstruction(tower, deltaTime);
        continue;
      }
      
      // Update attack cooldown
      tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime);
      
      // Find and attack targets
      if (tower.attackCooldown <= 0) {
        this.updateTargeting(tower, getEnemiesInRange);
      }
    }
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
  }
  
  private updateConstruction(tower: Tower, deltaTime: number): void {
    const buildTime = 8; // 8 seconds to construct
    const progressPerSecond = 100 / buildTime;
    
    tower.constructionProgress += progressPerSecond * deltaTime;
    
    if (tower.constructionProgress >= 100) {
      tower.constructionProgress = 100;
      tower.isConstructing = false;
    }
  }
  
  private updateTargeting(
    tower: Tower,
    getEnemiesInRange: (pos: Position, range: number, faction: FactionId) => { id: string; position: Position; health: number }[]
  ): void {
    const stats = getTowerStats(tower.type, tower.level);
    const def = TOWER_DEFINITIONS[tower.type];
    
    // Get enemies in range
    const enemies = getEnemiesInRange(tower.position, stats.range, tower.owner);
    
    if (enemies.length === 0) {
      tower.targetId = null;
      return;
    }
    
    // Prioritize current target if still in range
    let target = enemies.find(e => e.id === tower.targetId);
    
    if (!target) {
      // Target selection priority: lowest health
      target = enemies.reduce((a, b) => a.health < b.health ? a : b);
      tower.targetId = target.id;
    }
    
    // Fire at target
    this.fireProjectile(tower, target.position, target.id, stats, def);
    tower.attackCooldown = stats.attackSpeed;
  }
  
  private fireProjectile(
    tower: Tower,
    targetPos: Position,
    targetId: string,
    stats: ReturnType<typeof getTowerStats>,
    def: TowerDefinition
  ): void {
    const projectile: TowerProjectile = {
      id: generateId(),
      towerId: tower.id,
      type: def.projectileType,
      position: { ...tower.position },
      targetPosition: { ...targetPos },
      targetId,
      damage: stats.damage,
      speed: this.getProjectileSpeed(def.projectileType),
      splashRadius: def.splashRadius,
      slowEffect: def.slowEffect ? def.slowEffect + (tower.level - 1) * 0.05 : undefined, // +5% slow per level
      burnDamage: def.burnDamage ? def.burnDamage + (tower.level - 1) * 2 : undefined, // +2 DPS per level
      lifetime: 3 // Max 3 seconds
    };
    
    this.projectiles.push(projectile);
  }
  
  private getProjectileSpeed(type: TowerProjectile['type']): number {
    switch (type) {
      case 'arrow': return 400;
      case 'cannonball': return 250;
      case 'magic_bolt': return 350;
      case 'frost_shard': return 300;
      case 'fireball': return 280;
      default: return 300;
    }
  }
  
  private updateProjectiles(deltaTime: number): void {
    const toRemove: number[] = [];
    
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      
      // Move towards target
      const dx = proj.targetPosition.x - proj.position.x;
      const dy = proj.targetPosition.y - proj.position.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 10) {
        // Hit target
        this.onProjectileHit(proj);
        toRemove.push(i);
        continue;
      }
      
      // Move projectile
      const moveSpeed = proj.speed * deltaTime;
      proj.position.x += (dx / dist) * moveSpeed;
      proj.position.y += (dy / dist) * moveSpeed;
      
      // Timeout
      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        toRemove.push(i);
      }
    }
    
    // Remove hit/expired projectiles
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }
  
  private onProjectileHit(proj: TowerProjectile): void {
    const tower = this.towers.get(proj.towerId);
    
    if (proj.targetId && this.onDamageDealt) {
      this.onDamageDealt(proj.targetId, proj.damage, proj.towerId, false);
      
      if (tower) {
        tower.totalDamageDealt += proj.damage;
      }
    }
    
    // TODO: Handle splash damage
    // TODO: Handle slow effect
    // TODO: Handle burn damage over time
  }
  
  // === TOWER DAMAGE ===
  
  damageTower(towerId: string, damage: number): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) return false;
    
    tower.health -= damage;
    
    if (tower.health <= 0) {
      this.destroyTower(towerId);
      return true;
    }
    
    return false;
  }
  
  private destroyTower(towerId: string): void {
    this.towers.delete(towerId);
    if (this.selectedTowerId === towerId) {
      this.selectedTowerId = null;
    }
  }
  
  // === SELECTION ===
  
  selectTower(towerId: string | null): void {
    this.selectedTowerId = towerId;
  }
  
  getSelectedTower(): Tower | null {
    if (!this.selectedTowerId) return null;
    return this.towers.get(this.selectedTowerId) || null;
  }
  
  getTowerAt(worldX: number, worldY: number): Tower | null {
    for (const tower of this.towers.values()) {
      const dist = Math.hypot(tower.position.x - worldX, tower.position.y - worldY);
      if (dist < 35) { // Click radius
        return tower;
      }
    }
    return null;
  }
  
  // === GETTERS ===
  
  getTower(id: string): Tower | undefined {
    return this.towers.get(id);
  }
  
  getAllTowers(): Tower[] {
    return Array.from(this.towers.values());
  }
  
  getTowersByOwner(owner: FactionId): Tower[] {
    return Array.from(this.towers.values()).filter(t => t.owner === owner);
  }
  
  getProjectiles(): TowerProjectile[] {
    return this.projectiles;
  }
  
  getMenuState(): TowerMenuState {
    return this.menuState;
  }
  
  // === RENDERING ===
  
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    gameTime: number
  ): void {
    // Render all towers
    for (const tower of this.towers.values()) {
      this.renderTower(ctx, tower, cameraX, cameraY, gameTime);
    }
    
    // Render projectiles
    this.renderProjectiles(ctx, cameraX, cameraY);
    
    // Render selection if any
    if (this.selectedTowerId) {
      const tower = this.towers.get(this.selectedTowerId);
      if (tower) {
        this.renderTowerSelection(ctx, tower, cameraX, cameraY);
      }
    }
  }
  
  private renderTower(
    ctx: CanvasRenderingContext2D,
    tower: Tower,
    cameraX: number,
    cameraY: number,
    gameTime: number
  ): void {
    const x = tower.position.x - cameraX;
    const y = tower.position.y - cameraY;
    const stats = getTowerStats(tower.type, tower.level);
    const def = TOWER_DEFINITIONS[tower.type];
    
    ctx.save();
    
    // Construction transparency
    if (tower.isConstructing) {
      ctx.globalAlpha = 0.5 + Math.sin(gameTime * 5) * 0.2;
    }
    
    // Try to use sprite
    const sprite = this.getTowerSprite(tower.owner, tower.level);
    
    if (sprite && sprite.complete) {
      // Draw sprite
      const scale = (60 + tower.level * 5) / Math.max(sprite.width, sprite.height);
      const drawW = sprite.width * scale;
      const drawH = sprite.height * scale;
      ctx.drawImage(sprite, x - drawW / 2, y - drawH + 20, drawW, drawH);
    } else {
      // Fallback rendering
      this.renderTowerFallback(ctx, tower, x, y, def);
    }
    
    ctx.restore();
    
    // Level indicator
    if (!tower.isConstructing && tower.level > 1) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★${tower.level}`, x, y - 45);
    }
    
    // Construction progress
    if (tower.isConstructing) {
      const barWidth = 50;
      const barHeight = 6;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth, barHeight);
      
      ctx.fillStyle = '#ff0';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth * (tower.constructionProgress / 100), barHeight);
    }
    
    // Health bar (if damaged)
    if (!tower.isConstructing && tower.health < tower.maxHealth) {
      const barWidth = 50;
      const barHeight = 5;
      const healthPercent = tower.health / tower.maxHealth;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : healthPercent > 0.25 ? '#aa4' : '#a44';
      ctx.fillRect(x - barWidth / 2, y + 25, barWidth * healthPercent, barHeight);
    }
    
    // Range indicator (when selected)
    if (this.selectedTowerId === tower.id) {
      ctx.beginPath();
      ctx.arc(x, y, stats.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  private renderTowerFallback(
    ctx: CanvasRenderingContext2D,
    tower: Tower,
    x: number,
    y: number,
    _def: TowerDefinition
  ): void {
    const factionColor = this.getFactionColor(tower.owner);
    const size = 25 + tower.level * 3;
    
    // Base
    ctx.fillStyle = '#555';
    ctx.fillRect(x - size, y - size * 0.3, size * 2, size * 0.8);
    
    // Tower body with type-specific color
    const typeColors: Record<TowerType, string> = {
      arrow: '#777',
      cannon: '#555',
      magic: '#7755aa',
      frost: '#55aadd',
      fire: '#dd6633'
    };
    
    ctx.fillStyle = typeColors[tower.type] || '#777';
    ctx.fillRect(x - size * 0.6, y - size * 1.2, size * 1.2, size * 1.5);
    
    // Battlements
    ctx.fillStyle = '#666';
    for (let i = 0; i < 3; i++) {
      const bx = x - size * 0.5 + (i * size * 0.5);
      ctx.fillRect(bx, y - size * 1.4, size * 0.3, size * 0.3);
    }
    
    // Flag with faction color
    ctx.fillStyle = factionColor;
    ctx.fillRect(x, y - size * 2, size * 0.6, size * 0.4);
    
    // Flagpole
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x - 2, y - size * 2, 4, size * 0.8);
    
    // Type icon
    const icons: Record<TowerType, string> = {
      arrow: '🏹',
      cannon: '💣',
      magic: '✨',
      frost: '❄️',
      fire: '🔥'
    };
    
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icons[tower.type] || '🗼', x, y - size * 0.5);
  }
  
  private renderTowerSelection(
    ctx: CanvasRenderingContext2D,
    tower: Tower,
    cameraX: number,
    cameraY: number
  ): void {
    const x = tower.position.x - cameraX;
    const y = tower.position.y - cameraY;
    
    // Selection circle
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  private renderProjectiles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    for (const proj of this.projectiles) {
      const x = proj.position.x - cameraX;
      const y = proj.position.y - cameraY;
      
      // Direction for rotation
      const dx = proj.targetPosition.x - proj.position.x;
      const dy = proj.targetPosition.y - proj.position.y;
      const angle = Math.atan2(dy, dx);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      switch (proj.type) {
        case 'arrow':
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(-8, -1, 16, 2);
          ctx.fillStyle = '#555';
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(12, -3);
          ctx.lineTo(12, 3);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'cannonball':
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'magic_bolt':
          ctx.fillStyle = '#aa55ff';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dd88ff';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'frost_shard':
          ctx.fillStyle = '#88ddff';
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-4, -4);
          ctx.lineTo(-4, 4);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'fireball':
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
  }
  
  private getFactionColor(faction: FactionId): string {
    switch (faction as number) {
      case 1: return '#00aaff';
      case 2: return '#ff4444';
      case 3: return '#44ff88';
      case 4: return '#aa44ff';
      default: return '#888888';
    }
  }
  
  // === TOWER MENU UI ===
  
  renderTowerMenu(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.menuState.isOpen) return;
    
    const menuWidth = 320;
    const menuHeight = 300;
    const menuX = screenWidth / 2 - menuWidth / 2;
    const menuY = screenHeight / 2 - menuHeight / 2;
    
    // Background
    ctx.fillStyle = 'rgba(20, 26, 43, 0.95)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.strokeStyle = this.menuState.canBuild ? '#6ee7b7' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🗼 Build Tower (T)', menuX + menuWidth / 2, menuY + 30);
    
    // Gold display
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px sans-serif';
    ctx.fillText(`💰 ${this.menuState.playerGold} Gold`, menuX + menuWidth / 2, menuY + 50);
    
    if (!this.menuState.canBuild) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px sans-serif';
      ctx.fillText('Must own island to build!', menuX + menuWidth / 2, menuY + 80);
      ctx.fillText('Press T to close', menuX + menuWidth / 2, menuY + 100);
      return;
    }
    
    // Tower options
    const towers: { type: TowerType; icon: string; hotkey: string }[] = [
      { type: 'arrow', icon: '🏹', hotkey: '1' },
      { type: 'cannon', icon: '💣', hotkey: '2' },
      { type: 'magic', icon: '✨', hotkey: '3' },
      { type: 'frost', icon: '❄️', hotkey: '4' },
      { type: 'fire', icon: '🔥', hotkey: '5' }
    ];
    
    let y = menuY + 75;
    for (const t of towers) {
      const def = TOWER_DEFINITIONS[t.type];
      const canAfford = this.menuState.playerGold >= def.baseCost;
      const selected = this.menuState.selectedTower === t.type;
      
      // Button background
      ctx.fillStyle = selected ? 'rgba(110, 231, 183, 0.3)' :
                      canAfford ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(menuX + 10, y, menuWidth - 20, 38);
      
      if (selected) {
        ctx.strokeStyle = '#6ee7b7';
        ctx.strokeRect(menuX + 10, y, menuWidth - 20, 38);
      }
      
      // Icon and name
      ctx.fillStyle = canAfford ? '#fff' : '#666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${t.icon} [${t.hotkey}] ${def.name}`, menuX + 20, y + 17);
      
      // Description
      ctx.fillStyle = canAfford ? '#aaa' : '#555';
      ctx.font = '10px sans-serif';
      ctx.fillText(def.description.substring(0, 40) + '...', menuX + 20, y + 32);
      
      // Cost
      ctx.fillStyle = canAfford ? '#ffd700' : '#664400';
      ctx.textAlign = 'right';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${def.baseCost}g`, menuX + menuWidth - 20, y + 17);
      
      y += 42;
    }
    
    // Instructions
    ctx.fillStyle = '#a5b4d0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select tower then click to place', menuX + menuWidth / 2, menuY + menuHeight - 20);
  }
  
  renderPlacementPreview(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    if (!this.menuState.selectedTower) return;
    if (!this.menuState.placementPosition) return;
    
    const pos = this.menuState.placementPosition;
    const x = pos.x - cameraX;
    const y = pos.y - cameraY;
    const def = TOWER_DEFINITIONS[this.menuState.selectedTower];
    const stats = getTowerStats(this.menuState.selectedTower, 1);
    
    // Placement circle
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.strokeStyle = this.menuState.placementValid ? '#6ee7b7' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Tower preview
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.menuState.placementValid ? '#6ee7b7' : '#ef4444';
    ctx.fillRect(x - 20, y - 30, 40, 50);
    ctx.globalAlpha = 1;
    
    // Tower icon
    const icons: Record<TowerType, string> = {
      arrow: '🏹',
      cannon: '💣',
      magic: '✨',
      frost: '❄️',
      fire: '🔥'
    };
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icons[this.menuState.selectedTower], x, y);
    
    // Range circle
    ctx.beginPath();
    ctx.arc(x, y, stats.range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Tower name and cost
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(def.name, x, y + 50);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`${def.baseCost}g`, x, y + 65);
  }
}
