import { NextRequest, NextResponse } from 'next/server'
import { PLAYER_ICONS } from '@/lib/constants'
import { MOCK_RACES_TODAY } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const grade = searchParams.get('grade') || 'normal'

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Return mock data for current date
    const today = new Date().toISOString().split('T')[0]
    if (date === today) {
      return NextResponse.json({
        venue: 'suminoe',
        date,
        grade: grade as 'normal' | 'major',
        races: MOCK_RACES_TODAY,
      })
    }

    // Return empty array for other dates (mock-only system)
    return NextResponse.json({
      venue: 'suminoe',
      date,
      grade: grade as 'normal' | 'major',
      races: [],
    })
  } catch (error) {
    console.error('Races API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}