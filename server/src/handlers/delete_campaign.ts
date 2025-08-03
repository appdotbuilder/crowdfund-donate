
import { z } from 'zod';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCampaignInputSchema = z.object({
  id: z.number()
});

export type DeleteCampaignInput = z.infer<typeof deleteCampaignInputSchema>;

export const deleteCampaign = async (input: DeleteCampaignInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(campaignsTable)
      .where(eq(campaignsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Campaign deletion failed:', error);
    throw error;
  }
};
