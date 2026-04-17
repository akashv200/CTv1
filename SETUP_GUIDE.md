# ChainTrace Complete Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** (LTS recommended)
- **Docker Desktop** (for PostgreSQL, Redis, MQTT, AI services)
- **Ganache** (local Ethereum blockchain)
- **Git**

---

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd c:\Blockchain\chainTrace
npm install
```

### Step 2: Start Infrastructure (Docker)

**Option A: Automated Script (Recommended)**
```bash
start-infrastructure.bat
```

This will:
- ✅ Start PostgreSQL on port 5432
- ✅ Start Redis on port 6379
- ✅ Start MQTT broker on port 1883
- ✅ Optionally start AI/ML service on port 5000

**Option B: Manual Start**
```bash
docker-compose up -d postgres redis mqtt

# Optional: Start AI service
docker-compose --profile ai up -d ai-service

# Optional: Start management UIs
docker-compose --profile tools up -d pgadmin redis-commander
```

### Step 3: Configure Environment Files

#### Server (.env)
```bash
cd server
copy .env.example .env
```

**Key settings in `server/.env`:**
```env
PG_URL=postgresql://postgres:postgres@127.0.0.1:5432/chaintrace
REDIS_URL=redis://localhost:6379
EVM_RPC_URL=http://127.0.0.1:7545
CHAIN_ID=5777
CHAIN_NAME=ganache-local
AI_SERVICE_URL=http://localhost:5000
AI_ENABLED=true
```

#### Client (.env)
```bash
cd ..\client
copy .env.example .env
```

**Key settings in `client/.env`:**
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

#### Blockchain (.env)
```bash
cd ..\blockchain
copy .env.example .env
```

**Key settings in `blockchain/.env`:**
```env
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_CHAIN_ID=5777
GANACHE_MNEMONIC="atom license nature soon version rib safe dragon tilt frequent include law"
```

### Step 4: Start Ganache

1. Open **Ganache** application
2. Click **Quickstart** (creates local blockchain on port 7545)
3. Note the **Mnemonic** phrase (use this in `blockchain/.env`)
4. Keep Ganache running in the background

### Step 5: Deploy Smart Contracts

```bash
cd c:\Blockchain\chainTrace\blockchain
npm run deploy:ganache
```

**Expected output:**
```
Deploying with: 0xYourAddress...
AccessControl: 0x1234...
UniversalTraceability: 0x5678...
IoTOracle: 0x9abc...
RewardToken: 0xdef0...
```

**Important:** Copy the `UniversalTraceability` contract address and paste it into `server/.env`:
```env
TRACEABILITY_CONTRACT=0x5678...
```

Also copy one of the Ganache account private keys to `server/.env`:
```env
EVM_PRIVATE_KEY=0xYourPrivateKeyHere
```

### Step 6: Seed Database with Demo Data

```bash
cd c:\Blockchain\chainTrace\server
npm run seed:demo
```

**Demo Accounts Created:**
| Email | Password | Role |
|---|---|---|
| admin@chaintrace.io | Admin@12345 | Super Admin |
| demo@chaintrace.io | Demo@12345 | Org Admin |
| producer@chaintrace.io | Demo@12345 | Producer |

### Step 7: Start Backend Server

```bash
cd c:\Blockchain\chainTrace\server
npm run dev
```

**Expected output:**
```
[postgres] Connected
[redis] Connected
[server] ChainTrace API running on http://localhost:4000
```

### Step 8: Start Frontend

Open a **new terminal**:
```bash
cd c:\Blockchain\chainTrace\client
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 9: Login & Explore

Open browser: **http://localhost:5173**

Login with:
- **Email:** demo@chaintrace.io
- **Password:** Demo@12345

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│                  http://localhost:5173                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                Backend (Node.js/Express)                │
│                  http://localhost:4000                  │
└───┬──────────┬──────────┬───────────┬──────────┬────────┘
    │          │          │           │          │
    ▼          ▼          ▼           ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│PostgreSQL│ │ Redis  │ │Ganache │ │  MQTT  ││AI Service│
│ :5432  │ │ :6379  │ │ :7545  │ │ :1883  ││ :5000    │
└────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
```

---

## Infrastructure Management

### Docker Services

**View running services:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs -f postgres
docker-compose logs -f ai-service
```

**Stop all services:**
```bash
docker-compose down
```

**Stop and remove volumes (WARNING: Deletes all data):**
```bash
docker-compose down -v
```

### Management UIs

**PgAdmin (Database Management):**
```bash
docker-compose --profile tools up -d pgadmin
```
- URL: http://localhost:5050
- Email: admin@chaintrace.io
- Password: admin

**Redis Commander:**
```bash
docker-compose --profile tools up -d redis-commander
```
- URL: http://localhost:8081

---

## Testing the Integration

### Test PostgreSQL Connection

```bash
docker exec -it chaintrace-postgres psql -U postgres -d chaintrace -c "SELECT version();"
```

### Test Redis Connection

```bash
docker exec -it chaintrace-redis redis-cli ping
# Should return: PONG
```

### Test AI Service

