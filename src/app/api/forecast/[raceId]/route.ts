import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ForecastSchema } from '@/lib/types'
import { SUPER_EV_MIN, SUPER_PROB_MIN, PLAYER_ICONS } from '@/lib/constants'
import { MOCK_FORECAST_DATA } from '@/lib/mockData'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fixFirst = searchParams.get('fixFirst')
    const resolvedParams = await params
    const raceId = resolvedParams.raceId

    if (!raceId) {
      return NextResponse.json({ error: 'Race ID is required' }, { status: 400 })
    }

    if (fixFirst) {
      return handleFixedFirstForecast(raceId, parseInt(fixFirst))
    }

    // Check if mock data is available for testing
    if (raceId in MOCK_FORECAST_DATA) {
      const mockData = MOCK_FORECAST_DATA[raceId as keyof typeof MOCK_FORECAST_DATA]
      const validatedResponse = ForecastSchema.parse(mockData)
      return NextResponse.json(validatedResponse)
    }

    // Get forecast data with odds
    const { data: forecastData, error: forecastError } = await supabase
      .from('forecast')
      .select(`
        combo,
        prob,
        ev,
        super,
        why
      `)
      .eq('race_id', raceId)
      .order('ev', { ascending: false })

    if (forecastError) {
      console.error('Forecast error:', forecastError)
      // If database error and no mock data, return empty result
      const emptyResponse = {
        race_id: raceId,
        triples: [],
      }
      const validatedResponse = ForecastSchema.parse(emptyResponse)
      return NextResponse.json(validatedResponse)
    }

    // Get latest odds
    const { data: oddsData } = await supabase
      .from('odds_latest')
      .select('combo, odds')
      .eq('race_id', raceId)

    const oddsMap = new Map(oddsData?.map(o => [o.combo, o.odds]) || [])

    // Get race result data for hit type calculation
    const { data: resultData } = await supabase
      .from('result')
      .select('triple')
      .eq('race_id', raceId)
      .single()

    const raceResultTriple = resultData?.triple || null

    // Process forecast data
    const triples = forecastData?.map(forecast => {
      const icons = generateIconsFromWhy(forecast.why)
      const parsedWhy = parseWhyData(forecast.why)

      return {
        combo: forecast.combo,
        prob: forecast.prob,
        odds: oddsMap.get(forecast.combo) || null,
        ev: forecast.ev,
        super: forecast.super || (forecast.ev >= SUPER_EV_MIN && forecast.prob >= SUPER_PROB_MIN),
        icons,
        hitType: calculateHitType(forecast.combo, raceResultTriple),
        why: parsedWhy,
      }
    }) || []

    const response = {
      race_id: raceId,
      triples,
    }

    // Validate response with Zod
    const validatedResponse = ForecastSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Forecast API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleFixedFirstForecast(raceId: string, fixedLane: number) {
  try {
    let allForecasts = null

    // Check for mock data first
    if (raceId in MOCK_FORECAST_DATA) {
      const mockData = MOCK_FORECAST_DATA[raceId as keyof typeof MOCK_FORECAST_DATA]
      allForecasts = mockData.triples.map(triple => ({
        combo: triple.combo,
        prob: triple.prob,
        ev: triple.ev,
        super: triple.super,
        why: null
      }))
    } else {
      // Get all forecasts for the race
      const { data, error } = await supabase
        .from('forecast')
        .select('combo, prob, ev, super, why')
        .eq('race_id', raceId)

      if (error) throw error
      allForecasts = data
    }

    // Filter forecasts where first position matches fixedLane
    const filteredForecasts = allForecasts?.filter(f =>
      f.combo.startsWith(fixedLane.toString())
    ) || []

    // Get latest odds for filtered combos
    const combos = filteredForecasts.map(f => f.combo)
    const { data: oddsData } = await supabase
      .from('odds_latest')
      .select('combo, odds')
      .eq('race_id', raceId)
      .in('combo', combos)

    const oddsMap = new Map(oddsData?.map(o => [o.combo, o.odds]) || [])

    // Get race result data for hit type calculation
    const { data: resultData } = await supabase
      .from('result')
      .select('triple')
      .eq('race_id', raceId)
      .single()

    const raceResultTriple = resultData?.triple || null

    // Recalculate probabilities (simplified normalization)
    const totalProb = filteredForecasts.reduce((sum, f) => sum + f.prob, 0)

    const triples = filteredForecasts.map(forecast => {
      const normalizedProb = totalProb > 0 ? forecast.prob / totalProb : forecast.prob
      const odds = oddsMap.get(forecast.combo)
      const newEv = odds ? normalizedProb * odds : forecast.ev

      return {
        combo: forecast.combo,
        prob: normalizedProb,
        odds: odds || null,
        ev: newEv,
        super: forecast.super || (newEv >= SUPER_EV_MIN && normalizedProb >= SUPER_PROB_MIN),
        icons: generateIconsFromWhy(forecast.why),
        hitType: calculateHitType(forecast.combo, raceResultTriple),
        why: parseWhyData(forecast.why),
      }
    }).sort((a, b) => b.ev - a.ev)

    const response = {
      race_id: raceId,
      triples,
    }

    return NextResponse.json(ForecastSchema.parse(response))
  } catch (error) {
    console.error('Fixed first forecast error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateIconsFromWhy(why: unknown): string[] {
  const icons: string[] = []

  if (!why) return [PLAYER_ICONS.DEFENSE]

  try {
    const whyData = typeof why === 'string' ? JSON.parse(why) : why

    // Extract icons from 'why' data structure
    if (whyData.icons && Array.isArray(whyData.icons)) {
      return whyData.icons
    }

    // Generate icons based on factors
    if (whyData.factors && Array.isArray(whyData.factors)) {
      whyData.factors.forEach((factor: string) => {
        if (factor.includes('スタート') || factor.includes('ST')) {
          icons.push(PLAYER_ICONS.SPEED)
        } else if (factor.includes('展示') || factor.includes('タイム')) {
          icons.push(PLAYER_ICONS.TECHNIQUE)
        } else if (factor.includes('勝率') || factor.includes('成績')) {
          icons.push(PLAYER_ICONS.TARGET)
        } else if (factor.includes('パワー') || factor.includes('まわり')) {
          icons.push(PLAYER_ICONS.POWER)
        }
      })
    }

    // Default icons if none found
    if (icons.length === 0) {
      if (whyData.start_shape === 'good') {
        icons.push(PLAYER_ICONS.SPEED)
      }
      if (whyData.kimarite_mix && Object.keys(whyData.kimarite_mix).length > 0) {
        icons.push(PLAYER_ICONS.TECHNIQUE)
      }
    }
  } catch (e) {
    console.warn('Error parsing why data:', e)
  }

  return icons.length > 0 ? icons.slice(0, 3) : [PLAYER_ICONS.DEFENSE]
}

function calculateHitType(forecastCombo: string, resultTriple: string | null): 'win' | 'inTop' | 'miss' | 'ref' {
  if (!resultTriple) {
    return 'ref' // 結果データなし（レース未確定）
  }

  if (forecastCombo === resultTriple) {
    return 'win' // 完全的中
  }

  // TOP5内判定のロジック（現在は簡易版）
  // 実際のボートレースでは複雑な判定が必要だが、現状はmissとして扱う
  return 'miss'
}

function parseWhyData(why: unknown): { icons: string[]; summary: string; factors?: string[]; start_shape?: string; kimarite_mix?: any } | undefined {
  if (!why) return undefined

  try {
    const whyData = typeof why === 'string' ? JSON.parse(why) : why

    // WhySchemaに準拠した形式で返す
    return {
      icons: whyData.icons || [],
      summary: whyData.summary || '詳細分析結果',
      factors: whyData.factors,
      start_shape: whyData.start_shape,
      kimarite_mix: whyData.kimarite_mix,
    }
  } catch (e) {
    console.warn('Error parsing why data:', e)
    return undefined
  }
}