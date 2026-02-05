// ============================================
// EQUIPMENT MANAGER
// Handles hero equipment, inventory, and stat bonuses
// ============================================

import type { DerivedStats } from '../../types/index.ts';
import type { 
  Weapon, Armor, Item, EquipmentSlots, Inventory, EquipmentBonuses,
  ArmorSlot
} from '../../types/equipment.ts';
import { 
  getEmptyEquipmentSlots, getEmptyInventory, calculateEquipmentBonuses,
  TIER_NAMES
} from '../../types/equipment.ts';
import { getStarterEquipment } from '../../data/itemsData.ts';

export class EquipmentManager {
  private equipmentSlots: EquipmentSlots;
  private inventory: Inventory;
  private cachedBonuses: EquipmentBonuses | null = null;
  
  constructor() {
    this.equipmentSlots = getEmptyEquipmentSlots();
    this.inventory = getEmptyInventory(40);
  }
  
  // === INITIALIZATION ===
  
  /**
   * Initialize with starter equipment for a class
   */
  initializeForClass(heroClass: 'Warrior' | 'Mage' | 'Ranger' | 'Worg' | 'Rogue'): void {
    const starter = getStarterEquipment(heroClass);
    
    // Equip starter weapon
    this.equipWeapon(starter.weapon, 'mainHand');
    
    // Equip starter armor
    for (const armor of starter.armor) {
      this.equipArmor(armor);
    }
    
    // Clear cache
    this.cachedBonuses = null;
  }
  
  // === WEAPON MANAGEMENT ===
  
  /**
   * Equip a weapon to main hand or off hand
   */
  equipWeapon(weapon: Weapon, slot: 'mainHand' | 'offHand' = 'mainHand'): boolean {
    // Unequip current weapon if any
    const currentWeapon = this.equipmentSlots[slot];
    if (currentWeapon && 'category' in currentWeapon) {
      this.addToInventory(currentWeapon);
    }
    
    // Remove from inventory if present
    this.removeFromInventory(weapon);
    
    // Equip new weapon
    this.equipmentSlots[slot] = weapon;
    weapon.isEquipped = true;
    
    // Clear cache
    this.cachedBonuses = null;
    
    return true;
  }
  
  /**
   * Unequip weapon from slot
   */
  unequipWeapon(slot: 'mainHand' | 'offHand'): Weapon | null {
    const weapon = this.equipmentSlots[slot];
    if (weapon && 'category' in weapon) {
      this.equipmentSlots[slot] = null;
      weapon.isEquipped = false;
      this.addToInventory(weapon);
      this.cachedBonuses = null;
      return weapon;
    }
    return null;
  }
  
  // === ARMOR MANAGEMENT ===
  
  /**
   * Equip armor to appropriate slot
   */
  equipArmor(armor: Armor): boolean {
    const slot = this.armorSlotToEquipmentSlot(armor.slot);
    if (!slot) return false;
    
    // Unequip current armor if any
    const currentArmor = this.equipmentSlots[slot];
    if (currentArmor && 'armorType' in currentArmor) {
      this.addToInventory(currentArmor);
    }
    
    // Remove from inventory if present
    this.removeFromInventory(armor);
    
    // Equip new armor
    (this.equipmentSlots as any)[slot] = armor;
    armor.isEquipped = true;
    
    // Clear cache
    this.cachedBonuses = null;
    
    return true;
  }
  
  /**
   * Unequip armor from slot
   */
  unequipArmor(slot: ArmorSlot): Armor | null {
    const equipSlot = this.armorSlotToEquipmentSlot(slot);
    if (!equipSlot) return null;
    
    const armor = (this.equipmentSlots as any)[equipSlot];
    if (armor && 'armorType' in armor) {
      (this.equipmentSlots as any)[equipSlot] = null;
      armor.isEquipped = false;
      this.addToInventory(armor);
      this.cachedBonuses = null;
      return armor;
    }
    return null;
  }
  
