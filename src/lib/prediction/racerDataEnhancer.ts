/**
 * 選手データ拡張ユーティリティ
 * 既存の選手データに決まり手・コース別成績・タイプを推定して追加
 */

import type { RacerEntry } from './predictionEngine'

/**
 * 選手級別から基本的な決まり手傾向を推定
 */
function estimateKimariteFromGrade(grade: string): RacerEntry['kimarite_preference'] {
  switch (grade) {
    case 'A1':
      return { nige: 75, makuri: 70, sashi: 80, makurisashi: 65 } // オールラウンド高レベル
    case 'A2':
      return { nige: 65, makuri: 60, sashi: 70, makurisashi: 55 } // 差し中心
    case 'B1':
      return { nige: 55, makuri: 50, sashi: 60, makurisashi: 45 } // 標準的
    case 'B2':
      return { nige: 45, makuri: 40, sashi: 50, makurisashi: 35 } // 控えめ
    default:
      return { nige: 50, makuri: 50, sashi: 50, makurisashi: 50 }
  }
}

/**
 * モーター成績とST平均からコース別成績を推定
 */
function estimateCoursePerformance(
  grade: string,
  motorRate: number,
  stTime: number,
  twoRate: number
): RacerEntry['course_performance'] {
  // 基礎成績（級別ベース）
  const baseRates = {
    'A1': { course1: 30, course2: 25, course3: 20, course4: 18, course5: 15, course6: 12 },
    'A2': { course1: 25, course2: 22, course3: 18, course4: 15, course5: 12, course6: 10 },
    'B1': { course1: 20, course2: 18, course3: 15, course4: 12, course5: 10, course6: 8 },
    'B2': { course1: 15, course2: 14, course3: 12, course4: 10, course5: 8, course6: 6 }
  }

  const base = baseRates[grade as keyof typeof baseRates] || baseRates['B1']

  // ST性能による調整
  const stBonus = stTime <= 0.15 ? 3 : stTime <= 0.17 ? 1 : stTime >= 0.20 ? -2 : 0

  // モーター性能による調整
  const motorBonus = motorRate >= 55 ? 2 : motorRate >= 45 ? 0 : -2

  return {
    course1_rate: Math.max(base.course1 + stBonus + motorBonus, 5),
    course2_rate: Math.max(base.course2 + stBonus * 0.7 + motorBonus * 0.8, 5),
    course3_rate: Math.max(base.course3 + motorBonus * 1.2, 5),
    course4_rate: Math.max(base.course4 + motorBonus * 1.3, 5),
    course5_rate: Math.max(base.course5 + motorBonus * 1.1, 5),
    course6_rate: Math.max(base.course6 + motorBonus * 0.9, 5)
  }
}

/**
 * 各種データから選手タイプを推定
 */
function estimateRacerType(
  grade: string,
  stTime: number,
  motorRate: number,
  exhibitionTime: number
): RacerEntry['racer_type'] {
  // ST重視（イン屋の特徴）
  const isStrongStarter = stTime <= 0.16

  // モーター性能重視（センター屋の特徴）
  const hasGoodMotor = motorRate >= 50

  // 展示が遅め（アウト屋の特徴：展示では本気を出さない傾向）
  const conservativeExhibition = exhibitionTime >= 7.0

  // 高級別（バランス型の特徴）
  const isHighGrade = grade === 'A1'

  if (isStrongStarter && !conservativeExhibition) {
    return 'inner'
  } else if (hasGoodMotor && !isStrongStarter) {
    return 'center'
  } else if (conservativeExhibition && hasGoodMotor) {
    return 'outer'
  } else if (isHighGrade) {
    return 'balanced'
  } else {
    // デフォルト：grade + ST傾向で判定
    if (stTime <= 0.17) return 'inner'
    if (motorRate >= 50) return 'center'
    return 'outer'
  }
}

/**
 * 地元選手かどうかを判定（簡易版）
 */
function estimateIsLocal(playerName: string, venueId: number): boolean {
  // TODO: 実際の支部データベースと照合
  // 現在は名前の特徴で簡易判定（実装時は実際の支部データを使用）

  const localNames = {
    1: ['群馬', '前橋', '高崎'], // 桐生
    2: ['戸田', '埼玉', '大宮'], // 戸田
    11: ['滋賀', '大津', '彦根'], // びわこ
    12: ['大阪', '住之江', '堺'], // 住之江
    13: ['兵庫', '尼崎', '神戸'], // 尼崎
    22: ['福岡', '博多', '天神']  // 福岡
  }

  const localKeywords = localNames[venueId as keyof typeof localNames] || []
  return localKeywords.some(keyword => playerName.includes(keyword))
}

/**
 * 既存の選手データを拡張
 */
export function enhanceRacerEntry(
  entry: any,
  venueId: number,
  exhibitionRank: number
): RacerEntry {
  const enhanced: RacerEntry = {
    lane: entry.lane,
    player_name: entry.player_name,
    player_grade: entry.player_grade,
    st_time: entry.st_time,
    exhibition_time: entry.exhibition_time,
    motor_rate: entry.motor_rate,
    two_rate: entry.two_rate,
    three_rate: entry.three_rate,
    national_win_rate: 5.5, // デフォルト値（後で実データに）
    local_win_rate: 5.5,    // デフォルト値
    foul_count: 0,          // デフォルト値
    is_local: estimateIsLocal(entry.player_name, venueId),

    // 🆕 推定データ
    kimarite_preference: estimateKimariteFromGrade(entry.player_grade),
    course_performance: estimateCoursePerformance(
      entry.player_grade,
      entry.motor_rate,
      entry.st_time,
      entry.two_rate
    ),
    racer_type: estimateRacerType(
      entry.player_grade,
      entry.st_time,
      entry.motor_rate,
      entry.exhibition_time
    )
  }

  return enhanced
}

/**
 * 選手データ拡張の説明を生成
 */
export function getEnhancementExplanation(entry: RacerEntry): string[] {
  const explanations: string[] = []

  if (entry.kimarite_preference) {
    const pref = entry.kimarite_preference
    const maxPref = Math.max(pref.nige, pref.makuri, pref.sashi, pref.makurisashi)

    if (maxPref === pref.nige) explanations.push('逃げ得意')
    else if (maxPref === pref.makuri) explanations.push('まくり得意')
    else if (maxPref === pref.sashi) explanations.push('差し得意')
    else explanations.push('まくり差し得意')
  }

  if (entry.racer_type) {
    const typeNames = {
      inner: 'イン屋',
      center: 'センター屋',
      outer: 'アウト屋',
      balanced: 'オールラウンド'
    }
    explanations.push(typeNames[entry.racer_type])
  }

  if (entry.is_local) {
    explanations.push('地元選手')
  }

  return explanations
}