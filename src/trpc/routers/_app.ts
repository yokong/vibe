import { createTRPCRouter } from '../init';
import { messageRouter } from '@/modules/messages/server/procedures';
import { projectRouter } from '@/modules/projects/server/procedures';
export const appRouter = createTRPCRouter({
  messages: messageRouter,
  projects: projectRouter,
});
export type AppRouter = typeof appRouter;
