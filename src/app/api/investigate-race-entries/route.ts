import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * race_entriesテーブルの構造とデータを調査するAPI
 * GET /api/investigate-race-entries
 */
export async function GET() {
  try {
    console.log('🔍 Investigating race_entries table structure...')

    const supabase = createClient()
    const investigation = {
      timestamp: new Date().toISOString(),
      table_name: 'race_entries',
      tests: [] as any[]
    }

    // Test 1: テーブル存在確認と件数
    console.log('📊 Test 1: Table existence and record count...')
    try {
      const { count: totalCount, error: countError } = await supabase
        .from('race_entries')
        .select('*', { count: 'exact', head: true })

      investigation.tests.push({
        test_id: 1,
        description: 'race_entries table existence and count',
        result: totalCount || 0,
        success: !countError,
        error: countError?.message || null
      })

      console.log(`📋 Total records in race_entries: ${totalCount || 0}`)
    } catch (error) {
      investigation.tests.push({
        test_id: 1,
        description: 'race_entries table check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: カラム構造の発見
    console.log('📊 Test 2: Discover actual columns...')
    const testColumns = [
      'race_id', 'racer_number', 'racer_id', 'lane', 'pit',
      'player_name', 'racer_name', 'name',
      'player_grade', 'grade', 'class',
      'st_time', 'exhibition_time', 'motor_rate'
    ]

    const columnTestResults = []

    for (const columnName of testColumns) {
      try {
        const { data, error } = await supabase
          .from('race_entries')
          .select(columnName)
          .limit(1)

        columnTestResults.push({
          column_name: columnName,
          exists: !error,
          error_message: error?.message || null
        })

        if (!error) {
          console.log(`✅ Column '${columnName}' exists`)
        }
      } catch (err) {
        columnTestResults.push({
          column_name: columnName,
          exists: false,
          error_message: 'Test failed'
        })
      }
    }

    investigation.tests.push({
      test_id: 2,
      description: 'Column existence testing',
      tested_columns: testColumns,
      results: columnTestResults,
      existing_columns: columnTestResults.filter(r => r.exists).map(r => r.column_name),
      success: true
    })

    // Test 3: サンプルデータ取得（もしデータがあれば）
    console.log('📊 Test 3: Sample data retrieval...')
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('race_entries')
        .select('*')
        .limit(3)

      let actualColumns = []
      if (sampleData && sampleData.length > 0) {
        actualColumns = Object.keys(sampleData[0])
      }

      investigation.tests.push({
        test_id: 3,
        description: 'Sample data and full structure',
        sample_data: sampleData || [],
        sample_count: sampleData?.length || 0,
        full_column_list: actualColumns,
        success: !sampleError,
        error: sampleError?.message || null
      })

      console.log(`📋 Sample records found: ${sampleData?.length || 0}`)
      if (actualColumns.length > 0) {
        console.log(`📋 All columns: ${actualColumns.join(', ')}`)
      }
    } catch (error) {
      investigation.tests.push({
        test_id: 3,
        description: 'Sample data retrieval',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: resultテーブルとの関連確認
    console.log('📊 Test 4: Check result table for race_id patterns...')
    try {
      const { data: resultSample, error: resultError } = await supabase
        .from('result')
        .select('race_id')
        .limit(5)

      investigation.tests.push({
        test_id: 4,
        description: 'result table race_id patterns',
        sample_race_ids: resultSample?.map(r => r.race_id) || [],
        success: !resultError,
        error: resultError?.message || null,
        note: 'These race_ids can be used to find matching race_entries'
      })

      console.log(`📋 Sample race_ids from result: ${resultSample?.map(r => r.race_id).join(', ')}`)
    } catch (error) {
      investigation.tests.push({
        test_id: 4,
        description: 'result table check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 統合提案の生成
    const existingColumns = investigation.tests[1]?.existing_columns || []
    const integrationProposal = generateIntegrationStrategy(existingColumns)

    console.log('🎯 Investigation completed')

    return NextResponse.json({
      success: true,
      investigation_summary: {
        timestamp: investigation.timestamp,
        table_analyzed: 'race_entries',
        columns_discovered: existingColumns.length,
        has_data: (investigation.tests[2]?.sample_count || 0) > 0
      },
      discovered_structure: {
        existing_columns: existingColumns,
        sample_data: investigation.tests[2]?.sample_data || [],
        record_count: investigation.tests[0]?.result || 0
      },
      integration_strategy: integrationProposal,
      detailed_tests: investigation.tests,
      next_steps: existingColumns.length > 0 ?
        'Implement race_entries integration' :
        'Use alternative approach or populate race_entries table'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ race_entries investigation failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'race_entries investigation failed',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * 発見されたカラムから統合戦略を提案
 */
function generateIntegrationStrategy(existingColumns: string[]) {
  const requiredMappings = {
    race_id: 'レースID',
    racer_info: '選手情報（番号/名前）',
    lane_info: 'レーン情報',
    grade_info: '級別情報'
  }

  const strategy = {
    approach: 'unknown',
    mappings: {} as any,
    confidence: 'low',
    implementation_notes: [] as string[]
  }

  if (existingColumns.includes('race_id')) {
    strategy.approach = 'race_entries_direct'
    strategy.mappings.race_id = 'race_id'
    strategy.confidence = 'medium'
    strategy.implementation_notes.push('race_id column available for direct lookup')
  }

  if (existingColumns.includes('racer_number') || existingColumns.includes('racer_id')) {
    const racerCol = existingColumns.includes('racer_number') ? 'racer_number' : 'racer_id'
    strategy.mappings.racer_identifier = racerCol
    strategy.implementation_notes.push(`Use ${racerCol} to join with racer_data`)
  }

  if (existingColumns.includes('lane') || existingColumns.includes('pit')) {
    const laneCol = existingColumns.includes('lane') ? 'lane' : 'pit'
    strategy.mappings.lane = laneCol
    strategy.implementation_notes.push(`Lane information via ${laneCol}`)
  }

  if (existingColumns.length === 0) {
    strategy.approach = 'alternative_needed'
    strategy.implementation_notes.push('race_entries table appears empty or inaccessible')
    strategy.implementation_notes.push('Consider using racer_data directly with mock lane assignments')
  }

  return strategy
}