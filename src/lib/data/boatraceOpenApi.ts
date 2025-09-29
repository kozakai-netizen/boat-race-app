// Boatrace Open API データ取得サービス

export interface NormalizedResult {
  race_id: string        // '2025-09-26-12-01' など規約化
  date: string           // '2025-09-26'
  race_no: number        // 1..12
  finish: [number, number, number]  // 着順 例 [1,3,2]
  payout: number         // 払戻金（3連単）
  popularity: number | null     // 人気（なければnull）
  closed_at?: string     // 公式にあれば、なければ既存値を保持
}

interface BoatraceApiResult {
  race_date: string
  race_stadium_number: number
  race_number: number
  boats: Array<{
    racer_course_number: number
    racer_place_number: number
  }>
  payouts?: {
    trifecta?: Array<{
      combination: string
      payout: number
    }>
  }
}

/**
 * 結果データを取得
 * @param params - 取得パラメータ
 * @returns 正規化された結果データ配列
 */
export async function getResults(params: {
  date: string  // 'YYYY-MM-DD'
  venue: number // 12 (住之江)
}): Promise<NormalizedResult[]> {
  const { date, venue } = params

  try {
    console.log(`🔄 Fetching results for ${date}, venue ${venue}`)

    // 日付フォーマット変換 YYYY-MM-DD → YYYYMMDD
    const dateFormatted = date.replace(/-/g, '')

    // URLを決定（今日の場合は today.json を使用）
    const today = new Date().toISOString().split('T')[0]
    const isToday = date === today

    // 年を取得して正しいパス構造にする
    const year = date.substring(0, 4)

    const url = isToday
      ? 'https://boatraceopenapi.github.io/results/v2/today.json'
      : `https://boatraceopenapi.github.io/results/v2/${year}/${dateFormatted}.json`

    console.log(`📥 Fetching from: ${url}`)

    // 30分キャッシュでフェッチ
    const response = await fetch(url, {
      next: {
        revalidate: 1800,  // 30分 = 1800秒
        tags: [`results:${date}`]
      }
    })

    if (!response.ok) {
      console.warn(`⚠️ API response not ok: ${response.status}`)
      return []
    }

    const responseData = await response.json()
    console.log(`📊 Raw response:`, typeof responseData, responseData.results ? `${responseData.results.length} races` : 'no results field')

    // APIレスポンスから results 配列を取得
    const allResults: BoatraceApiResult[] = responseData.results || []
    console.log(`📊 Received ${allResults.length} total results`)

    // 指定会場のデータのみフィルタリング
    const venueResults = allResults.filter(result => result.race_stadium_number === venue)
    console.log(`🎯 Found ${venueResults.length} results for venue ${venue}`)

    // 正規化して返却
    const normalizedResults: NormalizedResult[] = venueResults.map(result => {
      // 着順を計算（racer_place_numberでソートしてracer_course_numberを取得）
      const finish = result.boats
        .sort((a, b) => a.racer_place_number - b.racer_place_number)
        .slice(0, 3)
        .map(boat => boat.racer_course_number) as [number, number, number]

      // 3連単の払戻金を取得
      const payout = result.payouts?.trifecta?.[0]?.payout || 0

      return {
        race_id: `${date}-${venue.toString().padStart(2, '0')}-${result.race_number.toString().padStart(2, '0')}`,
        date: date,
        race_no: result.race_number,
        finish,
        payout,
        popularity: null, // API に人気データがないためnull
        closed_at: undefined // 公式にないため undefined
      }
    })

    console.log(`✅ Normalized ${normalizedResults.length} results`)
    return normalizedResults

  } catch (error) {
    console.error('❌ Failed to fetch results:', error)
    return [] // 失敗時は空配列を返す（UIはDEMOにフォールバック）
  }
}

/**
 * データを手動で再取得（キャッシュをクリア）
 * @param date - 対象日付
 */
export async function revalidateResults(date: string) {
  try {
    // Next.js の revalidateTag を使用してキャッシュをクリア
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`results:${date}`)
    console.log(`🔄 Revalidated cache for results:${date}`)
  } catch (error) {
    console.error('❌ Failed to revalidate cache:', error)
  }
}