import { I18nMap, UtilsMap, ContainerSchema, JSONObject } from '@alilc/lowcode-types';

import { IDependency, INpmPackage } from './deps';
import { ICompAnalyzeResult } from './analyze';

export interface IParseResult {
  containers: IContainerInfo[]; // 这个是容器，会解析为多个容器，每个容器包含自己的schema描述，依赖描述
  globalUtils?: IUtilInfo;
  globalI18n?: I18nMap;
  globalRouter?: IRouterInfo;
  project?: IProjectInfo;
}

export interface IWithDependency {
  deps?: IDependency[];
}

export interface IContainerInfo extends ContainerSchema, IWithDependency {
  containerType: string;
  moduleName: string;
  analyzeResult?: ICompAnalyzeResult;
}

export interface IUtilInfo extends IWithDependency {
  utils: UtilsMap;
}

export interface IRouterInfo extends IWithDependency {
  routes: Array<{
    path: string;
    fileName: string;
    componentName: string;
    redirect?: string;
    title?: string;
  }>;
}

export interface IProjectInfo {
  css?: string;
  containersDeps?: IDependency[];
  utilsDeps?: IDependency[];
  constants?: JSONObject;
  i18n?: I18nMap;
  packages: INpmPackage[];
  meta?: { name?: string; title?: string } | Record<string, any>;
  config?: Record<string, any>;
  dataSourcesTypes?: string[];
}

export interface IPageMeta {
  router?: string;
  title?: string;
}

/**
 * From meta
 * page title
 * router
 * spmb
 *
 * Utils
 *
 * constants
 *
 * i18n
 *
 * components
 *
 * pages
 *
 * layout
 */
