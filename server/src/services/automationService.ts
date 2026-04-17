import { pgPool } from "../config/postgres.js";
import { blockchainEngine } from "../blockchain/blockchainEngine.js";
import { redis } from "../config/redis.js";

/**
 * The Automation Engine listens for real-time blockchain events
 * and synchronizes the state with the PostgreSQL database.
 */
export function startAutomationEngine() {
  const contract = blockchainEngine.contract;
  
  if (!contract) {
    console.error("[automation] Blockchain contract not found. Engine standby.");
    return;
  }

  console.log("[automation] Monitoring blockchain events...");

  // 1. Sync Product Registration
  contract.on("ProductRegistered", async (productId, domain, owner, event) => {
    try {
      console.log(`[blockchain] Event: ProductRegistered (ID: ${productId}, Domain: ${domain})`);
      
      // Update PostgreSQL: Mark as verified and store on-chain ID
      await pgPool.query(
        "UPDATE products SET status = 'verified', smart_contract_id = $1, blockchain_tx_hash = $2 WHERE product_name ILIKE $3",
        [productId.toString(), event.log.transactionHash, `%${domain}%`] // Fallback matching if needed
      );

      await redis.publish("events", JSON.stringify({ type: "onchain_event", category: "product", id: productId.toString() }));
    } catch (error) {
       console.error("[automation] Error syncing product:", error);
    }
  });

  // 2. Sync Checkpoints
  contract.on("CheckpointAdded", async (productId, type, timestamp, event) => {
    try {
      console.log(`[blockchain] Event: CheckpointAdded (PID: ${productId}, Type: ${type})`);
      
      await pgPool.query(
        "UPDATE checkpoints SET verified = true, blockchain_tx_hash = $1 WHERE product_id = (SELECT product_id FROM products WHERE smart_contract_id = $2)",
        [event.log.transactionHash, productId.toString()]
      );

      await redis.publish("events", JSON.stringify({ type: "onchain_event", category: "checkpoint", id: productId.toString() }));
    } catch (error) {
      console.error("[automation] Error syncing checkpoint:", error);
    }
  });

  // 3. Sync Network Relationships
  contract.on("RelationshipRegistered", async (networkId, buyerId, supplierId, role, event) => {
    try {
      console.log(`[blockchain] Event: RelationshipRegistered (Net: ${networkId}, Role: ${role})`);
      
      // Update metadata in supplier_relationships to reflect on-chain anchoring
      await pgPool.query(
        `UPDATE supplier_relationships 
         SET metadata = metadata || jsonb_build_object('on_chain_tx', $1, 'anchored_at', NOW())
         WHERE (id = $2 OR (buyer_company_id = $3 AND supplier_company_id = $4))`,
        [event.log.transactionHash, networkId, buyerId, supplierId]
      );

      await redis.publish("events", JSON.stringify({ type: "onchain_event", category: "relationship", networkId }));
    } catch (error) {
      console.error("[automation] Error syncing relationship:", error);
    }
  });
}
