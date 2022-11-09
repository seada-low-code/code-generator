import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

/**
 * @returns 两个元素的一个数组，第一个元素是路径数组，第二个元素是具体文件的数据
 */
export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    '.prettierrc',
    '',
    `
    {
      "printWidth": 80,
      "singleQuote": true,
      "trailingComma": "all",
      "proseWrap": "never",
      "overrides": [{ "files": ".prettierrc", "options": { "parser": "json" } }],
      "plugins": ["prettier-plugin-organize-imports", "prettier-plugin-packagejson"]
    }

  `,
  );
  return [[], file];
}
