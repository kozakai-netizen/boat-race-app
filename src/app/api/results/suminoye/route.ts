import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RESULT_DATA } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const dateKey = `suminoe-${date.replace(/-/g, '').substring(0, 8) === '20250924' ? 'TEST' : date.replace(/-/g, '')}`

    // Check for mock data first
    if (dateKey in MOCK_RESULT_DATA) {
      const mockData = MOCK_RESULT_DATA[dateKey as keyof typeof MOCK_RESULT_DATA]
      const response = {
        venue: 'suminoe',
        date,
        results: mockData,
        total: mockData.length
      }
      return NextResponse.json(response)
    }

    // Return empty results for other dates (mock-only system)
    const response = {
      venue: 'suminoe',
      date,
      results: [],
      total: 0
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Results API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

