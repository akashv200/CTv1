import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pgPool } from "../config/postgres.js";
import { hashPassword } from "../utils/password.js";
import { issuePasswordActionToken } from "../services/passwordTokenService.js";

// Submit a new registration request (Public endpoint)
export const submitRegistrationRequest = async (req: Request, res: Response) => {
  try {
    const { company_name, domain, contact_name, contact_email, contact_phone, website, country } = req.body;

    if (!company_name || !domain || !contact_name || !contact_email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validDomains = ['agriculture', 'pharmaceutical', 'food', 'ecommerce', 'warehouse'];
    if (!validDomains.includes(domain)) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    const companyId = uuidv4();
    const companyCode = `COMP-${Date.now().toString().slice(-6)}`;

    // Create company with pending_approval status
    await pgPool.query(
      `INSERT INTO companies (
        id, company_code, company_name, domain, contact_email, contact_phone, 
        website, country, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval', $9)`,
      [
        companyId,
        companyCode,
        company_name,
        domain,
        contact_email,
        contact_phone || null,
        website || null,
        country || null,
        JSON.stringify({
          contact_name,
          registration_source: "public_portal",
          requested_at: new Date().toISOString()
        })
      ]
    );

    res.status(201).json({ 
      message: "Registration request submitted successfully. Awaiting admin approval.", 
      id: companyId 
    });
  } catch (error: any) {
    console.error("Error submitting registration request:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: "A company with this email or code already exists" });
    }
    res.status(500).json({ error: "Failed to submit request" });
  }
};

// Get registration requests (Admin only)
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const values: any[] = [];
    let query = `SELECT id, company_code, company_name, domain, contact_email, contact_phone, website, country, status, metadata, created_at FROM companies`;

    const statusMap: Record<string, string> = {
      pending: "pending_approval",
      approved: "active",
      rejected: "suspended"
    };

    if (typeof status === "string" && status !== "all") {
      const dbStatus = statusMap[status] || status;
      query += ` WHERE status = $1`;
      values.push(dbStatus);
    } else if (status === "all") {
      // Include all states for the master list
      query += ` WHERE status IN ('pending_approval', 'active', 'suspended')`;
    } else {
      query += ` WHERE status = 'pending_approval'`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pgPool.query(query, values);
    res.status(200).json(result.rows.map((row: any) => ({
      id: row.id,
      company_name: row.company_name,
      domain: row.domain,
      contact_name: row.metadata?.contact_name ?? 'N/A',
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      website: row.website,
      country: row.country,
      status: row.status === 'pending_approval' ? 'pending' : 
              row.status === 'active' ? 'approved' : 
              row.status === 'suspended' ? 'rejected' : row.status,
      created_at: row.created_at
    })));
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

export const getOnboardingSummary = async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query(
      `
        SELECT status, COUNT(*)::INT AS count
        FROM companies
        GROUP BY status
      `
    );

    const summary = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    for (const row of result.rows) {
      if (row.status === 'pending_approval') summary.pending = row.count;
      else if (row.status === 'active') summary.approved = row.count;
      else if (row.status === 'suspended') summary.rejected = row.count;
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching onboarding summary:", error);
    res.status(500).json({ error: "Failed to fetch onboarding summary" });
  }
};

// Approve a request and create user (Admin only)
export const approveRequest = async (req: Request, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { id } = req.params;

    // @ts-ignore
    const userRole = req.user?.role;
    // @ts-ignore
    const adminId = req.user?.id ?? req.user?.sub;

    if (userRole !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can approve requests." });
    }

    await client.query('BEGIN');

    // Get the pending company
    const companyResult = await client.query(
      `SELECT * FROM companies WHERE id = $1 AND status = 'pending_approval' FOR UPDATE`,
      [id]
    );

    if (companyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Pending request not found" });
    }

    const company = companyResult.rows[0];

    // Update company status to active
    await client.query(
      `UPDATE companies SET status = 'active', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Create initial org_admin user if not exists
    const userId = uuidv4();
    const contactName = company.metadata?.contact_name ?? company.company_name;
    const placeholderPasswordHash = await hashPassword(uuidv4());

    await client.query(
      `INSERT INTO users (id, organization_id, name, email, password_hash, role, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, 'org_admin', true)
       ON CONFLICT (email) DO NOTHING`,
      [userId, id, contactName, company.contact_email, placeholderPasswordHash]
    );

    await client.query('COMMIT');

    const invite = await issuePasswordActionToken({
      userId,
      email: company.contact_email,
      purpose: "invite_setup",
      companyId: id,
      createdBy: adminId,
      recipientName: contactName,
      companyName: company.company_name
    });

    res.status(200).json({
      message: "Request approved and organization activated successfully",
      companyId: id,
      inviteUrl: invite.actionUrl,
      inviteExpiresAt: invite.expiresAt
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Failed to approve request" });
  } finally {
    client.release();
  }
};

// Reject a request (Admin only)
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // @ts-ignore
    const adminId = req.user?.id ?? req.user?.sub;

    const result = await pgPool.query(
      `UPDATE companies 
       SET status = 'suspended', metadata = jsonb_set(metadata, '{rejection_notes}', to_jsonb($1::text)), updated_at = NOW()
       WHERE id = $2 AND status = 'pending_approval'`,
      [notes || '', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pending request not found" });
    }

    res.status(200).json({ message: "Request rejected successfully" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
};
