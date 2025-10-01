import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * fan2410インポート結果の実証的検証API
 * GET /api/verify-import-results
 */
export async function GET() {
  try {
    console.log('🔍 Starting empirical verification of import results...')

    const supabase = createClient()
    const verificationResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: racer_dataテーブルの全件数確認
    console.log('📊 Test 1: Total record count in racer_data...')
    try {
      const { count: totalCount, error: countError } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })

      verificationResults.tests.push({
        test_id: 1,
        description: 'Total records in racer_data table',
        sql_equivalent: 'SELECT COUNT(*) FROM racer_data;',
        result: totalCount || 0,
        success: !countError,
        error: countError?.message || null
      })

      console.log(`📋 Total records: ${totalCount || 0}`)
    } catch (error) {
      verificationResults.tests.push({
        test_id: 1,
        description: 'Total records in racer_data table',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: 2024年後期データの件数確認
    console.log('📊 Test 2: 2024年後期 records count...')
    try {
      const { count: period2024Count, error: period2024Error } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })
        .eq('period_year', 2024)
        .eq('period_half', '後期')

      verificationResults.tests.push({
        test_id: 2,
        description: '2024年後期データ件数',
        sql_equivalent: "SELECT COUNT(*) FROM racer_data WHERE period_year = 2024 AND period_half = '後期';",
        result: period2024Count || 0,
        success: !period2024Error,
        error: period2024Error?.message || null
      })

      console.log(`📋 2024年後期 records: ${period2024Count || 0}`)
    } catch (error) {
      verificationResults.tests.push({
        test_id: 2,
        description: '2024年後期データ件数',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: サンプルデータ取得（2024年後期）
    console.log('📊 Test 3: Sample data from 2024年後期...')
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('racer_data')
        .select('registration_number, racer_name, grade, branch, period_year, period_half')
        .eq('period_year', 2024)
        .eq('period_half', '後期')
        .limit(5)

      verificationResults.tests.push({
        test_id: 3,
        description: '2024年後期サンプルデータ（5件）',
        sql_equivalent: "SELECT registration_number, racer_name, grade, branch FROM racer_data WHERE period_year = 2024 AND period_half = '後期' LIMIT 5;",
        result: sampleData || [],
        record_count: sampleData?.length || 0,
        success: !sampleError,
        error: sampleError?.message || null
      })

      console.log(`📋 Sample data retrieved: ${sampleData?.length || 0} records`)
    } catch (error) {
      verificationResults.tests.push({
        test_id: 3,
        description: '2024年後期サンプルデータ',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: 特定選手の検索（登録番号2014）
    console.log('📊 Test 4: Specific racer search (2014 - 高塚清一)...')
    try {
      const { data: specificRacer, error: specificError } = await supabase
        .from('racer_data')
        .select('*')
        .eq('registration_number', '2014')
        .single()

      verificationResults.tests.push({
        test_id: 4,
        description: '特定選手検索（登録番号2014）',
        sql_equivalent: "SELECT * FROM racer_data WHERE registration_number = '2014';",
        result: specificRacer || null,
        found: !!specificRacer,
        success: !specificError,
        error: specificError?.message || null
      })

      if (specificRacer) {
        console.log(`✅ Found racer 2014: ${specificRacer.racer_name || 'N/A'}`)
      } else {
        console.log(`❌ Racer 2014 not found`)
      }
    } catch (error) {
      verificationResults.tests.push({
        test_id: 4,
        description: '特定選手検索（登録番号2014）',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: テーブル構造確認
    console.log('📊 Test 5: Table structure investigation...')
    try {
      const { data: structureSample, error: structureError } = await supabase
        .from('racer_data')
        .select('*')
        .limit(1)

      let availableColumns = []
      if (structureSample && structureSample.length > 0) {
        availableColumns = Object.keys(structureSample[0])
      }

      verificationResults.tests.push({
        test_id: 5,
        description: 'テーブル構造確認',
        sql_equivalent: 'SELECT * FROM racer_data LIMIT 1; -- to check available columns',
        available_columns: availableColumns,
        sample_record: structureSample?.[0] || null,
        success: !structureError,
        error: structureError?.message || null
      })

      console.log(`📋 Available columns: ${availableColumns.join(', ')}`)
    } catch (error) {
      verificationResults.tests.push({
        test_id: 5,
        description: 'テーブル構造確認',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 総合評価
    const successfulTests = verificationResults.tests.filter(test => test.success).length
    const totalTests = verificationResults.tests.length

    const overallAssessment = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      success_rate: `${((successfulTests / totalTests) * 100).toFixed(2)}%`,
      import_status: successfulTests === totalTests ? 'VERIFIED' :
                    successfulTests > totalTests / 2 ? 'PARTIAL' : 'FAILED',
      recommendations: [] as string[]
    }

    // 推奨事項
    const test2Result = verificationResults.tests.find(t => t.test_id === 2)
    if (test2Result && test2Result.result === 0) {
      overallAssessment.recommendations.push('No 2024年後期 data found - import may have failed or used different table')
    }

    const test4Result = verificationResults.tests.find(t => t.test_id === 4)
    if (test4Result && !test4Result.found) {
      overallAssessment.recommendations.push('Specific racer (2014) not found - check data mapping')
    }

    console.log(`🎯 Verification completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: true,
      verification_summary: {
        ...overallAssessment,
        verification_date: verificationResults.timestamp
      },
      detailed_results: verificationResults.tests,
      sql_simulation: {
        note: 'These tests simulate the requested SQL queries using Supabase API',
        equivalent_queries: [
          "SELECT COUNT(*) FROM racer_data WHERE period_year = 2024 AND period_half = '後期';",
          "SELECT registration_number, racer_name, grade, branch FROM racer_data WHERE period_year = 2024 AND period_half = '後期' LIMIT 5;",
          "SELECT * FROM racer_data WHERE registration_number = '2014';"
        ]
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Import verification failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Import verification failed',
      details: errorMessage
    }, { status: 500 })
  }
}