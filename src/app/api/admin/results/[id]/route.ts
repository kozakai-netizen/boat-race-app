import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AdminResultSchema } from '@/lib/types'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  console.info(`[API] admin/results/${resolvedParams.id} GET - DATA_MODE: ${DATA_MODE}`)

  try {
    const { data, error } = await supabase
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
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in admin/results/[id] GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  console.info(`[API] admin/results/${resolvedParams.id} PUT - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const resultData = AdminResultSchema.parse(body)

    // 既存レコードの存在確認
    const { data: existing, error: fetchError } = await supabase
      .from('result')
      .select('id, race_id')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // race_id重複チェック（自分以外）
    if (resultData.race_id !== existing.race_id) {
      const { data: duplicate } = await supabase
        .from('result')
        .select('id')
        .eq('race_id', resultData.race_id)
        .neq('id', resolvedParams.id)
        .limit(1)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: `レース ${resultData.race_id} の結果は既に登録されています` },
          { status: 400 }
        )
      }
    }

    // 更新実行
    const { data, error } = await supabase
      .from('result')
      .update({
        race_id: resultData.race_id,
        triple: resultData.triple,
        payout: resultData.payout,
        popularity: resultData.popularity,
        settled_at: resultData.settled_at || new Date().toISOString(),
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in admin/results/[id] PUT:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  console.info(`[API] admin/results/${resolvedParams.id} DELETE - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    // 存在確認
    const { data: existing, error: fetchError } = await supabase
      .from('result')
      .select('id, race_id')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // 削除実行（物理削除：結果は完全な削除が適切）
    const { error } = await supabase
      .from('result')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    return NextResponse.json({ message: 'Result deleted successfully' })

  } catch (error) {
    console.error('Error in admin/results/[id] DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    )
  }
}