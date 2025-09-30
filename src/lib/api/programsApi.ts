/**
 * Programs API リアルタイムデータ取得ユーティリティ
 */

import type { RacerEntry } from '@/lib/prediction/predictionEngine'

export interface ProgramsRacerData {
  pit: number
  racerNumber: string
  racerName: string
  grade: string
  homeVenue?: string
  age?: number
  weight?: number
  nationalWinRate?: number
  localWinRate?: number
  exhibitionTime?: number
  stTime?: number
  motorNumber?: number
  boatNumber?: number
}

export interface ProgramsRaceData {
  venueId: number
  date: string
  raceNo: number
  racers: ProgramsRacerData[]
}

/**
 * raceIdを解析して日付・会場・レース番号を抽出
 */
export function parseRaceId(raceId: string): { date: string; venueId: number; raceNo: number } | null {
  try {
    console.log(`🔍 [parseRaceId] Input raceId: "${raceId}"`)

    // 入力値の前後の空白を除去
    const cleanRaceId = raceId.trim()
    console.log(`🔍 [parseRaceId] Cleaned raceId: "${cleanRaceId}"`)

    // 例: "2025-09-28-12-01" → date=2025-09-28、venueId=12、raceNo=1
    const parts = cleanRaceId.split('-')
    console.log(`🔍 [parseRaceId] Split parts:`, parts, `(length: ${parts.length})`)

    if (parts.length !== 5) {
      console.error(`❌ [parseRaceId] Invalid raceId format: "${cleanRaceId}" - Expected 5 parts, got ${parts.length}`)
      return null
    }

    const date = `${parts[0]}-${parts[1]}-${parts[2]}`
    const venueId = parseInt(parts[3])
    const raceNo = parseInt(parts[4])

    console.log(`🔍 [parseRaceId] Parsed components:`)
    console.log(`  - date: "${date}"`)
    console.log(`  - venueId: ${venueId} (from "${parts[3]}")`)
    console.log(`  - raceNo: ${raceNo} (from "${parts[4]}")`)

    if (isNaN(venueId) || isNaN(raceNo)) {
      console.error(`❌ [parseRaceId] Invalid venueId or raceNo in raceId: "${cleanRaceId}"`)
      console.error(`  - venueId: ${venueId} (isNaN: ${isNaN(venueId)})`)
      console.error(`  - raceNo: ${raceNo} (isNaN: ${isNaN(raceNo)})`)
      return null
    }

    const result = { date, venueId, raceNo }
    console.log(`✅ [parseRaceId] Successfully parsed:`, result)
    return result
  } catch (error) {
    console.error(`❌ [parseRaceId] Error parsing raceId "${raceId}":`, error)
    return null
  }
}

/**
 * Programs APIから指定日のデータを取得
 */
