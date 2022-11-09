import { PackageJSON } from '@alilc/lowcode-types';
import { COMMON_CHUNK_NAME } from '../../../../../const';
import { buildDataSourceDependencies } from '../../../../../utils/dataSource';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  IProjectInfo,
  ChunkType,
  FileType,
} from './../../../../../types';

export interface IPluginConfig {
  dataSourceConfig?: {
    engineVersion?: string;
    enginePackage?: string;
    handlersVersion?: {
      [key: string]: string;
    };
  };
  packageName?: string;
  packageVersion?: string;
}

const pluginFactory: BuilderComponentPluginFactory<IPluginConfig> = (cfg) => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    const next: ICodeStruct = {
      ...pre,
    };
    const ir = next.ir as IProjectInfo;
    const { packages } = ir;
    const packageJson: PackageJSON = {
      name: 'umi-demo',
      version: '1.0.0',
      dependencies: {
        '@ant-design/icons': '^4.7.0',
        '@ant-design/pro-components': '^1.1.3',
        '@umijs/max': '^4.0.13',
        antd: '^4.20.7',
        // 添加一些数据源相关的依赖
        ...buildDataSourceDependencies(ir, cfg?.dataSourceConfig),
      },
      devDependencies: {
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        husky: '^8.0.1',
        'lint-staged': '^13.0.3',
        prettier: '^2.7.1',
        'prettier-plugin-organize-imports': '^2',
        'prettier-plugin-packagejson': '^2',
        typescript: '^4.1.2',
      },
      scripts: {
        dev: 'max dev',
        build: 'max build',
        format: 'prettier --cache --write .',
        prepare: 'husky install',
        postinstall: 'max setup',
        setup: 'max setup',
        start: 'npm run dev',
      },
      private: true,
    };
    // 将协议里面的包依赖写到dependencies里面
    packages.forEach((item) => {
      // 因为静态写了antd的依赖，所以如果遇到antd的依赖直接跳过
      if (item.package === 'antd') return;
      packageJson.dependencies[item.package] = item.version;
    });
    next.chunks.push({
      type: ChunkType.JSON,
      fileType: FileType.JSON,
      name: COMMON_CHUNK_NAME.FileMainContent,
      content: packageJson,
      linkAfter: [],
    });
    return next;
  };
  return plugin;
};

export default pluginFactory;
