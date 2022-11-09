import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.stylelintrc',
    'js',
    `
  module.exports = {
    extends: require.resolve('@umijs/max/stylelint'),
  };

  `,
  );
  return [[], file];
}
