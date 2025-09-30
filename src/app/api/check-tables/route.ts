import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 Supabaseの既存テーブル一覧を確認中...')

    // information_schemaから公開テーブル一覧を取得
    const { data, error } = await supabase
      .rpc('get_public_tables')

    if (error) {
      // RPC関数が無い場合、直接SQLで取得を試行
      console.log('RPC関数が無いため、別の方法でテーブル一覧を取得します...')

      // 既知のテーブルを個別に確認
      const knownTables = [
        'result',
        'racer_data',
        'racer_entries',
        'programs_ingest_log',
        'ingest_log',
        'race_entries_pack'
      ]

      const tableStatus = []

      for (const tableName of knownTables) {
        try {
          const { count, error: tableError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (tableError) {
            tableStatus.push({
              table_name: tableName,
              status: 'not_exists',
              error: tableError.message
            })
          } else {
            tableStatus.push({
              table_name: tableName,
              status: 'exists',
              record_count: count || 0
            })
          }
        } catch (e) {
          tableStatus.push({
            table_name: tableName,
            status: 'error',
            error: String(e)
          })
        }
      }

      return NextResponse.json({
        success: true,
        method: 'individual_check',
        tables: tableStatus,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      method: 'rpc_function',
      tables: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ テーブル確認中にエラーが発生:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}