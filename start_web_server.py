#!/usr/bin/env python3
"""
Web UI サーバー起動スクリプト
海外支出ガイド MVP の結果をWebブラウザで表示するためのローカルサーバー
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def start_web_server(port=8000):
    """Webサーバーを起動"""
    
    # プロジェクトルートディレクトリを取得
    project_root = Path(__file__).parent.absolute()
    web_ui_dir = project_root / "web_ui"
    
    print(f"🔍 プロジェクトルート: {project_root}")
    print(f"🔍 Web UIディレクトリ: {web_ui_dir}")
    print(f"🔍 現在の作業ディレクトリ: {os.getcwd()}")
    
    # web_uiディレクトリが存在するかチェック
    if not web_ui_dir.exists():
        print("❌ web_uiディレクトリが見つかりません")
        print("   以下のファイルが必要です:")
        print("   - web_ui/index.html")
        print("   - web_ui/style.css")
        print("   - web_ui/script.js")
        return False
    
    # 作業ディレクトリをプロジェクトルートに設定
    os.chdir(project_root)
    print(f"🔍 作業ディレクトリを変更: {os.getcwd()}")
    
    # HTTPサーバーを設定
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print("🌍 海外支出ガイド MVP Web UI サーバー")
            print("=" * 50)
            print(f"📡 サーバー起動: http://localhost:{port}")
            print(f"📁 ディレクトリ: {web_ui_dir}")
            print("=" * 50)
            print("🚀 ブラウザで自動的に開きます...")
            print("⏹️  停止するには Ctrl+C を押してください")
            print()
            
            # ブラウザで自動的に開く
            webbrowser.open(f"http://localhost:{port}")
            
            # サーバーを開始
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ ポート {port} は既に使用されています")
            print(f"   別のポートを試してください: python start_web_server.py {port + 1}")
        else:
            print(f"❌ サーバー起動エラー: {e}")
        return False
    except KeyboardInterrupt:
        print("\n⏹️  サーバーを停止しました")
        return True

def main():
    """メイン関数"""
    port = 8000
    
    # コマンドライン引数でポートを指定可能
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ ポート番号は数値で指定してください")
            print("   例: python start_web_server.py 8080")
            return
    
    print("🌍 海外支出ガイド MVP Web UI")
    print("=" * 30)
    
    # 必要なファイルの存在確認
    required_files = [
        "web_ui/index.html",
        "web_ui/style.css", 
        "web_ui/script.js"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ 必要なファイルが見つかりません:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return
    
    # resultsディレクトリの確認
    results_dir = Path("results")
    if not results_dir.exists():
        print("⚠️  resultsディレクトリが見つかりません")
        print("   先に python main.py を実行してレシート処理を行ってください")
        return
    
    # サマリーファイルの確認
    summary_file = results_dir / "test_receipt_001_summary.json"
    if not summary_file.exists():
        print("⚠️  結果ファイルが見つかりません")
        print("   先に python main.py を実行してレシート処理を行ってください")
        return
    
    print("✅ 必要なファイルが確認できました")
    print()
    
    # サーバーを起動
    start_web_server(port)

if __name__ == "__main__":
    main()
