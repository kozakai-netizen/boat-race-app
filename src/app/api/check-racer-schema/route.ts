import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * racer_dataテーブルのスキーマを確認するAPI
 * GET /api/check-racer-schema
 */
export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 Checking racer_data table schema...')

    // テーブル存在確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('racer_data')
      .select('*')
      .limit(1)

    let schemaInfo = null
    let existingRecords = 0

    if (!tableError) {
      // レコード数確認
      const { count } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })

      existingRecords = count || 0

      // スキーマ情報（サンプルレコードから推定）
      if (tableInfo && tableInfo.length > 0) {
        const sampleRecord = tableInfo[0]
        schemaInfo = Object.keys(sampleRecord).map(key => ({
          column_name: key,
          data_type: typeof sampleRecord[key],
          sample_value: sampleRecord[key]
        }))
      }
    }

    // PostgreSQLの情報スキーマから正確なスキーマ取得を試行
    let detailedSchema = null
    try {
      const { data: pgSchema, error: pgError } = await supabase
        .rpc('get_table_schema', { table_name: 'racer_data' })

      if (!pgError) {
        detailedSchema = pgSchema
      }
    } catch (e) {
      console.log('PostgreSQL schema query not available')
    }

    return NextResponse.json({
      success: true,
      table_exists: !tableError,
      existing_records: existingRecords,
      schema_from_sample: schemaInfo,
      detailed_schema: detailedSchema,
      compatibility_check: {
        required_for_fan2410: [
          'registration_number (TEXT/VARCHAR)',
          'name_kanji (TEXT/VARCHAR)',
          'name_kana (TEXT/VARCHAR)',
          'branch (TEXT/VARCHAR)',
          'class (TEXT/VARCHAR)',
          'gender (TEXT/VARCHAR)',
          'period_year (INTEGER)',
          'period_half (TEXT/VARCHAR)',
          'data_source (TEXT/VARCHAR)'
        ],
        recommendations: [
          'Ensure registration_number is PRIMARY KEY or UNIQUE',
          'Set period_year to 2024 for fan2410 data',
          'Set period_half to "後期" for fan2410 data',
          'Set data_source to "fan2410" for identification'
        ]
      },
      error_details: tableError ? {
        message: tableError.message,
        code: tableError.code,
        details: tableError.details
      } : null
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Schema check failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Schema check failed',
      details: errorMessage
    }, { status: 500 })
  }
}