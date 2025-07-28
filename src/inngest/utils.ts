import { Sandbox } from '@e2b/code-interpreter';
import { AgentResult, TextMessage } from '@inngest/agent-kit';

/**
 * 连接 E2B sandbox
 * @param sandboxId
 * @returns sandbox 实例
 */
export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

/**
 * 获取 Agent 执行结果的最后一条助手消息的内容
 * @param result agent 执行结果
 * @returns 最后一条【助手消息】的内容
 */
export function lastAssistantTextmessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === 'assistant'
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  // 助手消息内容可能是字符串或字符串数组
  return message?.content
    ? typeof message.content === 'string'
      ? message.content
      : message.content.map((c) => c.text).join('')
    : undefined;
}
