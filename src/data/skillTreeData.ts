// ============================================
// SKILL TREE DATA
// Based on Grudge Warlords skill-tree-complete.html
// Classes: Warrior, Mage, Worg, Ranger
// ============================================

import type { SkillTree, SkillNode, SkillClass, SkillConnection } from '../types/skills.ts';

// === WARRIOR SKILL TREE ===
const WARRIOR_SKILLS: SkillNode[] = [
  // === TIER 1 - Starting Skills ===
  {
    id: 'warrior-power-strike',
    name: 'Power Strike',
    description: 'A powerful melee attack that deals increased damage.',
    icon: '⚔️',
    skillClass: 'warrior',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 15,
      staminaCost: 10,
      cooldown: 4,
      effects: [
        { type: 'damage', value: 50, scaling: { attribute: 'Strength', ratio: 1.5 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.15, cooldownReduction: 0.05 }
  },
  {
    id: 'warrior-tough-skin',
    name: 'Tough Skin',
    description: 'Increases physical defense permanently.',
    icon: '🛡️',
    skillClass: 'warrior',
    tier: 1,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 100 },
    prerequisites: [],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'defense', type: 'percent', value: 5, perLevel: 3 }
    ]
  },
  {
    id: 'warrior-battle-cry',
    name: 'Battle Cry',
    description: 'Intimidating shout that buffs allies and debuffs enemies.',
    icon: '📢',
    skillClass: 'warrior',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 20,
      staminaCost: 15,
      cooldown: 20,
      effects: [
        { type: 'buff', value: 15, duration: 10, radius: 200, target: 'ally' },
        { type: 'debuff', value: 10, duration: 8, radius: 200, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.1 }
  },

  // === TIER 2 ===
  {
    id: 'warrior-shield-bash',
    name: 'Shield Bash',
    description: 'Bash enemy with shield, stunning them briefly.',
    icon: '🔰',
    skillClass: 'warrior',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 200 },
    prerequisites: ['warrior-power-strike'],
    pointCost: 1,
    activeEffect: {
      manaCost: 25,
      staminaCost: 20,
      cooldown: 8,
      effects: [
        { type: 'damage', value: 30, scaling: { attribute: 'Strength', ratio: 0.8 }, target: 'enemy' },
        { type: 'debuff', value: 100, duration: 1.5, target: 'enemy' } // Stun
      ]
    },
    levelScaling: { effectIncrease: 0.12 }
  },
  {
    id: 'warrior-armor-mastery',
    name: 'Armor Mastery',
    description: 'Reduces armor weight penalty and increases defense.',
    icon: '🦾',
    skillClass: 'warrior',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 200 },
    prerequisites: ['warrior-tough-skin'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'armor', type: 'flat', value: 10, perLevel: 5 },
      { stat: 'movementSpeed', type: 'percent', value: 2, perLevel: 1 }
    ]
  },
  {
    id: 'warrior-bloodlust',
    name: 'Bloodlust',
    description: 'Gain attack speed when dealing damage.',
    icon: '🩸',
    skillClass: 'warrior',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 200 },
    prerequisites: ['warrior-battle-cry'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'attackSpeed', type: 'percent', value: 5, perLevel: 3 }
    ]
  },

  // === TIER 3 ===
  {
    id: 'warrior-whirlwind',
    name: 'Whirlwind',
    description: 'Spin attack hitting all nearby enemies.',
    icon: '🌀',
    skillClass: 'warrior',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 300 },
    prerequisites: ['warrior-shield-bash', 'warrior-armor-mastery'],
    pointCost: 2,
    activeEffect: {
      manaCost: 40,
      staminaCost: 30,
      cooldown: 12,
      effects: [
        { type: 'damage', value: 80, scaling: { attribute: 'Strength', ratio: 1.2 }, radius: 150, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.18 }
  },
  {
    id: 'warrior-taunt',
    name: 'Taunt',
    description: 'Force enemies to attack you.',
    icon: '😤',
    skillClass: 'warrior',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 300 },
    prerequisites: ['warrior-armor-mastery', 'warrior-bloodlust'],
    pointCost: 2,
    activeEffect: {
      manaCost: 30,
      staminaCost: 20,
      cooldown: 15,
      effects: [
        { type: 'debuff', value: 0, duration: 5, radius: 250, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.1 }
  },

  // === TIER 4 ===
  {
    id: 'warrior-execute',
    name: 'Execute',
    description: 'Powerful finisher that deals bonus damage to low health enemies.',
    icon: '⚡',
    skillClass: 'warrior',
    tier: 4,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 400 },
    prerequisites: ['warrior-whirlwind'],
    pointCost: 3,
    activeEffect: {
      manaCost: 50,
      staminaCost: 40,
      cooldown: 18,
      effects: [
        { type: 'damage', value: 150, scaling: { attribute: 'Strength', ratio: 2.0 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.2 }
  },
  {
    id: 'warrior-iron-will',
    name: 'Iron Will',
    description: 'Greatly increases all defensive stats.',
    icon: '💪',
    skillClass: 'warrior',
    tier: 4,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 400 },
    prerequisites: ['warrior-taunt'],
    pointCost: 3,
    passiveModifiers: [
      { stat: 'defense', type: 'percent', value: 10, perLevel: 4 },
      { stat: 'ccResistance', type: 'percent', value: 10, perLevel: 5 },
      { stat: 'health', type: 'percent', value: 5, perLevel: 3 }
    ]
  },

  // === TIER 5 - Ultimate ===
  {
    id: 'warrior-avatar-of-war',
    name: 'Avatar of War',
    description: 'Transform into an unstoppable warrior, massively increasing all combat stats.',
    icon: '🔥',
    skillClass: 'warrior',
    tier: 5,
    nodeType: 'ultimate',
    maxLevel: 3,
    currentLevel: 0,
    position: { x: 350, y: 500 },
    prerequisites: ['warrior-execute', 'warrior-iron-will'],
    pointCost: 5,
    activeEffect: {
      manaCost: 100,
      staminaCost: 80,
      cooldown: 120,
      effects: [
        { type: 'buff', value: 50, duration: 15, target: 'self' }
      ]
    },
    levelScaling: { effectIncrease: 0.25 }
  }
];

// === MAGE SKILL TREE ===
const MAGE_SKILLS: SkillNode[] = [
  // === TIER 1 ===
  {
    id: 'mage-fireball',
    name: 'Fireball',
    description: 'Launch a ball of fire that explodes on impact.',
    icon: '🔥',
    skillClass: 'mage',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 25,
      staminaCost: 5,
      cooldown: 5,
      effects: [
        { type: 'damage', value: 60, scaling: { attribute: 'Intellect', ratio: 1.8 }, radius: 80, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.18 }
  },
  {
    id: 'mage-arcane-shield',
    name: 'Arcane Shield',
    description: 'Create a barrier that absorbs damage.',
    icon: '🛡️',
    skillClass: 'mage',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 40,
      staminaCost: 0,
      cooldown: 20,
      effects: [
        { type: 'buff', value: 100, scaling: { attribute: 'Intellect', ratio: 2.0 }, duration: 10, target: 'self' }
      ]
    },
    levelScaling: { effectIncrease: 0.2 }
  },
  {
    id: 'mage-mana-mastery',
    name: 'Mana Mastery',
    description: 'Increases maximum mana and mana regeneration.',
    icon: '💫',
    skillClass: 'mage',
    tier: 1,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 100 },
    prerequisites: [],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'mana', type: 'percent', value: 8, perLevel: 4 },
      { stat: 'manaRegen', type: 'flat', value: 1, perLevel: 0.5 }
    ]
  },

  // === TIER 2 ===
  {
    id: 'mage-frost-nova',
    name: 'Frost Nova',
    description: 'Freeze enemies around you.',
    icon: '❄️',
    skillClass: 'mage',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 200 },
    prerequisites: ['mage-fireball'],
    pointCost: 1,
    activeEffect: {
      manaCost: 35,
      staminaCost: 5,
      cooldown: 12,
      effects: [
        { type: 'damage', value: 40, scaling: { attribute: 'Intellect', ratio: 1.2 }, radius: 120, target: 'area' },
        { type: 'debuff', value: 50, duration: 3, radius: 120, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.15 }
  },
  {
    id: 'mage-lightning-bolt',
    name: 'Lightning Bolt',
    description: 'Strike enemy with lightning, chaining to nearby foes.',
    icon: '⚡',
    skillClass: 'mage',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 200 },
    prerequisites: ['mage-arcane-shield'],
    pointCost: 1,
    activeEffect: {
      manaCost: 30,
      staminaCost: 5,
      cooldown: 6,
      effects: [
        { type: 'damage', value: 55, scaling: { attribute: 'Intellect', ratio: 1.5 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.16 }
  },
  {
    id: 'mage-spell-power',
    name: 'Spell Power',
    description: 'Increases all spell damage.',
    icon: '📖',
    skillClass: 'mage',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 200 },
    prerequisites: ['mage-mana-mastery'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'damage', type: 'percent', value: 8, perLevel: 4 }
    ]
  },

  // === TIER 3 ===
  {
    id: 'mage-meteor',
    name: 'Meteor',
    description: 'Call down a devastating meteor from the sky.',
    icon: '☄️',
    skillClass: 'mage',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 300 },
    prerequisites: ['mage-frost-nova', 'mage-lightning-bolt'],
    pointCost: 2,
    activeEffect: {
      manaCost: 80,
      staminaCost: 10,
      cooldown: 25,
      castTime: 1.5,
      effects: [
        { type: 'damage', value: 200, scaling: { attribute: 'Intellect', ratio: 2.5 }, radius: 150, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.22 }
  },
  {
    id: 'mage-teleport',
    name: 'Teleport',
    description: 'Instantly teleport to target location.',
    icon: '✨',
    skillClass: 'mage',
    tier: 3,
    nodeType: 'active',
    maxLevel: 3,
    currentLevel: 0,
    position: { x: 425, y: 300 },
    prerequisites: ['mage-lightning-bolt', 'mage-spell-power'],
    pointCost: 2,
    activeEffect: {
      manaCost: 50,
      staminaCost: 0,
      cooldown: 15,
      effects: [
        { type: 'dash', value: 300, target: 'self' }
      ]
    },
    levelScaling: { cooldownReduction: 0.15 }
  },

  // === TIER 4 ===
  {
    id: 'mage-arcane-explosion',
    name: 'Arcane Explosion',
    description: 'Release pure arcane energy in all directions.',
    icon: '💥',
    skillClass: 'mage',
    tier: 4,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 400 },
    prerequisites: ['mage-meteor'],
    pointCost: 3,
    activeEffect: {
      manaCost: 100,
      staminaCost: 15,
      cooldown: 30,
      effects: [
        { type: 'damage', value: 180, scaling: { attribute: 'Intellect', ratio: 2.2 }, radius: 200, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.2 }
  },
  {
    id: 'mage-archmage',
    name: 'Archmage',
    description: 'Master of all magical arts. Greatly increases all magic stats.',
    icon: '🧙',
    skillClass: 'mage',
    tier: 4,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 400 },
    prerequisites: ['mage-teleport'],
    pointCost: 3,
    passiveModifiers: [
      { stat: 'damage', type: 'percent', value: 12, perLevel: 5 },
      { stat: 'cooldownReduction', type: 'percent', value: 5, perLevel: 2 },
      { stat: 'mana', type: 'percent', value: 10, perLevel: 4 }
    ]
  },

  // === TIER 5 - Ultimate ===
  {
    id: 'mage-elemental-fury',
    name: 'Elemental Fury',
    description: 'Unleash the combined power of fire, ice, and lightning.',
    icon: '🌟',
    skillClass: 'mage',
    tier: 5,
    nodeType: 'ultimate',
    maxLevel: 3,
    currentLevel: 0,
    position: { x: 350, y: 500 },
    prerequisites: ['mage-arcane-explosion', 'mage-archmage'],
    pointCost: 5,
    activeEffect: {
      manaCost: 150,
      staminaCost: 20,
      cooldown: 90,
      effects: [
        { type: 'damage', value: 500, scaling: { attribute: 'Intellect', ratio: 4.0 }, radius: 250, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.3 }
  }
];

// === WORG SKILL TREE ===
const WORG_SKILLS: SkillNode[] = [
  // === TIER 1 ===
  {
    id: 'worg-savage-bite',
    name: 'Savage Bite',
    description: 'Fierce bite attack that causes bleeding.',
    icon: '🦷',
    skillClass: 'worg',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 15,
      staminaCost: 15,
      cooldown: 4,
      effects: [
        { type: 'damage', value: 45, scaling: { attribute: 'Strength', ratio: 1.3 }, target: 'enemy' },
        { type: 'damage', value: 10, duration: 5, target: 'enemy' } // Bleed
      ]
    },
    levelScaling: { effectIncrease: 0.14 }
  },
  {
    id: 'worg-thick-fur',
    name: 'Thick Fur',
    description: 'Natural armor from dense fur.',
    icon: '🐺',
    skillClass: 'worg',
    tier: 1,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 100 },
    prerequisites: [],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'defense', type: 'percent', value: 4, perLevel: 2 },
      { stat: 'resistance', type: 'percent', value: 3, perLevel: 2 }
    ]
  },
  {
    id: 'worg-howl',
    name: 'Howl',
    description: 'Terrifying howl that buffs pack and fears enemies.',
    icon: '🌙',
    skillClass: 'worg',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 25,
      staminaCost: 10,
      cooldown: 25,
      effects: [
        { type: 'buff', value: 20, duration: 12, radius: 250, target: 'ally' },
        { type: 'debuff', value: 15, duration: 4, radius: 200, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.12 }
  },

  // === TIER 2 ===
  {
    id: 'worg-pounce',
    name: 'Pounce',
    description: 'Leap at enemy from distance.',
    icon: '💨',
    skillClass: 'worg',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 200 },
    prerequisites: ['worg-savage-bite'],
    pointCost: 1,
    activeEffect: {
      manaCost: 20,
      staminaCost: 20,
      cooldown: 8,
      effects: [
        { type: 'dash', value: 200, target: 'enemy' },
        { type: 'damage', value: 55, scaling: { attribute: 'Agility', ratio: 1.4 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.15 }
  },
  {
    id: 'worg-pack-hunter',
    name: 'Pack Hunter',
    description: 'Bonus damage when allies are nearby.',
    icon: '🐾',
    skillClass: 'worg',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 200 },
    prerequisites: ['worg-thick-fur'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'damage', type: 'percent', value: 6, perLevel: 3 }
    ]
  },
  {
    id: 'worg-feral-speed',
    name: 'Feral Speed',
    description: 'Increased movement and attack speed.',
    icon: '⚡',
    skillClass: 'worg',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 200 },
    prerequisites: ['worg-howl'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'movementSpeed', type: 'percent', value: 5, perLevel: 3 },
      { stat: 'attackSpeed', type: 'percent', value: 4, perLevel: 2 }
    ]
  },

  // === TIER 3 ===
  {
    id: 'worg-rend',
    name: 'Rend',
    description: 'Brutal attack that shreds armor.',
    icon: '💢',
    skillClass: 'worg',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 300 },
    prerequisites: ['worg-pounce', 'worg-pack-hunter'],
    pointCost: 2,
    activeEffect: {
      manaCost: 35,
      staminaCost: 30,
      cooldown: 10,
      effects: [
        { type: 'damage', value: 70, scaling: { attribute: 'Strength', ratio: 1.5 }, target: 'enemy' },
        { type: 'debuff', value: 25, duration: 8, target: 'enemy' } // Armor reduction
      ]
    },
    levelScaling: { effectIncrease: 0.16 }
  },
  {
    id: 'worg-primal-instinct',
    name: 'Primal Instinct',
    description: 'Enhanced senses grant evasion and critical chance.',
    icon: '👁️',
    skillClass: 'worg',
    tier: 3,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 300 },
    prerequisites: ['worg-pack-hunter', 'worg-feral-speed'],
    pointCost: 2,
    passiveModifiers: [
      { stat: 'evasion', type: 'percent', value: 5, perLevel: 2 },
      { stat: 'criticalChance', type: 'percent', value: 4, perLevel: 2 }
    ]
  },

  // === TIER 4 ===
  {
    id: 'worg-alpha-strike',
    name: 'Alpha Strike',
    description: 'Devastating combo attack.',
    icon: '🔥',
    skillClass: 'worg',
    tier: 4,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 400 },
    prerequisites: ['worg-rend'],
    pointCost: 3,
    activeEffect: {
      manaCost: 60,
      staminaCost: 50,
      cooldown: 20,
      effects: [
        { type: 'damage', value: 150, scaling: { attribute: 'Strength', ratio: 2.0 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.2 }
  },
  {
    id: 'worg-apex-predator',
    name: 'Apex Predator',
    description: 'Become the ultimate hunter.',
    icon: '🏆',
    skillClass: 'worg',
    tier: 4,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 400 },
    prerequisites: ['worg-primal-instinct'],
    pointCost: 3,
    passiveModifiers: [
      { stat: 'damage', type: 'percent', value: 10, perLevel: 4 },
      { stat: 'criticalDamage', type: 'percent', value: 12, perLevel: 5 },
      { stat: 'drainHealth', type: 'percent', value: 3, perLevel: 1.5 }
    ]
  },

  // === TIER 5 - Ultimate ===
  {
    id: 'worg-dire-transformation',
    name: 'Dire Transformation',
    description: 'Transform into a massive Dire Worg with incredible power.',
    icon: '🐺',
    skillClass: 'worg',
    tier: 5,
    nodeType: 'ultimate',
    maxLevel: 3,
    currentLevel: 0,
    position: { x: 350, y: 500 },
    prerequisites: ['worg-alpha-strike', 'worg-apex-predator'],
    pointCost: 5,
    activeEffect: {
      manaCost: 120,
      staminaCost: 100,
      cooldown: 100,
      effects: [
        { type: 'transform', value: 100, duration: 20, target: 'self' }
      ]
    },
    levelScaling: { effectIncrease: 0.25 }
  }
];

