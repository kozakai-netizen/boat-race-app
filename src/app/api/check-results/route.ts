import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 resultテーブルの最新データを確認中...')

    // resultテーブルの最新5件を取得
    const { data, error } = await supabase
      .from('result')
      .select('race_id, triple, payout, popularity')
      .order('race_id', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ result取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 総レコード数も確認
    const { count, error: countError } = await supabase
      .from('result')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      table_name: 'result',
      total_records: count || 0,
      latest_records_count: data?.length || 0,
      latest_race_ids: data?.map(r => r.race_id) || [],
      sample_data: data || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ result確認中にエラーが発生:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}