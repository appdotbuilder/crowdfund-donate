
import { db } from '../db';
import { campaignsTable, organizationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateCampaignInput, type Campaign } from '../schema';

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
  try {
    // Verify that the organization exists to prevent foreign key constraint violation
    const existingOrg = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.organization_id))
      .execute();

    if (existingOrg.length === 0) {
      throw new Error(`Organization with id ${input.organization_id} does not exist`);
    }

    // Insert campaign record
    const result = await db.insert(campaignsTable)
      .values({
        name: input.name,
        description: input.description,
        target_amount: input.target_amount.toString(), // Convert number to string for numeric column
        organization_id: input.organization_id,
        is_active: input.is_active
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const campaign = result[0];
    return {
      ...campaign,
      target_amount: parseFloat(campaign.target_amount), // Convert string back to number
      current_amount: parseFloat(campaign.current_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Campaign creation failed:', error);
    throw error;
  }
};
