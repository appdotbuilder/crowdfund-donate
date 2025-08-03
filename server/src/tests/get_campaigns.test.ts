
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable } from '../db/schema';
import { getCampaigns } from '../handlers/get_campaigns';

describe('getCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no campaigns exist', async () => {
    const result = await getCampaigns();
    expect(result).toEqual([]);
  });

  it('should return all campaigns with correct data types', async () => {
    // Create test organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: 'https://example.com/logo.png'
      })
      .returning()
      .execute();

    const organizationId = orgResult[0].id;

    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        {
          name: 'Campaign 1',
          description: 'First test campaign',
          target_amount: '1000.50',
          current_amount: '250.75',
          organization_id: organizationId,
          is_active: true
        },
        {
          name: 'Campaign 2',
          description: null,
          target_amount: '2000.00',
          current_amount: '0.00',
          organization_id: organizationId,
          is_active: false
        }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(2);

    // Verify first campaign
    const campaign1 = result.find(c => c.name === 'Campaign 1');
    expect(campaign1).toBeDefined();
    expect(campaign1!.name).toBe('Campaign 1');
    expect(campaign1!.description).toBe('First test campaign');
    expect(campaign1!.target_amount).toBe(1000.50);
    expect(typeof campaign1!.target_amount).toBe('number');
    expect(campaign1!.current_amount).toBe(250.75);
    expect(typeof campaign1!.current_amount).toBe('number');
    expect(campaign1!.organization_id).toBe(organizationId);
    expect(campaign1!.is_active).toBe(true);
    expect(campaign1!.created_at).toBeInstanceOf(Date);
    expect(campaign1!.updated_at).toBeInstanceOf(Date);
    expect(campaign1!.id).toBeDefined();

    // Verify second campaign
    const campaign2 = result.find(c => c.name === 'Campaign 2');
    expect(campaign2).toBeDefined();
    expect(campaign2!.name).toBe('Campaign 2');
    expect(campaign2!.description).toBeNull();
    expect(campaign2!.target_amount).toBe(2000.00);
    expect(typeof campaign2!.target_amount).toBe('number');
    expect(campaign2!.current_amount).toBe(0.00);
    expect(typeof campaign2!.current_amount).toBe('number');
    expect(campaign2!.organization_id).toBe(organizationId);
    expect(campaign2!.is_active).toBe(false);
  });

  it('should return campaigns from multiple organizations', async () => {
    // Create two test organizations
    const org1Result = await db.insert(organizationsTable)
      .values({
        name: 'Org 1',
        logo_url: null
      })
      .returning()
      .execute();

    const org2Result = await db.insert(organizationsTable)
      .values({
        name: 'Org 2',
        logo_url: 'https://example.com/org2.png'
      })
      .returning()
      .execute();

    // Create campaigns for both organizations
    await db.insert(campaignsTable)
      .values([
        {
          name: 'Org 1 Campaign',
          description: 'Campaign from first org',
          target_amount: '500.00',
          current_amount: '100.00',
          organization_id: org1Result[0].id,
          is_active: true
        },
        {
          name: 'Org 2 Campaign',
          description: 'Campaign from second org',
          target_amount: '1500.00',
          current_amount: '300.00',
          organization_id: org2Result[0].id,
          is_active: true
        }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(2);
    
    const org1Campaign = result.find(c => c.organization_id === org1Result[0].id);
    const org2Campaign = result.find(c => c.organization_id === org2Result[0].id);
    
    expect(org1Campaign).toBeDefined();
    expect(org1Campaign!.name).toBe('Org 1 Campaign');
    expect(org2Campaign).toBeDefined();
    expect(org2Campaign!.name).toBe('Org 2 Campaign');
  });
});
