import { ResultDir } from '@alilc/lowcode-types';
import { IProjectTemplate } from '../../../../../types';
import { generateStaticFiles } from './helper';

export const template: IProjectTemplate = {
  slots: {
    components: {
      path: ['src', 'components'],
    },
    pages: {
      path: ['src', 'pages'],
    },
    router: {
      path: ['src', 'config'],
      fileName: 'routes',
    },
    config: {
      path: ['src'],
      fileName: '.umirc',
    },
    packageJSON: {
      path: [],
      fileName: 'package',
    },
  },
  generateTemplate(): ResultDir {
    return generateStaticFiles();
  },
};
