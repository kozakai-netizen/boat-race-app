/**
 * racer_dataテーブルから選手データを取得してpredictionEngineに渡すアダプター
 */

import { createClient } from '@/lib/supabase'
import type { RacerEntry } from '@/lib/prediction/predictionEngine'

export interface RacerDataRecord {
  racer_number: number
  racer_name: string
  grade: 'A1' | 'A2' | 'B1' | 'B2'
  branch: string
  period_year: number
  period_half: string
}

/**
 * raceIdからシード値を生成（決定論的選手選出用）
 */
function generateSeedFromRaceId(raceId: string): number {
  let hash = 0
  for (let i = 0; i < raceId.length; i++) {
    const char = raceId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit int conversion
  }
  return Math.abs(hash)
}

/**
 * シード値を使った決定論的ランダム選択
 */
function seededRandom(seed: number): () => number {
  let currentSeed = seed
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
}

/**
 * グレード別の重み付け（強い選手が選ばれやすくする）
 */
function getGradeWeight(grade: string): number {
  switch (grade) {
    case 'A1': return 4  // 最強クラス
    case 'A2': return 3  // 上位クラス
    case 'B1': return 2  // 中堅クラス
    case 'B2': return 1  // 新人クラス
    default: return 1
  }
}

/**
 * racer_dataから選手データを取得してレース用のエントリーを生成
 */
export async function fetchRaceEntriesFromRacerData(raceId: string): Promise<RacerEntry[]> {
  try {
    console.log(`🏁 [RacerDataAdapter] ===== DATA SOURCE DEBUG START =====`)
    console.log(`🏁 [RacerDataAdapter] Fetching racers for race: ${raceId}`)
    console.log(`🏁 [RacerDataAdapter] Target table: racer_data`)
    console.log(`🏁 [RacerDataAdapter] Query conditions: period_year=2024, period_half='後期'`)

    const supabase = createClient()

    // racer_dataから2024年後期の選手データを取得
    console.log(`🏁 [RacerDataAdapter] Executing Supabase query to racer_data table...`)
    const { data: allRacers, error } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, grade, branch')
      .eq('period_year', 2024)
      .eq('period_half', '後期')

    if (error) {
      console.error(`❌ [RacerDataAdapter] Supabase query failed:`, error)
      throw new Error(`Failed to fetch racer data: ${error.message}`)
    }

    if (!allRacers || allRacers.length === 0) {
      console.error(`❌ [RacerDataAdapter] No data returned from racer_data table`)
      throw new Error('No racer data available')
    }

    console.log(`📊 [RacerDataAdapter] ✅ Successfully fetched from racer_data table`)
    console.log(`📊 [RacerDataAdapter] Found ${allRacers.length} available racers`)
    console.log(`📊 [RacerDataAdapter] Sample racers from racer_data:`)
    allRacers.slice(0, 3).forEach((racer, index) => {
      console.log(`📊 [RacerDataAdapter]   ${index + 1}: ${racer.racer_number} - ${racer.racer_name} (${racer.grade}) [${racer.branch}]`)
    })

    // raceIdから決定論的シード生成
    const seed = generateSeedFromRaceId(raceId)
    const random = seededRandom(seed)

    console.log(`🎲 [RacerDataAdapter] Using seed ${seed} for racer selection`)

    // グレード分布を考慮した選手選出
    const selectedRacers: RacerDataRecord[] = []
    const usedRacerNumbers = new Set<number>()

    // 6人選出するまで繰り返し
    while (selectedRacers.length < 6 && selectedRacers.length < allRacers.length) {
      // 重み付きランダム選択
      const weights = allRacers.map(racer =>
        usedRacerNumbers.has(racer.racer_number) ? 0 : getGradeWeight(racer.grade)
      )

      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
      if (totalWeight === 0) break

      let randomValue = random() * totalWeight
      let selectedIndex = 0

      for (let i = 0; i < weights.length; i++) {
        randomValue -= weights[i]
        if (randomValue <= 0) {
          selectedIndex = i
          break
        }
      }

      const selectedRacer = allRacers[selectedIndex]
      if (!usedRacerNumbers.has(selectedRacer.racer_number)) {
        selectedRacers.push(selectedRacer)
        usedRacerNumbers.add(selectedRacer.racer_number)
      }
    }

    console.log(`✅ [RacerDataAdapter] Selected ${selectedRacers.length} racers from racer_data:`)
    selectedRacers.forEach((racer, index) => {
      console.log(`  Lane ${index + 1}: ${racer.racer_number} ${racer.racer_name} (${racer.grade}) [${racer.branch}]`)
    })

    console.log(`🔄 [RacerDataAdapter] Converting racer_data to RacerEntry format...`)
    // predictionEngine用のRacerEntry形式に変換
    const raceEntries: RacerEntry[] = selectedRacers.map((racer, index) => ({
      lane: index + 1,                          // レーン番号 (1-6)
      player_name: racer.racer_name,             // 選手名
      player_grade: racer.grade,                 // 級別
      st_time: generateRealisticSTTime(racer.grade, random), // ST時間（生成）
      exhibition_time: generateExhibitionTime(racer.grade, random), // 展示タイム（生成）
      motor_rate: generateMotorRate(random),     // モーター2連率（生成）
      two_rate: generateTwoRate(racer.grade, random),  // 2連率（生成）
      three_rate: generateThreeRate(racer.grade, random), // 3連率（生成）
      national_win_rate: generateWinRate(racer.grade, random), // 全国勝率（生成）
      local_win_rate: generateWinRate(racer.grade, random),    // 当地勝率（生成）
      foul_count: 0,                            // フライング回数
      is_local: false                           // 地元選手フラグ
    }))

    console.log(`🎯 [RacerDataAdapter] Generated ${raceEntries.length} race entries`)
    console.log(`🎯 [RacerDataAdapter] Final racer names from racer_data table:`)
    raceEntries.forEach((entry, index) => {
      console.log(`🎯 [RacerDataAdapter]   Lane ${entry.lane}: ${entry.player_name} (${entry.player_grade})`)
    })
    console.log(`🏁 [RacerDataAdapter] ===== DATA SOURCE DEBUG END =====`)

    return raceEntries

  } catch (error) {
    console.error('❌ [RacerDataAdapter] Error fetching race entries:', error)
    throw error
  }
}

