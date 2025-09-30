import { NextRequest, NextResponse } from 'next/server'
import { generatePrediction } from '@/lib/prediction/predictionEngine'
import { enhanceRacerEntry } from '@/lib/prediction/racerDataEnhancer'

/**
 * レース予想API
 * GET /api/prediction/[raceId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { raceId: string } }
) {
  try {
    const raceId = params.raceId
    console.log(`🔮 [Prediction API] Generating prediction for race: ${raceId}`)

    // レースIDから会場と日付を解析
    const parts = raceId.split('-')
    if (parts.length !== 5) {
      return NextResponse.json(
        { error: 'Invalid raceId format. Expected: YYYY-MM-DD-VV-RR' },
        { status: 400 }
      )
    }

    const date = `${parts[0]}-${parts[1]}-${parts[2]}`
    const venueId = parseInt(parts[3])
    const raceNo = parseInt(parts[4])

    // 選手データを取得（race-entriesエンドポイントを使用）
    const entriesResponse = await fetch(
      `${request.nextUrl.origin}/api/race-entries?raceId=${raceId}`
    )

    if (!entriesResponse.ok) {
      console.error(`❌ [Prediction API] Failed to fetch entries for ${raceId}`)
      return NextResponse.json(
        { error: 'Failed to fetch race entries' },
        { status: 500 }
      )
    }

    const entriesData = await entriesResponse.json()
    const entries = entriesData.entries

    if (!entries || entries.length === 0) {
      console.error(`❌ [Prediction API] No entries found for ${raceId}`)
      return NextResponse.json(
        { error: 'No race entries found' },
        { status: 404 }
      )
    }

    // エントリーデータを拡張データで強化
    const racerEntries = entries.map((entry: any, index: number) =>
      enhanceRacerEntry(entry, venueId, index + 1) // 展示順位は仮で1-6
    )

    // 予想生成
    const prediction = generatePrediction(racerEntries, venueId)

    console.log(`✅ [Prediction API] Generated prediction for ${raceId}`)

    return NextResponse.json({
      success: true,
      raceId,
      prediction,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Prediction API] Error:`, errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}