  private armorSlotToEquipmentSlot(slot: ArmorSlot): keyof EquipmentSlots | null {
    const mapping: Record<ArmorSlot, keyof EquipmentSlots> = {
      'Head': 'head',
      'Chest': 'chest',
      'Legs': 'legs',
      'Feet': 'feet',
      'Hands': 'hands',
      'Shoulders': 'shoulders',
      'OffHand': 'offHand',
    };
    return mapping[slot] || null;
  }
  
  // === INVENTORY MANAGEMENT ===
  
  /**
   * Add item to inventory
   */
  addToInventory(item: Weapon | Armor | Item): boolean {
    // Find empty slot
    for (let i = 0; i < this.inventory.slots.length; i++) {
      if (!this.inventory.slots[i].item) {
        this.inventory.slots[i] = { item, quantity: 1 };
        return true;
      }
    }
    return false; // Inventory full
  }
  
  /**
   * Remove item from inventory
   */
  removeFromInventory(item: Weapon | Armor | Item): boolean {
    for (let i = 0; i < this.inventory.slots.length; i++) {
      if (this.inventory.slots[i].item === item || 
          (this.inventory.slots[i].item && this.inventory.slots[i].item!.id === item.id)) {
        this.inventory.slots[i] = { item: null, quantity: 0 };
        return true;
      }
    }
    return false;
  }
  
  /**
   * Add gold to inventory
   */
  addGold(amount: number): void {
    this.inventory.gold += amount;
  }
  
  /**
   * Spend gold from inventory
   */
  spendGold(amount: number): boolean {
    if (this.inventory.gold >= amount) {
      this.inventory.gold -= amount;
      return true;
    }
    return false;
  }
  
  // === STAT BONUSES ===
  
  /**
   * Get total equipment bonuses (cached)
   */
  getEquipmentBonuses(): EquipmentBonuses {
    if (!this.cachedBonuses) {
      this.cachedBonuses = calculateEquipmentBonuses(this.equipmentSlots);
    }
    return this.cachedBonuses;
  }
  
  /**
   * Apply equipment bonuses to derived stats
   */
  applyBonusesToStats(baseStats: DerivedStats): DerivedStats {
    const bonuses = this.getEquipmentBonuses();
    
    return {
      ...baseStats,
      health: baseStats.health + bonuses.health,
      mana: baseStats.mana + bonuses.mana,
      stamina: baseStats.stamina + bonuses.stamina,
      damage: baseStats.damage + bonuses.attackPower + bonuses.magicPower,
      defense: baseStats.defense + bonuses.defense,
      block: baseStats.block + bonuses.block,
      evasion: baseStats.evasion + bonuses.evasion,
      resistance: baseStats.resistance + bonuses.resistance,
      accuracy: baseStats.accuracy + bonuses.accuracy,
      criticalChance: baseStats.criticalChance + bonuses.critChance,
      criticalDamage: baseStats.criticalDamage + bonuses.critDamage,
      attackSpeed: baseStats.attackSpeed + bonuses.attackSpeed,
      armorPenetration: baseStats.armorPenetration + bonuses.armorPen,
      drainHealth: baseStats.drainHealth + bonuses.lifesteal,
      stagger: baseStats.stagger + bonuses.stagger,
      healthRegen: baseStats.healthRegen + bonuses.healthRegen,
      manaRegen: baseStats.manaRegen + bonuses.manaRegen,
      // Keep other stats unchanged
      blockEffect: baseStats.blockEffect,
      armor: baseStats.armor,
      damageReduction: baseStats.damageReduction,
      blockPenetration: baseStats.blockPenetration,
      defenseBreak: baseStats.defenseBreak,
      movementSpeed: baseStats.movementSpeed,
      cooldownReduction: baseStats.cooldownReduction,
      abilityCost: baseStats.abilityCost,
      spellAccuracy: baseStats.spellAccuracy,
      cdrResist: baseStats.cdrResist,
      defenseBreakResist: baseStats.defenseBreakResist,
      bleedResist: baseStats.bleedResist,
      statusEffect: baseStats.statusEffect,
      spellblock: baseStats.spellblock,
      ccResistance: baseStats.ccResistance,
      criticalEvasion: baseStats.criticalEvasion,
      dodge: baseStats.dodge,
      reflexTime: baseStats.reflexTime,
      fallDamage: baseStats.fallDamage,
      comboCooldownRed: baseStats.comboCooldownRed,
    };
  }
  
