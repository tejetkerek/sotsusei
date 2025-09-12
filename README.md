# 海外支出ガイド MVP

レシート画像認識・翻訳・通貨換算機能のMVPシステム

## 概要

このプロジェクトは、海外旅行時のレシートを撮影して、自動的に翻訳・通貨換算を行うシステムのMVP（Minimum Viable Product）です。

### 主な機能

- **画像認識（OCR）**: レシート画像からテキストを抽出
- **自動翻訳**: 多言語のレシートを日本語に翻訳
- **通貨換算**: 現地通貨を日本円に自動換算
- **感覚値比較**: 日本の価格との比較メッセージ生成

## 技術スタック

- **Python 3.8+**
- **Google Cloud Vision API**: 画像認識
- **Google Cloud Translate API**: 翻訳
- **Google Gemini API**: AI機能
- **Exchange Rate API**: 為替レート取得
- **YAML**: 設定管理

## セットアップ手順

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`env_example.txt`を参考に、`.env`ファイルを作成してください：

```bash
cp env_example.txt .env
```

必要なAPIキーを設定：
- Google Cloud Vision API
- Google Cloud Translate API
- Google Cloud Gemini API
- Exchange Rate API（無料）

### 3. Google Cloud APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. 以下のAPIを有効化：
   - Cloud Vision API
   - Cloud Translate API
3. サービスアカウントキーを作成し、環境変数に設定

### 4. 通貨換算APIの設定

1. [Exchange Rate API](https://exchangerate-api.com/)で無料アカウントを作成
2. APIキーを取得し、環境変数に設定

## 使用方法

### 基本的な実行

```bash
python main.py
```

### 設定ファイルのカスタマイズ

`config.yaml`を編集して、処理フローやAPI設定を変更できます。

## プロジェクト構造

```
├── main.py                 # メイン実行ファイル
├── config.yaml            # YAML設定ファイル
├── requirements.txt        # Python依存関係
├── env_example.txt        # 環境変数設定例
├── README.md              # このファイル
├── src/                   # ソースコード
│   ├── __init__.py
│   ├── config_manager.py  # 設定管理
│   ├── image_processor.py # 画像処理・OCR
│   ├── translator.py      # 翻訳機能
│   ├── currency_converter.py # 通貨換算
│   └── result_manager.py  # 結果管理
├── receipts/              # レシート画像（作成が必要）
└── results/               # 処理結果（自動作成）
```

## 処理フロー

1. **画像処理フェーズ**
   - レシート画像の読み込み
   - OCRによるテキスト抽出

2. **翻訳フェーズ**
   - 言語の自動検出
   - 日本語への翻訳

3. **通貨換算フェーズ**
   - 金額の抽出
   - 通貨の検出
   - 日本円への換算

## 出力結果

処理結果は`results/`ディレクトリに以下の形式で保存されます：

- `{receipt_id}_{timestamp}.json`: 詳細な処理結果
- `{receipt_id}_summary.json`: 処理サマリー

## ダミーデータ

APIキーが設定されていない場合、システムは自動的にダミーデータを使用して動作します。

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - APIキーが有効か確認

2. **依存関係エラー**
   - `pip install -r requirements.txt`を実行

3. **権限エラー**
   - ディレクトリの書き込み権限を確認

## 今後の拡張予定

- [ ] 音声入力対応
- [ ] より多くの通貨対応
- [ ] リアルタイム為替レート
- [ ] 支出分類機能
- [ ] 想い出機能

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。
