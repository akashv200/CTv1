# ChainTrace

ChainTrace is a unified, multi-domain blockchain supply chain traceability platform covering:

- Agriculture
- Pharmaceuticals
- Food Safety
- E-commerce Authenticity
- Warehouse/IoT Inventory

This repository includes a full-stack monorepo scaffold with:

- `fronten/`: React + TypeScript + Tailwind + Three.js + Recharts + Mapbox + Zustand + Framer Motion
- `backend/`: Node.js + Express + REST + GraphQL + Socket.io + JWT/OAuth + MongoDB + Redis + PostgreSQL + MQTT integration points
- `smart-contracts/`: Solidity contracts and Hardhat tests/deployment
- `docs/`: architecture, API, user onboarding, and project delivery materials

## Monorepo Structure

```text
chainTrace/
|-- fronten/
|-- backend/
|-- smart-contracts/
`-- docs/
```

## Quick Start

## 1. Install dependencies

```bash
cd chainTrace
npm install
```

## 2. Environment setup

```bash
cp fronten/.env.example fronten/.env
cp backend/.env.example backend/.env
cp smart-contracts/.env.example smart-contracts/.env
```

## 3. Run services

### Frontend

```bash
npm run dev --workspace fronten
```

### Backend

```bash
npm run dev --workspace backend
```

### Smart contracts (compile/test/deploy)

```bash
npm run compile --workspace smart-contracts
npm run test --workspace smart-contracts
npm run deploy:ganache --workspace smart-contracts
```

## Implemented Core Features

- Domain-adaptive landing page and dashboard
- Product registration multi-step wizard
- Verification portal (public flow)
- Checkpoint timeline and simulated realtime feed
- 3D warehouse visualization using Three.js
- Analytics charts and AI insights cards
- REST APIs for auth/products/checkpoints/verification
- GraphQL query API for product journey and checkpoint feeds
- Socket.io channel for realtime checkpoint updates
- JWT auth and Google OAuth route scaffolding
- MongoDB models and services for products/checkpoints/users
- Redis/PostgreSQL/MQTT integration stubs for IoT streaming
- Solidity contracts for product registration, checkpoints, certificates, recall, IoT oracle, reward token

## API Endpoints (REST)

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/products` (auth)
- `POST /api/products` (auth)
- `GET /api/products/:productId/journey` (auth)
- `POST /api/checkpoints` (auth)
- `GET /api/verify/:productId` (public)

GraphQL endpoint:

- `POST /graphql`

## Smart Contracts

- `UniversalTraceability.sol`
- `AccessControl.sol`
- `IoTOracle.sol`
- `RewardToken.sol`

## Notes for Production Hardening

- Add full persistent refresh token lifecycle and revocation
- Implement full wallet signing flow and actual ethers write ops
- Integrate IPFS pinning (Pinata/Infura) for certificate and media hashes
- Add complete RBAC policy matrix enforcement per endpoint/module
- Add service workers and offline sync for full PWA behavior
- Expand test coverage to include API integration, E2E, and contract gas/safety tests

## Documentation

See `docs/` for:

- Architecture and module design
- OpenAPI spec draft
- User onboarding documentation
- BCA project phase plan and deliverables templates



