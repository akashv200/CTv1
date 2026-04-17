# ChainTrace Quick Reference Card

## 🚀 Common Commands

### Infrastructure (Docker)

```bash
# Start all services
start-infrastructure.bat

# OR manually
docker-compose up -d postgres redis mqtt

# Start with AI service
docker-compose --profile ai up -d

# Start management UIs
docker-compose --profile tools up -d pgadmin redis-commander

# View running services
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f ai-service

# Stop all services
docker-compose stop

# Restart a service
docker-compose restart postgres

# Complete reset (DELETES ALL DATA)
docker-compose down -v
```

### Blockchain (Ganache)

```bash
# Navigate to blockchain workspace
cd c:\Blockchain\chainTrace\blockchain

# Deploy contracts
npm run deploy:ganache

# Compile contracts only
npm run compile

# Run tests
npm run test
```

### Backend (Server)

```bash
# Navigate to server workspace
cd c:\Blockchain\chainTrace\server

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Seed database with demo data
npm run seed:demo

# Run IoT simulator
npm run iot:sim
```

### Frontend (Client)

```bash
# Navigate to client workspace
cd c:\Blockchain\chainTrace\client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 🔗 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | - |
| **Backend API** | http://localhost:4000 | - |
| **API Health** | http://localhost:4000/api/health | - |
| **GraphQL** | http://localhost:4000/graphql | - |
| **PostgreSQL** | localhost:5432 | postgres / postgres |
| **Redis** | localhost:6379 | - |
| **MQTT** | localhost:1883 | - |
| **AI Service** | http://localhost:5000 | - |
| **PgAdmin** | http://localhost:5050 | admin@chaintrace.io / admin |
| **Redis UI** | http://localhost:8081 | - |
| **Ganache RPC** | http://127.0.0.1:7545 | - |

---

## 👤 Demo Accounts

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@chaintrace.io | Admin@12345 | super_admin | Full platform access |
| demo@chaintrace.io | Demo@12345 | org_admin | Organization admin |
| producer@chaintrace.io | Demo@12345 | producer | Product management |

---

## 🧪 Quick Tests

### Test PostgreSQL
```bash
docker exec -it chaintrace-postgres psql -U postgres -d chaintrace -c "\dt"
```

### Test Redis
```bash
docker exec -it chaintrace-redis redis-cli ping
```

### Test AI Service
```bash
curl -X POST http://localhost:5000/detect ^
  -H "Content-Type: application/json" ^
  -d "{\"temperature\": 8.5, \"humidity\": 72.0, \"domain\": \"pharmaceutical\"}"
```

### Test Backend API
```bash
curl http://localhost:4000/api/health
```

### Test Ganache
```bash
curl -X POST http://127.0.0.1:7545 ^
  -H "Content-Type: application/json" ^
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}"
```

---

## 📁 Important Files

### Environment Files
```
server/.env              - Backend configuration
client/.env              - Frontend configuration
blockchain/.env          - Blockchain configuration
```

### Database Schema
```
server/src/config/postgres.ts  - PostgreSQL schema definition
```

### Smart Contracts
```
blockchain/contracts/UniversalTraceability.sol
blockchain/contracts/AccessControl.sol
blockchain/contracts/IoTOracle.sol
```

### Documentation
```
SETUP_GUIDE.md                  - Complete setup guide
docs/database/ENTERPRISE_SCHEMA.md  - Database schema docs
README.md                       - Project overview
```

---

## 🔧 Common Fixes

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5432
netstat -ano | findstr :7545
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Docker Not Running
```
1. Open Docker Desktop
2. Wait for green "Docker Desktop running" message
3. Retry docker-compose commands
```

### Ganache Not Starting
```
1. Close existing Ganache instance
2. Delete workspace data in Ganache settings
3. Restart Ganache with Quickstart
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep chaintrace-postgres

# Check connection
docker exec -it chaintrace-postgres pg_isready

# Restart PostgreSQL
docker-compose restart postgres
```

### Backend Won't Start
```bash
# 1. Check dependencies are running
docker-compose ps

# 2. Check .env file exists
type server\.env

# 3. Build to check for errors
cd server
npm run build

# 4. View detailed logs
npm run dev
```

---

## 📊 Monitoring

### View Database Tables
```bash
docker exec -it chaintrace-postgres psql -U postgres -d chaintrace
\dt
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM checkpoints;
\q
```

### View Redis Keys
```bash
docker exec -it chaintrace-redis redis-cli
KEYS *
GET some_key
\q
```

### View Blockchain Transactions
```
Open Ganache GUI → Click "Transactions" tab
```

### View API Logs
```bash
# Backend terminal shows live logs
cd server
npm run dev
```

---

## 🎯 Typical Workflow

### 1. Morning Startup
```bash
# 1. Start Docker infrastructure
start-infrastructure.bat

# 2. Start Ganache GUI
# Click Quickstart

# 3. Start backend (new terminal)
cd server
npm run dev

# 4. Start frontend (new terminal)
cd client
npm run dev
```

### 2. Development Loop
```bash
# Edit code → Auto-reload happens automatically
# Backend: tsx watch reloads on file changes
# Frontend: Vite HMR reloads on file changes
```

### 3. Evening Shutdown
```bash
# 1. Stop frontend (Ctrl+C)
# 2. Stop backend (Ctrl+C)
# 3. Stop Docker services
docker-compose stop
# 4. Close Ganache
```

---

## 🚨 Emergency Reset

If everything is broken and you need a fresh start:

```bash
# 1. Stop everything
docker-compose down -v
taskkill /IM node.exe /F

# 2. Delete node_modules (optional)
rmdir /s /q node_modules
rmdir /s /q server\node_modules
rmdir /s /q client\node_modules
rmdir /s /q blockchain\node_modules

# 3. Reinstall
npm install

# 4. Start fresh
start-infrastructure.bat

# 5. Deploy and seed
cd blockchain
npm run deploy:ganache
cd ..\server
npm run seed:demo

# 6. Start servers
npm run dev  # in server/
npm run dev  # in client/
```

---

**Print this page for quick reference!** 🖨️
