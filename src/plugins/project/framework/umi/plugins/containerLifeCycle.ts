import { isJSExpression, isJSFunction } from '@alilc/lowcode-types';
import { FC_DEFINE_CHUNK_NAME } from '../../../../../const';
import { generateFunction } from '../../../../../utils/jsExpression';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  IContainerInfo,
  ICodeChunk,
  ChunkType,
  FileType,
} from './../../../../../types';

export interface IPluginConfig {
  fileType: string;
  exportNameMapping: Record<string, string>;
  normalizeNameMapping: Record<string, string>;
}

const pluginFactory: BuilderComponentPluginFactory<IPluginConfig> = (config) => {
  const cfg: IPluginConfig = {
    fileType: FileType.TSX,
    exportNameMapping: {},
    normalizeNameMapping: {},
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const ir = next.ir as IContainerInfo;
    const { lifeCycles } = ir;
    const lifeCycleNames = Object.keys(lifeCycles || {});

    if (!lifeCycles || !lifeCycleNames.length) return next;

    const chunks = lifeCycleNames.map<ICodeChunk | null>((lifeCycleName) => {
      // 过滤非法数据
      if (!isJSFunction(lifeCycles[lifeCycleName]) && !isJSExpression(lifeCycles[lifeCycleName])) {
        return null;
      }
      // 对React的生命周期代码进行转换，定义的生命周期可查看文档 https://lowcode-engine.cn/lowcode#2316-componentlifecycles-%E5%AF%B9%E8%B1%A1%E6%8F%8F%E8%BF%B0
      // 硬编码来转换吧，也没几个值
      if (lifeCycleName === 'constructor') {
        // 初始化渲染时执行，常用于设置state值
        return {
          type: ChunkType.STRING,
          fileType: cfg.fileType,
          name: '',
          content: '',
          linkAfter: [],
        };
      }
      if (lifeCycleName === 'componentDidMount') {
        // 组件已加载，生成一个useEffect来将代码写入
        next.chunks.push({
          type: ChunkType.STRING,
          fileType: FileType.TSX,
          name: FC_DEFINE_CHUNK_NAME.DidMount,
          content: `useEffect(() => {
            ${generateFunction(lifeCycles[lifeCycleName], { isBlock: true })}
          }, [])
          `,
          linkAfter: [FC_DEFINE_CHUNK_NAME.UseEffectEnd],
        });
      }

      return {
        type: ChunkType.STRING,
        fileType: cfg.fileType,
        name: '',
        content: '',
        linkAfter: [],
      };
    });
    next.chunks.push(...chunks.filter((x): x is ICodeChunk => x !== null));
    return next;
  };
  return plugin;
};

export default pluginFactory;
