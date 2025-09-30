import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 JLCパース問題分析開始...')

    // 1. 選手番号の分布確認
    const { data: numberDistribution, error: distributionError } = await supabase
      .from('racer_data')
      .select('racer_number')
      .order('racer_number')

    if (distributionError) {
      console.error('❌ 選手番号分布取得エラー:', distributionError)
      return NextResponse.json({ error: distributionError.message }, { status: 500 })
    }

    // 2. 選手番号の範囲とギャップ分析
    const numbers = numberDistribution?.map(r => r.racer_number) || []
    const uniqueNumbers = [...new Set(numbers)]

    let gaps = []
    for (let i = 1; i < uniqueNumbers.length; i++) {
      const gap = uniqueNumbers[i] - uniqueNumbers[i-1]
      if (gap > 1) {
        gaps.push({
          from: uniqueNumbers[i-1],
          to: uniqueNumbers[i],
          missing_count: gap - 1,
          missing_range: `${uniqueNumbers[i-1] + 1}-${uniqueNumbers[i] - 1}`
        })
      }
    }

    // 3. 実際の選手名が入っているレコード数確認
    const { data: validNames, error: validNamesError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, racer_name_kana, branch')
      .neq('racer_name', '')
      .not('racer_name', 'like', '選手%')

    // 4. デフォルト名（"選手XXXX"）のレコード数
    const { data: defaultNames, error: defaultNamesError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name')
      .like('racer_name', '選手%')

    // 5. 各期で重複している選手数
    const { data: duplicateAnalysis, error: duplicateError } = await supabase
      .rpc('analyze_duplicate_racers')
      .single()

    // SQLでカスタム分析関数が無い場合の手動分析
    const periodAnalysis = {}
    const periods = [
      { year: 2024, half: '前期' },
      { year: 2024, half: '後期' },
      { year: 2025, half: '前期' },
      { year: 2025, half: '後期' }
    ]

    for (const period of periods) {
      const { data: periodData, error: periodError } = await supabase
        .from('racer_data')
        .select('racer_number')
        .eq('period_year', period.year)
        .eq('period_half', period.half)

      if (!periodError && periodData) {
        const periodNumbers = new Set(periodData.map(r => r.racer_number))
        periodAnalysis[`${period.year}${period.half}`] = {
          total_records: periodData.length,
          unique_racers: periodNumbers.size,
          duplicate_count: periodData.length - periodNumbers.size
        }
      }
    }

    const result = {
      success: true,
      analysis: {
        total_unique_racers: uniqueNumbers.length,
        number_range: {
          min: Math.min(...uniqueNumbers),
          max: Math.max(...uniqueNumbers),
          expected_range: '競艇選手番号は通常3000-5000番台',
          actual_range: `${Math.min(...uniqueNumbers)}-${Math.max(...uniqueNumbers)}`
        },
        gaps_in_numbers: {
          total_gaps: gaps.length,
          largest_gaps: gaps.sort((a, b) => b.missing_count - a.missing_count).slice(0, 5),
          total_missing: gaps.reduce((sum, gap) => sum + gap.missing_count, 0)
        },
        name_quality: {
          valid_names_count: validNames?.length || 0,
          default_names_count: defaultNames?.length || 0,
          valid_names_percentage: validNames && defaultNames ?
            ((validNames.length / (validNames.length + defaultNames.length)) * 100).toFixed(1) + '%' : 'N/A'
        },
        period_analysis: periodAnalysis,
        sample_valid_racers: validNames?.slice(0, 10) || [],
        sample_gaps: gaps.slice(0, 5)
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ JLCパース分析完了:', result.analysis)

    return NextResponse.json(result)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ JLCパース分析中にエラー:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}