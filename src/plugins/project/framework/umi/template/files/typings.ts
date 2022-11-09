import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    'typings.d',
    'ts',
    `
  import '@umijs/max/typings';

  `,
  );
  return [[], file];
}
