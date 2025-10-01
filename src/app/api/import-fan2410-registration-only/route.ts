import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { parseFanDataFile } from '@/lib/parsers/fanDataParser'
import path from 'path'

/**
 * fan2410データをregistration_numberのみでインポート（スキーマ調査用）
 * POST /api/import-fan2410-registration-only
 */
export async function POST() {
  try {
    console.log('🚀 Starting registration-only import for schema investigation...')

    const supabase = createClient()

    // ファイル解析
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const racers = await parseFanDataFile(filePath)

    // 最初の3件のみテスト
    const testRacers = racers.slice(0, 3)

    console.log(`📊 Testing with ${testRacers.length} records`)

    // registration_numberのみでインサート試行
    for (let i = 0; i < testRacers.length; i++) {
      const racer = testRacers[i]

      console.log(`Testing record ${i + 1}: ${racer.registration_number}`)

      try {
        const { data, error } = await supabase
          .from('racer_data')
          .insert({
            registration_number: racer.registration_number
          })
          .select()

        if (error) {
          console.error(`❌ Single insert failed:`, error)
          return NextResponse.json({
            success: false,
            error: `Single insert failed: ${error.message}`,
            attempted_record: {
              registration_number: racer.registration_number
            },
            schema_investigation: {
              error_code: error.code,
              error_details: error.details,
              error_hint: error.hint
            }
          })
        } else {
          console.log(`✅ Successfully inserted: ${racer.registration_number}`)

          // 成功した場合、レコードを確認
          const { data: inserted } = await supabase
            .from('racer_data')
            .select('*')
            .eq('registration_number', racer.registration_number)
            .single()

          return NextResponse.json({
            success: true,
            message: 'Single record insert successful!',
            inserted_record: inserted,
            schema_investigation: {
              available_columns: inserted ? Object.keys(inserted) : [],
              next_step: 'Use discovered schema for full import'
            }
          })
        }

      } catch (insertError) {
        console.error(`❌ Insert exception:`, insertError)
        return NextResponse.json({
          success: false,
          error: 'Insert exception occurred',
          details: insertError instanceof Error ? insertError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'No successful inserts completed'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Registration-only import failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Registration-only import failed',
      details: errorMessage
    }, { status: 500 })
  }
}