// 結果データを読み込んで表示するJavaScript

class ReceiptResultViewer {
    constructor() {
        this.data = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.displayData();
        } catch (error) {
            this.showError('データの読み込みに失敗しました: ' + error.message);
        }
    }

    async loadData() {
        // 最新のサマリーファイルを読み込み
        const response = await fetch('/results/test_receipt_001_summary.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.data = await response.json();
    }

    displayData() {
        this.hideLoading();
        this.displayReceiptInfo();
        this.displayExtractedText();
        this.displayCurrencyConversion();
        this.displayProcessingPhases();
        this.showContent();
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showContent() {
        document.getElementById('content').style.display = 'block';
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error-message').textContent = message;
    }

    displayReceiptInfo() {
        document.getElementById('receipt-id').textContent = this.data.receipt_id || '-';
        
        const processedAt = this.data.processed_at ? 
            new Date(this.data.processed_at).toLocaleString('ja-JP') : '-';
        document.getElementById('processed-at').textContent = processedAt;
        
        const statusElement = document.getElementById('status');
        statusElement.textContent = this.data.status || '-';
        statusElement.className = `status-badge ${this.data.status || ''}`;
    }

    displayExtractedText() {
        const extractedData = this.data.extracted_data || {};
        
        document.getElementById('original-text').textContent = 
            extractedData.original_text || 'データなし';
        
        document.getElementById('translated-text').textContent = 
            extractedData.translated_text || 'データなし';
    }

    displayCurrencyConversion() {
        const extractedData = this.data.extracted_data || {};
        const conversions = extractedData.conversions || [];
        
        // 合計金額を表示
        const totalJpy = extractedData.total_jpy || 0;
        document.getElementById('total-jpy').textContent = 
            this.formatCurrency(totalJpy);
        
        // 詳細リストを表示
        const conversionList = document.getElementById('conversion-list');
        conversionList.innerHTML = '';
        
        if (conversions.length === 0) {
            conversionList.innerHTML = '<p style="color: #718096; text-align: center;">換算データがありません</p>';
            return;
        }
        
        conversions.forEach((conversion, index) => {
            const item = document.createElement('div');
            item.className = 'conversion-item';
            
            item.innerHTML = `
                <div class="amount">
                    ${this.formatCurrency(conversion.original_amount)} ${conversion.original_currency}
                    <br>
                    <small>→ ${this.formatCurrency(conversion.jpy_amount)} 円</small>
                </div>
                <div class="currency">
                    レート: ${conversion.exchange_rate}
                    <br>
                    <small>${new Date(conversion.conversion_date).toLocaleString('ja-JP')}</small>
                </div>
                <div class="context">
                    ${this.truncateText(conversion.context, 50)}
                </div>
            `;
            
            conversionList.appendChild(item);
        });
    }

    displayProcessingPhases() {
        const phases = this.data.phases || {};
        const phasesList = document.getElementById('phases-list');
        phasesList.innerHTML = '';
        
        Object.entries(phases).forEach(([phaseKey, phaseData]) => {
            const item = document.createElement('div');
            item.className = 'phase-item';
            
            const successRate = phaseData.step_count > 0 ? 
                Math.round((phaseData.success_count / phaseData.step_count) * 100) : 0;
            
            item.innerHTML = `
                <div class="phase-header">
                    <div class="phase-name">${phaseData.name}</div>
                    <div class="phase-status ${phaseData.status}">${phaseData.status}</div>
                </div>
                <div class="phase-stats">
                    ステップ: ${phaseData.success_count}/${phaseData.step_count} 
                    (成功率: ${successRate}%)
                </div>
            `;
            
            phasesList.appendChild(item);
        });
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') return '0';
        return new Intl.NumberFormat('ja-JP', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    new ReceiptResultViewer();
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = 
        '予期しないエラーが発生しました: ' + event.error.message;
});

// ネットワークエラーハンドリング
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = 
        'ネットワークエラーが発生しました: ' + event.reason;
});
