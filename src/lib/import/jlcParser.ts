/**
 * JLC選手期別成績データパーサー
 * 固定長テキストファイルから選手データを抽出
 */

export interface JLCRacerData {
  racerNumber: number
  racerName: string
  racerNameKana: string
  branch: string
  grade: string
  periodYear: number
  periodHalf: string
  nationalWinRate?: number
  localWinRate?: number
  racesCount?: number
  winsCount?: number
  averageST?: number
  flyingCount?: number
}

/**
 * JLCファイル名から期別情報を抽出
 */
export function parsePeriodFromFilename(filename: string): { year: number; half: string } {
  // fan2310.txt → 2024年前期
  // fan2404.txt → 2024年後期
  // fan2504.txt → 2025年前期
  // fan2410.txt → 2025年後期

  if (filename.includes('2310')) return { year: 2024, half: '前期' }
  if (filename.includes('2404')) return { year: 2024, half: '後期' }
  if (filename.includes('2504')) return { year: 2025, half: '前期' }
  if (filename.includes('2410')) return { year: 2025, half: '後期' }

  // デフォルト値
  return { year: 2025, half: '前期' }
}

/**
 * 固定長テキスト行から選手データを抽出
 * fan2504形式: 2538高　橋　　二　朗ﾀｶﾊｼ ｼﾞﾛｳ      東京B1S24042617616353AB...
 */
export function parseJLCLine(line: string, periodYear: number, periodHalf: string): JLCRacerData | null {
  try {
    // 最低限の長さチェック
    if (line.length < 40) return null

    // 選手登録番号（先頭4文字）
    const racerNumber = parseInt(line.substring(0, 4))
    if (isNaN(racerNumber)) return null

    // 選手名（漢字）- 位置4-16
    let racerName = line.substring(4, 16).trim()
    // 全角スペースを除去し、日本語文字のみ抽出
    racerName = racerName.replace(/[　\s]/g, '').replace(/[^\u4e00-\u9faf\u3040-\u309f]/g, '')

    // カタカナ名 - 位置16-28
    let racerNameKana = line.substring(16, 28).trim()

    // 支部名 - 位置28-31
    let branch = line.substring(28, 31).trim()
    branch = branch.replace(/[^\u4e00-\u9faf]/g, '') // 漢字のみ抽出

    // 級別 - 位置31-32
    let grade = line.substring(31, 32).trim()
    if (!['A1', 'A2', 'B1', 'B2'].includes(grade)) {
      // 他の位置で級別を探す
      const gradeMatch = line.substring(31, 50).match(/(A1|A2|B1|B2)/)
      grade = gradeMatch ? gradeMatch[1] : 'B1'
    }

    // 性別 - 位置32-33
    const gender = line.substring(32, 33).trim()

    return {
      racerNumber,
      racerName: racerName || `選手${racerNumber}`,
      racerNameKana: racerNameKana || '',
      branch: branch || '不明',
      grade,
      periodYear,
      periodHalf,
    }

  } catch (error) {
    console.error('Error parsing JLC line:', error)
    return null
  }
}

/**
 * JLCファイル全体をパース
 */
export function parseJLCFile(content: string, filename: string): JLCRacerData[] {
  const { year, half } = parsePeriodFromFilename(filename)
  const lines = content.split('\n')
  const results: JLCRacerData[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const racerData = parseJLCLine(line, year, half)
    if (racerData) {
      results.push(racerData)
    }
  }

  console.log(`Parsed ${results.length} racer records from ${filename}`)
  return results
}

/**
 * 選手データの基本検証
 */
export function validateRacerData(data: JLCRacerData): boolean {
  return (
    data.racerNumber > 0 &&
    data.racerNumber < 10000 &&
    data.racerName.length > 0 &&
    ['A1', 'A2', 'B1', 'B2'].includes(data.grade)
  )
}