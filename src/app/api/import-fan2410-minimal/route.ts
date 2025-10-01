import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * fan2410データの最小構成でのSupabaseインポート
 * POST /api/import-fan2410-minimal
 */
export async function POST() {
  try {
    console.log('🚀 Starting minimal fan2410 import to Supabase...')

    const supabase = createClient()

    // ファイル解析
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    console.log(`📊 Parsed ${racers.length} racers for import`)

    // インポート前の件数確認
    const { count: beforeCount } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    console.log(`📋 Current records in racer_data: ${beforeCount || 0}`)

    // 最小限のフィールドでバッチインサート
    const batchSize = 50
    let totalInserted = 0
    let totalErrors = 0
    const errorDetails: any[] = []

    console.log(`🔄 Starting minimal batch import...`)

    // 最初の100件でテスト
    const testRacers = racers.slice(0, 100)

    for (let i = 0; i < testRacers.length; i += batchSize) {
      const batch = testRacers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing test batch ${batchNumber} (${batch.length} records)...`)

      // 最小限のフィールドのみ使用
      const insertData = batch.map(racer => ({
        registration_number: racer.registration_number,
        name_kanji: racer.name_kanji,
        name_kana: racer.name_kana || ''
      }))

      try {
        const { data, error } = await supabase
          .from('racer_data')
          .insert(insertData)

        if (error) {
          console.error(`❌ Batch ${batchNumber} failed:`, error.message)
          totalErrors += batch.length
          errorDetails.push({
            batch_number: batchNumber,
            error: error.message,
            affected_records: batch.length,
            sample_record: insertData[0]
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
    }

    // インポート後の件数確認
    const { count: afterCount } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    console.log(`🎯 Test import completed: ${totalInserted} inserted, ${totalErrors} errors`)

    // 検証：挿入されたデータのサンプル取得
    const { data: sampleData, error: sampleError } = await supabase
      .from('racer_data')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      import_summary: {
        source_file: 'fan2410_utf8.txt',
        test_records: testRacers.length,
        total_inserted: totalInserted,
        total_errors: totalErrors,
        strategy: 'minimal_fields_test'
      },
      database_changes: {
        records_before: beforeCount || 0,
        records_after: afterCount || 0,
        net_increase: (afterCount || 0) - (beforeCount || 0)
      },
      verification: {
        sample_data: sampleData || [],
        sample_count: sampleData?.length || 0,
        sample_error: sampleError?.message || null
      },
      error_details: errorDetails,
      next_steps: totalInserted > 0 ?
        'Test successful! Ready for full 1,616 record import.' :
        'Need to adjust schema or field mapping.',
      message: `Test import: ${totalInserted}/${testRacers.length} records inserted`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Minimal fan2410 import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Minimal fan2410 import failed',
      details: errorMessage
    }, { status: 500 })
  }
}