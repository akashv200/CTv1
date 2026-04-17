import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthPayload } from "../middleware/auth.js";
import { getCompanyById, upsertCompany, getDomainSpecificData } from "../services/organizationService.js";

const companySchema = z.object({
  id: z.string().optional(),
  companyCode: z.string().min(2),
  domain: z.string().min(2),
  companyName: z.string().min(2),
  legalName: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  addressLine1: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function getMyOrganizationHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  if (!user || !user.orgId) return res.status(200).json(null);

  const company = await getCompanyById(user.orgId);
  if (!company) return res.status(200).json(null);

  const domainData = await getDomainSpecificData(company.id, company.domain);

  return res.status(200).json({
    ...company,
    domainSpecific: domainData
  });
}

export async function updateMyOrganizationHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  if (!user || !user.orgId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });

  const company = await upsertCompany({
    ...parsed.data,
    id: user.orgId
  } as any);

  return res.status(200).json(company);
}
