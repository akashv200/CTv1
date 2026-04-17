import { randomUUID } from "crypto";
import { pgPool } from "../config/postgres.js";

export interface CompanyRecord {
  id: string;
  companyCode: string;
  domain: string;
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  country?: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  postalCode?: string;
  status: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const companyColumns = `
  id,
  company_code AS "companyCode",
  domain,
  company_name AS "companyName",
  legal_name AS "legalName",
  registration_number AS "registrationNumber",
  tax_id AS "taxId",
  contact_email AS "contactEmail",
  contact_phone AS "contactPhone",
  website,
  country,
  state,
  city,
  address_line1 AS "addressLine1",
  postal_code AS "postalCode",
  status,
  metadata,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  const { rows } = await pgPool.query<CompanyRecord>(
    `SELECT ${companyColumns} FROM companies WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function upsertCompany(input: Partial<CompanyRecord> & { id: string; domain: string; companyName: string; companyCode: string }): Promise<CompanyRecord> {
  const { rows } = await pgPool.query<CompanyRecord>(
    `
      INSERT INTO companies (
        id, company_code, domain, company_name, legal_name, registration_number,
        tax_id, contact_email, contact_phone, website, country, state, city,
        address_line1, postal_code, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        legal_name = EXCLUDED.legal_name,
        registration_number = EXCLUDED.registration_number,
        tax_id = EXCLUDED.tax_id,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        website = EXCLUDED.website,
        country = EXCLUDED.country,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        address_line1 = EXCLUDED.address_line1,
        postal_code = EXCLUDED.postal_code,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING ${companyColumns}
    `,
    [
      input.id, input.companyCode, input.domain, input.companyName, input.legalName ?? null,
      input.registrationNumber ?? null, input.taxId ?? null, input.contactEmail ?? null,
      input.contactPhone ?? null, input.website ?? null, input.country ?? null,
      input.state ?? null, input.city ?? null, input.addressLine1 ?? null,
      input.postalCode ?? null, input.status ?? 'active', JSON.stringify(input.metadata ?? {})
    ]
  );
  return rows[0];
}

export async function getDomainSpecificData(companyId: string, domain: string) {
  const table = `${domain}_companies`;
  try {
    const { rows } = await pgPool.query(`SELECT * FROM ${table} WHERE company_id = $1`, [companyId]);
    return rows[0] ?? null;
  } catch (e) {
    return null;
  }
}
