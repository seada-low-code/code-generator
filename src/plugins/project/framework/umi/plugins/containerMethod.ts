import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  IContainerInfo,
  FileType,
  ICodeChunk,
  ChunkType,
} from './../../../../../types';
import { generateFunction } from '../../../../../utils/jsExpression';
import { FC_DEFINE_CHUNK_NAME } from '../../../../../const';

export interface IPluginConfig {
  fileType: string;
}

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const cfg: IPluginConfig = {
    fileType: FileType.TSX,
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;

    if (!ir.methods) {
      return next;
    }
    // 对象，key为方法名，value为 JSExpression | JSFunction
    const { methods } = ir;
    const chunks = Object.keys(methods).map<ICodeChunk>((methodName) => {
      return {
        type: ChunkType.STRING,
        fileType: cfg.fileType,
        name: FC_DEFINE_CHUNK_NAME.Methods,
        content: generateFunction(methods[methodName], { name: methodName }),
        // 放到useEffect之后
        linkAfter: [FC_DEFINE_CHUNK_NAME.DidMount],
      };
    });
    next.chunks.push(...chunks);

    return next;
  };
  return plugin;
};

export default pluginFactory;
