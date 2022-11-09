import { FC_DEFINE_CHUNK_NAME } from '../../../../../const';
import {
  BuilderComponentPlugin,
  BuilderComponentPluginFactory,
  ChunkType,
  FileType,
  ICodeStruct,
  IContainerInfo,
} from './../../../../../types';

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    const next: ICodeStruct = {
      ...pre,
    };
    const ir = next.ir as IContainerInfo;
    const refArr = ir.analyzeResult?.refArr || [];
    if (!refArr.length) return next;
    // 遍历refArr，生成useRef的代码
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: FC_DEFINE_CHUNK_NAME.UseRef,
      content: refArr
        .map((refName) => {
          return `const ${refName} = useRef(null);`;
        })
        .join('\n'),
      linkAfter: [FC_DEFINE_CHUNK_NAME.UseState],
    });
    return next;
  };
  return plugin;
};

export default pluginFactory;
