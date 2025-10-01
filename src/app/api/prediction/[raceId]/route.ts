import { NextRequest, NextResponse } from 'next/server'
import { generatePrediction } from '@/lib/prediction/predictionEngine'
import { fetchRaceEntriesFromRacerData } from '@/lib/racerData/racerDataAdapter'

/**
 * レース予想API（racer_data統合版）
 * GET /api/prediction/[raceId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    // Next.js 15対応：paramsをawait
    const { raceId } = await params
    console.log(`🔮 [Prediction API v3] Generating prediction for race: ${raceId}`)

    // raceIDフォーマット検証
    const raceIdPattern = /^\d{4}-\d{2}-\d{2}-\d{1,2}-\d{1,2}$/
    if (!raceIdPattern.test(raceId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid raceId format',
          expected: 'YYYY-MM-DD-VV-RR (e.g., 2025-09-30-12-01)',
          received: raceId
        },
        { status: 400 }
      )
    }

    // raceIdから基本情報を抽出
    const parts = raceId.split('-')
    const date = `${parts[0]}-${parts[1]}-${parts[2]}`
    const venueId = parseInt(parts[3])
    const raceNo = parseInt(parts[4])

    console.log(`📅 [Prediction API] Target: ${date}, Venue: ${venueId}, Race: ${raceNo}`)

    // racer_dataテーブルから選手データを取得
    console.log(`🔮 [Prediction API] ===== RACER DATA FETCH DEBUG =====`)
    console.log(`🔮 [Prediction API] About to call fetchRaceEntriesFromRacerData()`)
    console.log(`🔮 [Prediction API] Expected data source: racer_data table (fan2410 imported data)`)

    let racerEntries
    try {
      racerEntries = await fetchRaceEntriesFromRacerData(raceId)
      console.log(`🔮 [Prediction API] ✅ Successfully received racer data`)
      console.log(`🔮 [Prediction API] Received ${racerEntries.length} racer entries`)
      console.log(`🔮 [Prediction API] Racer names received:`)
      racerEntries.forEach((entry, index) => {
        console.log(`🔮 [Prediction API]   ${index + 1}: ${entry.player_name} (Grade: ${entry.player_grade})`)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error(`❌ [Prediction API] RacerData fetch error:`, errorMessage)
      return NextResponse.json({
        success: false,
        error: 'racer_data_fetch_error',
        message: 'racer_dataテーブルからのデータ取得に失敗しました',
        details: errorMessage
      }, { status: 502 })
    }

    // 選手データ検証
    if (!racerEntries || racerEntries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'no_racers_found',
        message: '有効な選手データが見つかりませんでした',
        raceId,
        available_racers: 0
      }, { status: 404 })
    }

    if (racerEntries.length < 6) {
      console.warn(`⚠️ [Prediction API] Only ${racerEntries.length} racers available for ${raceId}`)
    }

    // 予想生成
    console.log(`🎯 [Prediction API] Generating prediction with ${racerEntries.length} racers`)
    const prediction = generatePrediction(racerEntries, venueId)

    console.log(`✅ [Prediction API] Successfully generated prediction for ${raceId}`)

    // 使用された選手情報を含むレスポンス
    console.log(`🔮 [Prediction API] ===== FINAL DATA VERIFICATION =====`)
    console.log(`🔮 [Prediction API] Data source confirmed: racer_data table`)
    console.log(`🔮 [Prediction API] Original fan2410.lzh → racer_data → prediction`)

    const racerSummary = racerEntries.map(entry => ({
      lane: entry.lane,
      name: entry.player_name,
      grade: entry.player_grade,
      st_time: entry.st_time,
      win_rate: entry.national_win_rate
    }))

    console.log(`🔮 [Prediction API] Final racer summary for response:`)
    racerSummary.forEach((racer) => {
      console.log(`🔮 [Prediction API]   Lane ${racer.lane}: ${racer.name} (${racer.grade})`)
    })
    console.log(`🔮 [Prediction API] ===== RACER DATA FETCH DEBUG END =====`)

    return NextResponse.json({
      success: true,
      raceId,
      prediction,
      dataSource: 'racer_data_table',
      racersCount: racerEntries.length,
      generatedAt: new Date().toISOString(),
      metadata: {
        date,
        venueId,
        raceNo,
        data_integration: 'v3_racer_data_direct',
        total_available_racers: 1616 // fan2410データ全体
      },
      racers_used: racerSummary,
      system_info: {
        selection_method: 'deterministic_weighted_by_grade',
        data_source: 'fan2410_2024_후期',
        prediction_engine: 'v2'
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Prediction API] Unexpected error:`, errorMessage, error)

    return NextResponse.json({
      success: false,
      error: 'internal_server_error',
      message: '予想生成中に予期しないエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}