import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pgPool } from "../config/postgres.js";
import { registerNetworkPartnerOnChain } from "../blockchain/traceabilityClient.js";

function getBusinessContext(req: Request) {
  const companyId = (req.user as any)?.orgId;
  const isSuperAdmin = (req.user as any)?.role === "super_admin";
  
  return {
    // If Super Admin has no org, default to BlueRiver Foods (org-demo) for ecosystem actions
    companyId: companyId ?? (isSuperAdmin ? "org-demo" : null),
    userId: req.user?.id ?? req.user?.sub ?? null,
    isSuperAdmin
  };
}

function mapPartnerRoleToRelationshipType(partnerRole: string) {
  if (partnerRole === "manufacturer") return "manufacturer";
  if (partnerRole === "distributor") return "distributor";
  if (partnerRole === "logistics") return "logistics_partner";
  if (partnerRole === "warehouse") return "warehouse_partner";
  if (partnerRole === "retailer") return "retailer";
  return "supplier";
}

// Get all active companies for the directory (Authenticated only)
export const getActiveCompanies = async (req: Request, res: Response) => {
  try {
    const { domain, search } = req.query;
    const { companyId } = getBusinessContext(req);
    const viewerCompanyId = companyId ?? "__viewer__";
    
    let query = `
      SELECT
        c.id,
        c.company_code,
        c.domain,
        c.company_name,
        c.website,
        c.country,
        c.city,
        c.status,
        c.created_at,
        EXISTS (
          SELECT 1
          FROM supplier_relationships sr
          WHERE sr.buyer_company_id = $1
            AND sr.supplier_company_id = c.id
        ) AS already_linked
      FROM companies c
      WHERE status = 'active'
        AND c.id <> $1
    `;
    const params: any[] = [viewerCompanyId];
    let paramCount = 2;

    if (domain) {
      query += ` AND c.domain = $${paramCount}`;
      params.push(domain);
      paramCount++;
    }

    if (search) {
      query += ` AND (c.company_name ILIKE $${paramCount} OR c.country ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY c.company_name ASC`;

    const result = await pgPool.query(query, params);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch directory" });
  }
};

export const listSupplyChainNetworks = async (req: Request, res: Response) => {
  try {
    const { companyId } = getBusinessContext(req);
    if (!companyId) return res.status(403).json({ error: "Organization access is required." });

    // Fetch supplier relationships as network partners
    const result = await pgPool.query(
      `
        SELECT
          sr.id,
          sr.buyer_company_id AS owner_company_id,
          c.company_name AS name,
          c.domain,
          sr.contract_status AS status,
          sr.relationship_type,
          sr.category,
          sr.performance_score,
          sr.risk_level,
          sr.lead_time_days,
          sr.payment_terms,
          sr.contract_terms,
          sr.blockchain_address,
          sr.governance_approvals,
          sr.created_at,
          sr.updated_at,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', sr.id,
                'company_id', c2.id,
                'company_name', c2.company_name,
                'company_domain', c2.domain,
                'partner_role', sr.relationship_type,
                'stage_order', COALESCE(sr.contract_terms->>'stage_order', '1')::INTEGER,
                'relationship_id', sr.id,
                'notes', sr.contract_terms->>'notes',
                'performance_score', sr.performance_score,
                'risk_level', sr.risk_level
              )
            ) FILTER (WHERE c2.id IS NOT NULL),
            '[]'::json
          ) AS partners
        FROM supplier_relationships sr
        JOIN companies c ON c.id = sr.buyer_company_id
        JOIN companies c2 ON c2.id = sr.supplier_company_id
        WHERE sr.buyer_company_id = $1
          AND sr.contract_status IN ('active', 'pending_approval')
        GROUP BY sr.id, c.company_name, c.domain, sr.relationship_type, sr.category,
                 sr.performance_score, sr.risk_level, sr.lead_time_days, sr.payment_terms,
                 sr.contract_terms, sr.blockchain_address, sr.governance_approvals, sr.created_at, sr.updated_at
        ORDER BY sr.updated_at DESC
      `,
      [companyId]
    );

    // Transform relationships into network-like structures
    const networks = result.rows.map((row: any) => ({
      id: row.id,
      owner_company_id: row.owner_company_id,
      name: `${row.name} - ${row.relationship_type} Network`,
      description: `Business relationship network for ${row.category || row.relationship_type}`,
      domain: row.domain,
      status: row.status,
      blockchain_address: row.blockchain_address,
      governance_approvals: row.governance_approvals,
      created_at: row.created_at,
      updated_at: row.updated_at,
      partners: row.partners
    }));

    res.status(200).json(networks);
  } catch (error) {
    console.error("Error listing supply chain networks:", error);
    res.status(500).json({ error: "Failed to load supply chain networks" });
  }
};

export const createSupplyChainNetwork = async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = getBusinessContext(req);
    const { name, description, domain, status, metadata } = req.body;

    if (!companyId) return res.status(403).json({ error: "Organization access is required." });
    if (!name || !domain) {
      return res.status(400).json({ error: "Missing name or domain" });
    }

    // Create a supplier relationship as the network foundation in PENDING state
    const networkId = uuidv4();
    await pgPool.query(
      `
        INSERT INTO supplier_relationships (
          id, buyer_company_id, supplier_company_id, relationship_type, category,
          contract_status, risk_level, created_by, metadata, contract_terms, governance_approvals
        )
        VALUES ($1, $2, $2, 'ecosystem_partner', $3, 'pending_approval', 'low', $4, $5, $6, $7)
      `,
      [
        networkId,
        companyId,
        description ?? null,
        userId ?? null,
        metadata ?? {},
        JSON.stringify({
          name,
          domain,
          stage_order: 1,
          notes: description ?? '',
          is_network_root: true
        }),
        JSON.stringify([{
          userId,
          role: (req.user as any)?.role,
          action: 'created',
          timestamp: new Date().toISOString()
        }])
      ]
    );

    res.status(201).json({ message: "Supply chain network created", id: networkId });
  } catch (error) {
    console.error("Error creating supply chain network:", error);
    res.status(500).json({ error: "Failed to create supply chain network" });
  }
};

