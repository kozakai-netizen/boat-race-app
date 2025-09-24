import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ResultsResponseSchema } from '@/lib/types'
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
      }
      const validatedResponse = ResultsResponseSchema.parse(response)
      return NextResponse.json(validatedResponse)
    }

    // Get results for the date
    const { data: results, error: resultsError } = await supabase
      .from('result')
      .select('race_id, triple, payout, popularity')
      .like('race_id', `suminoye-${date.replace(/-/g, '')}-%`)
      .order('race_id')

    if (resultsError) {
      console.error('Results error:', resultsError)
      // Return empty results if database error and no mock data
      const response = {
        venue: 'suminoe',
        date,
        results: [],
      }
      const validatedResponse = ResultsResponseSchema.parse(response)
      return NextResponse.json(validatedResponse)
    }

    if (!results || results.length === 0) {
      const response = {
        venue: 'suminoe',
        date,
        results: [],
      }
      const validatedResponse = ResultsResponseSchema.parse(response)
      return NextResponse.json(validatedResponse)
    }

    // Get forecast data to determine hit status
    const raceIds = results.map(r => r.race_id)
    const { data: forecasts } = await supabase
      .from('forecast')
      .select('race_id, combo, ev')
      .in('race_id', raceIds)
      .order('ev', { ascending: false })

    // Process results with hit determination
    const processedResults = results.map(result => {
      const raceForecasts = forecasts?.filter(f => f.race_id === result.race_id) || []
      const hit = determineHit(result.triple, raceForecasts.map(f => f.combo))

      return {
        race_id: result.race_id,
        triple: result.triple,
        payout: result.payout,
        popularity: result.popularity,
        hit,
      }
    })

    const response = {
      venue: 'suminoe',
      date,
      results: processedResults,
    }

    // Validate response with Zod
    const validatedResponse = ResultsResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Results API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function determineHit(actualTriple: string, forecastCombos: string[]): 'win' | 'inTop' | 'miss' | 'ref' {
  if (!forecastCombos || forecastCombos.length === 0) {
    return 'ref' // No forecast available
  }

  // Check for exact match (win)
  if (forecastCombos.includes(actualTriple)) {
    return 'win'
  }

  // Check if actual result is in top 5 forecasts
  const top5Combos = forecastCombos.slice(0, 5)
  if (top5Combos.includes(actualTriple)) {
    return 'inTop'
  }

  return 'miss'
}