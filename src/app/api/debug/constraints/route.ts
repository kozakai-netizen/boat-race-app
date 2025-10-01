import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * テーブル制約確認用デバッグAPI
 * GET /api/debug/constraints?table=racer_data
 * GET /api/debug/constraints?sql=custom (for custom SQL queries)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'racer_data'
    const queryType = searchParams.get('query') || 'constraints'

    console.log(`🔍 [Debug] Running query type: ${queryType} for table: ${tableName}`)

    const supabase = createClient()

    // 2025年前期データ確認の特別クエリ
    if (queryType === 'check_2025') {
      console.log('🎯 [Debug] Checking for 2025年前期 data...')

      const { data: data2025, error: error2025 } = await supabase
        .from('racer_data')
        .select('racer_number, racer_name, period_year, period_half')
        .eq('period_year', 2025)
        .limit(10)

      if (error2025) {
        return NextResponse.json({
          success: false,
          error: '2025_data_check_failed',
          details: error2025.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        query_type: 'check_2025',
        result: data2025 || [],
        count: data2025?.length || 0,
        conclusion: data2025?.length === 0
          ? '✅ No 2025 data found - This confirms no duplicate constraint violation'
          : '❌ 2025 data exists - This is the cause of the constraint violation',
        timestamp: new Date().toISOString()
      })
    }

    // 2025年前期データ削除クエリ
    if (queryType === 'delete_2025') {
      console.log('🗑️ [Debug] Deleting 2025年前期 data...')

      const { error: deleteError } = await supabase
        .from('racer_data')
        .delete()
        .eq('period_year', 2025)
        .eq('period_half', '前期')

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: '2025_data_delete_failed',
          details: deleteError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        query_type: 'delete_2025',
        message: '✅ 2025年前期データを削除しました',
        next_step: 'count_2025クエリで削除確認を実行してください',
        timestamp: new Date().toISOString()
      })
    }

    // 2025年データカウント確認
    if (queryType === 'count_2025') {
      console.log('📊 [Debug] Counting remaining 2025 data...')

      const { count, error: countError } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })
        .eq('period_year', 2025)

      if (countError) {
        return NextResponse.json({
          success: false,
          error: '2025_count_failed',
          details: countError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        query_type: 'count_2025',
        count: count || 0,
        conclusion: count === 0
          ? '✅ 2025年データが完全に削除されました。CSVインポートが可能です。'
          : `❌ まだ${count}件の2025年データが残っています。`,
        timestamp: new Date().toISOString()
      })
    }

    // Gemini提案A-1のSQLクエリを実行
    const { data: constraints, error } = await supabase.rpc('sql', {
      query: `
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = '${tableName}';
      `
    })

    if (error) {
      console.error('❌ [Debug] SQL query failed:', error)

      // 代替方法: Supabaseのメタデータから推測
      const { data: tableInfo, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (tableError) {
        return NextResponse.json({
          success: false,
          error: 'table_access_failed',
          details: tableError.message,
          table: tableName
        }, { status: 500 })
      }

      // 重複チェックで制約を推測
      const { data: duplicateCheck, error: dupError } = await supabase
        .from(tableName)
        .select('racer_number, period_year, period_half')
        .limit(1000)

      let constraints_analysis = {
        primary_key: 'id (UUID - confirmed from sample)',
        unique_constraints: 'Unknown',
        check_constraints: 'Unknown'
      }

      if (!dupError && duplicateCheck) {
        // racer_number + period の組み合わせ重複チェック
        const combinations = duplicateCheck.map(row =>
          `${row.racer_number}-${row.period_year}-${row.period_half}`
        )
        const uniqueCombinations = new Set(combinations)

        constraints_analysis.unique_constraints =
          combinations.length === uniqueCombinations.size
            ? 'Likely UNIQUE(racer_number, period_year, period_half)'
            : 'No unique constraint on racer_number + period'
      }

      return NextResponse.json({
        success: true,
        method: 'fallback_with_analysis',
        table: tableName,
        note: 'Direct SQL query failed, analyzed data structure',
        sample_data: tableInfo?.[0] || null,
        constraints_analysis,
        total_records_analyzed: duplicateCheck?.length || 0
      })
    }

    console.log(`✅ [Debug] Found ${constraints?.length || 0} constraints`)

    return NextResponse.json({
      success: true,
      method: 'direct_sql',
      table: tableName,
      constraints: constraints || [],
      count: constraints?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Debug] Constraints check failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'constraint_check_failed',
      details: errorMessage
    }, { status: 500 })
  }
}