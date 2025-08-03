
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, campaignsTable, donationsTable } from '../db/schema';
import { type UpdateDonationInput } from '../schema';
import { updateDonation } from '../handlers/update_donation';
import { eq } from 'drizzle-orm';

describe('updateDonation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let campaignId: number;
  let donationId: number;

  beforeEach(async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'A test campaign',
        target_amount: '10000.00',
        organization_id: organizationId,
        is_active: true
      })
      .returning()
      .execute();
    campaignId = campaignResult[0].id;

    // Create test donation
    const donationResult = await db.insert(donationsTable)
      .values({
        campaign_id: campaignId,
        donor_name: 'John Doe',
        donor_email: 'john@example.com',
        donor_phone: '+1234567890',
        amount: '100.00',
        message: 'Test donation',
        payment_status: 'pending'
      })
      .returning()
      .execute();
    donationId = donationResult[0].id;
  });

  it('should update payment status to confirmed', async () => {
    const input: UpdateDonationInput = {
      id: donationId,
      payment_status: 'confirmed'
    };

    const result = await updateDonation(input);

    expect(result.id).toEqual(donationId);
    expect(result.payment_status).toEqual('confirmed');
    expect(result.confirmed_at).toBeInstanceOf(Date);
    expect(result.amount).toEqual(100);
    expect(typeof result.amount).toBe('number');
  });

  it('should update payment proof URL', async () => {
    const input: UpdateDonationInput = {
      id: donationId,
      payment_proof_url: 'https://example.com/proof.jpg'
    };

    const result = await updateDonation(input);

    expect(result.id).toEqual(donationId);
    expect(result.payment_proof_url).toEqual('https://example.com/proof.jpg');
    expect(result.payment_status).toEqual('pending'); // Should remain unchanged
  });

  it('should update both payment status and proof URL', async () => {
    const input: UpdateDonationInput = {
      id: donationId,
      payment_status: 'confirmed',
      payment_proof_url: 'https://example.com/proof.jpg'
    };

    const result = await updateDonation(input);

    expect(result.payment_status).toEqual('confirmed');
    expect(result.payment_proof_url).toEqual('https://example.com/proof.jpg');
    expect(result.confirmed_at).toBeInstanceOf(Date);
  });

  it('should set confirmed_at to null when status changes to failed', async () => {
    // First confirm the donation
    await updateDonation({
      id: donationId,
      payment_status: 'confirmed'
    });

    // Then mark it as failed
    const input: UpdateDonationInput = {
      id: donationId,
      payment_status: 'failed'
    };

    const result = await updateDonation(input);

    expect(result.payment_status).toEqual('failed');
    expect(result.confirmed_at).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateDonationInput = {
      id: donationId,
      payment_status: 'confirmed',
      payment_proof_url: 'https://example.com/proof.jpg'
    };

    await updateDonation(input);

    // Verify changes were saved
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, donationId))
      .execute();

    expect(donations).toHaveLength(1);
    expect(donations[0].payment_status).toEqual('confirmed');
    expect(donations[0].payment_proof_url).toEqual('https://example.com/proof.jpg');
    expect(donations[0].confirmed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent donation', async () => {
    const input: UpdateDonationInput = {
      id: 99999,
      payment_status: 'confirmed'
    };

    expect(updateDonation(input)).rejects.toThrow(/not found/i);
  });

  it('should handle null payment proof URL', async () => {
    // First set a proof URL
    await updateDonation({
      id: donationId,
      payment_proof_url: 'https://example.com/proof.jpg'
    });

    // Then clear it
    const input: UpdateDonationInput = {
      id: donationId,
      payment_proof_url: null
    };

    const result = await updateDonation(input);

    expect(result.payment_proof_url).toBeNull();
  });
});
