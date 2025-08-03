
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { createOrganization } from '../handlers/create_organization';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateOrganizationInput = {
  name: 'Test Organization',
  logo_url: 'https://example.com/test-logo.png'
};

// Test input with null logo_url
const testInputWithNullLogo: CreateOrganizationInput = {
  name: 'Test Organization Without Logo',
  logo_url: null
};

describe('createOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an organization with all fields', async () => {
    const result = await createOrganization(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Organization');
    expect(result.logo_url).toEqual('https://example.com/test-logo.png');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an organization with null logo_url', async () => {
    const result = await createOrganization(testInputWithNullLogo);

    // Basic field validation
    expect(result.name).toEqual('Test Organization Without Logo');
    expect(result.logo_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save organization to database', async () => {
    const result = await createOrganization(testInput);

    // Query using proper drizzle syntax
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, result.id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Test Organization');
    expect(organizations[0].logo_url).toEqual('https://example.com/test-logo.png');
    expect(organizations[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple organizations', async () => {
    const result1 = await createOrganization(testInput);
    const result2 = await createOrganization(testInputWithNullLogo);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should set created_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createOrganization(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
