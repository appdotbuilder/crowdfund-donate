
import { db } from '../db';
import { donationsTable, campaignsTable } from '../db/schema';
import { type CreateDonationInput, type Donation } from '../schema';
import { eq } from 'drizzle-orm';

export const createDonation = async (input: CreateDonationInput): Promise<Donation> => {
  try {
    // Verify campaign exists before creating donation
    const existingCampaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, input.campaign_id))
      .execute();

    if (existingCampaign.length === 0) {
      throw new Error(`Campaign with ID ${input.campaign_id} does not exist`);
    }

    // Insert donation record
    const result = await db.insert(donationsTable)
      .values({
        campaign_id: input.campaign_id,
        donor_name: input.donor_name,
        donor_email: input.donor_email,
        donor_phone: input.donor_phone,
        amount: input.amount.toString(), // Convert number to string for numeric column
        message: input.message,
        payment_status: 'pending' // Default status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const donation = result[0];
    return {
      ...donation,
      amount: parseFloat(donation.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Donation creation failed:', error);
    throw error;
  }
};
