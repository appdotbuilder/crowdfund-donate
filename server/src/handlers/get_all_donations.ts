
import { db } from '../db';
import { donationsTable } from '../db/schema';
import { type Donation } from '../schema';

export async function getAllDonations(): Promise<Donation[]> {
  try {
    const results = await db.select()
      .from(donationsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(donation => ({
      ...donation,
      amount: parseFloat(donation.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch all donations:', error);
    throw error;
  }
}