export const addSupplyChainPartner = async (req: Request, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { companyId, userId } = getBusinessContext(req);
    const { id: networkId } = req.params;
    const { partnerCompanyId, partnerRole, stageOrder, notes, metadata } = req.body;

    if (!companyId) return res.status(403).json({ error: "Organization access is required." });
    if (!partnerCompanyId || !partnerRole) {
      return res.status(400).json({ error: "Missing partnerCompanyId or partnerRole" });
    }

    await client.query("BEGIN");

    // Create a new supplier relationship for this partner
    const relationshipId = uuidv4();
    await client.query(
      `
        INSERT INTO supplier_relationships (
          id, buyer_company_id, supplier_company_id, relationship_type, category,
          contract_status, risk_level, created_by, metadata, contract_terms
        )
        VALUES ($1, $2, $3, $4, $5, 'active', 'medium', $6, $7, $8)
      `,
      [
        relationshipId,
        companyId,
        partnerCompanyId,
        mapPartnerRoleToRelationshipType(partnerRole),
        notes ?? null,
        userId ?? null,
        metadata ?? {},
        JSON.stringify({
          stage_order: stageOrder ?? 1,
          notes: notes ?? '',
          source: "ecosystem_builder",
          network_root_id: networkId
        })
      ]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Partner added to supply chain network", id: relationshipId, relationshipId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding supply chain partner:", error);
    res.status(500).json({ error: "Failed to add supply chain partner" });
  } finally {
    client.release();
  }
};

