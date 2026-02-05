// ============================================
// UI MANAGER - Grudge Islands
// Comprehensive UI system with tooltips, panels, pop-outs
// ============================================

import { DerivedStats, Attributes, Entity, Hero, Projectile } from '../types';
import { calculateDerivedStats } from '../data/attributes';
import { TINY_SWORDS_UNITS, TinySwordsUnitType, getTinySwordsUnitPath, gameToTinySwordsFaction, TinySwordsFaction } from '../data/miniWorldSprites';
import { Boat, Building, Island, Camp } from '../types/world';

// === UI CONFIGURATION ===

export interface UIConfig {
  tooltipDelay: number;      // ms before showing tooltip
  tooltipFadeTime: number;   // ms for fade animation
  panelAnimationTime: number;
  fontFamily: string;
  fontSize: {
    small: number;
    medium: number;
    large: number;
    title: number;
  };
  colors: {
    background: string;
    backgroundDark: string;
    border: string;
    text: string;
    textSecondary: string;
    health: string;
    mana: string;
    stamina: string;
    damage: string;
    defense: string;
    accent: string;
    positive: string;
    negative: string;
  };
}

const DEFAULT_CONFIG: UIConfig = {
  tooltipDelay: 300,
  tooltipFadeTime: 150,
  panelAnimationTime: 200,
  fontFamily: 'Arial, sans-serif',
  fontSize: {
    small: 10,
    medium: 12,
    large: 14,
    title: 16
  },
  colors: {
    background: 'rgba(20, 20, 30, 0.95)',
    backgroundDark: 'rgba(10, 10, 15, 0.98)',
    border: '#4a4a6a',
    text: '#ffffff',
    textSecondary: '#aaaacc',
    health: '#ff4444',
    mana: '#4488ff',
    stamina: '#44dd44',
    damage: '#ff8844',
    defense: '#88aaff',
    accent: '#ffcc44',
    positive: '#44ff88',
    negative: '#ff4466'
  }
};

// === STAT BAR COMPONENT ===

interface StatBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  maxValue: number;
  color: string;
  backgroundColor?: string;
  showText?: boolean;
  label?: string;
}

