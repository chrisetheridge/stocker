import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const sourcesRouter = createTRPCRouter({
  status: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.sourceStatusService.listSourceStatus();
  }),
  refresh: publicProcedure
    .input(z.object({ sourceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.sourceRefreshService.refreshSource(
        input.sourceId,
        "manual",
      );
    }),
  refreshAll: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.services.sourceRefreshService.refreshAllEnabledSources(
      "manual",
    );
  }),
});
