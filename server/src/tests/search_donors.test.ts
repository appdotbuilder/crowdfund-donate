
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable, donationsTable } from '../db/schema';
import { type SearchDonorsInput, type CreateOrganizationInput, type CreateCampaignInput, type CreateDonationInput } from '../schema';
import { searchDonors } from '../handlers/search_donors';

// Test data setup
const testOrganization: CreateOrganizationInput = {
  name: 'Test Organization',
  logo_url: null
};

const testCampaign1: CreateCampaignInput = {
  name: 'Campaign 1',
  description: 'First test campaign',
  target_amount: 1000,
  organization_id: 1,
  is_active: true
};

const testCampaign2: CreateCampaignInput = {
  name: 'Campaign 2',
  description: 'Second test campaign',
  target_amount: 2000,
  organization_id: 1,
  is_active: true
};

const testDonation1: CreateDonationInput = {
  campaign_id: 1,
  donor_name: 'John Smith',
  donor_email: 'john@example.com',
  donor_phone: '123-456-7890',
  amount: 100,
  message: 'Good cause'
};

const testDonation2: CreateDonationInput = {
  campaign_id: 1,
  donor_name: 'Jane Doe',
  donor_email: 'jane@example.com',
  donor_phone: null,
  amount: 50,
  message: null
};

const testDonation3: CreateDonationInput = {
  campaign_id: 2,
  donor_name: 'John Johnson',
  donor_email: 'johnjohnson@example.com',
  donor_phone: null,
  amount: 200,
  message: 'Another donation'
};

describe('searchDonors', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test organization
    await db.insert(organizationsTable)
      .values({
        name: testOrganization.name,
        logo_url: testOrganization.logo_url
      })
      .execute();

    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        {
          name: testCampaign1.name,
          description: testCampaign1.description,
          target_amount: testCampaign1.target_amount.toString(),
          organization_id: testCampaign1.organization_id,
          is_active: testCampaign1.is_active
        },
        {
          name: testCampaign2.name,
          description: testCampaign2.description,
          target_amount: testCampaign2.target_amount.toString(),
          organization_id: testCampaign2.organization_id,
          is_active: testCampaign2.is_active
        }
      ])
      .execute();

    // Create test donations
    await db.insert(donationsTable)
      .values([
        {
          campaign_id: testDonation1.campaign_id,
          donor_name: testDonation1.donor_name,
          donor_email: testDonation1.donor_email,
          donor_phone: testDonation1.donor_phone,
          amount: testDonation1.amount.toString(),
          message: testDonation1.message
        },
        {
          campaign_id: testDonation2.campaign_id,
          donor_name: testDonation2.donor_name,
          donor_email: testDonation2.donor_email,
          donor_phone: testDonation2.donor_phone,
          amount: testDonation2.amount.toString(),
          message: testDonation2.message
        },
        {
          campaign_id: testDonation3.campaign_id,
          donor_name: testDonation3.donor_name,
          donor_email: testDonation3.donor_email,
          donor_phone: testDonation3.donor_phone,
          amount: testDonation3.amount.toString(),
          message: testDonation3.message
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should search donors by name across all campaigns', async () => {
    const input: SearchDonorsInput = {
      query: 'john'
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(2);
    expect(result.map(d => d.donor_name)).toContain('John Smith');
    expect(result.map(d => d.donor_name)).toContain('John Johnson');
    
    // Verify numeric conversion
    result.forEach(donation => {
      expect(typeof donation.amount).toBe('number');
    });
  });

  it('should search donors by name within specific campaign', async () => {
    const input: SearchDonorsInput = {
      query: 'john',
      campaign_id: 1
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(1);
    expect(result[0].donor_name).toEqual('John Smith');
    expect(result[0].campaign_id).toEqual(1);
    expect(result[0].amount).toEqual(100);
  });

  it('should perform case-insensitive search', async () => {
    const input: SearchDonorsInput = {
      query: 'JANE'
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(1);
    expect(result[0].donor_name).toEqual('Jane Doe');
    expect(result[0].amount).toEqual(50);
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchDonorsInput = {
      query: 'nonexistent'
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(0);
  });

  it('should handle partial name matches', async () => {
    const input: SearchDonorsInput = {
      query: 'do'
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(1);
    expect(result[0].donor_name).toEqual('Jane Doe');
  });

  it('should return empty array for campaign with no matching donors', async () => {
    const input: SearchDonorsInput = {
      query: 'jane',
      campaign_id: 2
    };

    const result = await searchDonors(input);

    expect(result).toHaveLength(0);
  });
});
