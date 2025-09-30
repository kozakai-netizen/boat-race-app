import fs from 'fs'
import { parseJLCFile, validateRacerData } from './jlcParser'

/**
 * JLCパーサーのテスト実行
 */
export function testJLCParser() {
  const testFile = '/Users/dw1005/Downloads/fan2310.txt'

  try {
    // ファイル読み込み
    const content = fs.readFileSync(testFile, 'utf-8')
    console.log(`File loaded: ${content.length} characters`)

    // パース実行
    const racers = parseJLCFile(content, 'fan2310.txt')
    console.log(`Parsed ${racers.length} racers`)

    // 最初の10件をサンプル表示
    console.log('\n=== Sample Data ===')
    racers.slice(0, 10).forEach((racer, index) => {
      console.log(`${index + 1}. ${racer.racerNumber} ${racer.racerName} (${racer.racerNameKana}) ${racer.branch} ${racer.grade}`)
    })

    // バリデーション結果
    const validRacers = racers.filter(validateRacerData)
    console.log(`\nValidation: ${validRacers.length}/${racers.length} valid records`)

    return { total: racers.length, valid: validRacers.length, racers: validRacers }

  } catch (error) {
    console.error('Test failed:', error)
    return null
  }
}