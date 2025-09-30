import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 データベース状態確認開始...')

    // 1. racer_dataテーブルの存在確認
    const { data: racerData, error: racerError } = await supabase
      .from('racer_data')
      .select('*')
      .limit(1)

    console.log('racer_dataテーブル確認:', { racerData, racerError })

    // 2. resultテーブルの確認（比較用）
    const { data: resultData, error: resultError } = await supabase
      .from('result')
      .select('*')
      .limit(1)

    console.log('resultテーブル確認:', { resultData, resultError })

    // 3. 他の既知テーブルの確認
    const tables = ['racer_entries', 'ingest_log', 'programs_ingest_log']
    const tableChecks = []

    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      tableChecks.push({
        table: tableName,
        exists: !error,
        error: error?.message,
        hasData: data && data.length > 0
      })
    }

    return NextResponse.json({
      success: true,
      checks: {
        racer_data: {
          exists: !racerError,
          error: racerError?.message,
          sampleData: racerData,
          hasData: racerData && racerData.length > 0
        },
        result: {
          exists: !resultError,
          error: resultError?.message,
          hasData: resultData && resultData.length > 0
        },
        otherTables: tableChecks,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ データベース確認エラー:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}