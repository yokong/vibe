import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { inngest } from '@/inngest/client';
export const appRouter = createTRPCRouter({
  invoke: baseProcedure
    .input(
      z.object({
        input: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await inngest.send({
        name: 'test/hello.world',
        data: {
          value: input,
        },
      });
      return {
        message: 'success',
      };
    }),
});
export type AppRouter = typeof appRouter;
