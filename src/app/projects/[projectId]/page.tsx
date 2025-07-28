import { ProjectView, ProjectViewSkeleton } from '@/modules/projects/ui/views/project-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}
const Page = async ({ params }: PageProps) => {
  const { projectId } = await params;

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({ projectId }));
  await queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProjectViewSkeleton />}>
        <ProjectView projectId={projectId} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
