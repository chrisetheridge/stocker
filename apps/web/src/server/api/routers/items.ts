import { z } from "zod";

import { itemReadStateSchema } from "@stocker/core";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const itemIdSchema = z.object({
  itemId: z.string().min(1),
});

export const itemsRouter = createTRPCRouter({
  detail: publicProcedure.input(itemIdSchema).query(async ({ ctx, input }) => {
    return ctx.services.itemService.getItemDetail(input.itemId);
  }),
  markRead: publicProcedure
    .input(
      z.object({
        itemId: z.string().min(1),
        readState: itemReadStateSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.itemService.markReadState(
        input.itemId,
        input.readState,
      );
    }),
  saveForResearch: publicProcedure
    .input(
      z.object({
        itemId: z.string().min(1),
        saved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.itemService.setSavedForResearch(
        input.itemId,
        input.saved,
      );
    }),
  retryEnrichment: publicProcedure
    .input(itemIdSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.itemService.retryEnrichment(input.itemId);
    }),
  refreshStockData: publicProcedure
    .input(itemIdSchema)
    .mutation(async ({ ctx, input }) => {
      const jobs = await ctx.services.itemService.refreshStockDataForItem(
        input.itemId,
      );
      return { jobsEnqueued: jobs.length };
    }),
});
