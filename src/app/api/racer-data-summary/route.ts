import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * racer_dataテーブルの期別サマリーAPI
 * GET /api/racer-data-summary
 */
export async function GET() {
  try {
    console.log('📊 Starting racer_data summary...')

    const supabase = createClient()

    // 期別集計クエリはSkip（手動集計で代替）

    // 手動で集計（Supabaseでgroup byとcountの組み合わせが制限される場合）
    const groupedData: { [key: string]: number } = {}

    // 全レコードを取得して手動集計
    const { data: allRecords, error: allError } = await supabase
      .from('racer_data')
      .select('period_year, period_half')

    if (allError) {
      console.error('❌ All records query failed:', allError)
      return NextResponse.json({
        success: false,
        error: 'all_records_query_failed',
        details: allError.message
      }, { status: 500 })
    }

    if (allRecords) {
      allRecords.forEach(record => {
        const key = `${record.period_year}_${record.period_half}`
        groupedData[key] = (groupedData[key] || 0) + 1
      })
    }

    // 結果を整理
    const summaryResult = Object.entries(groupedData).map(([key, count]) => {
      const [year, half] = key.split('_')
      return {
        period_year: parseInt(year),
        period_half: half,
        count: count
      }
    }).sort((a, b) => {
      if (a.period_year !== b.period_year) {
        return a.period_year - b.period_year
      }
      return a.period_half.localeCompare(b.period_half)
    })

    console.log('✅ Summary completed:', summaryResult)

    return NextResponse.json({
      success: true,
      total_records: allRecords?.length || 0,
      summary: summaryResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Summary failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'summary_failed',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * 特定期のデータを削除するAPI
 * DELETE /api/racer-data-summary?period_year=2025&period_half=前期
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period_year = searchParams.get('period_year')
    const period_half = searchParams.get('period_half')

    if (!period_year || !period_half) {
      return NextResponse.json({
        success: false,
        error: 'missing_parameters',
        message: 'period_year and period_half are required'
      }, { status: 400 })
    }

    console.log(`🗑️ Deleting data for ${period_year}年${period_half}...`)

    const supabase = createClient()

    const { data, error } = await supabase
      .from('racer_data')
      .delete()
      .eq('period_year', parseInt(period_year))
      .eq('period_half', period_half)

    if (error) {
      console.error('❌ Delete failed:', error)
      return NextResponse.json({
        success: false,
        error: 'delete_failed',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully deleted data for ${period_year}年${period_half}`)

    return NextResponse.json({
      success: true,
      deleted_period: `${period_year}年${period_half}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Delete operation failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'delete_operation_failed',
      details: errorMessage
    }, { status: 500 })
  }
}