
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable } from '../db/schema';
import { type UpdateCampaignInput } from '../schema';
import { updateCampaign } from '../handlers/update_campaign';
import { eq } from 'drizzle-orm';

describe('updateCampaign', () => {
  let testOrgId: number;
  let testCampaignId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test organization
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();
    testOrgId = org[0].id;

    // Create test campaign
    const campaign = await db.insert(campaignsTable)
      .values({
        name: 'Original Campaign',
        description: 'Original description',
        target_amount: '10000.00',
        organization_id: testOrgId,
        is_active: true
      })
      .returning()
      .execute();
    testCampaignId = campaign[0].id;
  });

  afterEach(resetDB);

  it('should update campaign name', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      name: 'Updated Campaign Name'
    };

    const result = await updateCampaign(input);

    expect(result.id).toEqual(testCampaignId);
    expect(result.name).toEqual('Updated Campaign Name');
    expect(result.description).toEqual('Original description');
    expect(result.target_amount).toEqual(10000);
    expect(result.organization_id).toEqual(testOrgId);
    expect(result.is_active).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      name: 'New Campaign Name',
      description: 'New description',
      target_amount: 25000,
      is_active: false
    };

    const result = await updateCampaign(input);

    expect(result.name).toEqual('New Campaign Name');
    expect(result.description).toEqual('New description');
    expect(result.target_amount).toEqual(25000);
    expect(result.is_active).toEqual(false);
    expect(result.organization_id).toEqual(testOrgId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update description to null', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      description: null
    };

    const result = await updateCampaign(input);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Campaign');
    expect(result.target_amount).toEqual(10000);
  });

  it('should save updates to database', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      name: 'Database Updated Name',
      target_amount: 15000
    };

    await updateCampaign(input);

    // Verify changes in database
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, testCampaignId))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toEqual('Database Updated Name');
    expect(parseFloat(campaigns[0].target_amount)).toEqual(15000);
    expect(campaigns[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update organization_id with foreign key validation', async () => {
    // Create another organization
    const newOrg = await db.insert(organizationsTable)
      .values({
        name: 'New Organization',
        logo_url: null
      })
      .returning()
      .execute();

    const input: UpdateCampaignInput = {
      id: testCampaignId,
      organization_id: newOrg[0].id
    };

    const result = await updateCampaign(input);

    expect(result.organization_id).toEqual(newOrg[0].id);
    expect(result.name).toEqual('Original Campaign');
  });

  it('should throw error for non-existent campaign', async () => {
    const input: UpdateCampaignInput = {
      id: 99999,
      name: 'Non-existent Campaign'
    };

    await expect(updateCampaign(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error for invalid organization_id', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      organization_id: 99999
    };

    await expect(updateCampaign(input)).rejects.toThrow();
  });

  it('should preserve current_amount when updating other fields', async () => {
    // First update the current_amount in the database
    await db.update(campaignsTable)
      .set({ current_amount: '5000.50' })
      .where(eq(campaignsTable.id, testCampaignId))
      .execute();

    const input: UpdateCampaignInput = {
      id: testCampaignId,
      name: 'Updated Name'
    };

    const result = await updateCampaign(input);

    expect(result.current_amount).toEqual(5000.50);
    expect(result.name).toEqual('Updated Name');
  });
});
