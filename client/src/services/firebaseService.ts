import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  setDoc, 
  doc, 
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  // Real-time synchronization for products
  subscribeProducts: (callback: (products: any[]) => void) => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(products);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "products"));
  },

  // Real-time synchronization for checkpoints
  subscribeCheckpoints: (callback: (checkpoints: any[]) => void) => {
    const q = query(collection(db, "checkpoints"), orderBy("occurredAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const checkpoints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(checkpoints);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "checkpoints"));
  },

  // Real-time synchronization for AI insights
  subscribeInsights: (callback: (insights: any[]) => void) => {
    const q = query(collection(db, "ai_insights"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const insights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(insights);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "ai_insights"));
  },

  // Add a new product
  addProduct: async (product: any) => {
    try {
      await setDoc(doc(db, "products", product.id), {
        ...product,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
    }
  },

  // Add a new checkpoint
  addCheckpoint: async (checkpoint: any) => {
    try {
      await setDoc(doc(db, "checkpoints", checkpoint.id), {
        ...checkpoint,
        occurredAt: checkpoint.occurredAt || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `checkpoints/${checkpoint.id}`);
    }
  }
};
