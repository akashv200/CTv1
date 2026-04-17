# Enhancing ChainTrace: Full Suite SCM & B2B Marketplace Setup

This plan expands the scope of ChainTrace from a primarily traceability-focused application to a comprehensive, full-suite Supply Chain Management (SCM) tool, incorporating business-to-business (B2B) discovery and onboarding.

## Goals
1. Incorporate 8 core pillars of SCM: Planning, Sourcing, Manufacturing, Inventory, Logistics, Order Management, Real-time Tracking, and Analytics.
2. Enable prospective businesses to browse a directory of current supply chain partners (Raw Material Manufacturers, Suppliers, etc.) within the platform.
3. Build a self-service onboarding flow ("Start Your Business") allowing users to submit registration requests to the administrators, creating their company and user organization upon approval.

## User Review Required

> [!IMPORTANT]
> The database schema changes required for a full ERP/SCM are extensive. We will add new tables to `postgres.ts` to support Orders, Manufacturing, Sourcing, Planning, and Onboarding Requests. Please review the schema changes carefully.

> [!WARNING]
> Building a full directory for public or guest users requires careful handling of privacy. By default, we will only expose public profiles of companies (Name, Domain, City, Country). Please confirm if this level of public visibility is acceptable.

## Proposed Changes

---

### Database Layer (Postgres Schema Expansion)

We will modify the core `server/src/config/postgres.ts` to include these missing SCM entities:

#### [MODIFY] [postgres.ts](file:///c:/Blockchain/chainTrace/server/src/config/postgres.ts)
- **Planning & Forecasts**: Add `demand_forecasts` table (Product, predicted demand, timeframe).
- **Sourcing/Procurement**: Add `supplier_contracts` or `purchase_orders` table.
- **Manufacturing / WIP**: Add `production_orders` and `work_in_progress` table tracking real-time machine usage and labor.
- **Logistics**: Add `shipments` and `transport_routes` tables (linking to existing `checkpoints`).
- **Order Management**: Add `sales_orders` tracking end-to-end customer order fulfillments.
- **B2B Onboarding**: Add `business_registration_requests` table to store prospective businesses waiting for admin approval.

---

### Backend API Layer

We will introduce new REST controllers and routes to interact with the new tables.

#### [NEW] `server/src/controllers/b2bDirectoryController.ts`
- Serves the public or authenticated directory of registered `companies`.

#### [NEW] `server/src/controllers/onboardingController.ts`
- Allows submitting to `business_registration_requests` and provides a Super Admin endpoint to approve these requests (which then creates the `company` and `user`).

#### [NEW] `server/src/controllers/scmController.ts`
- Dedicated endpoints for generating fake AI Demand forecasts, managing Purchase Orders, and transforming Products in Manufacturing.

#### [MODIFY] `server/src/routes/index.ts`
- Register `b2bRoutes`, `onboardingRoutes`, and `scmRoutes`.

---

### Frontend SCM Expansion & B2B Portal

We will add new UI components and dashboards representing the new functionality, keeping a highly dynamic and premium aesthetic using React and Tailwind/Framer-Motion.

#### [NEW] `client/src/pages/B2BDirectoryPage.tsx`
- A dynamic, premium table/grid view to search and filter active manufacturers, suppliers, and distributors.

#### [NEW] `client/src/pages/JoinNetworkPage.tsx`
- A multi-step animated wizard (Start Your Business) asking for company details, domain, and contact info, submitting to the onboarding API.

#### [NEW] `client/src/pages/SCMDashboard.tsx`
- An internal dashboard containing cards & charts for the new SCM modules:
  - **Demand Forecast Chart** (Planning)
  - **Orders Table** (Sales & Purchase Orders)
  - **Production Queue** (Manufacturing WIP)
  - **Logistics Map** (Extending current real-time tracking)

#### [MODIFY] `client/src/components/layout/Navbar.tsx`
- Add external links for "Explore Network" and "Join Network" for unauthenticated or newly authenticated non-admin users.

## Open Questions

1. **Authentication for Browsing:** Should the "Supplier Directory" be completely public, or require the user to create a basic account first before they can see other businesses?
2. **Approval Workflow:** When a business requests to join, should they receive an email automatically upon admin approval, or is the current platform scope entirely internal to the app?
3. **Smart Contracts Scope:** Do you want the Purchase Orders and Manufacturing Lineage to also emit events to the Ganache Blockchain, or is Blockchain strictly reserved for Product Verification/Tracking?

## Verification Plan

### Automated Tests
- Run `npm run test` if unit tests exist for models.
- Ensure the server starts gracefully and `ensurePostgresSchema()` runs without syntax errors.

### Manual Verification
- We will boot the server and client.
- Navigate to the new `/join` page and submit a `business_registration_request`.
- We will log in as a `super_admin` to approve the request, verifying it populates the `companies` and `users` tables.
- We will navigate to the `/directory` page to verify the new company appears.
- Navigate to the `/scm` dashboard to ensure the charts and mock data for Planning, Orders, and Manufacturing load correctly.
