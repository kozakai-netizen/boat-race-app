import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 programs_ingest_logテーブルの内容を確認中...')

    // programs_ingest_logの内容を取得（最新5件）
    const { data, error } = await supabase
      .from('programs_ingest_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ programs_ingest_log取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // テーブル構造も確認（データがある場合）
    let tableStructure = null
    if (data && data.length > 0) {
      const firstRecord = data[0]
      tableStructure = Object.keys(firstRecord).map(key => ({
        column_name: key,
        data_type: typeof firstRecord[key],
        sample_value: firstRecord[key]
      }))
    }

    // 総レコード数も確認
    const { count, error: countError } = await supabase
      .from('programs_ingest_log')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      table_name: 'programs_ingest_log',
      total_records: count || 0,
      latest_records_count: data?.length || 0,
      sample_data: data || [],
      table_structure: tableStructure,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ programs_ingest_log確認中にエラーが発生:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}