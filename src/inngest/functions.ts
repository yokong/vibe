// 引入必要的依赖和工具函数
// PROMPT: 系统提示词
// Sandbox: E2B 沙盒环境
// createAgent, createNetwork, createTool, openai: Inngest Agent Kit 相关方法
// z: 参数校验
// inngest: Inngest 客户端
// getSandbox, lastAssistantTextmessageContent: 工具函数
import { PROMPT } from '@/prompt';
import { Sandbox } from '@e2b/code-interpreter';
import { createAgent, createNetwork, createTool, openai, Tool } from '@inngest/agent-kit';
import { z } from 'zod';
import { inngest } from './client';
import { getSandbox, lastAssistantTextmessageContent } from './utils';
import { prisma } from '@/lib/db';

interface AgentState {
  summary: string;
  files: {
    [path: string]: string;
  };
}

// 定义 Inngest Function
export const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' }, // Function 唯一标识
  { event: 'code-agent/run' }, // 监听的事件类型
  async ({ event, step }) => {
    // 1. 创建 E2B 沙盒，获取 sandboxId
    const sandboxId = await step.run('get-sandbox-id', async () => {
      // 创建一个新的 E2B 沙盒实例
      const sandbox = await Sandbox.create('vibe-nextjs-test-yokong-3');
      return sandbox.sandboxId;
    });

    // 2. 创建 AI Agent，配置系统提示词、模型、工具等
    const codeAgent = createAgent<AgentState>({
      name: 'codeAgent', // Agent 名称
      system: PROMPT, // 系统提示词
      description: 'An expert coding agent', // Agent 描述
      model: openai({
        model: 'gpt-4.1', // 使用的 OpenAI 模型
        defaultParameters: {
          temperature: 0.1, // 低温度，保证输出稳定
        },
      }),
      tools: [
        /**
         * 终端工具：允许 Agent 在沙盒中执行命令
         */
        createTool({
          name: 'terminal',
          description: 'Use the terminal to run commands',
          parameters: z.object({
            command: z.string(), // 需要执行的命令
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run('terminal', async () => {
              const buffers = { stdout: '', stderr: '' };
              try {
                /**
                 * 执行 E2B Command
                 * @see https://www.e2b.dev/docs/commands
                 */
                const sandbox = await getSandbox(sandboxId); // 连接到沙盒
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout; // 返回标准输出
              } catch (e) {
                // 捕获并返回错误信息
                console.error(`Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror:${buffers.stderr}`);
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror:${buffers.stderr}`;
              }

              return process.stdout;
            });
          },
        }),
        /**
         * 创建或更新文件工具：允许 Agent 在沙盒中写入/更新文件
         */
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or update files in the sandbox',
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(), // 文件路径
                content: z.string(), // 文件内容
              })
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            /**
             * files 示例：
             * [ { path: "/app.tsx", content: "<p>app page</p>" }, ... ]
             */
            const newFiles = await step?.run('createOrUpdateFiles', async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content); // 写入文件
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                return 'Error: ' + e;
              }
            });

            // 更新 network 的文件状态
            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles;
            }
          },
        }),
        /**
         * 读取文件工具：允许 Agent 从沙盒中读取文件内容
         */
        createTool({
          name: 'readFiles',
          description: 'Read files from the sandbox',
          parameters: z.object({
            files: z.array(z.string()), // 需要读取的文件路径数组
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            return await step?.run('readFile', async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({
                    path: file,
                    content,
                  });
                  return JSON.stringify(contents); // 只返回第一个文件内容（可优化）
                }
              } catch (e) {
                return 'Error: ' + e;
              }
            });
          },
        }),
      ],
      lifecycle: {
        // Agent 响应后处理：提取 summary 信息
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextmessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes('<task_summary>')) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    // 3. 创建 Network，管理 Agent 的执行流程
    const network = createNetwork<AgentState>({
      name: 'coding-agent-network', // 网络名称
      agents: [codeAgent], // 参与的 Agent
      maxIter: 15, // 最大迭代次数
      router: async ({ network }) => {
        // 路由逻辑：如果已有 summary，则终止，否则继续由 codeAgent 处理
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    // 4. 运行 Network，传入用户输入，驱动 Agent 执行
    const result = await network.run(event.data.value);

    const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;
    // 5. 获取沙盒的访问 URL
    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // 6. 保存结果到数据库
    await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: 'Something went wrong, please try again later.',
            role: 'ASSISTANT',
            type: 'ERROR',
            projectId: event.data.projectId,
          },
        });
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: 'Fragment',
              files: result.state.data.files,
            },
          },
          projectId: event.data.projectId,
        },
      });
    });

    // 7. 返回最终结果，包括文件、摘要、沙盒 URL
    return {
      title: 'Fragment',
      files: result.state.data.files,
      summary: result.state.data.summary,
      url: sandboxUrl,
    };
  }
);
