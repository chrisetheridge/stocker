import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { inboxRouter } from "~/server/api/routers/inbox";
import { itemsRouter } from "~/server/api/routers/items";
import { sourcesRouter } from "~/server/api/routers/sources";
import { correctionsRouter } from "~/server/api/routers/corrections";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  inbox: inboxRouter,
  items: itemsRouter,
  sources: sourcesRouter,
  corrections: correctionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
