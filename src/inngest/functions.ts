import { Sandbox } from '@e2b/code-interpreter';
import { inngest } from './client';
import { openai, createAgent } from '@inngest/agent-kit';
import { getSandbox } from './utils';
export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    const sandboxId = await step.run('get-sandbox-id', async () => {
      // 1.创建 sandbox
      const sandbox = await Sandbox.create('vibe-nextjs-test-yokong-3');
      return sandbox.sandboxId;
    });
    // 2. 创建 agent
    const codeAgent = createAgent({
      name: 'codeAgent',
      system:
        'You are an expert next.js developer. You write readable, maintainable code.You write simple Next.js & React snippets',
      model: openai({ model: 'gpt-4-1106-preview' }),
    });

    const { output } = await codeAgent.run(`Summarize the following text: ${event.data.value}`);

    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { output, sandboxUrl };
  }
);
