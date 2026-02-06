// ============================================
// SCENE MANAGER
// Handles game flow: Loading → Menu → Character Creation → Map Selection → Playing
// ============================================

export type GameScene = 
  | 'loading' 
  | 'menu' 
  | 'login'
  | 'heroCreation' 
  | 'mapSelection'
  | 'playing' 
  | 'paused' 
  | 'homeIsland' 
  | 'victory' 
  | 'defeat';

export type MapType = 'worldMap' | 'pveRandom' | 'pveHard' | 'pveEasy';

export interface HeroCreationData {
  name: string;
  heroClass: 'Warrior' | 'Mage' | 'Ranger' | 'Worg';
  appearance: number;
}

export interface MapSelectionData {
  mapType: MapType;
  difficulty: number;
  seed?: number;
}

export interface PlayerSession {
  playerId: string;
  playerName: string;
  isGuest: boolean;
  heroData: HeroCreationData | null;
  selectedMap: MapSelectionData | null;
}

export class SceneManager {
  private currentScene: GameScene = 'loading';
  private previousScene: GameScene = 'loading';
  private heroData: HeroCreationData | null = null;
  private mapSelection: MapSelectionData | null = null;
  private session: PlayerSession | null = null;
  
  // Scene elements
  private loadingScreen: HTMLElement | null = null;
  private menuScreen: HTMLElement | null = null;
  private loginScreen: HTMLElement | null = null;
  private heroCreationScreen: HTMLElement | null = null;
  private mapSelectionScreen: HTMLElement | null = null;
  private pauseMenu: HTMLElement | null = null;
  private gameHUD: HTMLElement | null = null;
  
  // Callbacks
  public onSceneChange: ((from: GameScene, to: GameScene) => void) | null = null;
  public onHeroCreated: ((data: HeroCreationData) => void) | null = null;
  public onMapSelected: ((data: MapSelectionData) => void) | null = null;
  public onLogin: ((session: PlayerSession) => void) | null = null;
  
  constructor() {}
  
  /**
   * Initialize scene manager with DOM elements
   */
  init(): void {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.menuScreen = document.getElementById('menuScreen');
    this.loginScreen = document.getElementById('loginScreen');
    this.heroCreationScreen = document.getElementById('heroCreationScreen');
    this.mapSelectionScreen = document.getElementById('mapSelectionScreen');
    this.pauseMenu = document.getElementById('pauseMenu');
    this.gameHUD = document.getElementById('hud');
    
    // Create missing screens dynamically
    this.createDynamicScreens();
    
    this.setupMenuListeners();
    this.setupLoginListeners();
    this.setupHeroCreationListeners();
    this.setupMapSelectionListeners();
  }
  
  private createDynamicScreens(): void {
    // Create login screen if not present
    if (!this.loginScreen) {
      this.loginScreen = this.createScreen('loginScreen', this.getLoginScreenHTML());
    }
    
    // Create map selection screen if not present
    if (!this.mapSelectionScreen) {
      this.mapSelectionScreen = this.createScreen('mapSelectionScreen', this.getMapSelectionHTML());
    }
  }
  
