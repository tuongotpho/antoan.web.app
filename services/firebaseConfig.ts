// Firebase v9 Modular SDK
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentReference,
  CollectionReference,
  Query,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';

// Cấu hình Firebase phía client.
//
// Các khoá VITE_FIREBASE_* này công khai theo thiết kế (không phải bí mật) —
// việc chặn truy cập là do firestore.rules và storage.rules đảm nhiệm.
//
// Giá trị dự phòng bên dưới trỏ về project atld-connect, đúng project mà
// hosting đang deploy vào (.firebaserc). TRƯỚC ĐÂY chúng trỏ sang một project
// khác (gen-lang-client-0113063590), nên bản build ngoài đời chạy trên project
// này còn lệnh `firebase deploy` lại nạp rules vào project kia — rules sửa xong
// mà không bao giờ có hiệu lực. Ngoài ra authDomain cũ còn bị thiếu một chữ số
// ('013063590' thay vì '0113063590'), đủ để làm hỏng luồng đăng nhập Google.
//
// LƯU Ý: nếu GitHub Secrets có đặt VITE_FIREBASE_* thì giá trị đó sẽ ghi đè
// phần dự phòng này lúc build. Đổi project thì phải kiểm cả hai nơi.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCFRcMNj_vOOqOaJlGbLbGF6Z1HpawGyDg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'atld-connect.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'atld-connect',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'atld-connect.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '745800129021',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:745800129021:web:8b37c115c4327930dc6194',
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
// Cloud Functions đang deploy ở us-central1 (mặc định của firebase-functions v1)
const functionsInstance = getFunctions(app);

/**
 * Gửi email qua Cloud Function.
 *
 * TRƯỚC ĐÂY hàm này ghi thẳng vào collection `mail`, mà rules lại cho phép
 * `create: if true` — nghĩa là bất kỳ ai trên Internet cũng gửi được email tuỳ
 * ý mang tên miền này (lừa đảo, spam, tên miền bị đưa vào danh sách đen).
 *
 * NAY client chỉ gọi callable function; function kiểm tra đăng nhập rồi mới
 * ghi vào `mail` bằng Admin SDK. Rules đã khoá hoàn toàn phía client.
 */
const sendEmail = async (to: string | string[], subject: string, html: string, text?: string) => {
  try {
    const callable = httpsCallable<
      { to: string | string[]; subject: string; html: string; text?: string },
      { id: string }
    >(functionsInstance, 'sendAppEmail');
    const result = await callable({ to, subject, html, ...(text && { text }) });
    return result.data.id;
  } catch (error: any) {
    console.error('Error queuing email:', error);
    if (error.code === 'functions/unauthenticated') {
      console.error('UNAUTHENTICATED: Cần đăng nhập mới gửi được email');
    }
    throw error;
  }
};

// Export Firebase services and utilities
export {
  app,
  db,
  auth,
  storage,
  sendEmail,
  // Firestore functions
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  // Auth functions
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  // Storage functions
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  // Types
  type User,
  type Firestore,
  type Auth,
  type FirebaseStorage as Storage,
  type QuerySnapshot,
  type DocumentSnapshot,
  type DocumentReference,
  type CollectionReference,
  type Query,
};

// Legacy compatibility exports (for gradual migration)
export const firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp,
      arrayUnion,
      arrayRemove,
    },
    Timestamp,
  },
};