// === RANGER SKILL TREE ===
const RANGER_SKILLS: SkillNode[] = [
  // === TIER 1 ===
  {
    id: 'ranger-precise-shot',
    name: 'Precise Shot',
    description: 'Carefully aimed shot with high accuracy.',
    icon: '🎯',
    skillClass: 'ranger',
    tier: 1,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 100 },
    prerequisites: [],
    pointCost: 1,
    activeEffect: {
      manaCost: 15,
      staminaCost: 10,
      cooldown: 4,
      effects: [
        { type: 'projectile', value: 55, scaling: { attribute: 'Dexterity', ratio: 1.6 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.15 }
  },
  {
    id: 'ranger-nature-bond',
    name: 'Nature Bond',
    description: 'Connection to nature grants health regeneration.',
    icon: '🌿',
    skillClass: 'ranger',
    tier: 1,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 100 },
    prerequisites: [],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'healthRegen', type: 'flat', value: 2, perLevel: 1 },
      { stat: 'manaRegen', type: 'flat', value: 1, perLevel: 0.5 }
    ]
  },
  {
    id: 'ranger-evasive',
    name: 'Evasive',
    description: 'Natural agility allows dodging attacks.',
    icon: '💨',
    skillClass: 'ranger',
    tier: 1,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 100 },
    prerequisites: [],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'evasion', type: 'percent', value: 5, perLevel: 3 }
    ]
  },

  // === TIER 2 ===
  {
    id: 'ranger-multishot',
    name: 'Multishot',
    description: 'Fire multiple arrows at once.',
    icon: '🏹',
    skillClass: 'ranger',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 200, y: 200 },
    prerequisites: ['ranger-precise-shot'],
    pointCost: 1,
    activeEffect: {
      manaCost: 30,
      staminaCost: 15,
      cooldown: 8,
      effects: [
        { type: 'projectile', value: 35, scaling: { attribute: 'Dexterity', ratio: 1.0 }, radius: 100, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.14 }
  },
  {
    id: 'ranger-trap-master',
    name: 'Trap Master',
    description: 'Set traps that damage and slow enemies.',
    icon: '🪤',
    skillClass: 'ranger',
    tier: 2,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 350, y: 200 },
    prerequisites: ['ranger-nature-bond'],
    pointCost: 1,
    activeEffect: {
      manaCost: 25,
      staminaCost: 15,
      cooldown: 15,
      effects: [
        { type: 'damage', value: 40, scaling: { attribute: 'Dexterity', ratio: 0.8 }, target: 'area' },
        { type: 'debuff', value: 40, duration: 4, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.12 }
  },
  {
    id: 'ranger-steady-aim',
    name: 'Steady Aim',
    description: 'Increased critical chance and damage.',
    icon: '🔫',
    skillClass: 'ranger',
    tier: 2,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 500, y: 200 },
    prerequisites: ['ranger-evasive'],
    pointCost: 1,
    passiveModifiers: [
      { stat: 'criticalChance', type: 'percent', value: 5, perLevel: 3 },
      { stat: 'criticalDamage', type: 'percent', value: 8, perLevel: 4 }
    ]
  },

  // === TIER 3 ===
  {
    id: 'ranger-arrow-rain',
    name: 'Arrow Rain',
    description: 'Rain arrows down on a target area.',
    icon: '🌧️',
    skillClass: 'ranger',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 300 },
    prerequisites: ['ranger-multishot', 'ranger-trap-master'],
    pointCost: 2,
    activeEffect: {
      manaCost: 60,
      staminaCost: 25,
      cooldown: 18,
      effects: [
        { type: 'projectile', value: 100, scaling: { attribute: 'Dexterity', ratio: 1.5 }, radius: 180, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.18 }
  },
  {
    id: 'ranger-companion',
    name: 'Animal Companion',
    description: 'Summon a loyal beast companion.',
    icon: '🦅',
    skillClass: 'ranger',
    tier: 3,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 300 },
    prerequisites: ['ranger-trap-master', 'ranger-steady-aim'],
    pointCost: 2,
    activeEffect: {
      manaCost: 50,
      staminaCost: 20,
      cooldown: 60,
      effects: [
        { type: 'companion', value: 1, duration: 30, target: 'self' }
      ]
    },
    levelScaling: { effectIncrease: 0.2 }
  },

  // === TIER 4 ===
  {
    id: 'ranger-sniper-shot',
    name: 'Sniper Shot',
    description: 'Devastating long-range shot with guaranteed critical.',
    icon: '💀',
    skillClass: 'ranger',
    tier: 4,
    nodeType: 'active',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 275, y: 400 },
    prerequisites: ['ranger-arrow-rain'],
    pointCost: 3,
    activeEffect: {
      manaCost: 70,
      staminaCost: 40,
      cooldown: 25,
      castTime: 1.5,
      effects: [
        { type: 'projectile', value: 200, scaling: { attribute: 'Dexterity', ratio: 2.5 }, target: 'enemy' }
      ]
    },
    levelScaling: { effectIncrease: 0.22 }
  },
  {
    id: 'ranger-master-marksman',
    name: 'Master Marksman',
    description: 'Ultimate ranged combat mastery.',
    icon: '🏅',
    skillClass: 'ranger',
    tier: 4,
    nodeType: 'passive',
    maxLevel: 5,
    currentLevel: 0,
    position: { x: 425, y: 400 },
    prerequisites: ['ranger-companion'],
    pointCost: 3,
    passiveModifiers: [
      { stat: 'damage', type: 'percent', value: 10, perLevel: 4 },
      { stat: 'accuracy', type: 'percent', value: 10, perLevel: 5 },
      { stat: 'attackSpeed', type: 'percent', value: 6, perLevel: 3 }
    ]
  },

  // === TIER 5 - Ultimate ===
  {
    id: 'ranger-phoenix-arrow',
    name: 'Phoenix Arrow',
    description: 'Legendary arrow imbued with the spirit of the phoenix.',
    icon: '🔥',
    skillClass: 'ranger',
    tier: 5,
    nodeType: 'ultimate',
    maxLevel: 3,
    currentLevel: 0,
    position: { x: 350, y: 500 },
    prerequisites: ['ranger-sniper-shot', 'ranger-master-marksman'],
    pointCost: 5,
    activeEffect: {
      manaCost: 130,
      staminaCost: 60,
      cooldown: 80,
      effects: [
        { type: 'projectile', value: 400, scaling: { attribute: 'Dexterity', ratio: 4.0 }, radius: 120, target: 'area' }
      ]
    },
    levelScaling: { effectIncrease: 0.3 }
  }
];

