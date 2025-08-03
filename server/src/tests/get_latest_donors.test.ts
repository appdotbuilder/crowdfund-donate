
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable, donationsTable } from '../db/schema';
import { type GetLatestDonorsInput } from '../handlers/get_latest_donors';
import { getLatestDonors } from '../handlers/get_latest_donors';

describe('getLatestDonors', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return latest confirmed donors for a campaign', async () => {
        // Create test organization
        const [organization] = await db.insert(organizationsTable)
            .values({
                name: 'Test Org',
                logo_url: null
            })
            .returning()
            .execute();

        // Create test campaign
        const [campaign] = await db.insert(campaignsTable)
            .values({
                name: 'Test Campaign',
                description: 'A test campaign',
                target_amount: '1000.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        // Create test donations with different confirmation times
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        await db.insert(donationsTable)
            .values([
                {
                    campaign_id: campaign.id,
                    donor_name: 'John Doe',
                    donor_email: 'john@example.com',
                    amount: '100.00',
                    payment_status: 'confirmed',
                    confirmed_at: now
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Jane Smith',
                    donor_email: 'jane@example.com',
                    amount: '50.00',
                    payment_status: 'confirmed',
                    confirmed_at: oneHourAgo
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Bob Wilson',
                    donor_email: 'bob@example.com',
                    amount: '25.00',
                    payment_status: 'confirmed',
                    confirmed_at: twoHoursAgo
                }
            ])
            .execute();

        const input: GetLatestDonorsInput = {
            campaign_id: campaign.id,
            limit: 5
        };

        const result = await getLatestDonors(input);

        expect(result).toHaveLength(3);
        expect(result[0].donor_name).toEqual('John Doe');
        expect(result[0].amount).toEqual(100);
        expect(typeof result[0].amount).toBe('number');
        expect(result[1].donor_name).toEqual('Jane Smith');
        expect(result[2].donor_name).toEqual('Bob Wilson');
    });

    it('should respect the limit parameter', async () => {
        // Create test organization and campaign
        const [organization] = await db.insert(organizationsTable)
            .values({
                name: 'Test Org',
                logo_url: null
            })
            .returning()
            .execute();

        const [campaign] = await db.insert(campaignsTable)
            .values({
                name: 'Test Campaign',
                description: 'A test campaign',
                target_amount: '1000.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        // Create 4 confirmed donations
        const now = new Date();
        await db.insert(donationsTable)
            .values([
                {
                    campaign_id: campaign.id,
                    donor_name: 'Donor 1',
                    amount: '100.00',
                    payment_status: 'confirmed',
                    confirmed_at: new Date(now.getTime() - 1000)
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Donor 2',
                    amount: '200.00',
                    payment_status: 'confirmed',
                    confirmed_at: new Date(now.getTime() - 2000)
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Donor 3',
                    amount: '300.00',
                    payment_status: 'confirmed',
                    confirmed_at: new Date(now.getTime() - 3000)
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Donor 4',
                    amount: '400.00',
                    payment_status: 'confirmed',
                    confirmed_at: new Date(now.getTime() - 4000)
                }
            ])
            .execute();

        const input: GetLatestDonorsInput = {
            campaign_id: campaign.id,
            limit: 2
        };

        const result = await getLatestDonors(input);

        expect(result).toHaveLength(2);
        expect(result[0].donor_name).toEqual('Donor 1');
        expect(result[1].donor_name).toEqual('Donor 2');
    });

    it('should return empty array for campaign with no confirmed donations', async () => {
        // Create test organization and campaign
        const [organization] = await db.insert(organizationsTable)
            .values({
                name: 'Test Org',
                logo_url: null
            })
            .returning()
            .execute();

        const [campaign] = await db.insert(campaignsTable)
            .values({
                name: 'Test Campaign',
                description: 'A test campaign',
                target_amount: '1000.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        // Create pending donation (should not be included)
        await db.insert(donationsTable)
            .values({
                campaign_id: campaign.id,
                donor_name: 'Pending Donor',
                amount: '100.00',
                payment_status: 'pending',
                confirmed_at: null
            })
            .execute();

        const input: GetLatestDonorsInput = {
            campaign_id: campaign.id,
            limit: 5
        };

        const result = await getLatestDonors(input);

        expect(result).toHaveLength(0);
    });

    it('should only return donations for the specified campaign', async () => {
        // Create test organization
        const [organization] = await db.insert(organizationsTable)
            .values({
                name: 'Test Org',
                logo_url: null
            })
            .returning()
            .execute();

        // Create two test campaigns
        const [campaign1] = await db.insert(campaignsTable)
            .values({
                name: 'Campaign 1',
                description: 'First campaign',
                target_amount: '1000.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        const [campaign2] = await db.insert(campaignsTable)
            .values({
                name: 'Campaign 2',
                description: 'Second campaign',
                target_amount: '2000.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        // Create donations for both campaigns
        const now = new Date();
        await db.insert(donationsTable)
            .values([
                {
                    campaign_id: campaign1.id,
                    donor_name: 'Campaign 1 Donor',
                    amount: '100.00',
                    payment_status: 'confirmed',
                    confirmed_at: now
                },
                {
                    campaign_id: campaign2.id,
                    donor_name: 'Campaign 2 Donor',
                    amount: '200.00',
                    payment_status: 'confirmed',
                    confirmed_at: now
                }
            ])
            .execute();

        const input: GetLatestDonorsInput = {
            campaign_id: campaign1.id,
            limit: 5
        };

        const result = await getLatestDonors(input);

        expect(result).toHaveLength(1);
        expect(result[0].donor_name).toEqual('Campaign 1 Donor');
        expect(result[0].campaign_id).toEqual(campaign1.id);
    });
});
