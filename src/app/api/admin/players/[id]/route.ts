import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AdminPlayerSchema } from '@/lib/types'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.info(`[API] admin/players/[id] PUT - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const playerData = AdminPlayerSchema.partial().parse(body)

    // 重複チェック（自分以外）
    if (playerData.reg_no) {
      const { data: existing } = await supabase
        .from('player')
        .select('id')
        .eq('reg_no', playerData.reg_no)
        .neq('id', id)
        .limit(1)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `登録番号 ${playerData.reg_no} は既に使用されています` },
          { status: 400 }
        )
      }
    }

    // 高速更新（updated_atは自動更新）
    const { data, error } = await supabase
      .from('player')
      .update({
        reg_no: playerData.reg_no,
        player_name: playerData.player_name,
        name_kana: playerData.name_kana,
        grade: playerData.grade,
        birth_date: playerData.birth_date,
        hometown: playerData.hometown,
        external_url: playerData.external_url,
        is_active: playerData.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in admin/players/[id] PUT:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.info(`[API] admin/players/[id] DELETE - DATA_MODE: ${DATA_MODE}`)

  if (DATA_MODE !== 'live') {
    return NextResponse.json(
      { error: 'Write operations are only available in LIVE mode' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    // ソフトデリート（is_active = false）
    const { data, error } = await supabase
      .from('player')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, player_name')
      .single()

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `選手 ${data.player_name} を非アクティブにしました`,
      id: data.id
    })

  } catch (error) {
    console.error('Error in admin/players/[id] DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
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
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in admin/players/[id] GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    )
  }
}