
import { db } from '../db';
import { campaignsTable, organizationsTable } from '../db/schema';
import { type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    // Join campaigns with organizations to get complete data
    const results = await db.select({
      id: campaignsTable.id,
      name: campaignsTable.name,
      description: campaignsTable.description,
      target_amount: campaignsTable.target_amount,
      current_amount: campaignsTable.current_amount,
      organization_id: campaignsTable.organization_id,
      is_active: campaignsTable.is_active,
      created_at: campaignsTable.created_at,
      updated_at: campaignsTable.updated_at
    })
    .from(campaignsTable)
    .innerJoin(organizationsTable, eq(campaignsTable.organization_id, organizationsTable.id))
    .execute();

    // Convert numeric fields back to numbers
    return results.map(campaign => ({
      ...campaign,
      target_amount: parseFloat(campaign.target_amount),
      current_amount: parseFloat(campaign.current_amount)
    }));
  } catch (error) {
    console.error('Failed to get campaigns:', error);
    throw error;
  }
}
