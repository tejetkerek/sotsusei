// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

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

// 認証状態の監視
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('ユーザーがログインしています:', user.email);
    // Firestore関数を初期化時に読み込み
    loadFirestoreFunctions();
    // ログイン済みの処理
  } else {
    console.log('ユーザーがログアウトしています');
    // ログアウト状態の処理
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

// ダミーデータの初期化（admin@test.com用）
export async function initializeDummyData() {
  const user = auth.currentUser;
  if (!user || user.email !== 'admin@test.com') {
    console.log('admin@test.comでログインしていません');
    return;
  }

  try {
    // Firestore関数を読み込み
    const firestore = await loadFirestoreFunctions();
    if (!firestore) {
      throw new Error('Firestore関数の読み込みに失敗しました');
    }

    // ダミーレシートデータ
    const dummyReceipts = [
      {
        id: 'receipt_001',
        storeName: 'RED ELEPHANT',
        date: '2024-01-13',
        currency: 'MYR',
        totalAmount: 15.90,
        items: [
          { name: 'カレーライス', price: 7.95, quantity: 2 }
        ],
        location: 'クアラルンプール',
        category: '食費',
        jpyAmount: 526
      },
      {
        id: 'receipt_002',
        storeName: '7-Eleven',
        date: '2024-01-14',
        currency: 'MYR',
        totalAmount: 8.50,
        items: [
          { name: '飲み物', price: 3.50, quantity: 1 },
          { name: 'スナック', price: 5.00, quantity: 1 }
        ],
        location: 'クアラルンプール',
        category: '食費',
        jpyAmount: 281
      },
      {
        id: 'receipt_003',
        storeName: 'Grab Taxi',
        date: '2024-01-15',
        currency: 'MYR',
        totalAmount: 12.00,
        items: [
          { name: 'タクシー代', price: 12.00, quantity: 1 }
        ],
        location: 'クアラルンプール',
        category: '交通費',
        jpyAmount: 397
      }
    ];

    // Firestoreにデータを保存
    const userDocRef = firestore.doc(db, 'users', user.uid);
    await firestore.setDoc(userDocRef, {
      email: user.email,
      createdAt: new Date(),
      lastLogin: new Date()
    });

    // レシートデータを保存
    const receiptsRef = firestore.collection(db, 'users', user.uid, 'receipts');
    for (const receipt of dummyReceipts) {
      await firestore.addDoc(receiptsRef, receipt);
    }

    console.log('ダミーデータの初期化が完了しました');
    return dummyReceipts;
  } catch (error) {
    console.error('ダミーデータ初期化エラー:', error);
    throw error;
  }
}

// ユーザーのレシートデータを取得
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
      receipts.push({ id: doc.id, ...doc.data() });
    });
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
    // JSONデータをレシート形式に変換
    const receiptData = {
      id: jsonData.receipt_id || `receipt_${Date.now()}`,
      storeName: extractStoreName(jsonData.extracted_data.translated_text),
      date: extractDate(jsonData.extracted_data.translated_text),
      currency: jsonData.extracted_data.conversions[0]?.original_currency || 'MYR',
      totalAmount: jsonData.extracted_data.conversions[0]?.original_amount || 0,
      jpyAmount: jsonData.extracted_data.total_jpy || 0,
      location: extractLocation(jsonData.extracted_data.translated_text),
      category: '食費', // デフォルト
      items: extractItems(jsonData.extracted_data.translated_text),
      originalText: jsonData.extracted_data.original_text,
      translatedText: jsonData.extracted_data.translated_text,
      processedAt: jsonData.processed_at || new Date().toISOString(),
      exchangeRate: jsonData.extracted_data.conversions[0]?.exchange_rate || 32.0
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
async function getUnprocessedReceipts() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const querySnapshot = await getDocs(receiptsRef);
    
    const receipts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`レシート ${doc.id}: confirmed = ${data.confirmed} (type: ${typeof data.confirmed})`);
      
      // 確認済みフラグが明示的にtrueでないレシートのみを取得
      if (data.confirmed !== true) {
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
async function markReceiptAsConfirmed(receiptId, updatedData = null) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ログインしていません');
  }

  try {
    const receiptRef = doc(db, 'users', user.uid, 'receipts', receiptId);
    
    // 基本の確認済みデータ
    const confirmData = {
      confirmed: true,
      confirmedAt: new Date().toISOString()
    };
    
    // 更新されたデータがある場合は追加
    if (updatedData) {
      Object.assign(confirmData, updatedData);
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
  const lines = text.split('\n');
  return lines[0] || 'Unknown Store';
}

// ヘルパー関数: 日付を抽出
function extractDate(text) {
  const dateMatch = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
}

// ヘルパー関数: 場所を抽出
function extractLocation(text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Kuala Lumpur') || lines[i].includes('Malaysia')) {
      return 'クアラルンプール';
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

// 新しい関数を明示的にエクスポート
export { getUnprocessedReceipts, markReceiptAsConfirmed };

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
