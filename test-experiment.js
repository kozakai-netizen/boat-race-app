// Programs API実証実験の簡易テスト
const { fetchProgramsApiData, analyzeExperimentData, generateDateRange } = require('./src/lib/experiment/programsApiExperiment.ts')

async function runQuickTest() {
  console.log('🧪 Programs API実証実験 - クイックテスト')
  console.log('='.repeat(50))

  try {
    // 過去3日間のデータを取得してテスト
    const dates = generateDateRange('2025-09-26', 3) // 26, 27, 28日
    console.log('📅 テスト対象日:', dates.join(', '))

    const dataPoints = []

    for (const date of dates) {
      console.log(`\n📊 ${date}のデータ取得中...`)
      try {
        const result = await fetchProgramsApiData(date)
        dataPoints.push(result)

        if (result.error) {
          console.log(`   ❌ エラー: ${result.error}`)
        } else {
          console.log(`   ✅ 成功: ${result.stadiums.length}会場のデータ取得`)

          // 会場詳細を表示
          result.stadiums.forEach(stadium => {
            console.log(`     Stadium ${stadium.stadium}: ${stadium.races.length}レース`)
          })
        }
      } catch (error) {
        console.log(`   ❌ 例外: ${error.message}`)
        dataPoints.push({
          date,
          timestamp: new Date().toISOString(),
          stadiums: [],
          error: error.message
        })
      }

      // API負荷軽減のため1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 分析実行
    console.log('\n📈 データ分析中...')
    const summary = analyzeExperimentData(dataPoints)

    console.log('\n' + '='.repeat(50))
    console.log('📋 実証実験結果サマリー')
    console.log('='.repeat(50))
    console.log(`データ収集成功日数: ${summary.totalDaysCollected}`)
    console.log(`検出された会場数: ${Object.keys(summary.stadiumMapping).length}`)
    console.log(`選手データ完全性: ${(summary.dataQuality.racerDataCompleteness * 100).toFixed(1)}%`)

    console.log('\n🏟️ 検出された会場:')
    Object.entries(summary.stadiumMapping).forEach(([stadiumId, info]) => {
      console.log(`  Stadium ${stadiumId}: ${info.confirmedName} (${info.appearanceDays}日, ${info.totalRaces}レース)`)
      if (info.sampleRacerNames.length > 0) {
        console.log(`    選手例: ${info.sampleRacerNames.slice(0, 3).join(', ')}`)
      }
    })

    console.log('\n💡 推奨事項:')
    summary.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message)
  }
}

// Node.js環境で実行
if (typeof require !== 'undefined' && require.main === module) {
  runQuickTest()
}