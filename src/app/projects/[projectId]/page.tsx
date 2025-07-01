interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}
const Page = async ({ params }: PageProps) => {
  const { projectId } = await params;
  return <div>{projectId}</div>;
};

export default Page;
