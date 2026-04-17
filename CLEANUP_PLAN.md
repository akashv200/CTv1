# Phase 1: File Cleanup Plan

## Principle

**Delete ruthlessly.** Every file should belong to the agriculture core loop or be clearly marked as a stub.

---

## Frontend Cleanup (client/src)

### KEEP: Core Pages
```
pages/
  ✅ LandingPage.tsx
  ✅ LoginPage.tsx
  ✅ RegisterPage.tsx
  ✅ RegisterProductPage.tsx (product wizard)
  ✅ VerifyProductPage.tsx (QR verification)
  ✅ DashboardPage.tsx (farmer dashboard)
  ✅ SettingsPage.tsx
  ✅ SetupPasswordPage.tsx (password flow)
```

### DELETE: Out-of-Scope Pages
```
pages/
  ❌ DomainLearnMorePage.tsx (multi-domain marketing)
  ❌ ScmWorkspacePage.tsx (enterprise SCM)
  ❌ AdminOnboardingPage.tsx (admin features)
  ❌ Warehouse3DPage.tsx (3D visualization)
```

### KEEP: Core Components
```
components/
  ✅ common/           (Button, Card, Badge, Toast)
  ✅ forms/            (ProductWizard.tsx)
  ✅ verification/     (VerificationResult.tsx)
  ✅ profile/          (ProfileCard.tsx)
```

### DELETE: Out-of-Scope Components
```
components/
  ❌ scm/              (All 8 workspace files)
  ❌ three/            (3D scenes)
  ❌ dashboard/        (complex analytics)
  ❌ maps/             (TrackingMap.tsx - restore after v1)
  ❌ blockchain/       (BlcockchainVisualizer.tsx - too fancy for v1)
```

### KEEP: Core Services/Hooks
```
services/
  ✅ api.ts           (HTTP client)
  ✅ firebaseService.ts
  ✅ socket.ts        (basic realtime - if needed)

hooks/
  ✅ useRealtimeFeed.ts (or DELETE if unused)

store/
  ✅ useChainTraceStore.ts
  ✅ useThemeStore.ts
  ✅ useWalletStore.ts
  ✅ usePlatformSettingsStore.ts (refactor: remove unused settings)
```

### DELETE: Out-of-Scope Services
```
No other services to delete - good!
```

### KEEP: Core Config
```
data/
  ✅ domainConfig.ts   (agriculture only - already simplified)
  ✅ mock.ts           (replace with real API calls)

lib/
  ✅ firebase.ts
  ✅ session.ts
  ✅ utils.ts
```

### DELETE: Out-of-Scope Config
```
config/
  ❌ features.ts       (likely contains multi-domain feature flags)
```

---

## Backend Cleanup (server/src)

### KEEP: Core Routes
```
routes/
  ✅ index.ts           (main router)
  ✅ authRoutes.ts      (login, register, logout, refresh)
  ✅ productRoutes.ts   (create, get, list)
  ✅ checkpointRoutes.ts (create, get, list)
  ✅ verificationRoutes.ts (public verify)
```

### DELETE: Out-of-Scope Routes
```
routes/
  ❌ aiRoutes.ts
  ❌ organizationRoutes.ts
  ❌ notificationRoutes.ts
  ❌ iotRoutes.ts
  ❌ onboardingRoutes.ts
  ❌ b2bRoutes.ts
  ❌ scmRoutes.ts
  ❌ integrationRoutes.ts
  ❌ userRoutes.ts (merge critical auth functions into authRoutes)
```

### KEEP: Core Controllers
```
controllers/
  ✅ authController.ts
  ✅ productController.ts
  ✅ checkpointController.ts
  ✅ verificationController.ts
```

### DELETE: Out-of-Scope Controllers
```
controllers/
  ❌ aiController.ts
  ❌ organizationController.ts
  ❌ notificationController.ts
  ❌ iotController.ts
  ❌ onboardingController.ts
  ❌ b2bDirectoryController.ts
  ❌ enterpriseScmController.ts
  ❌ integrationController.ts
  ❌ userController.ts
```

