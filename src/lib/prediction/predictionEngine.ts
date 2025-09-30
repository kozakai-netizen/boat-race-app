/**
 * 競艇予想エンジン
 * 6要素評価 + 場別特性を組み合わせた予想ロジック
 */

import { getVenueParams, getCourseMultiplier, getWeightAdjustment } from './venueParams'

export interface RacerEntry {
  lane: number
  player_name: string
  player_grade: 'A1' | 'A2' | 'B1' | 'B2'
  st_time: number
  exhibition_time: number
  motor_rate: number
  two_rate: number
  three_rate: number
  national_win_rate?: number
  local_win_rate?: number
  foul_count?: number
  is_local?: boolean
  // 決まり手データ（新規追加）
  kimarite_preference?: {
    nige: number      // 逃げ得意度 (0-100)
    makuri: number    // まくり得意度 (0-100)
    sashi: number     // 差し得意度 (0-100)
    makurisashi: number // まくり差し得意度 (0-100)
  }
  // コース別成績（新規追加）
  course_performance?: {
    course1_rate: number // 1コース勝率
    course2_rate: number // 2コース勝率
    course3_rate: number // 3コース勝率
    course4_rate: number // 4コース勝率
    course5_rate: number // 5コース勝率
    course6_rate: number // 6コース勝率
  }
  // 選手タイプ（新規追加）
  racer_type?: 'inner' | 'center' | 'outer' | 'balanced'
}

export interface PredictionResult {
  lane: number
  player_name: string
  baseScore: number
  adjustedScore: number
  courseBonus: number
  probability: number
  rank: number
  reasoning: string[]
}

export interface RacePrediction {
  venueId: number
  venueName: string
  predictions: PredictionResult[]
  topCombinations: {
    triple: string
    probability: number
    expectedValue?: number
  }[]
}

/**
 * 選手級別の基礎点数を取得
 */
function getGradeScore(grade: string): number {
  switch (grade) {
    case 'A1': return 10
    case 'A2': return 7
    case 'B1': return 5
    case 'B2': return 3
    default: return 5
  }
}

/**
 * 勝率による点数を計算
 */
function getWinRateScore(nationalRate: number = 5.0, localRate: number = 5.0): number {
  const national = Math.min(nationalRate * 0.8, 8) // 最大8点
  const local = Math.min(localRate * 0.6, 4) // 最大4点
  return national + local
}

/**
 * モーター成績による点数を計算
 */
function getMotorScore(motorRate: number, twoRate: number): number {
  const motor = Math.min((motorRate / 10) - 3, 3) // 30-60% → -2〜+3点
  const consistency = Math.min((twoRate / 20) - 2, 2) // 40-60% → 0〜+1点
  return motor + consistency
}

/**
 * 展示タイムによる点数を計算（順位ベース）
 */
function getExhibitionScore(rank: number): number {
  switch (rank) {
    case 1: return 3
    case 2: return 2
    case 3: return 1
    case 4: return 0
    case 5: return -1
    case 6: return -2
    default: return 0
  }
}

/**
 * スタートタイミングによる点数を計算
 */
function getStartScore(stTime: number): number {
  if (stTime <= 0.15) return 2
  if (stTime <= 0.17) return 1
  if (stTime <= 0.19) return 0
  return -1
}

/**
 * F持ちペナルティを計算
 */
function getFoulPenalty(foulCount: number = 0): number {
  return foulCount * -3 // 1本につき-3点
}

/**
 * 決まり手適性による得点を計算
 */
function getKimariteScore(entry: RacerEntry, course: number): number {
  if (!entry.kimarite_preference) return 0

  const pref = entry.kimarite_preference
  let score = 0

  // コース別の決まり手適性
  switch (course) {
    case 1: // 1コース：逃げが重要
      score = (pref.nige / 100) * 3
      break
    case 2: // 2コース：差しが重要
      score = (pref.sashi / 100) * 2 + (pref.nige / 100) * 1
      break
    case 3: // 3コース：まくり・まくり差しが重要
      score = (pref.makuri / 100) * 2 + (pref.makurisashi / 100) * 2
      break
    case 4: // 4コース：まくりが最重要
      score = (pref.makuri / 100) * 3 + (pref.makurisashi / 100) * 1
      break
    case 5: // 5コース：まくり・まくり差し
      score = (pref.makuri / 100) * 2 + (pref.makurisashi / 100) * 2
      break
    case 6: // 6コース：まくり差しが重要
      score = (pref.makurisashi / 100) * 3 + (pref.makuri / 100) * 1
      break
  }

  return Math.min(score, 3) // 最大3点
}

