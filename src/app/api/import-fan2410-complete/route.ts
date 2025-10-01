import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * fan2410データの完全Supabaseインポート
 * POST /api/import-fan2410-complete
 */
export async function POST() {
  try {
    console.log('🚀 Starting complete fan2410 import to Supabase...')

    const supabase = createClient()

    // ファイル解析
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    console.log(`📊 Parsed ${racers.length} racers for import`)

    if (racers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid racer data found'
      }, { status: 400 })
    }

    // インポート前の件数確認
    const { count: beforeCount } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    console.log(`📋 Current records in racer_data: ${beforeCount || 0}`)

    // バッチインサート準備
    const batchSize = 100
    let totalInserted = 0
    let totalErrors = 0
    const errorDetails: any[] = []

    console.log(`🔄 Starting batch import (${Math.ceil(racers.length / batchSize)} batches)...`)

    // バッチ処理
    for (let i = 0; i < racers.length; i += batchSize) {
      const batch = racers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing batch ${batchNumber}/${Math.ceil(racers.length / batchSize)} (${batch.length} records)...`)

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
        data_source: 'fan2410',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      try {
        const { data, error } = await supabase
          .from('racer_data')
          .upsert(insertData, {
            onConflict: 'registration_number',
            ignoreDuplicates: false
          })

        if (error) {
          console.error(`❌ Batch ${batchNumber} failed:`, error.message)
          totalErrors += batch.length
          errorDetails.push({
            batch_number: batchNumber,
            error: error.message,
            affected_records: batch.length
          })
        } else {
          totalInserted += batch.length
          console.log(`✅ Batch ${batchNumber} completed successfully`)
        }

      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} exception:`, batchError)
        totalErrors += batch.length
        errorDetails.push({
          batch_number: batchNumber,
          error: batchError instanceof Error ? batchError.message : 'Unknown error',
          affected_records: batch.length
        })
      }

      // 進行状況表示
      if (batchNumber % 5 === 0) {
        console.log(`📈 Progress: ${totalInserted + totalErrors}/${racers.length} processed`)
      }
    }

    // インポート後の件数確認
    const { count: afterCount } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    console.log(`🎯 Import completed: ${totalInserted} inserted, ${totalErrors} errors`)
    console.log(`📊 Table record count: ${beforeCount || 0} → ${afterCount || 0}`)

    // 検証：サンプルデータ取得
    const { data: sampleData, error: sampleError } = await supabase
      .from('racer_data')
      .select('*')
      .eq('data_source', 'fan2410')
      .limit(5)

    return NextResponse.json({
      success: true,
      import_summary: {
        source_file: 'fan2410_utf8.txt',
        total_parsed: racers.length,
        total_inserted: totalInserted,
        total_errors: totalErrors,
        batch_count: Math.ceil(racers.length / batchSize),
        period_year: 2024,
        period_half: '後期',
        data_source: 'fan2410'
      },
      database_changes: {
        records_before: beforeCount || 0,
        records_after: afterCount || 0,
        net_increase: (afterCount || 0) - (beforeCount || 0)
      },
      verification: {
        sample_data: sampleData || [],
        sample_error: sampleError?.message || null
      },
      error_details: errorDetails,
      message: `Successfully imported ${totalInserted}/${racers.length} fan2410 records to Supabase`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Complete fan2410 import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Complete fan2410 import failed',
      details: errorMessage
    }, { status: 500 })
  }
}