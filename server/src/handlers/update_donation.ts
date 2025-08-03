
import { db } from '../db';
import { donationsTable } from '../db/schema';
import { type UpdateDonationInput, type Donation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDonation = async (input: UpdateDonationInput): Promise<Donation> => {
  try {
    // Build update values object
    const updateValues: any = {};
    
    if (input.payment_status !== undefined) {
      updateValues.payment_status = input.payment_status;
      // Set confirmed_at when status changes to 'confirmed'
      if (input.payment_status === 'confirmed') {
        updateValues.confirmed_at = new Date();
      } else if (input.payment_status === 'pending' || input.payment_status === 'failed') {
        updateValues.confirmed_at = null;
      }
    }
    
    if (input.payment_proof_url !== undefined) {
      updateValues.payment_proof_url = input.payment_proof_url;
    }

    // Update donation record
    const result = await db.update(donationsTable)
      .set(updateValues)
      .where(eq(donationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Donation with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const donation = result[0];
    return {
      ...donation,
      amount: parseFloat(donation.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Donation update failed:', error);
    throw error;
  }
};
