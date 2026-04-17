# Phase 1 Execution Checklist

## Scope & Documentation ✅ 70% Complete

- [x] ROADMAP.md created
- [x] SPEC.md created (3 core flows documented)
- [x] BLOCKCHAIN_CONFIG.md created (Hardhat locked for v1)
- [x] App.tsx simplified (routes trimmed to agriculture only)
- [x] domainConfig.ts simplified (agriculture only)
- [x] Server routes stub non-agriculture endpoints
- [ ] Delete all unused page components (ScmWorkspacePage, AdminOnboardingPage, Warehouse3DPage, DomainLearnMorePage)
- [ ] Delete all unused client components (SCM workspace components, 3D components)
- [ ] Delete all unused server routes files (aiRoutes, organizationRoutes, etc.)
- [ ] Delete AI-related files (geminiService, aiController, aiService)
- [ ] Delete IoT-related files (iotService, iotSimulator, mqtt config)
- [ ] Remove MQTT config from docker-compose.yml
- [ ] Remove InfluxDB config from server
- [ ] Remove PostgreSQL init (use Firestore only for v1)
- [ ] Delete B2B directory files
- [ ] Delete GraphQL schema (REST-only for v1)
- [ ] Remove Redis config from env/server (not needed for v1)
- [ ] Clean up .env.example (remove unused configs)
- [ ] Remove unused CLI scripts

## Backend Core Loop

### Auth Service
- [ ] POST /api/auth/register → Validate email, hash password, create Firestore user
- [ ] POST /api/auth/login → Validate credentials, issue JWT (15 min) + refresh (7 days)
- [ ] POST /api/auth/refresh → Swap old refresh token for new access token
- [ ] POST /api/auth/logout → Invalidate token
- [ ] Write unit tests for authService (80%+ coverage)

### Product Service
- [ ] POST /api/products → Validate input, write to Firestore, deploy smart contract registerProduct()
- [ ] GET /api/products → Return user's products (auth required, FARMER role)
- [ ] GET /api/products/:productId → Return single product (auth required)
- [ ] Data validation: Joi/Zod schema for all fields
- [ ] Atomic transaction: Firestore write + blockchain tx both succeed or both fail
- [ ] Write unit tests for productService (80%+ coverage)

### Checkpoint Service
- [ ] POST /api/checkpoints → Validate input, write to Firestore, deploy smart contract addCheckpoint()
- [ ] GET /api/checkpoints/:productId → Return all checkpoints for product (auth required)
- [ ] RBAC: LOGISTICS and AUDITOR can add checkpoints
- [ ] Data validation: location, temperature, humidity, timestamp, handlerId
- [ ] Atomic transaction: Firestore write + blockchain tx both succeed or both fail
- [ ] Write unit tests for checkpointService (80%+ coverage)

### Verification Service
- [ ] GET /api/verify/:productId → Public endpoint (no auth), return product + full timeline
- [ ] Response: product details + checkpoint array + blockchain explorer links (Mumbai)
- [ ] Caching: 5-minute cache for public verify endpoint
- [ ] Write unit tests for verificationService (80%+ coverage)

## Blockchain

### Smart Contract
- [ ] Solidity: UniversalTraceability.sol deployed and tested
- [ ] Functions: registerProduct(), addCheckpoint(), getCheckpointCount(), getProduct()
- [ ] Events: ProductRegistered, CheckpointAdded
- [ ] Hardhat tests: All functions pass, 80%+ line coverage
- [ ] Contract address stored in .env (deploy script)

### Integration
- [ ] blockchainEngine.ts: Connect to Hardhat RPC
- [ ] Register product → smart contract call → Firestore write (atomicity)
- [ ] Add checkpoint → smart contract call → Firestore write (atomicity)
- [ ] Error handling: If blockchain tx fails, Firestore rollback
- [ ] TX hash returned to client for verification

## Frontend

### Minimal UI
- [ ] Remove all SCM workspace tabs (directory, ecosystem, suppliers, orders, inventory, shipments, production, optimization, connectors)
- [ ] Remove all navigation to deleted pages
- [ ] Simplify dashboard to show: user's products + recent checkpoints
- [ ] ProductWizard: Form to create product (name, sku, location, batchId, certifications)
- [ ] VerifyProductPage: Public QR scanner + product timeline view
- [ ] Replace all mock data with live API calls
- [ ] Loading states, error boundaries, empty states on all components

## Testing

### Unit Tests (Jest)
- [ ] authService.test.ts (login, register, jwt, refresh)
- [ ] productService.test.ts (create, fetch, validation)
- [ ] checkpointService.test.ts (create, fetch, rbac)
- [ ] verificationService.test.ts (public access, data format)
- [ ] Coverage target: 80% on all services

### Integration Tests (Supertest)
- [ ] POST /api/auth/register → 201 + JWT
- [ ] POST /api/auth/login → 200 + JWT
- [ ] POST /api/products (as FARMER) → 201 + productId + tx hash
- [ ] POST /api/checkpoints (as LOGISTICS) → 201 + checkpoint ID
- [ ] GET /api/verify/:productId (public) → 200 + full timeline
- [ ] Negative cases: invalid JWT, cross-role writes, missing fields

### Contract Tests (Hardhat)
- [ ] Deploy UniversalTraceability.sol
- [ ] registerProduct() → ProductRegistered event emitted
- [ ] addCheckpoint() → CheckpointAdded event emitted
- [ ] getCheckpointCount() returns correct count
- [ ] All tests pass, gas report generated

## Deployment Readiness

- [ ] No build warnings
- [ ] No hardcoded secrets in code
- [ ] .env.example complete (all required vars documented)
- [ ] Firebase Emulator startup script (firebase emulators:start)
- [ ] Hardhat node startup script
- [ ] README.md updated with v1 scope + setup instructions
- [ ] Git: All changes committed, no uncommitted files

## Exit Criteria (Must ALL Pass)

✅ Folder structure: Every file belongs to agriculture flow  
✅ Routes simplified: Only /auth, /products, /checkpoints, /verify  
✅ All non-agriculture pages/components deleted  
✅ All non-agriculture server routes removed  
✅ Build passes with zero errors or warnings  
✅ Unit test coverage ≥80% for all services  
✅ Integration tests all pass  
✅ Hardhat contract tests all pass  
✅ A real farmer can register a product → gets QR code  
✅ A real logistics handler can add 3+ checkpoints  
✅ A public user can scan QR, see full timeline, verify on-chain  
✅ No dead code, unused imports, or orphaned features  

---

## Current Status: **PHASE 1 SCOPE DEFINITION COMPLETE (30/85 tasks)**

Next: Execute scope cut (delete unused files, simplify routes)

