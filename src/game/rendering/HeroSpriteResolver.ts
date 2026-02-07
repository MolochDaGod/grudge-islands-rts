// ============================================
// HERO SPRITE RESOLVER
// Maps race + class (+ optional form) + state -> sprite path
// Uses renamed files in: sprites/heroes/uuidsprites/dist/sprites/characters
// ============================================

import type { RaceId } from '../config/GameConfig.ts';

export type HeroForm = 'normal' | 'werebear' | 'werewolf';
export type HeroAnimState =
  | 'idle' | 'walk' | 'run' | 'dash'
  | 'attack' | 'jab' | 'uppercut'
  | 'crouch' | 'jump' | 'hurt' | 'death';

// Base path where Vite copies the assets
const BASE = './assets/heroes/characters';

// Vite will inline a mapping of available assets at build time
// We only care about the file path keys
// @ts-ignore - Vite-specific import.meta.glob
const allHeroAssets: Record<string, string> = (import.meta as any).glob?.(
  '/**/assets/heroes/characters/**/*.{gif,png}',
  { as: 'url', eager: true }
) || {};

// Allowed tokens
const RACES: RaceId[] = ['human', 'elf', 'dwarf', 'orc', 'undead', 'barbarian'];
const CLASSES = ['Warrior', 'Mage', 'Ranger', 'Worg'] as const;
// Form constants for reference
const _FORMS: HeroForm[] = ['normal', 'werebear', 'werewolf'];
void _FORMS; // Used in FORM_ALIASES below

// State aliases encountered in the uuidsprites pack
const STATE_ALIASES: Record<string, HeroAnimState> = {
  idle: 'idle',
  stand: 'idle',
  walk: 'walk',
  run: 'run',
  move: 'walk',
  dash: 'dash',
  jab: 'jab',
  punch: 'jab',
  uppercut: 'uppercut',
  attack: 'attack',
  atk: 'attack',
  swing: 'attack',
  crouch: 'crouch',
  jump: 'jump',
  hurt: 'hurt',
  hit: 'hurt',
  death: 'death',
  dead: 'death',
};

// Form aliases
const FORM_ALIASES: Record<string, HeroForm> = {
  normal: 'normal',
  base: 'normal',
  human: 'normal',
  werebear: 'werebear',
  bear: 'werebear',
  bearform: 'werebear',
  werewolf: 'werewolf',
  wolf: 'werewolf',
  wolfform: 'werewolf',
};

// Parse a filename like: human_warrior_idle.gif or dwarf-Warrior-walk.gif
function parseTokensFromBasename(basename: string): {
  race?: RaceId;
  heroClass?: typeof CLASSES[number];
  form?: HeroForm;
  state?: HeroAnimState;
} {
  const name = basename.toLowerCase().replace(/\.(gif|png)$/i, '');
  const tokens = name.split(/[-_.\s]+/g);

  let race: RaceId | undefined;
  let form: HeroForm | undefined;
  let heroClass: typeof CLASSES[number] | undefined;
  let state: HeroAnimState | undefined;

  for (const t of tokens) {
    // race
    if (!race && (RACES as string[]).includes(t)) {
      race = t as RaceId;
      continue;
    }
    // class (case-insensitive)
    if (!heroClass) {
      const match = (CLASSES as readonly string[]).find(c => c.toLowerCase() === t);
      if (match) { heroClass = match as typeof CLASSES[number]; continue; }
    }
    // form
    if (!form && FORM_ALIASES[t]) {
      form = FORM_ALIASES[t];
      continue;
    }
    // state
    if (!state && STATE_ALIASES[t]) {
      state = STATE_ALIASES[t];
      continue;
    }
  }

  return { race, heroClass, form, state };
}

// Build an index: race -> class -> form -> state -> url
const index: Record<
  RaceId,
  Partial<Record<
    typeof CLASSES[number],
    Partial<Record<HeroForm, Partial<Record<HeroAnimState, string>>>>
  >>
> = {
  human: {}, elf: {}, dwarf: {}, orc: {}, undead: {}, barbarian: {},
};

(function buildIndex() {
  for (const [key, url] of Object.entries(allHeroAssets)) {
    // key is an absolute path; extract the basename
    const base = key.split(/[\\/]/).pop() || '';
    const { race, heroClass, form, state } = parseTokensFromBasename(base);
    if (!race || !heroClass || !state) continue;
    const useForm = form || 'normal';

    index[race] ||= {} as any;
    index[race][heroClass] ||= {} as any;
    index[race][heroClass]![useForm] ||= {} as any;
    // prefer not to overwrite if already present
    if (!index[race][heroClass]![useForm]![state]) {
      index[race][heroClass]![useForm]![state] = url;
    }
  }
})();

export function resolveHeroSprite(
  race: RaceId,
  heroClass: typeof CLASSES[number],
  form: HeroForm,
  state: HeroAnimState
): string | null {
  const byClass = index[race];
  if (!byClass) return null;
  const byForm = byClass[heroClass] || byClass['Worg'];
  if (!byForm) return null;
  const stateMap = byForm[form] || byForm['normal'];
  if (!stateMap) return null;
  return stateMap[state] || stateMap['idle'] || null;
}

export function getAvailableStates(
  race: RaceId,
  heroClass: typeof CLASSES[number],
  form: HeroForm
): HeroAnimState[] {
  const byClass = index[race];
  const byForm = byClass?.[heroClass]?.[form];
  return byForm ? (Object.keys(byForm) as HeroAnimState[]) : [];
}

export const HERO_SPRITE_BASE = BASE;
