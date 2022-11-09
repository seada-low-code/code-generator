/**
 * 解析器是对输入的固定格式数据做拆解，使其符合引擎后续步骤预期，完成统一处理逻辑的步骤。
 * 本解析器面向的是标准 schema 协议。
 */
import changeCase from 'change-case';
import {
  UtilItem,
  NodeDataType,
  NodeSchema,
  ContainerSchema,
  ProjectSchema,
  PropsMap,
  NodeData,
  NpmInfo,
  ProCodeComponentType,
} from '@alilc/lowcode-types';
import {
  IPageMeta,
  CodeGeneratorError,
  CompatibilityError,
  DependencyType,
  IContainerInfo,
  IDependency,
  IExternalDependency,
  IInternalDependency,
  InternalDependencyType,
  IParseResult,
  ISchemaParser,
  INpmPackage,
  IRouterInfo,
} from '../types';

import { SUPPORT_SCHEMA_VERSION_LIST } from '../const';

import { getErrorMessage } from '../utils/errors';
import { handleSubNodes } from '../utils/schema';
import { uniqueArray } from '../utils/common';
import { componentAnalyzer } from '../analyzer/componentAnalyzer';
import { ensureValidClassName } from '../utils/validate';

const defaultContainer: IContainerInfo = {
  containerType: 'Component',
  componentName: 'Component',
  moduleName: 'Index',
  fileName: 'Index',
  css: '',
  props: {},
};

/**
 * 获取根组件名
 * @param typeName
 * @param maps
 * @returns
 */
function getRootComponentName(typeName: string, maps: Record<string, IExternalDependency>): string {
  if (maps[typeName]) {
    const rec = maps[typeName];
    if (rec.destructuring) {
      return rec.componentName || typeName;
    }

    const peerName = Object.keys(maps).find((depName: string) => {
      const depInfo = maps[depName];
      return (
        depName !== typeName &&
        !depInfo.destructuring &&
        depInfo.package === rec.package &&
        depInfo.version === rec.version &&
        depInfo.main === rec.main &&
        depInfo.exportName === rec.exportName &&
        depInfo.subName === rec.subName
      );
    });

    return peerName || typeName;
  }
  return typeName;
}

/**
 * 处理children节点
 * @param schema 子节点的schema？
 */
function processChildren(schema: NodeSchema): void {
  if (schema.props) {
    if (Array.isArray(schema.props)) {
      // FIXME: is array type props description，属性描述是一个数组
    } else {
      const nodeProps = schema.props as PropsMap;
      if (nodeProps.children) {
        if (!schema.children) {
          // eslint-disable-next-line no-param-reassign
          schema.children = nodeProps.children as NodeDataType; // NodeData | NodeData[]
        } else {
          let _children: NodeData[] = [];

          if (Array.isArray(schema.children)) {
            _children = _children.concat(schema.children);
          } else {
            _children.push(schema.children);
          }

          if (Array.isArray(nodeProps.children)) {
            _children = _children.concat(nodeProps.children as NodeData[]);
          } else {
            _children.push(nodeProps.children as NodeData);
          }

          // eslint-disable-next-line no-param-reassign
          schema.children = _children;
        }
        delete nodeProps.children;
      }
    }
  }
}

export class SchemaParser implements ISchemaParser {
  validate(schema: ProjectSchema): boolean {
    if (SUPPORT_SCHEMA_VERSION_LIST.indexOf(schema.version) < 0) {
      throw new CompatibilityError(`Not support schema with version [${schema.version}]`);
    }

    return true;
  }

