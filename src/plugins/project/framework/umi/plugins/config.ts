import { COMMON_CHUNK_NAME } from '../../../../../const';
import {
  BuilderComponentPlugin,
  BuilderComponentPluginFactory,
  ChunkType,
  FileType,
  ICodeStruct,
} from './../../../../../types';

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    const next: ICodeStruct = {
      ...pre,
    };

    // 外部依赖引入
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TS,
      name: COMMON_CHUNK_NAME.ExternalDepsImport,
      content: `import { defineConfig } from '@umijs/max';`,
      linkAfter: [],
    });

    // 内部依赖引入路由配置
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TS,
      name: COMMON_CHUNK_NAME.InternalDepsImport,
      content: `import routes from './config/routes';`,
      linkAfter: [COMMON_CHUNK_NAME.ExternalDepsImport],
    });

    // 写入.umirc.ts主要内容
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TS,
      name: COMMON_CHUNK_NAME.FileExport,
      content: `export default defineConfig({
        antd: {},
        access: {},
        model: {},
        initialState: {},
        request: {},
        layout: {
          title: '@umijs/max',
        },
        routes,
        npmClient: 'pnpm',
      })`,
      linkAfter: [COMMON_CHUNK_NAME.ExternalDepsImport, COMMON_CHUNK_NAME.InternalDepsImport],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
