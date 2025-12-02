import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { 
  getFirestore, 
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  increment,
  limit,
  orderBy,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// ============================================
// Firebase Configuration & Initialization
// ============================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = (): boolean => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field as keyof typeof firebaseConfig]
  );
  
  if (missingFields.length > 0) {
    console.warn(`Firebase config missing: ${missingFields.join(', ')}`);
    return false;
  }
  return true;
};

// Initialize Firebase with singleton pattern
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseConfigured = false;

try {
  const isConfigValid = validateConfig();
  
  if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseConfigured = true;
  } else {
    // Create mock instances for development without Firebase
    console.warn("Firebase running in mock mode - configure environment variables for full functionality");
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// ============================================
// Authentication Utilities
// ============================================

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    const errorMessage = getAuthErrorMessage(firebaseError.code);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new account with email and password
 */
export async function signUp(
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Create user document in Firestore
    await createUserDocument(userCredential.user);
    
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    const errorMessage = getAuthErrorMessage(firebaseError.code);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const firebaseError = error as { message?: string };
    return { success: false, error: firebaseError.message || "Sign out failed" };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    
    // Create user document if it doesn't exist
    await createUserDocument(userCredential.user);
    
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    
    // Handle popup closed by user
    if (firebaseError.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled' };
    }
    
    const errorMessage = getAuthErrorMessage(firebaseError.code);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    const errorMessage = getAuthErrorMessage(firebaseError.code);
    return { success: false, error: errorMessage };
  }
}

/**
 * Map Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code?: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
  };
  
  return errorMessages[code || ''] || 'An unexpected error occurred. Please try again.';
}

// ============================================
// Firestore Utilities
// ============================================

export interface FirestoreResult<T = DocumentData> {
  success: boolean;
  data?: T;
  id?: string;
  error?: string;
}

/**
 * Create user document on signup
 */
async function createUserDocument(user: User): Promise<void> {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument<T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<FirestoreResult<T>> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: "Document not found" };
    }
    
    return { 
      success: true, 
      data: { id: snapshot.id, ...snapshot.data() } as T,
      id: snapshot.id 
    };
  } catch (error: unknown) {
    const firestoreError = error as { message?: string };
    return { success: false, error: firestoreError.message || "Failed to fetch document" };
  }
}

/**
 * Create a new document
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string, 
  data: T,
  docId?: string
): Promise<FirestoreResult> {
  try {
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, dataWithTimestamp);
      return { success: true, id: docId };
    } else {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, dataWithTimestamp);
      return { success: true, id: docRef.id };
    }
  } catch (error: unknown) {
    const firestoreError = error as { message?: string };
    return { success: false, error: firestoreError.message || "Failed to create document" };
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string, 
  docId: string, 
  data: Partial<T>
): Promise<FirestoreResult> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docId };
  } catch (error: unknown) {
    const firestoreError = error as { message?: string };
    return { success: false, error: firestoreError.message || "Failed to update document" };
  }
}

/**
 * Delete a document
 */
export async function removeDocument(
  collectionName: string, 
  docId: string
): Promise<FirestoreResult> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: unknown) {
    const firestoreError = error as { message?: string };
    return { success: false, error: firestoreError.message || "Failed to delete document" };
  }
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<FirestoreResult<T[]>> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    
    return { success: true, data: documents };
  } catch (error: unknown) {
    const firestoreError = error as { message?: string };
    return { success: false, error: firestoreError.message || "Query failed" };
  }
}

// ============================================
// Order Management
// ============================================

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  createdAt?: Date;
}

/**
 * Create a new order
 */
export async function createOrder(
  userId: string, 
  items: OrderItem[], 
  total: number
): Promise<FirestoreResult> {
  const orderData: Omit<Order, 'id'> = {
    userId,
    items,
    total,
    status: 'pending',
  };
  
  return createDocument('orders', orderData);
}

/**
 * Get orders for a user
 */
export async function getUserOrders(userId: string): Promise<FirestoreResult<Order[]>> {
  return queryDocuments<Order>(
    'orders',
    where('userId', '==', userId)
  );
}

// ============================================
// Exports
// ============================================

export { app, auth, db, storage, firebaseConfigured, where, collection, doc, query, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, increment, limit, orderBy };