export async function fetchProgramsData(date: string): Promise<any> {
  try {
    const url = `https://boatraceopenapi.github.io/programs/v2/${date}.json`
    console.log(`📡 [Programs API] Fetching data from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BoatRacePredictionSystem/1.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 300 } // 5分間キャッシュ
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`📅 [Programs API] No data available for date: ${date}`)
        return null
      }
      throw new Error(`Programs API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ [Programs API] Successfully fetched data for ${date}`)
    return data

  } catch (error) {
    console.error(`❌ [Programs API] Error fetching data for ${date}:`, error)
    throw error
  }
}

/**
 * 指定されたレースの選手データを抽出
 */
export function extractRaceData(programsData: any, venueId: number, raceNo: number): ProgramsRaceData | null {
  try {
    if (!programsData || !programsData.stadiums) {
      console.error('[Programs API] Invalid programs data structure')
      return null
    }

    // 会場データを検索
    const stadium = programsData.stadiums.find((s: any) => s.stadium === venueId)
    if (!stadium) {
      console.log(`📍 [Programs API] No data found for venue ${venueId}`)
      return null
    }

    // レースデータを検索
    const race = stadium.races?.find((r: any) => r.race === raceNo)
    if (!race) {
      console.log(`🏁 [Programs API] No data found for race ${raceNo} at venue ${venueId}`)
      return null
    }

    // 選手データを変換
    const racers: ProgramsRacerData[] = (race.pits || []).map((pit: any) => ({
      pit: pit.pit || 0,
      racerNumber: pit.racer?.number || '',
      racerName: pit.racer?.name || '',
      grade: pit.racer?.grade || 'B1',
      homeVenue: pit.racer?.home || '',
      age: pit.racer?.age || undefined,
      weight: pit.racer?.weight || undefined,
      nationalWinRate: pit.racer?.national_win_rate || undefined,
      localWinRate: pit.racer?.local_win_rate || undefined,
      exhibitionTime: pit.exhibition_time || undefined,
      stTime: pit.st_time || undefined,
      motorNumber: pit.motor?.number || undefined,
      boatNumber: pit.boat?.number || undefined
    }))

    return {
      venueId,
      date: programsData.date || '',
      raceNo,
      racers: racers.filter(r => r.pit > 0) // 有効な艇番のみ
    }

  } catch (error) {
    console.error(`❌ [Programs API] Error extracting race data:`, error)
    return null
  }
}

/**
 * raceIdから選手データを直接取得（メイン関数）
 */
export async function fetchRaceEntries(raceId: string): Promise<ProgramsRaceData | null> {
  try {
    console.log(`🔍 [Programs API] Fetching entries for race: ${raceId}`)

    // raceIDを解析
    const parsed = parseRaceId(raceId)
    if (!parsed) {
      throw new Error(`Invalid raceId format: ${raceId}`)
    }

    const { date, venueId, raceNo } = parsed

    // Programs APIからデータ取得
    const programsData = await fetchProgramsData(date)
    if (!programsData) {
      return null // 開催なし
    }

    // 指定レースのデータを抽出
    const raceData = extractRaceData(programsData, venueId, raceNo)
    if (!raceData) {
      return null // レースなし
    }

    console.log(`✅ [Programs API] Found ${raceData.racers.length} racers for ${raceId}`)
    return raceData

  } catch (error) {
    console.error(`❌ [Programs API] Error fetching race entries for ${raceId}:`, error)
    throw error
  }
}

/**
 * Programs APIデータを予想エンジン用のRacerEntry形式に変換
 */
export function convertToRacerEntries(raceData: ProgramsRaceData): RacerEntry[] {
  return raceData.racers.map(racer => ({
    lane: racer.pit,
    player_name: racer.racerName || `選手${racer.pit}`,
    player_grade: (racer.grade as 'A1' | 'A2' | 'B1' | 'B2') || 'B1',
    st_time: racer.stTime || 0.16, // デフォルト0.16
    exhibition_time: racer.exhibitionTime || 100.0, // デフォルト100秒
    motor_rate: 30, // Programs APIには含まれないためデフォルト
    two_rate: 35, // Programs APIには含まれないためデフォルト
    three_rate: 25, // Programs APIには含まれないためデフォルト
    national_win_rate: racer.nationalWinRate,
    local_win_rate: racer.localWinRate,
    foul_count: 0,
    is_local: false
  }))
}

/**
 * 完全統合：raceIdから予想用データを取得
 */
export async function fetchRaceEntriesForPrediction(raceId: string): Promise<RacerEntry[]> {
  try {
    const raceData = await fetchRaceEntries(raceId)
    if (!raceData) {
      throw new Error('No race data available')
    }

    const racerEntries = convertToRacerEntries(raceData)
    console.log(`🎯 [Programs API] Converted ${racerEntries.length} racers for prediction`)

    return racerEntries

  } catch (error) {
    console.error(`❌ [Programs API] Error converting race data for prediction:`, error)
    throw error
  }
}