import { NextRequest, NextResponse } from 'next/server'
import { getResults, type NormalizedResult } from '@/lib/data/boatraceOpenApi'

/**
 * LIVE結果データ取得API
 * GET /api/live/results?date=YYYY-MM-DD&venue=12
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const venueParam = searchParams.get('venue')

    // パラメータ検証
    if (!date) {
      return NextResponse.json(
        { error: 'date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    const venue = venueParam ? parseInt(venueParam) : 12 // デフォルト住之江

    // 日付フォーマット検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    console.log(`🔄 Live results request: date=${date}, venue=${venue}`)

    // クールダウンチェック（2分間制限）
    // 注意: 本番では Redis や KV ストレージを使用することを推奨
    const now = Date.now()
    const cacheKey = `cooldown:${date}:${venue}`

    // メモリベースの簡易クールダウン（開発用）
    // TODO: 本番では永続化ストレージを使用
    if (global.__apiCooldown && global.__apiCooldown[cacheKey]) {
      const lastFetch = global.__apiCooldown[cacheKey]
      const timeDiff = now - lastFetch
      const cooldownMs = 2 * 60 * 1000 // 2分

      if (timeDiff < cooldownMs) {
        console.log(`⏳ Cooldown active for ${cacheKey}: ${Math.floor((cooldownMs - timeDiff) / 1000)}s remaining`)
        return NextResponse.json([]) // 空配列を返す（DEMOにフォールバック）
      }
    }

    // 結果データ取得
    const results: NormalizedResult[] = await getResults({ date, venue })

    // クールダウン記録
    if (!global.__apiCooldown) {
      global.__apiCooldown = {}
    }
    global.__apiCooldown[cacheKey] = now

    console.log(`✅ Live results response: ${results.length} races`)

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800', // 15分キャッシュ、30分 stale
        'X-Data-Source': 'boatrace-open-api',
        'X-Last-Updated': new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Live results API error:', error)

    // エラー時は静かに空配列を返す（DEMOにフォールバック）
    return NextResponse.json([], {
      headers: {
        'X-Data-Source': 'fallback-demo',
        'X-Error': 'true'
      }
    })
  }
}

// グローバル変数の型定義（開発用）
declare global {
  var __apiCooldown: Record<string, number> | undefined
}