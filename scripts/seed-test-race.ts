#!/usr/bin/env tsx

/**
 * テストレース用シードスクリプト
 * Usage: npm run seed:test:suminoye
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test race data templates
const createTestRace = (raceNo: number, date: string = '2025-09-24') => {
  const raceId = `suminoye-${date.replace(/-/g, '')}-${raceNo}R`
  const closeAt = new Date()
  closeAt.setHours(10 + raceNo, 45, 0, 0) // 10:45, 11:45, etc.

  return {
    race: {
      race_id: raceId,
      venue: 'suminoye',
      date,
      race_no: raceNo,
      grade: 'normal',
      close_at: closeAt.toISOString(),
    },
    forecasts: [
      {
        race_id: raceId,
        combo: '1-2-3',
        prob: 0.085,
        ev: 1.7,
        super: true,
        why: JSON.stringify({
          summary: `${raceNo}Rの予想根拠: 1号艇の好スタートと2,3号艇の安定した走りを評価`,
          factors: ['スタート良好', '展示タイム優秀', '節間成績安定'],
          icons: ['🚀', '🧱', '💨']
        }),
      },
      {
        race_id: raceId,
        combo: '1-3-2',
        prob: 0.072,
        ev: 1.55,
        super: true,
        why: JSON.stringify({
          summary: '1号艇軸の堅実予想',
          factors: ['1着率高', '展示差良好'],
          icons: ['🚀', '🧱']
        }),
      },
      {
        race_id: raceId,
        combo: '2-1-3',
        prob: 0.058,
        ev: 1.9,
        super: true,
        why: JSON.stringify({
          summary: '2号艇の差し決まりに期待',
          factors: ['まわり足良好', '風向き有利'],
          icons: ['⚡', '💨']
        }),
      },
      {
        race_id: raceId,
        combo: '3-1-2',
        prob: 0.045,
        ev: 1.2,
        super: false,
        why: JSON.stringify({
          summary: '3号艇の捲り期待',
          factors: ['パワーある'],
          icons: ['💨']
        }),
      },
    ],
    result: Math.random() > 0.7 ? {
      race_id: raceId,
      triple: ['1-2-3', '1-3-2', '2-1-3'][Math.floor(Math.random() * 3)],
      payout: Math.floor(Math.random() * 50000) + 1000,
      popularity: Math.floor(Math.random() * 10) + 1,
    } : null
  }
}

async function seedTestRaces(date: string = '2025-09-24', raceCount: number = 5) {
  console.log('🏁 住之江ボートレース テストデータ投入開始...')
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  console.log(`📅 日付: ${date}`)
  console.log(`🏁 レース数: ${raceCount}`)

  const racesToCreate = Array.from({ length: raceCount }, (_, i) => i + 1) // 指定レース数分作成
  const allData = racesToCreate.map(raceNo => createTestRace(raceNo, date))

  try {
    // 1. Race データ投入
    console.log('📋 レースデータ投入中...')
    const raceData = allData.map(d => d.race)
    const { error: raceError } = await supabase
      .from('race')
      .upsert(raceData, { onConflict: 'race_id' })

    if (raceError) {
      console.error('❌ レースデータ投入エラー:', raceError)
      return
    }
    console.log(`✅ ${raceData.length}件のレースデータを投入`)

    // 2. Forecast データ投入
    console.log('🎯 予想データ投入中...')
    const forecastData = allData.flatMap(d => d.forecasts)
    const { error: forecastError } = await supabase
      .from('forecast')
      .upsert(forecastData, { onConflict: 'race_id,combo' })

    if (forecastError) {
      console.error('❌ 予想データ投入エラー:', forecastError)
      return
    }
    console.log(`✅ ${forecastData.length}件の予想データを投入`)

    // 3. Result データ投入（一部のレースのみ）
    console.log('📊 結果データ投入中...')
    const resultData = allData
      .map(d => d.result)
      .filter(result => result !== null)

    if (resultData.length > 0) {
      const { error: resultError } = await supabase
        .from('result')
        .upsert(resultData, { onConflict: 'race_id' })

      if (resultError) {
        console.error('❌ 結果データ投入エラー:', resultError)
        return
      }
      console.log(`✅ ${resultData.length}件の結果データを投入`)
    }

    console.log('')
    console.log('🎉 テストデータ投入完了!')
    console.log('👀 確認用URL:')
    racesToCreate.forEach(raceNo => {
      const raceId = `suminoye-${date.replace(/-/g, '')}-${raceNo}R`
      console.log(`   http://localhost:3002/race/${raceId}`)
    })
    console.log('')
    console.log('📡 API確認コマンド:')
    console.log(`   curl "http://localhost:3002/api/forecast/suminoye-${date.replace(/-/g, '')}-1R" | jq .`)
    console.log(`   curl "http://localhost:3002/api/results/suminoye?date=${date}" | jq .`)

  } catch (error) {
    console.error('❌ シードスクリプト実行エラー:', error)
    process.exit(1)
  }
}

// コマンドライン引数パース
function parseArgs() {
  const args = process.argv.slice(2)
  let date = '2025-09-24'
  let raceCount = 5

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1]
      i++
    } else if (args[i] === '--races' && args[i + 1]) {
      raceCount = parseInt(args[i + 1])
      i++
    }
  }

  return { date, raceCount }
}

// メイン実行
if (require.main === module) {
  const { date, raceCount } = parseArgs()

  seedTestRaces(date, raceCount).then(() => {
    console.log('✨ シードスクリプト完了')
    process.exit(0)
  }).catch(error => {
    console.error('💥 シードスクリプト失敗:', error)
    process.exit(1)
  })
}

export { seedTestRaces, createTestRace }