### KEEP: Core Services
```
services/
  ✅ authService.ts
  ✅ productService.ts
  ✅ checkpointService.ts
  ✅ verificationService.ts
  ✅ passwordTokenService.ts (keep for password reset)
```

### DELETE: Out-of-Scope Services
```
services/
  ❌ aiService.ts
  ❌ auditService.ts
  ❌ automationService.ts
  ❌ iotService.ts
  ❌ notificationService.ts
  ❌ organizationService.ts
  ❌ geminiService.ts
```

### KEEP: Core Middleware
```
middleware/
  ✅ auth.ts        (JWT validation)
  ✅ rbac.ts        (role-based access)
  ✅ validate.ts    (Joi/Zod validation)
  ✅ error.ts       (error handling)
```

### KEEP: Core Models
```
models/
  ✅ User.ts
  ✅ Product.ts
  ✅ Checkpoint.ts
```

### DELETE: Out-of-Scope Models
```
models/
  ❌ AuditLog.ts (restore in Phase 3 if needed)
```

### KEEP: Core Config
```
config/
  ✅ env.ts             (environment variables)
  ✅ passport.ts        (OAuth - keep but disable unused providers)
  ✅ firebase.ts        (Firestore)
  
DELETE (NOT NEEDED FOR V1):
  ❌ postgres.ts        (use Firestore only)
  ❌ redis.ts           (not needed for v1)
  ❌ mqtt.ts            (IoT, out of scope)
  ❌ influx.ts          (analytics, out of scope)
```

### KEEP: Core Utils
```
utils/
  ✅ jwt.ts         (JWT token handling)
  ✅ password.ts    (bcrypt)
  ✅ seed.ts        (database seeding - may need update for Firestore)
```

### DELETE: Out-of-Scope Utils
```
utils/
  ❌ iotSimulator.ts (IoT, out of scope)
```

### DELETE: GraphQL (REST-only for v1)
```
graphql/
  ❌ schema.ts      (remove GraphQL entirely)
```

### DELETE: Socket.io (unless actively using realtime)
```
socket/
  ❌ realtime.ts (or mark as STUB for Phase 2)
```

### DELETE: AI Scripts
```
ai/
  ❌ (entire folder - AI out of scope for v1)
```

### DELETE: Scripts (unless essential)
```
scripts/
  ❌ migrate_governance.ts
  ❌ test_governance.ts
```

---

## Root Level Cleanup

### KEEP: Core Files
```
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ .env.example
✅ .gitignore
✅ docker-compose.yml (update: remove MQTT, InfluxDB, PostgreSQL)
```

### DELETE: Documentation (Too Much Already)
```
❌ documentation.zip
❌ documentations/ (folder)
❌ Testing1.md (old testing doc)
```

### DELETE: Setup Files (But Keep as Reference)
```
(Keep for now, mark as deprecated)
- SETUP_GUIDE.md (too complex for v1)
- QUICK_REFERENCE.md (out of date)
```

### DELETE: Legacy Config
```
❌ firebase-applet-config.json
❌ firebase-blueprint.json
❌ metadata.json
❌ mosquitto.conf (MQTT out of scope)
```

### KEEP: Blockchain Folder
```
blockchain/
  ✅ contracts/         (UniversalTraceability.sol)
  ✅ test/              (Hardhat tests)
  ✅ hardhat.config.ts
```

### KEEP: Core Docs
```
✅ README.md          (update for v1 agriculture)
✅ ROADMAP.md
✅ SPEC.md
✅ BLOCKCHAIN_CONFIG.md
✅ PHASE_1_CHECKLIST.md
✅ PHASE_1_SUMMARY.md
✅ CLEANUP_PLAN.md (this file)
```

---

## Cleanup Execution Order

