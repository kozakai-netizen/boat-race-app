import { NextResponse } from 'next/server'
import { parseRacerRecord } from '@/lib/parsers/fanDataParser'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * FAN選手データパーサーをテストするAPI
 * GET /api/test-fan-parser
 */
export async function GET() {
  try {
    console.log('🧪 Testing FAN data parser...')

    // ファイル読み込み
    const filePath = path.join(process.cwd(), 'data', 'fan2410_utf8.txt')
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim().length > 0)

    console.log(`📄 Found ${lines.length} lines in file`)

    // 最初の5行をテスト
    const testResults = []
    const rawSamples = []

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i]
      const parsed = parseRacerRecord(line)

      testResults.push({
        line_number: i + 1,
        raw_length: line.length,
        parsed: parsed,
        parsing_success: parsed !== null
      })

      rawSamples.push({
        line_number: i + 1,
        first_50_chars: line.substring(0, 50),
        char_analysis: line.substring(0, 50).split('').map((char, idx) => ({
          pos: idx,
          char: char,
          code: char.charCodeAt(0)
        }))
      })
    }

    return NextResponse.json({
      success: true,
      file_info: {
        path: filePath,
        total_lines: lines.length,
        first_line_length: lines[0]?.length || 0
      },
      test_results: testResults,
      raw_samples: rawSamples,
      parsing_summary: {
        successful_parses: testResults.filter(r => r.parsing_success).length,
        failed_parses: testResults.filter(r => !r.parsing_success).length
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Parser test failed:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Parser test failed',
      details: errorMessage
    }, { status: 500 })
  }
}