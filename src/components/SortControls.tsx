'use client'

interface SortControlsProps {
  sortBy: 'ev' | 'probability' | 'odds'
  sortOrder: 'desc' | 'asc'
  onSortChange: (sortBy: 'ev' | 'probability' | 'odds', sortOrder: 'desc' | 'asc') => void
  showLimit: number
  onShowLimitChange: (limit: number) => void
}

export default function SortControls({
  sortBy,
  sortOrder,
  onSortChange,
  showLimit,
  onShowLimitChange,
}: SortControlsProps) {
  const sortOptions = [
    { value: 'ev', label: 'EV値' },
    { value: 'probability', label: '確率' },
    { value: 'odds', label: 'オッズ' },
  ] as const

  const limitOptions = [3, 5, 10, 20]

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* ソート設定 */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">並び順:</span>

          <div className="flex items-center space-x-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value, sortBy === option.value && sortOrder === 'desc' ? 'asc' : 'desc')}
                className={`px-3 py-1 rounded text-xs font-medium transition flex items-center space-x-1 ${
                  sortBy === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <span className="text-xs">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 表示件数 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">表示:</span>
          <div className="flex items-center space-x-1">
            {limitOptions.map((limit) => (
              <button
                key={limit}
                onClick={() => onShowLimitChange(limit)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  showLimit === limit
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {limit}件
              </button>
            ))}
            <button
              onClick={() => onShowLimitChange(999)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                showLimit === 999
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              全て
            </button>
          </div>
        </div>
      </div>

      {/* 現在の設定表示 */}
      <div className="mt-2 text-xs text-gray-500">
        {sortOptions.find(opt => opt.value === sortBy)?.label}
        {sortOrder === 'desc' ? '降順' : '昇順'}で
        {showLimit === 999 ? '全件' : `上位${showLimit}件`}表示
      </div>
    </div>
  )
}