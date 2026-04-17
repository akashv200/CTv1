# ChainTrace v1: Agriculture Supply Chain Verification

## One-Page Spec

### Vision
A minimal, blockchain-backed supply chain verification system for agriculture. Farmers register products, logistics partners add checkpoints with location + sensor data, and consumers publicly verify the entire journey.

### Core Flows

#### Flow 1: Product Registration (Farmer)
**Actors**: Authenticated farmer  
**Endpoint**: `POST /api/products`  
**Input**:
- name: string (e.g., "Organic Tomatoes")
- sku: string (unique identifier)
- location: string (lat,lon or farm name)
- batchId: string (harvest batch)
- certifications: string[] (e.g., ["organic", "fair-trade"])

**Process**:
1. Validate input (Joi/Zod)
2. Write to Firestore: `products/{productId}`
3. Call smart contract: `registerProduct(productId, sku, location)`
4. Generate QR code pointing to `/verify/:productId`

**Output**:
```json
{
  "productId": "prod_abc123",
  "qrCode": "data:image/png;base64,...",
  "verifyUrl": "https://app.com/verify/prod_abc123",
  "blockchainTx": "0x1234..."
}
```

---

#### Flow 2: Checkpoint (Logistics)
**Actors**: Authenticated logistics handler  
**Endpoint**: `POST /api/checkpoints`  
**Input**:
- productId: string
- location: string (current location)
- temperature: number (optional, sensor data)
- humidity: number (optional, sensor data)
- timestamp: ISO8601 (recorded time)

**Process**:
1. Validate JWT (handler role = LOGISTICS or AUDITOR)
2. Verify product exists in Firestore
3. Write checkpoint to `products/{productId}/checkpoints/{checkpointId}`
4. Call smart contract: `addCheckpoint(productId, location, timestamp)`
5. On-chain success → Firestore success (atomicity: both or neither)

**Output**:
```json
{
  "checkpointId": "cp_def456",
  "blockchainTx": "0x5678...",
  "product": {
    "productId": "prod_abc123",
    "name": "Organic Tomatoes",
    "checkpointCount": 2
  }
}
```

---

#### Flow 3: Public Verification (Consumer)
**Actors**: Anyone (public, no authentication)  
**Endpoint**: `GET /api/verify/:productId`  
**Process**:
1. No JWT required
2. Fetch product + full checkpoint timeline from Firestore
3. Return blockchain proof links (Polygon Mumbai explorer)

**Output**:
```json
{
  "product": {
    "productId": "prod_abc123",
    "name": "Organic Tomatoes",
    "sku": "TOMATO-BATCH-001",
    "farmerId": "farmer_123",
    "createdAt": "2025-01-01T10:00:00Z"
  },
  "checkpoints": [
    {
      "checkpointId": "cp_def456",
      "location": "Farm A",
      "temperature": 22.5,
      "timestamp": "2025-01-01T15:00:00Z",
      "blockchainTx": "0x1234...",
      "blockchainExplorerUrl": "https://mumbai.polygonscan.com/tx/0x1234..."
    },
    {
      "checkpointId": "cp_ghi789",
      "location": "Distribution Center B",
      "temperature": 18.0,
      "timestamp": "2025-01-02T09:00:00Z",
      "blockchainTx": "0x5678...",
      "blockchainExplorerUrl": "https://mumbai.polygonscan.com/tx/0x5678..."
    }
  ],
  "verificationStatus": "verified",
  "qrCodeUrl": "https://app.com/verify/prod_abc123"
}
```

---

## Data Model (Firestore)

### Collections

**`users/{userId}`**
```
{
  email: string
  passwordHash: string (bcrypt)
  role: "FARMER" | "LOGISTICS" | "AUDITOR"
  createdAt: Timestamp
}
```

**`products/{productId}`**
```
{
  name: string
  sku: string
  location: string (origin)
  batchId: string
  certifications: string[]
  farmerId: string (reference to user)
  createdAt: Timestamp
  blockchainTxHash: string
}
```

**`products/{productId}/checkpoints/{checkpointId}`**
```
{
  location: string
  temperature: number | null
  humidity: number | null
  timestamp: Timestamp
  handlerId: string (reference to user)
  blockchainTxHash: string
}
```

---

## Smart Contract (Solidity)

**Contract**: `UniversalTraceability.sol`

**State**:
```solidity
mapping(bytes32 => Product) public products;
mapping(bytes32 => Checkpoint[]) public checkpoints;

struct Product {
  string sku;
  string location;
  address owner;
  uint256 registeredAt;
}

struct Checkpoint {
  string location;
  uint256 timestamp;
  address handler;
}
```

**Functions**:
- `registerProduct(bytes32 productId, string sku, string location)` → emits ProductRegistered
- `addCheckpoint(bytes32 productId, string location, uint256 timestamp)` → emits CheckpointAdded
- `getCheckpointCount(bytes32 productId)` → uint256

---

## Authentication & Authorization

**JWT Scheme**:
- Access token: 15 minutes, signed with HS256
- Refresh token: 7 days, stored hashed in Firestore
- Claims: `{ userId, email, role }`

**Roles**:
- `FARMER`: Can register products
- `LOGISTICS`: Can add checkpoints to any product
- `AUDITOR`: Can read all data (checkpoint tracking)
- `PUBLIC`: /verify endpoint only

**Middleware**:
- `authMiddleware`: Validates JWT, attaches user to req
- `rbacMiddleware(role)`: Checks user.role matches required role
- `validateMiddleware`: Joi/Zod schema validation

---

## Deployment Targets

| Target | Blockchain | Status |
|--------|-----------|--------|
| **Local Dev** | Hardhat (127.0.0.1:8545) | Active |
| **Staging** | Polygon Mumbai | Ready (faucet: https://faucet.polygon.technology/) |
| **Production** | Polygon Mainnet | v2+ only |

---

## Success Metrics for v1

1. A farmer can register a product via API → gets QR code
2. A logistics handler can add 3+ checkpoints to that product
3. A consumer can scan the QR code, see the full timeline, and verify blockchain tx links work
4. All three flows work end-to-end with real Firestore + blockchain data
5. No auth required for verify flow (public access)

