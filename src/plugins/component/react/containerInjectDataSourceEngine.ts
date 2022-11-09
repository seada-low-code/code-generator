/* eslint-disable @typescript-eslint/indent */

import {
  CompositeValue,
  JSExpression,
  InterpretDataSourceConfig,
  isJSExpression,
  isJSFunction,
} from '@alilc/lowcode-types';
import changeCase from 'change-case';

import {
  CLASS_DEFINE_CHUNK_NAME,
  COMMON_CHUNK_NAME,
  DEFAULT_LINK_AFTER,
} from '../../../const/generator';
import { Scope } from '../../../utils/Scope';

import {
  BuilderComponentPlugin,
  BuilderComponentPluginFactory,
  ChunkType,
  FileType,
  ICodeStruct,
  IScope,
} from '../../../types';

import { generateCompositeType } from '../../../utils/compositeType';
import { parseExpressionConvertThis2Context } from '../../../utils/expressionParser';
import { isContainerSchema } from '../../../utils/schema';
import { REACT_CHUNK_NAME } from './const';

export interface PluginConfig {
  fileType?: string;
  /**
   * 数据源配置
   */
  datasourceConfig?: {
    /** 数据源引擎的版本 */
    engineVersion?: string;

    /** 数据源引擎的包名 */
    enginePackage?: string;

    /** 数据源 handlers 的版本 */
    handlersVersion?: {
      [key: string]: string;
    };

    /** 数据源 handlers 的包名 */
    handlersPackages?: {
      [key: string]: string;
    };
  };
}

const pluginFactory: BuilderComponentPluginFactory<PluginConfig> = (config?) => {
  const cfg = {
    ...config,
    fileType: config?.fileType || FileType.JSX,
  };

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    const next: ICodeStruct = {
      ...pre,
    };
    // 创建一个作用域对象
    const scope = Scope.createRootScope();
    // 如果是容器schema，则从中取出datasource配置
    const dataSourceConfig = isContainerSchema(pre.ir) ? pre.ir.dataSource : null;
    const dataSourceItems: InterpretDataSourceConfig[] =
      (dataSourceConfig && dataSourceConfig.list) || [];
    const dataSourceEngineOptions = { runtimeConfig: true };
    if (dataSourceItems.length > 0) {
      // 一个类型对应一个handler
      const requestHandlersMap: Record<string, JSExpression> = {};

      dataSourceItems.forEach((ds) => {
        // 数据源请求类型，默认为fetch
        const dsType = ds.type || 'fetch';
        // 啥意思？请求类型不为自定义并且？？？
        if (!(dsType in requestHandlersMap) && dsType !== 'custom') {
          const handlerFactoryName = `__$$create${changeCase.pascal(dsType)}RequestHandler`;
          // 一个对象，key为请求类型，value为一个JSExpression对象，对应一个handler初始化的函数调用
          requestHandlersMap[dsType] = {
            type: 'JSExpression',
            value:
              handlerFactoryName + (dsType === 'urlParams' ? '(window.location.search)' : '()'),
          };

          const handlerFactoryExportName = `create${changeCase.pascal(dsType)}Handler`;
          const handlerPkgName =
            cfg.datasourceConfig?.handlersPackages?.[dsType] ||
            `@alilc/lowcode-datasource-${changeCase.kebab(dsType)}-handler`; // kebab是转小写并且横线分隔，这种转换除非是约定好的，否则真的很不严谨
          // 写入依赖语句
          next.chunks.push({
            type: ChunkType.STRING,
            fileType: FileType.JSX,
            name: COMMON_CHUNK_NAME.ExternalDepsImport,
            content: `
              import { ${handlerFactoryExportName} as ${handlerFactoryName} } from '${handlerPkgName}';
            `,
            linkAfter: [],
          });
        }
      });

      Object.assign(dataSourceEngineOptions, { requestHandlersMap });
      // 引入数据源引擎依赖
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: FileType.JSX,
        name: COMMON_CHUNK_NAME.ExternalDepsImport,
        content: `
          import { create as __$$createDataSourceEngine } from '@alilc/lowcode-datasource-engine/runtime';
        `,
        linkAfter: [],
      });
      // 初始化数据源相关变量和方法
      next.chunks.push({
        type: ChunkType.STRING,
        fileType: cfg.fileType,
        name: CLASS_DEFINE_CHUNK_NAME.InsVar,
        content: `
          _dataSourceConfig = this._defineDataSourceConfig();
          _dataSourceEngine = __$$createDataSourceEngine(
            this._dataSourceConfig,
            this,
            ${generateCompositeType(dataSourceEngineOptions, scope)}
          );

          get dataSourceMap() {
            return this._dataSourceEngine.dataSourceMap || {};
          }

          reloadDataSource = async () => {
            await this._dataSourceEngine.reloadDataSource();
          }

          `,
        linkAfter: [...DEFAULT_LINK_AFTER[CLASS_DEFINE_CHUNK_NAME.InsVar]],
      });

      next.chunks.unshift({
        type: ChunkType.STRING,
        fileType: cfg.fileType,
        name: REACT_CHUNK_NAME.ClassDidMountContent,
        content: `
          this._dataSourceEngine.reloadDataSource();
        `,
        linkAfter: [REACT_CHUNK_NAME.ClassDidMountStart],
      });

      next.chunks.push({
        type: ChunkType.STRING,
        fileType: cfg.fileType,
        name: CLASS_DEFINE_CHUNK_NAME.InsMethod,
        content: `
  _defineDataSourceConfig() {
    const _this = this;
    return (${generateCompositeType(
      {
        ...dataSourceConfig,
        list: [
          ...dataSourceItems.map((item) => ({
            ...item,
            isInit: wrapAsFunction(item.isInit, scope),
            options: wrapAsFunction(item.options, scope),
          })),
        ],
      },
      scope,
      {
        handlers: {
          function: (jsFunc) => parseExpressionConvertThis2Context(jsFunc.value, '_this'),
          expression: (jsExpr) => parseExpressionConvertThis2Context(jsExpr.value, '_this'),
        },
      },
    )});
  }
        `,
        linkAfter: [...DEFAULT_LINK_AFTER[CLASS_DEFINE_CHUNK_NAME.InsMethod]],
      });
    }

    return next;
  };
  return plugin;
};

export default pluginFactory;

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
