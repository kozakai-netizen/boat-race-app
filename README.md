# 🚤 住之江ボートレース予想システム MVP

住之江競艇場に特化したAI予想システムのMVP実装。Supabaseデータベースと連携してレース情報・予想・結果を表示します。

**🎉 β版リリース準備完了！** Phase Next-A実装により、実ユーザーに安心して見せられるレベルに到達しました。

## 🎯 主な機能

- **📋 レース一覧・出走情報表示**
  - 日付・グレード別のレース一覧
  - 展示差・特徴アイコン表示
  - **⏰ リアルタイム締切時刻表示**（Phase Next-A新機能）

- **🎯 AI による 3連単予想**
  - EV値ベースの予想算出
  - SUPER PICK 機能（EV≥1.25 かつ 確率≥4%）
  - 1着固定予想モード
  - **📊 参考データ明確表示**（Phase Next-A新機能）

- **📊 レース結果・的中状況**
  - 🎯的中/🔝TOP5内/❌不的中/📊参考
  - 払戻金・人気表示
  - 成績サマリー

- **🔧 開発者体験向上**
  - 型安全性強化（Zod統一）
  - parseRaceId統一化
  - エラー処理改善

## 🗄️ データベース構造

DBスキーマは `database/schema.sql` に定義されています：

### 主要テーブル
- `race` - レース基本情報
- `entry` - 出走選手情報
- `exhibition` - 展示タイム・ST情報
- `forecast` - AI予想結果
- `result` - レース結果
- `odds_latest` - 最新オッズ（ビュー）

### マテリアライズドビュー
- `race_pack` - レース+天候情報
- `race_entries_pack_mv` - 出走+展示+成績統合

## 🚀 起動手順

### 1. 環境設定

```bash
# リポジトリクローン
git clone <repository-url>
cd boat-race-app

# 依存関係インストール
npm install

# 環境変数設定
cp .env.local.example .env.local
# .env.local を編集してSupabase接続情報を設定
```

### 2. Supabase設定

`.env.local` に以下の情報を設定：

```bash
# Supabase settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Edge Config (optional - デフォルト値で動作)
SUPER_EV_MIN=1.25
SUPER_PROB_MIN=0.04
EXH_LR_STRONG=0.10
EXH_OUTER_INNER_STRONG=-0.15
SERIES_CONF_K=6
```

### 3. データベースセットアップ

```sql
-- 1. database/schema.sql を実行してテーブル作成
-- 2. 必要に応じてマテリアライズドビューを更新
REFRESH MATERIALIZED VIEW CONCURRENTLY race_entries_pack_mv;
```

### 4. アプリケーション起動

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:3002 にアクセス（ポート3001が使用中の場合）
```

### 5. プロダクションビルド

```bash
# ビルド実行
npm run build

# プロダクションサーバー起動
npm run start
```

## 📡 API エンドポイント

### GET /api/venues/suminoye
- パラメータ: `date`, `grade`
- 会場情報・天候・SUPER PICKS件数を返す

### GET /api/races/suminoye
- パラメータ: `date`, `grade`
- 日付・グレード別のレース一覧を返す

### GET /api/forecast/[raceId]
- パラメータ: `fixFirst` (optional)
- レースの3連単予想をEV降順で返す

### GET /api/results/suminoye
- パラメータ: `date`
- レース結果・的中状況を返す

## 🧪 受け入れテスト

### クイックスタート（β版デモ）

```bash
# 1. テストデータ投入
npm run seed:test:suminoye

# 2. 開発サーバー起動
npm run dev

# 3. β版デモページアクセス
# - ホーム: http://localhost:3002/suminoye
# - レース詳細: http://localhost:3002/race/suminoye-20250924-1R
# - 結果: http://localhost:3002/suminoye/results?date=2025-09-24
```

### API動作確認
```bash
# 的中判定付き予想API
curl http://localhost:3002/api/forecast/suminoye-20250924-1R

# レスポンス例
{
  "race_id": "suminoye-20250924-1R",
  "triples": [
    {
      "combo": "2-1-3",
      "prob": 0.058,
      "odds": null,
      "ev": 1.9,
      "super": true,
      "icons": ["⚡", "💨"],
      "hitType": "win",
      "why": {
        "icons": ["⚡", "💨"],
        "summary": "2号艇の差し決まりに期待",
        "factors": ["まわり足良好", "風向き有利"]
      }
    }
  ]
}
```

### seedスクリプト活用
```bash
# 指定日・レース数でデータ生成
npm run seed:test:suminoye -- --date 2025-09-25 --races 3

# 生成確認
curl "http://localhost:3002/api/results/suminoye?date=2025-09-25"
```

### Zodスキーマ検証
全APIレスポンスがZodスキーマ (`src/lib/types.ts`) に準拠しています。

### UI動作確認
- `/suminoye` - ホームページ
- `/suminoye/races` - レース一覧
- `/race/suminoye-TEST-1R` - レース詳細
- `/suminoye/results` - 結果表示

## 📁 プロジェクト構造

```
boat-race-app/
├── src/
│   ├── app/
│   │   ├── api/                    # APIルート
│   │   ├── suminoye/              # 住之江メインページ
│   │   ├── race/[id]/             # レース詳細ページ
│   │   └── page.tsx               # トップページ
│   ├── lib/
│   │   ├── supabase.ts            # Supabase クライアント
│   │   ├── types.ts               # Zod スキーマ・型定義
│   │   └── constants.ts           # 定数定義
├── database/
│   └── schema.sql                 # データベーススキーマ
├── .env.local                     # 環境変数
└── package.json
```

## 🔧 開発メモ

### 既知の制限事項
- 出走表詳細データの表示は簡易版（race_entries_pack_mv 未実装）
- 天候データの取得は基本的な情報のみ
- 実際のSupabaseインスタンスとの接続が必要

### カスタマイズポイント
- `src/lib/constants.ts` でSUPER PICK基準値を調整
- `src/lib/types.ts` でAPIスキーマを拡張
- アイコンマッピングはPLAYER_ICONSで定義

## 🚀 デプロイ

### Vercel
```bash
# Vercelプロジェクト作成
npm run build
vercel --prod

# 環境変数をVercel管理画面で設定
```

### 環境変数の設定
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- その他Edge Config値（オプション）

---

## 📞 サポート

問題が発生した場合：

1. データベース接続確認
2. 環境変数設定確認
3. Supabaseプロジェクトの権限確認
4. コンソールエラーログの確認

**管理者**: Claude Code Implementation Team# Force Vercel Deploy 2025年 9月25日 木曜日 22時02分26秒 JST
