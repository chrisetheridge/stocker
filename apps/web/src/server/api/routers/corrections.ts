import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const correctionsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.correctionService.listCorrections();
  }),
  applyCorrection: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        ticker: z.string().min(1),
        exchange: z.string().min(1).optional(),
        notes: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.correctionService.applyTickerCorrection(
        input.companyName,
        input.ticker,
        input.exchange,
        input.notes,
      );
    }),
  remove: publicProcedure
    .input(z.object({ correctionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.correctionService.removeTickerCorrection(
        input.correctionId,
      );
    }),
});
