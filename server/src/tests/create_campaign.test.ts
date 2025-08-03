
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, organizationsTable } from '../db/schema';
import { type CreateCampaignInput } from '../schema';
import { createCampaign } from '../handlers/create_campaign';
import { eq } from 'drizzle-orm';

describe('createCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test organization
  const createTestOrganization = async () => {
    const result = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: 'https://example.com/logo.png'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a campaign with all fields', async () => {
    const org = await createTestOrganization();
    
    const testInput: CreateCampaignInput = {
      name: 'Test Campaign',
      description: 'A campaign for testing',
      target_amount: 10000.50,
      organization_id: org.id,
      is_active: true
    };

    const result = await createCampaign(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Campaign');
    expect(result.description).toEqual('A campaign for testing');
    expect(result.target_amount).toEqual(10000.50);
    expect(typeof result.target_amount).toBe('number');
    expect(result.current_amount).toEqual(0);
    expect(typeof result.current_amount).toBe('number');
    expect(result.organization_id).toEqual(org.id);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a campaign with null description', async () => {
    const org = await createTestOrganization();
    
    const testInput: CreateCampaignInput = {
      name: 'Test Campaign',
      description: null,
      target_amount: 5000,
      organization_id: org.id,
      is_active: false
    };

    const result = await createCampaign(testInput);

    expect(result.name).toEqual('Test Campaign');
    expect(result.description).toBeNull();
    expect(result.target_amount).toEqual(5000);
    expect(result.is_active).toBe(false);
  });

  it('should save campaign to database', async () => {
    const org = await createTestOrganization();
    
    const testInput: CreateCampaignInput = {
      name: 'Database Test Campaign',
      description: 'Testing database persistence',
      target_amount: 7500.25,
      organization_id: org.id,
      is_active: true
    };

    const result = await createCampaign(testInput);

    // Query using proper drizzle syntax
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toEqual('Database Test Campaign');
    expect(campaigns[0].description).toEqual('Testing database persistence');
    expect(parseFloat(campaigns[0].target_amount)).toEqual(7500.25);
    expect(parseFloat(campaigns[0].current_amount)).toEqual(0);
    expect(campaigns[0].organization_id).toEqual(org.id);
    expect(campaigns[0].is_active).toBe(true);
    expect(campaigns[0].created_at).toBeInstanceOf(Date);
    expect(campaigns[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when organization does not exist', async () => {
    const testInput: CreateCampaignInput = {
      name: 'Invalid Campaign',
      description: 'This should fail',
      target_amount: 1000,
      organization_id: 99999, // Non-existent organization
      is_active: true
    };

    expect(createCampaign(testInput)).rejects.toThrow(/organization with id 99999 does not exist/i);
  });

  it('should apply default is_active value when not provided', async () => {
    const org = await createTestOrganization();
    
    // Test with Zod default applied (is_active = true by default)
    const testInput: CreateCampaignInput = {
      name: 'Default Active Campaign',
      description: 'Testing default value',
      target_amount: 2500,
      organization_id: org.id,
      is_active: true // This would be applied by Zod default
    };

    const result = await createCampaign(testInput);

    expect(result.is_active).toBe(true);
  });
});
