import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const PG_URL = process.env.PG_URL || 'postgresql://postgres:AkAkAk007@localhost:5432/chaintrace';

async function testDetail() {
  console.log(`Checking Postgres: ${PG_URL}`);
  const pool = new Pool({ connectionString: PG_URL });
  try {
    await pool.query('SELECT 1');
    console.log('✅ POSTGRES: Connected');
  } catch (err) {
    console.log('❌ POSTGRES: Disconnected (ECONNREFUSED)');
  } finally {
    await pool.end();
  }

  const GANACHE_URL = process.env.EVM_RPC_URL || 'http://127.0.0.1:7545';
  console.log(`Checking Ganache: ${GANACHE_URL}`);
  try {
    const res = await fetch(GANACHE_URL, {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) console.log('✅ GANACHE: Connected');
    else console.log('❌ GANACHE: HTTP Error ' + res.status);
  } catch (err) {
    console.log('❌ GANACHE: Disconnected (ECONNREFUSED)');
  }
}

testDetail();
