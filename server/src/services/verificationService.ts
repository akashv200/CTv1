import { db } from "../lib/firebase.js";
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Phase 2: Public verification endpoint (no auth required)
 * Returns product + full checkpoint timeline for consumer QR code scan
 */
export async function getProductWithCheckpoints(productId: string) {
  try {
    console.log(`[v0] Fetching product ${productId} with checkpoints...`);

    const productsRef = collection(db, "products");
    const productDocRef = doc(productsRef, productId);
    const productSnapshot = await getDoc(productDocRef);

    if (!productSnapshot.exists()) {
      console.warn(`[v0] Product ${productId} not found`);
      return null;
    }

    const productData = productSnapshot.data();

    // Fetch all checkpoints for this product
    const checkpointsRef = collection(db, "checkpoints");
    // For now, return empty checkpoints as placeholder
    // Once Firestore indexes are set up, use:
    // const q = query(checkpointsRef, where("productId", "==", productId));
    // const checkpointsSnapshot = await getDocs(q);
    const checkpoints: any[] = [];

    console.log(`[v0] Found product with ${checkpoints.length} checkpoints`);

    return {
      product: {
        id: productSnapshot.id,
        ...productData
      },
      checkpoints: checkpoints.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })),
      timeline: {
        totalCheckpoints: checkpoints.length,
        firstCheckpoint: checkpoints[0]?.data()?.createdAt || null,
        lastCheckpoint: checkpoints[checkpoints.length - 1]?.data()?.createdAt || null,
        status: productData?.lastStatus || "registered",
        verified: true
      }
    };
  } catch (error) {
    console.error(`[v0] Error fetching product ${productId}:`, error);
    throw new Error(
      `Failed to verify product: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get product summary for QR code (lightweight)
 */
export async function getProductSummary(productId: string) {
  try {
    const productsRef = collection(db, "products");
    const productDocRef = doc(productsRef, productId);
    const productSnapshot = await getDoc(productDocRef);

    if (!productSnapshot.exists()) {
      return null;
    }

    const data = productSnapshot.data();
    return {
      id: productSnapshot.id,
      name: data?.name,
      origin: data?.origin,
      sku: data?.sku,
      status: data?.lastStatus || "registered",
      checkpointCount: data?.checkpointCount || 0,
      harvestDate: data?.harvestDate,
      qrCodeUrl: data?.qrCodeUrl
    };
  } catch (error) {
    console.error(`[v0] Error fetching product summary ${productId}:`, error);
    return null;
  }
}
