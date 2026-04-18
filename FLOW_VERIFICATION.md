# Website Flow Verification - Phase 3 Ready?

## Requirements Checklist

### ✅ 1. Landing Page has Login & Signup Options
**Status: COMPLETE**

- **Landing Page** (`LandingPage.tsx`):
  - ✅ Displays differentiators and launch steps
  - ✅ Shows ecosystem roles (Starter, Producer, Manufacturer, Distributor, Retailer, Admin)
  - ✅ Navigation shows login/signup options (visible in App.tsx routes)
  - ✅ Link to `/login` and `/signup` pages available

**Evidence:**
```
- /login → LoginPage.tsx (fully functional)
- /signup → RegisterPage.tsx (fully functional)
```

---

### ✅ 2. Signup has Two Options: Starter & Company (Only One Can Be Selected)
**Status: COMPLETE**

- **RegisterPage.tsx** implements role selection:
  - ✅ **Mode 1: "entrepreneur"** (Starter)
    - Icon: Briefcase
    - Description: "Develop new business ideas, find industry partners, and create supply networks."
    - Color: Indigo (when selected)
    
  - ✅ **Mode 2: "industry_rep"** (Company)
    - Icon: Building2
    - Description: "Represent an established company, offer specialized services, and join existing networks."
    - Color: Emerald (when selected)

  - ✅ **Radio-button style selection** (mutually exclusive):
    ```typescript
    const [mode, setMode] = useState<"entrepreneur" | "industry_rep">("entrepreneur");
    ```
    - Only one can be selected at a time
    - Visual feedback with border color and shadow changes
    - GSAP animations on selection

**Evidence:**
```
RegisterPage.tsx lines 177-217:
- handleRoleSelect() ensures only one is selected
- className conditionals show active/inactive states
- onClick handlers update mode state
```

---

### ✅ 3. According to Selection, Next Page Shows Different Form
**Status: COMPLETE**

Two completely different forms render based on selection:

**FORM 1: Entrepreneur/Starter Form**
```typescript
if (mode === "entrepreneur") {
  // Renders entrepreneurForm with:
  - Name (required)
  - Email (required)
  - Venture Idea (text area)
  - Industry Interest (dropdown)
  - Password (required, 8+ chars)
  - Submit button: "Join as Entrepreneur"
}
```

**FORM 2: Industry Representative/Company Form**
```typescript
else (mode === "industry_rep") {
  // Renders industryForm with:
  - Company Name (required)
  - Specialization (dropdown)
  - Rep Name (required)
  - Rep Email (required)
  - Industry Phone (optional)
  - HQ Country (optional)
  - Website (optional)
  - Submit button: "Register as Industry Representative"
}
```

**Evidence:**
```
RegisterPage.tsx lines 219-310 (entrepreneur form)
RegisterPage.tsx lines 311-420 (industry form)
Both forms have different fields, labels, and submit handlers
```

---

### ✅ 4. New Signups Require Admin Approval
**Status: COMPLETE**

Admin approval system is fully implemented:

**Frontend Side:**
- Entrepreneur signup: `api.registerConsumer()` - message shows "submitted for review"
- Industry Rep signup: `api.submitBusinessAccessRequest()` - message shows "Admin approval is required"
- Both show success toast: "...submitted for review" / "...admin approval is required"

**Backend Side - Onboarding Controller:**
```typescript
submitRegistrationRequest():
  1. Validates input fields
  2. Creates company with status: 'pending_approval'
  3. Returns: "Awaiting admin approval"

getPendingRequests():
  - Admin-only endpoint (requires super_admin role)
  - Filters by status: pending_approval, active, suspended
  - Returns list of pending requests

approveRequest():
  - Admin-only endpoint (role check: super_admin)
  - Updates company status to 'active'
  - Creates user account
  - Returns success message

rejectRequest():
  - Admin-only endpoint
  - Updates status to 'suspended'
  - Sends rejection notification
```

**Database Schema:**
- Companies table has `status` field (pending_approval, active, suspended)
- Metadata stores `contact_name` and `registration_source`
- Timestamps track `created_at`

**Evidence:**
```
onboardingController.ts:
- Lines 8-58: submitRegistrationRequest() - submits with pending_approval
- Lines 61-105: getPendingRequests() - admin views pending
- Lines 137-200: approveRequest() - admin approves
- Status flow: pending_approval → active (approved) or suspended (rejected)
```

---

## Flow Diagram

```
Landing Page
    ↓
[Login] or [Signup]
    ↓
Signup Page: Select Role
    ├─→ Entrepreneur/Starter Form
    │       ├─ Name, Email, Password, Venture Idea, Industry
    │       └─ Submit → "Awaiting admin approval"
    │
    └─→ Industry Rep/Company Form
            ├─ Company Name, Domain, Contact Info, Phone, Country
            └─ Submit → "Awaiting admin approval"
                ↓
            Admin Dashboard (super_admin role)
                ├─ View pending requests
                ├─ Approve → Creates user account, status='active'
                └─ Reject → status='suspended'
```

---

## Ready for Phase 3?

### ✅ YES - ALL REQUIREMENTS ARE CONFIGURED

**Summary:**
1. ✅ Landing page with login/signup options
2. ✅ Two signup modes: Entrepreneur & Industry Rep (mutually exclusive)
3. ✅ Different forms based on selection
4. ✅ Admin approval system (pending_approval → active flow)

**What's in place:**
- Frontend: 2 distinct signup forms with conditional rendering
- Backend: Onboarding controller with admin approval endpoints
- Database: Companies table with status tracking
- API: `registerConsumer()` and `submitBusinessAccessRequest()`
- Admin Dashboard: Can view and approve/reject pending requests

**Phase 3 can proceed to:** Authentication + Security Hardening

---

## Next Steps (Phase 3)

Based on ROADMAP.md, Phase 3 includes:
1. **JWT Implementation**: access token (15 min) + refresh token (7 days)
2. **Firestore RLS Rules**: Row-level security for approved users only
3. **RBAC (Role-Based Access Control)**: FARMER, LOGISTICS, AUDITOR, PUBLIC
4. **Rate Limiting**: express-rate-limit on auth endpoints
5. **Security Headers**: helmet.js for protection
6. **Remove Hardcoded Secrets**: Use .env files
7. **Firebase Emulator Tests**: Assert auth rules work correctly

---

## Files Involved

### Frontend
- `/client/src/pages/LandingPage.tsx` - Landing page
- `/client/src/pages/LoginPage.tsx` - Login flow
- `/client/src/pages/RegisterPage.tsx` - Signup with two forms
- `/client/src/services/api.ts` - API calls (registerConsumer, submitBusinessAccessRequest)

### Backend
- `/server/src/routes/onboardingRoutes.ts` - Onboarding endpoints
- `/server/src/controllers/onboardingController.ts` - Approval logic
- `/server/src/config/postgres.ts` - Companies table schema

### Database
- `companies` table with status field (pending_approval, active, suspended)
- Email uniqueness constraint
