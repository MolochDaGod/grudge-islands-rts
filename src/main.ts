// ============================================
// GRUDGE ISLANDS RTS - MAIN ENTRY POINT
// ============================================

import { GameEngine } from './game/core/GameEngine.ts';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameEngine();
  game.init();
});
