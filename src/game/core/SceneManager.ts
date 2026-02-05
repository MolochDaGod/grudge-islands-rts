// ============================================
// SCENE MANAGER
// Handles game states: Menu, Hero Creation, Playing, Paused
// ============================================

export type GameScene = 'loading' | 'menu' | 'heroCreation' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface HeroCreationData {
  name: string;
  heroClass: 'Warrior' | 'Mage' | 'Ranger' | 'Worg';
  appearance: number; // Index into appearance options
}

export class SceneManager {
  private currentScene: GameScene = 'loading';
  private previousScene: GameScene = 'loading';
  private heroData: HeroCreationData | null = null;
  
  // Scene elements
  private loadingScreen: HTMLElement | null = null;
  private menuScreen: HTMLElement | null = null;
  private heroCreationScreen: HTMLElement | null = null;
  private pauseMenu: HTMLElement | null = null;
  private gameHUD: HTMLElement | null = null;
  
  // Callbacks
  public onSceneChange: ((from: GameScene, to: GameScene) => void) | null = null;
  public onHeroCreated: ((data: HeroCreationData) => void) | null = null;
  
  constructor() {}
  
  /**
   * Initialize scene manager with DOM elements
   */
  init(): void {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.menuScreen = document.getElementById('menuScreen');
    this.heroCreationScreen = document.getElementById('heroCreationScreen');
    this.pauseMenu = document.getElementById('pauseMenu');
    this.gameHUD = document.getElementById('hud');
    
    this.setupMenuListeners();
    this.setupHeroCreationListeners();
  }
  
  private setupMenuListeners(): void {
    document.getElementById('startGameBtn')?.addEventListener('click', () => {
      this.transitionTo('heroCreation');
    });
    
    document.getElementById('resumeBtn')?.addEventListener('click', () => {
      this.transitionTo('playing');
    });
  }
  
  private setupHeroCreationListeners(): void {
    // Class selection
    document.querySelectorAll('.class-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.class-option').forEach(b => b.classList.remove('selected'));
        (e.currentTarget as HTMLElement).classList.add('selected');
      });
    });
    
    // Confirm hero button
    document.getElementById('confirmHeroBtn')?.addEventListener('click', () => {
      const selectedClass = document.querySelector('.class-option.selected');
      const heroName = (document.getElementById('heroNameInput') as HTMLInputElement)?.value || 'Hero';
      
      if (selectedClass) {
        this.heroData = {
          name: heroName,
          heroClass: selectedClass.getAttribute('data-class') as HeroCreationData['heroClass'],
          appearance: 0
        };
        
        if (this.onHeroCreated) {
          this.onHeroCreated(this.heroData);
        }
        
        this.transitionTo('playing');
      }
    });
  }
  
  /**
   * Transition to a new scene
   */
  transitionTo(scene: GameScene): void {
    if (scene === this.currentScene) return;
    
    this.previousScene = this.currentScene;
    
    // Hide all screens
    this.hideAllScreens();
    
    // Show appropriate screen
    switch (scene) {
      case 'loading':
        this.showElement(this.loadingScreen);
        this.hideElement(this.gameHUD);
        break;
        
      case 'menu':
        this.showElement(this.menuScreen);
        this.hideElement(this.gameHUD);
        break;
        
      case 'heroCreation':
        this.showElement(this.heroCreationScreen);
        this.hideElement(this.gameHUD);
        break;
        
      case 'playing':
        this.showElement(this.gameHUD);
        this.hideElement(this.pauseMenu);
        break;
        
      case 'paused':
        this.showElement(this.pauseMenu);
        this.showElement(this.gameHUD);
        break;
    }
    
    this.currentScene = scene;
    
    if (this.onSceneChange) {
      this.onSceneChange(this.previousScene, scene);
    }
  }
  
  private hideAllScreens(): void {
    this.hideElement(this.loadingScreen);
    this.hideElement(this.menuScreen);
    this.hideElement(this.heroCreationScreen);
    this.hideElement(this.pauseMenu);
  }
  
  private showElement(el: HTMLElement | null): void {
    if (el) {
      el.style.display = 'flex';
      el.classList.add('visible');
    }
  }
  
  private hideElement(el: HTMLElement | null): void {
    if (el) {
      el.style.display = 'none';
      el.classList.remove('visible');
    }
  }
  
  togglePause(): void {
    if (this.currentScene === 'playing') {
      this.transitionTo('paused');
    } else if (this.currentScene === 'paused') {
      this.transitionTo('playing');
    }
  }
  
  // === GETTERS ===
  
  getCurrentScene(): GameScene {
    return this.currentScene;
  }
  
  getHeroData(): HeroCreationData | null {
    return this.heroData;
  }
  
  isPlaying(): boolean {
    return this.currentScene === 'playing';
  }
  
  isPaused(): boolean {
    return this.currentScene === 'paused';
  }
}

export const sceneManager = new SceneManager();
