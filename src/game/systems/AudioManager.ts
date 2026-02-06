// ============================================
// AUDIO MANAGER
// Sound effects and music using Howler.js
// ============================================

import { Howl, Howler } from 'howler';

// === SOUND TYPES ===

export type SoundCategory = 'sfx' | 'music' | 'ambient' | 'ui';

export interface SoundDefinition {
  id: string;
  path: string;
  category: SoundCategory;
  volume?: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>; // [start, duration] in ms
}

// === SOUND DEFINITIONS ===

export const SOUND_DEFINITIONS: Record<string, SoundDefinition> = {
  // UI Sounds
  ui_click: {
    id: 'ui_click',
    path: 'sounds/ui/click.mp3',
    category: 'ui',
    volume: 0.5
  },
  ui_hover: {
    id: 'ui_hover',
    path: 'sounds/ui/hover.mp3',
    category: 'ui',
    volume: 0.3
  },
  ui_open: {
    id: 'ui_open',
    path: 'sounds/ui/panel_open.mp3',
    category: 'ui',
    volume: 0.5
  },
  ui_close: {
    id: 'ui_close',
    path: 'sounds/ui/panel_close.mp3',
    category: 'ui',
    volume: 0.5
  },
  ui_error: {
    id: 'ui_error',
    path: 'sounds/ui/error.mp3',
    category: 'ui',
    volume: 0.6
  },
  ui_success: {
    id: 'ui_success',
    path: 'sounds/ui/success.mp3',
    category: 'ui',
    volume: 0.6
  },
  
  // Combat Sounds
  attack_sword: {
    id: 'attack_sword',
    path: 'sounds/combat/sword_hit.mp3',
    category: 'sfx',
    volume: 0.7
  },
  attack_arrow: {
    id: 'attack_arrow',
    path: 'sounds/combat/arrow_fire.mp3',
    category: 'sfx',
    volume: 0.6
  },
  attack_magic: {
    id: 'attack_magic',
    path: 'sounds/combat/magic_cast.mp3',
    category: 'sfx',
    volume: 0.7
  },
  explosion: {
    id: 'explosion',
    path: 'sounds/combat/explosion.mp3',
    category: 'sfx',
    volume: 0.8
  },
  death: {
    id: 'death',
    path: 'sounds/combat/death.mp3',
    category: 'sfx',
    volume: 0.5
  },
  
  // Building Sounds
  build_start: {
    id: 'build_start',
    path: 'sounds/building/construction_start.mp3',
    category: 'sfx',
    volume: 0.6
  },
  build_complete: {
    id: 'build_complete',
    path: 'sounds/building/construction_complete.mp3',
    category: 'sfx',
    volume: 0.7
  },
  build_upgrade: {
    id: 'build_upgrade',
    path: 'sounds/building/upgrade.mp3',
    category: 'sfx',
    volume: 0.7
  },
  
  // Resource Sounds
  harvest_wood: {
    id: 'harvest_wood',
    path: 'sounds/resources/chop_wood.mp3',
    category: 'sfx',
    volume: 0.5
  },
  harvest_stone: {
    id: 'harvest_stone',
    path: 'sounds/resources/mine_stone.mp3',
    category: 'sfx',
    volume: 0.5
  },
  collect: {
    id: 'collect',
    path: 'sounds/resources/collect.mp3',
    category: 'sfx',
    volume: 0.6
  },
  coins: {
    id: 'coins',
    path: 'sounds/resources/coins.mp3',
    category: 'sfx',
    volume: 0.5
  },
  
  // Unit Sounds
  unit_select: {
    id: 'unit_select',
    path: 'sounds/units/select.mp3',
    category: 'sfx',
    volume: 0.5
  },
  unit_move: {
    id: 'unit_move',
    path: 'sounds/units/move_order.mp3',
    category: 'sfx',
    volume: 0.5
  },
  unit_attack: {
    id: 'unit_attack',
    path: 'sounds/units/attack_order.mp3',
    category: 'sfx',
    volume: 0.5
  },
  unit_trained: {
    id: 'unit_trained',
    path: 'sounds/units/trained.mp3',
    category: 'sfx',
    volume: 0.6
  },
  
  // Ambient Sounds
  ambient_waves: {
    id: 'ambient_waves',
    path: 'sounds/ambient/ocean_waves.mp3',
    category: 'ambient',
    volume: 0.3,
    loop: true
  },
  ambient_birds: {
    id: 'ambient_birds',
    path: 'sounds/ambient/birds.mp3',
    category: 'ambient',
    volume: 0.2,
    loop: true
  },
  ambient_wind: {
    id: 'ambient_wind',
    path: 'sounds/ambient/wind.mp3',
    category: 'ambient',
    volume: 0.2,
    loop: true
  },
  
  // Music
  music_menu: {
    id: 'music_menu',
    path: 'sounds/music/menu_theme.mp3',
    category: 'music',
    volume: 0.5,
    loop: true
  },
  music_game: {
    id: 'music_game',
    path: 'sounds/music/game_theme.mp3',
    category: 'music',
    volume: 0.4,
    loop: true
  },
  music_battle: {
    id: 'music_battle',
    path: 'sounds/music/battle_theme.mp3',
    category: 'music',
    volume: 0.5,
    loop: true
  },
  music_victory: {
    id: 'music_victory',
    path: 'sounds/music/victory.mp3',
    category: 'music',
    volume: 0.6
  },
  music_defeat: {
    id: 'music_defeat',
    path: 'sounds/music/defeat.mp3',
    category: 'music',
    volume: 0.6
  }
};

