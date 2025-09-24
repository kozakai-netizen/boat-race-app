// Edge Config fallback values
export const SUPER_EV_MIN = parseFloat(process.env.SUPER_EV_MIN || '1.25')
export const SUPER_PROB_MIN = parseFloat(process.env.SUPER_PROB_MIN || '0.04')
export const EXH_LR_STRONG = parseFloat(process.env.EXH_LR_STRONG || '0.10')
export const EXH_OUTER_INNER_STRONG = parseFloat(process.env.EXH_OUTER_INNER_STRONG || '-0.15')
export const SERIES_CONF_K = parseInt(process.env.SERIES_CONF_K || '6')

// Icon mappings based on player characteristics
export const PLAYER_ICONS = {
  SPEED: '🚀',      // Fast start/speed
  POWER: '💨',      // Power/acceleration
  DEFENSE: '🧱',    // Defensive/stable
  TECHNIQUE: '⚡',   // Technique/skill
  TARGET: '🎯',     // High accuracy/precision
} as const

// Hit type icons for results
export const HIT_ICONS = {
  WIN: '🎯',
  IN_TOP: '⭕',
  MISS: '❌',
  REF: '△',
  win: '🎯',
  inTop: '⭕',
  miss: '❌',
  ref: '△',
} as const