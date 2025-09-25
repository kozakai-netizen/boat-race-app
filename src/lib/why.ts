import { SimpleRaceEntry } from './types'
import { PLAYER_ICONS } from './constants'

export interface WhyBrief {
  icons: string[]
  summary: string
}

export interface MotorBadge {
  grade: '◎' | '○' | '△'
  color: string
  tooltip: string
}

// モーターバッジの判定
export function getMotorBadge(entry: SimpleRaceEntry): MotorBadge {
  const twoRate = entry.motor_rate
  const condition = entry.motor_condition

  // 簡易判定ルール
  if ((twoRate >= 45 && condition === '◎') || twoRate >= 50) {
    return {
      grade: '◎',
      color: 'bg-red-100 text-red-800 border-red-300',
      tooltip: `絶好調エンジン (${twoRate.toFixed(1)}% ${entry.motor_description})`
    }
  } else if (twoRate >= 38 || condition === '○') {
    return {
      grade: '○',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      tooltip: `好調エンジン (${twoRate.toFixed(1)}% ${entry.motor_description})`
    }
  } else {
    return {
      grade: '△',
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      tooltip: `普通エンジン (${twoRate.toFixed(1)}% ${entry.motor_description})`
    }
  }
}

// レース根拠の1行生成
export function generateWhyBrief(entries: SimpleRaceEntry[]): WhyBrief {
  if (!entries || entries.length === 0) {
    return {
      icons: [PLAYER_ICONS.DEFENSE],
      summary: 'データ不足'
    }
  }

  const icons: string[] = []
  let summary = ''

  // ST分析 (平均ST)
  const avgST = entries.reduce((sum, e) => sum + e.st_time, 0) / entries.length
  const lane1ST = entries.find(e => e.lane === 1)?.st_time || 0.20

  // 展示タイム分析
  const avgExhibition = entries.reduce((sum, e) => sum + e.exhibition_time, 0) / entries.length
  const bestExhibition = Math.min(...entries.map(e => e.exhibition_time))

  // モーター状況
  const strongMotors = entries.filter(e => e.motor_rate >= 45).length
  const strongMotorLanes = entries.filter(e => e.motor_rate >= 45).map(e => e.lane)

  // 根拠生成ロジック
  if (lane1ST <= 0.16 && lane1ST <= avgST - 0.02) {
    icons.push(PLAYER_ICONS.SPEED)
    summary = 'イン優位（ST有利）'
  } else if (strongMotors >= 2 && strongMotorLanes.some(l => l >= 4)) {
    icons.push(PLAYER_ICONS.POWER, PLAYER_ICONS.TECHNIQUE)
    summary = '外のまくり差し注意'
  } else if (bestExhibition < avgExhibition - 0.08) {
    const bestExhLane = entries.find(e => e.exhibition_time === bestExhibition)?.lane
    if (bestExhLane && bestExhLane <= 3) {
      icons.push(PLAYER_ICONS.TARGET)
      summary = 'インサイド展示好調'
    } else {
      icons.push(PLAYER_ICONS.POWER)
      summary = 'アウトサイド上昇'
    }
  } else if (strongMotors >= 3) {
    icons.push(PLAYER_ICONS.POWER)
    summary = 'エンジン戦'
  } else {
    icons.push(PLAYER_ICONS.DEFENSE)
    summary = '混戦模様'
  }

  // アイコンは最大3つに制限
  return {
    icons: icons.slice(0, 3),
    summary
  }
}

// 選手の級別表示用のバッジ色
export function getGradeBadgeColor(grade: string): string {
  switch (grade) {
    case 'A1':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'A2':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'B1':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'B2':
      return 'bg-gray-100 text-gray-700 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

// ST時間の表示色（速いほど緑、遅いほど赤）
export function getSTColor(stTime: number): string {
  if (stTime <= 0.15) return 'text-green-700 font-bold'
  if (stTime <= 0.17) return 'text-green-600'
  if (stTime <= 0.19) return 'text-yellow-600'
  if (stTime <= 0.21) return 'text-orange-600'
  return 'text-red-600'
}

// 展示タイムの表示色
export function getExhibitionColor(time: number): string {
  if (time <= 6.75) return 'text-green-700 font-bold'
  if (time <= 6.85) return 'text-green-600'
  if (time <= 6.95) return 'text-yellow-600'
  if (time <= 7.05) return 'text-orange-600'
  return 'text-red-600'
}