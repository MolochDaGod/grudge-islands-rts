// ============================================
// HERO ENTITY
// The player's main character with class, stats, equipment
// ============================================

import type { FactionId, Position } from '../../types/index.ts';
import { HeroCreationData } from '../core/SceneManager.ts';
import { EquipmentManager } from './EquipmentManager.ts';

export interface HeroStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  attackDamage: number;
  attackSpeed: number;
  armor: number;
  moveSpeed: number;
  critChance: number;
  critDamage: number;
}

export interface HeroClassDefinition {
  baseStats: HeroStats;
  spriteKey: string;
  description: string;
}

// Class definitions with base stats
export const HERO_CLASSES: Record<HeroCreationData['heroClass'], HeroClassDefinition> = {
  Warrior: {
    baseStats: {
      health: 150,
      maxHealth: 150,
      mana: 30,
      maxMana: 30,
      strength: 15,
      agility: 8,
      intelligence: 5,
      vitality: 12,
      attackDamage: 20,
      attackSpeed: 1.0,
      armor: 8,
      moveSpeed: 100,
      critChance: 0.05,
      critDamage: 1.5
    },
    spriteKey: 'warrior',
    description: 'A stalwart defender who excels in close combat'
  },
  Mage: {
    baseStats: {
      health: 80,
      maxHealth: 80,
      mana: 120,
      maxMana: 120,
      strength: 5,
      agility: 6,
      intelligence: 18,
      vitality: 6,
      attackDamage: 8,
      attackSpeed: 0.8,
      armor: 2,
      moveSpeed: 90,
      critChance: 0.1,
      critDamage: 2.0
    },
    spriteKey: 'mage',
    description: 'A powerful spellcaster with devastating magical abilities'
  },
  Ranger: {
    baseStats: {
      health: 100,
      maxHealth: 100,
      mana: 60,
      maxMana: 60,
      strength: 8,
      agility: 16,
      intelligence: 8,
      vitality: 8,
      attackDamage: 15,
      attackSpeed: 1.5,
      armor: 4,
      moveSpeed: 120,
      critChance: 0.15,
      critDamage: 1.75
    },
    spriteKey: 'ranger',
    description: 'A swift hunter deadly at range'
  },
  Worg: {
    baseStats: {
      health: 200,
      maxHealth: 200,
      mana: 20,
      maxMana: 20,
      strength: 18,
      agility: 14,
      intelligence: 3,
      vitality: 15,
      attackDamage: 25,
      attackSpeed: 0.9,
      armor: 6,
      moveSpeed: 140,
      critChance: 0.08,
      critDamage: 1.8
    },
    spriteKey: 'worg',
    description: 'A ferocious beast with immense strength and speed'
  }
};

// Target interface for combat (simplified)
export interface CombatTarget {
  position: Position;
  takeDamage(amount: number): void;
  isDead(): boolean;
}

export class Hero {
  // Identity
  public readonly id: string;
  public readonly heroClass: HeroCreationData['heroClass'];
  public readonly heroName: string;
  public readonly factionId: FactionId = 1 as FactionId;
  
  // Position and size
  public position: Position;
  public size: { width: number; height: number } = { width: 32, height: 32 };
  
  // Stats
  public stats: HeroStats;
  public level: number = 1;
  public experience: number = 0;
  public experienceToLevel: number = 100;
  
  // Combat properties
  public attackRange: number;
  public spriteKey: string;
  private dead: boolean = false;
  
  // Systems
  public equipment: EquipmentManager;
  
  // Combat state
  public isAttacking: boolean = false;
  public attackCooldown: number = 0;
  public targetEntity: CombatTarget | null = null;
  
  // Movement state
  public moveTarget: { x: number; y: number } | null = null;
  public isMoving: boolean = false;
  
  constructor(heroData: HeroCreationData, position: { x: number; y: number }) {
    const classDef = HERO_CLASSES[heroData.heroClass];
    
    this.id = `hero_${Date.now()}`;
    this.heroClass = heroData.heroClass;
    this.heroName = heroData.name;
    this.position = { ...position };
    this.stats = { ...classDef.baseStats };
    this.attackRange = heroData.heroClass === 'Ranger' ? 200 : 50;
    this.spriteKey = classDef.spriteKey;
    
    // Initialize equipment system
    this.equipment = new EquipmentManager();
    this.equipment.initializeForClass(heroData.heroClass);
  }
  
  /**
   * Check if hero is dead
   */
  isDead(): boolean {
    return this.dead || this.stats.health <= 0;
  }
  
  /**
   * Update hero each frame
   */
  update(deltaTime: number): void {
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Handle movement
    if (this.moveTarget && this.isMoving) {
      this.moveTowardsTarget(deltaTime);
    }
    
    // Handle combat
    if (this.targetEntity && !this.targetEntity.isDead()) {
      this.handleCombat();
    }
    
    // Regeneration
    this.regenerate(deltaTime);
  }
  
  private moveTowardsTarget(deltaTime: number): void {
    if (!this.moveTarget) return;
    
    const dx = this.moveTarget.x - this.position.x;
    const dy = this.moveTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      // Arrived at destination
      this.isMoving = false;
      this.moveTarget = null;
      return;
    }
    
