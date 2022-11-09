import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    'format',
    'ts',
    `// 示例方法，没有实际意义
export function trim(str: string) {
  return str.trim();
}
  `,
  );
  return [['src', 'utils'], file];
}
