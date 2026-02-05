// ============================================
// TOWER UI
// Panel for displaying tower information and upgrades
// ============================================

import type { Tower, TowerType } from '../types/world.ts';
import { TOWER_DEFINITIONS, getTowerStats, getTowerUpgradeCost } from '../types/world.ts';

export interface TowerUIState {
  visible: boolean;
  tower: Tower | null;
  playerGold: number;
  canUpgrade: boolean;
  upgradeHovered: boolean;
  sellHovered: boolean;
}

export class TowerUI {
  private state: TowerUIState = {
    visible: false,
    tower: null,
    playerGold: 0,
    canUpgrade: false,
    upgradeHovered: false,
    sellHovered: false
  };
  
  private panelX: number = 0;
  private panelY: number = 0;
  private panelWidth: number = 280;
  private panelHeight: number = 220;
  
  // UI bounds for click detection
  private upgradeBtn = { x: 0, y: 0, w: 0, h: 0 };
  private sellBtn = { x: 0, y: 0, w: 0, h: 0 };
  
  // Callbacks
  public onUpgrade: ((towerId: string) => void) | null = null;
  public onSell: ((towerId: string) => void) | null = null;
  
  constructor() {}
  
  show(tower: Tower, playerGold: number): void {
    this.state.visible = true;
    this.state.tower = tower;
    this.state.playerGold = playerGold;
    
    const upgradeCost = getTowerUpgradeCost(tower.type, tower.level);
    this.state.canUpgrade = upgradeCost !== null && playerGold >= upgradeCost;
  }
  
  hide(): void {
    this.state.visible = false;
    this.state.tower = null;
    this.state.upgradeHovered = false;
    this.state.sellHovered = false;
  }
  
  updatePlayerGold(gold: number): void {
    this.state.playerGold = gold;
    if (this.state.tower) {
      const upgradeCost = getTowerUpgradeCost(this.state.tower.type, this.state.tower.level);
      this.state.canUpgrade = upgradeCost !== null && gold >= upgradeCost;
    }
  }
  
  isVisible(): boolean {
    return this.state.visible;
  }
  
  getTower(): Tower | null {
    return this.state.tower;
  }
  
  // Handle mouse movement for button hover states
  handleMouseMove(mouseX: number, mouseY: number): void {
    if (!this.state.visible) return;
    
    this.state.upgradeHovered = this.isPointInRect(mouseX, mouseY, this.upgradeBtn);
    this.state.sellHovered = this.isPointInRect(mouseX, mouseY, this.sellBtn);
  }
  
  // Handle click - returns true if click was consumed
  handleClick(mouseX: number, mouseY: number): boolean {
    if (!this.state.visible || !this.state.tower) return false;
    
    // Check upgrade button
    if (this.isPointInRect(mouseX, mouseY, this.upgradeBtn)) {
      if (this.state.canUpgrade && this.onUpgrade) {
        this.onUpgrade(this.state.tower.id);
        return true;
      }
    }
    
    // Check sell button
    if (this.isPointInRect(mouseX, mouseY, this.sellBtn)) {
      if (this.onSell) {
        this.onSell(this.state.tower.id);
        return true;
      }
    }
    
    // Check if click is within panel (consume but don't act)
    if (this.isPointInRect(mouseX, mouseY, { 
      x: this.panelX, 
      y: this.panelY, 
      w: this.panelWidth, 
      h: this.panelHeight 
    })) {
      return true;
    }
    
    return false;
  }
  
