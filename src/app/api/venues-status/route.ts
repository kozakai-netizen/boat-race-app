import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * 各会場の今日の開催状況を取得するAPI
 * GET /api/venues-status
 */
export async function GET() {
  try {
    console.log('🏟️ [Venues Status] Fetching venue status from result table...')

    const supabase = createClient()

    // スマート日付検索: 本日 → データ無ければテスト期間
    const today = new Date().toISOString().split('T')[0]

    // まず本日のデータが存在するかチェック
    const { data: todayCheck, error: todayError } = await supabase
      .from('result')
      .select('race_id')
      .gte('race_id', today)
      .lte('race_id', `${today}-99`)
      .limit(1)

    let queryStartDate, queryEndDate, displayPeriod

    if (todayCheck && todayCheck.length > 0) {
      // 本日のデータが存在する場合
      queryStartDate = today
      queryEndDate = today
      displayPeriod = `本日 ${today}`
      console.log(`📅 [Venues Status] Using today's data: ${today}`)
    } else {
      // 本日のデータが無い場合はテスト期間を使用
      queryStartDate = '2025-08-01'
      queryEndDate = '2025-08-02'
      displayPeriod = `テスト期間 ${queryStartDate} - ${queryEndDate}`
      console.log(`📅 [Venues Status] No data for today, using test period: ${queryStartDate} - ${queryEndDate}`)
    }

    // 対応済み会場リスト
    const venues = [
      { id: 1, name: '桐生', region: '関東', grade: '一般', raceTitle: '一般競走', hasWomen: false },
      { id: 2, name: '戸田', region: '関東', grade: 'G3', raceTitle: '記念競走', hasWomen: false },
      { id: 11, name: 'びわこ', region: '関西', grade: '一般', raceTitle: '一般競走', hasWomen: false },
      { id: 12, name: '住之江', region: '関西', grade: 'G1', raceTitle: 'グランプリ', hasWomen: true },
      { id: 13, name: '尼崎', region: '関西', grade: 'G2', raceTitle: '周年記念', hasWomen: true },
      { id: 22, name: '福岡', region: '九州', grade: 'G3', raceTitle: '企業杯', hasWomen: true }
    ]

    // resultテーブルから指定期間のデータを取得
    const { data: raceResults, error: resultsError } = await supabase
      .from('result')
      .select('race_id, triple, payout, settled_at')
      .gte('race_id', `${queryStartDate}`)
      .lte('race_id', `${queryEndDate}-99`)
      .order('race_id', { ascending: false })

    if (resultsError) {
      console.error('❌ [Venues Status] Database query failed:', resultsError)
      // エラー時は全会場をdisconnectedとして返す
      const disconnectedVenues = venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        region: venue.region,
        status: 'データなし',
        dataStatus: 'disconnected',
        races: 0,
        nextRace: null,
        isCompleted: false,
        grade: venue.grade,
        raceTitle: venue.raceTitle,
        day: null,
        hasWomen: venue.hasWomen
      }))

      return NextResponse.json({
        success: true,
        date: displayPeriod,
        venues: disconnectedVenues,
        summary: { connectedVenues: 0, activeVenues: 0, totalVenues: venues.length },
        timestamp: new Date().toISOString(),
        note: 'Using fallback data due to database error'
      })
    }

    console.log(`📄 [Venues Status] Found ${raceResults?.length || 0} race results`)

    const venueStatuses = []

    for (const venue of venues) {
      try {
        // この会場のレース結果を抽出
        const venueRaces = raceResults?.filter(result => {
          const raceIdParts = result.race_id.split('-')
          return parseInt(raceIdParts[2]) === venue.id
        }) || []

        let status = '未開催'
        let dataStatus = 'disconnected'
        let races = 0
        let nextRace = null
        let isCompleted = false
        let day = null

        if (venueRaces.length > 0) {
          dataStatus = 'connected'
          races = venueRaces.length

          // レース番号を抽出して最大値を取得
          const raceNumbers = venueRaces.map(result => {
            const parts = result.race_id.split('-')
            return parseInt(parts[3])
          })
          const maxRaceNo = Math.max(...raceNumbers)
          const minRaceNo = Math.min(...raceNumbers)

          // 開催状況を判定
          if (maxRaceNo >= 12) {
            status = '開催終了'
            isCompleted = true
          } else if (races > 0) {
            status = '開催中'
            // 次のレースを推定
            const nextRaceNo = maxRaceNo + 1
            if (nextRaceNo <= 12) {
              // 簡易的な時刻計算（10:30開始、30分間隔）
              const startTime = 10.5 // 10:30
              const raceTime = startTime + (nextRaceNo - 1) * 0.5
              const hour = Math.floor(raceTime)
              const minute = (raceTime % 1) * 60
              nextRace = {
                race: nextRaceNo,
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
              }
            }
            // 開催日の推定
            day = races >= 6 ? '2日目' : '初日'
          }
        }

        venueStatuses.push({
          id: venue.id,
          name: venue.name,
          region: venue.region,
          status,
          dataStatus,
          races,
          nextRace,
          isCompleted,
          grade: venue.grade,
          raceTitle: venue.raceTitle,
          day,
          hasWomen: venue.hasWomen
        })

        console.log(`✅ [Venues Status] ${venue.name}: ${status} (${races}R)`)

      } catch (venueError) {
        console.error(`❌ [Venues Status] Error checking venue ${venue.name}:`, venueError)

        venueStatuses.push({
          id: venue.id,
          name: venue.name,
          region: venue.region,
          status: 'データなし',
          dataStatus: 'disconnected',
          races: 0,
          nextRace: null,
          isCompleted: false,
          grade: venue.grade,
          raceTitle: venue.raceTitle,
          day: null,
          hasWomen: venue.hasWomen
        })
      }
    }

    const summary = {
      connectedVenues: venueStatuses.filter(v => v.dataStatus === 'connected').length,
      activeVenues: venueStatuses.filter(v => v.status === '開催中').length,
      totalVenues: venues.length
    }

    console.log(`✅ [Venues Status] Summary: ${summary.connectedVenues}/${summary.totalVenues} connected, ${summary.activeVenues} active`)

    // レース数の多い順にソート
    venueStatuses.sort((a, b) => b.races - a.races)

    return NextResponse.json({
      success: true,
      date: displayPeriod,
      venues: venueStatuses,
      summary,
      timestamp: new Date().toISOString(),
      query_period: `${queryStartDate} - ${queryEndDate}`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Venues Status] Error:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}