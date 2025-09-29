import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Boatrace Open API の型定義
interface BoatraceApiProgram {
  date: string
  stadium: number
  race: number
  title: string
  grade: number
  is_series: boolean
  entries: Array<{
    lane: number
    name: string
    id: number
    home: number
    birth_place: string
    age: number
    weight: number
    class: string
    nationwide_win_rate: number
    nationwide_quinella_rate: number
    local_win_rate: number
    local_quinella_rate: number
    motor_no: number
    motor_quinella_rate: number
    boat_no: number
    boat_quinella_rate: number
    st_time: number
  }>
}

interface BoatraceApiResult {
  date: string
  stadium: number
  race: number
  win_lane: number
  quinella_lanes: number[]
  trifecta_lanes: number[]
  payouts?: {
    win?: number
    quinella?: number
    trifecta?: number
  }
}

/**
 * 住之江競艇場のデータを取得・保存するAPI
 * GET /api/admin/ingest?date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // 日付検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const SUMINOYE_STADIUM_CODE = 12

    console.log(`🔄 Starting data ingestion for ${dateParam}`)

    // 1. 出走表データ取得
    const programUrl = `https://boatraceopenapi.github.io/programs/v2/${dateParam}.json`
    console.log(`📥 Fetching programs from: ${programUrl}`)

    const programResponse = await fetch(programUrl)
    if (!programResponse.ok) {
      throw new Error(`Failed to fetch program data: ${programResponse.status}`)
    }

    const allPrograms: BoatraceApiProgram[] = await programResponse.json()

    // 住之江のデータのみフィルタリング
    const suminoyePrograms = allPrograms.filter(
      program => program.stadium === SUMINOYE_STADIUM_CODE
    )

    console.log(`📊 Found ${suminoyePrograms.length} races for Suminoye`)

    // 2. 結果データ取得（当日以前の場合のみ）
    const today = new Date().toISOString().split('T')[0]
    let suminoyeResults: BoatraceApiResult[] = []

    if (dateParam <= today) {
      try {
        const resultUrl = `https://boatraceopenapi.github.io/results/v2/${dateParam}.json`
        console.log(`📥 Fetching results from: ${resultUrl}`)

        const resultResponse = await fetch(resultUrl)
        if (resultResponse.ok) {
          const allResults: BoatraceApiResult[] = await resultResponse.json()
          suminoyeResults = allResults.filter(
            result => result.stadium === SUMINOYE_STADIUM_CODE
          )
          console.log(`🏁 Found ${suminoyeResults.length} results for Suminoye`)
        }
      } catch (error) {
        console.warn('⚠️ Results data not available (might be future date):', error)
      }
    }

    // 3. データベースへの保存
    let savedRaces = 0
    let savedEntries = 0
    let savedResults = 0

    for (const program of suminoyePrograms) {
      const raceId = `suminoye-${dateParam}-${program.race}R`

      // レース基本情報の保存
      const { error: raceError } = await supabase
        .from('race')
        .upsert({
          race_id: raceId,
          venue: 'suminoye',
          date: dateParam,
          race_number: program.race,
          title: program.title,
          grade: program.grade === 1 ? 'G1' : program.grade === 2 ? 'G2' : program.grade === 3 ? 'G3' : 'normal',
          close_at: null, // 締切時刻は別途設定が必要
          has_super: false, // 後で予想計算時に設定
          source: 'boatrace_open_api',
          updated_at: new Date().toISOString()
        })

      if (raceError) {
        console.error(`❌ Failed to save race ${raceId}:`, raceError)
        continue
      }

      savedRaces++

      // 出走選手情報の保存
      for (const entry of program.entries) {
        const { error: entryError } = await supabase
          .from('entry')
          .upsert({
            race_id: raceId,
            lane: entry.lane,
            player_name: entry.name,
            player_id: entry.id,
            player_grade: entry.class,
            home_prefecture: entry.birth_place,
            age: entry.age,
            weight: entry.weight,
            win_rate: entry.local_win_rate,
            quinella_rate: entry.local_quinella_rate,
            motor_no: entry.motor_no,
            motor_rate: entry.motor_quinella_rate,
            boat_no: entry.boat_no,
            boat_rate: entry.boat_quinella_rate,
            st_time: entry.st_time,
            source: 'boatrace_open_api',
            updated_at: new Date().toISOString()
          })

        if (entryError) {
          console.error(`❌ Failed to save entry ${raceId}-${entry.lane}:`, entryError)
        } else {
          savedEntries++
        }
      }

      // 結果データの保存（ある場合のみ）
      const raceResult = suminoyeResults.find(
        result => result.race === program.race
      )

      if (raceResult) {
        const { error: resultError } = await supabase
          .from('result')
          .upsert({
            race_id: raceId,
            win_triple: raceResult.trifecta_lanes.join('-'),
            win_quinella: raceResult.quinella_lanes.join('-'),
            win_lane: raceResult.win_lane,
            payouts: raceResult.payouts || {},
            source: 'boatrace_open_api',
            updated_at: new Date().toISOString()
          })

        if (resultError) {
          console.error(`❌ Failed to save result ${raceId}:`, resultError)
        } else {
          savedResults++
        }
      }
    }

    console.log(`✅ Data ingestion completed:`)
    console.log(`   📋 Races: ${savedRaces}`)
    console.log(`   👥 Entries: ${savedEntries}`)
    console.log(`   🏁 Results: ${savedResults}`)

    return NextResponse.json({
      success: true,
      date: dateParam,
      venue: 'suminoye',
      summary: {
        races_saved: savedRaces,
        entries_saved: savedEntries,
        results_saved: savedResults,
        source: 'boatrace_open_api'
      },
      message: `Successfully ingested data for ${dateParam}`
    })

  } catch (error) {
    console.error('❌ Ingestion failed:', error)
    return NextResponse.json(
      {
        error: 'Data ingestion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}