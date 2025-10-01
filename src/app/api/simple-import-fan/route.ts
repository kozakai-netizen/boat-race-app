import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * 簡単なFAN選手データインポートAPI
 * POST /api/simple-import-fan
 */
export async function POST() {
  try {
    console.log('🚀 Starting simple FAN data import...')

    const supabase = createClient()

    // まずracer_dataテーブルの存在確認
    const { data: existingData, error: checkError } = await supabase
      .from('racer_data')
      .select('count')
      .limit(1)

    if (checkError) {
      // テーブルが存在しない場合は作成
      console.log('📋 Creating racer_data table...')

      const { error: createError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS racer_data (
            registration_number TEXT PRIMARY KEY,
            name_kanji TEXT,
            name_kana TEXT,
            branch TEXT,
            class TEXT,
            gender TEXT,
            birth_date TEXT,
            data_source TEXT DEFAULT 'fan2410',
            created_at TIMESTAMP DEFAULT NOW()
          );
        `
      })

      if (createError) {
        console.log('⚠️ Table creation may have failed, continuing anyway...')
      }
    }

    // ファイル解析
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    console.log(`📊 Parsed ${racers.length} racers`)

    if (racers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid racer data found'
      }, { status: 400 })
    }

    // 最初の10件のみテストインサート
    const testRacers = racers.slice(0, 10)
    const insertResults = []

    for (const racer of testRacers) {
      try {
        const { data, error } = await supabase
          .from('racer_data')
          .insert({
            registration_number: racer.registration_number,
            name_kanji: racer.name_kanji,
            name_kana: racer.name_kana
          })
          .select()

        insertResults.push({
          registration_number: racer.registration_number,
          success: !error,
          error: error?.message || null
        })

        if (error) {
          console.error(`❌ Failed to insert ${racer.registration_number}:`, error.message)
        } else {
          console.log(`✅ Inserted ${racer.registration_number}: ${racer.name_kanji}`)
        }

      } catch (insertError) {
        console.error(`❌ Insert error for ${racer.registration_number}:`, insertError)
        insertResults.push({
          registration_number: racer.registration_number,
          success: false,
          error: insertError instanceof Error ? insertError.message : 'Unknown error'
        })
      }
    }

    const successCount = insertResults.filter(r => r.success).length
    const errorCount = insertResults.filter(r => !r.success).length

    console.log(`🎯 Import test completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        total_parsed: racers.length,
        test_inserted: testRacers.length,
        successful_inserts: successCount,
        failed_inserts: errorCount,
        source_file: 'fan2410_utf8.txt'
      },
      insert_results: insertResults,
      sample_data: testRacers.slice(0, 3),
      message: `Test import completed: ${successCount}/${testRacers.length} records inserted`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Simple FAN data import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Simple FAN data import failed',
      details: errorMessage
    }, { status: 500 })
  }
}