  private isPointInRect(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }
  
  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.state.visible || !this.state.tower) return;
    
    const tower = this.state.tower;
    const def = TOWER_DEFINITIONS[tower.type];
    const currentStats = getTowerStats(tower.type, tower.level);
    const nextStats = tower.level < def.maxLevel ? getTowerStats(tower.type, tower.level + 1) : null;
    const upgradeCost = getTowerUpgradeCost(tower.type, tower.level);
    
    // Position panel (bottom right, above minimap)
    this.panelX = screenWidth - this.panelWidth - 230;
    this.panelY = screenHeight - this.panelHeight - 20;
    
    const x = this.panelX;
    const y = this.panelY;
    const w = this.panelWidth;
    const h = this.panelHeight;
    const padding = 12;
    
    // Background
    ctx.fillStyle = 'rgba(20, 26, 43, 0.95)';
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    
    // Border based on tower type
    const typeColors: Record<TowerType, string> = {
      arrow: '#88aa88',
      cannon: '#aa8866',
      magic: '#aa88dd',
      frost: '#88ccff',
      fire: '#ffaa66'
    };
    ctx.strokeStyle = typeColors[tower.type] || '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Header with tower icon and name
    const icons: Record<TowerType, string> = {
      arrow: '🏹',
      cannon: '💣',
      magic: '✨',
      frost: '❄️',
      fire: '🔥'
    };
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${icons[tower.type]} ${def.name}`, x + padding, y + padding + 14);
    
    // Level stars
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px sans-serif';
    const stars = '★'.repeat(tower.level) + '☆'.repeat(def.maxLevel - tower.level);
    ctx.textAlign = 'right';
    ctx.fillText(stars, x + w - padding, y + padding + 14);
    
    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + padding, y + padding + 25);
    ctx.lineTo(x + w - padding, y + padding + 25);
    ctx.stroke();
    
    // Stats section
    let statY = y + padding + 45;
    
    // Health bar
    const healthPercent = tower.health / tower.maxHealth;
    this.drawStatBar(ctx, x + padding, statY, w - padding * 2, 14, 
      healthPercent, '#ff4444', `HP: ${Math.floor(tower.health)}/${tower.maxHealth}`);
    statY += 22;
    
    // Stats grid
    const stats = [
      { label: 'Damage', value: currentStats.damage, next: nextStats?.damage, color: '#ffaa44' },
      { label: 'Range', value: currentStats.range, next: nextStats?.range, color: '#44aaff' },
      { label: 'Attack Speed', value: currentStats.attackSpeed.toFixed(1) + 's', next: nextStats ? nextStats.attackSpeed.toFixed(1) + 's' : null, color: '#44ff88' }
    ];
    
    ctx.font = '12px sans-serif';
    for (const stat of stats) {
      ctx.fillStyle = '#a5b4d0';
      ctx.textAlign = 'left';
      ctx.fillText(stat.label + ':', x + padding, statY);
      
      ctx.fillStyle = stat.color;
      ctx.textAlign = 'right';
      let valueText = String(stat.value);
      if (stat.next !== null && stat.next !== undefined) {
        valueText += ` → ${stat.next}`;
      }
      ctx.fillText(valueText, x + w - padding, statY);
      
      statY += 18;
    }
    
    // Special effects
    if (def.splashRadius) {
      ctx.fillStyle = '#a5b4d0';
      ctx.textAlign = 'left';
      ctx.fillText('Splash Radius:', x + padding, statY);
      ctx.fillStyle = '#ff8866';
      ctx.textAlign = 'right';
      ctx.fillText(`${def.splashRadius}`, x + w - padding, statY);
      statY += 18;
    }
    
    if (def.slowEffect) {
      const slowPercent = Math.floor((def.slowEffect + (tower.level - 1) * 0.05) * 100);
      ctx.fillStyle = '#a5b4d0';
      ctx.textAlign = 'left';
      ctx.fillText('Slow Effect:', x + padding, statY);
      ctx.fillStyle = '#88ddff';
      ctx.textAlign = 'right';
      ctx.fillText(`${slowPercent}%`, x + w - padding, statY);
      statY += 18;
    }
    
    if (def.burnDamage) {
      const burnDps = def.burnDamage + (tower.level - 1) * 2;
      ctx.fillStyle = '#a5b4d0';
      ctx.textAlign = 'left';
      ctx.fillText('Burn DPS:', x + padding, statY);
      ctx.fillStyle = '#ff6644';
      ctx.textAlign = 'right';
      ctx.fillText(`${burnDps}`, x + w - padding, statY);
      statY += 18;
    }
    
    // Performance stats
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Kills: ${tower.kills} | Damage: ${Math.floor(tower.totalDamageDealt)}`, x + padding, statY + 5);
    
    // Buttons
    const btnY = y + h - 40;
    const btnWidth = (w - padding * 3) / 2;
    const btnHeight = 28;
    
    // Upgrade button
    this.upgradeBtn = { x: x + padding, y: btnY, w: btnWidth, h: btnHeight };
    
    if (upgradeCost !== null) {
      const canAfford = this.state.playerGold >= upgradeCost;
      ctx.fillStyle = this.state.upgradeHovered && canAfford ? 
        'rgba(110, 231, 183, 0.4)' : 
        canAfford ? 'rgba(110, 231, 183, 0.2)' : 'rgba(100, 100, 100, 0.2)';
      this.roundRect(ctx, this.upgradeBtn.x, this.upgradeBtn.y, btnWidth, btnHeight, 4);
      ctx.fill();
      
      ctx.strokeStyle = canAfford ? '#6ee7b7' : '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = canAfford ? '#fff' : '#666';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⬆ Upgrade (${upgradeCost}g)`, this.upgradeBtn.x + btnWidth / 2, this.upgradeBtn.y + 18);
    } else {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      this.roundRect(ctx, this.upgradeBtn.x, this.upgradeBtn.y, btnWidth, btnHeight, 4);
      ctx.fill();
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ MAX LEVEL', this.upgradeBtn.x + btnWidth / 2, this.upgradeBtn.y + 18);
    }
    
    // Sell button
    this.sellBtn = { x: x + padding * 2 + btnWidth, y: btnY, w: btnWidth, h: btnHeight };
    const sellValue = this.getSellValue(tower);
    
    ctx.fillStyle = this.state.sellHovered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)';
    this.roundRect(ctx, this.sellBtn.x, this.sellBtn.y, btnWidth, btnHeight, 4);
    ctx.fill();
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💰 Sell (${sellValue}g)`, this.sellBtn.x + btnWidth / 2, this.sellBtn.y + 18);
  }
  
  private getSellValue(tower: Tower): number {
    const def = TOWER_DEFINITIONS[tower.type];
    let totalInvested = def.baseCost;
    
    // Add upgrade costs
    for (let i = 1; i < tower.level; i++) {
      totalInvested += def.levels[i].cost;
    }
    
    // Return 60% of investment
    return Math.floor(totalInvested * 0.6);
  }
  
  private drawStatBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    percent: number,
    color: string,
    label: string
  ): void {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    
    // Fill
    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, w * Math.max(0, Math.min(1, percent)), h, 3);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 3);
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h - 3);
  }
  
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
