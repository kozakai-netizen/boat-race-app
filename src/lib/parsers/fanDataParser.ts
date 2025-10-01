/**
 * FAN競艇選手データファイルパーサー
 * ファイル形式: 固定長417文字/行、Shift-JIS
 */

export interface RacerMasterData {
  registration_number: string      // 登録番号 (4桁)
  name_kanji: string              // 漢字氏名
  name_kana: string               // カナ氏名
  branch: string                  // 支部
  class: 'A1' | 'A2' | 'B1' | 'B2' // 級別
  gender: 'M' | 'F'               // 性別 (S=男性, L=女性と推定)
  birth_date: string              // 生年月日 (YYYY-MM-DD形式)
  height: number | null           // 身長
  weight: number | null           // 体重
  win_rate: number | null         // 勝率
  quinella_rate: number | null    // 連対率
  trio_rate: number | null        // 3連対率
  avg_st: number | null           // 平均ST
  raw_data: string               // 元データ（デバッグ用）
}

/**
 * 昭和年を西暦年に変換
 */
function convertShowaToGregorian(showaYear: number): number {
  return showaYear + 1925 // 昭和1年 = 1926年
}

/**
 * 6桁の日付文字列を解析（例: "220307" → "1947-03-07"）
 */
function parseBirthDate(dateStr: string): string {
  try {
    if (dateStr.length !== 6) return ''

    const showaYear = parseInt(dateStr.substring(0, 2))
    const month = parseInt(dateStr.substring(2, 4))
    const day = parseInt(dateStr.substring(4, 6))

    const gregorianYear = convertShowaToGregorian(showaYear)

    return `${gregorianYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}

/**
 * 数値フィールドを解析（ゼロパディングされた数値）
 */
function parseNumericField(field: string, divisor: number = 1): number | null {
  try {
    const trimmed = field.trim()
    if (!trimmed || trimmed === '0'.repeat(trimmed.length)) return null

    const value = parseInt(trimmed)
    return isNaN(value) ? null : value / divisor
  } catch {
    return null
  }
}

/**
 * 1行の選手データを解析
 * 構造: "2014高　塚　　清　一ﾀｶﾂｶ ｾｲｲﾁ      静岡B1S22030717716454O ..."
 */
export function parseRacerRecord(line: string): RacerMasterData | null {
  try {
    if (line.length < 100) return null

    // 登録番号 (4文字)
    const registration_number = line.substring(0, 4).trim()

    // 漢字氏名を抽出（4文字目から）
    // "高　塚　　清　一" の部分を特定
    let nameEndPos = 4
    let kanjiName = ''

    // 漢字部分の終わりを探す（カタカナが始まるまで）
    for (let i = 4; i < line.length && i < 25; i++) {
      const char = line[i]
      // カタカナかどうかチェック（ﾀｶﾂｶの開始）
      if (char >= 'ｦ' && char <= 'ﾟ') {
        nameEndPos = i
        break
      }
      kanjiName += char
    }

    const name_kanji = kanjiName.trim()

    // カナ氏名を抽出（半角カタカナ部分）
    let kanaName = ''
    let kanaEndPos = nameEndPos

    for (let i = nameEndPos; i < line.length && i < 40; i++) {
      const char = line[i]
      if ((char >= 'ｦ' && char <= 'ﾟ') || char === ' ') {
        kanaName += char
      } else if (kanaName.trim().length > 0) {
        kanaEndPos = i
        break
      }
    }

    const name_kana = kanaName.trim()

    // 支部を探す（日本語の地名）
    let branchStartPos = kanaEndPos
    while (branchStartPos < line.length && line[branchStartPos] === ' ') {
      branchStartPos++
    }

    // 支部名を抽出（ひらがな・漢字）
    let branch = ''
    for (let i = branchStartPos; i < line.length && i < branchStartPos + 10; i++) {
      const char = line[i]
      if ((char >= 'あ' && char <= 'ん') || (char >= 'ア' && char <= 'ン') ||
          (char >= '一' && char <= '龯') || char === '県' || char === '府' || char === '都') {
        branch += char
      } else if (branch.length > 0) {
        break
      }
    }

    // 級別を探す（B1, A1など）
    const classMatch = line.match(/([AB][12])/);
    const class_str = classMatch ? classMatch[1] as 'A1' | 'A2' | 'B1' | 'B2' : 'B1'

    // 性別（Sの次の文字）
    const genderMatch = line.match(/[AB][12]([SL])/);
    const gender: 'M' | 'F' = genderMatch && genderMatch[1] === 'L' ? 'F' : 'M'

    // 生年月日（6桁の数字）
    const birthMatch = line.match(/[AB][12][SL](\d{6})/);
    const birth_date = birthMatch ? parseBirthDate(birthMatch[1]) : ''

    // 身長・体重・成績は後の数値部分から推定
    // とりあえず基本データのみ設定
    const height = null
    const weight = null
    const win_rate = null
    const quinella_rate = null
    const trio_rate = null
    const avg_st = null

    return {
      registration_number,
      name_kanji,
      name_kana,
      branch,
      class: class_str,
      gender,
      birth_date,
      height,
      weight,
      win_rate,
      quinella_rate,
      trio_rate,
      avg_st,
      raw_data: line
    }

  } catch (error) {
    console.error('Error parsing racer record:', error)
    return null
  }
}

/**
 * ファイル全体を解析
 */
export async function parseFanDataFile(filePath: string): Promise<RacerMasterData[]> {
  try {
    const fs = await import('fs')
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim().length > 0)

    const racers: RacerMasterData[] = []

    for (const line of lines) {
      const racer = parseRacerRecord(line)
      if (racer) {
        racers.push(racer)
      }
    }

    console.log(`🏁 Parsed ${racers.length} racers from ${lines.length} lines`)
    return racers

  } catch (error) {
    console.error('Error parsing FAN data file:', error)
    throw error
  }
}