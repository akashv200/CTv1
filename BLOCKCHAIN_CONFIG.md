# ChainTrace v1 Blockchain Configuration

## Selected Network: Hardhat (Local Development)

**Phase 1 Target**: Hardhat local node  
**Phase 1.5 Staging**: Polygon Mumbai  
**Phase 2+ Production**: Polygon Mainnet  

---

## Development (v1)

**Network**: Hardhat  
**RPC Endpoint**: `http://127.0.0.1:8545` (default after `npx hardhat node`)  
**Chain ID**: `31337` (Hardhat default)  
**Block Time**: 2 seconds  

**Setup**:
```bash
cd blockchain
npx hardhat node  # Starts local node in separate terminal
npm run blockchain:test  # Runs all contract tests
npm run blockchain:deploy:local  # Deploys to local node
```

**Test Accounts** (Hardhat prefunded):
- Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account 1: `0x70997970C51812e339D9B73b0245ad59E1c2D75` (Farmer)
- Account 2: `0x3C44CdDdB6a900c6Cb6f7f5629c2567f0F9C64f9` (Logistics)
- Account 3: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Auditor)

(See `blockchain/hardhat.config.ts` for private keys)

---

## Staging (v1.5+)

**Network**: Polygon Mumbai Testnet  
**RPC Endpoint**: `https://rpc.ankr.com/polygon_mumbai`  
**Chain ID**: `80001`  
**Explorer**: https://mumbai.polygonscan.com/  
**Faucet**: https://faucet.polygon.technology/ (get free MATIC)  

**Deployment**:
```bash
# Set HARDHAT_NETWORK=mumbai in .env
npx hardhat run scripts/deploy.ts --network mumbai
```

**Contract Address** (set after deployment):
```
TRACEABILITY_CONTRACT=0x... (from mumbai.polygonscan.com)
```

---

## Production (v2+)

**Network**: Polygon Mainnet  
**RPC Endpoint**: `https://polygon-rpc.com/`  
**Chain ID**: `137`  
**Explorer**: https://polygonscan.com/  

**Prerequisites**:
- Smart contract audited (run slither, fix findings)
- TestNet staging verified
- Mainnet wallets funded with MATIC

---

## Smart Contract: UniversalTraceability.sol

**Location**: `blockchain/contracts/UniversalTraceability.sol`

**Key Functions**:
- `registerProduct(bytes32 productId, string sku, string location)` → ProductRegistered event
- `addCheckpoint(bytes32 productId, string location, uint256 timestamp)` → CheckpointAdded event
- `getCheckpointCount(bytes32 productId) → uint256`
- `getProduct(bytes32 productId) → Product struct`

**Deployment Gas Estimate** (local Hardhat):
- Contract deploy: ~1.5M gas
- registerProduct: ~150k gas per call
- addCheckpoint: ~120k gas per call

---

## Hardhat Config

**File**: `blockchain/hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2, ...]
    },
    mumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      accounts: [PRIVATE_KEY_MUMBAI],
      chainId: 80001
    }
  }
};

export default config;
```

---

## Backend Integration

**File**: `server/src/blockchain/blockchainEngine.ts`

```typescript
const provider = new ethers.JsonRpcProvider(env.EVM_RPC_URL);
const wallet = new ethers.Wallet(env.EVM_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

// When registering product:
const tx = await contract.registerProduct(productId, sku, location);
await tx.wait(1); // Wait for 1 block confirmation

// Response to client:
return {
  productId,
  blockchainTx: tx.hash,
  blockchainExplorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
};
```

---

## Testing

**Run Hardhat Tests**:
```bash
cd blockchain
npm test  # Runs all Solidity tests in test/ folder
```

**Test File**: `blockchain/test/UniversalTraceability.test.ts`

**Coverage**: Aim for 80%+ line coverage

```bash
npm run blockchain:coverage
```

---

## v1 Scope: NO Multi-Chain Support Yet

The following are explicitly NOT in scope for v1:

- ❌ Ethereum mainnet
- ❌ Arbitrum, Optimism, Base
- ❌ Cross-chain bridges
- ❌ Layer 2 sequencer interactions
- ❌ Custom EVM networks

**Why**: Focus on making ONE chain work end-to-end before expanding. Hardhat → Mumbai → Mainnet is the progression.

