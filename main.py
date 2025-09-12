#!/usr/bin/env python3
"""
海外支出ガイド MVP - レシート画像認識・翻訳・通貨換算システム
"""

import os
import sys
import yaml
import json
import logging
import colorlog
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv

# カスタムモジュールのインポート
from src.config_manager import ConfigManager
from src.image_processor import ImageProcessor
from src.translator import Translator
from src.currency_converter import CurrencyConverter
from src.result_manager import ResultManager

# 環境変数の読み込み
load_dotenv()

def setup_logging():
    """ログ設定の初期化"""
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter(
        '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    ))
    
    logger = colorlog.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
    
    return logger

def main():
    """メイン実行関数"""
    logger = setup_logging()
    logger.info("🚀 海外支出ガイド MVP システムを開始します")
    
    try:
        # 設定ファイルの読み込み
        config_manager = ConfigManager("config.yaml")
        config = config_manager.load_config()
        
        logger.info(f"📋 プロジェクト: {config['project']['name']} v{config['project']['version']}")
        
        # 各プロセッサーの初期化
        image_processor = ImageProcessor(config)
        translator = Translator(config)
        currency_converter = CurrencyConverter(config)
        result_manager = ResultManager(config)
        
        # 処理フローの実行
        process_receipt(config, image_processor, translator, currency_converter, result_manager, logger)
        
        logger.info("✅ 処理が完了しました")
        
    except Exception as e:
        logger.error(f"❌ エラーが発生しました: {str(e)}")
        sys.exit(1)

def process_receipt(config: Dict[str, Any], 
                   image_processor: ImageProcessor,
                   translator: Translator,
                   currency_converter: CurrencyConverter,
                   result_manager: ResultManager,
                   logger: logging.Logger):
    """レシート処理のメインロジック"""
    
    # テスト用のレシートID（後でダミーデータに置き換え）
    receipt_id = "test_receipt_001"
    
    logger.info(f"📷 レシート処理開始: {receipt_id}")
    
    # 結果を格納する辞書
    results = {
        "receipt_id": receipt_id,
        "phases": {}
    }
    
    # 各フェーズの実行
    for phase in config["processing_flow"]:
        phase_name = phase["name"]
        phase_key = phase["phase"]
        
        logger.info(f"🔄 {phase_name}を開始します")
        results["phases"][phase_key] = {
            "name": phase_name,
            "steps": {},
            "status": "processing"
        }
        
        try:
            # フェーズ内の各ステップを実行
            for step in phase["steps"]:
                step_name = step["step"]
                action = step["action"]
                
                logger.info(f"  📝 {step['explanation']}")
                
                # アクションに応じた処理
                if action == "load_image":
                    image_data = image_processor.load_image(receipt_id)
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"image_loaded": True}
                    }
                
                elif action == "ocr_extraction":
                    text_data = image_processor.extract_text(receipt_id)
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": text_data
                    }
                
                elif action == "language_detection":
                    detected_lang = translator.detect_language(text_data["extracted_text"])
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"detected_language": detected_lang}
                    }
                
                elif action == "translate":
                    translated_text = translator.translate_text(text_data["extracted_text"])
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"translated_text": translated_text}
                    }
                
                elif action == "amount_extraction":
                    amounts = currency_converter.extract_amounts(text_data["extracted_text"])
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"amounts": amounts}
                    }
                
                elif action == "currency_detection":
                    currencies = currency_converter.detect_currencies(text_data["extracted_text"])
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"currencies": currencies}
                    }
                
                elif action == "currency_conversion":
                    conversions = currency_converter.convert_currencies(amounts, currencies)
                    results["phases"][phase_key]["steps"][step_name] = {
                        "status": "success",
                        "data": {"conversions": conversions}
                    }
            
            results["phases"][phase_key]["status"] = "completed"
            logger.info(f"✅ {phase_name}が完了しました")
            
        except Exception as e:
            logger.error(f"❌ {phase_name}でエラーが発生: {str(e)}")
            results["phases"][phase_key]["status"] = "error"
            results["phases"][phase_key]["error"] = str(e)
    
    # 結果の保存
    result_manager.save_results(results, receipt_id)
    
    # 結果の表示
    display_results(results, logger)

def display_results(results: Dict[str, Any], logger: logging.Logger):
    """結果の表示"""
    logger.info("📊 処理結果:")
    logger.info("=" * 50)
    
    for phase_key, phase_data in results["phases"].items():
        logger.info(f"📋 {phase_data['name']}: {phase_data['status']}")
        
        if phase_data['status'] == 'completed':
            for step_name, step_data in phase_data['steps'].items():
                if step_data['status'] == 'success':
                    logger.info(f"  ✅ {step_name}")
                    if 'data' in step_data:
                        # 重要なデータのみ表示
                        if 'extracted_text' in step_data['data']:
                            logger.info(f"    抽出テキスト: {step_data['data']['extracted_text'][:100]}...")
                        if 'translated_text' in step_data['data']:
                            logger.info(f"    翻訳テキスト: {step_data['data']['translated_text'][:100]}...")
                        if 'conversions' in step_data['data']:
                            logger.info(f"    換算結果: {step_data['data']['conversions']}")

if __name__ == "__main__":
    main()
