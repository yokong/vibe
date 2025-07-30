'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { MessagesContainer } from '../components/messages-container';
import { Suspense, useState } from 'react';
import { Fragment } from '@/generated/prisma';
import { ProjectHeader } from '../components/project-header';
import { FragmentWeb } from '../components/fragment-web';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeIcon, CrownIcon, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CodeView } from '@/components/code-view';
import { FileExplorer } from '@/components/file-explorer';

interface Props {
  projectId: string;
}
export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<'preview' | 'code'>('preview');

  const trpc = useTRPC();
  /**
   * 获取project
   */
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  );

  /**
   * 获取 projectId 对应的 messages
   */
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    })
  );

  return (
    <div className=" h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0 "
            defaultValue="preview"
            onValueChange={(value) => setTabState(value as 'preview' | 'code')}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <Button asChild size="sm" variant="default">
                  <Link href="/pricing">
                    <CrownIcon fill="#F0B100" /> Upgrade
                  </Link>
                </Button>
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {/* <CodeView code={'const a = "hello world"'} lang={'ts'} /> */}
              {!!activeFragment?.files && (
                <FileExplorer
                  files={
                    activeFragment.files as {
                      [path: string]: string;
                    }
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export const ProjectViewSkeleton = () => {
  return <div>ProjectViewSkeleton</div>;
};
