
import { z } from 'zod';

// Organization schema
export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Organization = z.infer<typeof organizationSchema>;

// Campaign schema
export const campaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  target_amount: z.number(),
  current_amount: z.number(),
  organization_id: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Campaign = z.infer<typeof campaignSchema>;

// Donation schema
export const donationSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  donor_name: z.string(),
  donor_email: z.string().nullable(),
  donor_phone: z.string().nullable(),
  amount: z.number(),
  message: z.string().nullable(),
  payment_status: z.enum(['pending', 'confirmed', 'failed']),
  payment_proof_url: z.string().nullable(),
  created_at: z.coerce.date(),
  confirmed_at: z.coerce.date().nullable()
});

export type Donation = z.infer<typeof donationSchema>;

// Input schemas for organizations
export const createOrganizationInputSchema = z.object({
  name: z.string().min(1),
  logo_url: z.string().url().nullable()
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

export const updateOrganizationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  logo_url: z.string().url().nullable().optional()
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>;

// Input schemas for campaigns
export const createCampaignInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  target_amount: z.number().positive(),
  organization_id: z.number(),
  is_active: z.boolean().default(true)
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;

export const updateCampaignInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  target_amount: z.number().positive().optional(),
  organization_id: z.number().optional(),
  is_active: z.boolean().optional()
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;

// Input schemas for donations
export const createDonationInputSchema = z.object({
  campaign_id: z.number(),
  donor_name: z.string().min(1),
  donor_email: z.string().email().nullable(),
  donor_phone: z.string().nullable(),
  amount: z.number().positive(),
  message: z.string().nullable()
});

export type CreateDonationInput = z.infer<typeof createDonationInputSchema>;

export const updateDonationInputSchema = z.object({
  id: z.number(),
  payment_status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  payment_proof_url: z.string().url().nullable().optional()
});

export type UpdateDonationInput = z.infer<typeof updateDonationInputSchema>;

// Query schemas
export const searchDonorsInputSchema = z.object({
  query: z.string().min(1),
  campaign_id: z.number().optional()
});

export type SearchDonorsInput = z.infer<typeof searchDonorsInputSchema>;

export const getCampaignWithStatsSchema = z.object({
  id: z.number()
});

export type GetCampaignWithStatsInput = z.infer<typeof getCampaignWithStatsSchema>;
