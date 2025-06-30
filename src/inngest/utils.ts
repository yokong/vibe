import { Sandbox } from '@e2b/code-interpreter';

/**
 * 连接 sandbox
 * @param sandboxId
 * @returns sandbox 实例
 */
export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}