// === AUDIO MANAGER ===

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private loadingPromises: Map<string, Promise<Howl>> = new Map();
  
  // Volume settings
  private masterVolume: number = 1.0;
  private sfxVolume: number = 1.0;
  private musicVolume: number = 0.7;
  private ambientVolume: number = 0.5;
  private uiVolume: number = 1.0;
  
  // Current music
  private currentMusic: Howl | null = null;
  private currentMusicId: string | null = null;
  
  // Mute state
  private isMuted: boolean = false;
  
  constructor() {
    // Set global volume
    Howler.volume(this.masterVolume);
  }
  
  // === LOADING ===
  
  async preload(soundIds: string[]): Promise<void> {
    const promises = soundIds.map(id => this.load(id));
    await Promise.all(promises);
  }
  
  async preloadCategory(category: SoundCategory): Promise<void> {
    const soundIds = Object.values(SOUND_DEFINITIONS)
      .filter(def => def.category === category)
      .map(def => def.id);
    
    await this.preload(soundIds);
  }
  
  async load(soundId: string): Promise<Howl | null> {
    // Already loaded
    if (this.sounds.has(soundId)) {
      return this.sounds.get(soundId)!;
    }
    
    // Currently loading
    if (this.loadingPromises.has(soundId)) {
      return this.loadingPromises.get(soundId)!;
    }
    
    const def = SOUND_DEFINITIONS[soundId];
    if (!def) {
      console.warn(`[AudioManager] Unknown sound: ${soundId}`);
      return null;
    }
    
    const promise = new Promise<Howl>((resolve) => {
      const volume = this.getVolumeForCategory(def.category) * (def.volume ?? 1);
      
      const howl = new Howl({
        src: [def.path],
        volume,
        loop: def.loop ?? false,
        sprite: def.sprite,
        onload: () => {
          this.sounds.set(soundId, howl);
          this.loadingPromises.delete(soundId);
          resolve(howl);
        },
        onloaderror: (_, error) => {
          console.warn(`[AudioManager] Failed to load ${soundId}:`, error);
          this.loadingPromises.delete(soundId);
          resolve(howl); // Still resolve, just won't play
        }
      });
    });
    
    this.loadingPromises.set(soundId, promise);
    return promise;
  }
  
  // === PLAYBACK ===
  
  play(soundId: string, spriteId?: string): number | null {
    if (this.isMuted) return null;
    
    const sound = this.sounds.get(soundId);
    if (!sound) {
      // Try to load and play
      this.load(soundId).then(s => s?.play(spriteId));
      return null;
    }
    
    // Update volume based on category
    const def = SOUND_DEFINITIONS[soundId];
    if (def) {
      const volume = this.getVolumeForCategory(def.category) * (def.volume ?? 1);
      sound.volume(volume);
    }
    
    return sound.play(spriteId) as number;
  }
  
  stop(soundId: string, playId?: number): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      if (playId !== undefined) {
        sound.stop(playId);
      } else {
        sound.stop();
      }
    }
  }
  
  pause(soundId: string, playId?: number): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      if (playId !== undefined) {
        sound.pause(playId);
      } else {
        sound.pause();
      }
    }
  }
  
  resume(soundId: string, playId?: number): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      if (playId !== undefined) {
        sound.play(playId);
      } else {
        sound.play();
      }
    }
  }
  
  // === MUSIC ===
  
  async playMusic(musicId: string, fadeIn: number = 1000): Promise<void> {
    // Stop current music
    if (this.currentMusic && this.currentMusicId !== musicId) {
      this.fadeOutMusic(500);
    }
    
    // Load and play new music
    const sound = await this.load(musicId);
    if (!sound) return;
    
    this.currentMusic = sound;
    this.currentMusicId = musicId;
    
    // Fade in
    sound.volume(0);
    const playId = sound.play();
    
    const def = SOUND_DEFINITIONS[musicId];
    const targetVolume = this.musicVolume * (def?.volume ?? 0.5);
    
    sound.fade(0, targetVolume, fadeIn, playId as number);
  }
  
  stopMusic(fadeOut: number = 1000): void {
    this.fadeOutMusic(fadeOut);
  }
  
  private fadeOutMusic(duration: number): void {
    if (!this.currentMusic) return;
    
    const music = this.currentMusic;
    music.fade(music.volume(), 0, duration);
    
    setTimeout(() => {
      music.stop();
    }, duration);
    
    this.currentMusic = null;
    this.currentMusicId = null;
  }
  
  // === AMBIENT ===
  
  playAmbient(soundId: string): void {
    const def = SOUND_DEFINITIONS[soundId];
    if (!def || def.category !== 'ambient') return;
    
    this.play(soundId);
  }
  
  stopAmbient(soundId: string): void {
    this.stop(soundId);
  }
  
  // === VOLUME CONTROL ===
  
  private getVolumeForCategory(category: SoundCategory): number {
    switch (category) {
      case 'sfx': return this.masterVolume * this.sfxVolume;
      case 'music': return this.masterVolume * this.musicVolume;
      case 'ambient': return this.masterVolume * this.ambientVolume;
      case 'ui': return this.masterVolume * this.uiVolume;
      default: return this.masterVolume;
    }
  }
  
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }
  
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateCategoryVolumes('sfx');
  }
  
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateCategoryVolumes('music');
  }
  
  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.updateCategoryVolumes('ambient');
  }
  
  setUiVolume(volume: number): void {
    this.uiVolume = Math.max(0, Math.min(1, volume));
    this.updateCategoryVolumes('ui');
  }
  
  private updateCategoryVolumes(category: SoundCategory): void {
    for (const [id, sound] of this.sounds) {
      const def = SOUND_DEFINITIONS[id];
      if (def?.category === category) {
        const volume = this.getVolumeForCategory(category) * (def.volume ?? 1);
        sound.volume(volume);
      }
    }
  }
  
  // === MUTE ===
  
  mute(): void {
    this.isMuted = true;
    Howler.mute(true);
  }
  
  unmute(): void {
    this.isMuted = false;
    Howler.mute(false);
  }
  
  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }
  
  // === GETTERS ===
  
  getMasterVolume(): number {
    return this.masterVolume;
  }
  
  getSfxVolume(): number {
    return this.sfxVolume;
  }
  
  getMusicVolume(): number {
    return this.musicVolume;
  }
  
  getAmbientVolume(): number {
    return this.ambientVolume;
  }
  
  getUiVolume(): number {
    return this.uiVolume;
  }
  
  isSoundMuted(): boolean {
    return this.isMuted;
  }
  
  isPlaying(soundId: string): boolean {
    const sound = this.sounds.get(soundId);
    return sound?.playing() ?? false;
  }
  
  // === CLEANUP ===
  
  unload(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      sound.unload();
      this.sounds.delete(soundId);
    }
  }
  
  unloadAll(): void {
    for (const sound of this.sounds.values()) {
      sound.unload();
    }
    this.sounds.clear();
    this.currentMusic = null;
    this.currentMusicId = null;
  }
}

// Singleton instance
export const audioManager = new AudioManager();
