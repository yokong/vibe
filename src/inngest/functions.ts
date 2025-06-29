import { inngest } from './client';
import { openai, createAgent } from '@inngest/agent-kit';
export const helloWorld = inngest.createFunction({ id: 'hello-world' }, { event: 'test/hello.world' }, async ({ event, step }) => {
  const codeAgent = createAgent({
    name: 'codeAgent',
    system: 'You are an expert next.js developer. You write readable, maintainable code.You write simple Next.js & React snippets',
    model: openai({ model: 'gpt-4-1106-preview' }),
  });

  const { output } = await codeAgent.run(`Summarize the following text: ${event.data.value}`);
  return { output };
});
