import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * fan2410専用のracer_masterテーブルを作成してデータをインポート
 * POST /api/create-fan2410-table
 */
export async function POST() {
  try {
    console.log('🚀 Creating fan2410-specific table and importing data...')

    const supabase = createClient()

    // 新しいテーブルを作成（racer_master）
    console.log('📋 Creating racer_master table...')

    // まずテーブルを削除（存在する場合）
    await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS racer_master;'
    })

    // 新しいテーブルを作成
    const createTableResult = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE racer_master (
          registration_number TEXT PRIMARY KEY,
          name_kanji TEXT NOT NULL,
          name_kana TEXT,
          branch TEXT,
          class TEXT CHECK (class IN ('A1', 'A2', 'B1', 'B2')),
          gender TEXT CHECK (gender IN ('M', 'F')),
          birth_date TEXT,
          period_year INTEGER DEFAULT 2024,
          period_half TEXT DEFAULT '後期',
          data_source TEXT DEFAULT 'fan2410',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (createTableResult.error) {
      return NextResponse.json({
        success: false,
        error: 'Table creation failed',
        details: createTableResult.error.message
      }, { status: 500 })
    }

    console.log('✅ racer_master table created successfully')

    // テーブル作成確認
    const { data: testData, error: testError } = await supabase
      .from('racer_master')
      .select('*')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Table verification failed',
        details: testError.message
      }, { status: 500 })
    }

    // fan2410データを解析してインポート
    const { parseFanDataFile } = await import('@/lib/parsers/fanDataParser')
    const path = await import('path')

    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    console.log(`📊 Importing ${racers.length} racers to racer_master...`)

    // バッチインサート
    const batchSize = 100
    let totalInserted = 0
    const results = []

    for (let i = 0; i < racers.length; i += batchSize) {
      const batch = racers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      const insertData = batch.map(racer => ({
        registration_number: racer.registration_number,
        name_kanji: racer.name_kanji,
        name_kana: racer.name_kana,
        branch: racer.branch,
        class: racer.class,
        gender: racer.gender,
        birth_date: racer.birth_date || null,
        period_year: 2024,
        period_half: '後期',
        data_source: 'fan2410'
      }))

      const { data, error } = await supabase
        .from('racer_master')
        .insert(insertData)

      if (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message)
        results.push({
          batch: batchNumber,
          success: false,
          error: error.message,
          records: batch.length
        })
      } else {
        totalInserted += batch.length
        console.log(`✅ Batch ${batchNumber} completed: ${batch.length} records`)
        results.push({
          batch: batchNumber,
          success: true,
          records: batch.length
        })
      }
    }

    // 最終確認
    const { count: finalCount } = await supabase
      .from('racer_master')
      .select('*', { count: 'exact', head: true })

    // サンプルデータ取得
    const { data: sampleData } = await supabase
      .from('racer_master')
      .select('*')
      .limit(5)

    console.log(`🎯 Import completed: ${totalInserted}/${racers.length} records`)

    return NextResponse.json({
      success: true,
      table_creation: {
        table_name: 'racer_master',
        created: true,
        structure: 'Optimized for fan2410 data'
      },
      import_summary: {
        source_file: 'fan2410_utf8.txt',
        total_parsed: racers.length,
        total_inserted: totalInserted,
        success_rate: `${((totalInserted / racers.length) * 100).toFixed(2)}%`,
        batch_results: results
      },
      verification: {
        final_count: finalCount || 0,
        sample_data: sampleData || []
      },
      message: `Successfully created racer_master table and imported ${totalInserted}/${racers.length} fan2410 records`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ fan2410 table creation and import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'fan2410 table creation and import failed',
      details: errorMessage
    }, { status: 500 })
  }
}