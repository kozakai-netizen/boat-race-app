const { createClient } = require('@supabase/supabase-js')

// Supabase接続設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRacerData() {
  console.log('🔍 JLCレーサーデータの検証を開始します...\n')

  try {
    // 1. 総レコード数をチェック
    console.log('1️⃣ 総レコード数をチェック中...')
    const { count: totalCount, error: countError } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ 総レコード数取得エラー:', countError)
      return
    }
    console.log(`✅ 総レコード数: ${totalCount}件\n`)

    // 2. ユニークレーサー数をチェック
    console.log('2️⃣ ユニークレーサー数をチェック中...')
    const { data: uniqueData, error: uniqueError } = await supabase
      .rpc('count_unique_racers')
      .single()

    if (uniqueError) {
      // RPCが無い場合は通常のクエリで代替
      console.log('RPC関数が無いため、通常クエリで代替します...')
      const { data: allRacers, error: racersError } = await supabase
        .from('racer_data')
        .select('racer_number')

      if (racersError) {
        console.error('❌ レーサーデータ取得エラー:', racersError)
        return
      }

      const uniqueRacers = new Set(allRacers.map(r => r.racer_number))
      console.log(`✅ ユニークレーサー数: ${uniqueRacers.size}人\n`)
    } else {
      console.log(`✅ ユニークレーサー数: ${uniqueData}人\n`)
    }

    // 3. 期間別分布をチェック
    console.log('3️⃣ 期間別分布をチェック中...')
    const { data: periodData, error: periodError } = await supabase
      .from('racer_data')
      .select('period_year, period_half')

    if (periodError) {
      console.error('❌ 期間データ取得エラー:', periodError)
      return
    }

    // 期間別にグループ化
    const periodStats = {}
    periodData.forEach(row => {
      const key = `${row.period_year}-${row.period_half}`
      periodStats[key] = (periodStats[key] || 0) + 1
    })

    console.log('期間別レコード数:')
    Object.entries(periodStats)
      .sort()
      .forEach(([period, count]) => {
        console.log(`  ${period}: ${count}件`)
      })
    console.log('')

    // 4. サンプルデータをチェック
    console.log('4️⃣ サンプルデータをチェック中...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, grade, period_year, period_half, all_races, all_1st, win_rate')
      .order('racer_number')
      .limit(5)

    if (sampleError) {
      console.error('❌ サンプルデータ取得エラー:', sampleError)
      return
    }

    console.log('サンプルデータ（上位5件）:')
    sampleData.forEach(racer => {
      console.log(`  ${racer.racer_number}: ${racer.racer_name} (${racer.grade}) - ${racer.period_year}${racer.period_half} - 勝率${racer.win_rate}% (${racer.all_1st}/${racer.all_races})`)
    })
    console.log('')

    // 5. データ品質チェック
    console.log('5️⃣ データ品質をチェック中...')

    // 勝率の範囲チェック
    const { data: winRateData, error: winRateError } = await supabase
      .from('racer_data')
      .select('win_rate')
      .not('win_rate', 'is', null)

    if (!winRateError && winRateData.length > 0) {
      const winRates = winRateData.map(r => r.win_rate)
      const minWinRate = Math.min(...winRates)
      const maxWinRate = Math.max(...winRates)
      const avgWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length

      console.log(`勝率範囲: ${minWinRate.toFixed(2)}% ~ ${maxWinRate.toFixed(2)}% (平均: ${avgWinRate.toFixed(2)}%)`)
    }

    // 級別分布チェック
    const { data: gradeData, error: gradeError } = await supabase
      .from('racer_data')
      .select('grade')

    if (!gradeError && gradeData.length > 0) {
      const gradeStats = {}
      gradeData.forEach(row => {
        gradeStats[row.grade] = (gradeStats[row.grade] || 0) + 1
      })

      console.log('級別分布:')
      Object.entries(gradeStats)
        .sort()
        .forEach(([grade, count]) => {
          const percentage = ((count / gradeData.length) * 100).toFixed(1)
          console.log(`  ${grade}: ${count}件 (${percentage}%)`)
        })
    }

    console.log('\n🎉 JLCレーサーデータの検証が完了しました！')

  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// 実行
verifyRacerData()