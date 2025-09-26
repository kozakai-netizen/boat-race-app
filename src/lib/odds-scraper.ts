/**
 * リアルタイムオッズ取得機能
 * 2025年公式API終了後のオッズ情報取得
 */

// オッズデータの型定義
export interface OddsData {
  race_id: string
  combo: string
  odds: number
  updated_at: string
}

// スクレイピング設定
export interface ScrapingConfig {
  venue: string
  date: string
  raceNo: number
  interval: number // 更新間隔（秒）
}

/**
 * 住之江競艇場のオッズデータ取得（模擬実装）
 * 実際の実装では適切なエンドポイントまたはスクレイピングを使用
 */
export async function fetchOddsData(config: ScrapingConfig): Promise<{
  success: boolean
  data: OddsData[]
  message: string
}> {
  try {
    // 公式API終了のため、現在はモックデータを返す
    // 実装時は以下のような手法を検討：
    // 1. 公式サイトのスクレイピング（利用規約要確認）
    // 2. サードパーティAPI (team-nave等)
    // 3. 手動データ入力機能

    const mockOdds: OddsData[] = generateMockOdds(config.raceNo)

    return {
      success: true,
      data: mockOdds,
      message: `${mockOdds.length}件のオッズデータを取得しました`
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `オッズ取得エラー: ${error}`
    }
  }
}

/**
 * モックオッズデータの生成
 */
function generateMockOdds(raceNo: number): OddsData[] {
  const combos = [
    '1-2-3', '1-2-4', '1-2-5', '1-2-6',
    '1-3-2', '1-3-4', '1-3-5', '1-3-6',
    '2-1-3', '2-1-4', '2-1-5', '2-1-6',
    '2-3-1', '2-3-4', '2-3-5', '2-3-6',
    '3-1-2', '3-1-4', '3-1-5', '3-1-6',
    '3-2-1', '3-2-4', '3-2-5', '3-2-6'
  ]

  return combos.map((combo, index) => ({
    race_id: `suminoe-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${raceNo}R`,
    combo,
    odds: Math.round((Math.random() * 50 + 5) * 10) / 10, // 5.0～55.0の範囲
    updated_at: new Date().toISOString()
  }))
}

/**
 * オッズデータのリアルタイム更新
 */
export class OddsWatcher {
  private config: ScrapingConfig
  private intervalId: NodeJS.Timeout | null = null
  private callback: (data: OddsData[]) => void
  private isRunning = false

  constructor(config: ScrapingConfig, callback: (data: OddsData[]) => void) {
    this.config = config
    this.callback = callback
  }

  /**
   * オッズ監視を開始
   */
  start(): void {
    if (this.isRunning) {
      console.warn('オッズ監視は既に実行中です')
      return
    }

    this.isRunning = true
    console.log(`オッズ監視開始: ${this.config.venue} ${this.config.date} ${this.config.raceNo}R`)

    // 即座に初回データを取得
    this.fetchAndUpdate()

    // 定期更新を設定
    this.intervalId = setInterval(() => {
      this.fetchAndUpdate()
    }, this.config.interval * 1000)
  }

  /**
   * オッズ監視を停止
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('オッズ監視は実行されていません')
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('オッズ監視を停止しました')
  }

  /**
   * 監視状態を取得
   */
  isActive(): boolean {
    return this.isRunning
  }

  /**
   * オッズデータを取得してコールバックを実行
   */
  private async fetchAndUpdate(): Promise<void> {
    try {
      const result = await fetchOddsData(this.config)
      if (result.success) {
        this.callback(result.data)
      } else {
        console.error('オッズ取得エラー:', result.message)
      }
    } catch (error) {
      console.error('オッズ更新エラー:', error)
    }
  }
}

/**
 * オッズデータのCSVエクスポート
 */
export function exportOddsToCSV(oddsData: OddsData[], filename: string = 'odds_data.csv'): void {
  const headers = ['race_id', 'combo', 'odds', 'updated_at']
  const csvRows = [
    headers.join(','),
    ...oddsData.map(row =>
      [row.race_id, row.combo, row.odds, row.updated_at].join(',')
    )
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * オッズ変化の検知
 */
export function compareOdds(oldOdds: OddsData[], newOdds: OddsData[]): {
  changes: Array<{
    combo: string
    oldOdds: number
    newOdds: number
    change: number
    changePercent: number
  }>
  summary: {
    totalChanges: number
    averageChange: number
    maxIncrease: number
    maxDecrease: number
  }
} {
  const changes: Array<{
    combo: string
    oldOdds: number
    newOdds: number
    change: number
    changePercent: number
  }> = []

  const oldOddsMap = new Map(oldOdds.map(o => [o.combo, o.odds]))

  newOdds.forEach(newData => {
    const oldValue = oldOddsMap.get(newData.combo)
    if (oldValue !== undefined && oldValue !== newData.odds) {
      const change = newData.odds - oldValue
      const changePercent = (change / oldValue) * 100

      changes.push({
        combo: newData.combo,
        oldOdds: oldValue,
        newOdds: newData.odds,
        change,
        changePercent
      })
    }
  })

  const summary = {
    totalChanges: changes.length,
    averageChange: changes.length > 0 ? changes.reduce((sum, c) => sum + c.change, 0) / changes.length : 0,
    maxIncrease: changes.length > 0 ? Math.max(...changes.map(c => c.change)) : 0,
    maxDecrease: changes.length > 0 ? Math.min(...changes.map(c => c.change)) : 0
  }

  return { changes, summary }
}