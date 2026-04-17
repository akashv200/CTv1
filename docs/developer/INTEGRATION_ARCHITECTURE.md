# ChainTrace Integration Architecture

## System Overview

ChainTrace is a **full-stack enterprise SCM platform** integrating:
- **PostgreSQL** (relational data store)
- **Ganache** (blockchain smart contracts)
- **Docker AI Service** (anomaly detection & forecasting)
- **Redis** (caching & realtime messaging)
- **MQTT** (IoT sensor telemetry)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                  http://localhost:5173 (React SPA)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  AppShell.tsx - System Status Monitor                    │      │
│  │  • PostgreSQL health check (via backend API)             │      │
│  │  • Ganache RPC check (direct HTTP)                       │      │
│  │  • AI Service check (direct HTTP)                        │      │
│  │  • Auto-refreshes every 30 seconds                       │      │
│  └──────────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/REST + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER (Node.js)                       │
│                     http://localhost:4000                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Express.js   │  │  GraphQL     │  │  Socket.io               │  │
│  │ REST API     │  │  API         │  │  Realtime Events         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│  ┌──────▼─────────────────▼──────────────────────▼───────────────┐  │
│  │                   Controllers Layer                           │  │
│  │  • authController        • b2bDirectoryController             │  │
│  │  • productController     • enterpriseScmController            │  │
│  │  • checkpointController  • integrationController              │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │                   Services Layer                              │  │
│  │  • postgres.ts    → PostgreSQL queries                        │  │
│  │  • aiService.ts   → Anomaly detection                         │  │
│  │  • traceabilityClient.ts → Blockchain calls                  │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │   Ganache    │ │  Docker AI       │
│   :5432          │ │   :7545      │ │  Service :5000   │
│                  │ │              │ │                  │
│  • companies     │ │  • Universal │ │  • Flask REST    │
│  • users         │ │    Traceabi- │ │  • Anomaly       │
│  • products      │ │    lity.sol  │ │    Detection     │
│  • checkpoints   │ │  • Access    │ │  • Demand        │
│  • inventory     │ │    Control   │ │    Forecast      │
│  • shipments     │ │  • IoT       │ │  • Inventory     │
│  • supplier_rel  │ │    Oracle    │ │    Optimization  │
│  • production    │ │  • Reward    │ │                  │
│  • ai_insights   │ │    Token     │ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

---

## Data Flow Examples

### 1. Product Registration (Blockchain + PostgreSQL)

```
User → Frontend → POST /api/products → Backend Controller
                                              │
                                              ├─→ PostgreSQL: INSERT INTO products
                                              │   (id, product_id, name, domain, ...)
                                              │
                                              └─→ Blockchain: traceabilityClient.registerProduct()
                                                    │
                                                    └─→ Ganache RPC: contract.registerProduct()
                                                         │
                                                         └─→ Returns: txHash, onChainId, blockNumber
                                                              │
                                                              └─→ PostgreSQL: UPDATE products SET
                                                                    blockchain_tx_hash = ...,
                                                                    smart_contract_id = ...
```

### 2. Checkpoint Creation with IoT (PostgreSQL + Blockchain + AI)

```
Sensor Event → MQTT Broker → Backend Listener
                                      │
                                      ├─→ PostgreSQL: INSERT INTO checkpoints
                                      │   (product_id, checkpoint_type, temperature, ...)
                                      │
                                      ├─→ AI Service: POST /detect
                                      │   { temperature, humidity, domain }
                                      │   │
                                      │   └─→ Returns: is_anomaly, severity, confidence
                                      │        │
                                      │        └─→ If anomaly: INSERT INTO ai_anomaly_insights
                                      │
                                      └─→ Blockchain: traceabilityClient.addCheckpoint()
                                            │
                                            └─→ Ganache RPC: contract.addCheckpoint()
```

### 3. Anomaly Detection (Docker AI Service)