### Phase 1a: Delete Non-Agriculture Components (2 hours)
```bash
# Frontend
rm -rf client/src/components/scm/
rm -rf client/src/components/three/
rm -rf client/src/pages/{DomainLearnMorePage,ScmWorkspacePage,AdminOnboardingPage,Warehouse3DPage}.tsx
rm -f client/src/config/features.ts
rm -f client/src/components/dashboard/{AnalyticsCharts,AIInsightsPanel}.tsx

# Backend
rm -rf server/src/{ai/,controllers/{ai,organization,notification,iot,onboarding,b2b,enterprise,integration,user}Controller.ts}
rm -rf server/src/routes/{ai,organization,notification,iot,onboarding,b2b,scm,integration,user}Routes.ts
rm -rf server/src/services/{ai,organization,notification,iot,gemini}Service.ts
rm -f server/src/models/AuditLog.ts

# Config
rm -f server/src/config/{postgres,redis,mqtt,influx}.ts
rm -f server/src/socket/realtime.ts
rm -rf server/src/scripts/
rm -rf server/src/graphql/
```

### Phase 1b: Update Environment (30 mins)
```bash
# Remove unused env vars from server/src/config/env.ts
# Remove PostgreSQL, Redis, MQTT, InfluxDB configs
# Update .env.example

# Update docker-compose.yml
# - Remove PostgreSQL service
# - Remove InfluxDB service
# - Remove MQTT/mosquitto
# Keep only: Firebase Emulator, Hardhat (if needed)
```

### Phase 1c: Update Routes (15 mins)
```bash
# Already done in routes/index.ts - just verify it's clean
# Should have ONLY: /auth, /products, /checkpoints, /verify
```

### Phase 1d: Verify Build (15 mins)
```bash
npm run build
npm run type-check
npm run lint
```

### Phase 1e: Verify Imports (30 mins)
```bash
# Run ESLint to find unused imports
# Remove any references to deleted services/components
# Fix any circular dependencies introduced by deletions
```

### Phase 1f: Update Documentation (30 mins)
```
✅ README.md - update feature list to agriculture only
✅ .env.example - remove unused vars
✅ docker-compose.yml - simplify to essentials
❌ SETUP_GUIDE.md - consider archiving or dramatically simplifying
```

---

## Verification Checklist After Cleanup

```
✅ Frontend build passes (client/)
✅ Backend build passes (server/)
✅ No unused imports in any file
✅ No deleted files still referenced anywhere
✅ Routes only include: /auth, /products, /checkpoints, /verify
✅ Controllers only for: auth, product, checkpoint, verification
✅ Models only: User, Product, Checkpoint
✅ No references to AI, IoT, SCM, B2B, 3D, GraphQL anywhere
✅ package.json: Can remove packages for deleted features?
   - Check for unused AI SDK versions, 3D libraries, GraphQL deps
✅ .gitignore: Still correct?
✅ docker-compose.yml: Only essential services
✅ CI/CD workflows: Updated to only test agriculture features
```

---

## Safety Tips

**Before deletions, run:**
```bash
git branch -b phase-1-cleanup
git commit -m "Backup: Before cleanup"
```

**After each deletion section:**
```bash
npm run build  # Catch errors immediately
npm run lint   # Find unused imports
git commit -m "Cleanup: Deleted [feature]"
```

**If something breaks:**
```bash
git reset HEAD~1  # Undo last deletion
git diff          # See what broke
```

---

## Estimated Cleanup Time

- Delete component files: 30 mins
- Delete service/controller files: 45 mins
- Update routes/config: 30 mins
- Update documentation: 30 mins
- Fix build errors: 30 mins
- Verify no orphaned code: 30 mins

**Total: ~3-4 hours**

This is worthwhile because it will save 10+ hours of confusion during Phase 2 when you're debugging.

---

## After Cleanup: You're Ready for Phase 2

Once cleanup is complete, every file serves the agriculture loop. No distractions. No dead code.

Then you can focus on the 3 core endpoints:
1. POST /api/products
2. POST /api/checkpoints
3. GET /api/verify/:productId

Good luck. 🌾

