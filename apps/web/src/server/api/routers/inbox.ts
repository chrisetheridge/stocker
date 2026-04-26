import { z } from "zod";

import { enrichmentStateSchema, itemReadStateSchema } from "@stocker/core";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const inboxFiltersSchema = z.object({
  sourceId: z.string().min(1).optional(),
  ticker: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  readState: itemReadStateSchema.optional(),
  savedForResearch: z.boolean().optional(),
  enrichmentState: enrichmentStateSchema.optional(),
  query: z.string().min(1).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const inboxRouter = createTRPCRouter({
  list: publicProcedure
    .input(inboxFiltersSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.inboxService.listInboxItems(input);
    }),
});
