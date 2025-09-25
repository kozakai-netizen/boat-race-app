import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PlayerSearchParamsSchema, AdminPlayerSchema } from '@/lib/types'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

export async function GET(request: NextRequest) {
  console.info(`[API] admin/players - DATA_MODE: ${DATA_MODE}`)

  try {
    const { searchParams } = new URL(request.url)

    // パラメータ解析（パフォーマンス重視）
    const params = PlayerSearchParamsSchema.parse({
      q: searchParams.get('q') || undefined,
      grade: searchParams.get('grade') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'reg_no',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    })

    // 高速クエリ構築：インデックス活用
    let query = supabase
      .from('player')
      .select(`
        id,
        reg_no,
        player_name,
        name_kana,
        grade,
        birth_date,
        hometown,
        external_url,
        is_active,
        created_at,
        updated_at
      `, { count: 'exact' })

    // フィルタ（インデックス順序重要）
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive === 'true')
    }

    if (params.grade) {
      query = query.eq('grade', params.grade)
    }

    // 検索（全文検索インデックス活用）
    if (params.q && params.q.trim()) {
      const searchTerm = params.q.trim()
      // 登録番号の数値検索 or 名前検索
      if (/^\d+$/.test(searchTerm)) {
        query = query.eq('reg_no', parseInt(searchTerm))
      } else {
        // テキスト検索：PostgreSQLの全文検索
        query = query.or(`player_name.ilike.%${searchTerm}%,name_kana.ilike.%${searchTerm}%`)
      }
    }

    // ソート（インデックス活用）
    const sortColumn = params.sortBy === 'player_name' ? 'player_name' : params.sortBy
    query = query.order(sortColumn, { ascending: params.sortOrder === 'asc' })

    // ページング（LIMIT/OFFSET最適化）
    const offset = (params.page - 1) * params.limit
    query = query.range(offset, offset + params.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // レスポンス構築（最小限）
    const total = count || 0
    const hasMore = offset + params.limit < total

    return NextResponse.json({
      players: data || [],
      total,
      page: params.page,
      limit: params.limit,
      hasMore
    })

  } catch (error) {
    console.error('Error in admin/players GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.info(`[API] admin/players POST - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const playerData = AdminPlayerSchema.parse(body)

    // 重複チェック（高速）
    if (playerData.reg_no) {
      const { data: existing } = await supabase
        .from('player')
        .select('id')
        .eq('reg_no', playerData.reg_no)
        .limit(1)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `登録番号 ${playerData.reg_no} は既に使用されています` },
          { status: 400 }
        )
      }
    }

    // DB挿入（必要最小限）
    const { data, error } = await supabase
      .from('player')
      .insert({
        reg_no: playerData.reg_no,
        player_name: playerData.player_name,
        name_kana: playerData.name_kana,
        grade: playerData.grade,
        birth_date: playerData.birth_date,
        hometown: playerData.hometown,
        external_url: playerData.external_url,
        is_active: playerData.is_active,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in admin/players POST:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}