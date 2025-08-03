
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createOrganizationInputSchema,
  updateOrganizationInputSchema,
  createCampaignInputSchema,
  updateCampaignInputSchema,
  createDonationInputSchema,
  updateDonationInputSchema,
  searchDonorsInputSchema,
  getCampaignWithStatsSchema
} from './schema';

// Import handlers
import { createOrganization } from './handlers/create_organization';
import { getOrganizations } from './handlers/get_organizations';
import { updateOrganization } from './handlers/update_organization';
import { deleteOrganization } from './handlers/delete_organization';
import { createCampaign } from './handlers/create_campaign';
import { getCampaigns } from './handlers/get_campaigns';
import { getCampaignWithStats } from './handlers/get_campaign_with_stats';
import { updateCampaign } from './handlers/update_campaign';
import { deleteCampaign } from './handlers/delete_campaign';
import { createDonation } from './handlers/create_donation';
import { getLatestDonors } from './handlers/get_latest_donors';
import { searchDonors } from './handlers/search_donors';
import { getAllDonations } from './handlers/get_all_donations';
import { updateDonation } from './handlers/update_donation';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Organization routes
  createOrganization: publicProcedure
    .input(createOrganizationInputSchema)
    .mutation(({ input }) => createOrganization(input)),
  
  getOrganizations: publicProcedure
    .query(() => getOrganizations()),
  
  updateOrganization: publicProcedure
    .input(updateOrganizationInputSchema)
    .mutation(({ input }) => updateOrganization(input)),
  
  deleteOrganization: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteOrganization(input)),

  // Campaign routes
  createCampaign: publicProcedure
    .input(createCampaignInputSchema)
    .mutation(({ input }) => createCampaign(input)),
  
  getCampaigns: publicProcedure
    .query(() => getCampaigns()),
  
  getCampaignWithStats: publicProcedure
    .input(getCampaignWithStatsSchema)
    .query(({ input }) => getCampaignWithStats(input)),
  
  updateCampaign: publicProcedure
    .input(updateCampaignInputSchema)
    .mutation(({ input }) => updateCampaign(input)),
  
  deleteCampaign: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCampaign(input)),

  // Donation routes
  createDonation: publicProcedure
    .input(createDonationInputSchema)
    .mutation(({ input }) => createDonation(input)),
  
  getLatestDonors: publicProcedure
    .input(z.object({ campaign_id: z.number(), limit: z.number().default(5) }))
    .query(({ input }) => getLatestDonors(input)),
  
  searchDonors: publicProcedure
    .input(searchDonorsInputSchema)
    .query(({ input }) => searchDonors(input)),
  
  getAllDonations: publicProcedure
    .query(() => getAllDonations()),
  
  updateDonation: publicProcedure
    .input(updateDonationInputSchema)
    .mutation(({ input }) => updateDonation(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
