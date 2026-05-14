# カスタマイズガイド

`quiz.yml` を編集してクイズを作成する方法を説明する。

## 目次

- [YAMLの基本構造](#yamlの基本構造)
- [問題の書き方](#問題の書き方)
- [スライドの種類と自動生成](#スライドの種類と自動生成)
- [レイアウトの種類](#レイアウトの種類)
- [選択肢の書き方](#選択肢の書き方)
- [正解・解説の設定](#正解解説の設定)
- [前フリスライド](#前フリスライド)
- [タイトルスライド](#タイトルスライド)
- [複数のクイズファイルを使い分ける](#複数のクイズファイルを使い分ける)

---

## YAMLの基本構造

`quiz.yml` は `questions` キーの下に問題を並べる：

```yaml
questions:
  - title: "問題タイトル"
    layout:
      type: "select"
      mini-title: "問題文"
    selections:
      1: "選択肢1"
      2: "選択肢2"
    answer:
      answer: [1]
```

---

## 問題の書き方

各問題で使えるキー：

| キー | 必須 | 説明 |
|------|------|------|
| `title` | ○ | 問題タイトル（扉スライドに表示） |
| `subtitle` | - | サブタイトル（扉スライドに表示） |
| `lead-in` | - | 前フリスライドの内容 |
| `layout` | ○ | レイアウト設定 |
| `selections` | ○ | 選択肢 |
| `answer` | - | 正解・解説設定 |
| `time_limit` | - | タイマーの秒数（省略時は10秒） |

---

## スライドの種類と自動生成

1問につき以下のスライドが自動生成される：

1. **タイトルスライド** - `title` が設定されている場合
2. **前フリスライド** - `lead-in` が設定されている場合
3. **問題スライド** - `selections` が設定されている場合（タイマー付き）
4. **回答数スライド** - `answer` が設定されている場合（Quagga連携で回答数を表示）
5. **正解スライド** - `answer` が設定されている場合（正解をハイライト表示）
6. **解説スライド** - `answer.caption` が設定されている場合

---

## レイアウトの種類

`layout` セクションで設定する：

```yaml
layout:
  type: "select"        # 問題タイプ（現在は select のみ）
  mini-title: "問題文"  # 問題スライドに表示する問題文
  large-image: "images/sample.jpg"  # 大きな画像（省略可）
```

### 選択肢数による自動判定

選択肢の数に応じてレイアウトが自動で切り替わる：

| 選択肢数 | レイアウト |
|---------|-----------|
| 2 | 2択 |
| 3〜4 | 4択 |
| 5〜6 | 6択 |

### テキスト vs 画像

選択肢の値が画像ファイルパス（`.png`, `.jpg` など）かどうかで自動判定される。

### 大画像レイアウト

`large-image` を指定すると、大きな画像の下にテキスト選択肢が並ぶレイアウトになる：

```yaml
layout:
  type: "select"
  mini-title: "この花は？"
  large-image: "images/himawari.jpg"
selections:
  1: "ひまわり"
  2: "バラ"
  3: "チューリップ"
  4: "コスモス"
```

---

## 選択肢の書き方

### テキスト選択肢

```yaml
selections:
  1: "野球"
  2: "サッカー"
  3: "テニス"
  4: "水泳"
```

### 画像選択肢

```yaml
selections:
  1: "images/baseball.png"
  2: "images/soccer.png"
```

### 画像＋キャプション選択肢

```yaml
selections:
  1: ["images/baseball.png", "野球"]
  2: ["images/soccer.png", "サッカー"]
```

---

## 正解・解説の設定

### 正解のみ

```yaml
answer:
  answer: [1]
```

複数正解の場合：

```yaml
answer:
  answer: [1, 3]
```

### 解説付き

`caption` に選択肢キーと解説テキストを対応させる。`*テキスト*` で赤太字になる：

```yaml
answer:
  answer: [1]
  caption:
    1: "*ひまわり*はキク科の一年草"
    2: "バラはバラ科の植物"
    3: "チューリップはユリ科の球根植物"
    4: "コスモスはキク科の一年草"
```

---

## 前フリスライド

問題スライドの前に表示するスライド。テキストと画像を組み合わせられる：

```yaml
lead-in:
  text: "ひまわり"
  image: "images/himawari.jpg"
```

テキストを複数行にする場合：

```yaml
lead-in:
  text:
    - "これは何でしょう？"
    - "ヒント: 夏の花"
  image: "images/himawari-land.jpg"
```

---

## タイトルスライド

`title` と `subtitle` を設定すると扉スライドが生成される：

```yaml
- title: "どれが好き？"
  subtitle: "第1問"
  layout:
    type: "select"
    mini-title: "どれが好き？"
  selections:
    1: "野球"
    2: "サッカー"
```

タイトルスライドのみ（問題なし）を作る場合は `layout.type: "title"` を指定する：

```yaml
- title: "クイズ大会"
  subtitle: "2024年版"
  layout:
    type: "title"
```

---

## 作成例

### テキスト4択クイズ

```yaml
- title: "日本の首都は？"
  time_limit: 10
  layout:
    type: "select"
    mini-title: "日本の首都はどこ？"
  selections:
    1: "東京"
    2: "大阪"
    3: "京都"
    4: "名古屋"
  answer:
    answer: [1]
```

### 画像2択クイズ（解説付き）

```yaml
- title: "どちらが野球？"
  layout:
    type: "select"
    mini-title: "野球のボールはどっち？"
  selections:
    1: ["images/baseball.png", "野球"]
    2: ["images/soccer.png", "サッカー"]
  answer:
    answer: [1]
    caption:
      1: "*野球*のボールが正解！"
      2: "これはサッカーボール"
```

### 前フリ付き4択クイズ

```yaml
- title: "この花は？"
  lead-in:
    text: "夏によく見かける花です"
    image: "images/himawari.jpg"
  layout:
    type: "select"
    mini-title: "この花の名前は？"
  selections:
    1: "ひまわり"
    2: "バラ"
    3: "チューリップ"
    4: "コスモス"
  answer:
    answer: [1]
```

---

## 複数のクイズファイルを使い分ける

異なるクイズセットを作りたい場合、HTMLファイルとYAMLファイルをセットで用意する。

1. `index.html` をコピー（例: `period2.html`）
2. 新しいYAMLファイルを作成（例: `quiz2.yml`）
3. コピーしたHTMLの読み込み先を変更：

```html
<!-- period2.html 内の app.js 呼び出し前に設定を追加 -->
<script>
  window.QUIZ_FILE = 'quiz2.yml';
</script>
<script type="module" src="src/app.js"></script>
```

※ 現状は `app.js` が `quiz.yml` を固定で読み込んでいるため、複数ファイル対応には `app.js` の修正が必要。

---

## トラブルシューティング

### スライドが表示されない

1. `quiz.yml` の構文を確認（インデントのズレに注意）
2. ブラウザの開発者ツールでエラーを確認
3. リロードする

### 回答数が表示されない

1. `config.js` の設定を確認
2. `debugMode: true` で動作確認する
3. プロキシサーバーが必要な場合は `npm run proxy` を実行

### 画像が表示されない

1. `images/` フォルダに画像ファイルが存在するか確認
2. YAMLのパスが正しいか確認（例: `images/baseball.png`）
