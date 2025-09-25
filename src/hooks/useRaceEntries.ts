import useSWR from 'swr'

interface RaceEntriesResponse {
  entries: Array<{
    lane: number
    player_name: string
    player_grade: string
    st_time: number
    exhibition_time: number
    motor_rate: number
    motor_condition: string
    motor_description: string
    // API側で計算済みのデータ
    motor_badge: {
      grade: '◎' | '○' | '△'
      color: string
      tooltip: string
    }
    grade_badge_color: string
    st_color: string
    exhibition_color: string
    two_rate: number
    three_rate: number
    // 外部リンクと画像用（データ取り込み用）
    photo_path?: string
    external_url?: string
  }>
  why_brief: {
    icons: string[]
    summary: string
  }
}

const fetcher = async (url: string): Promise<RaceEntriesResponse> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('エントリーデータの取得に失敗しました')
  }

  return response.json()
}

export function useRaceEntries(raceId: string, shouldFetch: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/race-entries?raceId=${raceId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30秒間は重複リクエストを防ぐ
      focusThrottleInterval: 60000, // フォーカス時の再検証を1分に制限
      errorRetryInterval: 5000, // エラー時の再試行間隔
      errorRetryCount: 3, // 最大3回まで再試行
    }
  )

  return {
    entriesData: data,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'エラーが発生しました') : null,
    mutate, // 手動でデータを再取得する場合に使用
  }
}