```bash
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 8.5,
    "humidity": 72.0,
    "domain": "pharmaceutical",
    "product_id": "CT-PH-001"
  }'
```

**Expected response:**
```json
{
  "is_anomaly": true,
  "severity": "critical",
  "confidence": 0.99,
  "z_score": 1.75,
  "temperature": {...},
  "humidity": {...},
  "recommendations": [...]
}
```

### Test Blockchain Connection

```bash
curl -X POST http://127.0.0.1:7545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

---

## Troubleshooting

### PostgreSQL Connection Refused

**Problem:** Cannot connect to PostgreSQL

**Solution:**
```bash
# Check if container is running
docker ps | grep chaintrace-postgres

# Restart container
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Redis Not Responding

**Problem:** Redis commands timeout

**Solution:**
```bash
docker-compose restart redis
docker exec -it chaintrace-redis redis-cli ping
```

### Ganache Not Starting

**Problem:** Port 7545 already in use

**Solution:**
1. Close any existing Ganache instances
2. Check for port conflicts:
   ```bash
   netstat -ano | findstr :7545
   ```
3. Kill the process or change port in `blockchain/.env`

### Smart Contract Deployment Fails

**Problem:** `deploy:ganache` script fails

**Solution:**
1. Ensure Ganache is running on port 7545
2. Verify mnemonic in `blockchain/.env` matches Ganache
3. Check Node.js version (must be 18+)
4. Reinstall dependencies:
   ```bash
   cd blockchain
   rm -rf node_modules
   npm install
   ```

### Backend Won't Start

**Problem:** Server crashes on startup

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   docker exec -it chaintrace-postgres pg_isready
   ```
2. Check Redis is running:
   ```bash
   docker exec -it chaintrace-redis redis-cli ping
   ```
3. Verify `.env` file exists and has correct values
4. Check for TypeScript errors:
   ```bash
   cd server
   npm run build
   ```

### Frontend Shows Blank Page

**Problem:** Frontend loads but shows nothing

**Solution:**
1. Open browser console (F12) and check for errors
2. Verify backend is running on http://localhost:4000
3. Check CORS settings in `server/.env`:
   ```env
   CLIENT_ORIGIN=http://localhost:5173
   ```

### AI Service Not Responding

**Problem:** `/detect` endpoint returns 500

**Solution:**
```bash
# Check if AI service is running
docker-compose ps ai-service

# View logs
docker-compose logs ai-service

# Restart service
docker-compose --profile ai restart ai-service
```

---

## Development Workflow

### Daily Startup Sequence

1. **Start Docker infrastructure:**
   ```bash
   start-infrastructure.bat
   ```

2. **Start Ganache** (GUI application)

3. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```

4. **Start frontend:**
   ```bash
   cd client
   npm run dev
   ```

### Shutdown Sequence

1. Stop frontend (Ctrl+C)
2. Stop backend (Ctrl+C)
3. Stop Docker services:
   ```bash
   docker-compose stop
   ```
4. Close Ganache

---

## Advanced Configuration

### Enable MQTT for IoT Sensors

1. Uncomment MQTT section in `docker-compose.yml`
2. Update `server/.env`:
   ```env
   MQTT_URL=mqtt://localhost:1883
   ```
3. Restart backend

### Enable Email Notifications

1. Add SMTP settings to `server/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### Connect to External PostgreSQL

1. Update `server/.env`:
   ```env
   PG_URL=postgresql://user:password@your-host:5432/chaintrace
   ```
2. Remove `postgres` from `docker-compose.yml`

### Production Deployment

For production:

1. **Use environment-specific `.env` files**
2. **Enable SSL for PostgreSQL**
3. **Use strong JWT_SECRET**
4. **Deploy to cloud:**
   - Frontend: Vercel/Netlify
   - Backend: AWS/GCP/DigitalOcean
   - PostgreSQL: Managed service (RDS, Cloud SQL)
   - Redis: Managed service (ElastiCache, Memorystore)
   - Ganache: Replace with testnet/mainnet

---

## Performance Optimization

### PostgreSQL Tuning

Add to `docker-compose.yml` postgres service:
```yaml
command: >
  postgres
  -c shared_buffers=256MB
  -c max_connections=200
  -c work_mem=4MB
```

### Redis Persistence

Redis data is already persisted via volume. To enable AOF:
```bash
docker exec -it chaintrace-redis redis-cli CONFIG SET appendonly yes
```

### AI Service Scaling

To run multiple AI service instances:
```bash
docker-compose --profile ai up -d --scale ai-service=3
```

---

## Next Steps

1. **Explore the dashboard:** http://localhost:5173/dashboard
2. **Create supply chain networks:** http://localhost:5173/scm/ecosystem
3. **Register products:** http://localhost:5173/register
4. **Verify products:** http://localhost:5173/verify
5. **View settings:** http://localhost:5173/settings

**Read the full documentation:**
- [Database Schema](docs/database/ENTERPRISE_SCHEMA.md)
- [API Documentation](docs/api/)
- [User Guides](docs/user/)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `docker-compose logs -f`
3. Check server logs in terminal
4. Check browser console for frontend errors

**ChainTrace Engineering Team** © 2026
