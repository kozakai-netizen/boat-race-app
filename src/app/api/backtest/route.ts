import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { generatePrediction } from '@/lib/prediction/predictionEngine'

interface BacktestResult {
  raceId: string
  actualResult: string
  predictedTop3: string[]
  hit: boolean
  topProbability: number
  actualRank: number
}

interface BacktestSummary {
  totalRaces: number
  hits: number
  hitRate: number
  averageProbability: number
  probabilityDistribution: {
    range: string
    count: number
    hitRate: number
  }[]
  venueBreakdown: {
    [venueId: string]: {
      races: number
      hits: number
      hitRate: number
    }
  }
}

/**
 * バックテストAPI - 過去レース結果と予想の照合
 * GET /api/backtest
 */
export async function GET() {
  try {
    console.log('🧪 [Backtest] Starting backtest analysis...')

    const supabase = createClient()

    // 1. 全レース結果を取得
    const { data: raceResults, error: resultsError } = await supabase
      .from('result')
      .select('*')
      .order('race_id')

    if (resultsError) {
      console.error('❌ [Backtest] Error fetching race results:', resultsError)
      return NextResponse.json({ error: resultsError.message }, { status: 500 })
    }

    if (!raceResults || raceResults.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No race results found',
        totalRaces: 0
      })
    }

    console.log(`📊 [Backtest] Found ${raceResults.length} race results`)

    const backtestResults: BacktestResult[] = []
    let processedCount = 0

    // 2. 各レースに対して予想生成と照合
    for (const result of raceResults) {
      try {
        // レースIDから会場情報を解析
        const parts = result.race_id.split('-')
        if (parts.length !== 5) continue

        const venueId = parseInt(parts[3])

        // モックエントリーデータを生成（実際のPrograms APIデータがないため）
        const mockEntries = generateMockEntriesForRace(result.race_id)

        // 予想生成
        const prediction = generatePrediction(mockEntries, venueId)

        // 上位3つの3連単を抽出
        const predictedTop3 = prediction.topCombinations.slice(0, 3).map(c => c.triple)

        // 実際の結果と照合
        const actualResult = result.triple
        const hit = predictedTop3.includes(actualResult)

        // 最高確率の予想における実際の結果のランク
        const allCombinations = prediction.topCombinations
        const actualRank = allCombinations.findIndex(c => c.triple === actualResult) + 1

        backtestResults.push({
          raceId: result.race_id,
          actualResult,
          predictedTop3,
          hit,
          topProbability: prediction.topCombinations[0]?.probability || 0,
          actualRank: actualRank > 0 ? actualRank : 999 // 見つからない場合は999
        })

        processedCount++

        // 進捗表示
        if (processedCount % 100 === 0) {
          console.log(`🔄 [Backtest] Processed ${processedCount}/${raceResults.length} races`)
        }

      } catch (error) {
        console.error(`❌ [Backtest] Error processing race ${result.race_id}:`, error)
        continue
      }
    }

    // 3. 結果分析
    const summary = analyzeBacktestResults(backtestResults)

    console.log(`✅ [Backtest] Analysis completed: ${summary.hits}/${summary.totalRaces} hit rate: ${summary.hitRate.toFixed(1)}%`)

    return NextResponse.json({
      success: true,
      summary,
      details: backtestResults.slice(0, 20), // 最初の20件のみ返す
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Backtest] Error:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * レース用のモックエントリーデータ生成
 */
function generateMockEntriesForRace(raceId: string) {
  const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // シード付きランダム関数
  let currentSeed = seed
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }

  const playerNames = [
    '佐藤太郎', '田中次郎', '山田三郎', '鈴木四郎', '高橋五郎', '伊藤六郎'
  ]
  const grades = ['A1', 'A2', 'B1', 'B2']

  return Array.from({ length: 6 }, (_, i) => ({
    lane: i + 1,
    player_name: playerNames[i],
    player_grade: grades[Math.floor(random() * grades.length)],
    st_time: 0.14 + random() * 0.08,
    exhibition_time: 6.70 + random() * 0.40,
    motor_rate: 30 + random() * 25,
    two_rate: Math.floor(50 + random() * 25),
    three_rate: Math.floor(30 + random() * 25),
    national_win_rate: 4.5 + random() * 2.5,
    local_win_rate: 4.0 + random() * 3.0,
    foul_count: 0,
    is_local: false
  }))
}

/**
 * バックテスト結果の分析
 */
function analyzeBacktestResults(results: BacktestResult[]): BacktestSummary {
  const totalRaces = results.length
  const hits = results.filter(r => r.hit).length
  const hitRate = (hits / totalRaces) * 100

  // 確率分布分析
  const probabilityRanges = [
    { min: 0, max: 0.01, label: '0-1%' },
    { min: 0.01, max: 0.02, label: '1-2%' },
    { min: 0.02, max: 0.03, label: '2-3%' },
    { min: 0.03, max: 0.05, label: '3-5%' },
    { min: 0.05, max: 1, label: '5%+' }
  ]

  const probabilityDistribution = probabilityRanges.map(range => {
    const inRange = results.filter(r =>
      r.topProbability >= range.min && r.topProbability < range.max
    )
    const rangeHits = inRange.filter(r => r.hit).length

    return {
      range: range.label,
      count: inRange.length,
      hitRate: inRange.length > 0 ? (rangeHits / inRange.length) * 100 : 0
    }
  })

  // 会場別分析
  const venueBreakdown: { [venueId: string]: { races: number; hits: number; hitRate: number } } = {}

  results.forEach(result => {
    const venueId = result.raceId.split('-')[3]
    if (!venueBreakdown[venueId]) {
      venueBreakdown[venueId] = { races: 0, hits: 0, hitRate: 0 }
    }
    venueBreakdown[venueId].races++
    if (result.hit) venueBreakdown[venueId].hits++
  })

  // 各会場の的中率計算
  Object.keys(venueBreakdown).forEach(venueId => {
    const venue = venueBreakdown[venueId]
    venue.hitRate = (venue.hits / venue.races) * 100
  })

  return {
    totalRaces,
    hits,
    hitRate,
    averageProbability: results.reduce((sum, r) => sum + r.topProbability, 0) / results.length,
    probabilityDistribution,
    venueBreakdown
  }
}