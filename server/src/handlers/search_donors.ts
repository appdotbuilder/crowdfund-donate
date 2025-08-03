
import { db } from '../db';
import { donationsTable } from '../db/schema';
import { type SearchDonorsInput, type Donation } from '../schema';
import { ilike, eq, and, type SQL } from 'drizzle-orm';

export async function searchDonors(input: SearchDonorsInput): Promise<Donation[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add name search condition (case-insensitive)
    conditions.push(ilike(donationsTable.donor_name, `%${input.query}%`));

    // Add campaign filter if provided
    if (input.campaign_id !== undefined) {
      conditions.push(eq(donationsTable.campaign_id, input.campaign_id));
    }

    // Build and execute query
    const results = await db.select()
      .from(donationsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(donation => ({
      ...donation,
      amount: parseFloat(donation.amount)
    }));
  } catch (error) {
    console.error('Donor search failed:', error);
    throw error;
  }
}
