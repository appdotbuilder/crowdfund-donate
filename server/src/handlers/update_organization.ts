
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type UpdateOrganizationInput, type Organization } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOrganization = async (input: UpdateOrganizationInput): Promise<Organization> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.logo_url !== undefined) {
      updateData.logo_url = input.logo_url;
    }

    // Update organization record
    const result = await db.update(organizationsTable)
      .set(updateData)
      .where(eq(organizationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Organization with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Organization update failed:', error);
    throw error;
  }
};
