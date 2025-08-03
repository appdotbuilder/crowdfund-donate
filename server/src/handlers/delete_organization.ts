
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteOrganizationInputSchema = z.object({
    id: z.number()
});

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationInputSchema>;

export async function deleteOrganization(input: DeleteOrganizationInput): Promise<{ success: boolean }> {
    try {
        const result = await db.delete(organizationsTable)
            .where(eq(organizationsTable.id, input.id))
            .returning()
            .execute();

        return { success: result.length > 0 };
    } catch (error) {
        console.error('Organization deletion failed:', error);
        throw error;
    }
}
