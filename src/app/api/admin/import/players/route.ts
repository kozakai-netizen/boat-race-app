import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  PlayersImportRequestSchema,
  PlayersImportResult,
  PlayersRow
} from '@/lib/import/schemas'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'
const BATCH_SIZE = 200 // バッチサイズ

/**
 * Players CSV Import API
 */
export async function POST(request: NextRequest) {
  console.info('[API] admin/import/players POST - DATA_MODE:', DATA_MODE)

  // 権限チェック - DATA_MODE が live でない場合は拒否
  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Import operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  // Admin認証チェック（簡易版）
  const adminToken = request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (!adminToken || adminToken !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const validatedRequest = PlayersImportRequestSchema.parse(body)

    const result = await importPlayersData(validatedRequest.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in admin/import/players POST:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to import players data' },
      { status: 500 }
    )
  }
}

/**
 * Players データのインポート処理
 */
async function importPlayersData(data: PlayersRow[]): Promise<PlayersImportResult> {
  const result: PlayersImportResult = {
    success: false,
    total: data.length,
    successCount: 0,
    errorCount: 0,
    skipCount: 0,
    errors: [],
    duplicates: []
  }

  if (data.length === 0) {
    result.success = true
    return result
  }

  // バッチ処理で実行
  const batches: PlayersRow[][] = []
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    batches.push(data.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    try {
      await processBatch(batch, result)
    } catch (error) {
      console.error('Batch processing error:', error)
      // バッチエラーの場合は該当行をすべてエラーとしてマーク
      for (let i = 0; i < batch.length; i++) {
        const globalIndex = result.successCount + result.errorCount + result.skipCount
        result.errors.push({
          row: globalIndex + 1,
          reg_no: batch[i].reg_no,
          name: batch[i].name,
          message: 'バッチ処理エラーが発生しました',
          field: 'batch'
        })
        result.errorCount++
      }
    }
  }

  result.success = result.errorCount === 0
  return result
}

/**
 * バッチ処理
 */
async function processBatch(batch: PlayersRow[], result: PlayersImportResult): Promise<void> {
  // 既存データとの重複チェック
  const regNos = batch.map(row => row.reg_no)
  const { data: existingPlayers, error: fetchError } = await supabase
    .from('player')
    .select('reg_no, player_name')
    .in('reg_no', regNos.map(n => parseInt(n)))

  if (fetchError) {
    throw new Error(`データベース検索エラー: ${fetchError.message}`)
  }

  const existingRegNos = new Set((existingPlayers || []).map(p => String(p.reg_no)))
  const existingPlayersMap = new Map(
    (existingPlayers || []).map(p => [String(p.reg_no), p.player_name])
  )

  // upsert用のデータ準備
  const upsertData = batch.map((row, batchIndex) => {
    const globalIndex = result.successCount + result.errorCount + result.skipCount + batchIndex

    // 重複チェック
    if (existingRegNos.has(row.reg_no)) {
      const existingName = existingPlayersMap.get(row.reg_no)
      if (existingName && existingName !== row.name) {
        result.duplicates?.push({
          row: globalIndex + 1,
          reg_no: row.reg_no,
          existing_name: existingName,
          new_name: row.name
        })
      }
    }

    return {
      reg_no: parseInt(row.reg_no),
      player_name: row.name,
      grade: row.grade,
      name_kana: row.name_kana,
      external_url: row.external_url,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })

  // Supabase upsert実行
  const { error: upsertError } = await supabase
    .from('player')
    .upsert(upsertData, {
      onConflict: 'reg_no',
      ignoreDuplicates: false
    })
    .select('reg_no')

  if (upsertError) {
    // 個別エラーの場合は詳細を記録
    for (let i = 0; i < batch.length; i++) {
      const globalIndex = result.successCount + result.errorCount + result.skipCount + i
      result.errors.push({
        row: globalIndex + 1,
        reg_no: batch[i].reg_no,
        name: batch[i].name,
        message: `データベース更新エラー: ${upsertError.message}`,
        field: 'database'
      })
      result.errorCount++
    }
  } else {
    // 成功した場合
    result.successCount += batch.length
  }
}

/**
 * Health check / Info endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'players import',
    mode: DATA_MODE,
    available: DATA_MODE === 'live',
    batchSize: BATCH_SIZE,
    requiredHeaders: ['reg_no', 'name', 'grade'],
    optionalHeaders: ['name_kana', 'external_url']
  })
}