```
Temperature Reading → Backend Service
                            │
                            ├─→ Local Detection (fallback)
                            │   detectAnomaly({ temperature, humidity, domain })
                            │   │
                            │   └─→ Z-score calculation against domain baselines
                            │
                            └─→ AI Service Detection (if available)
                                POST http://localhost:5000/detect
                                {
                                  "temperature": 8.5,
                                  "humidity": 72.0,
                                  "domain": "pharmaceutical"
                                }
                                │
                                └─→ Returns:
                                    {
                                      "is_anomaly": true,
                                      "severity": "critical",
                                      "confidence": 0.99,
                                      "recommendations": [...]
                                    }
```

### 4. System Health Monitoring (Frontend AppShell)

```
AppShell Component Mount
        │
        └─→ checkServiceHealth() [runs every 30s]
              │
              ├─→ PostgreSQL Check
              │   fetch("/api/health")
              │   │
              │   └─→ Backend queries PostgreSQL
              │       └─→ Returns: { ok: true, service: "chaintrace-backend" }
              │
              ├─→ Ganache Check
              │   fetch("http://127.0.0.1:7545", {
              │     method: "POST",
              │     body: JSON.stringify({
              │       jsonrpc: "2.0",
              │       method: "eth_blockNumber"
              │     })
              │   })
              │   │
              │   └─→ Returns: { result: "0x5" } (block number)
              │
              └─→ AI Service Check
                  fetch("http://localhost:5000/health")
                  │
                  └─→ Returns: { status: "healthy", service: "chaintrace-ai" }
```

---

## Integration Points

### PostgreSQL ↔ Backend

**Connection Pool:**
```typescript
// server/src/config/postgres.ts
const pgPool = new Pool({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/chaintrace"
});
```

**Schema Management:**
- `ensurePostgresSchema()` creates 20 tables if not exists
- Idempotent: safe to run multiple times
- Uses `CREATE TABLE IF NOT EXISTS`

**Query Example:**
```typescript
const result = await pgPool.query(
  `SELECT * FROM products WHERE company_id = $1 AND status = $2`,
  [companyId, "active"]
);
```

---

### Ganache ↔ Backend

**Connection:**
```typescript
// server/src/blockchain/traceabilityClient.ts
const provider = new JsonRpcProvider("http://127.0.0.1:7545");
const signer = new Wallet(privateKey, provider);
const contract = new Contract(contractAddress, ABI, signer);
```

**Contract Deployment:**
```bash
cd blockchain
npm run deploy:ganache
```

**Output:**
```
AccessControl: 0x1234...
UniversalTraceability: 0x5678...  ← Copy to server/.env
IoTOracle: 0x9abc...
RewardToken: 0xdef0...
```

**Environment Config:**
```env
# server/.env
EVM_RPC_URL=http://127.0.0.1:7545
CHAIN_ID=5777
TRACEABILITY_CONTRACT=0x5678...
EVM_PRIVATE_KEY=0xYourKey
```

---

### AI Service (Docker) ↔ Backend

**Connection:**
```typescript
// server/src/services/aiService.ts
const response = await fetch("http://localhost:5000/detect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    temperature: 8.5,
    humidity: 72.0,
    domain: "pharmaceutical"
  })
});
```

**Docker Compose:**
```yaml
# docker-compose.yml
ai-service:
  build:
    context: ./ai
    dockerfile: Dockerfile
  ports:
    - "5000:5000"
  environment:
    - PG_URL=postgresql://postgres:postgres@postgres:5432/chaintrace
    - REDIS_URL=redis://redis:6379
  profiles:
    - ai
```

**Start Command:**
```bash
docker-compose --profile ai up -d ai-service
```

---

### Redis ↔ Backend

**Connection:**
```typescript
// server/src/config/redis.ts
import Redis from "ioredis";
const redis = new Redis("redis://localhost:6379");
```

**Use Cases:**
- Session caching
- MQTT message queue
- Realtime event pub/sub
- Rate limiting

---

### MQTT ↔ Backend

**Connection:**
```typescript
// server/src/config/mqtt.ts
import mqtt from "mqtt";
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("chaintrace/sensors/#");
});

client.on("message", (topic, payload) => {
  const data = JSON.parse(payload.toString());
  // Process sensor reading
});
```

**Start MQTT Broker:**
```bash
docker-compose up -d mqtt
```

---

