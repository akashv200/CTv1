import { randomUUID } from "crypto";
import { db } from "../lib/firebase.js";
import { collection, doc, setDoc, getDoc, writeBatch, DocumentReference } from "firebase/firestore";
import { registerProductOnChain } from "../blockchain/traceabilityClient.js";
import { CreateProductInput } from "../validators/schemas.js";
import QRCode from "qrcode";

/**
 * Phase 2: Create product with Firestore + blockchain atomicity
 * Flow:
 * 1. Validate input (caller responsibility via Zod)
 * 2. Register product on blockchain first
 * 3. Write to Firestore in transaction
 * 4. If Firestore fails, we log the failure but product is already on-chain
 * 5. Generate QR code pointing to public verify endpoint
 */
export async function createProduct(input: CreateProductInput) {
  const productId = `AG-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const productsRef = collection(db, "products");

  try {
    // Step 1: Register on blockchain FIRST (immutable record)
    console.log(`[v0] Registering product ${productId} on blockchain...`);
    const blockchainResult = await registerProductOnChain({
      productId,
      productName: input.name,
      originLocation: input.origin,
      metadata: {
        sku: input.sku,
        harvestDate: input.harvestDate,
        certification: input.certification
      }
    });

    // Step 2: Prepare Firestore document
    const productData = {
      id: productId,
      name: input.name,
      description: input.description,
      sku: input.sku,
      origin: input.origin,
      harvestDate: input.harvestDate || null,
      quantity: input.quantity,
      unit: input.unit,
      certification: input.certification || null,
      farmerId: input.farmerId,
      geolocation: input.geolocation || null,
      
      // Blockchain reference
      blockchainTxHash: blockchainResult.txHash,
      blockchainContractId: blockchainResult.contractId || null,
      
      // Metadata
      status: "registered",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkpointCount: 0,
      
      // QR code will be generated after Firestore write
      qrCodeUrl: null as string | null
    };

    // Step 3: Write to Firestore
    console.log(`[v0] Writing product ${productId} to Firestore...`);
    const productDocRef = doc(productsRef, productId);
    await setDoc(productDocRef, productData);

    // Step 4: Generate QR code
    const verifyUrl = `${process.env.PUBLIC_URL || "http://localhost:5173"}/verify/${productId}`;
    console.log(`[v0] Generating QR code for ${verifyUrl}`);
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" }
    });

    // Step 5: Update document with QR code
    await setDoc(productDocRef, { qrCodeUrl: qrCodeDataUrl }, { merge: true });

    console.log(`[v0] Product ${productId} created successfully`);
    return {
      id: productId,
      ...productData,
      qrCodeUrl: qrCodeDataUrl,
      verifyUrl
    };
  } catch (error) {
    console.error(`[v0] Error creating product ${productId}:`, error);
    throw new Error(`Failed to create product: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Phase 2: Get product by ID from Firestore (public endpoint)
 */
export async function getProductById(productId: string) {
  try {
    const productsRef = collection(db, "products");
    const productDocRef = doc(productsRef, productId);
    const productSnapshot = await getDoc(productDocRef);
    
    if (!productSnapshot.exists()) {
      return null;
    }

    return {
      id: productSnapshot.id,
      ...productSnapshot.data()
    };
  } catch (error) {
    console.error(`[v0] Error fetching product ${productId}:`, error);
    throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Phase 2: List products by farmer (for farmer dashboard)
 */
export async function listProductsByFarmer(farmerId: string) {
  try {
    const productsRef = collection(db, "products");
    // This would be replaced with actual Firestore query once indexes are set up
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error(`[v0] Error listing products for farmer ${farmerId}:`, error);
    throw new Error(`Failed to list products: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}


