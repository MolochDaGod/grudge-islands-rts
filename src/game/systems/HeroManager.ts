// ============================================
// HERO MANAGER
// Multi-hero management with cloud persistence
// Supports 1-3 heroes based on camp level
// ============================================

import { Hero, HeroStats } from '../entities/Hero.ts';
import { HeroCreationData } from '../core/SceneManager.ts';
import { grudgeAuth, CharacterSaveData } from '../auth/GrudgeAuthClient.ts';
import { GAME_CONFIG, getHeroLimit, RaceId } from '../config/GameConfig.ts';
import type { Position } from '../../types/index.ts';
import localforage from 'localforage';

// === TYPES ===

export interface ManagedHero {
  hero: Hero;
  cloudId?: string;           // ID from grudgewarlords.com
  localId: string;            // Local storage ID
  isActive: boolean;          // Currently on world map
  race: RaceId;               // Hero's race for sprite selection
  appearance?: number;        // Hero appearance variant
  lastSyncedAt?: number;      // Last cloud sync timestamp
  isDirty: boolean;           // Has unsaved changes
}

export interface HeroSlot {
  index: number;              // 0, 1, or 2
  hero: ManagedHero | null;
  isUnlocked: boolean;        // Based on camp level
}

export interface HeroManagerState {
  activeHeroIndex: number;    // Currently selected hero
  campLevel: number;          // Determines hero limit
  heroes: HeroSlotSaveData[];
}

export interface HeroSlotSaveData {
  index: number;
  heroData: HeroSaveData | null;
}

export interface HeroSaveData {
  localId: string;
  cloudId?: string;
  name: string;
  heroClass: string;
  appearance: number;
  race: RaceId;
  level: number;
  experience: number;
  stats: HeroStats;
  position: Position;
  equipmentState: Record<string, string>;
}

// === CONSTANTS ===

const HERO_MANAGER_KEY = 'grudge-islands-hero-manager';

// Configure hero-specific storage
localforage.config({
  name: 'GrudgeIslandsRTS',
  storeName: 'heroData',
});

// === HERO MANAGER CLASS ===

