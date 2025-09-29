/**
 * Programs API統合エンドポイント
 * 安全性重視・段階的実装アプローチ
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import {
  fetchProgramsApiData,
  type ExperimentDataPoint
} from '@/lib/experiment/programsApiExperiment'
import { getStadiumByProgramsApiId } from '@/lib/data/stadiumMapping'
import type {
  ProgramsApiResult,
  NormalizedRacerEntry,
  ProgramsApiError
} from '@/types/programs'

// レート制限とセキュリティ
const RATE_LIMIT_REQUESTS = 60 // 1時間あたり
const ALLOWED_DATE_RANGE_DAYS = 30 // 最大30日前まで

interface ProgramsIngestRequest {
  date?: string        // YYYY-MM-DD形式
  venue?: number       // 標準会場番号 (1-24)
  dryRun?: boolean     // データベース保存をスキップ
}

export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const adminToken = request.headers.get('x-admin-token')
    if (adminToken !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const venue = searchParams.get('venue')
    const dryRun = searchParams.get('dryRun') === 'true'

    // パラメータ検証
    const venueParam = venue ? Number(venue) : undefined
    const validationResult = validateRequest({ date: date || undefined, venue: venueParam, dryRun })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error?.message },
        { status: 400 }
      )
    }

    const targetDate = date || getPreviousBusinessDay()
    console.log(`[Programs API] Starting ingest for date: ${targetDate}`)

    // Programs APIからデータ取得
    const result = await fetchProgramsApiData(targetDate)

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'API_ERROR',
          message: result.error,
          timestamp: new Date().toISOString()
        }
      } as ProgramsApiResult, { status: 500 })
    }

    // データ正規化
    const normalizedEntries = normalizeStadiumData(result, targetDate, venueParam)

    let dbResult: { entriesSaved: number } | null = null
    if (!dryRun) {
      // データベース保存
      dbResult = await saveToDatabase(normalizedEntries, result, targetDate, venueParam)
    }

    // 成功レスポンス
    const response: ProgramsApiResult<{
      date: string
      stadiums_processed: number
      entries_normalized: number
      entries_saved?: number
      dry_run: boolean
    }> = {
      success: true,
      data: {
        date: targetDate,
        stadiums_processed: result.stadiums.length,
        entries_normalized: normalizedEntries.length,
        entries_saved: dbResult?.entriesSaved || 0,
        dry_run: dryRun
      },
      source: result.stadiums.length > 0 ? 'live_api' : 'mock_data'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Programs API] Unexpected error:', error)

    const apiError: ProgramsApiError = {
      code: 'API_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: false,
      error: apiError
    } as ProgramsApiResult, { status: 500 })
  }
}

/**
 * リクエストパラメータ検証
 */
function validateRequest(params: ProgramsIngestRequest): ProgramsApiResult {
  // 日付検証
  if (params.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(params.date)) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid date format. Use YYYY-MM-DD',
          timestamp: new Date().toISOString()
        }
      } as ProgramsApiResult
    }

    const targetDate = new Date(params.date)
    const now = new Date()
    const maxPastDate = new Date(now.getTime() - (ALLOWED_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000))

    if (targetDate > now || targetDate < maxPastDate) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: `Date must be within last ${ALLOWED_DATE_RANGE_DAYS} days`,
          timestamp: new Date().toISOString()
        }
      } as ProgramsApiResult
    }
  }

  // 会場検証
  if (params.venue && (params.venue < 1 || params.venue > 24)) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Venue must be between 1 and 24',
        timestamp: new Date().toISOString()
      }
    } as ProgramsApiResult
  }

  return { success: true, source: 'live_api' }
}

/**
 * Programs APIデータを正規化
 */
function normalizeStadiumData(
  apiResult: ExperimentDataPoint,
  targetDate: string,
  targetVenue?: number
): NormalizedRacerEntry[] {
  const entries: NormalizedRacerEntry[] = []

  for (const stadium of apiResult.stadiums) {
    // 会場番号マッピング
    const venueInfo = getStadiumByProgramsApiId(stadium.stadium)
    if (!venueInfo) {
      console.warn(`[Programs API] Unknown stadium: ${stadium.stadium}`)
      continue
    }

    // 特定会場のみ処理する場合
    if (targetVenue && venueInfo.id !== targetVenue) {
      continue
    }

    for (const race of stadium.races) {
      const raceId = `${targetDate}-${venueInfo.id.toString().padStart(2, '0')}-${race.race_no.toString().padStart(2, '0')}`

      for (const entry of race.entries) {
        entries.push({
          race_id: raceId,
          venue_id: venueInfo.id,
          race_date: targetDate,
          race_no: race.race_no,
          pit: entry.pit,
          racer_registration_number: entry.racer_registration_number,
          racer_name: entry.racer_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
  }

  return entries
}

/**
 * データベース保存
 */
async function saveToDatabase(
  entries: NormalizedRacerEntry[],
  apiResult: ExperimentDataPoint,
  targetDate: string,
  targetVenue?: number
) {
  const supabase = createClient()

  try {
    // 選手エントリー保存
    const { data: savedEntries, error: entriesError } = await supabase
      .from('racer_entries')
      .upsert(entries, {
        onConflict: 'race_id,pit',
        ignoreDuplicates: false
      })

    if (entriesError) {
      console.error('[Programs API] Database save error:', entriesError)
      throw entriesError
    }

    // ログ保存
    const { error: logError } = await supabase
      .from('programs_ingest_log')
      .insert({
        target_date: targetDate,
        venue_id: targetVenue || null,
        status: 'success',
        stadiums_processed: apiResult.stadiums.length,
        races_processed: apiResult.stadiums.reduce((sum, s) => sum + s.races.length, 0),
        entries_inserted: entries.length,
        entries_updated: 0, // UPSERTなので正確な更新数は不明
        data_source: apiResult.stadiums.length > 0 ? 'programs_api' : 'mock_data',
        metadata: {
          api_stadiums: apiResult.stadiums.map(s => ({ id: s.stadium, races: s.races.length }))
        }
      })

    if (logError) {
      console.error('[Programs API] Log save error:', logError)
      // ログエラーは処理続行
    }

    return {
      entriesSaved: entries.length,
      savedEntries
    }

  } catch (error) {
    console.error('[Programs API] Database operation failed:', error)
    throw error
  }
}

/**
 * 前営業日取得（簡易版）
 */
function getPreviousBusinessDay(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}