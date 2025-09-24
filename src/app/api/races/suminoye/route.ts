import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RacesResponseSchema } from '@/lib/types'
import { PLAYER_ICONS, EXH_LR_STRONG, EXH_OUTER_INNER_STRONG } from '@/lib/constants'
import { MOCK_RACES_TODAY } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const grade = searchParams.get('grade') || 'normal'

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // const dateKey = date.replace(/-/g, '')

    // Get races for the day
    const { data: races, error: racesError } = await supabase
      .from('race')
      .select('race_id, race_no, close_at')
      .eq('venue', 'suminoe')
      .eq('date', date)
      .eq('grade', grade)
      .order('race_no')

    if (racesError) {
      console.error('Races error:', racesError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!races || races.length === 0) {
      // Return mock data for current date if no data found
      const today = new Date().toISOString().split('T')[0]
      if (date === today) {
        return NextResponse.json({
          venue: 'suminoe',
          date,
          grade: grade as 'normal' | 'major',
          races: MOCK_RACES_TODAY,
        })
      }

      return NextResponse.json({
        venue: 'suminoe',
        date,
        grade: grade as 'normal' | 'major',
        races: [],
      })
    }

    // Get forecast data for super picks
    const raceIds = races.map(r => r.race_id)
    const { data: forecasts } = await supabase
      .from('forecast')
      .select('race_id, combo, ev, super')
      .in('race_id', raceIds)
      .eq('super', true)

    // Get race entries pack data for exhibition summary
    const { data: entries } = await supabase
      .from('race_entries_pack_mv')
      .select('race_id, left_gap, right_gap, outer_inner_gap')
      .in('race_id', raceIds)

    // Process races data
    const processedRaces = races.map(race => {
      const raceForecasts = forecasts?.filter(f => f.race_id === race.race_id) || []
      const raceEntries = entries?.filter(e => e.race_id === race.race_id) || []

      // Calculate exhibition summary
      const leftRightGaps = raceEntries
        .map(e => Math.abs((e.left_gap || 0) - (e.right_gap || 0)))
        .filter(gap => gap > 0)
      const outerInnerGaps = raceEntries
        .map(e => e.outer_inner_gap)
        .filter(gap => gap !== null) as number[]

      const exhibitionSummary = {
        left_right_gap_max: leftRightGaps.length > 0 ? Math.max(...leftRightGaps) : null,
        outer_inner_gap_min: outerInnerGaps.length > 0 ? Math.min(...outerInnerGaps) : null,
      }

      // Generate icons based on exhibition data
      const icons: string[] = []

      if (exhibitionSummary.left_right_gap_max && exhibitionSummary.left_right_gap_max > EXH_LR_STRONG) {
        icons.push(PLAYER_ICONS.TECHNIQUE)
      }
      if (exhibitionSummary.outer_inner_gap_min && exhibitionSummary.outer_inner_gap_min < EXH_OUTER_INNER_STRONG) {
        icons.push(PLAYER_ICONS.SPEED)
      }

      // Add other icons based on race characteristics
      const topForecast = raceForecasts
        .sort((a, b) => b.ev - a.ev)[0]

      if (topForecast && topForecast.ev > 1.5) {
        icons.push(PLAYER_ICONS.TARGET)
      }

      if (icons.length === 0) {
        icons.push(PLAYER_ICONS.DEFENSE) // Default icon
      }

      return {
        race_id: race.race_id,
        race_no: race.race_no,
        close_at: race.close_at,
        has_super: raceForecasts.length > 0,
        icons,
        exhibition_summary: exhibitionSummary,
      }
    })

    const response = {
      venue: 'suminoe',
      date,
      grade: grade as 'normal' | 'major',
      races: processedRaces,
    }

    // Validate response with Zod
    const validatedResponse = RacesResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Races API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}