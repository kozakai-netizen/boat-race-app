import { NextRequest, NextResponse } from 'next/server'
import { parseJLCFile, validateRacerData, type JLCRacerData } from '@/lib/import/jlcParser'
import { createClient } from '@/lib/supabase'

/**
 * JLC選手データインポートAPI
 * POST /api/import-racer-data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Import Racer Data] Starting import process')

    // フォームデータ取得
    const formData = await request.formData()
    const file = formData.get('file') as File
    const adminToken = formData.get('adminToken') as string

    // 管理者認証
    if (adminToken !== process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📁 Processing file: ${file.name} (${file.size} bytes)`)

    // ファイル内容読み込み（Shift_JIS対応）
    const arrayBuffer = await file.arrayBuffer()
    const decoder = new TextDecoder('shift_jis')
    const content = decoder.decode(arrayBuffer)
    console.log(`📄 File content loaded: ${content.length} characters`)

    // JLCデータパース
    const racers = parseJLCFile(content, file.name)
    const validRacers = racers.filter(validateRacerData)

    console.log(`📊 Parsed ${racers.length} records, ${validRacers.length} valid`)

    if (validRacers.length === 0) {
      return NextResponse.json(
        { error: 'No valid racer data found' },
        { status: 400 }
      )
    }

    // Supabaseに保存
    const supabase = createClient()
    const results = {
      inserted: 0,
      updated: 0,
      errors: 0,
      details: [] as string[]
    }

    for (const racer of validRacers) {
      try {
        // UPSERT（存在すれば更新、なければ挿入）
        const { error } = await supabase
          .from('racer_data')
          .upsert({
            racer_number: racer.racerNumber,
            racer_name: racer.racerName,
            racer_name_kana: racer.racerNameKana,
            branch: racer.branch,
            grade: racer.grade,
            period_year: racer.periodYear,
            period_half: racer.periodHalf,
            national_win_rate: racer.nationalWinRate,
            local_win_rate: racer.localWinRate,
            races_count: racer.racesCount,
            wins_count: racer.winsCount,
            average_st: racer.averageST,
            flying_count: racer.flyingCount,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'racer_number,period_year,period_half'
          })

        if (error) {
          console.error(`❌ Error saving racer ${racer.racerNumber}:`, error)
          results.errors++
          results.details.push(`Error: ${racer.racerNumber} - ${error.message}`)
        } else {
          results.inserted++
        }

      } catch (error) {
        console.error(`❌ Exception saving racer ${racer.racerNumber}:`, error)
        results.errors++
        results.details.push(`Exception: ${racer.racerNumber} - ${error}`)
      }
    }

    console.log(`✅ Import completed: ${results.inserted} saved, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      filename: file.name,
      summary: {
        totalRecords: racers.length,
        validRecords: validRacers.length,
        inserted: results.inserted,
        errors: results.errors
      },
      details: results.details.slice(0, 10), // 最初の10件のエラーのみ
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [Import Racer Data] Error:`, errorMessage)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}