/**
 * コース別成績による得点を計算
 */
function getCoursePerformanceScore(entry: RacerEntry, course: number): number {
  if (!entry.course_performance) return 0

  const perf = entry.course_performance
  let courseRate = 0

  switch (course) {
    case 1: courseRate = perf.course1_rate; break
    case 2: courseRate = perf.course2_rate; break
    case 3: courseRate = perf.course3_rate; break
    case 4: courseRate = perf.course4_rate; break
    case 5: courseRate = perf.course5_rate; break
    case 6: courseRate = perf.course6_rate; break
  }

  // 勝率を点数に変換（0-40% → -2〜+2点）
  return Math.min(Math.max((courseRate - 20) / 5, -2), 2)
}

/**
 * 選手タイプとコースの相性スコア
 */
function getRacerTypeScore(entry: RacerEntry, course: number): number {
  if (!entry.racer_type) return 0

  const typeBonus = {
    inner: [3, 1, -1, -2, -2, -2],    // イン屋：1コース得意
    center: [-1, 2, 3, 2, 1, -1],     // センター屋：3-4コース得意
    outer: [-2, -1, 1, 2, 3, 2],      // アウト屋：5-6コース得意
    balanced: [1, 1, 1, 1, 1, 1]      // バランス型：どこでも平均的
  }

  return typeBonus[entry.racer_type][course - 1] || 0
}

/**
 * 各選手の基礎スコアを計算（選手特性データ統合版）
 */
function calculateBaseScore(entry: RacerEntry, exhibitionRank: number): number {
  const gradeScore = getGradeScore(entry.player_grade)
  const winRateScore = getWinRateScore(entry.national_win_rate, entry.local_win_rate)
  const motorScore = getMotorScore(entry.motor_rate, entry.two_rate)
  const exhibitionScore = getExhibitionScore(exhibitionRank)
  const startScore = getStartScore(entry.st_time)
  const foulPenalty = getFoulPenalty(entry.foul_count)

  // 🆕 選手特性スコア（コース別）
  const kimariteScore = getKimariteScore(entry, entry.lane)
  const coursePerformanceScore = getCoursePerformanceScore(entry, entry.lane)
  const racerTypeScore = getRacerTypeScore(entry, entry.lane)

  return gradeScore + winRateScore + motorScore + exhibitionScore + startScore + foulPenalty +
         kimariteScore + coursePerformanceScore + racerTypeScore
}

/**
 * 場別特性を適用したスコア調整
 */
function applyVenueAdjustments(
  baseScore: number,
  entry: RacerEntry,
  venueId: number,
  exhibitionRank: number
): { adjustedScore: number; courseBonus: number; reasoning: string[] } {
  const reasoning: string[] = []
  let adjustedScore = baseScore

  // コース別係数を適用
  const courseMultiplier = getCourseMultiplier(venueId, entry.lane)
  const courseBonus = baseScore * (courseMultiplier - 1.0)
  adjustedScore += courseBonus

  if (courseMultiplier !== 1.0) {
    reasoning.push(`${entry.lane}コース係数: ×${courseMultiplier.toFixed(1)}`)
  }

  // 要素別重要度調整
  const motorWeight = getWeightAdjustment(venueId, 'motor')
  const exhibitionWeight = getWeightAdjustment(venueId, 'exhibition')
  const startWeight = getWeightAdjustment(venueId, 'start')
  const gradeWeight = getWeightAdjustment(venueId, 'grade')
  const localWeight = getWeightAdjustment(venueId, 'local')

  // モーター重要度調整
  if (motorWeight !== 1.0) {
    const motorBonus = getMotorScore(entry.motor_rate, entry.two_rate) * (motorWeight - 1.0)
    adjustedScore += motorBonus
    reasoning.push(`モーター重視: +${motorBonus.toFixed(1)}`)
  }

  // 展示重要度調整
  if (exhibitionWeight !== 1.0) {
    const exhibitionBonus = getExhibitionScore(exhibitionRank) * (exhibitionWeight - 1.0)
    adjustedScore += exhibitionBonus
    reasoning.push(`展示重視: +${exhibitionBonus.toFixed(1)}`)
  }

  // スタート重要度調整
  if (startWeight !== 1.0) {
    const startBonus = getStartScore(entry.st_time) * (startWeight - 1.0)
    adjustedScore += startBonus
    reasoning.push(`スタート重視: +${startBonus.toFixed(1)}`)
  }

  // 地元選手ボーナス
  if (entry.is_local && localWeight > 1.0) {
    const localBonus = baseScore * (localWeight - 1.0) * 0.3 // 30%の影響
    adjustedScore += localBonus
    reasoning.push(`地元選手: +${localBonus.toFixed(1)}`)
  }

  return { adjustedScore, courseBonus, reasoning }
}

