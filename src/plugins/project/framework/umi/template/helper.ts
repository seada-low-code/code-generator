import { ResultDir } from '@alilc/lowcode-types';
import { createResultDir } from '../../../../../utils/resultHelper';
import { runFileGenerator } from '../../../../../utils/templateHelper';
import file1 from './files/README.md';
import file2 from './files/eslintrc.js';
import file3 from './files/gitignore';
import file4 from './files/lintstagedrc';
import file5 from './files/npmrc';
import file6 from './files/prettierrc';
import file7 from './files/prettierrcignore';
import file8 from './files/stylelintrc.js';
import file9 from './files/tsconfig.json';
import file10 from './files/typings';
import file11 from './files/assets';
import file12 from './files/constants';
import file13 from './files/models';
import file14 from './files/utils';
import file15 from './files/app';
import file16 from './files/access';
import file17 from './files/umirc';
import { getComponentEntryFile, getGuideTsxFile, getGuildStyleFile } from './files/components';

export function generateStaticFiles(root = createResultDir('.')): ResultDir {
  runFileGenerator(root, file1); // README.md
  runFileGenerator(root, file2); // .eslintrc.js
  runFileGenerator(root, file3); // .gitignore
  runFileGenerator(root, file4); // .lintstagedrc
  runFileGenerator(root, file5); // .npmrc
  runFileGenerator(root, file6); // .prettierrc
  runFileGenerator(root, file7); // .prettierrcignore
  runFileGenerator(root, file8); // .stylelintrc.js
  runFileGenerator(root, file9); // tsconfig.json
  runFileGenerator(root, file10); // typings.d.ts
  runFileGenerator(root, file11); // src/assets/.gitkeep
  runFileGenerator(root, file12); // src/constants/index.ts
  runFileGenerator(root, file13); // src/models/global.ts
  runFileGenerator(root, file14); // src/utils/format.ts
  runFileGenerator(root, file15); // src/app.ts
  runFileGenerator(root, file16); // src/access.ts
  runFileGenerator(root, file17); // src/.umirc.ts
  runFileGenerator(root, getComponentEntryFile); // src/components/index.ts
  runFileGenerator(root, getGuideTsxFile); // src/components/Guide.tsx
  runFileGenerator(root, getGuildStyleFile); // src/components/Guide.less
  return root;
}
