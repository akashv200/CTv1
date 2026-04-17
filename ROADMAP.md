# ChainTrace v1 Development Roadmap

## Phase 1: Scope Cut to Agriculture Domain

**Goal**: A single, focused codebase targeting agriculture supply chain traceability. No multi-domain routing. No dead code.

### In Scope for v1
- **Domain**: Agriculture only
- **Core Loop**: Register Product → Add Checkpoint → Public Verify
- **Data Model**: Product, Checkpoint, User (Firestore collections)
- **Blockchain**: Hardhat local (dev), Polygon Mumbai (staging)
- **Smart Contract**: UniversalTraceability.sol

### Explicitly NOT in Scope
- Multi-domain UI/routing
- Pharmaceutical, Food Safety, E-commerce, Warehouse IoT domains
- Advanced SCM features (ecosystem, suppliers, orders, inventory, shipments, production, optimization, connectors)
- AI anomaly detection
- IoT sensor streams
- MQTT/InfluxDB integrations
- 3D warehouse visualization
- Complex analytics dashboards
- Multi-tenant organization management
- B2B directory features
- GraphQL (REST API only for v1)

---

## Phase 1 Deliverables

### 1. Domain Folder Structure
```
client/
  src/
    pages/
      LandingPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      RegisterProductPage.tsx (Product registration wizard)
      VerifyProductPage.tsx (QR code verification)
      DashboardPage.tsx (Farmer dashboard)
      SettingsPage.tsx
    components/
      forms/ (ProductWizard.tsx)
      verification/ (VerificationResult.tsx)
      common/ (Button, Card, Badge, Toast)
    services/
      api.ts (3 core endpoints only)
      firebaseService.ts
    hooks/
      useAuth.ts
      useProduct.ts

server/
  src/
    routes/
      authRoutes.ts
      productRoutes.ts
      checkpointRoutes.ts
      verificationRoutes.ts
    services/
      authService.ts
      productService.ts
      checkpointService.ts
      verificationService.ts
    middleware/
      auth.ts
      rbac.ts
      validate.ts
    models/
      User.ts
      Product.ts
      Checkpoint.ts

blockchain/
  contracts/
    UniversalTraceability.sol
  test/
    UniversalTraceability.test.ts
```

### 2. One-Page Spec

**Flow 1: Farmer Registers Product**
- POST /api/auth/login → JWT issued
- POST /api/products → Input: name, sku, location, batchId, certifications
- Firestore writes Product doc
- Smart contract call: registerProduct(productId, sku, location)
- Returns: productId + QR code pointing to /verify/:productId

**Flow 2: Logistics Adds Checkpoint**
- POST /api/checkpoints → Input: productId, location, temperature, humidity, timestamp, handlerSignature (from JWT)
- Firestore writes Checkpoint subdoc
- Smart contract call: addCheckpoint(productId, location, timestamp)
- Returns: checkpoint ID + tx hash

**Flow 3: Consumer Verifies (Public, No Auth)**
- GET /api/verify/:productId → No JWT required
- Returns: Product + full checkpoint timeline + blockchain verification link
- Frontend renders: product details, timeline, Polygon explorer link

### 3. Data Model

**Firestore Collections**

```
users/
  {userId}
    email: string
    passwordHash: string
    role: "FARMER" | "LOGISTICS" | "AUDITOR"
    createdAt: timestamp

products/
  {productId}
    name: string
    sku: string
    location: string
    batchId: string
    certifications: string[]
    farmerId: string
    createdAt: timestamp
    blockchainTxHash: string

    checkpoints/
      {checkpointId}
        location: string
        temperature: number
        humidity: number
        timestamp: timestamp
        handlerId: string
        blockchainTxHash: string
```

### 4. Blockchain Config

**Development**: Hardhat local (127.0.0.1:8545)
- Private keys: Hardhat defaults (test accounts)
- Contract deployment: Automatic on `npm run test:blockchain`

**Staging**: Polygon Mumbai
- Network: Mumbai testnet
- RPC: https://rpc.ankr.com/polygon_mumbai
- Contract address: (set in .env.staging after deployment)

**Production**: Polygon Mainnet (v2+)

---

## Phase 1 Sprint Exit Criteria

✅ Folder structure cleaned: Every file belongs to agriculture flow or is marked `// STUB`  
✅ Routes simplified: Only /login, /register, /dashboard, /products, /checkpoints, /verify  
✅ All non-agriculture pages/components deleted or stubbed  
✅ ROADMAP.md created with explicit scope  
✅ No dead code, unused imports, or orphaned features  
✅ Build passes with no warnings  

---

## Phases 2–6 Summary

**Phase 2**: Working backend core loop  
**Phase 3**: Auth + security hardening  
**Phase 4**: CI/CD + test gates  
**Phase 5**: Frontend wiring to live API  
**Phase 6**: Hardening + production deployment  

See individual phase docs for detailed requirements.