  parse(schemaSrc: ProjectSchema | string): IParseResult {
    // TODO: collect utils depends in JSExpression
    const compDeps: Record<string, IExternalDependency> = {};
    const internalDeps: Record<string, IInternalDependency> = {};
    let utilsDeps: IExternalDependency[] = [];

    const schema = this.decodeSchema(schemaSrc);

    // 解析三方组件依赖
    schema.componentsMap.forEach((info) => {
      if (info.componentName) {
        const {
          exportName,
          version,
          destructuring,
          package: npmPackage,
        } = info as ProCodeComponentType;
        compDeps[info.componentName] = {
          ...info,
          dependencyType: DependencyType.External,
          componentName: info.componentName,
          exportName: exportName ?? info.componentName,
          version: version || '*',
          destructuring: destructuring ?? false,
          package: npmPackage,
        };
      }
    });

    let containers: IContainerInfo[];
    // Test if this is a lowcode component without container
    if (schema.componentsTree.length > 0) {
      const firstRoot: ContainerSchema = schema.componentsTree[0] as ContainerSchema;

      if (!('fileName' in firstRoot) || !firstRoot.fileName) {
        // 整个 schema 描述一个容器，且无根节点定义
        const container: IContainerInfo = {
          ...firstRoot,
          ...defaultContainer,
          props: firstRoot.props || defaultContainer.props,
          css: firstRoot.css || defaultContainer.css,
          moduleName: (firstRoot as IContainerInfo).moduleName || defaultContainer.moduleName,
          children: schema.componentsTree as NodeSchema[],
        };
        containers = [container];
      } else {
        // 普通带 1 到多个容器的 schema
        containers = schema.componentsTree.map((n) => {
          const subRoot = n as ContainerSchema;
          const container: IContainerInfo = {
            ...subRoot,
            componentName: getRootComponentName(subRoot.componentName, compDeps),
            containerType: subRoot.componentName,
            moduleName: ensureValidClassName(changeCase.pascalCase(subRoot.fileName)),
          };
          return container;
        });
      }
    } else {
      throw new CodeGeneratorError("Can't find anything to generate.");
    }

    // 分析引用能力的依赖
    containers = containers.map((con) => ({
      ...con,
      analyzeResult: componentAnalyzer(con as ContainerSchema),
    }));

    // 建立所有容器的内部依赖索引
    containers.forEach((container) => {
      let type; // 容器类型
      switch (container.containerType) {
        case 'Page':
          type = InternalDependencyType.PAGE;
          break;
        case 'Block':
          type = InternalDependencyType.BLOCK;
          break;
        default:
          type = InternalDependencyType.COMPONENT;
          break;
      }

      const dep: IInternalDependency = {
        type,
        moduleName: container.moduleName,
        destructuring: false,
        exportName: container.moduleName,
        dependencyType: DependencyType.Internal,
      };

      internalDeps[dep.moduleName] = dep;
    });
    // 容器的依赖
    const containersDeps = ([] as IDependency[]).concat(...containers.map((c) => c.deps || []));
    // TODO: 不应该在出码部分解决？
    // 处理 children 写在了 props 里的情况
    containers.forEach((container) => {
      if (container.children) {
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        handleSubNodes<void>(
          container.children,
          {
            node: (i: NodeSchema) => processChildren(i), // 处理容器的children节点
          },
          {
            rerun: true,
          },
        );
      }
    });

    // 分析容器内部组件依赖
    containers.forEach((container) => {
      const depNames = this.getComponentNames(container);
      // eslint-disable-next-line no-param-reassign
      container.deps = uniqueArray<string>(depNames, (i: string) => i)
        .map((depName) => internalDeps[depName] || compDeps[depName])
        .filter(Boolean);
      // container.deps = Object.keys(compDeps).map((depName) => compDeps[depName]);
    });

    // 一个页面容器生成一条路由记录
    const routes: IRouterInfo['routes'] = containers
      .filter((container) => container.containerType === 'Page')
      .map((page) => {
        const meta = page.meta as IPageMeta;
        if (meta) {
          return {
            path: meta.router || `/${page.fileName}`, // 如果无法找到页面路由信息，则用 fileName 做兜底
            fileName: page.fileName,
            componentName: page.moduleName,
            title: meta.title || page.moduleName,
          };
        }

        return {
          path: '',
          fileName: page.fileName,
          componentName: page.moduleName, // 用moduleName赋值给组件名，包括页面组件和业务组件
        };
      });

    const routerDeps = routes
      .map((r) => internalDeps[r.componentName] || compDeps[r.componentName])
      .filter((dep) => !!dep);

    // 分析 Utils 依赖
    let utils: UtilItem[];
    if (schema.utils) {
      utils = schema.utils;
      utilsDeps = schema.utils
        .filter(
          (u): u is { name: string; type: 'npm' | 'tnpm'; content: NpmInfo } =>
            u.type !== 'function',
        )
        .map(
          (u): IExternalDependency => ({
            ...u.content,
            componentName: u.name,
            version: u.content.version || '*',
            destructuring: u.content.destructuring ?? false,
            exportName: u.content.exportName ?? u.name,
          }),
        );
    } else {
      utils = [];
    }

    // 分析项目 npm 依赖
    let npms: INpmPackage[] = [];
    containers.forEach((con) => {
      const p = (con.deps || [])
        .map((dep) => {
          return dep.dependencyType === DependencyType.External ? dep : null;
        })
        .filter((dep) => dep !== null);
      const npmInfos: INpmPackage[] = p.filter(Boolean).map((i) => ({
        package: (i as IExternalDependency).package,
        version: (i as IExternalDependency).version,
      }));
      npms.push(...npmInfos);
    });

    npms.push(
      ...utilsDeps.map((utilsDep) => ({
        package: utilsDep.package,
        version: utilsDep.version,
      })),
    );

    npms = uniqueArray<INpmPackage>(npms, (i) => i.package).filter(Boolean);

    return {
      containers,
      globalUtils: {
        utils,
        deps: utilsDeps,
      },
      globalI18n: schema.i18n,
      globalRouter: {
        routes,
        deps: routerDeps,
      },
      project: {
        css: schema.css,
        constants: schema.constants,
        config: schema.config || {},
        meta: schema.meta || {},
        i18n: schema.i18n,
        containersDeps,
        utilsDeps,
        packages: npms || [],
        dataSourcesTypes: this.collectDataSourcesTypes(schema),
      },
    };
  }

  getComponentNames(children: NodeDataType): string[] {
    return handleSubNodes<string>(
      children,
      {
        node: (i: NodeSchema) => i.componentName,
      },
      {
        rerun: true,
      },
    );
  }

  decodeSchema(schemaSrc: string | ProjectSchema): ProjectSchema {
    let schema: ProjectSchema;
    if (typeof schemaSrc === 'string') {
      try {
        schema = JSON.parse(schemaSrc);
      } catch (error) {
        throw new CodeGeneratorError(
          `Parse schema failed: ${getErrorMessage(error) || 'unknown reason'}`,
        );
      }
    } else {
      schema = schemaSrc;
    }
    return schema;
  }

  private collectDataSourcesTypes(schema: ProjectSchema): string[] {
    const dataSourcesTypes = new Set<string>();

    // 数据源的默认类型为 fetch
    const defaultDataSourceType = 'fetch';

    // 收集应用级别的数据源
    schema.dataSource?.list?.forEach((ds) => {
      dataSourcesTypes.add(ds.type || defaultDataSourceType);
    });

    // 收集容器级别的数据源（页面/组件/区块）
    schema.componentsTree.forEach((rootNode) => {
      rootNode.dataSource?.list?.forEach((ds) => {
        dataSourcesTypes.add(ds.type || defaultDataSourceType);
      });
    });

    return Array.from(dataSourcesTypes.values());
  }
}

export default SchemaParser;
