import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  ChunkType,
  FileType,
  IContainerInfo,
} from './../../../../../types';
import { COMMON_CHUNK_NAME } from './../../../../../const/generator';

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;
    const deps: string[] = [];
    if (Object.keys(ir.state || {}).length) {
      // 需要引入useState
      deps.push('useState');
    }
    // TODO: 添加判断条件按需引入useEffect等其他依赖
    deps.push('useEffect');
    deps.push('useRef');
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: COMMON_CHUNK_NAME.ExternalDepsImport,
      content: `import React${
        deps.length > 0 ? ', { ' + deps.join(', ') + ' } ' : ' '
      }from \'react\';`,
      linkAfter: [],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
