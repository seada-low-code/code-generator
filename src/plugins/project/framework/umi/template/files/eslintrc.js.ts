import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.eslintrc',
    'js',
    `
  module.exports = {
    extends: require.resolve('@umijs/max/eslint'),
  };

  `,
  );
  return [[], file];
}
