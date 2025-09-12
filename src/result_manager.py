"""
結果管理モジュール
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

class ResultManager:
    """結果管理クラス"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 出力設定を取得
        self.output_config = config["output"]
        self.output_dir = Path(self.output_config["output_dir"])
        self.should_save_results = self.output_config["save_results"]
        
        # 出力ディレクトリを作成
        self.output_dir.mkdir(exist_ok=True)
        
        self.logger.info(f"結果管理モジュールを初期化しました: {self.output_dir}")
    
    def save_results(self, results: Dict[str, Any], receipt_id: str):
        """処理結果を保存"""
        try:
            if not self.should_save_results:
                self.logger.info("結果保存が無効になっています")
                return
            
            # 結果にメタデータを追加
            results["metadata"] = {
                "processed_at": datetime.now().isoformat(),
                "project_name": self.config["project"]["name"],
                "project_version": self.config["project"]["version"],
                "receipt_id": receipt_id
            }
            
            # ファイル名を生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{receipt_id}_{timestamp}.json"
            filepath = self.output_dir / filename
            
            # JSONファイルとして保存
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"結果を保存しました: {filepath}")
            
            # サマリーファイルも作成
            self._create_summary(results, receipt_id)
            
        except Exception as e:
            self.logger.error(f"結果保存に失敗しました: {str(e)}")
    
    def _create_summary(self, results: Dict[str, Any], receipt_id: str):
        """処理結果のサマリーを作成"""
        try:
            summary = {
                "receipt_id": receipt_id,
                "processed_at": datetime.now().isoformat(),
                "status": "completed",
                "phases": {}
            }
            
            # 各フェーズのサマリーを作成
            for phase_key, phase_data in results["phases"].items():
                summary["phases"][phase_key] = {
                    "name": phase_data["name"],
                    "status": phase_data["status"],
                    "step_count": len(phase_data.get("steps", {})),
                    "success_count": sum(1 for step in phase_data.get("steps", {}).values() 
                                       if step.get("status") == "success")
                }
                
                # エラーがある場合は記録
                if "error" in phase_data:
                    summary["phases"][phase_key]["error"] = phase_data["error"]
            
            # 重要なデータを抽出
            extracted_data = self._extract_key_data(results)
            summary["extracted_data"] = extracted_data
            
            # サマリーファイルを保存
            summary_filename = f"{receipt_id}_summary.json"
            summary_filepath = self.output_dir / summary_filename
            
            with open(summary_filepath, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"サマリーを作成しました: {summary_filepath}")
            
        except Exception as e:
            self.logger.error(f"サマリー作成に失敗しました: {str(e)}")
    
    def _extract_key_data(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """重要なデータを抽出"""
        extracted = {}
        
        try:
            # 翻訳フェーズからテキストを抽出
            if "translation" in results["phases"]:
                translation_phase = results["phases"]["translation"]
                for step_name, step_data in translation_phase.get("steps", {}).items():
                    if step_data.get("status") == "success" and "data" in step_data:
                        if "translated_text" in step_data["data"]:
                            extracted["translated_text"] = step_data["data"]["translated_text"]
                        if "detected_language" in step_data["data"]:
                            extracted["detected_language"] = step_data["data"]["detected_language"]
            
            # 通貨換算フェーズから金額を抽出
            if "currency_conversion" in results["phases"]:
                currency_phase = results["phases"]["currency_conversion"]
                conversions = []
                for step_name, step_data in currency_phase.get("steps", {}).items():
                    if step_name == "convert_currency" and step_data.get("status") == "success":
                        if "data" in step_data and "conversions" in step_data["data"]:
                            conversions = step_data["data"]["conversions"]
                            break
                
                if conversions:
                    extracted["conversions"] = conversions
                    # 合計金額を計算（重複を避けるため、ユニークな金額のみ）
                    unique_amounts = {}
                    for conv in conversions:
                        key = (conv["original_amount"], conv["original_currency"])
                        if key not in unique_amounts or conv["jpy_amount"] > unique_amounts[key]:
                            unique_amounts[key] = conv["jpy_amount"]
                    
                    total_jpy = sum(unique_amounts.values())
                    extracted["total_jpy"] = total_jpy
            
            # 画像処理フェーズからテキストを抽出
            if "image_processing" in results["phases"]:
                image_phase = results["phases"]["image_processing"]
                for step_name, step_data in image_phase.get("steps", {}).items():
                    if step_name == "extract_text" and step_data.get("status") == "success":
                        if "data" in step_data and "extracted_text" in step_data["data"]:
                            extracted["original_text"] = step_data["data"]["extracted_text"]
            
        except Exception as e:
            self.logger.error(f"データ抽出に失敗しました: {str(e)}")
        
        return extracted
    
    def load_results(self, receipt_id: str) -> Dict[str, Any]:
        """保存された結果を読み込み"""
        try:
            # 最新の結果ファイルを検索
            pattern = f"{receipt_id}_*.json"
            result_files = list(self.output_dir.glob(pattern))
            
            if not result_files:
                raise FileNotFoundError(f"結果ファイルが見つかりません: {receipt_id}")
            
            # 最新のファイルを取得
            latest_file = max(result_files, key=lambda x: x.stat().st_mtime)
            
            with open(latest_file, 'r', encoding='utf-8') as f:
                results = json.load(f)
            
            self.logger.info(f"結果を読み込みました: {latest_file}")
            return results
            
        except Exception as e:
            self.logger.error(f"結果読み込みに失敗しました: {str(e)}")
            raise
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """処理統計を取得"""
        try:
            stats = {
                "total_files": 0,
                "successful_files": 0,
                "failed_files": 0,
                "total_processing_time": 0,
                "average_processing_time": 0
            }
            
            # 結果ファイルを検索
            result_files = list(self.output_dir.glob("*.json"))
            
            for file_path in result_files:
                if file_path.name.endswith("_summary.json"):
                    continue
                
                stats["total_files"] += 1
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        result = json.load(f)
                    
                    # 処理時間を計算
                    if "metadata" in result and "processed_at" in result["metadata"]:
                        processed_at = datetime.fromisoformat(result["metadata"]["processed_at"])
                        stats["total_processing_time"] += 1  # 簡易計算
                    
                    # 成功/失敗を判定
                    all_successful = True
                    for phase_data in result.get("phases", {}).values():
                        if phase_data.get("status") != "completed":
                            all_successful = False
                            break
                    
                    if all_successful:
                        stats["successful_files"] += 1
                    else:
                        stats["failed_files"] += 1
                        
                except Exception:
                    stats["failed_files"] += 1
            
            # 平均処理時間を計算
            if stats["total_files"] > 0:
                stats["average_processing_time"] = stats["total_processing_time"] / stats["total_files"]
            
            return stats
            
        except Exception as e:
            self.logger.error(f"統計取得に失敗しました: {str(e)}")
            return {}
