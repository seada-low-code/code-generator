import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.npmrc',
    '',
    `
registry=https://registry.npmjs.org/
strict-peer-dependencies=false
  `,
  );
  return [[], file];
}
