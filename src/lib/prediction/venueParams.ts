/**
 * 競艇場別特性パラメータ
 * 各場の特徴に基づいたコース別係数と重要度調整
 */

export interface VenueParams {
  venueId: number
  name: string
  coreFeature: string
  waterType: 'freshwater' | 'seawater' | 'brackish'
  courseMultiplier: [number, number, number, number, number, number] // 1-6コース
  weightAdjustment: {
    motor: number      // モーター重要度
    exhibition: number // 展示重要度
    start: number      // スタート重要度
    grade: number      // 級別重要度
    local: number      // 地元選手重要度
  }
  specialFeatures?: {
    elevation?: number
    unexpectedRate?: number
    crosswindRate?: number
    [key: string]: any
  }
}

/**
 * 6場の詳細パラメータ設定
 */
export const VENUE_PARAMS: Record<number, VenueParams> = {
  // 桐生（標高128m・赤城おろし・ダッシュ有利）
  1: {
    venueId: 1,
    name: '桐生',
    coreFeature: '低気圧+強風でダッシュ有利',
    waterType: 'freshwater',
    courseMultiplier: [0.9, 1.0, 1.1, 1.2, 1.2, 1.1], // ダッシュ勢有利
    weightAdjustment: {
      motor: 1.5,      // 低気圧でモーター性能重要
      exhibition: 1.4, // 気圧・風の影響チェック必須
      start: 1.3,      // 風でスタート重要
      grade: 1.2,      // 技術必要
      local: 1.4       // 地元が風・気圧に慣れている
    },
    specialFeatures: {
      elevation: 128,
      unexpectedRate: 19.3
    }
  },

  // 戸田（最狭107m・実は1コース強い！）
  2: {
    venueId: 2,
    name: '戸田',
    coreFeature: '最狭だが実は1コース強い（実データ29%）',
    waterType: 'freshwater',
    courseMultiplier: [1.1, 1.0, 1.1, 1.0, 1.0, 0.8], // 実データベース：平準化（この日は1=4=5>2=3>6）
    weightAdjustment: {
      motor: 1.4,      // モーターパワー重要
      exhibition: 1.3, // 展示での伸び足チェック重要
      start: 1.5,      // スタート力が生命線
      grade: 1.2,      // 技術も必要
      local: 1.1       // 地元やや有利
    },
    specialFeatures: {
      courseWidth: 107,
      actualData: {
        course1: 29, course2: 21, course3: 25,
        course4: 13, course5: 13, course6: 0
      }
    }
  },

  // びわこ（2020年改修・差し有利・中間整備）
  11: {
    venueId: 11,
    name: 'びわこ',
    coreFeature: '2020年改修でイン有利化+差し決着多い',
    waterType: 'freshwater',
    courseMultiplier: [1.3, 1.1, 1.0, 0.9, 0.8, 0.7], // 改修でイン有利
    weightAdjustment: {
      motor: 1.5,      // 中間整備で激変
      exhibition: 1.3, // 硬い水面での乗り心地
      start: 1.1,      // 標準
      grade: 1.1,      // 実力も重要
      local: 1.3       // 波・うねり対応
    },
    specialFeatures: {
      elevation: 84,
      courseRenovation: '2020年10月',
      shortToSecond: 70
    }
  },

  // 住之江（硬い水面・1コース強い）
  12: {
    venueId: 12,
    name: '住之江',
    coreFeature: '1コース強い（実データ46%）・4コースも意外に勝つ',
    waterType: 'freshwater',
    courseMultiplier: [1.3, 1.0, 0.9, 1.2, 0.8, 0.7], // 実データベース：1>2>4>3>5>6
    weightAdjustment: {
      motor: 1.2,      // モーター重要
      exhibition: 1.1, // 硬い水面での乗り心地
      start: 1.1,      // 総合力
      grade: 1.2,      // 実力重要
      local: 1.0       // 地元優位少ない
    },
    specialFeatures: {
      actualData: {
        course1: 46, course2: 21, course3: 13,
        course4: 17, course5: 4, course6: 0
      }
    }
  },

  // 尼崎（静水面・イン強い・実力勝負）
  13: {
    venueId: 13,
    name: '尼崎',
    coreFeature: '静水面のイン天国',
    waterType: 'freshwater',
    courseMultiplier: [1.5, 1.2, 1.0, 0.8, 0.7, 0.6], // イン強い
    weightAdjustment: {
      motor: 1.1,      // モーター標準
      exhibition: 1.0, // 静水面で標準
      start: 1.1,      // セオリー通り
      grade: 1.3,      // 実力が素直に出る
      local: 1.0       // 地元優位少ない
    }
  },

  // 福岡（汽水・左横風・3コース強い）
  22: {
    venueId: 22,
    name: '福岡',
    coreFeature: '汽水+左横風+潮の干満',
    waterType: 'brackish',
    courseMultiplier: [0.9, 1.0, 1.4, 1.2, 1.0, 0.8], // 3コース強い
    weightAdjustment: {
      motor: 1.3,      // 汽水でのモーター調整
      exhibition: 1.4, // 潮・風の影響チェック
      start: 1.1,      // 標準
      grade: 1.2,      // 技術重要
      local: 1.5       // 汽水・潮・風への対応
    },
    specialFeatures: {
      crosswindRate: 60,
      springCrosswind: 73
    }
  }
}

/**
 * 競艇場のパラメータを取得
 * @param venueId 競艇場ID
 * @returns 競艇場パラメータ（存在しない場合はデフォルト）
 */
export function getVenueParams(venueId: number): VenueParams {
  return VENUE_PARAMS[venueId] || {
    venueId,
    name: `競艇場${venueId}`,
    coreFeature: '標準的な競艇場',
    waterType: 'freshwater',
    courseMultiplier: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // 標準
    weightAdjustment: {
      motor: 1.0,
      exhibition: 1.0,
      start: 1.0,
      grade: 1.0,
      local: 1.0
    }
  }
}

/**
 * コース別係数を取得
 * @param venueId 競艇場ID
 * @param course コース番号（1-6）
 * @returns コース係数
 */
export function getCourseMultiplier(venueId: number, course: number): number {
  const params = getVenueParams(venueId)
  const index = course - 1 // 1-6 → 0-5
  if (index < 0 || index >= 6) return 1.0
  return params.courseMultiplier[index]
}

/**
 * 要素別重要度を取得
 * @param venueId 競艇場ID
 * @param element 要素名
 * @returns 重要度係数
 */
export function getWeightAdjustment(venueId: number, element: keyof VenueParams['weightAdjustment']): number {
  const params = getVenueParams(venueId)
  return params.weightAdjustment[element] || 1.0
}