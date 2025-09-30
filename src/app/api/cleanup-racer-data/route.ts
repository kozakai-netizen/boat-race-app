import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createClient()

    console.log('🗑️  不正確なracer_dataテーブル削除開始...')

    // 1. テーブル削除前の最終確認
    const { count, error: countError } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ テーブル確認エラー:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    console.log(`📊 削除対象: ${count}件のレコード`)

    // 2. テーブル完全削除
    const { error: dropError } = await supabase.rpc('drop_racer_data_table')

    // RPCが無い場合は、全レコード削除
    if (dropError) {
      console.log('⚠️  RPC使用不可、全レコード削除実行...')

      const { error: deleteError } = await supabase
        .from('racer_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 全レコード削除

      if (deleteError) {
        console.error('❌ レコード削除エラー:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      console.log('✅ 全レコード削除完了')
    } else {
      console.log('✅ テーブル削除完了')
    }

    // 3. 削除確認
    const { count: afterCount, error: afterError } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    let confirmationMessage = ''
    if (afterError) {
      if (afterError.message.includes('relation "racer_data" does not exist')) {
        confirmationMessage = 'テーブルが完全に削除されました'
      } else {
        confirmationMessage = 'テーブル状態確認不可（削除済みと推定）'
      }
    } else {
      confirmationMessage = `残存レコード: ${afterCount}件`
    }

    const result = {
      success: true,
      cleanup: {
        deleted_records: count || 0,
        confirmation: confirmationMessage,
        message: 'JLCデータ統合プロジェクトを終了し、Programs API単独移行を開始します',
        next_step: 'predictionEngine.tsの修正 - Programs APIデータ使用'
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎯 クリーンアップ完了:', result.cleanup)

    return NextResponse.json(result)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ クリーンアップ中にエラー:', errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}