import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

/**
 * @returns 两个元素的一个数组，第一个元素是路径数组，第二个元素是具体文件的数据
 */
export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.gitignore',
    '',
    `
/node_modules
/.env.local
/.umirc.local.ts
/config/config.local.ts
/src/.umi
/src/.umi-production
/src/.umi-test
/.umi
/.umi-production
/.umi-test
/dist
/.mfsu

  `,
  );
  return [[], file];
}
