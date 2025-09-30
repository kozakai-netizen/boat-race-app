import { NextRequest, NextResponse } from 'next/server'
import { getResults } from '@/lib/data/boatraceOpenApi'
import { upsertResults } from '@/lib/ingest/upserter'

/**
 * 過去データ遡及取得API
 * POST /api/batch-ingest
 */
export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, venueId, adminToken } = await request.json()

    // 管理者認証
    if (adminToken !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`🚀 [Batch Ingest] Starting batch ingest: ${startDate} to ${endDate}, venue ${venueId}`)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const results = []
    let totalDays = 0
    let successDays = 0
    let totalRaces = 0
    let errorDays = []

    // 日付を1日ずつ進めながら取得
    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      totalDays++
      const dateStr = currentDate.toISOString().split('T')[0]

      try {
        console.log(`📅 Processing date: ${dateStr}`)

        // API制限対策：リクエスト間隔を空ける
        if (totalDays > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機
        }

        // Results APIからデータ取得
        const dayResults = await getResults({
          date: dateStr,
          venue: venueId
        })

        if (dayResults.length > 0) {
          // データベースに保存
          const upsertResult = await upsertResults(dayResults, 'batch-ingest')

          successDays++
          totalRaces += dayResults.length

          results.push({
            date: dateStr,
            racesFound: dayResults.length,
            inserted: upsertResult.records_inserted,
            updated: upsertResult.records_updated
          })

          console.log(`✅ ${dateStr}: ${dayResults.length} races processed`)
        } else {
          console.log(`⚠️ ${dateStr}: No races found`)
          results.push({
            date: dateStr,
            racesFound: 0,
            inserted: 0,
            updated: 0
          })
        }

      } catch (error) {
        console.error(`❌ ${dateStr}: Error processing`, error)
        errorDays.push({
          date: dateStr,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const summary = {
      totalDays,
      successDays,
      errorDays: errorDays.length,
      totalRaces,
      startDate,
      endDate,
      venueId,
      results,
      errors: errorDays
    }

    console.log(`🎉 [Batch Ingest] Completed:`, summary)

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Batch Ingest] Error:`, errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}