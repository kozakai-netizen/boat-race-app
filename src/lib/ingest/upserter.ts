// Data Upserter - Supabaseへの結果データ保存
// Phase 1: resultテーブルへのupsert + ingest_logテーブルへのログ記録

import { supabase } from '@/lib/supabase'
import type { NormalizedResult } from '@/lib/data/boatraceOpenApi'
import type { IngestResult } from './adapters/openapi'

export interface UpsertResult {
  success: boolean
  insertedCount: number
  updatedCount: number
  errorCount: number
  errors: string[]
}

export interface IngestLogEntry {
  id?: string
  run_at: string
  source: string
  status: 'success' | 'partial' | 'failed'
  records_processed: number
  records_inserted: number
  records_updated: number
  error_details?: string
  metadata?: Record<string, unknown>
}

/**
 * resultテーブルにレース結果をupsert
 * @param results 正規化されたレース結果データ
 * @returns upsert結果
 */
export async function upsertResults(results: NormalizedResult[]): Promise<UpsertResult> {
  if (results.length === 0) {
    return {
      success: true,
      insertedCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: []
    }
  }

  console.log(`🔄 [Upserter] Upserting ${results.length} results to DB`)

  const errors: string[] = []
  let insertedCount = 0
  const updatedCount = 0

  // 結果データをresultテーブル形式に変換
  const resultRecords = results.map(result => ({
    race_id: result.race_id,
    triple: result.finish.join('-'), // [1,3,2] -> "1-3-2"
    payout: result.payout || null,
    popularity: result.popularity || null,
    settled_at: result.closed_at || new Date().toISOString()
  }))

  try {
    // 一括upsert実行
    const { data, error } = await supabase
      .from('result')
      .upsert(resultRecords, {
        onConflict: 'race_id',
        count: 'planned-exact'  // 影響行数を取得
      })
      .select()

    if (error) {
      console.error(`❌ [Upserter] Database error:`, error)
      errors.push(`Database error: ${error.message}`)
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        errorCount: results.length,
        errors
      }
    }

    // 成功時の処理
    insertedCount = data?.length || 0
    console.log(`✅ [Upserter] Successfully upserted ${insertedCount} results`)

    return {
      success: true,
      insertedCount,
      updatedCount: 0, // upsertでは区別困難のため簡略化
      errorCount: 0,
      errors: []
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Upserter] Unexpected error:`, errorMessage)
    errors.push(`Unexpected error: ${errorMessage}`)

    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      errorCount: results.length,
      errors
    }
  }
}

/**
 * ingest_logテーブルにログエントリを記録
 * @param entry ログエントリ
 */
export async function logIngestRun(entry: IngestLogEntry): Promise<void> {
  try {
    console.log(`📝 [Upserter] Logging ingest run: ${entry.status}`)

    const { error } = await supabase
      .from('ingest_log')
      .insert([{
        run_at: entry.run_at,
        source: entry.source,
        status: entry.status,
        records_processed: entry.records_processed,
        records_inserted: entry.records_inserted,
        records_updated: entry.records_updated,
        error_details: entry.error_details || null,
        metadata: entry.metadata || null
      }])

    if (error) {
      console.error(`❌ [Upserter] Failed to log ingest run:`, error)
    } else {
      console.log(`✅ [Upserter] Ingest run logged successfully`)
    }

  } catch (error) {
    console.error(`❌ [Upserter] Unexpected error logging ingest run:`, error)
  }
}

/**
 * 完全なingest処理（fetch + upsert + log）
 * @param ingestResult APIから取得した結果
 * @returns 最終的なupsert結果
 */
export async function processIngestResult(ingestResult: IngestResult): Promise<UpsertResult> {
  const startTime = new Date().toISOString()

  try {
    // データをDBに保存
    const upsertResult = await upsertResults(ingestResult.data)

    // ログエントリを作成
    const logEntry: IngestLogEntry = {
      run_at: startTime,
      source: ingestResult.source,
      status: upsertResult.success ? 'success' : 'failed',
      records_processed: ingestResult.data.length,
      records_inserted: upsertResult.insertedCount,
      records_updated: upsertResult.updatedCount,
      error_details: upsertResult.errors.length > 0 ? upsertResult.errors.join('; ') : undefined,
      metadata: {
        api_success: ingestResult.success,
        api_error: ingestResult.error,
        api_timestamp: ingestResult.timestamp
      }
    }

    // ログを記録
    await logIngestRun(logEntry)

    return upsertResult

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Upserter] Process failed:`, errorMessage)

    // エラーログを記録
    await logIngestRun({
      run_at: startTime,
      source: ingestResult.source,
      status: 'failed',
      records_processed: ingestResult.data.length,
      records_inserted: 0,
      records_updated: 0,
      error_details: errorMessage,
      metadata: {
        api_success: ingestResult.success,
        api_error: ingestResult.error,
        api_timestamp: ingestResult.timestamp
      }
    })

    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      errorCount: ingestResult.data.length,
      errors: [errorMessage]
    }
  }
}