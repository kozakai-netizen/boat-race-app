import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 選手データ検証開始...')

    // 1. 総レコード数
    const { count: totalCount, error: totalError } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('❌ 総レコード数取得エラー:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    // 2. ユニーク選手数の計算
    const { data: allRacers, error: racersError } = await supabase
      .from('racer_data')
      .select('racer_number')

    if (racersError) {
      console.error('❌ 選手データ取得エラー:', racersError)
      return NextResponse.json({ error: racersError.message }, { status: 500 })
    }

    const uniqueRacerNumbers = new Set(allRacers?.map(r => r.racer_number) || [])

    // 3. 期別分布
    const { data: periodData, error: periodError } = await supabase
      .from('racer_data')
      .select('period_year, period_half')

    if (periodError) {
      console.error('❌ 期別分布取得エラー:', periodError)
      return NextResponse.json({ error: periodError.message }, { status: 500 })
    }

    const periodCounts: Record<string, number> = {}
    periodData?.forEach(record => {
      const key = `${record.period_year}${record.period_half}`
      periodCounts[key] = (periodCounts[key] || 0) + 1
    })

    // 4. サンプルデータ（最初の5件）
    const { data: sampleData, error: sampleError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, racer_name_kana, branch, grade, period_year, period_half')
      .order('racer_number')
      .limit(5)

    if (sampleError) {
      console.error('❌ サンプルデータ取得エラー:', sampleError)
      return NextResponse.json({ error: sampleError.message }, { status: 500 })
    }

    // 5. 各期の詳細データ
    const periods = [
      { year: 2024, half: '前期', file: 'fan2310.txt' },
      { year: 2024, half: '後期', file: 'fan2404.txt' },
      { year: 2025, half: '前期', file: 'fan2504.txt' },
      { year: 2025, half: '後期', file: 'fan2410.txt' }
    ]

    const periodDetails = []
    for (const period of periods) {
      const { count, error } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })
        .eq('period_year', period.year)
        .eq('period_half', period.half)

      if (!error) {
        periodDetails.push({
          period: `${period.year}${period.half}`,
          file: period.file,
          count: count || 0
        })
      }
    }

    const result = {
      success: true,
      verification: {
        totalRecords: totalCount || 0,
        uniqueRacers: uniqueRacerNumbers.size,
        periodDistribution: periodCounts,
        sampleData: sampleData || [],
        periodDetails,
        timestamp: new Date().toISOString()
      }
    }

    console.log('✅ データ検証完了:', result.verification)

    return NextResponse.json(result)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ 検証中にエラーが発生:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}