-- ingest_logテーブル - データ取得履歴管理
-- Phase 1で自動取得の実行記録を管理

CREATE TABLE ingest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL, -- 'boatrace-open-api', 'manual', etc.
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  error_details TEXT,
  metadata JSONB, -- API詳細、実行時間など
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_ingest_log_run_at ON ingest_log (run_at DESC);
CREATE INDEX idx_ingest_log_source_status ON ingest_log (source, status);

-- 最新の取得状況を確認するビュー
CREATE OR REPLACE VIEW latest_ingest_status AS
SELECT DISTINCT ON (source)
  source,
  run_at,
  status,
  records_processed,
  records_inserted,
  error_details
FROM ingest_log
ORDER BY source, run_at DESC;