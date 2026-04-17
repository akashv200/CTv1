# Phase 1: Quick-Start Guide

## 🎯 Your Mission

Build the minimum viable agriculture supply chain app in one focused push. **No scope creep. No distractions.**

---

## 📚 What to Read First

**In this order:**

1. **ROADMAP.md** (5 min read)
   - High-level 6-phase plan
   - What's in v1, what's not

2. **SPEC.md** (10 min read)
   - 3 core flows with exact API payloads
   - Data model (Firestore collections)
   - Smart contract functions

3. **BLOCKCHAIN_CONFIG.md** (5 min read)
   - Hardhat for dev
   - Polygon Mumbai for staging
   - Contract addresses and setup

4. **PHASE_1_CHECKLIST.md** (10 min read)
   - 85 executable tasks
   - Break them down, track progress
   - Exit criteria

5. **CLEANUP_PLAN.md** (10 min read)
   - Exact files to delete
   - Files to keep
   - 3-4 hour cleanup path

6. **This guide** (5 min read)
   - Quick reference for common tasks
   - Command cheatsheet

**Total reading time: 45 minutes. Then you code.**

---

## 🚀 Quick Command Reference

### Development Server
```bash
# Frontend (port 5173)
cd client && npm run dev

# Backend (port 4000)
cd server && npm run dev

# Both in parallel (from root, if you have npm workspaces set up)
npm run dev:all
```

### Build & Test
```bash
# Frontend
cd client && npm run build && npm run lint

# Backend
cd server && npm run build && npm run type-check

# Blockchain
cd blockchain && npm test && npx hardhat run scripts/deploy.ts
```

### Database
```bash
# Firebase Emulator (includes Firestore, Auth, etc.)
firebase emulators:start --project chaintrace-dev

# Hardhat local node (in separate terminal)
npx hardhat node
```

### Git
```bash
# Create feature branch
git checkout -b phase-1/core-loop

# Commit with Phase 1 prefix
git commit -m "Phase 1: Implement product registration endpoint"

# Push and create PR
git push -u origin phase-1/core-loop
```

---

## 📋 High-Level Phase 1 Breakdown

### Week 1: Setup + Auth (10 tasks)
```
Cleanup: Delete non-agriculture files
Auth: Implement login, register, JWT refresh
Target: Users can log in, receive JWT
```

### Week 2: Product Core (15 tasks)
```
Product: Implement POST /api/products
Blockchain: Deploy UniversalTraceability contract
Target: Farmer registers product → gets productId + QR
```

### Week 3: Checkpoints + Verification (15 tasks)
```
Checkpoint: Implement POST /api/checkpoints
Verify: Implement GET /api/verify/:productId (public)
Target: Full timeline visible, blockchain links work
```

### Week 4: Testing + Polish (20 tasks)
```
Testing: 80%+ coverage on all services
Frontend: Wire UI to real API
Target: Real user can complete all 3 flows
```

### Week 5: Hardening + Deploy (25 tasks)
```
Security: Hardening, rate limiting, HTTPS
CI/CD: Automated testing on every PR
Target: Push to staging (Firebase Hosting)
```

---

## 🔑 Key Files to Know

| File | Purpose | Edit When |
|------|---------|-----------|
| `SPEC.md` | API contract | Never (locked for Phase 1) |
| `PHASE_1_CHECKLIST.md` | Task tracker | Daily (mark tasks as ✅) |
| `.env` | Secrets | Only in local development |
| `server/src/models/*.ts` | Data schemas | Only if schema needs clarification |
| `client/src/services/api.ts` | HTTP client | When adding new endpoints |
| `blockchain/contracts/*.sol` | Smart contract | When implementing contract logic |

---

## 🧪 Testing Your 3 Flows

### Flow 1: Product Registration
```bash
# Terminal 1: Backend running
cd server && npm run dev

# Terminal 2: Test with curl
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@test.com","password":"password123"}'

# Copy the JWT from response, then:
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Organic Tomatoes",
    "sku":"TOMATO-001",
    "location":"Farm A",
    "batchId":"BATCH-001",
    "certifications":["organic"]
  }'

# Response should include productId + blockchain tx hash
```

### Flow 2: Add Checkpoint
```bash
# Using same JWT from above
curl -X POST http://localhost:4000/api/checkpoints \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId":"<from previous>",
    "location":"Distribution Center",
    "temperature":22.5,
    "humidity":55,
    "timestamp":"2025-01-10T14:30:00Z"
  }'
```

### Flow 3: Public Verification
```bash
# No JWT needed!
curl http://localhost:4000/api/verify/<productId>

# Response: Product + full timeline + blockchain explorer links
```

---

## 🚨 Common Issues & Fixes

### "Cannot find module '@google/generative-ai'"
```bash
cd server && npm install @google/generative-ai
```

### Build fails with unused imports
```bash
npm run lint -- --fix
```

### Firestore emulator not starting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init emulators

# Start emulator
firebase emulators:start
```

### Hardhat contract deployment fails
```bash
# Make sure local node is running
npx hardhat node  # In separate terminal

