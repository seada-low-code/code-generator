import type { ContainerSchema } from '@alilc/lowcode-types';

// 组件分析结果
export interface ICompAnalyzeResult {
  isUsingRef: boolean; // 是否使用ref
  refArr: string[]; // ref的名称，用来在 useRef 中创建变量标识符
}

export type TComponentAnalyzer = (container: ContainerSchema) => ICompAnalyzeResult;
