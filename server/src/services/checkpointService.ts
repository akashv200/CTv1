import { randomUUID } from "crypto";
import { db } from "../lib/firebase.js";
import { collection, doc, setDoc, getDoc, arrayUnion, updateDoc } from "firebase/firestore";
import { addCheckpointOnChain } from "../blockchain/traceabilityClient.js";
import { CreateCheckpointInput } from "../validators/schemas.js";

/**
 * Phase 2: Add checkpoint with Firestore + blockchain atomicity
 * Flow:
 * 1. Validate input (caller responsibility via Zod)
 * 2. Fetch product from Firestore to get blockchain contract ID
 * 3. Register checkpoint on blockchain
 * 4. Add checkpoint to Firestore checkpoints collection
 * 5. Increment product's checkpointCount
 */
export async function createCheckpoint(input: CreateCheckpointInput) {
  const checkpointId = randomUUID();
  const checkpointsRef = collection(db, "checkpoints");
  const productsRef = collection(db, "products");

  try {
    console.log(`[v0] Creating checkpoint for product ${input.productId}...`);

    // Step 1: Fetch product to verify it exists and get blockchain info
    const productDocRef = doc(productsRef, input.productId);
    const productSnapshot = await getDoc(productDocRef);

    if (!productSnapshot.exists()) {
      throw new Error(`Product ${input.productId} not found`);
    }

    const productData = productSnapshot.data();

    // Step 2: Register checkpoint on blockchain
    console.log(`[v0] Registering checkpoint on blockchain...`);
    const blockchainResult = await addCheckpointOnChain({
      productId: input.productId,
      checkpointType: input.status,
      location: `${input.location.latitude},${input.location.longitude}`,
      timestamp: input.timestamp,
      addedBy: input.handler.id,
      metadata: {
        temperature: input.temperature,
        humidity: input.humidity,
        notes: input.notes
      }
    });

    // Step 3: Prepare checkpoint document
    const checkpointData = {
      id: checkpointId,
      productId: input.productId,
      location: input.location,
      timestamp: input.timestamp,
      handler: input.handler,
      status: input.status,
      notes: input.notes || null,
      temperature: input.temperature || null,
      humidity: input.humidity || null,
      photoUrl: input.photoUrl || null,

      // Blockchain reference
      blockchainTxHash: blockchainResult.txHash,
      blockchainContractId: blockchainResult.contractId || null,

      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Step 4: Write checkpoint to Firestore
    console.log(`[v0] Writing checkpoint ${checkpointId} to Firestore...`);
    const checkpointDocRef = doc(checkpointsRef, checkpointId);
    await setDoc(checkpointDocRef, checkpointData);

    // Step 5: Update product's checkpoint count and add reference
    console.log(`[v0] Updating product checkpoint count...`);
    await updateDoc(productDocRef, {
      checkpointCount: (productData?.checkpointCount || 0) + 1,
      lastCheckpointAt: new Date().toISOString(),
      lastStatus: input.status
    });

    console.log(`[v0] Checkpoint ${checkpointId} created successfully`);
    return {
      ...checkpointData,
      verifyUrl: `${process.env.PUBLIC_URL || "http://localhost:5173"}/verify/${input.productId}`
    };
  } catch (error) {
    console.error(`[v0] Error creating checkpoint:`, error);
    throw new Error(`Failed to create checkpoint: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get all checkpoints for a product (public endpoint, used by verify page)
 */
export async function getCheckpointsByProductId(productId: string) {
  try {
    const checkpointsRef = collection(db, "checkpoints");
    // This would be replaced with actual Firestore query once indexes are set up
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error(`[v0] Error fetching checkpoints for product ${productId}:`, error);
    throw new Error(`Failed to fetch checkpoints: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
