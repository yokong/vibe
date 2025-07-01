import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import z from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export const messageRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    return await prisma.message.findMany({
      orderBy: {
        updatedAt: 'asc',
      },
      include: {
        fragment: true,
      },
    });
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: 'Message is required' }).max(10000, { message: 'Message is too long' }),
        projectId: z.string().min(1, { message: 'Project is required' }),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 创建用户消息
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: 'USER',
          type: 'RESULT',
          projectId: input.projectId,
        },
      });

      // 2. 发送消息创建事件
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: input.projectId,
        },
      });
      return createdMessage;
    }),
});
