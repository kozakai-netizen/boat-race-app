# 🧪 β版テスト用URL一覧

## 📋 基本ページ

### ホーム・メインページ
- **ホーム**: http://localhost:3002/suminoye
  - 会場情報・天候・SUPER PICKS件数表示
  - 当日レースへのナビゲーション

### レース関連ページ
- **レース一覧**: http://localhost:3002/suminoye/races?date=2025-09-24
  - 12レース表示、アイコン・EV値確認
  - 日付変更で別日データ表示

- **レース一覧（別日）**: http://localhost:3002/suminoye/races?date=2025-09-25
  - データの日付別表示確認

### 結果ページ
- **結果ページ**: http://localhost:3002/suminoye/results?date=2025-09-24
  - 的中状況・払戻金表示確認
  - ResultCardの展開機能

- **結果ページ（別日）**: http://localhost:3002/suminoye/results?date=2025-09-25
  - 別日の結果データ確認

## 🎯 レース詳細ページ（重点確認）

### Phase Next-A新機能確認用

**2025-09-24データ（12レース）:**
- http://localhost:3002/race/suminoye-20250924-1R
- http://localhost:3002/race/suminoye-20250924-2R
- http://localhost:3002/race/suminoye-20250924-3R
- http://localhost:3002/race/suminoye-20250924-4R
- http://localhost:3002/race/suminoye-20250924-5R
- http://localhost:3002/race/suminoye-20250924-6R
- http://localhost:3002/race/suminoye-20250924-7R
- http://localhost:3002/race/suminoye-20250924-8R
- http://localhost:3002/race/suminoye-20250924-9R
- http://localhost:3002/race/suminoye-20250924-10R
- http://localhost:3002/race/suminoye-20250924-11R
- http://localhost:3002/race/suminoye-20250924-12R

**2025-09-25データ（12レース）:**
- http://localhost:3002/race/suminoye-20250925-1R
- http://localhost:3002/race/suminoye-20250925-2R
- http://localhost:3002/race/suminoye-20250925-3R
- http://localhost:3002/race/suminoye-20250925-4R
- http://localhost:3002/race/suminoye-20250925-5R
- http://localhost:3002/race/suminoye-20250925-6R
- http://localhost:3002/race/suminoye-20250925-7R
- http://localhost:3002/race/suminoye-20250925-8R
- http://localhost:3002/race/suminoye-20250925-9R
- http://localhost:3002/race/suminoye-20250925-10R
- http://localhost:3002/race/suminoye-20250925-11R
- http://localhost:3002/race/suminoye-20250925-12R

## 🔍 確認ポイント

### A. Phase Next-A新機能
- [ ] **締切時刻表示**: 各レース詳細で残り時間がリアルタイム更新
- [ ] **的中バッジ**: 🎯的中・🔝TOP5内・📊参考の表示
- [ ] **SUPER表示**: ⭐SUPERバッジの表示
- [ ] **アイコン表示**: 🚀⚡💨🧱等の予想根拠アイコン

### B. コア機能
- [ ] **EV値ソート**: 予想がEV値順に並んでいる
- [ ] **1着固定タブ**: 各号艇選択で予想が変わる
- [ ] **ツールチップ**: ?ボタンで予想根拠が表示
- [ ] **レスポンシブ**: スマホ・タブレットで正常表示

### C. データ整合性
- [ ] **的中判定**: 結果と予想の照合が正しい
- [ ] **払戻金表示**: 正常な数値フォーマット
- [ ] **日付処理**: 複数日のデータが正しく表示

## 📱 デバイス別テスト

### モバイル（推奨）
- iPhone Safari
- Android Chrome
- 各ページの操作性確認

### デスクトップ
- Chrome/Firefox/Safari
- 大画面での表示確認

## 🚨 重点チェック項目（βユーザー向け）

### 1. **初見の使いやすさ**
- [ ] 何をするアプリか分かるか？
- [ ] 「締切まであと何分」が分かるか？
- [ ] 🎯的中・📊参考の違いが分かるか？

### 2. **予想の信頼性**
- [ ] EV値・確率の表示は適切か？
- [ ] SUPERマークの意味は明確か？
- [ ] アイコンの意味は推測できるか？

### 3. **操作性**
- [ ] 1着固定タブは使いやすいか？
- [ ] 結果ページは見やすいか？
- [ ] スマホでも問題なく操作できるか？

### 4. **欲しい機能**
- [ ] アイコンの凡例は必要か？
- [ ] フィードバック機能は欲しいか？
- [ ] URLシェア機能は使いたいか？

## 🔗 API直接確認（開発者向け）

```bash
# 予想API（的中判定付き）
curl "http://localhost:3002/api/forecast/suminoye-20250924-1R" | jq

# 結果API
curl "http://localhost:3002/api/results/suminoye?date=2025-09-24" | jq

# 会場API
curl "http://localhost:3002/api/venues/suminoye?date=2025-09-24" | jq

# レース一覧API
curl "http://localhost:3002/api/races/suminoye?date=2025-09-24" | jq
```

---

## 📋 β版フィードバック収集項目

使ってもらった後に聞きたいこと:

1. **第一印象**: 何をするアプリか分かったか？
2. **使いやすさ**: 迷った箇所はあったか？
3. **表示の分かりやすさ**: アイコンや色の意味は理解できたか？
4. **欲しい機能**: 追加で欲しい機能はあるか？
5. **総合評価**: 実際に使いたいと思うか？

**📞 連絡先**: 使用後のフィードバックをお聞かせください！