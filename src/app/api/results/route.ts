import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 保存済み結果データ取得API
 * GET /api/results?date=YYYY-MM-DD&venue=1-24
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const venue = searchParams.get('venue')

    console.log(`🔍 [Results API] Fetching results for date: ${date}, venue: ${venue}`)

    // クエリビルダー作成
    let query = supabase
      .from('result')
      .select('*')
      .order('race_id', { ascending: true })

    // 日付フィルタ
    if (date) {
      query = query.like('race_id', `${date}%`)
    }

    // 競艇場フィルタ
    if (venue) {
      const venueStr = venue.padStart(2, '0')
      query = query.like('race_id', `%-${venueStr}-%`)
    }

    // データ取得実行
    const { data, error } = await query

    if (error) {
      console.error(`❌ [Results API] Database error:`, error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [Results API] Found ${data?.length || 0} results`)

    // race_id をパースして構造化
    const structuredResults = (data || []).map(result => {
      // race_id: "2025-07-15-01-12" → { date: "2025-07-15", venue: 1, race_no: 12 }
      const parts = result.race_id.split('-')
      const date = `${parts[0]}-${parts[1]}-${parts[2]}` // "2025-07-15"
      const venue = parseInt(parts[3]) // "01" → 1
      const race_no = parseInt(parts[4]) // "12" → 12

      return {
        ...result,
        parsed: {
          date,
          venue,
          race_no
        }
      }
    })

    return NextResponse.json({
      success: true,
      count: structuredResults.length,
      results: structuredResults,
      filters: { date, venue: venue ? parseInt(venue) : null }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Results API] Unexpected error:`, errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}