#!/usr/bin/env python3
"""
システム動作確認用テストスクリプト
"""

import os
import sys
import json
from pathlib import Path

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(str(Path(__file__).parent))

from src.config_manager import ConfigManager
from src.image_processor import ImageProcessor
from src.translator import Translator
from src.currency_converter import CurrencyConverter
from src.result_manager import ResultManager

def test_system():
    """システム全体の動作確認"""
    print("🧪 海外支出ガイド MVP システムテスト")
    print("=" * 50)
    
    try:
        # 1. 設定ファイルの読み込みテスト
        print("1. 設定ファイルの読み込み...")
        config_manager = ConfigManager("config.yaml")
        config = config_manager.load_config()
        print("   ✅ 設定ファイル読み込み成功")
        
        # 2. 各モジュールの初期化テスト
        print("2. モジュール初期化...")
        
        image_processor = ImageProcessor(config)
        print("   ✅ 画像処理モジュール初期化成功")
        
        translator = Translator(config)
        print("   ✅ 翻訳モジュール初期化成功")
        
        currency_converter = CurrencyConverter(config)
        print("   ✅ 通貨換算モジュール初期化成功")
        
        result_manager = ResultManager(config)
        print("   ✅ 結果管理モジュール初期化成功")
        
        # 3. ダミーデータでの機能テスト
        print("3. 機能テスト（ダミーデータ）...")
        
        # テスト用のレシートID
        receipt_id = "test_receipt_001"
        
        # 画像処理テスト
        print("   📷 画像処理テスト...")
        image_data = image_processor.load_image(receipt_id)
        print(f"      ✅ 画像読み込み: {image_data.get('message', '成功')}")
        
        # OCRテスト
        text_data = image_processor.extract_text(receipt_id)
        print(f"      ✅ テキスト抽出: {text_data['text_length']}文字")
        
        # 翻訳テスト
        print("   🌐 翻訳テスト...")
        detected_lang = translator.detect_language(text_data["extracted_text"])
        print(f"      ✅ 言語検出: {detected_lang}")
        
        translated_text = translator.translate_text(text_data["extracted_text"])
        print(f"      ✅ 翻訳: {len(translated_text)}文字")
        
        # 通貨換算テスト
        print("   💰 通貨換算テスト...")
        amounts = currency_converter.extract_amounts(text_data["extracted_text"])
        print(f"      ✅ 金額抽出: {len(amounts)}個")
        
        currencies = currency_converter.detect_currencies(text_data["extracted_text"])
        print(f"      ✅ 通貨検出: {currencies}")
        
        conversions = currency_converter.convert_currencies(amounts, currencies)
        print(f"      ✅ 通貨換算: {len(conversions)}個")
        
        # 4. 結果保存テスト
        print("4. 結果保存テスト...")
        
        # テスト結果を作成
        test_results = {
            "receipt_id": receipt_id,
            "phases": {
                "image_processing": {
                    "name": "画像処理フェーズ",
                    "status": "completed",
                    "steps": {
                        "load_image": {"status": "success", "data": image_data},
                        "extract_text": {"status": "success", "data": text_data}
                    }
                },
                "translation": {
                    "name": "翻訳フェーズ", 
                    "status": "completed",
                    "steps": {
                        "detect_language": {"status": "success", "data": {"detected_language": detected_lang}},
                        "translate_text": {"status": "success", "data": {"translated_text": translated_text}}
                    }
                },
                "currency_conversion": {
                    "name": "通貨換算フェーズ",
                    "status": "completed", 
                    "steps": {
                        "extract_amount": {"status": "success", "data": {"amounts": amounts}},
                        "detect_currency": {"status": "success", "data": {"currencies": currencies}},
                        "convert_currency": {"status": "success", "data": {"conversions": conversions}}
                    }
                }
            }
        }
        
        # 結果を保存
        result_manager.save_results(test_results, receipt_id)
        print("   ✅ 結果保存成功")
        
        # 5. 結果表示
        print("5. 処理結果サマリー...")
        print("   📊 抽出されたテキスト:")
        print(f"      {text_data['extracted_text'][:100]}...")
        print("   🌐 翻訳結果:")
        print(f"      {translated_text[:100]}...")
        print("   💰 換算結果:")
        for conv in conversions:
            print(f"      {conv['original_amount']} {conv['original_currency']} → {conv['jpy_amount']}円")
        
        print("\n🎉 すべてのテストが成功しました！")
        print("システムは正常に動作しています。")
        
    except Exception as e:
        print(f"\n❌ テスト中にエラーが発生しました: {str(e)}")
        print("詳細なエラー情報:")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def test_individual_modules():
    """個別モジュールのテスト"""
    print("\n🔧 個別モジュールテスト")
    print("=" * 30)
    
    try:
        config_manager = ConfigManager("config.yaml")
        config = config_manager.load_config()
        
        # 翻訳モジュールのテスト
        print("翻訳モジュールテスト...")
        translator = Translator(config)
        
        test_texts = [
            "Hello, how are you?",
            "McDonald's Big Mac $8.50",
            "Starbucks Coffee ฿120"
        ]
        
        for text in test_texts:
            lang = translator.detect_language(text)
            translated = translator.translate_text(text)
            print(f"  '{text}' → {lang} → '{translated[:50]}...'")
        
        # 通貨換算モジュールのテスト
        print("\n通貨換算モジュールテスト...")
        currency_converter = CurrencyConverter(config)
        
        test_text = "McDonald's Big Mac $8.50, Tax $0.85, Total $9.35"
        amounts = currency_converter.extract_amounts(test_text)
        currencies = currency_converter.detect_currencies(test_text)
        conversions = currency_converter.convert_currencies(amounts, currencies)
        
        print(f"  テキスト: {test_text}")
        print(f"  抽出金額: {amounts}")
        print(f"  検出通貨: {currencies}")
        print(f"  換算結果: {conversions}")
        
        print("\n✅ 個別モジュールテスト完了")
        
    except Exception as e:
        print(f"❌ 個別モジュールテストエラー: {str(e)}")

if __name__ == "__main__":
    # メインシステムテスト
    success = test_system()
    
    if success:
        # 個別モジュールテスト
        test_individual_modules()
        
        print("\n📝 次のステップ:")
        print("1. APIキーを設定して本格的なテストを実行")
        print("2. 実際のレシート画像でテスト")
        print("3. 設定ファイルをカスタマイズ")
    else:
        print("\n⚠️  システムテストに失敗しました。")
        print("設定ファイルや依存関係を確認してください。")
