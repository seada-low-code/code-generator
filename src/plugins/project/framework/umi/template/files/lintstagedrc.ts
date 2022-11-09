import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.lintstagedrc',
    '',
    `
  {
    "*.{md,json}": [
      "prettier --cache --write"
    ],
    "*.{js,jsx}": [
      "max lint --fix --eslint-only",
      "prettier --cache --write"
    ],
    "*.{css,less}": [
      "max lint --fix --stylelint-only",
      "prettier --cache --write"
    ],
    "*.ts?(x)": [
      "max lint --fix --eslint-only",
      "prettier --cache --parser=typescript --write"
    ]
  }

  `,
  );
  return [[], file];
}
