// 共通ナビゲーション機能
class NavigationManager {
    constructor() {
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.createHeader();
        this.createFooter();
        this.bindEvents();
        this.updateLoginStatus();
    }

    createHeader() {
        // 既存のヘッダーを確認
        const existingHeader = document.querySelector('.navigation-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        // 新しいヘッダーを作成
        const header = document.createElement('div');
        header.className = 'navigation-header bg-slate-900 text-white px-4 py-3 text-center text-sm fixed top-0 left-0 right-0 z-50';
        header.innerHTML = `
            <div class="flex items-center justify-end">
                <button id="menuToggle" class="p-2 hover:bg-slate-800 rounded transition-colors">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
            
            <!-- ドロップダウンメニュー -->
            <div id="dropdownMenu" class="absolute top-full right-0 bg-white shadow-lg border border-gray-200 rounded-lg hidden z-50 min-w-48">
                <div class="py-2">
                    <div id="loginMenuItem" class="block px-4 py-3 text-slate-800 hover:bg-slate-50 border-b border-slate-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                            </svg>
                            <span id="loginMenuText" class="text-sm sm:text-base whitespace-nowrap">ログイン</span>
                        </div>
                    </div>
                    <a href="registration_step1.html" class="block px-4 py-3 text-slate-800 hover:bg-slate-50 border-b border-slate-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            <span class="text-sm sm:text-base whitespace-nowrap">レシート登録</span>
                        </div>
                    </a>
                    <a href="registration_step3.html" class="block px-4 py-3 text-slate-800 hover:bg-slate-50 border-b border-slate-200">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            <span class="text-sm sm:text-base whitespace-nowrap">サマリ</span>
                        </div>
                    </a>
                    <a href="all_receipts.html" class="block px-4 py-3 text-slate-800 hover:bg-slate-50">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-3 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span class="text-sm sm:text-base whitespace-nowrap">レシート一覧</span>
                        </div>
                    </a>
                </div>
            </div>
        `;

        // ヘッダーをbodyの最初に追加
        document.body.insertBefore(header, document.body.firstChild);
    }

    createFooter() {
        // 既存のフッターを確認
        const existingFooter = document.querySelector('.navigation-footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        // シンプルなフッターを作成
        const footer = document.createElement('div');
        footer.className = 'navigation-footer bg-slate-50 text-slate-600 py-2 px-4 text-center text-xs border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40';
        footer.innerHTML = `
            © 2024 Overseas Receipt Master. All rights reserved.
        `;

        // フッターをbodyに追加
        document.body.appendChild(footer);
    }

    bindEvents() {
        const menuToggle = document.getElementById('menuToggle');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (menuToggle && dropdownMenu) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // メニュー外をクリックしたら閉じる
            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // メニュー項目をクリックしたら閉じる
            dropdownMenu.addEventListener('click', (e) => {
                if (e.target.closest('a')) {
                    this.closeMenu();
                }
            });
        }
    }

    toggleMenu() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) {
            this.isMenuOpen = !this.isMenuOpen;
            if (this.isMenuOpen) {
                dropdownMenu.classList.remove('hidden');
            } else {
                dropdownMenu.classList.add('hidden');
            }
        }
    }

    closeMenu() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) {
            this.isMenuOpen = false;
            dropdownMenu.classList.add('hidden');
        }
    }

    updateLoginStatus() {
        const loginMenuItem = document.getElementById('loginMenuItem');
        const loginMenuText = document.getElementById('loginMenuText');
        
        if (!loginMenuItem || !loginMenuText) return;
        
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        
        if (isLoggedIn && userEmail) {
            // ログイン中の表示
            loginMenuItem.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center flex-1 min-w-0">
                        <svg class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-medium text-slate-800 whitespace-nowrap">ログイン中</div>
                            <div class="text-xs text-slate-500 truncate">${userEmail}</div>
                        </div>
                    </div>
                    <button id="logoutBtn" class="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded border border-amber-600 hover:bg-amber-50 whitespace-nowrap flex-shrink-0">
                        ログアウト
                    </button>
                </div>
            `;
            
            // ログアウトボタンのイベントリスナーを追加
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            const firebaseModule = await import('./firebase-config.js');
                            await firebaseModule.forceLogout();
                        } catch (error) {
                            console.error('ログアウトエラー:', error);
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.href = 'login.html';
                        }
                    });
                }
            }, 100);
        } else {
            // 未ログインの表示
            loginMenuItem.innerHTML = `
                <a href="login.html" class="flex items-center">
                    <svg class="w-5 h-5 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    <span>ログイン</span>
                </a>
            `;
        }
    }
}


// ページ読み込み時にナビゲーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
    window.navigationManager = new NavigationManager();
    
    // Firebase認証状態の変化を監視
    try {
        const firebaseModule = await import('./firebase-config.js');
        if (firebaseModule.auth) {
            firebaseModule.auth.onAuthStateChanged((user) => {
                if (window.navigationManager) {
                    window.navigationManager.updateLoginStatus();
                }
            });
        }
    } catch (error) {
        console.log('Firebase認証監視の初期化に失敗:', error);
    }
    
    // localStorageの変化を監視
    window.addEventListener('storage', (e) => {
        if (e.key === 'isLoggedIn' || e.key === 'userEmail') {
            if (window.navigationManager) {
                window.navigationManager.updateLoginStatus();
            }
        }
    });
});
