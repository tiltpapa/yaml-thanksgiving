# yaml-thanksgiving

YAMLを編集するだけでクイズスライドが作れるシステム。Reveal.jsを使わず独自実装のスライドエンジンで動作する。

## 機能

- YAMLファイルでクイズ内容を管理
- カウントダウンタイマー付きクイズ表示
- 2択・4択・6択に対応
- テキスト・画像クイズに対応（キャプション付き選択肢も可）
- 大画像＋テキスト選択肢レイアウト
- 前フリスライド・解説スライド
- 正解発表アニメーション
- 2次元ナビゲーション（横方向: 問題グループ、縦方向: 問題→回答）
- URLハッシュによるスライド位置の同期
- Quagga APIと連携した回答数表示・ランキング表示

## ファイル構成

```
.
├── index.html          # メインプレゼンテーション
├── ranking.html        # ランキング表示ページ
├── champion.html       # チャンピオン表示ページ
├── quiz.yml            # クイズコンテンツ（編集対象）
├── quiz.examble.yml    # quiz.yml のサンプル
├── config.js           # 環境設定ファイル（要作成）
├── config.example.js   # 設定ファイルのサンプル
├── styles.css          # 共通スタイル
├── text-quiz.css       # テキストクイズ用スタイル
├── image-quiz.css      # 画像クイズ用スタイル
├── ranking.css         # ランキング用スタイル
├── proxy.js            # ローカルプロキシサーバー（CORS回避用）
├── src/
│   ├── app.js              # エントリーポイント
│   ├── yaml-loader.js      # YAMLパース
│   ├── slide-renderer.js   # スライドDOM生成
│   ├── slide-controller.js # スライドナビゲーション
│   ├── quagga-api.js       # Quagga APIクライアント
│   └── result-renderer.js  # 回答数・ランキング描画
├── lib/
│   └── countdown.js        # カウントダウンタイマー
└── images/                 # 画像・動画素材
```

## インストール

### 必要な環境

- **Node.js と npm**（必須）

#### macOS

```bash
brew install node
```

#### Windows（winget）

```bash
winget install OpenJS.NodeJS
```

#### 公式サイト

https://nodejs.org/ から LTS版をダウンロード

### プロジェクトのセットアップ

```bash
git clone <リポジトリURL>
cd yaml-thanksgiving
npm install
```

## 使用方法

### 1. クイズを編集

`quiz.yml` を編集してクイズ内容を作成する。書き方は [CUSTOMIZE.md](CUSTOMIZE.md) を参照。

### 2. 環境設定（Quagga連携を使う場合）

`config.example.js` を `config.js` にコピーして設定する：

```bash
cp config.example.js config.js
```

`config.js` を編集：

```javascript
export const config = {
  token: 'your_access_token',
  eventId: 'your_event_id',
  debugMode: false  // 本番環境では false
};
```

Quagga連携を使わない場合は `config.js` を作成しなくても動作する（連携機能のみ無効）。

### 3. サーバー起動

```bash
npm start
```

ブラウザで `http://localhost:3000` にアクセス。

Quagga APIへのプロキシが必要な場合（CORS回避）は別途プロキシサーバーを起動：

```bash
npm run proxy
```

その場合は `config.js` の `apiBase` を `http://localhost:3001/api/v1` に変更する。

### 4. キー操作

| キー | 動作 |
|------|------|
| `→` / `←` | 横方向（問題グループ）の移動 |
| `↓` / `↑` | 縦方向（問題→回答）の移動 |
| `Space` / `Enter` | 次へ（縦優先） |
| `Backspace` | 前へ（縦優先） |

### 5. ランキング表示

`http://localhost:3000/ranking.html` にアクセス。

| キー | 動作 |
|------|------|
| `1` | 問題ランキング取得 |
| `2` | ピリオドランキング取得 |
| `3` | 総合ランキング取得 |
| `R` | 再取得 |
| `→` / `←` | ページ切替 |

## 備考

- 動作確認は Chrome で行なっている。他のブラウザでは表示が崩れる可能性がある。
