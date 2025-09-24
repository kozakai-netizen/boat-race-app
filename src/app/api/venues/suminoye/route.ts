import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { VenueResponseSchema, Weather } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const grade = searchParams.get('grade') || 'normal'

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Get race data for the specified date and grade
    const { data: races, error: raceError } = await supabase
      .from('race')
      .select('*')
      .eq('venue', 'suminoe')
      .eq('date', date)
      .eq('grade', grade)
      .limit(1)

    if (raceError && raceError.code !== 'PGRST116') {
      console.error('Race error:', raceError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const raceData = races && races.length > 0 ? races[0] : null

    // Get weather data if race exists
    let weatherData: Weather | null = null
    if (raceData) {
      const { data: weather } = await supabase
        .from('weather')
        .select('*')
        .eq('race_id', raceData.race_id)
        .limit(1)
        .single()

      weatherData = weather
    }

    // Count super picks for the date
    const { count: superPicksCount } = await supabase
      .from('forecast')
      .select('*', { count: 'exact', head: true })
      .eq('super', true)
      .like('race_id', `suminoye-${date.replace(/-/g, '')}-%`)

    // Get next close_at time
    const { data: nextRace } = await supabase
      .from('race')
      .select('close_at')
      .eq('venue', 'suminoe')
      .eq('date', date)
      .gt('close_at', new Date().toISOString())
      .order('close_at', { ascending: true })
      .limit(1)
      .single()

    const response = {
      venue: 'suminoe',
      date,
      grade: grade as 'normal' | 'major',
      weather_summary: weatherData ? {
        temp_c: weatherData.temp_c,
        wind_ms: weatherData.wind_ms,
        condition: getWeatherCondition(weatherData.temp_c, weatherData.wind_ms),
      } : null,
      super_picks_count: superPicksCount || 0,
      next_close_at: nextRace?.close_at || null,
    }

    // Validate response with Zod
    const validatedResponse = VenueResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Venues API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getWeatherCondition(temp: number | null, wind: number | null): string {
  if (!temp && !wind) return 'データなし'

  let condition = ''

  if (temp !== null) {
    if (temp >= 25) condition += '暑い'
    else if (temp >= 20) condition += '暖かい'
    else if (temp >= 15) condition += '涼しい'
    else condition += '寒い'
  }

  if (wind !== null) {
    if (wind >= 5) condition += '・強風'
    else if (wind >= 3) condition += '・風あり'
    else condition += '・穏やか'
  }

  return condition || '普通'
}