  // === GETTERS ===
  
  getEquipmentSlots(): EquipmentSlots {
    return this.equipmentSlots;
  }
  
  getInventory(): Inventory {
    return this.inventory;
  }
  
  getMainWeapon(): Weapon | null {
    const weapon = this.equipmentSlots.mainHand;
    return weapon && 'category' in weapon ? weapon : null;
  }
  
  getOffHandItem(): Weapon | Armor | null {
    return this.equipmentSlots.offHand;
  }
  
  getEquippedArmor(): Armor[] {
    const armor: Armor[] = [];
    const slots: (keyof EquipmentSlots)[] = ['head', 'chest', 'legs', 'feet', 'hands', 'shoulders'];
    
    for (const slot of slots) {
      const item = this.equipmentSlots[slot];
      if (item && 'armorType' in item) {
        armor.push(item);
      }
    }
    
    // Check if offHand is a shield
    if (this.equipmentSlots.offHand && 'armorType' in this.equipmentSlots.offHand) {
      armor.push(this.equipmentSlots.offHand);
    }
    
    return armor;
  }
  
  getGold(): number {
    return this.inventory.gold;
  }
  
  getInventoryItems(): (Weapon | Armor | Item)[] {
    return this.inventory.slots
      .filter(slot => slot.item !== null)
      .map(slot => slot.item!);
  }
  
  // === UTILITY ===
  
  /**
   * Get item description with stats
   */
  getItemDescription(item: Weapon | Armor | Item): string {
    let desc = `${TIER_NAMES[item.tier as keyof typeof TIER_NAMES]} ${item.name}\n`;
    
    if ('baseStats' in item && 'category' in item) {
      // Weapon
      const weapon = item as Weapon;
      desc += `${weapon.category.toUpperCase()}\n`;
      if (weapon.baseStats.ATK) desc += `ATK: +${weapon.baseStats.ATK}\n`;
      if (weapon.baseStats.MATK) desc += `MATK: +${weapon.baseStats.MATK}\n`;
      if (weapon.baseStats.CRITCHANCE) desc += `Crit: +${weapon.baseStats.CRITCHANCE}%\n`;
      if (weapon.baseStats.CRITDMG) desc += `Crit DMG: +${weapon.baseStats.CRITDMG}%\n`;
      if (weapon.baseStats.RANGE) desc += `Range: +${weapon.baseStats.RANGE}\n`;
    } else if ('baseStats' in item && 'armorType' in item) {
      // Armor
      const armor = item as Armor;
      desc += `${armor.armorType} - ${armor.slot}\n`;
      if (armor.baseStats.DEF) desc += `DEF: +${armor.baseStats.DEF}\n`;
      if (armor.baseStats.MDEF) desc += `MDEF: +${armor.baseStats.MDEF}\n`;
      if (armor.baseStats.HEALTH) desc += `HP: +${armor.baseStats.HEALTH}\n`;
      if (armor.baseStats.MANA) desc += `MP: +${armor.baseStats.MANA}\n`;
      if (armor.baseStats.BLOCK) desc += `Block: +${armor.baseStats.BLOCK}%\n`;
      if (armor.baseStats.EVASION) desc += `Evasion: +${armor.baseStats.EVASION}%\n`;
    }
    
    return desc;
  }
  
  /**
   * Serialize equipment state for saving
   */
  serialize(): object {
    return {
      equipped: {
        mainHand: this.equipmentSlots.mainHand?.id || null,
        offHand: this.equipmentSlots.offHand?.id || null,
        head: this.equipmentSlots.head?.id || null,
        chest: this.equipmentSlots.chest?.id || null,
        legs: this.equipmentSlots.legs?.id || null,
        feet: this.equipmentSlots.feet?.id || null,
        hands: this.equipmentSlots.hands?.id || null,
        shoulders: this.equipmentSlots.shoulders?.id || null,
      },
      inventory: this.inventory.slots.map(slot => 
        slot.item ? { id: slot.item.id, quantity: slot.quantity } : null
      ),
      gold: this.inventory.gold,
    };
  }
}
