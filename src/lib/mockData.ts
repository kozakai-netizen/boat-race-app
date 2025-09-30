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
/* レース出場選手情報を生成（未使用だがコメントアウト）
function generateRaceEntries(raceId: string) {
  const shuffledPlayers = [...MOCK_PLAYERS].sort(() => 0.5 - Math.random()).slice(0, 6)
  const shuffledMotors = [...MOTOR_CONDITIONS].sort(() => 0.5 - Math.random()).slice(0, 6)

  return shuffledPlayers.map((player, lane) => {
    const motor = shuffledMotors[lane]
    const stDeviation = (Math.random() - 0.5) * 0.06 // ±0.03の変動
    const actualST = Math.max(0.10, player.avgST + stDeviation)
    const exhibitionTime = 6.70 + Math.random() * 0.30 // 6.70-7.00秒

    return {
      race_id: raceId,
      lane: lane + 1,
      player_name: player.name,
      player_grade: player.grade,
      st_time: parseFloat(actualST.toFixed(2)),
      exhibition_time: parseFloat(exhibitionTime.toFixed(2)),
      motor_rate: motor.rate,
      motor_condition: motor.condition,
      motor_description: motor.description
    }
  })
}
*/

function generateTodayMockRaces() {
  const today = new Date().toISOString().split('T')[0]
  const races: Array<{
    race_id: string
    race_no: number
    close_at: string
    has_super: boolean
    icons: string[]
    exhibition_summary: {
      left_right_gap_max: number | null
      outer_inner_gap_min: number | null
    }
  }> = []

  for (let raceNo = 1; raceNo <= 12; raceNo++) {
    const now = new Date()
    // 現在時刻から30分間隔でレース時間を設定
    // 最初のレースは現在時刻の10分後から開始
    const baseTime = new Date(now.getTime() + (10 + (raceNo - 1) * 30) * 60 * 1000)

    const raceId = `${today}-12-${raceNo.toString().padStart(2, '0')}`

    races.push({
      race_id: raceId,
      race_no: raceNo,
      close_at: baseTime.toISOString(),
      has_super: Math.random() > 0.3, // 70% chance of having super picks
      icons: getRandomIcons(),
      exhibition_summary: {
        left_right_gap_max: 0.08 + Math.random() * 0.12, // 0.08 ~ 0.20
        outer_inner_gap_min: -0.25 + Math.random() * 0.15 // -0.25 ~ -0.10
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

// リアルな選手情報データベース
const MOCK_PLAYERS = [
  { name: '田中 信二', grade: 'A1', avgST: 0.15 },
  { name: '佐藤 花子', grade: 'A1', avgST: 0.16 },
  { name: '山田 一郎', grade: 'A2', avgST: 0.17 },
  { name: '鈴木 誠也', grade: 'A2', avgST: 0.18 },
  { name: '中村 美咲', grade: 'A2', avgST: 0.16 },
  { name: '高橋 太郎', grade: 'B1', avgST: 0.19 },
  { name: '伊藤 加奈', grade: 'B1', avgST: 0.18 },
  { name: '渡辺 健太', grade: 'B1', avgST: 0.20 },
  { name: '小林 さくら', grade: 'B1', avgST: 0.19 },
  { name: '加藤 拓也', grade: 'B2', avgST: 0.21 },
  { name: '吉田 麻里', grade: 'B2', avgST: 0.20 },
  { name: '松本 雄介', grade: 'B2', avgST: 0.22 },
  { name: '井上 愛', grade: 'A1', avgST: 0.14 },
  { name: '木村 慎一', grade: 'A2', avgST: 0.17 },
  { name: '斎藤 真由', grade: 'B1', avgST: 0.19 },
  { name: '清水 大輔', grade: 'B1', avgST: 0.18 },
  { name: '森田 優子', grade: 'A2', avgST: 0.16 },
  { name: '藤原 洋平', grade: 'B2', avgST: 0.21 },
  { name: '三浦 恵美', grade: 'B1', avgST: 0.20 },
  { name: '岡田 隆志', grade: 'A1', avgST: 0.15 }
]

// モーター調子データ
const MOTOR_CONDITIONS = [
  { rate: 55.2, condition: '◎', description: '絶好調' },
  { rate: 48.8, condition: '○', description: '好調' },
  { rate: 42.1, condition: '△', description: '普通' },
  { rate: 38.4, condition: '×', description: '不調' },
  { rate: 51.7, condition: '◎', description: '絶好調' },
  { rate: 45.3, condition: '○', description: '好調' },
  { rate: 40.9, condition: '△', description: '普通' },
  { rate: 36.2, condition: '×', description: '不調' }
]

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

  const triples = selected.map((combo, idx) => {
    const prob = Math.random() * 0.12 + 0.02 // 2-14%
    const ev = Math.random() * 2 + 0.8 // 0.8-2.8
    const odds = Math.random() * 80 + 10 // 10-90倍

    return {
      combo,
      prob,
      odds,
      ev,
      super: false, // 後で計算
      icons: getRandomIcons()
    }
  }).sort((a, b) => b.ev - a.ev) // Sort by EV desc

  // 改良版SUPER基準: 3つの条件を満たすもの
  const topCount = Math.max(2, Math.ceil(triples.length * 0.3)) // 上位30%（最低2件）

  triples.forEach((triple, index) => {
    const hasHighEV = triple.ev >= 1.5 // 💰 期待値が高い
    const hasRealisticChance = triple.prob >= 0.05 // 🎯 現実的な当選率
    const isTopInRace = index < topCount // ⭐ そのレースで特に狙い目

    triple.super = hasHighEV && hasRealisticChance && isTopInRace
  })

  return triples
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

// Generate realistic results for today's mock races
function generateTodayResultData() {
  const results: Array<{
    race_id: string
    triple: string
    payout: number
    popularity: number
    hit: 'win' | 'inTop' | 'miss' | 'ref'
  }> = []

  // Realistic boat race results based on actual Suminoe patterns
  const realisticResults = [
    { triple: '1-3-2', payout: 580, popularity: 1 },
    { triple: '1-2-4', payout: 1240, popularity: 3 },
    { triple: '2-1-3', payout: 2890, popularity: 7 },
    { triple: '1-3-5', payout: 3450, popularity: 8 },
    { triple: '3-1-2', payout: 1820, popularity: 4 },
    { triple: '1-2-6', payout: 4560, popularity: 12 },
    { triple: '2-3-1', payout: 6780, popularity: 15 },
    { triple: '1-4-2', payout: 8950, popularity: 18 },
    { triple: '4-1-3', payout: 12400, popularity: 23 },
    { triple: '1-5-2', payout: 15600, popularity: 28 },
    { triple: '3-2-5', payout: 18700, popularity: 32 },
    { triple: '2-4-6', payout: 24500, popularity: 41 }
  ]

  MOCK_RACES_TODAY.forEach((race, idx) => {
    const result = realisticResults[idx]

    results.push({
      race_id: race.race_id,
      triple: result.triple,
      payout: result.payout,
      popularity: result.popularity,
      hit: 'ref' // All results are reference since races haven't finished
    })
  })

  return results
}

export const MOCK_RESULTS_TODAY = generateTodayResultData()