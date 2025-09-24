// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzZk0qF1tBl4Pb_mhsjsU6m7dw1QoT3mM",
  authDomain: "sotsusei-new.firebaseapp.com",
  projectId: "sotsusei-new",
  storageBucket: "sotsusei-new.firebasestorage.app",
  messagingSenderId: "1091798051561",
  appId: "1:1091798051561:web:a4e3e4268fe0d175b5de78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// 認証状態の監視
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('ユーザーがログインしています:', user.email);
    // ログイン状態をlocalStorageに保存
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('isLoggedIn', 'true');
  } else {
    console.log('ユーザーがログアウトしています');
    // ログアウト状態をlocalStorageに保存
    localStorage.removeItem('userEmail');
    localStorage.setItem('isLoggedIn', 'false');
  }
});

// Import additional functions
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

// Firestore関数の動的インポート
let firestoreFunctions = null;
async function loadFirestoreFunctions() {
  if (!firestoreFunctions) {
    try {
      const firestoreModule = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");
      firestoreFunctions = {
        collection: firestoreModule.collection,
        addDoc: firestoreModule.addDoc,
        getDocs: firestoreModule.getDocs,
        doc: firestoreModule.doc,
        setDoc: firestoreModule.setDoc,
        getDoc: firestoreModule.getDoc
      };
      console.log('Firestore関数の読み込みが完了しました');
      console.log('利用可能なFirestore関数:', Object.keys(firestoreFunctions));
    } catch (error) {
      console.error('Firestore関数の読み込みエラー:', error);
    }
  }
  return firestoreFunctions;
}

// 会員登録機能
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('登録成功:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('登録エラー:', error);
      throw error;
    });
}

// ログイン機能
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('ログイン成功:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('ログインエラー:', error);
      throw error;
    });
}

// テストアカウント作成機能
export async function createTestAccount() {
  try {
    const email = 'admin@test.com';
    const password = 'testtest';
    
    // 直接アカウント作成を試行（既存の場合はエラーになる）
    console.log('テストアカウントを作成中...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('テストアカウント作成成功:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('テストアカウントは既に存在します');
      return null;
    } else {
      console.error('テストアカウント作成エラー:', error);
      throw error;
    }
  }
}

// ログアウト機能
export function logoutUser() {
  return signOut(auth)
    .then(() => {
      console.log('ログアウト成功');
    })
    .catch((error) => {
      console.error('ログアウトエラー:', error);
      throw error;
    });
}

// ダミーデータ初期化を無効化（実際のFirestoreデータを使用）
export async function initializeDummyData() {
  console.log('ダミーデータ初期化は無効化されています。実際のFirestoreデータを使用します。');
  return [];
}

// ユーザーのレシートデータを取得（削除フラグが立っていないもののみ）
export async function getUserReceipts() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const snapshot = await getDocs(receiptsRef);
    const receipts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // 削除フラグが立っていないレシートのみを返す
      if (!data.isDeleted) {
        const receiptData = { 
          id: doc.id,  // Firestoreの実際のドキュメントID
          firestoreId: doc.id,  // 削除時に使用するID
          ...data 
        };
        
        // デバッグ: 日付が不明のレシートの詳細をログ出力
        if (doc.id === 'VP76EZ3OUH3BY1f3F9F3') {
          console.log('Firestoreから読み込まれたレシートデータ:', {
            docId: doc.id,
            data: data,
            receiptData: receiptData,
            transaction: data.transaction,
            date: data.date
          });
        }
        
        receipts.push(receiptData);
      }
    });
    console.log(`Firestoreから${receipts.length}件のレシートを取得しました`);
    return receipts;
  } catch (error) {
    console.error('レシートデータ取得エラー:', error);
    throw error;
  }
}

