
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable, donationsTable } from '../db/schema';
import { getAllDonations } from '../handlers/get_all_donations';

describe('getAllDonations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no donations exist', async () => {
    const result = await getAllDonations();
    expect(result).toEqual([]);
  });

  it('should return all donations with correct data types', async () => {
    // Create prerequisite organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    // Create prerequisite campaign
    const [campaign] = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'Test Description',
        target_amount: '10000.00',
        organization_id: organization.id,
        is_active: true
      })
      .returning()
      .execute();

    // Create test donations
    await db.insert(donationsTable)
      .values([
        {
          campaign_id: campaign.id,
          donor_name: 'John Doe',
          donor_email: 'john@example.com',
          donor_phone: '+1234567890',
          amount: '100.50',
          message: 'Great cause!',
          payment_status: 'confirmed',
          payment_proof_url: 'https://example.com/proof1.jpg'
        },
        {
          campaign_id: campaign.id,
          donor_name: 'Jane Smith',
          donor_email: null,
          donor_phone: null,
          amount: '250.00',
          message: null,
          payment_status: 'pending',
          payment_proof_url: null
        }
      ])
      .execute();

    const result = await getAllDonations();

    expect(result).toHaveLength(2);

    // Check first donation
    const donation1 = result.find(d => d.donor_name === 'John Doe');
    expect(donation1).toBeDefined();
    expect(donation1!.campaign_id).toBe(campaign.id);
    expect(donation1!.donor_email).toBe('john@example.com');
    expect(donation1!.donor_phone).toBe('+1234567890');
    expect(donation1!.amount).toBe(100.5);
    expect(typeof donation1!.amount).toBe('number');
    expect(donation1!.message).toBe('Great cause!');
    expect(donation1!.payment_status).toBe('confirmed');
    expect(donation1!.payment_proof_url).toBe('https://example.com/proof1.jpg');
    expect(donation1!.created_at).toBeInstanceOf(Date);

    // Check second donation
    const donation2 = result.find(d => d.donor_name === 'Jane Smith');
    expect(donation2).toBeDefined();
    expect(donation2!.campaign_id).toBe(campaign.id);
    expect(donation2!.donor_email).toBeNull();
    expect(donation2!.donor_phone).toBeNull();
    expect(donation2!.amount).toBe(250.0);
    expect(typeof donation2!.amount).toBe('number');
    expect(donation2!.message).toBeNull();
    expect(donation2!.payment_status).toBe('pending');
    expect(donation2!.payment_proof_url).toBeNull();
    expect(donation2!.created_at).toBeInstanceOf(Date);
  });

  it('should return donations from multiple campaigns', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    // Create two campaigns
    const campaigns = await db.insert(campaignsTable)
      .values([
        {
          name: 'Campaign 1',
          description: 'First campaign',
          target_amount: '5000.00',
          organization_id: organization.id,
          is_active: true
        },
        {
          name: 'Campaign 2',
          description: 'Second campaign',
          target_amount: '3000.00',
          organization_id: organization.id,
          is_active: false
        }
      ])
      .returning()
      .execute();

    // Create donations for both campaigns
    await db.insert(donationsTable)
      .values([
        {
          campaign_id: campaigns[0].id,
          donor_name: 'Donor 1',
          donor_email: 'donor1@example.com',
          donor_phone: null,
          amount: '150.00',
          message: 'For campaign 1',
          payment_status: 'confirmed',
          payment_proof_url: null
        },
        {
          campaign_id: campaigns[1].id,
          donor_name: 'Donor 2',
          donor_email: 'donor2@example.com',
          donor_phone: null,
          amount: '75.25',
          message: 'For campaign 2',
          payment_status: 'failed',
          payment_proof_url: null
        }
      ])
      .execute();

    const result = await getAllDonations();

    expect(result).toHaveLength(2);
    
    const campaignIds = result.map(d => d.campaign_id);
    expect(campaignIds).toContain(campaigns[0].id);
    expect(campaignIds).toContain(campaigns[1].id);

    // Verify all donations are returned regardless of campaign status
    const donation1 = result.find(d => d.donor_name === 'Donor 1');
    const donation2 = result.find(d => d.donor_name === 'Donor 2');
    
    expect(donation1).toBeDefined();
    expect(donation2).toBeDefined();
    expect(donation1!.amount).toBe(150.0);
    expect(donation2!.amount).toBe(75.25);
  });
});
