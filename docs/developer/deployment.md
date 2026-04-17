# Deployment Guide

## Recommended Stack

- Frontend: Vercel or Netlify
- Backend: AWS ECS / Google Cloud Run
- MongoDB: Atlas
- Redis: Upstash or Elasticache
- PostgreSQL: Managed PostgreSQL/TimescaleDB
- Smart contracts: Ganache local development network (chain ID 5777)

## CI/CD Outline

1. Lint + type checks
2. Unit/integration test execution
3. Smart contract compile + tests
4. Artifact build and deploy
5. Smoke tests and rollback gates

## Environment Separation

- Development: local services + Hardhat network
- Staging: Ganache dev chain + managed cloud services
- Production: private/permissioned EVM or public EVM after final hardening
