
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable, donationsTable } from '../db/schema';
import { type GetCampaignWithStatsInput } from '../schema';
import { getCampaignWithStats } from '../handlers/get_campaign_with_stats';

describe('getCampaignWithStats', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return campaign with stats', async () => {
        // Create organization
        const orgResult = await db.insert(organizationsTable)
            .values({
                name: 'Test Org',
                logo_url: null
            })
            .returning()
            .execute();
        
        const organization = orgResult[0];

        // Create campaign
        const campaignResult = await db.insert(campaignsTable)
            .values({
                name: 'Test Campaign',
                description: 'A test campaign',
                target_amount: '1000.00',
                current_amount: '250.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        const campaign = campaignResult[0];

        // Create some donations
        await db.insert(donationsTable)
            .values([
                {
                    campaign_id: campaign.id,
                    donor_name: 'John Doe',
                    donor_email: 'john@example.com',
                    donor_phone: null,
                    amount: '100.00',
                    message: null,
                    payment_status: 'confirmed'
                },
                {
                    campaign_id: campaign.id,
                    donor_name: 'Jane Smith',
                    donor_email: null,
                    donor_phone: '+1234567890',
                    amount: '150.00',
                    message: 'Great cause!',
                    payment_status: 'confirmed'
                }
            ])
            .execute();

        const input: GetCampaignWithStatsInput = {
            id: campaign.id
        };

        const result = await getCampaignWithStats(input);

        expect(result).toBeDefined();
        expect(result!.id).toEqual(campaign.id);
        expect(result!.name).toEqual('Test Campaign');
        expect(result!.description).toEqual('A test campaign');
        expect(result!.target_amount).toEqual(1000);
        expect(result!.current_amount).toEqual(250);
        expect(result!.organization_id).toEqual(organization.id);
        expect(result!.is_active).toEqual(true);
        expect(result!.organization_name).toEqual('Test Org');
        expect(result!.total_donors).toEqual(2);
        expect(result!.progress_percentage).toEqual(25); // 250/1000 * 100 = 25%
        expect(result!.created_at).toBeInstanceOf(Date);
        expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent campaign', async () => {
        const input: GetCampaignWithStatsInput = {
            id: 999
        };

        const result = await getCampaignWithStats(input);

        expect(result).toBeNull();
    });

    it('should handle campaign with no donations', async () => {
        // Create organization
        const orgResult = await db.insert(organizationsTable)
            .values({
                name: 'Empty Org',
                logo_url: 'https://example.com/logo.png'
            })
            .returning()
            .execute();
        
        const organization = orgResult[0];

        // Create campaign with no donations
        const campaignResult = await db.insert(campaignsTable)
            .values({
                name: 'Empty Campaign',
                description: null,
                target_amount: '500.00',
                current_amount: '0.00',
                organization_id: organization.id,
                is_active: false
            })
            .returning()
            .execute();

        const campaign = campaignResult[0];

        const input: GetCampaignWithStatsInput = {
            id: campaign.id
        };

        const result = await getCampaignWithStats(input);

        expect(result).toBeDefined();
        expect(result!.id).toEqual(campaign.id);
        expect(result!.name).toEqual('Empty Campaign');
        expect(result!.description).toBeNull();
        expect(result!.target_amount).toEqual(500);
        expect(result!.current_amount).toEqual(0);
        expect(result!.is_active).toEqual(false);
        expect(result!.organization_name).toEqual('Empty Org');
        expect(result!.total_donors).toEqual(0);
        expect(result!.progress_percentage).toEqual(0);
    });

    it('should calculate progress percentage correctly', async () => {
        // Create organization
        const orgResult = await db.insert(organizationsTable)
            .values({
                name: 'Progress Org',
                logo_url: null
            })
            .returning()
            .execute();
        
        const organization = orgResult[0];

        // Create campaign that exceeds target
        const campaignResult = await db.insert(campaignsTable)
            .values({
                name: 'Over Target Campaign',
                description: 'Campaign that exceeded its goal',
                target_amount: '100.00',
                current_amount: '150.00',
                organization_id: organization.id,
                is_active: true
            })
            .returning()
            .execute();

        const campaign = campaignResult[0];

        // Create donation
        await db.insert(donationsTable)
            .values({
                campaign_id: campaign.id,
                donor_name: 'Big Donor',
                donor_email: 'big@donor.com',
                donor_phone: null,
                amount: '150.00',
                message: 'Here\'s all the money!',
                payment_status: 'confirmed'
            })
            .execute();

        const input: GetCampaignWithStatsInput = {
            id: campaign.id
        };

        const result = await getCampaignWithStats(input);

        expect(result).toBeDefined();
        expect(result!.progress_percentage).toEqual(150); // 150/100 * 100 = 150%
        expect(result!.total_donors).toEqual(1);
    });
});
