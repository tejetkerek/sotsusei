"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCurrency = exports.analyzeReceipt = void 0;
const functions = require("firebase-functions");
const generative_ai_1 = require("@google/generative-ai");
// Gemini API の初期化
const genAI = new generative_ai_1.GoogleGenerativeAI(((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.GEMINI_API_KEY || '');
// レシート分析関数
exports.analyzeReceipt = functions.https.onCall(async (data, context) => {
    try {
        // 認証チェック
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
        }
        const { imageBase64, mimeType = 'image/jpeg' } = data;
        if (!imageBase64) {
            throw new functions.https.HttpsError('invalid-argument', '画像データが必要です');
        }
        // Gemini Pro Vision モデルを取得
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        // レシート分析のプロンプト
        const prompt = `
    このレシート画像を分析して、以下の情報をJSON形式で抽出してください：

    1. 店舗名 (storeName)
    2. 日付 (date) - YYYY-MM-DD形式
    3. 通貨 (currency) - 3文字の通貨コード (JPY, USD, EUR等)
    4. 合計金額 (totalAmount) - 数値のみ
    5. 場所 (location) - 都市名や国名
    6. 商品リスト (items) - 商品名と価格の配列
    7. カテゴリ (category) - food, transport, shopping, entertainment, other のいずれか

    レスポンスは以下のJSON形式で返してください：
    {
      "storeName": "店舗名",
      "date": "2024-01-01",
      "currency": "JPY",
      "totalAmount": 1000,
      "location": "東京, 日本",
      "items": [
        {"name": "商品名", "price": 500},
        {"name": "商品名", "price": 500}
      ],
      "category": "food"
    }
    `;
        // Gemini API を呼び出し
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                }
            }
        ]);
        const response = await result.response;
        const text = response.text();
        // JSON レスポンスをパース
        let analysis;
        try {
            // JSON部分を抽出（```json と ``` の間の部分）
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : text;
            analysis = JSON.parse(jsonString);
        }
        catch (parseError) {
            console.error('JSON解析エラー:', parseError);
            console.log('Gemini レスポンス:', text);
            // フォールバック: 基本的な情報を抽出
            analysis = {
                storeName: 'Unknown Store',
                date: new Date().toISOString().split('T')[0],
                currency: 'JPY',
                totalAmount: 0,
                location: 'Unknown Location',
                items: [],
                category: 'other'
            };
        }
        // 日本円換算を計算
        const exchangeRates = {
            'JPY': 1,
            'USD': 150,
            'EUR': 160,
            'GBP': 190,
            'AUD': 100,
            'CAD': 110,
            'CHF': 170,
            'CNY': 20,
            'KRW': 0.11,
            'SGD': 110,
            'THB': 4.2,
            'MYR': 32,
            'IDR': 0.01,
            'PHP': 2.7,
            'VND': 0.006,
            'INR': 1.8
        };
        const jpyAmount = Math.round(analysis.totalAmount * (exchangeRates[analysis.currency] || 1));
        return {
            success: true,
            analysis: Object.assign(Object.assign({}, analysis), { jpyAmount: jpyAmount })
        };
    }
    catch (error) {
        console.error('レシート分析エラー:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'レシートの分析に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
    }
});
// 通貨換算関数
exports.convertCurrency = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
        }
        const { amount, fromCurrency, toCurrency = 'JPY' } = data;
        if (!amount || !fromCurrency) {
            throw new functions.https.HttpsError('invalid-argument', '金額と通貨が必要です');
        }
        const exchangeRates = {
            'JPY': 1,
            'USD': 150,
            'EUR': 160,
            'GBP': 190,
            'AUD': 100,
            'CAD': 110,
            'CHF': 170,
            'CNY': 20,
            'KRW': 0.11,
            'SGD': 110,
            'THB': 4.2,
            'MYR': 32,
            'IDR': 0.01,
            'PHP': 2.7,
            'VND': 0.006,
            'INR': 1.8
        };
        const fromRate = exchangeRates[fromCurrency] || 1;
        const toRate = exchangeRates[toCurrency] || 1;
        const convertedAmount = Math.round((amount / fromRate) * toRate);
        return {
            success: true,
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount: convertedAmount,
            convertedCurrency: toCurrency
        };
    }
    catch (error) {
        console.error('通貨換算エラー:', error);
        throw new functions.https.HttpsError('internal', '通貨換算に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
    }
});
//# sourceMappingURL=index.js.map