# Then in another terminal
npx hardhat run scripts/deploy.ts --network localhost
```

### JWT validation failing in API
```
Check:
1. JWT is being sent in Authorization header
2. JWT_SECRET in .env matches between client + server
3. Token hasn't expired (15 min default)
```

---

## ✅ Daily Checklist

**Each morning:**
```
□ Read the spec for today's task
□ Pull latest code: git pull origin fix-and-deploy
□ Create feature branch: git checkout -b phase-1/task-name
□ Run tests before starting: npm test
□ Update PHASE_1_CHECKLIST.md with progress
```

**Before committing:**
```
□ Code builds without warnings: npm run build
□ Tests pass: npm test
□ Linter passes: npm run lint
□ No console.log([v0] ...) left in code
□ Commit message follows "Phase 1: <task>" format
```

**End of day:**
```
□ Push branch: git push -u origin phase-1/task-name
□ Create PR if task complete
□ Update PHASE_1_CHECKLIST.md (mark complete)
□ Slack/email standup if working with team
```

---

## 🎓 Key Concepts

### JWT Flow
```
1. User logs in → authService.login() → returns { accessToken, refreshToken }
2. Client stores JWT in memory (never localStorage!)
3. Every API call includes: Authorization: Bearer <JWT>
4. Server middleware validates JWT before processing
5. Token expires in 15 min → use refreshToken to get new one
```

### Firestore Atomicity
```
1. Product registration:
   - Write to Firestore: products/{productId}
   - Call smart contract: registerProduct()
   - If contract fails → delete Firestore doc
   - Return success only if BOTH succeed

2. Same for checkpoints
```

### Smart Contract State
```
mapping(bytes32 => Product) products;
mapping(bytes32 => Checkpoint[]) checkpoints;

registerProduct(productId) {
  products[productId] = { ... };
  emit ProductRegistered(productId);
}

addCheckpoint(productId, location) {
  checkpoints[productId].push({ ... });
  emit CheckpointAdded(productId);
}
```

### RBAC (Role-Based Access)
```
FARMER: Can register products only
LOGISTICS: Can add checkpoints to any product
AUDITOR: Can read all data
PUBLIC: Can call /verify endpoint only
```

---

## 🚀 When You're Stuck

**Step 1**: Check SPEC.md for exact endpoint contract  
**Step 2**: Check PHASE_1_CHECKLIST.md for task requirements  
**Step 3**: Review similar working code in repo  
**Step 4**: Check error logs: `Read /user_read_only_context/v0_debug_logs.log`  
**Step 5**: Add debug logging: `console.log("[v0] variable:", value)`  

---

## 📊 Progress Tracking

**Use this to track Phase 1:**

```markdown
# Phase 1 Progress

## Week 1
- [ ] Cleanup: Delete non-agriculture files (CLEANUP_PLAN.md)
- [ ] Auth: login endpoint
- [ ] Auth: register endpoint
- [ ] Auth: JWT refresh
- [ ] Auth: logout endpoint
- [ ] Auth: Unit tests (80%+)
- [ ] Auth: Integration tests

## Week 2
- [ ] Product: POST /api/products
- [ ] Product: Firestore write
- [ ] Product: Smart contract call
- [ ] Product: Atomicity (both or neither)
- [ ] Product: Unit tests (80%+)
- [ ] Product: Integration tests
- [ ] Smart contract: Hardhat test suite

## Week 3
- [ ] Checkpoint: POST /api/checkpoints
- [ ] Checkpoint: Geolocation + timestamp
- [ ] Checkpoint: RBAC validation
- [ ] Checkpoint: Unit tests (80%+)
- [ ] Checkpoint: Integration tests
- [ ] Verify: GET /api/verify/:productId (public)
- [ ] Verify: Unit tests (80%+)

## Week 4-5
- [ ] Frontend: ProductWizard → real API
- [ ] Frontend: VerifyPage → real API
- [ ] Frontend: Remove mocks, use live data
- [ ] Testing: E2E flow (register → checkpoint → verify)
- [ ] Hardening: Security headers, rate limiting
- [ ] CI/CD: GitHub Actions workflows
- [ ] Deploy: Staging (Firebase Hosting)
```

---

## 🎉 Phase 1 Complete = Ready for Phase 2

When all 85 tasks are ✅, you'll have:

✅ Clean codebase (no dead code)  
✅ 3 working core flows  
✅ Real Firestore + blockchain data  
✅ 80%+ test coverage  
✅ Secure authentication  
✅ Automated deployment  
✅ Public verification URL  

Then in Phase 2, you add the next level of complexity (advanced auth, rate limiting, observability, etc.).

---

## 📞 Need Help?

- **Specification unclear?** → Re-read SPEC.md
- **Task blocked?** → Check PHASE_1_CHECKLIST.md for dependencies
- **Code won't build?** → Check error logs, run `npm run lint --fix`
- **Don't know what to do next?** → Look at next unchecked item in PHASE_1_CHECKLIST.md

---

## 🌾 Let's Go

You have:
- ✅ Scope locked (agriculture only)
- ✅ Specification written (3 flows, exact payloads)
- ✅ Blockchain target set (Hardhat → Mumbai → Mainnet)
- ✅ Task list created (85 items)
- ✅ Cleanup plan detailed (3-4 hours)

Everything else is execution.

**Time to ship.** 🚀

