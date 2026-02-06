// ============================================
// GRUDGE AUTH CLIENT
// Connects to grudgewarlords.com authentication API
// Supports login, guest mode, wallet authentication
// ============================================

// === TYPES ===

export interface GrudgeUser {
  grudgeId: string;
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  walletAddress?: string;
  faction?: string;
  avatarUrl?: string;
  isPremium: boolean;
  isGuest?: boolean;
  totalGold: number;
  totalCharacters: number;
  totalIslands: number;
  createdAt: string;
  token: string;
}

export interface AuthResult {
  success: boolean;
  user?: GrudgeUser;
  error?: string;
  message?: string;
}

export interface GrudgeCharacter {
  id: string;
  userId: string;
  accountId?: string;
  name: string;
  raceId: string;
  classId: string;
  faction?: string;
  level: number;
  xp: number;
  hp: number;
  energy: number;
  attributes: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
  equipment: Record<string, string>;
  inventory: string[];
  avatarUrl?: string;
  createdAt: number;
}

export interface CharacterSaveData {
  name: string;
  raceId: string;
  classId: string;
  level: number;
  xp: number;
  hp: number;
  energy: number;
  attributes: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
  equipment: Record<string, string>;
  inventory: string[];
  avatarUrl?: string;
  // RTS-specific hero data
  heroData?: {
    heroClass: string;
    position: { x: number; y: number };
    stats: Record<string, number>;
  };
}

// === CONSTANTS ===

// Production API on grudgewarlords.com
const API_BASE = 'https://grudgewarlords.com/api/grudge-auth';
const CHAR_API = 'https://grudgewarlords.com/api/characters';
const TOKEN_KEY = 'grudge_rts_auth_token';
const USER_KEY = 'grudge_rts_current_user';
const DEVICE_ID_KEY = 'grudge_rts_device_id';

// === AUTH CLIENT CLASS ===

class GrudgeAuthClient {
  private token: string | null = null;
  private user: GrudgeUser | null = null;
  private initialized: boolean = false;

  // === INITIALIZATION ===

  /**
   * Initialize auth client, restore session if available
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_KEY);
      
      if (userData) {
        this.user = JSON.parse(userData);
      }

      // Verify token is still valid
      if (this.token) {
        const valid = await this.verifyToken();
        if (!valid) {
          this.clearAuth();
        }
      }

      this.initialized = true;
      return this.isAuthenticated();
    } catch (error) {
      console.error('Auth init error:', error);
      this.initialized = true;
      return false;
    }
  }

  // === TOKEN MANAGEMENT ===

  private setAuth(token: string, user: GrudgeUser): void {
    this.token = token;
    this.user = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `rts_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // === AUTHENTICATION METHODS ===

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Login failed' };
      }

      const user: GrudgeUser = {
        grudgeId: result.grudgeId,
        userId: result.userId,
        username: result.username,
        displayName: result.displayName,
        walletAddress: result.walletAddress,
        isPremium: result.isPremium || false,
        isGuest: false,
        totalGold: 0,
        totalCharacters: 0,
        totalIslands: 0,
        createdAt: new Date().toISOString(),
        token: result.token,
      };

      this.setAuth(result.token, user);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Login as guest (creates temporary account)
   */
  async loginAsGuest(): Promise<AuthResult> {
    try {
      const deviceId = this.getOrCreateDeviceId();

      const response = await fetch(`${API_BASE}/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Guest login failed' };
      }

      const user: GrudgeUser = {
        grudgeId: result.grudgeId,
        userId: result.userId,
        username: result.username,
        displayName: result.displayName || 'Guest',
        isPremium: false,
        isGuest: true,
        totalGold: 500,
        totalCharacters: 0,
        totalIslands: 0,
        createdAt: new Date().toISOString(),
        token: result.token,
      };

      this.setAuth(result.token, user);
      return { success: true, user, message: result.message };
    } catch (error) {
      console.error('Guest login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Register a new GRUDGE ID
   */
  async register(data: {
    username: string;
    password: string;
    email?: string;
  }): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/grudge-id/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            source: 'grudge-islands-rts',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      const user: GrudgeUser = {
        grudgeId: result.grudgeId,
        userId: result.userId,
        username: result.username,
        displayName: result.displayName,
        email: result.email,
        isPremium: false,
        isGuest: false,
        totalGold: 500,
        totalCharacters: 0,
        totalIslands: 0,
        createdAt: new Date().toISOString(),
        token: result.token,
      };

      this.setAuth(result.token, user);
      return { success: true, user, message: result.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Verify the current token is valid
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_BASE}/verify`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` },
        });
      } catch {
        // Ignore errors on logout
      }
    }
    this.clearAuth();
  }

  // === USER STATE ===

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getCurrentUser(): GrudgeUser | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  // === CHARACTER/HERO MANAGEMENT ===

  /**
   * Fetch all characters for current user
   */
  async getCharacters(): Promise<GrudgeCharacter[]> {
    if (!this.token) return [];

    try {
      const response = await fetch(`${CHAR_API}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) return [];

      const result = await response.json();
      return result.characters || [];
    } catch (error) {
      console.error('Get characters error:', error);
      return [];
    }
  }

  /**
   * Create a new character (hero)
   */
  async createCharacter(data: CharacterSaveData): Promise<GrudgeCharacter | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${CHAR_API}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Create character error:', error);
        return null;
      }

      const result = await response.json();
      return result.character;
    } catch (error) {
      console.error('Create character error:', error);
      return null;
    }
  }

  /**
   * Update an existing character
   */
  async updateCharacter(characterId: string, data: Partial<CharacterSaveData>): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${CHAR_API}/${characterId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error('Update character error:', error);
      return false;
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(characterId: string): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${CHAR_API}/${characterId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Delete character error:', error);
      return false;
    }
  }

  /**
   * Get a specific character by ID
   */
  async getCharacter(characterId: string): Promise<GrudgeCharacter | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${CHAR_API}/${characterId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.character;
    } catch (error) {
      console.error('Get character error:', error);
      return null;
    }
  }
}

// === SINGLETON EXPORT ===

export const grudgeAuth = new GrudgeAuthClient();
export default grudgeAuth;
