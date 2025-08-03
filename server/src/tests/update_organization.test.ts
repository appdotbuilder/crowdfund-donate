
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type UpdateOrganizationInput, type CreateOrganizationInput } from '../schema';
import { updateOrganization } from '../handlers/update_organization';
import { eq } from 'drizzle-orm';

describe('updateOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test organization
  const createTestOrganization = async (): Promise<number> => {
    const result = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: 'https://example.com/logo.png'
      })
      .returning()
      .execute();
    
    return result[0].id;
  };

  it('should update organization name', async () => {
    const orgId = await createTestOrganization();
    
    const updateInput: UpdateOrganizationInput = {
      id: orgId,
      name: 'Updated Organization Name'
    };

    const result = await updateOrganization(updateInput);

    expect(result.id).toEqual(orgId);
    expect(result.name).toEqual('Updated Organization Name');
    expect(result.logo_url).toEqual('https://example.com/logo.png'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update organization logo_url', async () => {
    const orgId = await createTestOrganization();
    
    const updateInput: UpdateOrganizationInput = {
      id: orgId,
      logo_url: 'https://newlogo.com/logo.png'
    };

    const result = await updateOrganization(updateInput);

    expect(result.id).toEqual(orgId);
    expect(result.name).toEqual('Test Organization'); // Should remain unchanged
    expect(result.logo_url).toEqual('https://newlogo.com/logo.png');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const orgId = await createTestOrganization();
    
    const updateInput: UpdateOrganizationInput = {
      id: orgId,
      name: 'Multi-Updated Organization',
      logo_url: 'https://multiupdate.com/logo.png'
    };

    const result = await updateOrganization(updateInput);

    expect(result.id).toEqual(orgId);
    expect(result.name).toEqual('Multi-Updated Organization');
    expect(result.logo_url).toEqual('https://multiupdate.com/logo.png');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set logo_url to null', async () => {
    const orgId = await createTestOrganization();
    
    const updateInput: UpdateOrganizationInput = {
      id: orgId,
      logo_url: null
    };

    const result = await updateOrganization(updateInput);

    expect(result.id).toEqual(orgId);
    expect(result.name).toEqual('Test Organization'); // Should remain unchanged
    expect(result.logo_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const orgId = await createTestOrganization();
    
    const updateInput: UpdateOrganizationInput = {
      id: orgId,
      name: 'Database Test Organization',
      logo_url: null
    };

    await updateOrganization(updateInput);

    // Verify in database
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Database Test Organization');
    expect(organizations[0].logo_url).toBeNull();
  });

  it('should throw error when organization does not exist', async () => {
    const updateInput: UpdateOrganizationInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Organization'
    };

    await expect(updateOrganization(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const orgId = await createTestOrganization();
    
    // Update only name
    const nameOnlyInput: UpdateOrganizationInput = {
      id: orgId,
      name: 'Name Only Update'
    };

    const result = await updateOrganization(nameOnlyInput);

    expect(result.name).toEqual('Name Only Update');
    expect(result.logo_url).toEqual('https://example.com/logo.png'); // Original value preserved
  });
});
