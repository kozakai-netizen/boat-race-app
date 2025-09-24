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