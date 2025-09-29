import { NextRequest, NextResponse } from 'next/server'
import { fetchFromOpenApi } from '@/lib/ingest/adapters/openapi'
import { processIngestResult } from '@/lib/ingest/upserter'

/**
 * 日次データ取得Cron Job
 * GET /api/cron/daily-ingest?secret=CRON_SECRET&date=YYYY-MM-DD
 *
 * Vercel Cron Jobs設定例:
 * - 実行時間: 深夜2時 (0 2 * * *)
 * - URL: https://yourdomain.com/api/cron/daily-ingest?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const targetDate = searchParams.get('date')

    // 認証チェック
    const expectedSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_ADMIN_TOKEN
    if (!expectedSecret || secret !== expectedSecret) {
      console.warn(`❌ [Cron] Unauthorized access attempt`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 日付決定（指定なしなら前日）
    const date = targetDate || getPreviousDay()
    const venue = 12 // 住之江固定

    console.log(`🕐 [Cron] Daily ingest started: ${date}, venue ${venue}`)

    // Phase 1: OpenAPIからデータ取得
    const ingestResult = await fetchFromOpenApi({ date, venue })

    // データをDBに保存 + ログ記録
    const upsertResult = await processIngestResult(ingestResult)

    const duration = Date.now() - startTime

    // 結果サマリー
    const summary = {
      success: upsertResult.success,
      date,
      venue,
      source: ingestResult.source,
      api_success: ingestResult.success,
      data_fetched: ingestResult.data.length,
      records_inserted: upsertResult.insertedCount,
      records_updated: upsertResult.updatedCount,
      errors: upsertResult.errors,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }

    if (upsertResult.success) {
      console.log(`✅ [Cron] Daily ingest completed successfully:`, summary)
      return NextResponse.json(summary)
    } else {
      console.error(`⚠️ [Cron] Daily ingest completed with errors:`, summary)
      return NextResponse.json(summary, { status: 207 }) // Multi-Status
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`❌ [Cron] Daily ingest failed:`, errorMessage)

    const errorSummary = {
      success: false,
      error: errorMessage,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorSummary, { status: 500 })
  }
}

/**
 * 手動実行用POSTエンドポイント（管理画面から）
 * POST /api/cron/daily-ingest
 * Body: { date?: string, venue?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // 管理画面認証チェック
    const adminToken = request.headers.get('x-admin-token')
    const expectedToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN

    if (!expectedToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Admin token required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const date = body.date || getPreviousDay()
    const venue = body.venue || 12

    console.log(`🔄 [Manual] Ingest triggered: ${date}, venue ${venue}`)

    // 同じ処理をGETと共用
    const ingestResult = await fetchFromOpenApi({ date, venue })
    const upsertResult = await processIngestResult(ingestResult)

    const summary = {
      success: upsertResult.success,
      date,
      venue,
      source: 'manual-trigger',
      api_success: ingestResult.success,
      data_fetched: ingestResult.data.length,
      records_inserted: upsertResult.insertedCount,
      records_updated: upsertResult.updatedCount,
      errors: upsertResult.errors,
      timestamp: new Date().toISOString()
    }

    console.log(`🎯 [Manual] Ingest completed:`, summary)
    return NextResponse.json(summary)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Manual] Ingest failed:`, errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * 前日の日付を取得（JST）
 */
function getPreviousDay(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000)) // UTC+9
  const yesterday = new Date(jst.getTime() - (24 * 60 * 60 * 1000))
  return yesterday.toISOString().split('T')[0]
}