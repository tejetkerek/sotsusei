"""
設定ファイル管理モジュール
"""

import yaml
import os
from pathlib import Path
from typing import Dict, Any
import logging

class ConfigManager:
    """YAML設定ファイルの管理クラス"""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.logger = logging.getLogger(__name__)
        
    def load_config(self) -> Dict[str, Any]:
        """設定ファイルを読み込み"""
        try:
            config_file = Path(self.config_path)
            
            if not config_file.exists():
                raise FileNotFoundError(f"設定ファイルが見つかりません: {self.config_path}")
            
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            self.logger.info(f"設定ファイルを読み込みました: {self.config_path}")
            return config
            
        except Exception as e:
            self.logger.error(f"設定ファイルの読み込みに失敗しました: {str(e)}")
            raise
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """設定の妥当性を検証"""
        required_keys = ['project', 'google_apis', 'currency', 'processing_flow', 'output']
        
        for key in required_keys:
            if key not in config:
                self.logger.error(f"必須設定が見つかりません: {key}")
                return False
        
        self.logger.info("設定の妥当性検証が完了しました")
        return True
    
    def get_api_key(self, api_name: str) -> str:
        """環境変数からAPIキーを取得"""
        config = self.load_config()
        
        if api_name not in config['google_apis']:
            raise ValueError(f"API設定が見つかりません: {api_name}")
        
        env_key = config['google_apis'][api_name]['api_key_env']
        api_key = os.getenv(env_key)
        
        if not api_key:
            raise ValueError(f"環境変数 {env_key} が設定されていません")
        
        return api_key
