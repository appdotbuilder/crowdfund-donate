
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { getOrganizations } from '../handlers/get_organizations';

describe('getOrganizations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no organizations exist', async () => {
    const result = await getOrganizations();
    expect(result).toEqual([]);
  });

  it('should return all organizations', async () => {
    // Create test organizations
    await db.insert(organizationsTable)
      .values([
        {
          name: 'Organization 1',
          logo_url: 'https://example.com/logo1.png'
        },
        {
          name: 'Organization 2',
          logo_url: null
        },
        {
          name: 'Organization 3',
          logo_url: 'https://example.com/logo3.png'
        }
      ])
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(3);
    
    // Verify first organization
    expect(result[0].name).toBe('Organization 1');
    expect(result[0].logo_url).toBe('https://example.com/logo1.png');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second organization (with null logo_url)
    expect(result[1].name).toBe('Organization 2');
    expect(result[1].logo_url).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify third organization
    expect(result[2].name).toBe('Organization 3');
    expect(result[2].logo_url).toBe('https://example.com/logo3.png');
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return organizations in insertion order', async () => {
    // Create organizations in specific order
    const org1 = await db.insert(organizationsTable)
      .values({ name: 'First Org', logo_url: null })
      .returning()
      .execute();

    const org2 = await db.insert(organizationsTable)
      .values({ name: 'Second Org', logo_url: 'https://example.com/logo.png' })
      .returning()
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First Org');
    expect(result[1].name).toBe('Second Org');
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
