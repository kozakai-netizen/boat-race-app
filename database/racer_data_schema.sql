-- 選手データテーブル（JLC期別成績統合用）
CREATE TABLE IF NOT EXISTS racer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  racer_number INTEGER NOT NULL,           -- 選手登録番号
  racer_name TEXT NOT NULL,                -- 選手名（漢字）
  racer_name_kana TEXT,                    -- 選手名（カタカナ）
  branch TEXT,                             -- 所属支部
  grade TEXT NOT NULL,                     -- 級別（A1, A2, B1, B2）

  -- 期別情報
  period_year INTEGER NOT NULL,            -- 年（2024, 2025）
  period_half TEXT NOT NULL,               -- 期（前期, 後期）

  -- 成績データ（JLCファイルから抽出）
  national_win_rate DECIMAL(4,2),          -- 全国勝率
  local_win_rate DECIMAL(4,2),             -- 当地勝率
  races_count INTEGER,                     -- 出走回数
  wins_count INTEGER,                      -- 1着回数
  second_place_count INTEGER,              -- 2着回数
  third_place_count INTEGER,               -- 3着回数

  -- ST・展示データ
  average_st DECIMAL(4,3),                 -- 平均ST
  exhibition_avg DECIMAL(5,2),             -- 展示平均タイム

  -- フライング・出遅れ
  flying_count INTEGER DEFAULT 0,          -- F回数
  late_start_count INTEGER DEFAULT 0,      -- L回数

  -- 決まり手データ
  nige_count INTEGER DEFAULT 0,            -- 逃げ回数
  sashi_count INTEGER DEFAULT 0,           -- 差し回数
  makuri_count INTEGER DEFAULT 0,          -- まくり回数
  makurisashi_count INTEGER DEFAULT 0,     -- まくり差し回数

  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約
  UNIQUE(racer_number, period_year, period_half),
  CHECK (grade IN ('A1', 'A2', 'B1', 'B2')),
  CHECK (period_half IN ('前期', '後期'))
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_racer_data_number ON racer_data(racer_number);
CREATE INDEX IF NOT EXISTS idx_racer_data_period ON racer_data(period_year, period_half);
CREATE INDEX IF NOT EXISTS idx_racer_data_grade ON racer_data(grade);
CREATE INDEX IF NOT EXISTS idx_racer_data_branch ON racer_data(branch);

-- 最新期別成績ビュー
CREATE OR REPLACE VIEW latest_racer_data AS
SELECT DISTINCT ON (racer_number)
  racer_number,
  racer_name,
  racer_name_kana,
  branch,
  grade,
  national_win_rate,
  local_win_rate,
  races_count,
  wins_count,
  average_st,
  flying_count,
  period_year,
  period_half
FROM racer_data
ORDER BY racer_number, period_year DESC,
         CASE WHEN period_half = '後期' THEN 2 ELSE 1 END DESC;