
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for payment status
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed', 'failed']);

// Organizations table
export const organizationsTable = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo_url: text('logo_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Campaigns table
export const campaignsTable = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  target_amount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  current_amount: numeric('current_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  organization_id: integer('organization_id').notNull().references(() => organizationsTable.id),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Donations table
export const donationsTable = pgTable('donations', {
  id: serial('id').primaryKey(),
  campaign_id: integer('campaign_id').notNull().references(() => campaignsTable.id),
  donor_name: text('donor_name').notNull(),
  donor_email: text('donor_email'),
  donor_phone: text('donor_phone'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  message: text('message'),
  payment_status: paymentStatusEnum('payment_status').notNull().default('pending'),
  payment_proof_url: text('payment_proof_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  confirmed_at: timestamp('confirmed_at'),
});

// Relations
export const organizationsRelations = relations(organizationsTable, ({ many }) => ({
  campaigns: many(campaignsTable),
}));

export const campaignsRelations = relations(campaignsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [campaignsTable.organization_id],
    references: [organizationsTable.id],
  }),
  donations: many(donationsTable),
}));

export const donationsRelations = relations(donationsTable, ({ one }) => ({
  campaign: one(campaignsTable, {
    fields: [donationsTable.campaign_id],
    references: [campaignsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Organization = typeof organizationsTable.$inferSelect;
export type NewOrganization = typeof organizationsTable.$inferInsert;
export type Campaign = typeof campaignsTable.$inferSelect;
export type NewCampaign = typeof campaignsTable.$inferInsert;
export type Donation = typeof donationsTable.$inferSelect;
export type NewDonation = typeof donationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  organizations: organizationsTable,
  campaigns: campaignsTable,
  donations: donationsTable
};