export const approveNetworkHandler = async (req: Request, res: Response) => {
  try {
    const { id: networkId } = req.params;
    const { userId, isSuperAdmin } = getBusinessContext(req);
    const userRole = (req.user as any)?.role;

    if (!isSuperAdmin && userRole !== "org_admin") {
      return res.status(403).json({ error: "Only administrators can approve networks." });
    }

    const networkRes = await pgPool.query(
      "SELECT id, contract_status, governance_approvals, buyer_company_id FROM supplier_relationships WHERE id = $1",
      [networkId]
    );

    if (networkRes.rowCount === 0) return res.status(404).json({ error: "Network not found." });
    const network = networkRes.rows[0];

    if (network.contract_status === "active") {
      return res.status(400).json({ error: "Network is already active." });
    }

    const approvals = network.governance_approvals || [];
    const hasAlreadyApproved = approvals.some((a: any) => a.userId === userId);

    if (hasAlreadyApproved) {
      return res.status(400).json({ error: "You have already approved this network." });
    }

    const newApprovals = [
      ...approvals,
      { userId, role: userRole, action: "approved", timestamp: new Date().toISOString() }
    ];

    let finalStatus = "pending_approval";
    let blockchainAddress = null;

    // Double Approval Check (Creator + 1 Approval = 2 Signatures)
    if (newApprovals.length >= 2) {
      console.log(`[GOVERNANCE] Double approval reached for network ${networkId}. Provisioning blockchain...`);
      const { blockchainEngine } = await import("../blockchain/blockchainEngine.js");
      const deployment = await blockchainEngine.deployNewInstance();
      blockchainAddress = deployment.address;
      finalStatus = "active";
    }

    await pgPool.query(
      `UPDATE supplier_relationships 
       SET governance_approvals = $1, contract_status = $2, blockchain_address = $3, updated_at = NOW() 
       WHERE id = $4`,
      [JSON.stringify(newApprovals), finalStatus, blockchainAddress, networkId]
    );

    res.status(200).json({ 
      message: finalStatus === "active" ? "Network activated and blockchain provisioned." : "Approval recorded.",
      approvals: newApprovals.length,
      status: finalStatus,
      blockchainAddress
    });

  } catch (error) {
    console.error("Error approving network:", error);
    res.status(500).json({ error: "Failed to process approval." });
  }
};

export const deployNetworkHandler = async (req: Request, res: Response) => {
  try {
    const { id: networkId } = req.params;
    const { nodes, edges } = req.body;
    const { companyId } = getBusinessContext(req);

    if (!companyId) return res.status(403).json({ error: "Organization access is required." });

    // Lookup network contract address
    const networkRes = await pgPool.query(
      "SELECT blockchain_address, contract_status FROM supplier_relationships WHERE id = $1",
      [networkId]
    );
    
    if (networkRes.rowCount === 0) return res.status(404).json({ error: "Network not found." });
    const { blockchain_address, contract_status } = networkRes.rows[0];

    if (contract_status !== "active" || !blockchain_address) {
      return res.status(400).json({ error: "Network is not active or missing blockchain ledger. Governance approval required." });
    }

    console.log(`[BLOCKCHAIN] Deploying visual network ${networkId} to contract ${blockchain_address}`);

    const results = [];

    // Process each visual link (edge) as a blockchain relationship
    for (const edge of edges) {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const payload = {
          networkId,
          buyerId: targetNode.data.companyId || targetNode.id,
          supplierId: sourceNode.data.companyId || sourceNode.id,
          role: targetNode.data.role || "partner",
          contractAddress: blockchain_address
        };

        const onChainResult = await registerNetworkPartnerOnChain(payload);
        results.push({
          source: sourceNode.data.label,
          target: targetNode.data.label,
          txHash: onChainResult.txHash
        });
      }
    }

    res.status(200).json({ 
      message: "Network relationships anchored to blockchain successfully", 
      deployments: results 
    });
  } catch (error) {
    console.error("Network deployment handler failed:", error);
    res.status(500).json({ error: "Failed to deploy network on-chain" });
  }
};
