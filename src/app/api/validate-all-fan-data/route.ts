import { NextResponse } from 'next/server'
import { parseFanDataFile, parseRacerRecord } from '@/lib/parsers/fanDataParser'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * 全1,616件FAN選手データの完全検証API
 * GET /api/validate-all-fan-data
 */
export async function GET() {
  try {
    console.log('🔍 Starting complete validation of all 1,616 FAN records...')

    // ファイル読み込み
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim().length > 0)

    console.log(`📄 Processing ${lines.length} total lines`)

    // 統計データ
    const stats = {
      total_lines: lines.length,
      valid_registration_numbers: 0,
      valid_japanese_names: 0,
      valid_classes: 0,
      valid_birth_dates: 0,
      complete_records: 0,
      // 異常データ統計
      corrupted_names: 0,
      invalid_registration_numbers: 0,
      invalid_classes: 0,
      empty_names: 0,
      parsing_failures: 0
    }

    // サンプルコレクション
    const normalSamples: any[] = []
    const abnormalSamples: any[] = []
    const validClasses = ['A1', 'A2', 'B1', 'B2']

    // 全レコード処理
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      try {
        const racer = parseRacerRecord(line)

        if (!racer) {
          stats.parsing_failures++
          if (abnormalSamples.length < 5) {
            abnormalSamples.push({
              line_number: lineNumber,
              error: 'Parse failure',
              raw_sample: line.substring(0, 100)
            })
          }
          continue
        }

        // 1. 登録番号チェック
        const isValidRegNumber = /^\d{4}$/.test(racer.registration_number)
        if (isValidRegNumber) {
          stats.valid_registration_numbers++
        } else {
          stats.invalid_registration_numbers++
          if (abnormalSamples.length < 5) {
            abnormalSamples.push({
              line_number: lineNumber,
              error: 'Invalid registration number',
              registration_number: racer.registration_number,
              raw_sample: line.substring(0, 100)
            })
          }
        }

        // 2. 氏名チェック（文字化け検出）
        const hasCorruptedName = racer.name_kanji.includes('�') ||
                                racer.name_kana.includes('�') ||
                                racer.name_kanji.trim().length === 0

        if (!hasCorruptedName && racer.name_kanji.trim().length > 0) {
          stats.valid_japanese_names++
        } else {
          if (racer.name_kanji.includes('�') || racer.name_kana.includes('�')) {
            stats.corrupted_names++
          }
          if (racer.name_kanji.trim().length === 0) {
            stats.empty_names++
          }

          if (abnormalSamples.length < 5) {
            abnormalSamples.push({
              line_number: lineNumber,
              error: 'Name corruption or empty',
              name_kanji: racer.name_kanji,
              name_kana: racer.name_kana,
              raw_sample: line.substring(0, 100)
            })
          }
        }

        // 3. 級別チェック
        if (validClasses.includes(racer.class)) {
          stats.valid_classes++
        } else {
          stats.invalid_classes++
          if (abnormalSamples.length < 5) {
            abnormalSamples.push({
              line_number: lineNumber,
              error: 'Invalid class',
              class: racer.class,
              raw_sample: line.substring(0, 100)
            })
          }
        }

        // 4. 生年月日チェック
        if (racer.birth_date && racer.birth_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          stats.valid_birth_dates++
        }

        // 5. 完全なレコードチェック
        if (isValidRegNumber &&
            !hasCorruptedName &&
            racer.name_kanji.trim().length > 0 &&
            validClasses.includes(racer.class)) {
          stats.complete_records++

          // 正常サンプルに追加
          if (normalSamples.length < 5) {
            normalSamples.push({
              line_number: lineNumber,
              registration_number: racer.registration_number,
              name_kanji: racer.name_kanji,
              name_kana: racer.name_kana,
              branch: racer.branch,
              class: racer.class,
              gender: racer.gender,
              birth_date: racer.birth_date
            })
          }
        }

      } catch (error) {
        stats.parsing_failures++
        console.error(`Line ${lineNumber} parse error:`, error)

        if (abnormalSamples.length < 5) {
          abnormalSamples.push({
            line_number: lineNumber,
            error: 'Parse exception',
            details: error instanceof Error ? error.message : 'Unknown error',
            raw_sample: line.substring(0, 100)
          })
        }
      }

      // 進行状況ログ（100件ごと）
      if (lineNumber % 100 === 0) {
        console.log(`📊 Processed ${lineNumber}/${lines.length} lines...`)
      }
    }

    // データ品質レート計算
    const qualityRates = {
      registration_number_rate: (stats.valid_registration_numbers / stats.total_lines * 100).toFixed(2),
      japanese_name_rate: (stats.valid_japanese_names / stats.total_lines * 100).toFixed(2),
      class_rate: (stats.valid_classes / stats.total_lines * 100).toFixed(2),
      birth_date_rate: (stats.valid_birth_dates / stats.total_lines * 100).toFixed(2),
      complete_record_rate: (stats.complete_records / stats.total_lines * 100).toFixed(2)
    }

    console.log('✅ Complete validation finished!')
    console.log(`📈 Overall quality: ${qualityRates.complete_record_rate}% complete records`)

    return NextResponse.json({
      success: true,
      validation_summary: {
        total_processed: stats.total_lines,
        validation_date: new Date().toISOString(),
        source_file: 'fan2410_utf8.txt'
      },
      data_quality_stats: stats,
      quality_rates: qualityRates,
      samples: {
        normal_records: normalSamples,
        abnormal_records: abnormalSamples
      },
      recommendations: {
        usable_records: stats.complete_records,
        data_quality_level: stats.complete_records > 1500 ? 'High' :
                           stats.complete_records > 1000 ? 'Medium' : 'Low',
        main_issues: [
          stats.corrupted_names > 100 ? 'Significant name corruption detected' : null,
          stats.invalid_registration_numbers > 50 ? 'Registration number format issues' : null,
          stats.invalid_classes > 50 ? 'Class classification issues' : null
        ].filter(issue => issue !== null)
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Complete validation failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Complete validation failed',
      details: errorMessage
    }, { status: 500 })
  }
}