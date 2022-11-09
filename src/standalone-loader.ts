import fetch from 'node-fetch';
import type { ProjectSchema, ResultDir } from '@alilc/lowcode-types';
import type { FlattenFile } from './types/file';

declare const Worker: any;
declare const self: any;
declare const __PACKAGE_VERSION__: string;

const packageVersion = __PACKAGE_VERSION__ || 'latest';

export const DEFAULT_WORKER_JS = `https://unpkg.com/@seada/lowcode-code-generator@${packageVersion}/dist/standalone-worker.min.js`;

// export const DEFAULT_WORKER_JS = `http://127.0.0.1:8080/standalone-worker.min.js`;

export const DEFAULT_TIMEOUT_IN_MS = 60 * 1000;

const workerJsCache = new Map<string, { content: string; url: string }>();

// 这个init貌似没有用
export async function init({
  workerJsUrl = DEFAULT_WORKER_JS,
}: {
  workerJsUrl?: string;
} = {}) {
  // await loadWorkerJs(workerJsUrl);
  await loadWorkerJs(workerJsUrl);
}

export type Result = ResultDir | FlattenFile[];

/**
 * 主线程执行，向worker发送消息
 * @param options
 * @returns
 */
export async function generateCode(options: {
  solution: 'icejs' | 'rax' | 'umi';
  schema: ProjectSchema;
  flattenResult?: boolean;
  workerJsUrl?: string;
  timeoutInMs?: number;
}): Promise<Result> {
  if (typeof self !== 'object') {
    throw new Error('self is not defined');
  }

  if (typeof Worker !== 'function') {
    throw new Error('Worker is not supported');
  }
  // 支持自定义传入worker的url
  const workerJsUrl = options.workerJsUrl || DEFAULT_WORKER_JS;

  const workerJs = await loadWorkerJs(workerJsUrl);
  // 初始化worker
  const worker = new Worker(workerJs.url, {
    type: 'classic',
    credentials: 'omit',
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timeout'));
      worker.terminate();
    }, options.timeoutInMs || DEFAULT_TIMEOUT_IN_MS);
    // 接收到消息的事件处理函数
    worker.onmessage = (event: any) => {
      const msg = event.data;
      switch (msg.type) {
        case 'ready':
          print('worker is ready.');
          break;
        case 'run:begin':
          print('worker is running...');
          break;
        case 'run:end':
          print('worker is done.');
          // 代码生成结束了，返回出码的结果
          resolve(msg.result);
          clearTimeout(timer);
          // 终止web worker的运行
          worker.terminate();
          break;
        case 'run:error':
          printErr(`worker error: ${msg.errorMsg}`);
          clearTimeout(timer);
          reject(new Error(msg.errorMsg || 'unknown error'));
          worker.terminate();
          break;
        default:
          print('got unknown msg: %o', msg);
          break;
      }
    };

    worker.onerror = (err: any) => {
      printErr('worker error: %o', err);
      clearTimeout(timer);
      reject(err);
      worker.terminate();
    };
    // 向worker发送消息，worker实际上是执行run，这部分的逻辑在standalone-worker.ts中
    worker.postMessage({
      type: 'run',
      solution: options.solution,
      schema: options.schema,
      flattenResult: options.flattenResult,
    });
  });
}

async function loadWorkerJs(workerJsUrl: string) {
  const cached = workerJsCache.get(workerJsUrl);
  if (cached) {
    return cached;
  }

  const workerJsContent = await fetch(workerJsUrl)
    .then((res) => res.text())
    .catch((err) => {
      throw new Error(`Failed to fetch worker js: ${err}`);
    });

  const workerJs = {
    content: workerJsContent,
    url: self.URL.createObjectURL(
      new self.Blob([workerJsContent], { type: 'application/javascript' }),
    ),
  };

  workerJsCache.set(workerJsUrl, workerJs);

  return workerJs;
}

function print(msg: string, ...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.debug(`[code-generator/loader]: ${msg}`, ...args);
}

function printErr(msg: string, ...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.debug(`[code-generator/loader]: %c${msg}`, 'color:red', ...args);
}