// === SKILL CONNECTIONS ===
function generateConnections(skills: SkillNode[]): SkillConnection[] {
  const connections: SkillConnection[] = [];
  for (const skill of skills) {
    for (const prereqId of skill.prerequisites) {
      connections.push({ from: prereqId, to: skill.id });
    }
  }
  return connections;
}

// === SKILL TREES ===
export const WARRIOR_TREE: SkillTree = {
  skillClass: 'warrior',
  name: 'Warrior',
  description: 'Masters of melee combat and battlefield control. Warriors excel at leading the charge and protecting allies.',
  nodes: WARRIOR_SKILLS,
  connections: generateConnections(WARRIOR_SKILLS)
};

export const MAGE_TREE: SkillTree = {
  skillClass: 'mage',
  name: 'Mage',
  description: 'Wielders of arcane power. Mages devastate enemies with elemental magic and mystical barriers.',
  nodes: MAGE_SKILLS,
  connections: generateConnections(MAGE_SKILLS)
};

export const WORG_TREE: SkillTree = {
  skillClass: 'worg',
  name: 'Worg',
  description: 'Primal warriors with beast blood. Worgs combine savage attacks with pack hunting tactics.',
  nodes: WORG_SKILLS,
  connections: generateConnections(WORG_SKILLS)
};

