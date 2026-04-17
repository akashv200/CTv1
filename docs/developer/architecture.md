# ChainTrace Architecture

## System Overview

ChainTrace follows a modular monorepo architecture with three primary runtime surfaces:

- React frontend for user and consumer experiences
- Node/Express backend for APIs, orchestration, and realtime distribution
- Solidity contracts on Ganache-compatible local EVM for integrity guarantees during testing

## High-Level Components

1. Frontend
- Domain-aware UI engine (Agriculture/Pharma/Food/E-commerce/Warehouse)
- Dashboard widgets, analytics, and 3D views
- Product registration and public verification portals
- Socket feed consumption for realtime checkpoints and sensor updates

2. Backend
- REST for operational CRUD workflows
- GraphQL for dense read/query views (journeys, activity feeds)
- Socket.io for event push
- Auth: JWT and OAuth hooks
- MongoDB as system of record
- Redis for cache/event queues
- PostgreSQL for sensor time-series
- MQTT listener for IoT ingest

3. Blockchain
- UniversalTraceability contract for products/checkpoints/certificates
- IoTOracle contract for oracle-published sensor snapshots
- RewardToken for consumer engagement economics

## Data Flow

1. Product registration
- User submits wizard data
- Backend validates and stores metadata in MongoDB
- Backend queues/executes smart contract registration
- Blockchain tx hash is associated with product record

2. Checkpoint update
- Logistics user submits checkpoint and optional IoT payload
- Backend stores checkpoint + anomaly analysis
- Sensor points are written to PostgreSQL (`sensor_readings`)
- Socket.io emits `checkpoint:created` to clients

3. Consumer verification
- Consumer scans QR / inputs product ID
- Public endpoint resolves product + full journey
- Trust score and status are computed and returned

## Domain Adaptation Strategy

- Domain key drives:
  - UI accent theme
  - Dashboard widgets
  - Dynamic registration fields
  - AI insights focus
  - 3D scene mode

## Security Controls (Current Scaffold)

- Helmet + CORS + rate limiting
- JWT authentication middleware
- Role gate middleware (extensible)
- Zod input validation
- Immutable on-chain event logs (contract layer)

## Scaling Plan

- Horizontal backend pods behind L7 load balancer
- Redis pub/sub for cross-instance socket fanout
- Managed Mongo cluster with indexed collections
- Event-driven checkpoint processors for AI scoring and notifications
- CDN caching for static assets and verification views
