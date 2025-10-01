import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import {
  generateWhyBrief,
  getMotorBadge,
  getGradeBadgeColor,
  getSTColor,
  getExhibitionColor
} from '@/lib/why'
import { SimpleRaceEntry } from '@/lib/types'
import type { NormalizedRacerEntry } from '@/types/programs'
import { fetchRaceEntriesFromRacerData } from '@/lib/racerData/racerDataAdapter'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

export async function GET(request: NextRequest) {
  console.info(`[API] race-entries - DATA_MODE: ${DATA_MODE}`)

  const { searchParams } = new URL(request.url)
  const raceId = searchParams.get('raceId')

  if (!raceId) {
    return NextResponse.json(
      { error: 'raceId parameter is required' },
      { status: 400 }
    )
  }

  try {
    // まずPrograms APIのリアルデータを試行
    let entries = await fetchRealEntries(raceId)

    // リアルデータがない場合はモックデータ生成
    if (entries.length === 0) {
      console.log(`[API] No real data found for ${raceId}, using mock data`)
      entries = generateMockEntries(raceId)
    } else {
      console.log(`[API] Using real data for ${raceId}: ${entries.length} entries`)
    }

    // API側で計算済みデータを生成
    const processedEntries = entries.map(entry => {
      const motorBadge = getMotorBadge(entry)
      const gradeBadgeColor = getGradeBadgeColor(entry.player_grade)
      const stColor = getSTColor(entry.st_time)
      const exhibitionColor = getExhibitionColor(entry.exhibition_time)
      const twoRate = Math.round(entry.motor_rate * 0.8 + (entry.lane * 3) + 15)
      const threeRate = Math.round(entry.motor_rate * 0.6 + (entry.lane * 2) + 8)

      return {
        ...entry,
        motor_badge: motorBadge,
        grade_badge_color: gradeBadgeColor,
        st_color: stColor,
        exhibition_color: exhibitionColor,
        two_rate: twoRate,
        three_rate: threeRate,
        // 外部リンクと写真用フィールド（データ取り込み用として保持）
        photo_path: null, // 現在は写真なし
        external_url: null // データ取り込み用として保持
      }
    })

    // レース根拠の生成
    const whyBrief = generateWhyBrief(entries)

    return NextResponse.json({
      entries: processedEntries,
      why_brief: whyBrief
    })

  } catch (error) {
    console.error('Error generating race entries:', error)
    return NextResponse.json(
      { error: 'Failed to generate race entries' },
      { status: 500 }
    )
  }
}

/**
 * racer_dataテーブルから実際の選手データを取得
 */
async function fetchRealEntries(raceId: string): Promise<SimpleRaceEntry[]> {
  try {
    console.log(`🏁 [race-entries API] Using racer_data for ${raceId}`)

    // racerDataAdapterを使用してracer_dataから選手を取得
    const racerEntries = await fetchRaceEntriesFromRacerData(raceId)

    if (!racerEntries || racerEntries.length === 0) {
      console.log(`🏁 [race-entries API] No racer_data found for ${raceId}`)
      return []
    }

    console.log(`🏁 [race-entries API] Found ${racerEntries.length} racers from racer_data`)

    // RacerEntry形式をSimpleRaceEntry形式に変換
    const entries: SimpleRaceEntry[] = racerEntries.map((entry) => {
      // モーター状態を推定
      const motorRate = entry.motor_rate || 35
      const motorCondition = motorRate >= 45 ? '◎' : motorRate >= 35 ? '○' : '△'
      const motorDescription = motorRate >= 45 ? '好調' : motorRate >= 35 ? '普通' : '整備'

      return {
        lane: entry.lane,
        player_name: entry.player_name,
        player_grade: entry.player_grade,
        st_time: entry.st_time,
        exhibition_time: entry.exhibition_time,
        motor_rate: motorRate,
        motor_condition: motorCondition,
        motor_description: motorDescription,
        // 後で上書きされる初期値
        motor_badge: { grade: '○', color: '', tooltip: '' },
        grade_badge_color: '',
        st_color: '',
        exhibition_color: '',
        two_rate: entry.two_rate,
        three_rate: entry.three_rate,
        national_win_rate: entry.national_win_rate,
        local_win_rate: entry.local_win_rate
      }
    })

    console.log(`🏁 [race-entries API] Converted to ${entries.length} SimpleRaceEntry format`)
    entries.forEach((entry, index) => {
      console.log(`🏁 [race-entries API]   Lane ${entry.lane}: ${entry.player_name} (${entry.player_grade})`)
    })

    return entries

  } catch (error) {
    console.error(`❌ [race-entries API] Error fetching from racer_data for ${raceId}:`, error)
    return []
  }
}

// モックデータ生成関数
function generateMockEntries(raceId: string): SimpleRaceEntry[] {
  // レースIDからシードを生成（一貫性のあるデータ生成のため）
  const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = createSeededRandom(seed)

  const playerNames = [
    '佐藤太郎', '田中次郎', '山田三郎', '鈴木四郎', '高橋五郎', '伊藤六郎',
    '渡辺七郎', '中村八郎', '小林九郎', '加藤十郎', '吉田一郎', '松本二郎'
  ]

  const grades = ['A1', 'A2', 'B1', 'B2']
  const motorConditions = ['◎', '○', '△']
  const motorDescriptions = ['新機', '整備', '好調', '普通', '不調']

  const entries: SimpleRaceEntry[] = []

  for (let lane = 1; lane <= 6; lane++) {
    const nameIndex = (seed + lane) % playerNames.length
    const gradeIndex = Math.floor(random() * grades.length)
    const conditionIndex = Math.floor(random() * motorConditions.length)
    const descIndex = Math.floor(random() * motorDescriptions.length)

    entries.push({
      lane,
      player_name: playerNames[nameIndex],
      player_grade: grades[gradeIndex],
      st_time: 0.14 + random() * 0.08, // 0.14 ~ 0.22
      exhibition_time: 6.70 + random() * 0.40, // 6.70 ~ 7.10
      motor_rate: 30 + random() * 25, // 30 ~ 55
      motor_condition: motorConditions[conditionIndex],
      motor_description: motorDescriptions[descIndex],
      // These will be overridden in the processing step
      motor_badge: { grade: '○', color: '', tooltip: '' },
      grade_badge_color: '',
      st_color: '',
      exhibition_color: '',
      two_rate: Math.floor(50 + random() * 25), // 50-75%の2連率
      three_rate: Math.floor(30 + random() * 25), // 30-55%の3連率
      national_win_rate: 4.5 + random() * 2.5, // 4.5-7.0の勝率
      local_win_rate: 4.0 + random() * 3.0 // 4.0-7.0の当地勝率
    })
  }

  return entries
}

// シード付きランダム関数
function createSeededRandom(seed: number) {
  let currentSeed = seed
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
}