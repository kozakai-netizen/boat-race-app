import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { generatePrediction } from '@/lib/prediction/predictionEngine'

/**
 * 住之江特化バックテストAPI
 * GET /api/backtest-suminoe
 */
export async function GET() {
  try {
    console.log('🏟️ [Suminoe Backtest] Starting Suminoe-specific backtest...')

    const supabase = createClient()

    // 住之江(venue_id=12)のレース結果のみ取得
    const { data: raceResults, error: resultsError } = await supabase
      .from('result')
      .select('*')
      .like('race_id', '%-12-%') // venue_id=12のみ
      .order('race_id')

    if (resultsError) {
      console.error('❌ [Suminoe Backtest] Error fetching results:', resultsError)
      return NextResponse.json({ error: resultsError.message }, { status: 500 })
    }

    if (!raceResults || raceResults.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No Suminoe race results found',
        totalRaces: 0
      })
    }

    console.log(`🏟️ [Suminoe Backtest] Found ${raceResults.length} Suminoe race results`)

    const backtestResults = []
    let processedCount = 0

    // 各住之江レースに対して予想生成と照合
    for (const result of raceResults) {
      try {
        // 住之江用モックエントリーデータ生成
        const mockEntries = generateSuminoeEntriesForRace(result.race_id)

        // 住之江特化予想生成
        const prediction = generatePrediction(mockEntries, 12) // venue_id=12

        // 上位5つの3連単を抽出
        const predictedTop5 = prediction.topCombinations.slice(0, 5).map(c => c.triple)

        // 実際の結果と照合
        const actualResult = result.triple
        const hit = predictedTop5.includes(actualResult)

        // 予想における実際の結果のランク
        const allCombinations = prediction.topCombinations
        const actualRank = allCombinations.findIndex(c => c.triple === actualResult) + 1

        backtestResults.push({
          raceId: result.race_id,
          actualResult,
          predictedTop5,
          hit,
          topProbability: prediction.topCombinations[0]?.probability || 0,
          actualRank: actualRank > 0 ? actualRank : 999,
          top1Prediction: prediction.topCombinations[0]?.triple,
          predictionScores: prediction.predictions.map(p => ({
            lane: p.lane,
            name: p.player_name,
            score: p.totalScore,
            rank: p.rank
          }))
        })

        processedCount++

        if (processedCount % 50 === 0) {
          console.log(`🔄 [Suminoe Backtest] Processed ${processedCount}/${raceResults.length} races`)
        }

      } catch (error) {
        console.error(`❌ [Suminoe Backtest] Error processing race ${result.race_id}:`, error)
        continue
      }
    }

    // 住之江特化分析
    const analysis = analyzeSuminoeResults(backtestResults)

    console.log(`✅ [Suminoe Backtest] Analysis completed: ${analysis.hits}/${analysis.totalRaces} hit rate: ${analysis.hitRate.toFixed(1)}%`)

    return NextResponse.json({
      success: true,
      venue: 'Suminoe (住之江)',
      venueId: 12,
      analysis,
      sampleResults: backtestResults.slice(0, 30), // 最初の30件
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Suminoe Backtest] Error:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * 住之江レース用のモックエントリーデータ生成
 * 住之江の特性を反映した選手データ
 */
function generateSuminoeEntriesForRace(raceId: string) {
  const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  let currentSeed = seed
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }

  const playerNames = [
    '住之江太郎', '大阪次郎', '関西三郎', '南港四郎', '難波五郎', '天王寺六郎'
  ]

  // 住之江特性: 1号艇有利、インが強い
  const grades = ['A1', 'A2', 'B1', 'B2']

  return Array.from({ length: 6 }, (_, i) => {
    const lane = i + 1

    // 住之江特性の調整
    let gradeIndex
    if (lane === 1) {
      // 1号艇はA1/A2が多い
      gradeIndex = Math.floor(random() * 2) // A1またはA2
    } else if (lane <= 3) {
      // 2-3号艇もそこそこ良いクラス
      gradeIndex = Math.floor(random() * 3) // A1/A2/B1
    } else {
      // 4-6号艇は全クラス均等
      gradeIndex = Math.floor(random() * 4)
    }

    // 勝率も艇番に応じて調整
    const baseWinRate = lane === 1 ? 6.0 :
                       lane <= 3 ? 5.5 : 5.0

    const nationalWinRate = baseWinRate + (random() * 1.5) - 0.5

    // 3連率も艇番に応じて調整
    const baseThreeRate = lane === 1 ? 45 :
                         lane <= 3 ? 35 : 25

    const threeRate = Math.floor(baseThreeRate + (random() * 20) - 5)

    return {
      lane,
      player_name: playerNames[i],
      player_grade: grades[gradeIndex],
      st_time: 0.13 + (lane * 0.005) + random() * 0.06, // 住之江は少し速め
      exhibition_time: 6.65 + (lane * 0.02) + random() * 0.30,
      motor_rate: 35 + random() * 20,
      two_rate: Math.floor(50 + random() * 20),
      three_rate: Math.max(15, threeRate),
      national_win_rate: Math.max(3.0, nationalWinRate),
      local_win_rate: nationalWinRate + (random() * 1.0) - 0.5,
      foul_count: random() < 0.1 ? 1 : 0, // 10%の確率でF持ち
      is_local: random() < 0.3 // 30%の確率で地元
    }
  })
}

/**
 * 住之江バックテスト結果の分析
 */
function analyzeSuminoeResults(results: any[]) {
  const totalRaces = results.length
  const hits = results.filter(r => r.hit).length
  const hitRate = (hits / totalRaces) * 100

  // コース別的中分析
  const courseAnalysis = Array.from({ length: 6 }, (_, i) => ({
    course: i + 1,
    predicted1st: 0,
    actual1st: 0,
    hitRate: 0
  }))

  results.forEach(result => {
    // 実際の1着
    const actual1st = parseInt(result.actualResult.split('-')[0])
    courseAnalysis[actual1st - 1].actual1st++

    // 予想1着
    const predicted1st = parseInt(result.top1Prediction?.split('-')[0] || '0')
    if (predicted1st > 0) {
      courseAnalysis[predicted1st - 1].predicted1st++
    }
  })

  // 各コースの的中率計算
  courseAnalysis.forEach(course => {
    if (course.predicted1st > 0) {
      const hits = results.filter(r => {
        const actualFirst = parseInt(r.actualResult.split('-')[0])
        const predictedFirst = parseInt(r.top1Prediction?.split('-')[0] || '0')
        return actualFirst === course.course && predictedFirst === course.course
      }).length
      course.hitRate = (hits / course.predicted1st) * 100
    }
  })

  // 確率分布分析
  const probabilityRanges = [
    { min: 0, max: 0.015, label: '0-1.5%' },
    { min: 0.015, max: 0.025, label: '1.5-2.5%' },
    { min: 0.025, max: 0.035, label: '2.5-3.5%' },
    { min: 0.035, max: 0.05, label: '3.5-5%' },
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

  return {
    totalRaces,
    hits,
    hitRate,
    averageProbability: results.reduce((sum, r) => sum + r.topProbability, 0) / results.length,
    courseAnalysis,
    probabilityDistribution,
    top5HitRate: (results.filter(r => r.hit).length / totalRaces) * 100,
    averageActualRank: results.reduce((sum, r) => sum + (r.actualRank === 999 ? 100 : r.actualRank), 0) / results.length
  }
}