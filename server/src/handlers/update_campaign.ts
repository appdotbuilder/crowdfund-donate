
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type UpdateCampaignInput, type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCampaign = async (input: UpdateCampaignInput): Promise<Campaign> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.target_amount !== undefined) {
      updateData.target_amount = input.target_amount.toString();
    }
    
    if (input.organization_id !== undefined) {
      updateData.organization_id = input.organization_id;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update campaign record
    const result = await db.update(campaignsTable)
      .set(updateData)
      .where(eq(campaignsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Campaign with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const campaign = result[0];
    return {
      ...campaign,
      target_amount: parseFloat(campaign.target_amount),
      current_amount: parseFloat(campaign.current_amount)
    };
  } catch (error) {
    console.error('Campaign update failed:', error);
    throw error;
  }
};
