'use client'

interface FixedFirstTabsProps {
  selectedLane: number | null
  onLaneSelect: (lane: number | null) => void
  loading?: boolean
}

export default function FixedFirstTabs({ selectedLane, onLaneSelect, loading }: FixedFirstTabsProps) {
  const lanes = [1, 2, 3, 4, 5, 6]

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 mb-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3">1着固定モード</h3>

      <div className="flex flex-wrap gap-2">
        {/* 全表示ボタン */}
        <button
          onClick={() => onLaneSelect(null)}
          disabled={loading}
          className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition flex items-center ${
            selectedLane === null
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          全表示
        </button>

        {/* 各レーンボタン */}
        {lanes.map((lane) => (
          <button
            key={lane}
            onClick={() => onLaneSelect(lane)}
            disabled={loading}
            className={`min-w-[44px] min-h-[44px] rounded-lg text-sm font-bold transition flex items-center justify-center ${
              selectedLane === lane
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {lane}
          </button>
        ))}
      </div>

      {/* 説明テキスト */}
      <div className="mt-2 text-xs text-gray-500">
        {selectedLane
          ? `${selectedLane}号艇を1着に固定した組み合わせを表示`
          : '全ての3連単組み合わせを期待値順で表示'
        }
      </div>

      {loading && (
        <div className="mt-2 text-sm text-blue-600 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          予想を再計算中...
        </div>
      )}
    </div>
  )
}