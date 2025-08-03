
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { donationsTable, organizationsTable, campaignsTable } from '../db/schema';
import { type CreateDonationInput } from '../schema';
import { createDonation } from '../handlers/create_donation';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateDonationInput = {
  campaign_id: 1,
  donor_name: 'John Doe',
  donor_email: 'john.doe@example.com',
  donor_phone: '+1234567890',
  amount: 100.50,
  message: 'Happy to support this cause!'
};

describe('createDonation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a donation with all fields', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    // Create prerequisite campaign
    await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'Test campaign description',
        target_amount: '5000.00',
        organization_id: orgResult[0].id,
        is_active: true
      })
      .execute();

    const result = await createDonation(testInput);

    // Basic field validation
    expect(result.campaign_id).toEqual(1);
    expect(result.donor_name).toEqual('John Doe');
    expect(result.donor_email).toEqual('john.doe@example.com');
    expect(result.donor_phone).toEqual('+1234567890');
    expect(result.amount).toEqual(100.50);
    expect(typeof result.amount).toBe('number');
    expect(result.message).toEqual('Happy to support this cause!');
    expect(result.payment_status).toEqual('pending');
    expect(result.payment_proof_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.confirmed_at).toBeNull();
  });

  it('should save donation to database', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    // Create prerequisite campaign
    await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'Test campaign description',
        target_amount: '5000.00',
        organization_id: orgResult[0].id,
        is_active: true
      })
      .execute();

    const result = await createDonation(testInput);

    // Query using proper drizzle syntax
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(donations).toHaveLength(1);
    expect(donations[0].campaign_id).toEqual(1);
    expect(donations[0].donor_name).toEqual('John Doe');
    expect(donations[0].donor_email).toEqual('john.doe@example.com');
    expect(donations[0].donor_phone).toEqual('+1234567890');
    expect(parseFloat(donations[0].amount)).toEqual(100.50);
    expect(donations[0].message).toEqual('Happy to support this cause!');
    expect(donations[0].payment_status).toEqual('pending');
    expect(donations[0].created_at).toBeInstanceOf(Date);
  });

  it('should create donation with nullable fields as null', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        logo_url: null
      })
      .returning()
      .execute();

    // Create prerequisite campaign
    await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        description: 'Test campaign description',
        target_amount: '5000.00',
        organization_id: orgResult[0].id,
        is_active: true
      })
      .execute();

    const minimalInput: CreateDonationInput = {
      campaign_id: 1,
      donor_name: 'Jane Smith',
      donor_email: null,
      donor_phone: null,
      amount: 25.00,
      message: null
    };

    const result = await createDonation(minimalInput);

    expect(result.donor_name).toEqual('Jane Smith');
    expect(result.donor_email).toBeNull();
    expect(result.donor_phone).toBeNull();
    expect(result.amount).toEqual(25.00);
    expect(result.message).toBeNull();
    expect(result.payment_status).toEqual('pending');
  });

  it('should throw error when campaign does not exist', async () => {
    const invalidInput: CreateDonationInput = {
      campaign_id: 999, // Non-existent campaign
      donor_name: 'John Doe',
      donor_email: 'john.doe@example.com',
      donor_phone: '+1234567890',
      amount: 100.50,
      message: 'Happy to support this cause!'
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/campaign with id 999 does not exist/i);
  });
});
