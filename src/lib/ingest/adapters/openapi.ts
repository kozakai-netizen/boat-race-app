// Boatrace Open API Adapter
// Phase 1: 住之江(venue=12)のデータを取得してDB保存

import { getResults, type NormalizedResult } from '@/lib/data/boatraceOpenApi'

export interface IngestParams {
  date: string  // 'YYYY-MM-DD'
  venue: number // 12 (住之江)
}

export interface IngestResult {
  success: boolean
  data: NormalizedResult[]
  source: 'boatrace-open-api'
  timestamp: string
  error?: string
}

/**
 * Boatrace Open APIからデータを取得
 * @param params 取得パラメータ
 * @returns 正規化されたデータと取得結果
 */
export async function fetchFromOpenApi(params: IngestParams): Promise<IngestResult> {
  const timestamp = new Date().toISOString()

  try {
    console.log(`🔄 [OpenAPI] Fetching data for ${params.date}, venue ${params.venue}`)

    // 既存のgetResults関数を使用
    const data = await getResults({
      date: params.date,
      venue: params.venue
    })

    const result: IngestResult = {
      success: true,
      data,
      source: 'boatrace-open-api',
      timestamp,
    }

    console.log(`✅ [OpenAPI] Successfully fetched ${data.length} races`)
    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [OpenAPI] Failed to fetch data:`, errorMessage)

    return {
      success: false,
      data: [],
      source: 'boatrace-open-api',
      timestamp,
      error: errorMessage
    }
  }
}

/**
 * 複数日のデータを一括取得
 * @param dates 取得対象日の配列
 * @param venue 会場コード
 * @returns 各日の取得結果
 */
export async function fetchMultipleDays(
  dates: string[],
  venue: number = 12
): Promise<IngestResult[]> {
  console.log(`🔄 [OpenAPI] Bulk fetching for ${dates.length} days`)

  const results = await Promise.allSettled(
    dates.map(date => fetchFromOpenApi({ date, venue }))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`❌ [OpenAPI] Failed to fetch data for ${dates[index]}:`, result.reason)
      return {
        success: false,
        data: [],
        source: 'boatrace-open-api' as const,
        timestamp: new Date().toISOString(),
        error: result.reason?.message || 'Promise rejected'
      }
    }
  })
}