export const RANGER_TREE: SkillTree = {
  skillClass: 'ranger',
  name: 'Ranger',
  description: 'Masters of ranged combat and survival. Rangers strike from afar with deadly precision.',
  nodes: RANGER_SKILLS,
  connections: generateConnections(RANGER_SKILLS)
};

export const ALL_SKILL_TREES: Record<SkillClass, SkillTree> = {
  warrior: WARRIOR_TREE,
  mage: MAGE_TREE,
  worg: WORG_TREE,
  ranger: RANGER_TREE
};

// === HELPER FUNCTIONS ===
export function getSkillTree(skillClass: SkillClass): SkillTree {
  return ALL_SKILL_TREES[skillClass];
}

export function getSkillById(skillId: string): SkillNode | undefined {
  for (const tree of Object.values(ALL_SKILL_TREES)) {
    const skill = tree.nodes.find(n => n.id === skillId);
    if (skill) return skill;
  }
  return undefined;
}

export function getAllSkills(): Map<string, SkillNode> {
  const skills = new Map<string, SkillNode>();
  for (const tree of Object.values(ALL_SKILL_TREES)) {
    for (const skill of tree.nodes) {
      skills.set(skill.id, skill);
    }
  }
  return skills;
}

export function getSkillsByTier(skillClass: SkillClass, tier: number): SkillNode[] {
  const tree = ALL_SKILL_TREES[skillClass];
  return tree.nodes.filter(n => n.tier === tier);
}

export function getActiveSkills(skillClass: SkillClass): SkillNode[] {
  const tree = ALL_SKILL_TREES[skillClass];
  return tree.nodes.filter(n => n.nodeType === 'active' || n.nodeType === 'ultimate');
}

export function getPassiveSkills(skillClass: SkillClass): SkillNode[] {
  const tree = ALL_SKILL_TREES[skillClass];
  return tree.nodes.filter(n => n.nodeType === 'passive' || n.nodeType === 'mastery');
}
