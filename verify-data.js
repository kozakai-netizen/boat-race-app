const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbqqoyukrxqdtjqgzhco.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXFveXVrcnhxZHRqcWd6aGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc2NzQ1NjYsImV4cCI6MjA0MzI1MDU2Nn0.THLJ7jGZF74j5P5bnF_JjBQkMIjh2nYGYm8kIGnIl1Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRacerData() {
  console.log('🔍 選手データ検証開始...\n')

  try {
    // 1. 総レコード数
    const { data: totalCount, error: totalError } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('❌ 総レコード数取得エラー:', totalError)
      return
    }

    console.log(`📊 総レコード数: ${totalCount?.length || 0}`)

    // 2. ユニーク選手数
    const { data: uniqueRacers, error: uniqueError } = await supabase
      .from('racer_data')
      .select('racer_number')

    if (uniqueError) {
      console.error('❌ ユニーク選手数取得エラー:', uniqueError)
      return
    }

    const uniqueRacerNumbers = new Set(uniqueRacers?.map(r => r.racer_number) || [])
    console.log(`👥 ユニーク選手数: ${uniqueRacerNumbers.size}`)

    // 3. 期別分布
    const { data: periodData, error: periodError } = await supabase
      .from('racer_data')
      .select('period_year, period_half')

    if (periodError) {
      console.error('❌ 期別分布取得エラー:', periodError)
      return
    }

    const periodCounts = {}
    periodData?.forEach(record => {
      const key = `${record.period_year}${record.period_half}`
      periodCounts[key] = (periodCounts[key] || 0) + 1
    })

    console.log('\n📅 期別分布:')
    Object.entries(periodCounts).forEach(([period, count]) => {
      console.log(`  ${period}: ${count}件`)
    })

    // 4. サンプルデータ（最初の5件）
    const { data: sampleData, error: sampleError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, racer_name_kana, branch, grade, period_year, period_half')
      .order('racer_number')
      .limit(5)

    if (sampleError) {
      console.error('❌ サンプルデータ取得エラー:', sampleError)
      return
    }

    console.log('\n📋 サンプルデータ（最初の5件）:')
    sampleData?.forEach((racer, index) => {
      console.log(`  ${index + 1}. ${racer.racer_number} ${racer.racer_name} (${racer.racer_name_kana}) ${racer.branch} ${racer.grade} ${racer.period_year}${racer.period_half}`)
    })

    // 5. 各期のファイル別件数確認
    console.log('\n📁 期別詳細:')
    const periods = [
      { year: 2024, half: '前期', file: 'fan2310.txt' },
      { year: 2024, half: '後期', file: 'fan2404.txt' },
      { year: 2025, half: '前期', file: 'fan2504.txt' },
      { year: 2025, half: '後期', file: 'fan2410.txt' }
    ]

    for (const period of periods) {
      const { data, error } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })
        .eq('period_year', period.year)
        .eq('period_half', period.half)

      if (!error) {
        console.log(`  ${period.year}${period.half} (${period.file}): ${data?.length || 0}件`)
      }
    }

    console.log('\n✅ データ検証完了！')

  } catch (error) {
    console.error('❌ 検証中にエラーが発生:', error)
  }
}

verifyRacerData()