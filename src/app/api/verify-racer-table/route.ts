import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * racer_dataテーブルの存在と構造を検証するAPI
 * GET /api/verify-racer-table
 */
export async function GET() {
  try {
    console.log('🔍 Starting racer_data table verification...')

    const supabase = createClient()
    const verification = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: racer_dataテーブルのレコード数確認
    console.log('📊 Test 1: Checking racer_data record count...')
    try {
      const { count: racerCount, error: countError } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })

      verification.tests.push({
        test_id: 1,
        description: 'racer_data record count',
        result: racerCount || 0,
        success: !countError,
        error: countError?.message || null
      })

      console.log(`📋 racer_data records: ${racerCount || 0}`)
    } catch (error) {
      verification.tests.push({
        test_id: 1,
        description: 'racer_data count check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: racerテーブル一覧取得
    console.log('📊 Test 2: Getting racer table list...')
    try {
      const { data: tableData, error: tableError } = await supabase
        .rpc('get_racer_tables')

      if (tableError) {
        // RPC関数が存在しない場合は、代替方法を試行
        console.log('RPC function not found, trying alternative query...')

        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .like('table_name', '%racer%')

        verification.tests.push({
          test_id: 2,
          description: 'racer table list (alternative method)',
          result: schemaData || [],
          success: !schemaError,
          error: schemaError?.message || 'RPC function not available, used alternative'
        })
      } else {
        verification.tests.push({
          test_id: 2,
          description: 'racer table list (RPC)',
          result: tableData || [],
          success: true,
          error: null
        })
      }
    } catch (error) {
      verification.tests.push({
        test_id: 2,
        description: 'racer table list',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: racer_dataテーブル構造確認
    console.log('📊 Test 3: Checking racer_data table structure...')
    try {
      // サンプルデータを取得してテーブル構造を確認
      const { data: sampleData, error: sampleError } = await supabase
        .from('racer_data')
        .select('*')
        .limit(1)

      let columnInfo = []
      if (sampleData && sampleData.length > 0) {
        columnInfo = Object.keys(sampleData[0])
      }

      verification.tests.push({
        test_id: 3,
        description: 'racer_data table structure',
        result: {
          sample_data: sampleData || [],
          columns: columnInfo,
          sample_count: sampleData?.length || 0
        },
        success: !sampleError,
        error: sampleError?.message || null
      })

      console.log(`📋 Available columns: ${columnInfo.join(', ')}`)
    } catch (error) {
      verification.tests.push({
        test_id: 3,
        description: 'racer_data structure check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: 期別データ確認
    console.log('📊 Test 4: Checking period data distribution...')
    try {
      const { data: periodData, error: periodError } = await supabase
        .from('racer_data')
        .select('period_year, period_half, count(*)')
        .group('period_year, period_half')

      verification.tests.push({
        test_id: 4,
        description: 'period data distribution',
        result: periodData || [],
        success: !periodError,
        error: periodError?.message || null
      })

      if (periodData) {
        console.log('📋 Period distribution:')
        periodData.forEach((period: any) => {
          console.log(`  ${period.period_year}年${period.period_half}: ${period.count}件`)
        })
      }
    } catch (error) {
      verification.tests.push({
        test_id: 4,
        description: 'period data check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    console.log('✅ Verification completed')

    return NextResponse.json({
      success: true,
      verification_summary: {
        timestamp: verification.timestamp,
        total_tests: verification.tests.length,
        successful_tests: verification.tests.filter(t => t.success).length,
        failed_tests: verification.tests.filter(t => !t.success).length
      },
      detailed_results: verification.tests,
      recommendation: generateRecommendation(verification.tests)
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Verification failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'verification_failed',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * 検証結果から推奨アクションを生成
 */
function generateRecommendation(tests: any[]) {
  const countTest = tests.find(t => t.test_id === 1)
  const structureTest = tests.find(t => t.test_id === 3)

  if (countTest && !countTest.success) {
    return {
      action: 'create_table',
      message: 'racer_dataテーブルが存在しません。テーブル作成が必要です。',
      priority: 'high'
    }
  }

  if (countTest && countTest.result === 0) {
    return {
      action: 'import_data',
      message: 'racer_dataテーブルは存在しますが、データが空です。データインポートが必要です。',
      priority: 'medium'
    }
  }

  if (structureTest && structureTest.success) {
    return {
      action: 'ready_for_import',
      message: 'racer_dataテーブルは正常に存在し、追加データのインポートが可能です。',
      priority: 'low'
    }
  }

  return {
    action: 'investigate',
    message: '詳細な調査が必要です。',
    priority: 'medium'
  }
}