import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * 正しいカラムマッピングでfan2410データをインポート
 * POST /api/import-fan2410-mapped
 */
export async function POST() {
  try {
    console.log('🚀 Starting fan2410 import with correct column mapping...')

    const supabase = createClient()

    // 発見されたカラム構造
    const columnMapping = {
      // fan2410フィールド → 実際のDBカラム
      registration_number: 'racer_number',  // 登録番号
      name_kanji: 'racer_name',            // 選手名
      // name_kana: null,                   // カナ名（対応カラムなし）
      branch: 'branch',                    // 支部
      class: 'grade',                      // 級別
      // gender: null,                      // 性別（対応カラムなし）
      // birth_date: null                   // 生年月日（対応カラムなし）
    }

    console.log('📋 Using column mapping:', columnMapping)

    // fan2410データを解析
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    console.log(`📊 Parsed ${racers.length} racers for mapped import`)

    // インポート前の件数確認
    const { count: beforeCount } = await supabase
      .from('racer_data')
      .select('*', { count: 'exact', head: true })

    console.log(`📋 Records before import: ${beforeCount || 0}`)

    // マッピングされたデータでバッチインサート
    const batchSize = 100
    let totalInserted = 0
    let totalErrors = 0
    const errorDetails: any[] = []
    const successfulInserts: any[] = []

    console.log(`🔄 Starting mapped batch import (${Math.ceil(racers.length / batchSize)} batches)...`)

    for (let i = 0; i < racers.length; i += batchSize) {
      const batch = racers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing batch ${batchNumber}/${Math.ceil(racers.length / batchSize)} (${batch.length} records)...`)

      // 実際のカラム名にマッピング（必須フィールド含む）
      const mappedData = batch.map(racer => ({
        racer_number: racer.registration_number,  // 登録番号
        racer_name: racer.name_kanji,             // 漢字氏名
        grade: racer.class,                       // 級別
        branch: racer.branch,                     // 支部
        period_year: 2024,                       // 必須: 期年
        period_half: '後期'                      // 期別
      }))

      try {
        const { data, error } = await supabase
          .from('racer_data')
          .insert(mappedData)
          .select()

        if (error) {
          console.error(`❌ Batch ${batchNumber} failed:`, error.message)
          totalErrors += batch.length
          errorDetails.push({
            batch_number: batchNumber,
            error: error.message,
            affected_records: batch.length,
            sample_data: mappedData[0]
          })
        } else {
          totalInserted += batch.length
          console.log(`✅ Batch ${batchNumber} completed: ${batch.length} records inserted`)

          // 成功例を記録
          if (successfulInserts.length < 5 && data && data.length > 0) {
            successfulInserts.push(data[0])
          }
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

    console.log(`🎯 Mapped import completed: ${totalInserted} inserted, ${totalErrors} errors`)

    // 検証: 挿入されたデータの確認
    const { data: verificationData, error: verificationError } = await supabase
      .from('racer_data')
      .select('racer_number, racer_name, grade, branch')
      .limit(5)

    // 特定選手の検索（2014 高塚清一）
    const { data: specificRacer, error: specificError } = await supabase
      .from('racer_data')
      .select('*')
      .eq('racer_number', '2014')
      .single()

    return NextResponse.json({
      success: true,
      mapping_info: {
        column_mapping: columnMapping,
        strategy: 'Use existing racer_data table with correct column names'
      },
      import_summary: {
        source_file: 'fan2410_utf8.txt',
        total_parsed: racers.length,
        total_inserted: totalInserted,
        total_errors: totalErrors,
        success_rate: `${((totalInserted / racers.length) * 100).toFixed(2)}%`,
        batch_count: Math.ceil(racers.length / batchSize)
      },
      database_changes: {
        records_before: beforeCount || 0,
        records_after: afterCount || 0,
        net_increase: (afterCount || 0) - (beforeCount || 0)
      },
      verification: {
        sample_data: verificationData || [],
        sample_count: verificationData?.length || 0,
        verification_error: verificationError?.message || null,
        specific_racer_2014: {
          found: !!specificRacer,
          data: specificRacer || null,
          error: specificError?.message || null
        }
      },
      sql_equivalents: [
        `-- Records inserted: ${totalInserted}`,
        `SELECT COUNT(*) FROM racer_data; -- Result: ${afterCount || 0}`,
        `SELECT racer_number, racer_name, grade, branch FROM racer_data LIMIT 5;`,
        `SELECT * FROM racer_data WHERE racer_number = '2014'; -- 高塚清一`
      ],
      error_details: errorDetails,
      message: `Successfully imported ${totalInserted}/${racers.length} fan2410 records with correct column mapping`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Mapped fan2410 import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Mapped fan2410 import failed',
      details: errorMessage
    }, { status: 500 })
  }
}