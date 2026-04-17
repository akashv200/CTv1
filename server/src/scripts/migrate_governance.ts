import { pgPool } from '../config/postgres.js';

async function migrate() {
  console.log('👷 Running schema migration...');
  try {
    await pgPool.query(`
      ALTER TABLE supplier_relationships DROP CONSTRAINT IF EXISTS supplier_rel_pair_unique;
      ALTER TABLE supplier_relationships ADD COLUMN blockchain_address TEXT;
      ALTER TABLE supplier_relationships ADD COLUMN governance_approvals JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE supplier_relationships DROP CONSTRAINT IF EXISTS supplier_rel_contract_check;
      ALTER TABLE supplier_relationships ADD CONSTRAINT supplier_rel_contract_check CHECK (contract_status IN ('prospect', 'active', 'on_hold', 'terminated', 'expired', 'pending_approval'));
    `);
    console.log('✅ Schema migration successful.');
  } catch (e) {
    console.error('❌ Migration failed:', (e as Error).message);
  } finally {
    await pgPool.end();
  }
}

migrate();
