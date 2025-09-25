import { NextRequest, NextResponse } from 'next/server'
import {
  generateWhyBrief,
  getMotorBadge,
  getGradeBadgeColor,
  getSTColor,
  getExhibitionColor
} from '@/lib/why'
import { SimpleRaceEntry } from '@/lib/types'

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
    // モックデータの生成（実際のAPIではデータベースから取得）
    const entries = generateMockEntries(raceId)

    // API側で計算済みデータを生成
    const processedEntries = entries.map(entry => {
      const motorBadge = getMotorBadge(entry)
      const gradeBadgeColor = getGradeBadgeColor(entry.player_grade)
      const stColor = getSTColor(entry.st_time)
      const exhibitionColor = getExhibitionColor(entry.exhibition_time)
      const twoRate = Math.round(entry.motor_rate * 0.8 + (entry.lane * 3) + 15)

      return {
        ...entry,
        motor_badge: motorBadge,
        grade_badge_color: gradeBadgeColor,
        st_color: stColor,
        exhibition_color: exhibitionColor,
        two_rate: twoRate,
        // 外部リンクと写真用フィールド追加
        photo_path: null, // 現在は写真なし
        external_url: null // 将来の個別ページURL用
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
      race_id: raceId,
      lane,
      player_name: playerNames[nameIndex],
      player_grade: grades[gradeIndex],
      st_time: 0.14 + random() * 0.08, // 0.14 ~ 0.22
      exhibition_time: 6.70 + random() * 0.40, // 6.70 ~ 7.10
      motor_rate: 30 + random() * 25, // 30 ~ 55
      motor_condition: motorConditions[conditionIndex],
      motor_description: motorDescriptions[descIndex]
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