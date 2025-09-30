import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * 各会場の今日の開催状況を取得するAPI
 * GET /api/venues-status
 */
export async function GET() {
  try {
    console.log('🏟️ [Venues Status] Fetching today\'s venue status...')

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 対応済み会場リスト
    const venues = [
      { id: 1, name: '桐生', region: '関東' },
      { id: 2, name: '戸田', region: '関東' },
      { id: 11, name: 'びわこ', region: '関西' },
      { id: 12, name: '住之江', region: '関西' },
      { id: 13, name: '尼崎', region: '関西' },
      { id: 22, name: '福岡', region: '九州' }
    ]

    const venueStatuses = []

    for (const venue of venues) {
      try {
        // 今日のレースデータ取得を試行
        const { data: racerEntries, error } = await supabase
          .from('racer_entries')
          .select('race_no, race_date')
          .eq('race_date', today)
          .eq('venue_id', venue.id)
          .order('race_no')

        let status = '未開催'
        let dataStatus = 'disconnected'
        let races = 0
        let nextRace = null
        let isCompleted = false

        if (!error && racerEntries && racerEntries.length > 0) {
          dataStatus = 'connected'

          // レース数の計算
          const uniqueRaces = [...new Set(racerEntries.map(r => r.race_no))]
          races = uniqueRaces.length

          // 現在時刻
          const now = new Date()
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const currentTime = currentHour * 60 + currentMinute

          // 開催時間推定（一般的な競艇場の時間）
          const raceStartTime = 10 * 60 + 30 // 10:30開始
          const raceEndTime = 17 * 60 + 0    // 17:00終了

          if (currentTime < raceStartTime) {
            status = '未開催'
          } else if (currentTime > raceEndTime) {
            status = '開催終了'
            isCompleted = true
          } else {
            status = '開催中'

            // 直近レース時刻の推定（10:30から約40分間隔）
            const raceInterval = 40
            const elapsedMinutes = currentTime - raceStartTime
            const currentRaceNo = Math.floor(elapsedMinutes / raceInterval) + 1
            const nextRaceNo = Math.min(currentRaceNo + 1, races)

            if (nextRaceNo <= races) {
              const nextRaceTime = raceStartTime + (nextRaceNo - 1) * raceInterval
              const nextHour = Math.floor(nextRaceTime / 60)
              const nextMin = nextRaceTime % 60

              nextRace = {
                race: nextRaceNo,
                time: `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`
              }
            }
          }
        } else {
          // データが取得できない場合の判定
          dataStatus = 'connected' // テーブルは存在するがデータがない
          status = '未開催'
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
          // モックデータ（将来的にはAPIから取得）
          grade: venue.id === 12 ? 'G1' : venue.id === 2 ? 'G3' : '一般',
          raceTitle: venue.id === 12 ? 'グランプリ' : venue.id === 2 ? '記念競走' : '一般競走',
          day: status === '開催中' ? (venue.id === 12 ? '2日目' : '最終日') : null,
          hasWomen: [12, 13, 22].includes(venue.id)
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
          grade: '一般',
          raceTitle: '一般競走',
          day: null,
          hasWomen: false
        })
      }
    }

    const summary = {
      connectedVenues: venueStatuses.filter(v => v.dataStatus === 'connected').length,
      activeVenues: venueStatuses.filter(v => v.status === '開催中').length,
      totalVenues: venues.length
    }

    console.log(`✅ [Venues Status] Summary: ${summary.connectedVenues}/${summary.totalVenues} connected, ${summary.activeVenues} active`)

    return NextResponse.json({
      success: true,
      date: today,
      venues: venueStatuses,
      summary,
      timestamp: new Date().toISOString()
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