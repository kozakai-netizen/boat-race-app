import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * racer_dataテーブルの実際の構造を調査するAPI
 * GET /api/investigate-racer-table
 */
export async function GET() {
  try {
    console.log('🔍 Investigating actual racer_data table structure...')

    const supabase = createClient()
    const investigation = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: テーブル存在確認と全件数
    console.log('📊 Test 1: Table existence and total count...')
    try {
      const { count: totalCount, error: countError } = await supabase
        .from('racer_data')
        .select('*', { count: 'exact', head: true })

      investigation.tests.push({
        test_id: 1,
        description: 'Table existence and total count',
        sql_equivalent: 'SELECT COUNT(*) FROM racer_data;',
        result: totalCount || 0,
        success: !countError,
        error: countError?.message || null
      })

      console.log(`📋 Total records in racer_data: ${totalCount || 0}`)
    } catch (error) {
      investigation.tests.push({
        test_id: 1,
        description: 'Table existence check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: 実際のデータサンプルを取得してカラム構造を確認
    console.log('📊 Test 2: Sample data to discover actual columns...')
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('racer_data')
        .select('*')
        .limit(3)

      let columnInfo = null
      let actualColumns = []

      if (sampleData && sampleData.length > 0) {
        actualColumns = Object.keys(sampleData[0])
        columnInfo = actualColumns.map(col => ({
          column_name: col,
          data_type: typeof sampleData[0][col],
          sample_value: sampleData[0][col],
          is_null: sampleData[0][col] === null
        }))
      }

      investigation.tests.push({
        test_id: 2,
        description: 'Actual table structure discovery',
        sql_equivalent: 'SELECT * FROM racer_data LIMIT 3;',
        sample_data: sampleData || [],
        sample_count: sampleData?.length || 0,
        actual_columns: actualColumns,
        column_details: columnInfo,
        success: !sampleError,
        error: sampleError?.message || null
      })

      console.log(`📋 Discovered columns: ${actualColumns.join(', ')}`)
    } catch (error) {
      investigation.tests.push({
        test_id: 2,
        description: 'Sample data retrieval',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: 推測されるカラム名でテスト検索
    console.log('📊 Test 3: Testing common column name variations...')
    const commonColumnVariations = [
      'racer_number', 'racer_id', 'number', 'id',
      'racer_name', 'name', 'name_kanji', 'kanji_name',
      'racer_grade', 'grade', 'class', 'level',
      'racer_branch', 'branch', 'home', 'prefecture'
    ]

    const columnTestResults = []

    for (const columnName of commonColumnVariations) {
      try {
        const { data, error } = await supabase
          .from('racer_data')
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
      test_id: 3,
      description: 'Common column name variation testing',
      test_columns: commonColumnVariations,
      results: columnTestResults,
      existing_columns: columnTestResults.filter(r => r.exists).map(r => r.column_name),
      success: true
    })

    // Test 4: 他のテーブルとの関連確認
    console.log('📊 Test 4: Related table check...')
    const relatedTables = ['racer_entries', 'racer_master', 'racers']
    const tableExistenceResults = []

    for (const tableName of relatedTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        tableExistenceResults.push({
          table_name: tableName,
          exists: !error,
          record_count: count || 0,
          error_message: error?.message || null
        })

        if (!error) {
          console.log(`✅ Table '${tableName}' exists with ${count || 0} records`)
        }
      } catch (err) {
        tableExistenceResults.push({
          table_name: tableName,
          exists: false,
          error_message: 'Access failed'
        })
      }
    }

    investigation.tests.push({
      test_id: 4,
      description: 'Related table existence check',
      tested_tables: relatedTables,
      results: tableExistenceResults,
      existing_tables: tableExistenceResults.filter(r => r.exists),
      success: true
    })

    // 総合評価とマッピング提案
    const actualColumnsFound = investigation.tests[1]?.actual_columns || []
    const mappingProposal = generateColumnMapping(actualColumnsFound)

    console.log('🎯 Investigation completed')

    return NextResponse.json({
      success: true,
      investigation_summary: {
        timestamp: investigation.timestamp,
        table_name: 'racer_data',
        total_tests: investigation.tests.length,
        structure_discovered: actualColumnsFound.length > 0
      },
      actual_table_structure: {
        columns: actualColumnsFound,
        column_details: investigation.tests[1]?.column_details || [],
        sample_records: investigation.tests[1]?.sample_data || []
      },
      column_mapping_proposal: mappingProposal,
      detailed_tests: investigation.tests,
      next_steps: actualColumnsFound.length > 0 ?
        'Use discovered column structure for fan2410 import' :
        'Create new table or use alternative approach'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Table investigation failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Table investigation failed',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * 発見されたカラムからfan2410データのマッピングを提案
 */
function generateColumnMapping(actualColumns: string[]) {
  const fan2410Fields = {
    registration_number: '登録番号',
    name_kanji: '漢字氏名',
    name_kana: 'カナ氏名',
    branch: '支部',
    class: '級別',
    gender: '性別',
    birth_date: '生年月日'
  }

  const mapping: any = {}
  const unmapped: string[] = []

  for (const [fan2410Field, description] of Object.entries(fan2410Fields)) {
    let mappedColumn = null

    // 完全一致チェック
    if (actualColumns.includes(fan2410Field)) {
      mappedColumn = fan2410Field
    }
    // 部分一致チェック
    else {
      for (const actualCol of actualColumns) {
        if (actualCol.toLowerCase().includes(fan2410Field.split('_')[0]) ||
            fan2410Field.split('_')[0].includes(actualCol.toLowerCase())) {
          mappedColumn = actualCol
          break
        }
      }
    }

    if (mappedColumn) {
      mapping[fan2410Field] = {
        target_column: mappedColumn,
        description: description,
        mapping_confidence: mappedColumn === fan2410Field ? 'high' : 'medium'
      }
    } else {
      unmapped.push(fan2410Field)
    }
  }

  return {
    successful_mappings: mapping,
    unmapped_fields: unmapped,
    mapping_completeness: `${Object.keys(mapping).length}/${Object.keys(fan2410Fields).length} fields mapped`
  }
}