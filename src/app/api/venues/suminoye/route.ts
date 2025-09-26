import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const grade = searchParams.get('grade') || 'normal'

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Return mock venue data
    const response = {
      name: 'suminoe',
      display_name: '住之江競艇場',
      races_available: true,
      weather: {
        condition: '晴れ・穏やか',
        temperature: 22,
        wind_speed: 2,
        wind_direction: 180,
        wave_height: 0.1
      }
    }

    return NextResponse.json(response)
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