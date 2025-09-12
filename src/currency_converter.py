"""
通貨換算モジュール
"""

import os
import re
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime

class CurrencyConverter:
    """通貨換算クラス"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # 設定から通貨情報を取得
        self.base_currency = config["currency"]["base_currency"]
        self.target_currencies = config["currency"]["target_currencies"]
        self.api_url = config["currency"]["api_url"]
        self.fallback_rates = config["currency"]["fallback_rates"]
        
        # 通貨記号マッピング
        self.currency_symbols = {
            "$": "USD",
            "€": "EUR", 
            "฿": "THB",
            "₩": "KRW",
            "¥": "JPY",
            "元": "CNY",
            "RM": "MYR",
            "MYR": "MYR"
        }
        
        self.logger.info("通貨換算モジュールを初期化しました")
    
    def extract_amounts(self, text: str) -> List[Dict[str, Any]]:
        """テキストから金額を抽出"""
        try:
            # 金額パターンを定義
            amount_patterns = [
                r'(RM|MYR)\s*(\d+\.?\d*)',  # RM + 数字（マレーシア・リンギット）
                r'(\$|€|฿|₩|¥|元)\s*(\d+\.?\d*)',  # 通貨記号 + 数字
                r'(\d+\.?\d*)\s*(RM|MYR)',  # 数字 + RM
                r'(\d+\.?\d*)\s*(\$|€|฿|₩|¥|元)',  # 数字 + 通貨記号
                r'Total[:\s]*(RM|MYR|$|€|฿|₩|¥|元)?\s*(\d+\.?\d*)',  # Total行
                r'(\d+\.?\d*)\s*(USD|EUR|THB|KRW|JPY|CNY|MYR)',  # 通貨コード
            ]
            
            amounts = []
            
            for i, pattern in enumerate(amount_patterns):
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    try:
                        # パターンに応じてグループを取得
                        if i == 0:  # RM + 数字
                            currency_symbol = match.group(1)
                            amount_str = match.group(2)
                        elif i == 1:  # 通貨記号 + 数字
                            currency_symbol = match.group(1)
                            amount_str = match.group(2)
                        elif i == 2:  # 数字 + RM
                            amount_str = match.group(1)
                            currency_symbol = match.group(2)
                        elif i == 3:  # 数字 + 通貨記号
                            amount_str = match.group(1)
                            currency_symbol = match.group(2)
                        elif i == 4:  # Total行
                            currency_symbol = match.group(1)
                            amount_str = match.group(2)
                        elif i == 5:  # 通貨コード
                            amount_str = match.group(1)
                            currency_symbol = match.group(2)
                        
                        if amount_str:
                            amount = float(amount_str)
                            currency = self.currency_symbols.get(currency_symbol, currency_symbol) if currency_symbol else "UNKNOWN"
                            
                            amounts.append({
                                "amount": amount,
                                "currency": currency,
                                "symbol": currency_symbol,
                                "position": match.start(),
                                "context": text[max(0, match.start()-20):match.end()+20],
                                "pattern_used": i
                            })
                            
                            self.logger.debug(f"金額検出: {amount} {currency} (パターン{i})")
                    except (ValueError, AttributeError) as e:
                        self.logger.debug(f"金額抽出エラー: {str(e)}, マッチ: {match.groups()}")
                        continue
            
            # 重複を除去（同じ位置の金額は最初のもののみ）
            unique_amounts = []
            seen_positions = set()
            seen_amounts = set()
            
            for amount in amounts:
                # 位置と金額の組み合わせで重複チェック
                amount_key = (amount["position"], amount["amount"], amount["currency"])
                
                if amount_key not in seen_amounts:
                    unique_amounts.append(amount)
                    seen_amounts.add(amount_key)
                    seen_positions.add(amount["position"])
            
            self.logger.info(f"金額抽出成功: {len(unique_amounts)}個の金額を検出")
            
            return unique_amounts
            
        except Exception as e:
            self.logger.error(f"金額抽出に失敗しました: {str(e)}")
            return []
    
    def detect_currencies(self, text: str) -> List[str]:
        """テキストから通貨を検出"""
        try:
            detected_currencies = []
            
            # 通貨記号を検索
            for symbol, currency in self.currency_symbols.items():
                if symbol in text:
                    detected_currencies.append(currency)
            
            # 通貨コードを検索
            currency_codes = ["USD", "EUR", "THB", "KRW", "JPY", "CNY", "MYR"]
            for code in currency_codes:
                if code in text.upper():
                    detected_currencies.append(code)
            
            # 重複を除去
            unique_currencies = list(set(detected_currencies))
            
            self.logger.info(f"通貨検出成功: {unique_currencies}")
            
            return unique_currencies
            
        except Exception as e:
            self.logger.error(f"通貨検出に失敗しました: {str(e)}")
            return []
    
    def convert_currencies(self, amounts: List[Dict[str, Any]], currencies: List[str]) -> List[Dict[str, Any]]:
        """通貨を日本円に換算"""
        try:
            conversions = []
            
            # 為替レートを取得
            exchange_rates = self._get_exchange_rates()
            
            for amount_data in amounts:
                amount = amount_data["amount"]
                currency = amount_data["currency"]
                
                # 為替レートを取得
                rate = exchange_rates.get(currency, 1.0)
                
                # 日本円に換算
                jpy_amount = amount * rate
                
                conversion = {
                    "original_amount": amount,
                    "original_currency": currency,
                    "jpy_amount": round(jpy_amount, 2),
                    "exchange_rate": rate,
                    "conversion_date": datetime.now().isoformat(),
                    "context": amount_data.get("context", "")
                }
                
                conversions.append(conversion)
            
            self.logger.info(f"通貨換算成功: {len(conversions)}個の金額を換算")
            
            return conversions
            
        except Exception as e:
            self.logger.error(f"通貨換算に失敗しました: {str(e)}")
            return []
    
    def _get_exchange_rates(self) -> Dict[str, float]:
        """為替レートを取得"""
        try:
            # 無料APIから為替レートを取得
            response = requests.get(f"{self.api_url}{self.base_currency}")
            
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                
                # 必要な通貨のレートのみを抽出
                filtered_rates = {}
                for currency in self.target_currencies:
                    if currency in rates:
                        # 為替レートの妥当性をチェック
                        rate = rates[currency]
                        if self._is_valid_rate(currency, rate):
                            filtered_rates[currency] = rate
                        else:
                            self.logger.warning(f"為替レートが異常値のためフォールバックを使用: {currency} = {rate}")
                            filtered_rates[currency] = self.fallback_rates.get(currency, 1.0)
                
                self.logger.info(f"為替レート取得成功: {filtered_rates}")
                return filtered_rates
            
            else:
                self.logger.warning(f"為替レートAPIエラー: {response.status_code}")
                return self.fallback_rates
                
        except Exception as e:
            self.logger.warning(f"為替レート取得に失敗、フォールバックレートを使用: {str(e)}")
            return self.fallback_rates
    
    def _is_valid_rate(self, currency: str, rate: float) -> bool:
        """為替レートの妥当性をチェック"""
        # 通貨ごとの妥当な範囲を定義
        valid_ranges = {
            "USD": (100, 200),    # 1 USD = 100-200 JPY
            "EUR": (120, 180),    # 1 EUR = 120-180 JPY
            "THB": (3, 6),        # 1 THB = 3-6 JPY
            "KRW": (0.08, 0.15),  # 1 KRW = 0.08-0.15 JPY
            "CNY": (15, 25),      # 1 CNY = 15-25 JPY
            "MYR": (25, 40),      # 1 MYR = 25-40 JPY
        }
        
        if currency in valid_ranges:
            min_rate, max_rate = valid_ranges[currency]
            return min_rate <= rate <= max_rate
        
        return True  # 範囲が定義されていない通貨はそのまま使用
    
    def get_comparison_message(self, jpy_amount: float) -> str:
        """日本円での感覚値比較メッセージを生成"""
        try:
            comparisons = []
            
            # 日本の価格との比較
            if jpy_amount >= 100:
                mcdonalds_count = int(jpy_amount / 500)  # マクドナルドハンバーガー約500円
                if mcdonalds_count > 0:
                    comparisons.append(f"日本のマクドナルドハンバーガー{mcdonalds_count}個分")
            
            if jpy_amount >= 50:
                coffee_count = int(jpy_amount / 300)  # コーヒー約300円
                if coffee_count > 0:
                    comparisons.append(f"日本のコーヒー{coffee_count}杯分")
            
            if jpy_amount >= 200:
                train_count = int(jpy_amount / 200)  # 電車賃約200円
                if train_count > 0:
                    comparisons.append(f"日本の電車賃{train_count}回分")
            
            if comparisons:
                return f"これは{', '.join(comparisons)}の価格です"
            else:
                return f"これは約{jpy_amount}円の価格です"
                
        except Exception as e:
            self.logger.error(f"比較メッセージ生成に失敗: {str(e)}")
            return f"約{jpy_amount}円の価格です"
