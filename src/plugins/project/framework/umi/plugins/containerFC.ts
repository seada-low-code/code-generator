import { COMMON_CHUNK_NAME, FC_DEFINE_CHUNK_NAME } from '../../../../../const';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  IContainerInfo,
  ChunkType,
  FileType,
} from './../../../../../types';

/**
 * 生成 function component 整体框架
 */
const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;
    // 页面组件名
    const functionComponentName = 'MyPage';
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: FC_DEFINE_CHUNK_NAME.Start, // 开始function component
      content: `const ${functionComponentName}: React.FC = () => {`,
      linkAfter: [
        COMMON_CHUNK_NAME.ExternalDepsImport,
        COMMON_CHUNK_NAME.InternalDepsImport,
        COMMON_CHUNK_NAME.ImportAliasDefine,
        COMMON_CHUNK_NAME.FileVarDefine,
        COMMON_CHUNK_NAME.FileUtilDefine,
        COMMON_CHUNK_NAME.CustomContent,
      ],
    });

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: FC_DEFINE_CHUNK_NAME.End, // 结束function component
      content: '}',
      linkAfter: [
        FC_DEFINE_CHUNK_NAME.Start,
        FC_DEFINE_CHUNK_NAME.UseState,
        FC_DEFINE_CHUNK_NAME.UseRef,
        FC_DEFINE_CHUNK_NAME.ReturnJsx,
      ],
    });

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: COMMON_CHUNK_NAME.FileExport,
      content: `export default ${functionComponentName};`,
      linkAfter: [
        COMMON_CHUNK_NAME.ExternalDepsImport,
        COMMON_CHUNK_NAME.InternalDepsImport,
        COMMON_CHUNK_NAME.ImportAliasDefine,
        COMMON_CHUNK_NAME.FileVarDefine,
        COMMON_CHUNK_NAME.FileUtilDefine,
        FC_DEFINE_CHUNK_NAME.End,
      ],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