## Startup Sequence

### 1. Infrastructure (Docker)
```bash
start-infrastructure.bat
```
**What it does:**
1. Starts PostgreSQL container
2. Waits for PostgreSQL to be ready
3. Starts Redis container
4. Waits for Redis to be ready
5. Starts MQTT broker
6. Optionally starts AI service

### 2. Ganache (GUI)
```
Open Ganache → Click "Quickstart"
```
**What it does:**
- Creates local Ethereum blockchain
- Generates 10 test accounts
- Runs on port 7545

### 3. Deploy Contracts
```bash
cd blockchain
npm run deploy:ganache
```
**What it does:**
- Compiles Solidity contracts
- Deploys to Ganache
- Returns contract addresses

### 4. Seed Database
```bash
cd server
npm run seed:demo
```
**What it does:**
- Creates 7 demo companies
- Creates 3 demo users
- Creates 5 demo products
- Creates supply chain relationships
- Inserts IoT devices, checkpoints, AI insights

### 5. Start Backend
```bash
cd server
npm run dev
```
**What it does:**
- Connects to PostgreSQL
- Connects to Redis
- Connects to Ganache (if configured)
- Connects to AI Service (if running)
- Connects to MQTT broker
- Starts HTTP server on port 4000

### 6. Start Frontend
```bash
cd client
npm run dev
```
**What it does:**
- Starts Vite dev server
- Connects to backend via WebSocket
- Checks service health on mount
- Displays system status in AppShell

---

## Health Check Endpoints

### PostgreSQL (via Backend)
```bash
curl http://localhost:4000/api/health
```
**Response:**
```json
{ "ok": true, "service": "chaintrace-backend" }
```

### Ganache
```bash
curl -X POST http://127.0.0.1:7545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```
**Response:**
```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x5" }
```

### AI Service
```bash
curl http://localhost:5000/health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "chaintrace-ai",
  "timestamp": "2026-04-07T12:00:00.000Z"
}
```

### Redis
```bash
docker exec -it chaintrace-redis redis-cli ping
```
**Response:**
```
PONG
```

---

## Troubleshooting Integration

### PostgreSQL Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix:**
```bash
docker-compose restart postgres
docker exec -it chaintrace-postgres pg_isready
```

### Ganache Not Responding
```
Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
```
**Fix:**
1. Ensure Ganache GUI is running
2. Verify port 7545 is not blocked
3. Check `EVM_RPC_URL` in server/.env

### AI Service Timeout
```
Error: fetch failed (http://localhost:5000/detect)
```
**Fix:**
```bash
docker-compose --profile ai restart ai-service
docker-compose logs ai-service
```

### Blockchain Transaction Fails
```
Error: execution reverted: Product not found
```
**Fix:**
1. Verify contract address in server/.env
2. Ensure EVM_PRIVATE_KEY has Ganache ETH
3. Check Ganache transactions tab

---

## Production Deployment

### Replace Ganache with Testnet/Mainnet
```env
# server/.env
EVM_RPC_URL=https://rpc.ankr.com/eth  # Ethereum Mainnet
CHAIN_ID=1
TRACEABILITY_CONTRACT=0xYourDeployedContract
EVM_PRIVATE_KEY=your_production_key
```

### Replace Local PostgreSQL with Managed
```env
# server/.env
PG_URL=postgresql://user:pass@your-rds-endpoint:5432/chaintrace?sslmode=require
PG_SSL=true
```

### Deploy AI Service to Cloud
```env
# server/.env
AI_SERVICE_URL=https://your-ai-service.herokuapp.com
```

### Use Managed Redis
```env
# server/.env
REDIS_URL=redis://your-elasticache-endpoint:6379
```

---

## Performance Metrics

| Component | Response Time | Throughput |
|-----------|--------------|------------|
| PostgreSQL | < 10ms | 1000+ queries/s |
| Ganache | < 100ms | 10+ tx/s |
| AI Service | < 50ms | 100+ predictions/s |
| Redis | < 1ms | 10,000+ ops/s |
| MQTT | < 5ms | 1000+ messages/s |

---

**ChainTrace Engineering Team** © 2026
