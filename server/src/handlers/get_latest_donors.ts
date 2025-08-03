
import { db } from '../db';
import { donationsTable } from '../db/schema';
import { type Donation } from '../schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const getLatestDonorsInputSchema = z.object({
    campaign_id: z.number(),
    limit: z.number().default(5)
});

export type GetLatestDonorsInput = z.infer<typeof getLatestDonorsInputSchema>;

export async function getLatestDonors(input: GetLatestDonorsInput): Promise<Donation[]> {
    try {
        // Query for latest confirmed donations for the specified campaign
        const results = await db.select()
            .from(donationsTable)
            .where(and(
                eq(donationsTable.campaign_id, input.campaign_id),
                eq(donationsTable.payment_status, 'confirmed'),
                isNotNull(donationsTable.confirmed_at)
            ))
            .orderBy(desc(donationsTable.confirmed_at))
            .limit(input.limit)
            .execute();

        // Convert numeric fields back to numbers before returning
        return results.map(donation => ({
            ...donation,
            amount: parseFloat(donation.amount)
        }));
    } catch (error) {
        console.error('Failed to fetch latest donors:', error);
        throw error;
    }
}
