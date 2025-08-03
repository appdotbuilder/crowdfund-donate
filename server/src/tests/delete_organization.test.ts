
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { deleteOrganization, type DeleteOrganizationInput } from '../handlers/delete_organization';
import { eq } from 'drizzle-orm';

// Test organization data
const testOrg: CreateOrganizationInput = {
    name: 'Test Organization',
    logo_url: 'https://example.com/logo.png'
};

describe('deleteOrganization', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete an existing organization', async () => {
        // Create test organization
        const created = await db.insert(organizationsTable)
            .values(testOrg)
            .returning()
            .execute();

        const orgId = created[0].id;

        // Delete the organization
        const input: DeleteOrganizationInput = { id: orgId };
        const result = await deleteOrganization(input);

        // Verify deletion was successful
        expect(result.success).toBe(true);

        // Verify organization no longer exists in database
        const organizations = await db.select()
            .from(organizationsTable)
            .where(eq(organizationsTable.id, orgId))
            .execute();

        expect(organizations).toHaveLength(0);
    });

    it('should return false when organization does not exist', async () => {
        const input: DeleteOrganizationInput = { id: 999 };
        const result = await deleteOrganization(input);

        expect(result.success).toBe(false);
    });

    it('should handle deleting organization with campaigns', async () => {
        // This test demonstrates the foreign key constraint behavior
        // First create an organization
        const created = await db.insert(organizationsTable)
            .values(testOrg)
            .returning()
            .execute();

        const orgId = created[0].id;

        // Create a campaign for this organization using proper Drizzle syntax
        await db.insert(campaignsTable)
            .values({
                name: 'Test Campaign',
                description: 'A test campaign',
                target_amount: '1000.00', // Convert to string for numeric column
                organization_id: orgId
            })
            .execute();

        // Attempt to delete organization with campaigns should fail due to foreign key constraint
        const input: DeleteOrganizationInput = { id: orgId };
        
        await expect(deleteOrganization(input)).rejects.toThrow(/violates foreign key constraint/i);
    });

    it('should verify organization exists before deletion attempt', async () => {
        // Create and then verify organization exists
        const created = await db.insert(organizationsTable)
            .values(testOrg)
            .returning()
            .execute();

        const orgId = created[0].id;

        // Verify it exists
        const beforeDelete = await db.select()
            .from(organizationsTable)
            .where(eq(organizationsTable.id, orgId))
            .execute();

        expect(beforeDelete).toHaveLength(1);
        expect(beforeDelete[0].name).toEqual('Test Organization');

        // Now delete it
        const input: DeleteOrganizationInput = { id: orgId };
        const result = await deleteOrganization(input);

        expect(result.success).toBe(true);
    });
});
