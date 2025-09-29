/**
 * 競艇場の番号マッピング
 * Programs API と Results API で異なる番号体系を使用している可能性があるため、
 * 実証実験を通じてマッピング表を作成
 */

export interface StadiumInfo {
  id: number;           // 一般的な競艇場ID (1-24)
  name: string;         // 会場名
  fullName: string;     // 正式名称
  programsApiId?: number; // Programs APIでの番号 (実測値)
  resultsApiId?: number;  // Results APIでの番号
  location: string;     // 所在地
  isTestTarget?: boolean; // 実証実験対象
}

export const STADIUM_INFO: Record<number, StadiumInfo> = {
  1: {
    id: 1, name: '桐生', fullName: '桐生競艇場',
    resultsApiId: 1, location: '群馬県',
  },
  2: {
    id: 2, name: '戸田', fullName: '戸田競艇場',
    resultsApiId: 2, location: '埼玉県',
    programsApiId: 2, // 実測：昨日のAPIで確認済み
    isTestTarget: true
  },
  3: {
    id: 3, name: '江戸川', fullName: '江戸川競艇場',
    resultsApiId: 3, location: '東京都',
  },
  4: {
    id: 4, name: '平和島', fullName: '平和島競艇場',
    resultsApiId: 4, location: '東京都',
  },
  5: {
    id: 5, name: '多摩川', fullName: '多摩川競艇場',
    resultsApiId: 5, location: '東京都',
  },
  6: {
    id: 6, name: '浜名湖', fullName: '浜名湖競艇場',
    resultsApiId: 6, location: '静岡県',
  },
  7: {
    id: 7, name: '蒲郡', fullName: '蒲郡競艇場',
    resultsApiId: 7, location: '愛知県',
  },
  8: {
    id: 8, name: '常滑', fullName: '常滑競艇場',
    resultsApiId: 8, location: '愛知県',
  },
  9: {
    id: 9, name: '津', fullName: '津競艇場',
    resultsApiId: 9, location: '三重県',
  },
  10: {
    id: 10, name: '三国', fullName: '三国競艇場',
    resultsApiId: 10, location: '福井県',
  },
  11: {
    id: 11, name: 'びわこ', fullName: 'びわこ競艇場',
    resultsApiId: 11, location: '滋賀県',
    programsApiId: 2, // 実測：昨日のAPIで確認済み（戸田と同じ番号）
    isTestTarget: true
  },
  12: {
    id: 12, name: '住之江', fullName: '住之江競艇場',
    resultsApiId: 12, location: '大阪府',
    programsApiId: 3, // 実測：昨日のAPIで確認済み
    isTestTarget: true
  },
  13: {
    id: 13, name: '尼崎', fullName: '尼崎競艇場',
    resultsApiId: 13, location: '兵庫県',
    // programsApiId: 未確認 - APIに出現せず
    isTestTarget: true
  },
  14: {
    id: 14, name: '鳴門', fullName: '鳴門競艇場',
    resultsApiId: 14, location: '徳島県',
  },
  15: {
    id: 15, name: '丸亀', fullName: '丸亀競艇場',
    resultsApiId: 15, location: '香川県',
  },
  16: {
    id: 16, name: '児島', fullName: '児島競艇場',
    resultsApiId: 16, location: '岡山県',
  },
  17: {
    id: 17, name: '宮島', fullName: '宮島競艇場',
    resultsApiId: 17, location: '広島県',
  },
  18: {
    id: 18, name: '徳山', fullName: '徳山競艇場',
    resultsApiId: 18, location: '山口県',
  },
  19: {
    id: 19, name: '下関', fullName: '下関競艇場',
    resultsApiId: 19, location: '山口県',
  },
  20: {
    id: 20, name: '若松', fullName: '若松競艇場',
    resultsApiId: 20, location: '福岡県',
  },
  21: {
    id: 21, name: '芦屋', fullName: '芦屋競艇場',
    resultsApiId: 21, location: '福岡県',
  },
  22: {
    id: 22, name: '福岡', fullName: '福岡競艇場',
    resultsApiId: 22, location: '福岡県',
  },
  23: {
    id: 23, name: '唐津', fullName: '唐津競艇場',
    resultsApiId: 23, location: '佐賀県',
  },
  24: {
    id: 24, name: '大村', fullName: '大村競艇場',
    resultsApiId: 24, location: '長崎県',
  },
}

/**
 * 実証実験対象の会場を取得
 */
export function getTestTargetStadiums(): StadiumInfo[] {
  return Object.values(STADIUM_INFO).filter(stadium => stadium.isTestTarget)
}

/**
 * Programs APIのstadium番号から会場情報を取得
 */
export function getStadiumByProgramsApiId(programsApiId: number): StadiumInfo | undefined {
  return Object.values(STADIUM_INFO).find(stadium => stadium.programsApiId === programsApiId)
}

/**
 * Results APIのstadium番号から会場情報を取得
 */
export function getStadiumByResultsApiId(resultsApiId: number): StadiumInfo | undefined {
  return Object.values(STADIUM_INFO).find(stadium => stadium.resultsApiId === resultsApiId)
}

/**
 * 会場名から会場情報を取得
 */
export function getStadiumByName(name: string): StadiumInfo | undefined {
  return Object.values(STADIUM_INFO).find(stadium =>
    stadium.name === name || stadium.fullName === name
  )
}

/**
 * 実証実験の進捗レポート用
 */
export interface ApiMappingStatus {
  stadiumId: number
  stadiumName: string
  programsApiId?: number
  resultsApiId?: number
  lastChecked?: string
  dataAvailable?: boolean
  raceCount?: number
  status: 'confirmed' | 'pending' | 'unavailable' | 'error'
}

export function getApiMappingStatus(): ApiMappingStatus[] {
  return getTestTargetStadiums().map(stadium => ({
    stadiumId: stadium.id,
    stadiumName: stadium.name,
    programsApiId: stadium.programsApiId,
    resultsApiId: stadium.resultsApiId,
    status: stadium.programsApiId ? 'confirmed' : 'pending'
  }))
}