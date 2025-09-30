import { NextRequest, NextResponse } from 'next/server'
import { generatePrediction } from '@/lib/prediction/predictionEngine'
import { fetchRaceEntriesForPrediction, parseRaceId } from '@/lib/api/programsApi'

/**
 * レース予想API（Programs API リアルタイム統合版）
 * GET /api/prediction/[raceId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    // Next.js 15対応：paramsをawait
    const { raceId } = await params
    console.log(`🔮 [Prediction API v2] Generating real-time prediction for race: ${raceId}`)

    // raceIDフォーマット検証
    const parsedRace = parseRaceId(raceId)
    if (!parsedRace) {
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

    const { date, venueId, raceNo } = parsedRace
    console.log(`📅 [Prediction API] Target: ${date}, Venue: ${venueId}, Race: ${raceNo}`)

    // Programs APIからリアルタイムデータ取得
    let racerEntries
    try {
      racerEntries = await fetchRaceEntriesForPrediction(raceId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // 開催なしの場合
      if (errorMessage.includes('No race data available')) {
        return NextResponse.json({
          success: false,
          error: 'no_race_scheduled',
          message: `${date}の会場${venueId}では${raceNo}Rの開催がありません`,
          date,
          venueId,
          raceNo
        }, { status: 404 })
      }

      // API取得失敗の場合
      console.error(`❌ [Prediction API] Programs API error:`, errorMessage)
      return NextResponse.json({
        success: false,
        error: 'programs_api_error',
        message: 'Programs APIからのデータ取得に失敗しました',
        details: errorMessage
      }, { status: 502 })
    }

    // 選手データ検証
    if (!racerEntries || racerEntries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'no_racers_found',
        message: '有効な選手データが見つかりませんでした',
        raceId
      }, { status: 404 })
    }

    if (racerEntries.length < 6) {
      console.warn(`⚠️ [Prediction API] Only ${racerEntries.length} racers found for ${raceId}`)
    }

    // 予想生成
    console.log(`🎯 [Prediction API] Generating prediction with ${racerEntries.length} racers`)
    const prediction = generatePrediction(racerEntries, venueId)

    console.log(`✅ [Prediction API] Successfully generated real-time prediction for ${raceId}`)

    return NextResponse.json({
      success: true,
      raceId,
      prediction,
      dataSource: 'programs_api_realtime',
      racersCount: racerEntries.length,
      generatedAt: new Date().toISOString(),
      metadata: {
        date,
        venueId,
        raceNo
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