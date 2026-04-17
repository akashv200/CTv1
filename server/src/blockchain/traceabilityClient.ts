import { ethers } from "ethers";
import { blockchainEngine } from "./blockchainEngine.js";
import { env } from "../config/env.js";

const TRACEABILITY_ABI = [
  "function registerProduct(string productName, string domain, string ipfsHash) external returns (uint256)",
  "function addCheckpoint(uint256 productId, string checkpointType, string location, string dataHash) external",
  "function registerRelationship(string networkId, string buyerId, string supplierId, string role) external",
  "event ProductRegistered(uint256 indexed productId, string domain, address registeredBy)",
  "event CheckpointAdded(uint256 indexed productId, string checkpointType, uint256 timestamp)"
];

async function getContractInstance(targetAddress?: string) {
  const masterContract = blockchainEngine.contract;
  if (!targetAddress) return masterContract;

  // If a specific address is provided, create a new instance with a signer
  const provider = (masterContract?.runner as any)?.provider;
  if (!provider) return null;

  const signer = await provider.getSigner(0);
  return new ethers.Contract(targetAddress, TRACEABILITY_ABI, signer);
}

export async function registerProductOnChain(payload: { productId: string; domain: string; ipfsHash?: string; contractAddress?: string }) {
  const contract = await getContractInstance(payload.contractAddress);
  if (!contract) {
    return {
      queued: true,
      txHash: `mock-tx-${payload.productId.toLowerCase()}`,
      network: env.CHAIN_NAME
    };
  }

  try {
    const tx = await (contract as any).registerProduct(payload.productId, payload.domain, payload.ipfsHash || "");
    const receipt = await tx.wait();
    
    // Extract ProductRegistered event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = (contract as any).interface.parseLog(log);
        return parsed?.name === "ProductRegistered";
      } catch {
        return false;
      }
    });

    let onChainId: number | undefined;
    if (event) {
      const parsed = (contract as any).interface.parseLog(event);
      onChainId = Number(parsed?.args?.productId);
    }

    return {
      queued: false,
      txHash: receipt.hash,
      onChainId,
      network: env.CHAIN_NAME,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Blockchain registration failed:", error);
    return {
      queued: true,
      txHash: `error-${payload.productId.toLowerCase()}`,
      network: env.CHAIN_NAME
    };
  }
}

export async function addCheckpointOnChain(payload: { onChainId: number; checkpointType: string; contractAddress?: string }) {
  const contract = await getContractInstance(payload.contractAddress);
  if (!contract) {
    return {
      txHash: `mock-cp-${payload.onChainId}`,
      confirmations: 1
    };
  }

  try {
    const tx = await (contract as any).addCheckpoint(payload.onChainId, payload.checkpointType, "Remote Sensor", "data-hash");
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      confirmations: 1
    };
  } catch (error) {
    console.error("Blockchain checkpoint failed:", error);
    return {
      txHash: `error-cp-${payload.onChainId}`,
      confirmations: 0
    };
  }
}

export async function registerNetworkPartnerOnChain(payload: { networkId: string; buyerId: string; supplierId: string; role: string; contractAddress?: string }) {
  const contract = await getContractInstance(payload.contractAddress);
  if (!contract) {
    return {
      txHash: `mock-nw-${payload.networkId.toLowerCase()}`,
      network: env.CHAIN_NAME
    };
  }

  try {
    const tx = await (contract as any).registerRelationship(payload.networkId, payload.buyerId, payload.supplierId, payload.role);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      network: env.CHAIN_NAME,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Blockchain network deployment failed:", error);
    return {
      txHash: `error-nw-${payload.networkId.toLowerCase()}`,
      network: env.CHAIN_NAME
    };
  }
}
