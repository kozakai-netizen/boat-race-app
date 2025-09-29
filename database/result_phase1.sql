-- Phase 1用 簡素化されたresultテーブル
-- 外部キー制約なしで結果データのみを格納

-- 既存のresultテーブルを削除（存在する場合）
DROP TABLE IF EXISTS result CASCADE;

-- Phase 1用のresultテーブル（外部キー制約なし）
CREATE TABLE result (
  race_id TEXT PRIMARY KEY,
  triple TEXT NOT NULL, -- "2-3-1"
  payout INTEGER,
  popularity INTEGER,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_result_race_id ON result (race_id);
CREATE INDEX idx_result_settled_at ON result (settled_at DESC);

-- Phase 1では外部キー制約は設定しない
-- 将来的にはraceテーブルとの外部キー制約を追加予定