function drawStatBar(ctx: CanvasRenderingContext2D, config: StatBarConfig): void {
  const { x, y, width, height, value, maxValue, color, backgroundColor = 'rgba(0,0,0,0.5)', showText = true, label } = config;
  const ratio = Math.min(1, Math.max(0, value / maxValue));
  
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x, y, width, height);
  
  // Fill
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * ratio, height);
  
  // Border
  ctx.strokeStyle = DEFAULT_CONFIG.colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Text
  if (showText) {
    ctx.fillStyle = DEFAULT_CONFIG.colors.text;
    ctx.font = `${DEFAULT_CONFIG.fontSize.small}px ${DEFAULT_CONFIG.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = label ? `${label}: ${Math.floor(value)}/${Math.floor(maxValue)}` : `${Math.floor(value)}/${Math.floor(maxValue)}`;
    ctx.fillText(text, x + width / 2, y + height / 2);
  }
}

// === TOOLTIP DATA STRUCTURES ===

export interface TooltipData {
  type: 'unit' | 'building' | 'hero' | 'boat' | 'island' | 'camp' | 'stat' | 'skill' | 'item';
  title: string;
  subtitle?: string;
  description?: string;
  stats?: { label: string; value: string | number; color?: string }[];
  icon?: string;
  iconRect?: { x: number; y: number; w: number; h: number };
}

// === UI MANAGER CLASS ===

export class UIManager {
  private ctx: CanvasRenderingContext2D;
  private config: UIConfig;
  private canvas: HTMLCanvasElement;
  
  // Tooltip state
  private tooltipVisible: boolean = false;
  private tooltipData: TooltipData | null = null;
  private tooltipPosition: { x: number; y: number } = { x: 0, y: 0 };
  private tooltipTimer: number | null = null;
  private tooltipOpacity: number = 0;
  
  // Selection panel
  private selectedEntities: Entity[] = [];
  private selectedBuilding: Building | null = null;
  private selectedBoat: Boat | null = null;
  private selectedHero: Hero | null = null;
  
  // Cached sprite images
  private spriteCache: Map<string, HTMLImageElement> = new Map();
  
  // Panel visibility
  private panels: {
    selection: boolean;
    miniStats: boolean;
    resources: boolean;
    buildMenu: boolean;
  } = {
    selection: true,
    miniStats: true,
    resources: true,
    buildMenu: false
  };
  
  constructor(canvas: HTMLCanvasElement, config: Partial<UIConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // === TOOLTIP METHODS ===
  
  showTooltip(data: TooltipData, x: number, y: number): void {
    this.tooltipData = data;
    this.tooltipPosition = { x, y };
    
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
    }
    
    this.tooltipTimer = window.setTimeout(() => {
      this.tooltipVisible = true;
      this.tooltipOpacity = 1;
    }, this.config.tooltipDelay);
  }
  
  hideTooltip(): void {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
    this.tooltipVisible = false;
    this.tooltipOpacity = 0;
    this.tooltipData = null;
  }
  
  private renderTooltip(): void {
    if (!this.tooltipVisible || !this.tooltipData) return;
    
    const data = this.tooltipData;
    const padding = 10;
    const lineHeight = 18;
    
    // Calculate tooltip size
    this.ctx.font = `bold ${this.config.fontSize.large}px ${this.config.fontFamily}`;
    let maxWidth = this.ctx.measureText(data.title).width;
    let height = lineHeight;
    
    if (data.subtitle) {
      this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
      maxWidth = Math.max(maxWidth, this.ctx.measureText(data.subtitle).width);
      height += lineHeight;
    }
    
    if (data.description) {
      this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
      const lines = this.wrapText(data.description, 200);
      maxWidth = Math.max(maxWidth, 200);
      height += lines.length * (lineHeight - 4);
    }
    
    if (data.stats && data.stats.length > 0) {
      height += 8; // Separator space
      data.stats.forEach(stat => {
        this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
        maxWidth = Math.max(maxWidth, this.ctx.measureText(`${stat.label}: ${stat.value}`).width);
        height += lineHeight - 2;
      });
    }
    
    const width = maxWidth + padding * 2 + (data.icon ? 48 : 0);
    height += padding * 2;
    
    // Position tooltip (keep on screen)
    let x = this.tooltipPosition.x + 15;
    let y = this.tooltipPosition.y + 15;
    if (x + width > this.canvas.width) x = this.tooltipPosition.x - width - 15;
    if (y + height > this.canvas.height) y = this.canvas.height - height - 5;
    
    // Draw background
    this.ctx.globalAlpha = this.tooltipOpacity;
    this.ctx.fillStyle = this.config.colors.background;
    this.ctx.beginPath();
    this.roundRect(x, y, width, height, 6);
    this.ctx.fill();
    
    // Draw border
    this.ctx.strokeStyle = this.config.colors.border;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw content
    let textX = x + padding + (data.icon ? 44 : 0);
    let textY = y + padding + 12;
    
    // Title
    this.ctx.fillStyle = this.config.colors.accent;
    this.ctx.font = `bold ${this.config.fontSize.large}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(data.title, textX, textY);
    textY += lineHeight;
    
    // Subtitle
    if (data.subtitle) {
      this.ctx.fillStyle = this.config.colors.textSecondary;
      this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
      this.ctx.fillText(data.subtitle, textX, textY);
      textY += lineHeight;
    }
    
    // Description
    if (data.description) {
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
      const lines = this.wrapText(data.description, 200);
      lines.forEach(line => {
        this.ctx.fillText(line, textX, textY);
        textY += lineHeight - 4;
      });
    }
    
    // Stats
    if (data.stats && data.stats.length > 0) {
      textY += 4;
      data.stats.forEach(stat => {
        this.ctx.fillStyle = stat.color || this.config.colors.textSecondary;
        this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
        this.ctx.fillText(`${stat.label}: `, textX, textY);
        
        const labelWidth = this.ctx.measureText(`${stat.label}: `).width;
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.fillText(`${stat.value}`, textX + labelWidth, textY);
        textY += lineHeight - 2;
      });
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  // === SELECTION PANEL ===
  
  setSelection(entities: Entity[]): void {
    this.selectedEntities = entities;
    this.selectedBuilding = null;
    this.selectedBoat = null;
    this.selectedHero = null;
  }
  
  setSelectedBuilding(building: Building | null): void {
    this.selectedBuilding = building;
    this.selectedEntities = [];
  }
  
  setSelectedBoat(boat: Boat | null): void {
    this.selectedBoat = boat;
    this.selectedEntities = [];
  }
  
  setSelectedHero(hero: Hero | null): void {
    this.selectedHero = hero;
  }
  
  private renderSelectionPanel(): void {
    if (!this.panels.selection) return;
    
    const panelWidth = 280;
    const panelHeight = 180;
    const x = 10;
    const y = this.canvas.height - panelHeight - 10;
    
    // Background
    this.ctx.fillStyle = this.config.colors.backgroundDark;
    this.ctx.beginPath();
    this.roundRect(x, y, panelWidth, panelHeight, 8);
    this.ctx.fill();
    
    this.ctx.strokeStyle = this.config.colors.border;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Content based on selection
    if (this.selectedHero) {
      this.renderHeroPanel(x, y, panelWidth, panelHeight);
    } else if (this.selectedBoat) {
      this.renderBoatPanel(x, y, panelWidth, panelHeight);
    } else if (this.selectedBuilding) {
      this.renderBuildingPanel(x, y, panelWidth, panelHeight);
    } else if (this.selectedEntities.length > 0) {
      this.renderUnitPanel(x, y, panelWidth, panelHeight);
    } else {
      this.renderEmptyPanel(x, y, panelWidth, panelHeight);
    }
  }
  
  private renderHeroPanel(x: number, y: number, w: number, h: number): void {
    const hero = this.selectedHero!;
    const padding = 10;
    
    // Portrait area
    this.ctx.fillStyle = 'rgba(50, 50, 70, 0.8)';
    this.ctx.fillRect(x + padding, y + padding, 64, 64);
    this.ctx.strokeStyle = this.config.colors.accent;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + padding, y + padding, 64, 64);
    
    // Hero letter
    this.ctx.fillStyle = this.config.colors.accent;
    this.ctx.font = `bold 32px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('H', x + padding + 32, y + padding + 32);
    
    // Name and level
    const textX = x + padding + 74;
    let textY = y + padding + 16;
    
    this.ctx.fillStyle = this.config.colors.accent;
    this.ctx.font = `bold ${this.config.fontSize.title}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(hero.name || 'Hero', textX, textY);
    
    textY += 18;
    this.ctx.fillStyle = this.config.colors.textSecondary;
    this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
    this.ctx.fillText(`Level ${hero.level || 1}`, textX, textY);
    
    // XP bar
    textY += 20;
    const xpRatio = (hero.experience || 0) / (hero.experienceToLevel || 100);
    drawStatBar(this.ctx, {
      x: textX,
      y: textY,
      width: w - textX + x - padding,
      height: 12,
      value: hero.experience || 0,
      maxValue: hero.experienceToLevel || 100,
      color: '#aa88ff',
      label: 'XP'
    });
    
    // Health/Mana bars
    const barY = y + padding + 74;
    const barWidth = w - padding * 2;
    
    drawStatBar(this.ctx, {
      x: x + padding,
      y: barY,
      width: barWidth,
      height: 16,
      value: hero.currentHealth || hero.stats?.maxHealth || 100,
      maxValue: hero.stats?.maxHealth || 100,
      color: this.config.colors.health,
      label: 'HP'
    });
    
    drawStatBar(this.ctx, {
      x: x + padding,
      y: barY + 20,
      width: barWidth,
      height: 16,
      value: hero.currentMana || hero.stats?.maxMana || 50,
      maxValue: hero.stats?.maxMana || 50,
      color: this.config.colors.mana,
      label: 'MP'
    });
    
    // Key stats
    const statsY = barY + 44;
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
    
    const stats = hero.stats;
    if (stats) {
      const statList = [
        { label: 'ATK', value: Math.floor(stats.physicalDamage), color: this.config.colors.damage },
        { label: 'DEF', value: Math.floor(stats.physicalDefense), color: this.config.colors.defense },
        { label: 'SPD', value: stats.movementSpeed.toFixed(1), color: this.config.colors.stamina },
        { label: 'CRIT', value: `${Math.floor(stats.criticalChance * 100)}%`, color: this.config.colors.accent }
      ];
      
      const colWidth = (w - padding * 2) / statList.length;
      statList.forEach((stat, i) => {
        const sx = x + padding + colWidth * i + colWidth / 2;
        
        this.ctx.fillStyle = stat.color;
        this.ctx.font = `bold ${this.config.fontSize.medium}px ${this.config.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(stat.value.toString(), sx, statsY);
        
        this.ctx.fillStyle = this.config.colors.textSecondary;
        this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
        this.ctx.fillText(stat.label, sx, statsY + 14);
      });
    }
  }
  
  private renderUnitPanel(x: number, y: number, w: number, h: number): void {
    const padding = 10;
    const entities = this.selectedEntities;
    
    if (entities.length === 1) {
      // Single unit detailed view
      const unit = entities[0];
      
      // Portrait
      this.ctx.fillStyle = 'rgba(50, 50, 70, 0.8)';
      this.ctx.fillRect(x + padding, y + padding, 48, 48);
      
      // Unit icon
      this.ctx.fillStyle = this.getFactionColor(unit.faction);
      this.ctx.font = `bold 24px ${this.config.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(unit.type?.charAt(0).toUpperCase() || 'U', x + padding + 24, y + padding + 24);
      
      // Name
      const textX = x + padding + 58;
      let textY = y + padding + 16;
      
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = `bold ${this.config.fontSize.large}px ${this.config.fontFamily}`;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(unit.type || 'Unit', textX, textY);
      
      // Faction
      textY += 16;
      this.ctx.fillStyle = this.getFactionColor(unit.faction);
      this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
      this.ctx.fillText(this.getFactionName(unit.faction), textX, textY);
      
      // Health bar
      const barY = y + padding + 58;
      drawStatBar(this.ctx, {
        x: x + padding,
        y: barY,
        width: w - padding * 2,
        height: 14,
        value: unit.health,
        maxValue: unit.maxHealth || 100,
        color: this.config.colors.health
      });
      
      // Stats grid
      if (unit.stats) {
        const statsY = barY + 22;
        const stats = unit.stats;
        const statGrid = [
          [
            { label: 'ATK', value: Math.floor(stats.physicalDamage), color: this.config.colors.damage },
            { label: 'DEF', value: Math.floor(stats.physicalDefense), color: this.config.colors.defense }
          ],
          [
            { label: 'SPD', value: stats.movementSpeed.toFixed(1), color: this.config.colors.stamina },
            { label: 'RANGE', value: Math.floor(stats.attackRange), color: this.config.colors.mana }
          ],
          [
            { label: 'AS', value: stats.attackSpeed.toFixed(2), color: this.config.colors.accent },
            { label: 'ARMOR', value: Math.floor(stats.armor), color: this.config.colors.defense }
          ]
        ];
        
        statGrid.forEach((row, rowIndex) => {
          row.forEach((stat, colIndex) => {
            const sx = x + padding + (w - padding * 2) / 2 * colIndex;
            const sy = statsY + rowIndex * 28;
            
            this.ctx.fillStyle = this.config.colors.textSecondary;
            this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(stat.label, sx, sy);
            
            this.ctx.fillStyle = stat.color;
            this.ctx.font = `bold ${this.config.fontSize.medium}px ${this.config.fontFamily}`;
            this.ctx.fillText(stat.value.toString(), sx + 50, sy);
          });
        });
      }
      
    } else {
      // Multi-unit view
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = `bold ${this.config.fontSize.large}px ${this.config.fontFamily}`;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${entities.length} Units Selected`, x + padding, y + padding + 14);
      
      // Group by type
      const grouped = new Map<string, Entity[]>();
      entities.forEach(e => {
        const type = e.type || 'unknown';
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type)!.push(e);
      });
      
      let iconY = y + padding + 30;
      const iconSize = 32;
      const iconsPerRow = Math.floor((w - padding * 2) / (iconSize + 4));
      let iconIndex = 0;
      
      grouped.forEach((units, type) => {
        const row = Math.floor(iconIndex / iconsPerRow);
        const col = iconIndex % iconsPerRow;
        const iconX = x + padding + col * (iconSize + 4);
        const iconYPos = iconY + row * (iconSize + 20);
        
        // Icon background
        this.ctx.fillStyle = this.getFactionColor(units[0].faction);
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(iconX, iconYPos, iconSize, iconSize);
        this.ctx.globalAlpha = 1;
        
        // Count badge
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.beginPath();
        this.ctx.arc(iconX + iconSize - 6, iconYPos + 6, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = `bold ${this.config.fontSize.small}px ${this.config.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(units.length.toString(), iconX + iconSize - 6, iconYPos + 6);
        
        // Type letter
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = `bold 16px ${this.config.fontFamily}`;
        this.ctx.fillText(type.charAt(0).toUpperCase(), iconX + iconSize / 2, iconYPos + iconSize / 2);
        
        // Type name
        this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
        this.ctx.fillText(type, iconX + iconSize / 2, iconYPos + iconSize + 10);
        
        iconIndex++;
      });
    }
  }
  
  private renderBoatPanel(x: number, y: number, w: number, h: number): void {
    const boat = this.selectedBoat!;
    const padding = 10;
    
    // Boat icon
    this.ctx.fillStyle = 'rgba(40, 60, 80, 0.8)';
    this.ctx.fillRect(x + padding, y + padding, 64, 48);
    
    this.ctx.fillStyle = this.getFactionColor(boat.faction);
    this.ctx.font = `bold 28px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⛵', x + padding + 32, y + padding + 24);
    
    // Info
    const textX = x + padding + 74;
    let textY = y + padding + 16;
    
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = `bold ${this.config.fontSize.title}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.getFactionName(boat.faction)} Boat`, textX, textY);
    
    textY += 18;
    this.ctx.fillStyle = this.config.colors.textSecondary;
    this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
    const status = boat.docked ? 'Docked' : 'Sailing';
    this.ctx.fillText(`Status: ${status}`, textX, textY);
    
    // Health bar
    const barY = y + padding + 58;
    drawStatBar(this.ctx, {
      x: x + padding,
      y: barY,
      width: w - padding * 2,
      height: 14,
      value: boat.health,
      maxValue: boat.maxHealth,
      color: this.config.colors.health
    });
    
    // Capacity
    const capacityY = barY + 22;
    this.ctx.fillStyle = this.config.colors.textSecondary;
    this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Troops: ${boat.units.length}/${boat.capacity}`, x + padding, capacityY);
    
    // Speed
    this.ctx.fillText(`Speed: ${boat.speed.toFixed(1)}`, x + padding + 120, capacityY);
    
    // Destination
    if (boat.targetIsland !== undefined) {
      const destY = capacityY + 20;
      this.ctx.fillStyle = this.config.colors.accent;
      this.ctx.fillText(`Destination: Island ${boat.targetIsland}`, x + padding, destY);
    }
    
    // Unit list preview
    if (boat.units.length > 0) {
      const unitsY = capacityY + 44;
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
      this.ctx.fillText('Loaded Units:', x + padding, unitsY);
      
      // Show first few units as icons
      const iconSize = 20;
      boat.units.slice(0, 8).forEach((unit, i) => {
        const iconX = x + padding + i * (iconSize + 2);
        this.ctx.fillStyle = this.getFactionColor(boat.faction);
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(iconX, unitsY + 8, iconSize, iconSize);
        this.ctx.globalAlpha = 1;
      });
      
      if (boat.units.length > 8) {
        this.ctx.fillStyle = this.config.colors.textSecondary;
        this.ctx.fillText(`+${boat.units.length - 8}`, x + padding + 8 * (iconSize + 2) + 4, unitsY + 18);
      }
    }
  }
  
  private renderBuildingPanel(x: number, y: number, w: number, h: number): void {
    const building = this.selectedBuilding!;
    const padding = 10;
    
    // Building icon
    this.ctx.fillStyle = 'rgba(60, 50, 40, 0.8)';
    this.ctx.fillRect(x + padding, y + padding, 64, 64);
    
    this.ctx.fillStyle = this.getFactionColor(building.faction);
    this.ctx.font = `bold 28px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🏰', x + padding + 32, y + padding + 32);
    
    // Info
    const textX = x + padding + 74;
    let textY = y + padding + 16;
    
    this.ctx.fillStyle = this.config.colors.accent;
    this.ctx.font = `bold ${this.config.fontSize.title}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.formatBuildingName(building.type), textX, textY);
    
    textY += 18;
    this.ctx.fillStyle = this.getFactionColor(building.faction);
    this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
    this.ctx.fillText(this.getFactionName(building.faction), textX, textY);
    
    // Construction progress
    if (building.constructionProgress !== undefined && building.constructionProgress < 1) {
      textY += 20;
      drawStatBar(this.ctx, {
        x: textX,
        y: textY,
        width: w - textX + x - padding,
        height: 12,
        value: building.constructionProgress * 100,
        maxValue: 100,
        color: this.config.colors.accent,
        label: 'Building'
      });
    }
    
    // Health bar
    const barY = y + padding + 74;
    drawStatBar(this.ctx, {
      x: x + padding,
      y: barY,
      width: w - padding * 2,
      height: 14,
      value: building.health,
      maxValue: building.maxHealth,
      color: this.config.colors.health
    });
    
    // Building stats
    const statsY = barY + 22;
    this.ctx.fillStyle = this.config.colors.textSecondary;
    this.ctx.font = `${this.config.fontSize.small}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'left';
    
    const buildingInfo = this.getBuildingInfo(building.type);
    let infoY = statsY;
    buildingInfo.forEach(info => {
      this.ctx.fillStyle = this.config.colors.textSecondary;
      this.ctx.fillText(`${info.label}: `, x + padding, infoY);
      
      const labelWidth = this.ctx.measureText(`${info.label}: `).width;
      this.ctx.fillStyle = info.color || this.config.colors.text;
      this.ctx.fillText(info.value, x + padding + labelWidth, infoY);
      infoY += 16;
    });
  }
  
  private renderEmptyPanel(x: number, y: number, w: number, h: number): void {
    this.ctx.fillStyle = this.config.colors.textSecondary;
    this.ctx.font = `${this.config.fontSize.medium}px ${this.config.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('No selection', x + w / 2, y + h / 2 - 10);
    this.ctx.fillText('Click units or buildings to select', x + w / 2, y + h / 2 + 10);
  }
  
  // === MINI STATS HUD ===
  
  renderMiniStats(hero: Hero | null, resources: { gold: number; wood: number; food: number }): void {
    if (!this.panels.miniStats) return;
    
    const padding = 8;
    const barHeight = 8;
    const x = 10;
    let y = 10;
    
    // Resources bar
    const resWidth = 200;
    this.ctx.fillStyle = this.config.colors.backgroundDark;
    this.ctx.beginPath();
    this.roundRect(x, y, resWidth, 30, 4);
    this.ctx.fill();
    
    // Resource icons and values
    const resItems = [
      { icon: '🪙', value: resources.gold, color: '#ffd700' },
      { icon: '🪵', value: resources.wood, color: '#8b4513' },
      { icon: '🍖', value: resources.food, color: '#ff6b6b' }
    ];
    
    resItems.forEach((res, i) => {
      const rx = x + padding + i * 64;
      this.ctx.font = `14px ${this.config.fontFamily}`;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(res.icon, rx, y + 20);
      
      this.ctx.fillStyle = res.color;
      this.ctx.font = `bold ${this.config.fontSize.medium}px ${this.config.fontFamily}`;
      this.ctx.fillText(res.value.toString(), rx + 20, y + 20);
    });
    
    // Hero health/mana (if hero exists)
    if (hero) {
      y += 38;
      const heroBarWidth = 150;
      
      // Health
      drawStatBar(this.ctx, {
        x,
        y,
        width: heroBarWidth,
        height: barHeight,
        value: hero.currentHealth || 100,
        maxValue: hero.stats?.maxHealth || 100,
        color: this.config.colors.health,
        showText: false
      });
      
      // Mana
      y += barHeight + 2;
      drawStatBar(this.ctx, {
        x,
        y,
        width: heroBarWidth,
        height: barHeight,
        value: hero.currentMana || 50,
        maxValue: hero.stats?.maxMana || 50,
        color: this.config.colors.mana,
        showText: false
      });
    }
  }
  
  // === UTILITY METHODS ===
  
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
  
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
  
  private getFactionColor(faction: number): string {
    switch (faction) {
      case 1: return '#4488ff'; // Player - blue
      case 2: return '#ff4444'; // Goblin - red
      case 3: return '#44ff88'; // Ally - green
      case 4: return '#aa44ff'; // Enemy 2 - purple
      default: return '#888888'; // Neutral
    }
  }
  
  private getFactionName(faction: number): string {
    switch (faction) {
      case 1: return 'Crusade';
      case 2: return 'Goblin';
      case 3: return 'Legion';
      case 4: return 'Fabled';
      default: return 'Neutral';
    }
  }
  
  private formatBuildingName(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
  }
  
  private getBuildingInfo(type: string): { label: string; value: string; color?: string }[] {
    const info: { label: string; value: string; color?: string }[] = [];
    
    switch (type) {
      case 'barracks':
        info.push({ label: 'Trains', value: 'Warriors, Lancers', color: this.config.colors.accent });
        info.push({ label: 'Queue', value: '5 units max' });
        break;
      case 'archery':
        info.push({ label: 'Trains', value: 'Archers', color: this.config.colors.accent });
        info.push({ label: 'Queue', value: '5 units max' });
        break;
      case 'monastery':
        info.push({ label: 'Trains', value: 'Monks', color: this.config.colors.accent });
        info.push({ label: 'Heals', value: 'Nearby units' });
        break;
      case 'tower':
        info.push({ label: 'Attack', value: 'Ranged', color: this.config.colors.damage });
        info.push({ label: 'Range', value: '200', color: this.config.colors.mana });
        break;
      case 'castle':
        info.push({ label: 'Type', value: 'Headquarters', color: this.config.colors.accent });
        info.push({ label: 'Spawns', value: 'Heroes' });
        break;
      default:
        info.push({ label: 'Type', value: type });
    }
    
    return info;
  }
  
  // === MAIN RENDER ===
  
  render(): void {
    this.renderSelectionPanel();
    this.renderTooltip();
  }
  
  // === TOOLTIP HELPERS FOR EXTERNAL USE ===
  
  createUnitTooltip(entity: Entity): TooltipData {
    const stats: TooltipData['stats'] = [];
    
    if (entity.stats) {
      stats.push({ label: 'Health', value: `${Math.floor(entity.health)}/${Math.floor(entity.maxHealth || 100)}`, color: this.config.colors.health });
      stats.push({ label: 'Attack', value: Math.floor(entity.stats.physicalDamage), color: this.config.colors.damage });
      stats.push({ label: 'Defense', value: Math.floor(entity.stats.physicalDefense), color: this.config.colors.defense });
      stats.push({ label: 'Speed', value: entity.stats.movementSpeed.toFixed(1), color: this.config.colors.stamina });
    }
    
    return {
      type: 'unit',
      title: entity.type || 'Unit',
      subtitle: this.getFactionName(entity.faction),
      stats
    };
  }
  
  createBuildingTooltip(building: Building): TooltipData {
    return {
      type: 'building',
      title: this.formatBuildingName(building.type),
      subtitle: this.getFactionName(building.faction),
      stats: [
        { label: 'Health', value: `${Math.floor(building.health)}/${Math.floor(building.maxHealth)}`, color: this.config.colors.health },
        ...this.getBuildingInfo(building.type)
      ]
    };
  }
  
  createBoatTooltip(boat: Boat): TooltipData {
    return {
      type: 'boat',
      title: `${this.getFactionName(boat.faction)} Boat`,
      subtitle: boat.docked ? 'Docked' : 'Sailing',
      stats: [
        { label: 'Health', value: `${Math.floor(boat.health)}/${Math.floor(boat.maxHealth)}`, color: this.config.colors.health },
        { label: 'Troops', value: `${boat.units.length}/${boat.capacity}` },
        { label: 'Speed', value: boat.speed.toFixed(1), color: this.config.colors.stamina }
      ]
    };
  }
  
  createIslandTooltip(island: Island): TooltipData {
    return {
      type: 'island',
      title: island.name,
      subtitle: `Controlled by: ${this.getFactionName(island.controllingFaction)}`,
      stats: [
        { label: 'Camps', value: island.camps.length },
        { label: 'Nodes', value: island.nodes.length },
        { label: 'Docks', value: island.dockPoints.length }
      ]
    };
  }
  
  createStatTooltip(statName: string, value: number, description: string): TooltipData {
    return {
      type: 'stat',
      title: statName,
      description,
      stats: [
        { label: 'Value', value: value.toFixed(2) }
      ]
    };
  }
}

// Export singleton factory
let uiManagerInstance: UIManager | null = null;

export function getUIManager(canvas?: HTMLCanvasElement): UIManager {
  if (!uiManagerInstance && canvas) {
    uiManagerInstance = new UIManager(canvas);
  }
  if (!uiManagerInstance) {
    throw new Error('UIManager not initialized. Provide canvas on first call.');
  }
  return uiManagerInstance;
}
