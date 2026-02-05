// ============================================
// SAVE SYSTEM
// Handles game save/load using localforage
// ============================================

import localforage from 'localforage';
import type { Position, FactionId } from '../../types/index.ts';
import type { HeroCreationData } from '../core/SceneManager.ts';

export interface SavedHeroData {
  creationData: HeroCreationData;
  position: Position;
  level: number;
  experience: number;
  health: number;
  mana: number;
}

export interface SavedUnitData {
  id: string;
  faction: FactionId;
  position: Position;
  health: number;
}

export interface SavedGameState {
  version: string;
  timestamp: number;
  playTime: number;
  hero: SavedHeroData | null;
  playerUnits: SavedUnitData[];
  enemyUnits: SavedUnitData[];
  playerGold: number;
  cameraPosition: Position;
}

const SAVE_KEY = 'grudge-islands-save';
const SETTINGS_KEY = 'grudge-islands-settings';
const GAME_VERSION = '0.1.0';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  showMinimap: boolean;
  cameraSpeed: number;
  zoomSensitivity: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 1.0,
  showFPS: true,
  showMinimap: true,
  cameraSpeed: 1.0,
  zoomSensitivity: 1.0
};

// Configure localforage
localforage.config({
  name: 'GrudgeIslandsRTS',
  storeName: 'gameData',
  description: 'Grudge Islands RTS save data'
});

export class SaveSystem {
  private autoSaveInterval: number = 60000; // 1 minute
  private autoSaveTimer: number = 0;
  private lastSaveTime: number = 0;
  
  constructor() {}
  
  /**
   * Save the current game state
   */
  async saveGame(state: SavedGameState): Promise<boolean> {
    try {
      state.timestamp = Date.now();
      state.version = GAME_VERSION;
      
      await localforage.setItem(SAVE_KEY, state);
      this.lastSaveTime = Date.now();
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }
  
  /**
   * Load the saved game state
   */
  async loadGame(): Promise<SavedGameState | null> {
    try {
      const state = await localforage.getItem<SavedGameState>(SAVE_KEY);
      
      if (state) {
        // Check version compatibility
        if (state.version !== GAME_VERSION) {
          console.warn(`Save version mismatch: ${state.version} vs ${GAME_VERSION}`);
          // Could add migration logic here
        }
        
        console.log('Game loaded successfully');
        return state;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }
  
  /**
   * Check if a save exists
   */
  async hasSave(): Promise<boolean> {
    try {
      const state = await localforage.getItem<SavedGameState>(SAVE_KEY);
      return state !== null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Delete the save
   */
  async deleteSave(): Promise<boolean> {
    try {
      await localforage.removeItem(SAVE_KEY);
      console.log('Save deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }
  
  /**
   * Save game settings
   */
  async saveSettings(settings: GameSettings): Promise<boolean> {
    try {
      await localforage.setItem(SETTINGS_KEY, settings);
      console.log('Settings saved');
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }
  
  /**
   * Load game settings
   */
  async loadSettings(): Promise<GameSettings> {
    try {
      const settings = await localforage.getItem<GameSettings>(SETTINGS_KEY);
      return settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Update auto-save timer (call each frame)
   */
  updateAutoSave(deltaTime: number, onAutoSave: () => Promise<void>): void {
    this.autoSaveTimer += deltaTime * 1000;
    
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      onAutoSave().catch(console.error);
    }
  }
  
  /**
   * Get time since last save
   */
  getTimeSinceLastSave(): number {
    return Date.now() - this.lastSaveTime;
  }
  
  /**
   * Set auto-save interval
   */
  setAutoSaveInterval(ms: number): void {
    this.autoSaveInterval = ms;
  }
  
  /**
   * Format save timestamp for display
   */
  formatSaveTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
  
  /**
   * Format play time for display
   */
  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
}

export const saveSystem = new SaveSystem();
