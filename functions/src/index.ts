import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase-admin/app';

// Firebase Admin SDK を初期化
initializeApp();

// Gemini API の初期化（新しいAPIキーを使用）
const genAI = new GoogleGenerativeAI('AQ.Ab8RN6LhE-nMN_Nui3RcNUGPZ9wBoYyyKuVRjGLTQXRsVhslLA');

// レシート分析関数
export const analyzeReceipt = functions.https.onCall(async (data, context) => {
  try {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }

    const { imageBase64, mimeType = 'image/jpeg' } = data;

    if (!imageBase64) {
      throw new functions.https.HttpsError('invalid-argument', '画像データが必要です');
    }

    // 利用可能なモデルを確認
    console.log('GoogleGenerativeAI インスタンス:', genAI);
    console.log('利用可能なメソッド:', Object.getOwnPropertyNames(genAI));
    
    // Gemini Pro Vision モデルを取得（古いバージョンを使用）
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // レシート分析のプロンプト
    const prompt = `
    このレシート画像を分析して、以下の情報をJSON形式で抽出してください：

    1. 店舗名 (storeName)
    2. 日付 (date) - YYYY-MM-DD形式
    3. 通貨 (currency) - レシートに表示されている通貨記号や通貨名から自動判定してください
       - ¥, 円, JPY → "JPY"
       - $, USD, Dollar → "USD" 
       - €, EUR, Euro → "EUR"
       - £, GBP, Pound → "GBP"
       - RM, Ringgit → "MYR"
       - その他の通貨記号があれば適切な3文字コードに変換
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
      "jpyAmount": 1000,
      "exchangeRate": 1.0,
      "location": "東京, 日本",
      "items": [
        {"name": "商品名", "price": 500},
        {"name": "商品名", "price": 500}
      ],
      "category": "food"
    }

    注意：
    - jpyAmount: 日本円換算額（通貨がJPYでない場合は、現在の為替レートで日本円に換算してください）
    - exchangeRate: 使用した為替レート（1通貨あたりの日本円）
    - 通貨がJPYの場合は jpyAmount = totalAmount, exchangeRate = 1.0
    - 外国通貨の場合は、現在の為替レートを使用して正確な日本円換算額を計算してください
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
    } catch (parseError) {
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

    // Geminiが計算した日本円換算額を使用
    // もしGeminiが計算していない場合は、フォールバック処理
    let jpyAmount = analysis.jpyAmount;
    let exchangeRate = analysis.exchangeRate;
    
    if (!jpyAmount || jpyAmount === 0) {
      // フォールバック: 手動計算（Geminiが換算に失敗した場合）
      const exchangeRates: { [key: string]: number } = {
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
      
      if (exchangeRates[analysis.currency]) {
        // 対応通貨の場合
        exchangeRate = exchangeRates[analysis.currency];
        jpyAmount = Math.round(analysis.totalAmount * exchangeRate);
      } else {
        // 非対応通貨の場合
        console.warn(`未対応通貨のため日本円換算をスキップ: ${analysis.currency} ${analysis.totalAmount}`);
        exchangeRate = 1;
        jpyAmount = analysis.totalAmount; // 元金額をそのまま表示
      }
    }

    return {
      success: true,
      analysis: {
        ...analysis,
        jpyAmount: jpyAmount,
        exchangeRate: exchangeRate
      }
    };

  } catch (error) {
    console.error('レシート分析エラー:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'レシートの分析に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
  }
});

// 通貨換算関数
export const convertCurrency = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }

    const { amount, fromCurrency, toCurrency = 'JPY' } = data;

    if (!amount || !fromCurrency) {
      throw new functions.https.HttpsError('invalid-argument', '金額と通貨が必要です');
    }

    const exchangeRates: { [key: string]: number } = {
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

  } catch (error) {
    console.error('通貨換算エラー:', error);
    throw new functions.https.HttpsError('internal', '通貨換算に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
  }
});
