
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, organizationsTable } from '../db/schema';
import { type DeleteCampaignInput } from '../handlers/delete_campaign';
import { deleteCampaign } from '../handlers/delete_campaign';
import { eq } from 'drizzle-orm';

describe('deleteCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a campaign successfully', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create campaign to delete
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'A campaign for testing',
        target_amount: '1000.00',
        organization_id: organization.id,
        is_active: true
      })
      .returning()
      .execute();

    const campaign = campaignResult[0];

    const input: DeleteCampaignInput = {
      id: campaign.id
    };

    const result = await deleteCampaign(input);

    expect(result.success).toBe(true);

    // Verify campaign was deleted from database
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign.id))
      .execute();

    expect(campaigns).toHaveLength(0);
  });

  it('should return false when campaign does not exist', async () => {
    const input: DeleteCampaignInput = {
      id: 999
    };

    const result = await deleteCampaign(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other campaigns', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create two campaigns
    const campaign1Result = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 1',
        description: 'First campaign',
        target_amount: '1000.00',
        organization_id: organization.id,
        is_active: true
      })
      .returning()
      .execute();

    const campaign2Result = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 2',
        description: 'Second campaign',
        target_amount: '2000.00',
        organization_id: organization.id,
        is_active: true
      })
      .returning()
      .execute();

    const campaign1 = campaign1Result[0];
    const campaign2 = campaign2Result[0];

    // Delete first campaign
    const input: DeleteCampaignInput = {
      id: campaign1.id
    };

    const result = await deleteCampaign(input);

    expect(result.success).toBe(true);

    // Verify first campaign was deleted
    const deletedCampaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign1.id))
      .execute();

    expect(deletedCampaigns).toHaveLength(0);

    // Verify second campaign still exists
    const remainingCampaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign2.id))
      .execute();

    expect(remainingCampaigns).toHaveLength(1);
    expect(remainingCampaigns[0].name).toEqual('Campaign 2');
  });
});
