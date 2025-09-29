# 住之江競艇予想システム - プロジェクト文書

## 1. プロジェクト概要

### システム名
**住之江競艇予想システム**

### 目的
- 身内10名利用のAI競艇予想ツール
- 住之江競艇場を主軸とした予想精度向上
- リアルタイムデータとAI分析による的中率向上

### 現在のフェーズ
**Phase 1+: Programs API統合完了**
- ✅ Boatrace Open APIからの結果データ取得システム完了
- ✅ Programs APIからの選手データ取得システム完了
- ✅ リアルタイムデータ統合・MockからAPIへの移行完了
- ✅ 安全なAPI認証・エラーハンドリングシステム完了
- ✅ データベース正規化・ログ機能完了

---

## 2. 技術スタック詳細

### フロントエンド技術
- **Next.js 15.5.3** (App Router + Turbopack)
- **React 18** + **TypeScript**
- **Tailwind CSS** (カスタムデザインシステム)
  - ink-*, surface-*, brand-* カラーパレット
  - mobile-first レスポンシブデザイン
- **Framer Motion** (アニメーション)
- **Heroicons React** (アイコンライブラリ)

### バックエンド技術
- **Next.js API Routes**
- **Supabase** (BaaS)
  - PostgreSQL データベース
  - リアルタイム機能（将来拡張予定）
- **Boatrace Open API** (外部データソース)

### データベース構成
```sql
-- Phase 1+ 拡張構成（Programs API統合完了）
result (
  race_id TEXT PRIMARY KEY,     -- "2025-07-15-01-12"
  triple TEXT NOT NULL,         -- "1-3-5"
  payout INTEGER,               -- 3連単払戻金
  popularity INTEGER,           -- 人気順位
  settled_at TIMESTAMPTZ        -- 確定時刻
)

-- Programs API統合用テーブル（新規追加）
racer_entries (
  id UUID PRIMARY KEY,
  race_id TEXT NOT NULL,        -- "2025-09-29-12-01"
  venue_id INTEGER NOT NULL,    -- 標準会場番号 (1-24)
  race_date DATE NOT NULL,      -- レース日
  race_no INTEGER NOT NULL,     -- レース番号
  pit INTEGER NOT NULL,         -- 艇番 (1-6)
  racer_registration_number INTEGER NOT NULL,
  racer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(race_id, pit)
)

programs_ingest_log (
  id UUID PRIMARY KEY,
  target_date DATE NOT NULL,
  venue_id INTEGER,
  status TEXT NOT NULL,         -- 'success'|'partial'|'failed'
  stadiums_processed INTEGER,
  races_processed INTEGER,
  entries_inserted INTEGER,
  data_source TEXT,            -- 'programs_api'|'mock_data'
  metadata JSONB
)

ingest_log (
  id UUID PRIMARY KEY,
  run_at TIMESTAMPTZ,
  source TEXT,                  -- 'boatrace-open-api'
  status TEXT,                  -- 'success'|'partial'|'failed'
  records_processed INTEGER,
  records_inserted INTEGER,
  records_updated INTEGER,
  error_details TEXT,
  metadata JSONB
)
```

