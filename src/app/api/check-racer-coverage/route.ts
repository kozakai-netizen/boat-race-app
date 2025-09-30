import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('🔍 選手データカバレッジ調査開始...')

    // 1. racer_entriesテーブルから実際の選手登録番号を10件取得
    const { data: programsRacers, error: programsError } = await supabase
      .from('racer_entries')
      .select('racer_registration_number, racer_name')
      .limit(10)

    if (programsError) {
      console.error('❌ Programs API選手データ取得エラー:', programsError)
      return NextResponse.json({ error: programsError.message }, { status: 500 })
    }

    if (!programsRacers || programsRacers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'racer_entriesテーブルにデータがありません（モックデータのみ使用中）',
        programsRacers: [],
        coverage: []
      })
    }

    console.log('📋 Programs APIから取得した選手:', programsRacers)

    // 2. 各選手がracer_dataテーブルに存在するかチェック
    const coverage = []
    for (const programsRacer of programsRacers) {
      const { data: racerData, error: racerError } = await supabase
        .from('racer_data')
        .select('racer_number, racer_name, period_year, period_half')
        .eq('racer_number', programsRacer.racer_registration_number)
        .limit(5)

      if (racerError) {
        console.error(`❌ 選手${programsRacer.racer_registration_number}の確認エラー:`, racerError)
        continue
      }

      coverage.push({
        registration_number: programsRacer.racer_registration_number,
        programs_name: programsRacer.racer_name,
        found_in_racer_data: racerData && racerData.length > 0,
        racer_data_records: racerData || [],
        record_count: racerData ? racerData.length : 0
      })
    }

    // 3. JLCデータの選手番号範囲確認
    const { data: minMaxNumbers, error: minMaxError } = await supabase
      .from('racer_data')
      .select('racer_number')
      .order('racer_number', { ascending: true })

    let numberRange = { min: null, max: null }
    if (!minMaxError && minMaxNumbers && minMaxNumbers.length > 0) {
      numberRange = {
        min: minMaxNumbers[0].racer_number,
        max: minMaxNumbers[minMaxNumbers.length - 1].racer_number
      }
    }

    // 4. JLCデータのサンプル選手名確認
    const { data: sampleNames, error: namesError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, racer_name_kana, branch')
      .neq('racer_name', '')
      .not('racer_name', 'like', '選手%')
      .limit(10)

    const result = {
      success: true,
      investigation: {
        programs_racers: programsRacers,
        coverage_check: coverage,
        coverage_rate: coverage.length > 0 ?
          (coverage.filter(c => c.found_in_racer_data).length / coverage.length * 100).toFixed(1) + '%' : 'N/A',
        jlc_number_range: numberRange,
        valid_name_samples: sampleNames || [],
        total_coverage_found: coverage.filter(c => c.found_in_racer_data).length,
        total_checked: coverage.length
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ カバレッジ調査完了:', result.investigation)

    return NextResponse.json(result)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ カバレッジ調査中にエラー:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}