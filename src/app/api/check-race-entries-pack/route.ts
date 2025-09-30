import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 race_entries_packテーブルの内容を確認中...')

    // race_entries_packの内容を取得（最初の3件）
    const { data, error } = await supabase
      .from('race_entries_pack')
      .select('*')
      .limit(3)

    if (error) {
      console.error('❌ race_entries_pack取得エラー:', error)
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

    return NextResponse.json({
      success: true,
      table_name: 'race_entries_pack',
      record_count: data?.length || 0,
      sample_data: data || [],
      table_structure: tableStructure,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ race_entries_pack確認中にエラーが発生:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}