export class HeroManager {
  private slots: HeroSlot[] = [];
  private campLevel: number = 1;
  private activeHeroIndex: number = 0;
  private syncInterval: number = 30000; // Sync every 30 seconds
  private lastSyncTime: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize 3 slots (unlock based on camp level)
    for (let i = 0; i < 3; i++) {
      this.slots.push({
        index: i,
        hero: null,
        isUnlocked: i === 0, // Only first slot unlocked initially
      });
    }
  }

  // === INITIALIZATION ===

  /**
   * Initialize hero manager, load saved heroes
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Load local state first
    await this.loadLocalState();

    // Then try to sync with cloud if authenticated
    if (grudgeAuth.isAuthenticated()) {
      await this.syncWithCloud();
    }

    this.isInitialized = true;
    console.log(`HeroManager initialized: ${this.getHeroCount()} heroes, camp level ${this.campLevel}`);
  }

  /**
   * Load state from local storage
   */
  private async loadLocalState(): Promise<void> {
    try {
      const state = await localforage.getItem<HeroManagerState>(HERO_MANAGER_KEY);
      
      if (state) {
        this.campLevel = state.campLevel;
        this.activeHeroIndex = state.activeHeroIndex;
        this.updateSlotUnlocks();

        // Restore heroes from saved data
        for (const slotData of state.heroes) {
          if (slotData.heroData) {
            const hero = this.createHeroFromSave(slotData.heroData);
            this.slots[slotData.index].hero = {
              hero,
              cloudId: slotData.heroData.cloudId,
              localId: slotData.heroData.localId,
              isActive: slotData.index === this.activeHeroIndex,
              race: slotData.heroData.race,
              isDirty: false,
            };
          }
        }
      }
    } catch (error) {
      console.error('Failed to load hero manager state:', error);
    }
  }

  /**
   * Save state to local storage
   */
  async saveLocalState(): Promise<void> {
    try {
      const state: HeroManagerState = {
        campLevel: this.campLevel,
        activeHeroIndex: this.activeHeroIndex,
        heroes: this.slots.map(slot => ({
          index: slot.index,
          heroData: slot.hero ? this.heroToSaveData(slot.hero) : null,
        })),
      };

      await localforage.setItem(HERO_MANAGER_KEY, state);
    } catch (error) {
      console.error('Failed to save hero manager state:', error);
    }
  }

  // === CLOUD SYNC ===

  /**
   * Sync heroes with grudgewarlords.com
   */
  async syncWithCloud(): Promise<void> {
    if (!grudgeAuth.isAuthenticated()) return;

    try {
      // Get cloud characters
      const cloudCharacters = await grudgeAuth.getCharacters();

      // Find RTS heroes (filter by heroData presence or a tag)
      const rtsHeroes = cloudCharacters.filter(c => 
        c.classId && ['Warrior', 'Mage', 'Ranger', 'Worg'].includes(c.classId)
      );

      // Sync each hero
      for (const slot of this.slots) {
        if (!slot.hero) continue;

        const managedHero = slot.hero;
        
        if (managedHero.cloudId) {
          // Has cloud ID - update if dirty
          if (managedHero.isDirty) {
            await this.pushHeroToCloud(managedHero);
          }
        } else {
          // No cloud ID - try to find matching character or create new
          const matching = rtsHeroes.find(c => c.name === managedHero.hero.heroName);
          if (matching) {
            managedHero.cloudId = matching.id;
            await this.pushHeroToCloud(managedHero);
          } else {
            // Create new cloud character
            await this.createCloudHero(managedHero);
          }
        }

        managedHero.lastSyncedAt = Date.now();
        managedHero.isDirty = false;
      }

      this.lastSyncTime = Date.now();
      await this.saveLocalState();
    } catch (error) {
      console.error('Cloud sync error:', error);
    }
  }

  /**
   * Push hero data to cloud
   */
  private async pushHeroToCloud(managedHero: ManagedHero): Promise<void> {
    if (!managedHero.cloudId) return;

    const saveData = this.heroToCharacterData(managedHero);
    await grudgeAuth.updateCharacter(managedHero.cloudId, saveData);
  }

  /**
   * Create new hero in cloud
   */
  private async createCloudHero(managedHero: ManagedHero): Promise<void> {
    const saveData = this.heroToCharacterData(managedHero);
    const character = await grudgeAuth.createCharacter(saveData);
    
    if (character) {
      managedHero.cloudId = character.id;
    }
  }

  // === HERO MANAGEMENT ===

  /**
   * Create a new hero
   */
  createHero(data: HeroCreationData, position: Position, race: RaceId = 'human'): Hero | null {
    // Find first empty unlocked slot
    const emptySlot = this.slots.find(s => s.isUnlocked && !s.hero);
    
    if (!emptySlot) {
      console.warn('No available hero slots');
      return null;
    }

    const hero = new Hero(data, position);
    const localId = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    emptySlot.hero = {
      hero,
      localId,
      isActive: this.getHeroCount() === 0, // First hero is active
      race,
      isDirty: true,
    };

    // Set as active if first hero
    if (emptySlot.hero.isActive) {
      this.activeHeroIndex = emptySlot.index;
    }

    // Save and sync
    this.saveLocalState();
    if (grudgeAuth.isAuthenticated()) {
      this.createCloudHero(emptySlot.hero);
    }

    console.log(`Hero ${hero.heroName} created in slot ${emptySlot.index}`);
    return hero;
  }

  /**
   * Get active hero (currently controlled)
   */
  getActiveHero(): Hero | null {
    const slot = this.slots[this.activeHeroIndex];
    return slot?.hero?.hero ?? null;
  }

  /**
   * Get active managed hero data
   */
  getActiveManagedHero(): ManagedHero | null {
    const slot = this.slots[this.activeHeroIndex];
    return slot?.hero ?? null;
  }

  /**
   * Switch to a different hero
   */
  switchActiveHero(index: number): boolean {
    if (index < 0 || index >= this.slots.length) return false;
    
    const slot = this.slots[index];
    if (!slot.isUnlocked || !slot.hero) return false;

    // Deactivate current
    const currentSlot = this.slots[this.activeHeroIndex];
    if (currentSlot.hero) {
      currentSlot.hero.isActive = false;
    }

    // Activate new
    slot.hero.isActive = true;
    this.activeHeroIndex = index;

    this.saveLocalState();
    return true;
  }

  /**
   * Get all heroes
   */
  getAllHeroes(): Hero[] {
    return this.slots
      .filter(s => s.hero)
      .map(s => s.hero!.hero);
  }

  /**
   * Get all managed heroes
   */
  getAllManagedHeroes(): ManagedHero[] {
    return this.slots
      .filter(s => s.hero)
      .map(s => s.hero!);
  }

  /**
   * Get hero count
   */
  getHeroCount(): number {
    return this.slots.filter(s => s.hero).length;
  }

  /**
   * Get hero limit based on camp level
   */
  getHeroLimit(): number {
    return getHeroLimit(this.campLevel);
  }

  /**
   * Check if can recruit more heroes
   */
  canRecruitHero(): boolean {
    return this.getHeroCount() < this.getHeroLimit();
  }

  /**
   * Get slots info for UI
   */
  getSlotsInfo(): { index: number; hero: Hero | null; isUnlocked: boolean; race: RaceId | null }[] {
    return this.slots.map(slot => ({
      index: slot.index,
      hero: slot.hero?.hero ?? null,
      isUnlocked: slot.isUnlocked,
      race: slot.hero?.race ?? null,
    }));
  }

  // === CAMP LEVEL ===

  /**
   * Set camp level (unlocks hero slots)
   */
  setCampLevel(level: number): void {
    this.campLevel = Math.min(Math.max(1, level), GAME_CONFIG.BUILDING_MAX_LEVEL);
    this.updateSlotUnlocks();
    this.saveLocalState();
  }

  getCampLevel(): number {
    return this.campLevel;
  }

  private updateSlotUnlocks(): void {
    const limit = getHeroLimit(this.campLevel);
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].isUnlocked = i < limit;
    }
  }

  // === HERO UPDATE ===

  /**
   * Update all heroes each frame
   */
  update(deltaTime: number): void {
    for (const slot of this.slots) {
      if (slot.hero) {
        slot.hero.hero.update(deltaTime);
      }
    }

    // Periodic cloud sync
    if (grudgeAuth.isAuthenticated() && Date.now() - this.lastSyncTime > this.syncInterval) {
      this.syncWithCloud();
    }
  }

  /**
   * Mark hero as dirty (needs sync)
   */
  markHeroDirty(heroId: string): void {
    for (const slot of this.slots) {
      if (slot.hero && slot.hero.hero.id === heroId) {
        slot.hero.isDirty = true;
        break;
      }
    }
  }

  // === SERIALIZATION ===

  private heroToSaveData(managedHero: ManagedHero): HeroSaveData {
    const hero = managedHero.hero;
    return {
      localId: managedHero.localId,
      cloudId: managedHero.cloudId,
      name: hero.heroName,
      heroClass: hero.heroClass,
      appearance: managedHero.appearance ?? 0,
      race: managedHero.race,
      level: hero.level,
      experience: hero.experience,
      stats: { ...hero.stats },
      position: { ...hero.position },
      equipmentState: hero.equipment.toJSON(),
    };
  }

  private heroToCharacterData(managedHero: ManagedHero): CharacterSaveData {
    const hero = managedHero.hero;
    return {
      name: hero.heroName,
      raceId: managedHero.race,
      classId: hero.heroClass,
      level: hero.level,
      xp: hero.experience,
      hp: hero.stats.health,
      energy: hero.stats.mana,
      attributes: {
        strength: hero.stats.strength,
        agility: hero.stats.agility,
        intelligence: hero.stats.intelligence,
        vitality: hero.stats.vitality,
      },
      equipment: hero.equipment.toJSON(),
      inventory: [],
      heroData: {
        heroClass: hero.heroClass,
        position: { ...hero.position },
        stats: { ...hero.stats } as unknown as Record<string, number>,
      },
    };
  }

  private createHeroFromSave(data: HeroSaveData): Hero {
    const creationData: HeroCreationData = {
      name: data.name,
      heroClass: data.heroClass as HeroCreationData['heroClass'],
      appearance: data.appearance ?? 0,
    };

    const hero = new Hero(creationData, data.position);
    
    // Restore state
    hero.level = data.level;
    hero.experience = data.experience;
    hero.stats = { ...data.stats };
    
    // Restore equipment
    if (data.equipmentState) {
      hero.equipment.fromJSON(data.equipmentState);
    }

    return hero;
  }

  // === HERO REMOVAL ===

  /**
   * Remove a hero (delete)
   */
  async removeHero(slotIndex: number): Promise<boolean> {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.hero) return false;

    // Delete from cloud
    if (slot.hero.cloudId && grudgeAuth.isAuthenticated()) {
      await grudgeAuth.deleteCharacter(slot.hero.cloudId);
    }

    // Clear slot
    slot.hero = null;

    // If was active, switch to another hero
    if (slotIndex === this.activeHeroIndex) {
      const nextHero = this.slots.find(s => s.hero);
      if (nextHero) {
        this.activeHeroIndex = nextHero.index;
        nextHero.hero!.isActive = true;
      }
    }

    await this.saveLocalState();
    return true;
  }

  // === SPRITE PATHS ===

  /**
   * Get sprite path for a hero based on race and animation state
   */
  getHeroSpritePath(race: RaceId, animation: string = 'idle'): string {
    // Hero GIF sprites are in: sprites/heroes/{race}/{animation}.gif
    return `./sprites/heroes/${race}/${animation}.gif`;
  }

  /**
   * Get available animations for heroes
   */
  getHeroAnimations(): string[] {
    return ['idle', 'walk', 'dash', 'jab', 'uppercut', 'jump', 'crouch', 'hurt', 'death'];
  }
}

// === SINGLETON EXPORT ===

export const heroManager = new HeroManager();
export default heroManager;
