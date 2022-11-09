import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    'tsconfig',
    'json',
    `
{
  "extends": "./src/.umi/tsconfig.json"
}
  `,
  );
  return [[], file];
}
