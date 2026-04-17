@echo off
REM ==========================================
REM ChainTrace Infrastructure Startup Script
REM Starts PostgreSQL, Redis, MQTT, and optionally AI service
REM ==========================================

echo.
echo ========================================
echo  ChainTrace Infrastructure Starter
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/4] Starting PostgreSQL, Redis, and MQTT...
docker-compose up -d postgres redis mqtt

REM Wait for PostgreSQL to be ready
echo.
echo [2/4] Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

:PG_WAIT
docker exec chaintrace-postgres pg_isready >nul 2>&1
if errorlevel 1 (
    echo   Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto PG_WAIT
)
echo   PostgreSQL is ready!

REM Wait for Redis to be ready
echo.
echo [3/4] Waiting for Redis to be ready...
timeout /t 2 /nobreak >nul
docker exec chaintrace-redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo   Redis is not ready yet, waiting...
    timeout /t 2 /nobreak >nul
    goto PG_WAIT
)
echo   Redis is ready!

REM Check if AI service should be started
echo.
set /p START_AI="Start AI/ML service? (y/n): "
if /i "%START_AI%"=="y" (
    echo [4/4] Starting AI/ML anomaly detection service...
    docker-compose --profile ai up -d ai-service
    echo   AI service starting on http://localhost:5000
) else (
    echo [4/4] Skipping AI/ML service (start later with: docker-compose --profile ai up -d ai-service)
)

echo.
echo ========================================
echo  Infrastructure Started Successfully!
echo ========================================
echo.
echo Services:
echo   - PostgreSQL: localhost:5432
echo   - Redis:      localhost:6379
echo   - MQTT:       localhost:1883
echo.
echo Optional Tools (start with --profile tools):
echo   - PgAdmin:    http://localhost:5050 (admin@chaintrace.io / admin)
echo   - Redis UI:   http://localhost:8081
echo.
echo Next Steps:
echo   1. Deploy contracts: cd blockchain ^&^& npm run deploy:ganache
echo   2. Seed database:    cd server ^&^& npm run seed:demo
echo   3. Start backend:    npm run dev
echo   4. Start frontend:   cd client ^&^& npm run dev
echo.
pause
