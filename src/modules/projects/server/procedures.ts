import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import z from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { generateSlug } from 'random-word-slugs';
import { TRPCError } from '@trpc/server';

export const projectRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().min(1, { message: 'Project id is required' }) }))
    .query(async ({ input }) => {
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!existingProject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return existingProject;
    }),
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return projects;
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: 'Message name is required' })
          .max(10000, { message: 'Message name is too long' }),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 创建项目 并创建用户消息
      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: 'kebab' }),
          messages: {
            create: {
              content: input.value,
              role: 'USER',
              type: 'RESULT',
            },
          },
        },
      });

      // 2. 发送消息创建事件
      await inngest.send({
        name: 'code-agent/run',
        data: {
          value: input.value,
          projectId: createdProject.id,
        },
      });
      return createdProject;
    }),
});