/**
 * グレードに応じたリアリスティックなST時間を生成
 */
function generateRealisticSTTime(grade: string, random: () => number): number {
  const baseTimes = {
    'A1': 0.16,  // A1級の平均ST
    'A2': 0.17,  // A2級の平均ST
    'B1': 0.18,  // B1級の平均ST
    'B2': 0.19   // B2級の平均ST
  }

  const baseTime = baseTimes[grade as keyof typeof baseTimes] || 0.18
  const variation = (random() - 0.5) * 0.04 // ±0.02秒の変動
  return Math.max(0.10, Math.min(0.25, baseTime + variation))
}

/**
 * グレードに応じた展示タイムを生成
 */
function generateExhibitionTime(grade: string, random: () => number): number {
  const baseTimes = {
    'A1': 6.75,  // A1級の平均展示タイム
    'A2': 6.85,  // A2級の平均展示タイム
    'B1': 6.95,  // B1級の平均展示タイム
    'B2': 7.05   // B2級の平均展示タイム
  }

  const baseTime = baseTimes[grade as keyof typeof baseTimes] || 6.95
  const variation = (random() - 0.5) * 0.40 // ±0.20秒の変動
  return Math.max(6.50, Math.min(7.50, baseTime + variation))
}

/**
 * モーター2連率を生成
 */
function generateMotorRate(random: () => number): number {
  return Math.floor(random() * 30) + 20 // 20-50%
}

/**
 * グレードに応じた2連率を生成
 */
function generateTwoRate(grade: string, random: () => number): number {
  const baseRates = {
    'A1': 40,
    'A2': 35,
    'B1': 30,
    'B2': 25
  }

  const baseRate = baseRates[grade as keyof typeof baseRates] || 30
  const variation = (random() - 0.5) * 10 // ±5%の変動
  return Math.max(15, Math.min(60, baseRate + variation))
}

/**
 * グレードに応じた3連率を生成
 */
function generateThreeRate(grade: string, random: () => number): number {
  const baseRates = {
    'A1': 25,
    'A2': 22,
    'B1': 18,
    'B2': 15
  }

  const baseRate = baseRates[grade as keyof typeof baseRates] || 18
  const variation = (random() - 0.5) * 8 // ±4%の変動
  return Math.max(10, Math.min(40, baseRate + variation))
}

/**
 * グレードに応じた勝率を生成
 */
function generateWinRate(grade: string, random: () => number): number {
  const baseRates = {
    'A1': 6.5,
    'A2': 5.5,
    'B1': 4.5,
    'B2': 3.5
  }

  const baseRate = baseRates[grade as keyof typeof baseRates] || 4.5
  const variation = (random() - 0.5) * 2 // ±1.0%の変動
  return Math.max(2.0, Math.min(9.0, baseRate + variation))
}