    // Normalize and apply speed
    const speed = this.stats.moveSpeed * deltaTime;
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;
    
    this.position.x += moveX;
    this.position.y += moveY;
  }
  
  private handleCombat(): void {
    if (!this.targetEntity) return;
    
    const dx = this.targetEntity.position.x - this.position.x;
    const dy = this.targetEntity.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= this.attackRange) {
      // In range - attack if cooldown ready
      this.isMoving = false;
      
      if (this.attackCooldown <= 0) {
        this.performAttack();
      }
    } else {
      // Move towards target
      this.moveTarget = { ...this.targetEntity.position };
      this.isMoving = true;
    }
  }
  
  private performAttack(): void {
    if (!this.targetEntity) return;
    
    // Calculate damage with crit
    let damage = this.stats.attackDamage;
    const isCrit = Math.random() < this.stats.critChance;
    
    if (isCrit) {
      damage *= this.stats.critDamage;
    }
    
    // Apply damage
    this.targetEntity.takeDamage(damage);
    
    // Reset cooldown
    this.attackCooldown = 1 / this.stats.attackSpeed;
    this.isAttacking = true;
    
    // Clear target if dead
    if (this.targetEntity.isDead()) {
      this.gainExperience(50); // Base XP for kill
      this.targetEntity = null;
      this.isAttacking = false;
    }
  }
  
  private regenerate(deltaTime: number): void {
    // Health regen (0.5% per second when not in combat)
    if (!this.isAttacking && this.stats.health < this.stats.maxHealth) {
      this.stats.health = Math.min(
        this.stats.maxHealth,
        this.stats.health + (this.stats.maxHealth * 0.005 * deltaTime)
      );
    }
    
    // Mana regen (1% per second)
    if (this.stats.mana < this.stats.maxMana) {
      this.stats.mana = Math.min(
        this.stats.maxMana,
        this.stats.mana + (this.stats.maxMana * 0.01 * deltaTime)
      );
    }
  }
  
  /**
   * Command hero to move to position
   */
  moveTo(x: number, y: number): void {
    this.moveTarget = { x, y };
    this.isMoving = true;
    this.targetEntity = null; // Cancel combat
  }
  
  /**
   * Command hero to attack target
   */
  attackTarget(target: CombatTarget): void {
    this.targetEntity = target;
  }
  
  /**
   * Gain experience and level up if needed
   */
  gainExperience(amount: number): void {
    this.experience += amount;
    
    while (this.experience >= this.experienceToLevel) {
      this.levelUp();
    }
  }
  
  private levelUp(): void {
    this.experience -= this.experienceToLevel;
    this.level++;
    this.experienceToLevel = Math.floor(this.experienceToLevel * 1.5);
    
    // Stat gains per level based on class
    const statGains = this.getStatGainsForClass();
    
    this.stats.maxHealth += statGains.health;
    this.stats.health = this.stats.maxHealth;
    this.stats.maxMana += statGains.mana;
    this.stats.mana = this.stats.maxMana;
    this.stats.strength += statGains.strength;
    this.stats.agility += statGains.agility;
    this.stats.intelligence += statGains.intelligence;
    this.stats.vitality += statGains.vitality;
    
    // Recalculate derived stats
    this.recalculateStats();
    
    console.log(`${this.heroName} reached level ${this.level}!`);
  }
  
  private getStatGainsForClass(): Record<string, number> {
    switch (this.heroClass) {
      case 'Warrior':
        return { health: 15, mana: 3, strength: 3, agility: 1, intelligence: 1, vitality: 2 };
      case 'Mage':
        return { health: 6, mana: 15, strength: 1, agility: 1, intelligence: 4, vitality: 1 };
      case 'Ranger':
        return { health: 10, mana: 6, strength: 1, agility: 3, intelligence: 1, vitality: 1 };
      case 'Worg':
        return { health: 20, mana: 2, strength: 4, agility: 2, intelligence: 0, vitality: 3 };
    }
  }
  
  /**
   * Recalculate derived stats from base stats + equipment
   */
  recalculateStats(): void {
    const bonuses = this.equipment.getEquipmentBonuses();
    
    // Apply equipment bonuses
    this.stats.attackDamage = HERO_CLASSES[this.heroClass].baseStats.attackDamage 
      + (this.stats.strength * 0.5)
      + bonuses.attackPower;
      
    this.stats.armor = HERO_CLASSES[this.heroClass].baseStats.armor
      + (this.stats.vitality * 0.3)
      + bonuses.defense;
      
    this.stats.critChance = HERO_CLASSES[this.heroClass].baseStats.critChance
      + (this.stats.agility * 0.005)
      + bonuses.critChance;
  }
  
  /**
   * Take damage (override for hero-specific logic)
   */
  takeDamage(amount: number): void {
    // Reduce by armor
    const reduction = this.stats.armor / (this.stats.armor + 100);
    const actualDamage = amount * (1 - reduction);
    
    this.stats.health -= actualDamage;
    
    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.dead = true;
      // Hero death handling would go here
    }
  }
}
