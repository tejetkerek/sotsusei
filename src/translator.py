"""
翻訳モジュール
"""

import os
import logging
from typing import Dict, Any, Optional
import re

# Google Cloud Translate API
try:
    from google.cloud import translate
except ImportError:
    translate = None
    logging.warning("Google Cloud Translate APIが利用できません")

class Translator:
    """翻訳クラス"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Google Cloud Translate APIの初期化
        if translate:
            try:
                # 認証情報が設定されているかチェック
                import os
                if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT_ID"):
                    self.translate_client = translate.TranslationServiceClient()
                    self.logger.info("Google Cloud Translate APIを初期化しました")
                else:
                    self.logger.warning("Google Cloud認証情報が設定されていないため、ダミーモードで動作します")
                    self.translate_client = None
            except Exception as e:
                self.logger.error(f"Google Cloud Translate APIの初期化に失敗: {str(e)}")
                self.translate_client = None
        else:
            self.translate_client = None
    
    def detect_language(self, text: str) -> str:
        """テキストの言語を検出"""
        try:
            if not self.translate_client:
                # ダミー言語検出（テスト用）
                self.logger.warning("Google Cloud Translate APIが利用できないため、ダミー言語検出を使用します")
                return self._dummy_detect_language(text)
            
            # Google Cloud Translate APIで言語検出
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "your-project-id")
            location = "global"
            parent = f"projects/{project_id}/locations/{location}"
            
            response = self.translate_client.detect_language(
                request={
                    "parent": parent,
                    "content": text,
                    "mime_type": "text/plain",
                }
            )
            
            detected_language = response.languages[0].language_code
            confidence = response.languages[0].confidence
            
            self.logger.info(f"言語検出成功: {detected_language} (信頼度: {confidence:.2f})")
            
            return detected_language
            
        except Exception as e:
            self.logger.error(f"言語検出に失敗しました: {str(e)}")
            return self._dummy_detect_language(text)
    
    def translate_text(self, text: str, target_language: str = "ja") -> str:
        """テキストを翻訳"""
        try:
            if not self.translate_client:
                # ダミー翻訳（テスト用）
                self.logger.warning("Google Cloud Translate APIが利用できないため、ダミー翻訳を使用します")
                return self._dummy_translate(text)
            
            # Google Cloud Translate APIで翻訳
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "your-project-id")
            location = "global"
            parent = f"projects/{project_id}/locations/{location}"
            
            response = self.translate_client.translate_text(
                request={
                    "parent": parent,
                    "contents": [text],
                    "mime_type": "text/plain",
                    "source_language_code": "auto",
                    "target_language_code": target_language,
                }
            )
            
            translated_text = response.translations[0].translated_text
            
            self.logger.info(f"翻訳成功: {len(text)}文字 → {len(translated_text)}文字")
            
            return translated_text
            
        except Exception as e:
            self.logger.error(f"翻訳に失敗しました: {str(e)}")
            return self._dummy_translate(text)
    
    def _dummy_detect_language(self, text: str) -> str:
        """ダミー言語検出（テスト用）"""
        # 簡単なパターンマッチングで言語を推測
        if re.search(r'[ก-๙]', text):  # タイ文字
            return "th"
        elif re.search(r'[가-힣]', text):  # ハングル
            return "ko"
        elif re.search(r'[一-龯]', text):  # 漢字
            return "zh"
        elif re.search(r'[а-яё]', text, re.IGNORECASE):  # キリル文字
            return "ru"
        elif re.search(r'[a-zA-Z]', text):  # ラテン文字
            return "en"
        else:
            return "en"  # デフォルト
    
    def _dummy_translate(self, text: str) -> str:
        """ダミー翻訳（テスト用）"""
        # 簡単な翻訳マッピング
        translations = {
            "McDonald's Bangkok": "マクドナルド バンコク店",
            "Big Mac Meal": "ビッグマックセット",
            "Starbucks Coffee": "スターバックスコーヒー",
            "Caramel Macchiato": "キャラメルマキアート",
            "Water Bottle": "水のボトル",
            "Chips": "ポテトチップス",
            "Thank you for visiting!": "ご来店ありがとうございました！",
            "Have a great day!": "素晴らしい一日をお過ごしください！",
            "Thank you!": "ありがとうございます！",
            "Total": "合計",
            "Tax": "税金"
        }
        
        translated_text = text
        for original, translated in translations.items():
            translated_text = translated_text.replace(original, translated)
        
        # 金額の変換（$ → 円、฿ → 円）
        translated_text = re.sub(r'\$(\d+\.?\d*)', r'$\1（約\1×150円）', translated_text)
        translated_text = re.sub(r'฿(\d+\.?\d*)', r'฿\1（約\1×4.2円）', translated_text)
        
        return translated_text
