import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ResultSearchParamsSchema, AdminResultSchema } from '@/lib/types'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

export async function GET(request: NextRequest) {
  console.info(`[API] admin/results - DATA_MODE: ${DATA_MODE}`)

  try {
    const { searchParams } = new URL(request.url)

    // パラメータ解析（高速化）
    const params = ResultSearchParamsSchema.parse({
      q: searchParams.get('q') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      hasResult: searchParams.get('hasResult') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'updated_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    // 高速クエリ構築
    let query = supabase
      .from('result')
      .select(`
        id,
        race_id,
        triple,
        payout,
        popularity,
        settled_at,
        hit_count,
        total_forecasts,
        created_at,
        updated_at
      `, { count: 'exact' })

    // race_id検索（インデックス活用）
    if (params.q && params.q.trim()) {
      const searchTerm = params.q.trim()
      // race_idの部分一致検索
      query = query.ilike('race_id', `%${searchTerm}%`)
    }

    // 日付範囲フィルタ（レースID内の日付部分を利用）
    if (params.dateFrom || params.dateTo) {
      if (params.dateFrom && params.dateTo) {
        // 両方指定：範囲検索
        const fromDate = params.dateFrom.replace(/-/g, '') // YYYYMMDD
        const toDate = params.dateTo.replace(/-/g, '')
        query = query
          .gte('race_id', `suminoe-${fromDate}`)
          .lte('race_id', `suminoe-${toDate}z`) // 文字列範囲の終端
      } else if (params.dateFrom) {
        const fromDate = params.dateFrom.replace(/-/g, '')
        query = query.gte('race_id', `suminoe-${fromDate}`)
      } else if (params.dateTo) {
        const toDate = params.dateTo.replace(/-/g, '')
        query = query.lte('race_id', `suminoe-${toDate}z`)
      }
    }

    // 結果入力済みフィルタ
    if (params.hasResult === 'true') {
      query = query.not('payout', 'is', null)
    } else if (params.hasResult === 'false') {
      query = query.is('payout', null)
    }

    // ソート（インデックス活用）
    const sortColumn = params.sortBy
    query = query.order(sortColumn, { ascending: params.sortOrder === 'asc' })

    // ページング
    const offset = (params.page - 1) * params.limit
    query = query.range(offset, offset + params.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const total = count || 0
    const hasMore = offset + params.limit < total

    return NextResponse.json({
      results: data || [],
      total,
      page: params.page,
      limit: params.limit,
      hasMore
    })

  } catch (error) {
    console.error('Error in admin/results GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.info(`[API] admin/results POST - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const resultData = AdminResultSchema.parse(body)

    // 重複チェック（race_id一意制約）
    const { data: existing } = await supabase
      .from('result')
      .select('id, race_id')
      .eq('race_id', resultData.race_id)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `レース ${resultData.race_id} の結果は既に登録されています` },
        { status: 400 }
      )
    }

    // 結果挿入（トリガーで自動的にforecast更新）
    const { data, error } = await supabase
      .from('result')
      .insert({
        race_id: resultData.race_id,
        triple: resultData.triple,
        payout: resultData.payout,
        popularity: resultData.popularity,
        settled_at: resultData.settled_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in admin/results POST:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    )
  }
}