// Mock data for testing when database is empty
export const MOCK_FORECAST_DATA = {
  'suminoye-TEST-1R': {
    race_id: 'suminoye-TEST-1R',
    triples: [
      {
        combo: '3-1-6',
        prob: 0.092,
        odds: 18.5,
        ev: 1.70,
        super: true,
        icons: ['🚀', '🎯', '🧱']
      },
      {
        combo: '1-3-6',
        prob: 0.078,
        odds: 21.2,
        ev: 1.65,
        super: true,
        icons: ['🧱', '🎯']
      },
      {
        combo: '3-6-1',
        prob: 0.065,
        odds: 28.4,
        ev: 1.85,
        super: true,
        icons: ['🚀', '⚡']
      },
      {
        combo: '1-6-3',
        prob: 0.052,
        odds: 35.6,
        ev: 1.85,
        super: false,
        icons: ['🧱']
      },
      {
        combo: '6-3-1',
        prob: 0.048,
        odds: 42.1,
        ev: 2.02,
        super: false,
        icons: ['⚡', '🎯']
      }
    ]
  }
}

export const MOCK_RACE_DATA = {
  'suminoe-TEST': [
    {
      race_id: 'suminoye-TEST-1R',
      race_no: 1,
      close_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      has_super: true,
      icons: ['🚀', '🎯'],
      exhibition_summary: {
        left_right_gap_max: 0.12,
        outer_inner_gap_min: -0.18
      }
    }
  ]
}

// Generate mock races for current date
function generateTodayMockRaces() {
  const today = new Date().toISOString().split('T')[0]
  const races: Array<{
    race_id: string
    race_no: number
    close_at: string
    has_super: boolean
    icons: string[]
    exhibition_summary: {
      left_right_gap_max: number
      outer_inner_gap_min: number
    }
  }> = []

  for (let raceNo = 1; raceNo <= 12; raceNo++) {
    const baseTime = new Date()
    baseTime.setHours(10 + raceNo, 45, 0, 0) // Race times from 11:45, 12:45, etc.

    const raceId = `suminoye-${today.replace(/-/g, '')}-${raceNo}R`

    races.push({
      race_id: raceId,
      race_no: raceNo,
      close_at: baseTime.toISOString(),
      has_super: Math.random() > 0.3, // 70% chance of having super picks
      icons: getRandomIcons(),
      exhibition_summary: {
        left_right_gap_max: Math.random() * 0.3,
        outer_inner_gap_min: -Math.random() * 0.4
      }
    })
  }

  return races
}

function getRandomIcons() {
  const allIcons = ['🚀', '💨', '🧱', '⚡', '🎯']
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 icons
  const shuffled = allIcons.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export const MOCK_RACES_TODAY = generateTodayMockRaces()

// Generate forecast data for today's mock races
function generateTodayForecastData() {
  const forecasts: Record<string, {
    race_id: string
    triples: Array<{
      combo: string
      prob: number
      odds: number
      ev: number
      super: boolean
      icons: string[]
    }>
  }> = {}

  MOCK_RACES_TODAY.forEach(race => {
    forecasts[race.race_id] = {
      race_id: race.race_id,
      triples: generateRandomTriples()
    }
  })

  return forecasts
}

function generateRandomTriples() {
  const combinations = [
    '1-2-3', '1-3-2', '2-1-3', '2-3-1', '3-1-2', '3-2-1',
    '1-2-4', '1-4-2', '2-1-4', '2-4-1', '4-1-2', '4-2-1',
    '1-3-4', '1-4-3', '3-1-4', '3-4-1', '4-1-3', '4-3-1',
    '2-3-4', '2-4-3', '3-2-4', '3-4-2', '4-2-3', '4-3-2',
    '1-2-5', '1-5-2', '2-1-5', '2-5-1', '5-1-2', '5-2-1',
    '1-3-5', '1-5-3', '3-1-5', '3-5-1', '5-1-3', '5-3-1'
  ]

  const selected = combinations.sort(() => 0.5 - Math.random()).slice(0, 8)

  return selected.map((combo, idx) => ({
    combo,
    prob: Math.random() * 0.12 + 0.02, // 2-14%
    odds: Math.random() * 80 + 10, // 10-90倍
    ev: Math.random() * 2 + 0.8, // 0.8-2.8
    super: idx < 3, // Top 3 are super
    icons: getRandomIcons()
  })).sort((a, b) => b.ev - a.ev) // Sort by EV desc
}

export const MOCK_FORECAST_DATA_TODAY = generateTodayForecastData()

export const MOCK_RESULT_DATA = {
  'suminoe-TEST': [
    {
      race_id: 'suminoye-TEST-1R',
      triple: '3-1-6',
      payout: 18500,
      popularity: 3,
      hit: 'win' as const
    }
  ]
}