/**
 * スコアを確率に変換（温度パラメータ付きSoftmax）
 */
function convertToProbabilities(scores: number[], temperature: number = 5.0): number[] {
  // 温度パラメータで予想の極端さを調整（大きいほど平準化）
  const adjustedScores = scores.map(score => score / temperature)
  const maxScore = Math.max(...adjustedScores)
  const expScores = adjustedScores.map(score => Math.exp(score - maxScore))
  const sumExp = expScores.reduce((sum, exp) => sum + exp, 0)
  return expScores.map(exp => exp / sumExp)
}

/**
 * 展示タイム順位を計算
 */
function calculateExhibitionRanks(entries: RacerEntry[]): number[] {
  const sortedEntries = entries
    .map((entry, index) => ({ index, time: entry.exhibition_time }))
    .sort((a, b) => a.time - b.time)

  const ranks = new Array(entries.length)
  sortedEntries.forEach((entry, rank) => {
    ranks[entry.index] = rank + 1
  })
  return ranks
}

/**
 * メイン予想関数
 */
export function generatePrediction(
  entries: RacerEntry[],
  venueId: number
): RacePrediction {
  const venueParams = getVenueParams(venueId)
  const exhibitionRanks = calculateExhibitionRanks(entries)

  // 各選手のスコア計算
  const results: PredictionResult[] = entries.map((entry, index) => {
    const baseScore = calculateBaseScore(entry, exhibitionRanks[index])
    const { adjustedScore, courseBonus, reasoning } = applyVenueAdjustments(
      baseScore,
      entry,
      venueId,
      exhibitionRanks[index]
    )

    return {
      lane: entry.lane,
      player_name: entry.player_name,
      baseScore,
      adjustedScore,
      courseBonus,
      probability: 0, // 後で計算
      rank: 0, // 後で計算
      reasoning
    }
  })

  // 確率計算
  const scores = results.map(r => r.adjustedScore)
  const probabilities = convertToProbabilities(scores)

  // 確率とランキングを設定
  results.forEach((result, index) => {
    result.probability = probabilities[index]
  })

  // ランキング計算
  const sortedResults = [...results].sort((a, b) => b.probability - a.probability)
  sortedResults.forEach((result, index) => {
    result.rank = index + 1
  })

  // 上位3連単組み合わせ生成（簡易版）
  const topCombinations = generateTopCombinations(sortedResults)

  return {
    venueId,
    venueName: venueParams.name,
    predictions: results.sort((a, b) => a.lane - b.lane), // 艇番順にソート
    topCombinations
  }
}

/**
 * 上位3連単組み合わせを生成（簡易版）
 */
function generateTopCombinations(sortedResults: PredictionResult[]): RacePrediction['topCombinations'] {
  const combinations: RacePrediction['topCombinations'] = []

  // 上位3艇での組み合わせを生成
  for (let i = 0; i < Math.min(3, sortedResults.length); i++) {
    for (let j = 0; j < sortedResults.length; j++) {
      if (j === i) continue
      for (let k = 0; k < sortedResults.length; k++) {
        if (k === i || k === j) continue

        const first = sortedResults[i]
        const second = sortedResults[j]
        const third = sortedResults[k]

        const probability = first.probability * second.probability * third.probability
        const triple = `${first.lane}-${second.lane}-${third.lane}`

        combinations.push({ triple, probability })
      }
    }
  }

  // 確率順にソートして上位5つを返す
  return combinations
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
}