import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.prettierrcignore',
    '',
    `
node_modules
.umi
.umi-production

  `,
  );
  return [[], file];
}