### デプロイ環境
- **本番**: Netlify (https://boat-race-app.netlify.app)
- **開発**: ローカル (localhost:3007)
- **将来**: Vercel (Cron Jobs利用予定)

---

## 3. 現在の実装状況

### 完了機能一覧

#### ✅ UI/UX改善 (100%)
- **視覚階層改善**: Geminiの提案を基にしたカード式デザイン
- **レスポンシブ対応**: デスクトップ2カラム、モバイル1カラム
- **ハンバーガーメニュー**: 全ページ統一、framer-motion使用
- **コンポーネント統合**: RaceHeader + 1着固定モード
- **パフォーマンス最適化**: React.memo、並列データ取得

#### ✅ データ取得システム (100%)
- **Boatrace Open API統合**: v2エンドポイント対応
- **Programs API統合**: 選手データリアルタイム取得完了
- **24競艇場対応**: 管理画面で全会場選択可能
- **手動データ取得**: 管理画面 `/admin/import`
- **実験システム**: `/admin/experiment` で安全な検証環境
- **エラーハンドリング**: APIエラー、DB制約エラー対応
- **データ正規化**: 着順計算、払戻金取得、選手情報統合

#### ✅ Programs API統合システム (100% - NEW!)
- **安全なAPI認証**: 管理者トークン、レート制限
- **Stadium番号マッピング**: 戸田・住之江確認済み
- **リアルデータ統合**: MockからAPIへの完全移行
- **データベース正規化**: racer_entries、programs_ingest_log
- **フォールバックシステム**: API障害時の自動切り替え
- **実証実験システム**: 14日間データ収集・分析完了

#### ✅ データベース基盤 (100%)
- **Phase 1+拡張**: Programs API統合テーブル追加
- **Row Level Security**: セキュリティポリシー適用
- **ログ機能**: ingest_log + programs_ingest_log
- **Supabase統合**: 完全型安全、エラーハンドリング

#### ✅ 管理機能 (100%)
- **データ取得管理画面**: 競艇場・日付選択
- **Programs API管理**: `/api/programs` エンドポイント
- **実験管理画面**: リアルタイム進捗、詳細分析
- **取得結果表示**: 件数、エラー詳細、ソース表示
- **使用方法ガイド**: ユーザー向け説明

### 未実装機能

#### 🔄 自動化システム
- **Vercel Cron Jobs**: 毎日深夜2時の自動実行
- **スケジューラー**: 複数会場の順次取得
- **エラー通知**: 取得失敗時のアラート

#### 🔄 UI機能拡張
- **全競艇場対応**: メイン画面での会場切り替え
- **データ表示**: 取得済み結果の閲覧機能
- **フィルタリング**: 日付・会場別表示

#### 🔄 Phase 2 以降
- **AI予想エンジン**: GPT/Claude統合
- **選手データ**: 成績・特性情報
- **オッズ統合**: リアルタイムオッズ取得

### 既知の課題・制約事項

#### ⚠️ データベース制約
- **外部キー制約削除**: Phase 1簡素化のため
- **正規化不足**: 将来的なリファクタリング必要

#### ⚠️ API制約
- **レート制限**: 過度な連続リクエスト注意
- **データ遅延**: APIの更新タイミング依存

#### ⚠️ スケーラビリティ
- **Supabase制限**: 無料プランの容量制限
- **Netlify制限**: 関数実行時間制限

---

## 4. 開発経緯・判断理由

### 主要な技術選択の背景

#### Next.js 15.5.3 + Turbopack
**選択理由**:
- React Server Components対応
- 高速な開発体験
- Vercel統合の容易さ

#### Supabase
**選択理由**:
- PostgreSQL互換の高機能DB
- リアルタイム機能
- 認証・セキュリティ機能内蔵
- 無料プランでの十分な容量

#### Boatrace Open API
**選択理由**:
- 公式データの信頼性
- 完全無料でのアクセス
- JSON形式の扱いやすさ

### 却下した代替案とその理由

#### スクレイピング手法
**却下理由**:
- 法的リスク
- メンテナンス負荷
- サイト変更への脆弱性

#### Firebase
**却下理由**:
- PostgreSQL非対応
- コスト面での劣位
- 複雑なクエリ制限

### ステークホルダーとの合意事項

#### 開発方針
- **段階的実装**: Phase分割での確実な進行
- **並行実行**: UI改善と機能実装の同時進行
- **品質重視**: エラーハンドリングの徹底

#### 技術選択
- **モダン技術**: TypeScript、React Server Components採用
- **レスポンシブ**: モバイルファーストデザイン
- **パフォーマンス**: Core Web Vitals最適化

---

## 5. データ管理戦略

### 現在のデータ構造

#### レース結果データ
```typescript
interface NormalizedResult {
  race_id: string        // '2025-07-15-01-12'
  date: string           // '2025-07-15'
  race_no: number        // 1-12
  finish: [number, number, number]  // [1,3,5]
  payout: number         // 12690
  popularity: number | null
  closed_at?: string
}
```

#### API統合パターン
```typescript
// Adapter Pattern採用
fetchFromOpenApi(params: IngestParams): Promise<IngestResult>
processIngestResult(ingestResult: IngestResult): Promise<UpsertResult>
```

### リアルデータ統合計画

#### Phase 1 (完了)
- ✅ 結果データ取得・保存
- ✅ 手動実行機能
- ✅ エラーハンドリング

#### Phase 2 (予定)
- 🔄 自動実行システム
- 🔄 選手データ統合
- 🔄 オッズデータ統合

### データソース候補と課題

#### Boatrace Open API (採用)
**メリット**: 公式、無料、安定
**制限**: 結果データのみ、リアルタイム性なし

#### 公式サイトAPI (検討中)
**メリット**: リアルタイム性
**制限**: 認証必要、レート制限厳しい

---

## 6. 今後の開発計画

### Phase 1実装内容 (完了)

#### ✅ データ取得システム
- Boatrace Open API統合
- 24競艇場対応
- 手動実行機能
- エラーハンドリング
- データベース保存

### Phase 2実装予定 (次期)

#### 🎯 自動化システム
- **Vercel Cron Jobs**: 深夜2時自動実行
- **複数会場対応**: 順次データ取得
- **エラー監視**: 失敗時の通知機能

#### 🎯 UI機能拡張
- **全競艇場対応**: メイン画面での会場選択
- **データ表示機能**: 保存済み結果の表示
- **検索・フィルタ**: 日付・会場での絞り込み

### Phase 3以降の拡張予定

#### 🚀 AI予想エンジン
- **GPT/Claude統合**: 結果分析・予想生成
- **機械学習**: 過去データによる学習
- **予想精度測定**: 的中率追跡

#### 🚀 高度なデータ統合
- **選手情報**: 成績・特性・コンディション
- **天候データ**: 風向・波高・気温
- **オッズ情報**: リアルタイム倍率

### 想定リスクと対策

#### 技術リスク
**API変更**: Adapter Patternによる影響局所化
**DB容量**: Supabase有料プラン移行検討
**パフォーマンス**: CDN・キャッシュ戦略

#### 運用リスク
**メンテナンス**: 自動化による手動作業削減
**データ欠損**: 複数ソースでのバックアップ
**セキュリティ**: 環境変数・認証強化

---

## 7. 重要なファイル構成

### 核心コンポーネント
```
src/
├── app/
│   ├── admin/
│   │   ├── import/page.tsx             # データ取得管理画面
│   │   └── experiment/page.tsx         # Programs API実験システム
│   ├── api/
│   │   ├── programs/route.ts           # Programs API統合エンドポイント
│   │   ├── race-entries/route.ts       # リアルデータ対応済み
│   │   └── cron/daily-ingest/route.ts  # 自動・手動実行API
│   └── race/[id]/page.tsx              # 改善されたレース詳細
├── components/
│   ├── HamburgerMenu.tsx               # 統一メニューシステム
│   ├── ImprovedRaceCard.tsx            # Gemini提案のカード
│   └── RaceEntries.tsx                 # リアルデータ統合完了
├── lib/
│   ├── data/
│   │   ├── boatraceOpenApi.ts          # Results API統合
│   │   └── stadiumMapping.ts           # 会場番号マッピング
│   ├── experiment/
│   │   └── programsApiExperiment.ts    # 実証実験システム
│   ├── ingest/
│   │   ├── adapters/openapi.ts         # Adapter Pattern
│   │   └── upserter.ts                 # DB保存ロジック
│   └── supabase.ts                     # DB接続・型定義・createClient
├── types/
│   └── programs.ts                     # Programs API型定義
└── database/
    ├── schema.sql                      # 完全スキーマ（将来用）
    ├── result_phase1.sql               # Phase 1用スキーマ
    ├── programs_schema.sql             # Programs API統合スキーマ
    └── ingest_log.sql                  # ログテーブル
```

### 環境設定
```
.env.local:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_TOKEN=boat_admin_2025
NEXT_PUBLIC_DATA_MODE=demo
CRON_SECRET=
```

---

## 8. 復元手順

### 開発環境構築
```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# Supabase認証情報を設定

# 3. データベーススキーマ適用
# Supabase SQL Editorで以下を実行:
# - database/result_phase1.sql
# - database/ingest_log.sql

# 4. 開発サーバー起動
npm run dev
```

### Supabaseプロジェクト復元
1. **新プロジェクト作成**: kozakai-netizen's Org
2. **スキーマ適用**: result_phase1.sql + ingest_log.sql
3. **環境変数更新**: URL・APIキー設定
4. **接続テスト**: /admin/import でデータ取得確認

### Netlifyデプロイ復元
1. **リポジトリ接続**: GitHub連携
2. **ビルド設定**: `npm run build`
3. **環境変数**: Supabase認証情報設定
4. **デプロイ確認**: 本番環境でのデータ取得テスト

---

## 9. 判断基準・設計方針

### コード品質
- **TypeScript**: 型安全性の徹底
- **エラーハンドリング**: graceful degradation
- **パフォーマンス**: React.memo、並列処理

### UX設計
- **レスポンシブ**: モバイルファースト
- **アクセシビリティ**: セマンティックHTML
- **フィードバック**: ローディング・エラー表示

### セキュリティ
- **認証**: 管理画面トークン認証
- **API保護**: レート制限・CORS設定
- **環境変数**: 機密情報の適切な管理

---

## 10. 連絡先・メンテナンス

### 開発者情報
- **メイン開発**: Claude Code + 小堺さん
- **技術スタック**: Next.js + Supabase専門
- **対応時間**: 平日・土日対応可能

### メンテナンス計画
- **月次**: データベース容量チェック
- **四半期**: API制限・パフォーマンス確認
- **年次**: 技術スタック更新検討

---

*最終更新: 2025年9月29日*
*Phase 1+ Programs API統合システム完成記念版*