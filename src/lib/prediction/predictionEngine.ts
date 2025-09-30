/**
 * 競艇予想エンジン - シンプル点数制版
 * 複雑な統計手法を使わず、点数の足し算のみで予想
 */

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
}

export interface PredictionResult {
  lane: number
  player_name: string
  totalScore: number
  scoreBreakdown: string[]
  probability: number
  rank: number
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
 * シンプル点数制による選手評価
 */
function calculateSimpleScore(entry: RacerEntry, exhibitionRank: number, venueId: number): {
  totalScore: number
  scoreBreakdown: string[]
} {
  let score = 0
  const breakdown: string[] = []

  // 1. 選手級別（基礎点）
  const gradePoints = {
    'A1': 10,
    'A2': 7,
    'B1': 5,
    'B2': 3
  }
  const gradeScore = gradePoints[entry.player_grade]
  score += gradeScore
  breakdown.push(`級別${entry.player_grade}: ${gradeScore}点`)

  // 2. 全国勝率（Programs APIから取得、無い場合は3連率を代用）
  const nationalRate = entry.national_win_rate ?? (entry.three_rate * 0.25) // 3連率から推定
  let nationalScore = 0
  if (nationalRate >= 7.0) {
    nationalScore = 3
    breakdown.push(`全国勝率${nationalRate.toFixed(1)}: +3点`)
  } else if (nationalRate >= 6.0) {
    nationalScore = 2
    breakdown.push(`全国勝率${nationalRate.toFixed(1)}: +2点`)
  } else if (nationalRate >= 5.0) {
    nationalScore = 1
    breakdown.push(`全国勝率${nationalRate.toFixed(1)}: +1点`)
  } else {
    breakdown.push(`全国勝率${nationalRate.toFixed(1)}: +0点`)
  }
  score += nationalScore

  // 3. 3連率による実力評価（実データ使用）
  let threeRateScore = 0
  if (entry.three_rate >= 50) {
    threeRateScore = 3
    breakdown.push(`3連率${entry.three_rate}%: +3点`)
  } else if (entry.three_rate >= 40) {
    threeRateScore = 2
    breakdown.push(`3連率${entry.three_rate}%: +2点`)
  } else if (entry.three_rate >= 30) {
    threeRateScore = 1
    breakdown.push(`3連率${entry.three_rate}%: +1点`)
  } else {
    threeRateScore = -1
    breakdown.push(`3連率${entry.three_rate}%: -1点`)
  }
  score += threeRateScore

  // 4. モーター2連率
  let motorScore = 0
  if (entry.two_rate >= 40) {
    motorScore = 2
    breakdown.push(`モーター2連率${entry.two_rate}%: +2点`)
  } else if (entry.two_rate >= 35) {
    motorScore = 1
    breakdown.push(`モーター2連率${entry.two_rate}%: +1点`)
  } else if (entry.two_rate < 30) {
    motorScore = -1
    breakdown.push(`モーター2連率${entry.two_rate}%: -1点`)
  }
  score += motorScore

  // 5. 展示タイム
  let exhibitionScore = 0
  if (exhibitionRank === 1) {
    exhibitionScore = 2
    breakdown.push(`展示1位: +2点`)
  } else if (exhibitionRank <= 3) {
    exhibitionScore = 1
    breakdown.push(`展示${exhibitionRank}位: +1点`)
  } else if (exhibitionRank === 6) {
    exhibitionScore = -1
    breakdown.push(`展示最下位: -1点`)
  }
  score += exhibitionScore

  // 6. 平均ST
  let stScore = 0
  if (entry.st_time <= 0.15) {
    stScore = 1
    breakdown.push(`ST${entry.st_time}: +1点`)
  }
  if ((entry.foul_count || 0) > 0) {
    stScore = -3
    breakdown.push(`F持ち: -3点`)
  }
  score += stScore

  // 7. コース別補正（住之江のみ）
  let courseScore = 0
  if (venueId === 12) { // 住之江
    switch (entry.lane) {
      case 1:
        courseScore = 1
        breakdown.push(`1コース: +1点`)
        break
      case 2:
        courseScore = 0.5
        breakdown.push(`2コース: +0.5点`)
        break
      case 3:
      case 4:
        courseScore = 0
        break
      case 5:
      case 6:
        courseScore = -0.5
        breakdown.push(`${entry.lane}コース: -0.5点`)
        break
    }
  }
  score += courseScore

  return {
    totalScore: score,
    scoreBreakdown: breakdown
  }
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
 * 点数を確率に変換（シンプル比例配分）
 */
function convertToSimpleProbabilities(scores: number[]): number[] {
  // 最低点を0にするため、全体を底上げ
  const minScore = Math.min(...scores)
  const adjustedScores = scores.map(score => score - minScore + 1) // +1で0除算回避

  const totalScore = adjustedScores.reduce((sum, score) => sum + score, 0)
  return adjustedScores.map(score => score / totalScore)
}

/**
 * 上位3連単組み合わせを生成
 */
function generateTopCombinations(sortedResults: PredictionResult[]): RacePrediction['topCombinations'] {
  const combinations: RacePrediction['topCombinations'] = []

  // 上位3艇での全組み合わせを生成
  for (let i = 0; i < Math.min(3, sortedResults.length); i++) {
    for (let j = 0; j < sortedResults.length; j++) {
      if (j === i) continue
      for (let k = 0; k < sortedResults.length; k++) {
        if (k === i || k === j) continue

        const first = sortedResults[i]
        const second = sortedResults[j]
        const third = sortedResults[k]

        // 簡易確率計算（1着確率 × 適当な2着3着確率）
        const probability = first.probability * 0.3 * 0.2
        const triple = `${first.lane}-${second.lane}-${third.lane}`

        // 簡易EV計算（点数比率ベース）
        const totalScore = first.totalScore + second.totalScore + third.totalScore
        const expectedValue = 1.5 + (totalScore / 100) // 点数が高いほどEV高め

        combinations.push({ triple, probability, expectedValue })
      }
    }
  }

  // 確率順にソートして上位5つを返す
  return combinations
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
}

/**
 * メイン予想関数
 */
export function generatePrediction(
  entries: RacerEntry[],
  venueId: number
): RacePrediction {
  const exhibitionRanks = calculateExhibitionRanks(entries)

  // 各選手のスコア計算
  const results: PredictionResult[] = entries.map((entry, index) => {
    const { totalScore, scoreBreakdown } = calculateSimpleScore(entry, exhibitionRanks[index], venueId)

    return {
      lane: entry.lane,
      player_name: entry.player_name,
      totalScore,
      scoreBreakdown,
      probability: 0, // 後で計算
      rank: 0 // 後で計算
    }
  })

  // 確率計算（シンプル比例配分）
  const scores = results.map(r => r.totalScore)
  const probabilities = convertToSimpleProbabilities(scores)

  // 確率を設定
  results.forEach((result, index) => {
    result.probability = probabilities[index]
  })

  // ランキング計算（点数順）
  const sortedResults = [...results].sort((a, b) => b.totalScore - a.totalScore)
  sortedResults.forEach((result, index) => {
    result.rank = index + 1
  })

  // 上位3連単組み合わせ生成
  const topCombinations = generateTopCombinations(sortedResults)

  // 会場名取得
  const venueNames: Record<number, string> = {
    1: '桐生', 2: '戸田', 11: 'びわこ', 12: '住之江', 13: '尼崎', 22: '福岡'
  }

  return {
    venueId,
    venueName: venueNames[venueId] || `競艇場${venueId}`,
    predictions: results.sort((a, b) => a.lane - b.lane), // 艇番順にソート
    topCombinations
  }
}