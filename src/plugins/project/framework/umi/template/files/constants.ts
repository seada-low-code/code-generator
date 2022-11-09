import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile('index', 'ts', `export const DEFAULT_NAME = 'Umi Max';`);
  return [['src', 'constants'], file];
}