// レシート画像をStorageにアップロード
export async function uploadReceiptImage(file, receiptId) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    const storageRef = ref(storage, `receipts/${user.uid}/${receiptId}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw error;
  }
}

// JSONデータをFirebaseに保存
export async function saveReceiptFromJSON(jsonData) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    // JSONデータをレシート形式に変換（改善された構造）
    const receiptData = {
      // 基本情報
      id: jsonData.receipt_id || `receipt_${Date.now()}`,
      imageUrl: jsonData.image_url || null,
      
      // 店舗情報
      store: {
        name: jsonData.extracted_data.storeName || extractStoreName(jsonData.extracted_data.translated_text),
        location: jsonData.extracted_data.location || extractLocation(jsonData.extracted_data.translated_text)
      },
      
      // 取引情報
      transaction: {
        date: jsonData.extracted_data.date || extractDate(jsonData.extracted_data.translated_text),
        currency: jsonData.extracted_data.currency || jsonData.extracted_data.conversions[0]?.original_currency || 'JPY',
        amount: jsonData.extracted_data.totalAmount || jsonData.extracted_data.conversions[0]?.original_amount || 0,
        jpyAmount: jsonData.extracted_data.jpyAmount || jsonData.extracted_data.total_jpy || 0,
        exchangeRate: jsonData.extracted_data.conversions[0]?.exchange_rate || 32.0
      },
      
      // 商品情報
      items: jsonData.extracted_data.items || extractItems(jsonData.extracted_data.translated_text),
      
      // 分類情報
      category: jsonData.extracted_data.category || 'food',
      
      // 処理情報
      processing: {
        processedAt: jsonData.processed_at || new Date().toISOString(),
        originalText: jsonData.extracted_data.original_text,
        translatedText: jsonData.extracted_data.translated_text,
        confidence: jsonData.confidence || 0.95
      },
      
      // ステータス
      status: {
        confirmed: false,
        confirmedAt: null,
        confirmedBy: null
      },
      
      // メタデータ
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Firestoreに保存
    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const docRef = await addDoc(receiptsRef, receiptData);
    
    console.log('JSONデータがFirebaseに保存されました:', docRef.id);
    return { id: docRef.id, ...receiptData };
  } catch (error) {
    console.error('JSONデータ保存エラー:', error);
    throw error;
  }
}

// 未処理のレシート一覧を取得
export async function getUnprocessedReceipts() {
  let user = auth.currentUser;
  
  // ユーザーがログインしていない場合は匿名ログインを試行
  if (!user) {
    try {
      console.log('ユーザーがログインしていません。既存ユーザーでログインを試行します...');
      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js");
      const result = await signInWithEmailAndPassword(auth, 'admin@test.com', 'password123');
      user = result.user;
      console.log('既存ユーザーログイン成功:', user.email);
    } catch (authError) {
      console.error('既存ユーザーログインエラー:', authError);
      throw new Error('認証に失敗しました: ' + authError.message);
    }
  }

  console.log('getUnprocessedReceipts実行時のユーザー:', user?.email || user?.uid);

  try {
    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const querySnapshot = await getDocs(receiptsRef);
    
    const receipts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`レシート ${doc.id}: confirmed = ${data.status?.confirmed} (type: ${typeof data.status?.confirmed})`);
      
      // 確認済みフラグが明示的にtrueでないレシートのみを取得
      if (data.status?.confirmed !== true) {
        receipts.push({
          id: doc.id,
          ...data
        });
      } else {
        console.log(`レシート ${doc.id} は確認済みのため除外`);
      }
    });
    
    // 作成日時でソート（新しい順）
    receipts.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
    
    console.log('未処理レシート一覧:', receipts);
    return receipts;
  } catch (error) {
    console.error('レシート取得エラー:', error);
    throw error;
  }
}

// レシートを確認済みにマーク（更新されたデータも含めて）
export async function markReceiptAsConfirmed(receiptId, updatedData = null) {
  let user = auth.currentUser;
  
  // ユーザーがログインしていない場合は匿名ログインを試行
  if (!user) {
    try {
      console.log('ユーザーがログインしていません。既存ユーザーでログインを試行します...');
      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js");
      const result = await signInWithEmailAndPassword(auth, 'admin@test.com', 'password123');
      user = result.user;
      console.log('既存ユーザーログイン成功:', user.email);
    } catch (authError) {
      console.error('既存ユーザーログインエラー:', authError);
      throw new Error('認証に失敗しました: ' + authError.message);
    }
  }

  console.log('markReceiptAsConfirmed実行時のユーザー:', user?.email || user?.uid);

  try {
    const receiptRef = doc(db, 'users', user.uid, 'receipts', receiptId);
    
    // 基本の確認済みデータ（新しい構造）
    const confirmData = {
      status: {
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: user.uid
      },
      metadata: {
        updatedAt: new Date().toISOString()
      }
    };
    
    // 更新されたデータがある場合は追加
    if (updatedData) {
      // 店舗情報の更新
      if (updatedData.storeName) {
        confirmData.store = {
          name: updatedData.storeName,
          location: updatedData.location || ''
        };
      }
      
      // 取引情報の更新
      if (updatedData.totalAmount || updatedData.currency) {
        confirmData.transaction = {
          amount: updatedData.totalAmount || 0,
          currency: updatedData.currency || 'JPY',
          jpyAmount: updatedData.jpyAmount || 0
        };
      }
      
      // 分類情報の更新
      if (updatedData.category) {
        confirmData.category = updatedData.category;
      }
      
      console.log('更新されたデータを保存:', updatedData);
    }
    
    console.log('確認済みデータを保存:', confirmData);
    await setDoc(receiptRef, confirmData, { merge: true });
    
    console.log('レシートを確認済みにマークしました:', receiptId);
    return true;
  } catch (error) {
    console.error('レシート更新エラー:', error);
    throw error;
  }
}

// ヘルパー関数: 店舗名を抽出
function extractStoreName(text) {
  if (!text) return 'Unknown Store';
  
  // JSONデータから直接店舗名を抽出する場合
  try {
    const jsonMatch = text.match(/"storeName":"([^"]+)"/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
  } catch (e) {
    console.log('JSON抽出失敗:', e);
  }
  
  // テキストから店舗名を抽出
  const lines = text.split('\n');
  for (let line of lines) {
    // 店舗名らしいパターンを検索
    if (line.includes('セブン-イレブン') || line.includes('7-Eleven') || 
        line.includes('ファミマ') || line.includes('FamilyMart') ||
        line.includes('ローソン') || line.includes('Lawson')) {
      return line.trim();
    }
  }
  
  // デフォルト: 最初の行
  return lines[0] || 'Unknown Store';
}

// ヘルパー関数: 日付を抽出
function extractDate(text) {
  if (!text) return new Date().toISOString().split('T')[0];
  
  // JSONデータから直接日付を抽出する場合
  try {
    const jsonMatch = text.match(/"date":"([^"]+)"/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
  } catch (e) {
    console.log('JSON日付抽出失敗:', e);
  }
  
  // テキストから日付を抽出
  const dateMatch = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  
  // その他の日付パターン
  const otherDateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (otherDateMatch) {
    return otherDateMatch[1];
  }
  
  return new Date().toISOString().split('T')[0];
}

// ヘルパー関数: 場所を抽出
function extractLocation(text) {
  if (!text) return 'Unknown Location';
  
  // JSONデータから直接場所を抽出する場合
  try {
    const jsonMatch = text.match(/"location":"([^"]+)"/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
  } catch (e) {
    console.log('JSON場所抽出失敗:', e);
  }
  
  // テキストから場所を抽出
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 日本の地名パターン
    if (line.includes('藤沢') || line.includes('神奈川') || line.includes('県')) {
      return line.trim();
    }
    // マレーシアの地名パターン
    if (line.includes('Kuala Lumpur') || line.includes('Malaysia')) {
      return 'クアラルンプール';
    }
    // その他の地名パターン
    if (line.includes('市') || line.includes('区') || line.includes('町')) {
      return line.trim();
    }
  }
  return 'Unknown Location';
}

// ヘルパー関数: 商品を抽出
function extractItems(text) {
  const lines = text.split('\n');
  const items = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('RM') && line.match(/\d+\.\d+/)) {
      const amountMatch = line.match(/RM\s*(\d+\.\d+)/);
      if (amountMatch) {
        items.push({
          name: line.replace(/RM\s*\d+\.\d+/, '').trim() || '商品',
          price: parseFloat(amountMatch[1]),
          quantity: 1
        });
      }
    }
  }
  
  return items.length > 0 ? items : [{ name: '商品', price: 0, quantity: 1 }];
}

// テスト用の簡単な保存関数
export async function testSaveReceipt() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    const testData = {
      id: `test_${Date.now()}`,
      storeName: 'テスト店舗',
      date: '2024-01-15',
      currency: 'MYR',
      totalAmount: 15.90,
      jpyAmount: 508.8,
      location: 'クアラルンプール',
      category: '食費',
      items: [{ name: 'テスト商品', price: 15.90, quantity: 1 }],
      processedAt: new Date().toISOString()
    };

    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const docRef = await addDoc(receiptsRef, testData);
    
    console.log('テストデータがFirebaseに保存されました:', docRef.id);
    return { id: docRef.id, ...testData };
  } catch (error) {
    console.error('テストデータ保存エラー:', error);
    throw error;
  }
}

// シンプルなテスト関数（Firestoreを使わない）
export async function simpleTest() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  return {
    message: 'シンプルテスト成功',
    user: user.email,
    timestamp: new Date().toISOString()
  };
}

// Firestore関数をエクスポート
export { collection, addDoc, getDocs, doc, setDoc, getDoc };

// Firebaseインスタンスをエクスポート
export { auth, db, storage };

// 新しい関数を明示的にエクスポート（重複を避けるため削除）
// export { getUnprocessedReceipts, markReceiptAsConfirmed };

// デバッグ用：関数の存在確認
console.log('Firebase設定ファイル読み込み完了');
console.log('getUnprocessedReceipts:', typeof getUnprocessedReceipts);
console.log('markReceiptAsConfirmed:', typeof markReceiptAsConfirmed);

// デバッグ用：利用可能な関数を確認
export function getAvailableFunctions() {
  return {
    functions: [
      'loginUser',
      'logoutUser', 
      'registerUser',
      'initializeDummyData',
      'getUserReceipts',
      'uploadReceiptImage',
      'saveReceiptFromJSON',
      'getUnprocessedReceipts',
      'markReceiptAsConfirmed',
      'testSaveReceipt',
      'simpleTest',
      'getAvailableFunctions',
      'collection',
      'addDoc',
      'getDocs',
      'doc',
      'setDoc',
      'getDoc',
      'auth',
      'db',
      'storage'
    ],
    timestamp: new Date().toISOString()
  };
}

// Firebase Functions と httpsCallable をエクスポート
export { functions, httpsCallable };
