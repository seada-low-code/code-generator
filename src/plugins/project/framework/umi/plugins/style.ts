import { COMMON_CHUNK_NAME } from './../../../../../const/generator';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  ChunkType,
  IContainerInfo,
  FileType,
} from './../../../../../types';

export interface IPluginConfig {
  fileType: string;
  moduleFileType: string;
}

const pluginFactory: BuilderComponentPluginFactory<IPluginConfig> = (config) => {
  const cfg: IPluginConfig = {
    fileType: FileType.LESS,
    moduleFileType: FileType.TSX,
    ...(config || {}),
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: cfg.fileType,
      name: COMMON_CHUNK_NAME.StyleCssContent,
      content: ir.css,
      linkAfter: [COMMON_CHUNK_NAME.StyleDepsImport],
    });

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: cfg.moduleFileType,
      name: COMMON_CHUNK_NAME.InternalDepsImport,
      content: `import './index.${cfg.fileType}'`,
      linkAfter: [COMMON_CHUNK_NAME.ExternalDepsImport],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
