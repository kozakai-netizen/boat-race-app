import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile, type RacerMasterData } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * FAN選手データをインポートするAPI
 * POST /api/import-fan-data
 */
export async function POST() {
  try {
    console.log('🚀 Starting FAN data import...')

    // ファイルパス
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')

    // ファイル解析
    const racers = await parseFanDataFile(filePath)
    console.log(`📊 Parsed ${racers.length} racers`)

    if (racers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid racer data found'
      }, { status: 400 })
    }

    // 最初の3件をサンプル表示
    const samples = racers.slice(0, 3)
    console.log('Sample parsed data:', samples)

    const supabase = createClient()
    let insertedCount = 0
    let errorCount = 0

    // バッチインサート（100件ずつ）
    const batchSize = 100
    for (let i = 0; i < racers.length; i += batchSize) {
      const batch = racers.slice(i, i + batchSize)

      const insertData = batch.map(racer => ({
        registration_number: racer.registration_number,
        name_kanji: racer.name_kanji,
        name_kana: racer.name_kana,
        branch: racer.branch,
        class: racer.class,
        gender: racer.gender,
        birth_date: racer.birth_date || null,
        height: racer.height,
        weight: racer.weight,
        win_rate: racer.win_rate,
        quinella_rate: racer.quinella_rate,
        trio_rate: racer.trio_rate,
        avg_st: racer.avg_st,
        data_source: 'fan2410',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('racer_data')
        .upsert(insertData, {
          onConflict: 'registration_number'
        })

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error)
        errorCount += batch.length
      } else {
        insertedCount += batch.length
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed: ${batch.length} records`)
      }
    }

    console.log(`🎯 Import completed: ${insertedCount} inserted, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        total_parsed: racers.length,
        inserted: insertedCount,
        errors: errorCount,
        source_file: 'fan2410_utf8.txt',
        sample_data: samples
      },
      message: `Successfully imported ${insertedCount} racer records`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ FAN data import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'FAN data import failed',
      details: errorMessage
    }, { status: 500 })
  }
}