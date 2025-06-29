import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
export const appRouter = createTRPCRouter({
  invoke: baseProcedure
    .input(
      z.object({
        input: z.string(),
      })
    )
    .mutation(async (opts) => {
      return {
        greeting: `hello ${opts.input.input}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
