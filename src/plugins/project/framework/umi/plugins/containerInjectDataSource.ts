import changeCase from 'change-case';
import { COMMON_CHUNK_NAME, FC_DEFINE_CHUNK_NAME } from './../../../../../const/generator';
import { isContainerSchema } from '../../../../../utils/schema';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  FileType,
  ChunkType,
  IScope,
} from './../../../../../types';
import { CompositeValue, isJSFunction, JSExpression, isJSExpression } from '@alilc/lowcode-types';
import { generateCompositeType } from '../../../../../utils/compositeType';
import { Scope } from '../../../../../utils/Scope';

export interface IPluginConfig {
  fileType?: string;
  dataSourceConfig?: {
    engineVersion?: string; // 数据源引擎版本
    enginePackage?: string; // 数据源引擎包名
    handlersVersion?: {
      // 数据源handlers版本
      [key: string]: string;
    };
    handlersPackages?: {
      [key: string]: string;
    };
  };
}

function wrapAsFunction(value: CompositeValue, scope: IScope): CompositeValue {
  if (isJSExpression(value) || isJSFunction(value)) {
    return {
      type: 'JSExpression',
      value: `function(){ return ((${value.value}))}`,
    };
  }

  return {
    type: 'JSExpression',
    value: `function(){return((${generateCompositeType(value, scope)}))}`,
  };
}

const pluginFactory: BuilderComponentPluginFactory<IPluginConfig> = (config) => {
  const cfg: IPluginConfig = {
    ...(config || {}),
    fileType: FileType.TSX,
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };
    // 创建一个作用域对象
    const scope = Scope.createRootScope();
    // 如果是容器，则从中取出数据源配置
    const dataSource = isContainerSchema(pre.ir) ? pre.ir.dataSource : null;
    const dataSourceList = dataSource?.list || [];
    const dataSourceEngineOptions: Record<string, any> = { runtimeConfig: true };
    if (dataSourceList.length > 0) {
      // 将数据源以及对应的数据源handler关联起来的桥梁，它的key对应的数据源DataSourceConfig的type，比如fetch、mtop等，每个类型的数据源在真正使用的时候会调用对应的type-handler，并将当前的参数和上下文带给对应的handler
      const requestHandlersMap: Record<string, JSExpression> = {};
      dataSourceList.forEach((item) => {
        // 数据源请求类型，一个类型对应一个handler，这个handler要从外部包引入
        const dsType = item.type || 'fetch';
        if (dsType in requestHandlersMap) return;
        // dsType转换为大驼峰再写入
        const handlerFactoryExportName = `create${changeCase.pascal(dsType)}RequestHandler`;
        requestHandlersMap[dsType] = {
          type: 'JSExpression',
          value:
            handlerFactoryExportName + (dsType === 'urlParams' ? '(window.location.search)' : '()'),
        };
        // 写入handler依赖语句
        const handlerPkgName =
          cfg.dataSourceConfig?.handlersPackages?.[dsType] ||
          `@alilc/lowcode-datasource-${changeCase.kebab(dsType)}-handler`;
        next.chunks.push({
          type: ChunkType.STRING,
          fileType: FileType.TSX,
          name: COMMON_CHUNK_NAME.ExternalDepsImport,
          content: `import { ${handlerFactoryExportName} } from '${handlerPkgName}';`,
          linkAfter: [],
        });
      });
      Object.assign(dataSourceEngineOptions, { requestHandlersMap });
      // 引入数据源引擎依赖
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.TSX,
        name: COMMON_CHUNK_NAME.ExternalDepsImport,
        content: `import { create as createDataSourceEngine } from '@alilc/lowcode-datasource-engine/runtime';`,
        linkAfter: [],
      });
      // 初始化数据源引擎相关变量和方法
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.TSX,
        name: FC_DEFINE_CHUNK_NAME.Constant,
        // 初始化数据源引擎实例，dataSourceConfig是将上面的dataSource转换为RuntimeDataSourceConfig对象
        content: `
          const dataSourceConfig = ${generateCompositeType(
            {
              ...dataSource,
              list: [
                ...dataSourceList.map((item) => {
                  return {
                    ...item,
                    isInit: wrapAsFunction(item.isInit, scope),
                    options: wrapAsFunction(item.options, scope),
                  };
                }),
              ],
            },
            scope,
            {
              handlers: {},
            },
          )};
          const dataSourceEngine = createDataSourceEngine(dataSourceConfig);
        `,
        linkAfter: [
          COMMON_CHUNK_NAME.ExternalDepsImport,
          COMMON_CHUNK_NAME.InternalDepsImport,
          FC_DEFINE_CHUNK_NAME.Start,
        ],
      });
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.TSX,
        name: FC_DEFINE_CHUNK_NAME.UseEffectStart,
        content: `useEffect(() => {`,
        // 放在useState后面
        linkAfter: [
          FC_DEFINE_CHUNK_NAME.Start,
          FC_DEFINE_CHUNK_NAME.UseState,
          FC_DEFINE_CHUNK_NAME.UseRef,
        ],
      });
      // 应该在useEffect中调用一次数据源引擎实例的reloadDataSource()方法
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.TSX,
        name: FC_DEFINE_CHUNK_NAME.UseEffectContent,
        content: 'dataSourceEngine.reloadDataSource();',
        linkAfter: [FC_DEFINE_CHUNK_NAME.UseEffectStart],
      });
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.TSX,
        name: FC_DEFINE_CHUNK_NAME.UseEffectEnd,
        content: `}, [])`,
        linkAfter: [FC_DEFINE_CHUNK_NAME.UseEffectStart, FC_DEFINE_CHUNK_NAME.UseEffectContent],
      });
    }
    return next;
  };
  return plugin;
};

export default pluginFactory;
