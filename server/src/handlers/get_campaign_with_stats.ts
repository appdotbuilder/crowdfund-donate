
import { db } from '../db';
import { campaignsTable, organizationsTable, donationsTable } from '../db/schema';
import { type GetCampaignWithStatsInput, type Campaign } from '../schema';
import { eq, count } from 'drizzle-orm';

export type CampaignWithStats = Campaign & {
    organization_name: string;
    total_donors: number;
    progress_percentage: number;
};

export async function getCampaignWithStats(input: GetCampaignWithStatsInput): Promise<CampaignWithStats | null> {
    try {
        // First, get campaign with organization details
        const campaignResult = await db.select()
            .from(campaignsTable)
            .innerJoin(organizationsTable, eq(campaignsTable.organization_id, organizationsTable.id))
            .where(eq(campaignsTable.id, input.id))
            .execute();

        if (campaignResult.length === 0) {
            return null;
        }

        const campaignData = campaignResult[0];

        // Get total donors count for this campaign
        const donorsResult = await db.select({
            total_donors: count(donationsTable.id)
        })
        .from(donationsTable)
        .where(eq(donationsTable.campaign_id, input.id))
        .execute();

        const totalDonors = donorsResult[0]?.total_donors || 0;

        // Calculate progress percentage
        const currentAmount = parseFloat(campaignData.campaigns.current_amount);
        const targetAmount = parseFloat(campaignData.campaigns.target_amount);
        const progressPercentage = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;

        return {
            id: campaignData.campaigns.id,
            name: campaignData.campaigns.name,
            description: campaignData.campaigns.description,
            target_amount: targetAmount,
            current_amount: currentAmount,
            organization_id: campaignData.campaigns.organization_id,
            is_active: campaignData.campaigns.is_active,
            created_at: campaignData.campaigns.created_at,
            updated_at: campaignData.campaigns.updated_at,
            organization_name: campaignData.organizations.name,
            total_donors: totalDonors,
            progress_percentage: progressPercentage
        };
    } catch (error) {
        console.error('Failed to get campaign with stats:', error);
        throw error;
    }
}