  private createScreen(id: string, html: string): HTMLElement {
    const screen = document.createElement('div');
    screen.id = id;
    screen.className = 'game-screen';
    screen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0b1020 0%, #1a2040 100%);
      z-index: 50;
    `;
    screen.innerHTML = html;
    document.getElementById('gameContainer')?.appendChild(screen);
    return screen;
  }
  
  private getLoginScreenHTML(): string {
    return `
      <div class="login-panel" style="
        background: rgba(20, 26, 43, 0.95);
        border: 2px solid rgba(110, 231, 183, 0.3);
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        backdrop-filter: blur(10px);
        min-width: 400px;
      ">
        <h1 style="color: #6ee7b7; font-family: 'Cinzel', serif; margin-bottom: 30px;">⚔️ Grudge Islands</h1>
        
        <div style="margin-bottom: 20px;">
          <input type="text" id="playerNameInput" placeholder="Enter your name" style="
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(110, 231, 183, 0.3);
            border-radius: 8px;
            color: #e8eaf6;
            font-size: 16px;
            outline: none;
          " />
        </div>
        
        <button id="loginBtn" class="menu-btn" style="
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
          border: none;
          border-radius: 8px;
          color: #0b1020;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
        ">Continue</button>
        
        <button id="guestBtn" class="menu-btn-secondary" style="
          width: 100%;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid rgba(110, 231, 183, 0.3);
          border-radius: 8px;
          color: #a5b4d0;
          font-size: 14px;
          cursor: pointer;
        ">Play as Guest</button>
      </div>
    `;
  }
  
  private getMapSelectionHTML(): string {
    return `
      <div class="map-selection-panel" style="
        background: rgba(20, 26, 43, 0.95);
        border: 2px solid rgba(110, 231, 183, 0.3);
        border-radius: 16px;
        padding: 40px;
        backdrop-filter: blur(10px);
        min-width: 600px;
      ">
        <h2 style="color: #6ee7b7; font-family: 'Cinzel', serif; text-align: center; margin-bottom: 30px;">🗺️ Select Game Mode</h2>
        
        <div class="map-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="map-option" data-map="worldMap" style="
            padding: 24px;
            background: rgba(110, 231, 183, 0.1);
            border: 2px solid rgba(110, 231, 183, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 32px; margin-bottom: 8px;">🌍</div>
            <h3 style="color: #e8eaf6; margin-bottom: 4px;">World Map</h3>
            <p style="color: #a5b4d0; font-size: 12px;">Massive growing PvP world</p>
            <span style="
              display: inline-block;
              margin-top: 8px;
              padding: 2px 8px;
              background: #ef4444;
              color: white;
              border-radius: 4px;
              font-size: 10px;
            ">PVP</span>
          </div>
          
          <div class="map-option" data-map="pveRandom" style="
            padding: 24px;
            background: rgba(0, 0, 0, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 32px; margin-bottom: 8px;">🎲</div>
            <h3 style="color: #e8eaf6; margin-bottom: 4px;">Random PvE</h3>
            <p style="color: #a5b4d0; font-size: 12px;">Procedurally generated islands</p>
            <span style="
              display: inline-block;
              margin-top: 8px;
              padding: 2px 8px;
              background: #6ee7b7;
              color: #0b1020;
              border-radius: 4px;
              font-size: 10px;
            ">PVE</span>
          </div>
          
          <div class="map-option" data-map="pveEasy" style="
            padding: 24px;
            background: rgba(0, 0, 0, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
            <h3 style="color: #e8eaf6; margin-bottom: 4px;">Easy Campaign</h3>
            <p style="color: #a5b4d0; font-size: 12px;">Learn the basics</p>
            <span style="
              display: inline-block;
              margin-top: 8px;
              padding: 2px 8px;
              background: #4ade80;
              color: #0b1020;
              border-radius: 4px;
              font-size: 10px;
            ">EASY</span>
          </div>
          
          <div class="map-option" data-map="pveHard" style="
            padding: 24px;
            background: rgba(0, 0, 0, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 32px; margin-bottom: 8px;">💀</div>
            <h3 style="color: #e8eaf6; margin-bottom: 4px;">Hard Campaign</h3>
            <p style="color: #a5b4d0; font-size: 12px;">For experienced commanders</p>
            <span style="
              display: inline-block;
              margin-top: 8px;
              padding: 2px 8px;
              background: #ef4444;
              color: white;
              border-radius: 4px;
              font-size: 10px;
            ">HARD</span>
          </div>
        </div>
        
        <div style="margin-top: 24px; text-align: center;">
          <button id="backToHeroBtn" style="
            padding: 10px 24px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #a5b4d0;
            cursor: pointer;
          ">← Back</button>
        </div>
      </div>
    `;
  }
  
  private setupMenuListeners(): void {
    document.getElementById('startGameBtn')?.addEventListener('click', () => {
      this.transitionTo('login');
    });
    
    document.getElementById('resumeBtn')?.addEventListener('click', () => {
      this.transitionTo('playing');
    });
  }
  
  private setupLoginListeners(): void {
    // Use setTimeout to ensure DOM elements exist after dynamic creation
    setTimeout(() => {
      document.getElementById('loginBtn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('playerNameInput') as HTMLInputElement;
        const playerName = nameInput?.value?.trim() || 'Player';
        
        this.session = {
          playerId: `player_${Date.now()}`,
          playerName,
          isGuest: false,
          heroData: null,
          selectedMap: null
        };
        
        if (this.onLogin) {
          this.onLogin(this.session);
        }
        
        this.transitionTo('heroCreation');
      });
      
      document.getElementById('guestBtn')?.addEventListener('click', () => {
        this.session = {
          playerId: `guest_${Date.now()}`,
          playerName: 'Guest',
          isGuest: true,
          heroData: null,
          selectedMap: null
        };
        
        if (this.onLogin) {
          this.onLogin(this.session);
        }
        
        this.transitionTo('heroCreation');
      });
    }, 100);
  }
  
  private setupHeroCreationListeners(): void {
    // Class selection
    document.querySelectorAll('.class-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.class-option').forEach(b => b.classList.remove('selected'));
        (e.currentTarget as HTMLElement).classList.add('selected');
      });
    });
    
    // Confirm hero button -> go to map selection
    document.getElementById('confirmHeroBtn')?.addEventListener('click', () => {
      const selectedClass = document.querySelector('.class-option.selected');
      const heroNameInput = document.getElementById('heroNameInput') as HTMLInputElement;
      const heroName = heroNameInput?.value || this.session?.playerName || 'Hero';
      
      if (selectedClass) {
        this.heroData = {
          name: heroName,
          heroClass: selectedClass.getAttribute('data-class') as HeroCreationData['heroClass'],
          appearance: 0
        };
        
        if (this.session) {
          this.session.heroData = this.heroData;
        }
        
        if (this.onHeroCreated) {
          this.onHeroCreated(this.heroData);
        }
        
        // Go to map selection instead of directly to playing
        this.transitionTo('mapSelection');
      }
    });
  }
  
  private setupMapSelectionListeners(): void {
    setTimeout(() => {
      // Map option selection
      document.querySelectorAll('.map-option').forEach(option => {
        option.addEventListener('click', (e) => {
          const mapType = (e.currentTarget as HTMLElement).getAttribute('data-map') as MapType;
          
          // Visual selection
          document.querySelectorAll('.map-option').forEach(opt => {
            (opt as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            (opt as HTMLElement).style.background = 'rgba(0, 0, 0, 0.2)';
          });
          (e.currentTarget as HTMLElement).style.borderColor = '#6ee7b7';
          (e.currentTarget as HTMLElement).style.background = 'rgba(110, 231, 183, 0.2)';
          
          // Set map selection
          this.mapSelection = {
            mapType,
            difficulty: mapType === 'pveHard' ? 3 : mapType === 'pveEasy' ? 1 : 2,
            seed: Date.now()
          };
          
          if (this.session) {
            this.session.selectedMap = this.mapSelection;
          }
          
          if (this.onMapSelected) {
            this.onMapSelected(this.mapSelection);
          }
          
          // Start the game!
          this.transitionTo('playing');
        });
        
        // Hover effects
        option.addEventListener('mouseenter', (e) => {
          const el = e.currentTarget as HTMLElement;
          if (el.style.borderColor !== 'rgb(110, 231, 183)') {
            el.style.borderColor = 'rgba(110, 231, 183, 0.5)';
          }
        });
        
        option.addEventListener('mouseleave', (e) => {
          const el = e.currentTarget as HTMLElement;
          if (el.style.borderColor !== 'rgb(110, 231, 183)') {
            el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }
        });
      });
      
      // Back button
      document.getElementById('backToHeroBtn')?.addEventListener('click', () => {
        this.transitionTo('heroCreation');
      });
    }, 100);
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
        
      case 'login':
        this.showElement(this.loginScreen);
        this.hideElement(this.gameHUD);
        break;
        
      case 'heroCreation':
        this.showElement(this.heroCreationScreen);
        this.hideElement(this.gameHUD);
        break;
        
      case 'mapSelection':
        this.showElement(this.mapSelectionScreen);
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
        
      case 'homeIsland':
        this.showElement(this.gameHUD);
        break;
        
      case 'victory':
      case 'defeat':
        // Show end game screen (could create dynamically)
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
    this.hideElement(this.loginScreen);
    this.hideElement(this.heroCreationScreen);
    this.hideElement(this.mapSelectionScreen);
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
  
  getMapSelection(): MapSelectionData | null {
    return this.mapSelection;
  }
  
  getSession(): PlayerSession | null {
    return this.session;
  }
  
  isPlaying(): boolean {
    return this.currentScene === 'playing';
  }
  
  isPaused(): boolean {
    return this.currentScene === 'paused';
  }
  
  isInGame(): boolean {
    return this.currentScene === 'playing' || this.currentScene === 'homeIsland';
  }
  
  /**
   * Quick start for development - skip to playing
   */
  quickStart(heroClass: HeroCreationData['heroClass'] = 'Warrior', mapType: MapType = 'pveEasy'): void {
    this.session = {
      playerId: `dev_${Date.now()}`,
      playerName: 'Developer',
      isGuest: true,
      heroData: null,
      selectedMap: null
    };
    
    this.heroData = {
      name: 'DevHero',
      heroClass,
      appearance: 0
    };
    this.session.heroData = this.heroData;
    
    this.mapSelection = {
      mapType,
      difficulty: 1,
      seed: Date.now()
    };
    this.session.selectedMap = this.mapSelection;
    
    if (this.onHeroCreated) {
      this.onHeroCreated(this.heroData);
    }
    
    if (this.onMapSelected) {
      this.onMapSelected(this.mapSelection);
    }
    
    this.transitionTo('playing');
  }
}

export const sceneManager = new SceneManager();
