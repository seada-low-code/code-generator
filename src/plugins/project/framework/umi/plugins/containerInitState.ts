import { FC_DEFINE_CHUNK_NAME } from '../../../../../const';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  FileType,
  IContainerInfo,
  ChunkType,
} from '../../../../../types';
import { generateCompositeType } from '../../../../../utils/compositeType';
import { Scope } from '../../../../../utils/Scope';

export interface IPluginConfig {
  fileType: string;
  implementType: 'inConstructor' | 'insMember' | 'hooks';
}

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const cfg: IPluginConfig = {
    fileType: FileType.TSX,
    implementType: 'hooks', // hooks去实现状态初始化
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;
    const scope = Scope.createRootScope();
    // state就是一个对象，值支持表达式
    const state = ir.state || {};
    const stateNames = Object.keys(state);
    if (!stateNames.length) return next;
    // 字符串数组
    const fields = stateNames.map<string>((stateName) => {
      const value = generateCompositeType(state[stateName], scope); // 将值转化为字符类型
      return `${stateName}: ${value}`;
    });

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: cfg.fileType,
      name: FC_DEFINE_CHUNK_NAME.UseState,
      content: `const [state, setState] = useState({${fields.join(',')}});`,
      linkAfter: [FC_DEFINE_CHUNK_NAME.Start],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
