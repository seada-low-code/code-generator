import { createProjectBuilder } from '../generator/ProjectBuilder';
import { template } from '../plugins/project/framework/umi';
import { prettier } from '../postprocessor';
import { IProjectBuilder } from '../types';
import reactCommonDeps from '../plugins/project/framework/umi/plugins/reactCommonDeps';
import esModule from '../plugins/project/framework/umi/plugins/esModule';
import containerFC from '../plugins/project/framework/umi/plugins/containerFC';
import containerInjectDataSource from '../plugins/project/framework/umi/plugins/containerInjectDataSource';
import containerInitState from '../plugins/project/framework/umi/plugins/containerInitState';
import containerInitRef from '../plugins/project/framework/umi/plugins/containerInitRef';
import containerLifeCycle from '../plugins/project/framework/umi/plugins/containerLifeCycle';
import containerMethod from '../plugins/project/framework/umi/plugins/containerMethod';
import jsx from '../plugins/project/framework/umi/plugins/jsx';
import style from '../plugins/project/framework/umi/plugins/style';
import packageJSON from '../plugins/project/framework/umi/plugins/packageJSON';
import config from '../plugins/project/framework/umi/plugins/config';
import router from '../plugins/project/framework/umi/plugins/router';

export default function createUmiProjectBuilder(): IProjectBuilder {
  return createProjectBuilder({
    template,
    plugins: {
      components: [
        reactCommonDeps(),
        esModule(),
        containerFC(),
        containerInjectDataSource(),
        containerInitState(),
        containerInitRef(),
        containerLifeCycle(),
        containerMethod(),
        jsx({
          nodeTypeMapping: {
            Div: 'div',
            Component: 'div',
            Page: 'div',
            Block: 'div',
          },
        }),
        style(),
      ],
      pages: [
        reactCommonDeps(),
        esModule(),
        containerFC(),
        containerInjectDataSource(),
        containerInitState(),
        containerInitRef(),
        containerLifeCycle(),
        containerMethod(),
        jsx({
          nodeTypeMapping: {
            Div: 'div',
            Component: 'div',
            Page: 'div',
            Block: 'div',
          },
        }),
        style(),
      ],
      config: [config()], // 这个其实是用来生成.umirc.ts文件的，目前暂时没有用
      router: [router()],
      packageJSON: [packageJSON()],
    },
    postProcessors: [prettier()],
  });
}
