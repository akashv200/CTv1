import axios from 'axios';

const API_ROOT = 'http://localhost:4000/api';

async function testFlow() {
  console.log('🚀 Starting Governance Workflow Integration Test...');

  try {
    // 1. Login as Super Admin
    console.log('Step 1: Logging in as Super Admin...');
    const loginRes = await fetch(`${API_ROOT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@chaintrace.io',
        password: 'Admin@12345'
      })
    });
    const loginData: any = await loginRes.json();
    const token = loginData.accessToken;
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Create a new SCM Network
    console.log('Step 2: Creating a new SCM Network...');
    const createRes = await fetch(`${API_ROOT}/b2b/networks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Nexus',
        domain: 'food',
        description: 'Automated Test Network'
      })
    });
    const createData: any = await createRes.json();
    console.log('Create Response:', createData);
    const networkId = createData.id;
    if (!networkId) throw new Error(`Network creation failed: ${JSON.stringify(createData)}`);
    console.log(`✅ Network created with ID: ${networkId}`);

    // 3. Verify initial state (1 approval - the creator)
    console.log('Step 3: Verifying initial governance state...');
    const listRes = await fetch(`${API_ROOT}/b2b/networks`, { headers: authHeaders });
    const listData: any = await listRes.json();
    console.log('List Response:', listData);
    
    if (!Array.isArray(listData)) throw new Error(`List Response is not an array: ${JSON.stringify(listData)}`);
    const network = listData.find((n: any) => n.id === networkId);
    
    console.log(`Current Status: ${network.status}`);
    console.log(`Approvals: ${network.governance_approvals.length}/2`);

    if (network.status !== 'pending_approval') {
      throw new Error(`Expected pending_approval, got ${network.status}`);
    }

    // 4. (Simulate) Second Admin Approval
    console.log('Step 4: Logging in as Second Admin (Demo Admin)...');
    const login2Res = await fetch(`${API_ROOT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@chaintrace.io',
        password: 'Demo@12345'
      })
    });
    const login2Data: any = await login2Res.json();
    const token2 = login2Data.accessToken;
    if (!token2) throw new Error(`Second login failed: ${JSON.stringify(login2Data)}`);
    
    const authHeaders2 = { 
      'Authorization': `Bearer ${token2}`,
      'Content-Type': 'application/json'
    };

    console.log('Step 5: Submitting Second Approval...');
    const approveRes = await fetch(`${API_ROOT}/b2b/networks/${networkId}/approve`, {
      method: 'POST',
      headers: authHeaders2
    });
    const approveData: any = await approveRes.json();
    console.log(`✅ Approval Result: ${approveData.message}`);
    console.log(`New Status: ${approveData.status}`);
    console.log(`Blockchain Address: ${approveData.blockchainAddress}`);

    if (approveData.status !== 'active' || !approveData.blockchainAddress) {
      throw new Error(`Activation failed: ${approveData.error || 'Unknown error'}`);
    }

    console.log('🎉 Integration Test Successful! All governance gates passed.');

  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
  }
}

testFlow();
