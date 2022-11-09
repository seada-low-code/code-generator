import { ResultDir, ResultFile, ProjectSchema } from '@alilc/lowcode-types';

import {
  IModuleBuilder,
  IParseResult,
  IProjectBuilder,
  IProjectPlugins,
  IProjectTemplate,
  ISchemaParser,
  PostProcessor,
} from '../types';

import { SchemaParser } from '../parser/SchemaParser';
import { createResultDir, addDirectory, addFile } from '../utils/resultHelper';

import { createModuleBuilder } from './ModuleBuilder';
import { ProjectPreProcessor, ProjectPostProcessor, IContextData } from '../types/core';
import { CodeGeneratorError } from '../types/error';

interface IModuleInfo {
  moduleName?: string;
  path: string[];
  files: ResultFile[];
}

export interface ProjectBuilderInitOptions {
  /** 项目模板 */
  template: IProjectTemplate;
  /** 项目插件 */
  plugins: IProjectPlugins;
  /** 模块后置处理器 */
  postProcessors: PostProcessor[];
  /** Schema 解析器 */
  schemaParser?: ISchemaParser;
  /** 项目级别的前置处理器 */
  projectPreProcessors?: ProjectPreProcessor[];
  /** 项目级别的后置处理器 */
  projectPostProcessors?: ProjectPostProcessor[];
  /** 是否处于严格模式 */
  inStrictMode?: boolean;
  /** 一些额外的上下文数据 */
  extraContextData?: Record<string, unknown>;
}

/**
 * 项目构建器类，实现的 IProjectBuilder 接口也没啥好看的，里面就定义了一个 generateProject 方法
 */
export class ProjectBuilder implements IProjectBuilder {
  /** 项目模板 */
  private template: IProjectTemplate;

  /** 项目插件 */
  private plugins: IProjectPlugins;

  /** 模块后置处理器 */
  private postProcessors: PostProcessor[];

  /** Schema 解析器 */
  private schemaParser: ISchemaParser;

  /** 项目级别的前置处理器 */
  private projectPreProcessors: ProjectPreProcessor[];

  /** 项目级别的后置处理器 */
  private projectPostProcessors: ProjectPostProcessor[];

  /** 是否处于严格模式 */
  public readonly inStrictMode: boolean;

  /** 一些额外的上下文数据 */
  public readonly extraContextData: IContextData;
  // 感觉可以先看template，再看plugin
  constructor({
    template,
    plugins,
    postProcessors,
    schemaParser = new SchemaParser(), // 可以自定义schema解析器，也内置了一个默认的解析器，通常来说默认的就足够了？
    projectPreProcessors = [],
    projectPostProcessors = [],
    inStrictMode = false,
    extraContextData = {},
  }: ProjectBuilderInitOptions) {
    this.template = template;
    this.plugins = plugins;
    this.postProcessors = postProcessors;
    this.schemaParser = schemaParser;
    this.projectPreProcessors = projectPreProcessors;
    this.projectPostProcessors = projectPostProcessors;
    this.inStrictMode = inStrictMode;
    this.extraContextData = extraContextData;
  }
  /**
   * 生成项目代码核心方法
   * @param originalSchema schema原始数据
   * @returns 输出的是结果目录？
   */
  async generateProject(originalSchema: ProjectSchema | string): Promise<ResultDir> {
    // Init
    const { schemaParser } = this;
    // 创建模块构建器？怎么理解模块？
    const builders = this.createModuleBuilders();
    // 首先创建目录，generateTemplate通常是用来创建静态文件
    const projectRoot = await this.template.generateTemplate();
    // 对schema进行一些预处理，实际上
    let schema: ProjectSchema =
      typeof originalSchema === 'string' ? JSON.parse(originalSchema) : originalSchema;

    // Validate
    if (!schemaParser.validate(schema)) {
      throw new CodeGeneratorError('Schema is invalid');
    }

    // Parse / Format

    // Preprocess，前置处理器，现在好像都没有做，先不管了
    for (const preProcessor of this.projectPreProcessors) {
      // eslint-disable-next-line no-await-in-loop
      schema = await preProcessor(schema);
    }

    // Collect Deps
    // Parse JSExpression
    // 这里开始使用schema解析器来解析schema了，不知道输出的结果是什么，进去schema解析器类里面看下
    const parseResult: IParseResult = schemaParser.parse(schema);
    let buildResult: IModuleInfo[] = [];

    // Generator Code module
    // components
    // pages
    const containerBuildResult: IModuleInfo[] = await Promise.all<IModuleInfo>(
      // 对每个容器进行处理
      parseResult.containers.map(async (containerInfo) => {
        let builder: IModuleBuilder;
        let path: string[];
        // 如果容器类型为页面
        if (containerInfo.containerType === 'Page') {
          // 所有的页面都采用 plugins.pages 这个数组的插件来生成代码
          builder = builders.pages;
          path = this.template.slots.pages.path;
        } else {
          builder = builders.components;
          path = this.template.slots.components.path;
        }
        // 每个容器可以理解为一个模块module？
        const { files } = await builder.generateModule(containerInfo);

        return {
          moduleName: containerInfo.moduleName,
          path,
          files,
        };
      }),
    );
    buildResult = buildResult.concat(containerBuildResult);

    // router，生成路由，这个条件语句相当于一定要定义template.slots.router这个值
    if (parseResult.globalRouter && builders.router) {
      const { files } = await builders.router.generateModule(parseResult.globalRouter);

      buildResult.push({
        path: this.template.slots.router.path,
        files,
      });
    }

    // entry，生成入口
    if (parseResult.project && builders.entry) {
      const { files } = await builders.entry.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.entry.path,
        files,
      });
    }

    // appConfig，生成应用配置
    if (builders.appConfig) {
      const { files } = await builders.appConfig.generateModule(parseResult);

      buildResult.push({
        path: this.template.slots.appConfig.path,
        files,
      });
    }

    // buildConfig
    if (builders.buildConfig) {
      const { files } = await builders.buildConfig.generateModule(parseResult);

      buildResult.push({
        path: this.template.slots.buildConfig.path,
        files,
      });
    }

    // constants?
    if (parseResult.project && builders.constants && this.template.slots.constants) {
      const { files } = await builders.constants.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.constants.path,
        files,
      });
    }

    // utils?
    if (parseResult.globalUtils && builders.utils && this.template.slots.utils) {
      const { files } = await builders.utils.generateModule(parseResult.globalUtils);

      buildResult.push({
        path: this.template.slots.utils.path,
        files,
      });
    }

    // i18n?
    if (builders.i18n && this.template.slots.i18n) {
      const { files } = await builders.i18n.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.i18n.path,
        files,
      });
    }

    // globalStyle
    if (parseResult.project && builders.globalStyle) {
      const { files } = await builders.globalStyle.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.globalStyle.path,
        files,
      });
    }

    // htmlEntry
    if (parseResult.project && builders.htmlEntry) {
      const { files } = await builders.htmlEntry.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.htmlEntry.path,
        files,
      });
    }

    // packageJSON
    if (parseResult.project && builders.packageJSON) {
      const { files } = await builders.packageJSON.generateModule(parseResult.project);

      buildResult.push({
        path: this.template.slots.packageJSON.path,
        files,
      });
    }

    // TODO: 更多 slots 的处理？？是不是可以考虑把 template 中所有的 slots 都处理下？

    // Post Process

    // Combine Modules
    buildResult.forEach((moduleInfo) => {
      let targetDir = getDirFromRoot(projectRoot, moduleInfo.path);
      if (moduleInfo.moduleName) {
        const dir = createResultDir(moduleInfo.moduleName);
        addDirectory(targetDir, dir);
        targetDir = dir;
      }
      moduleInfo.files.forEach((file) => addFile(targetDir, file));
    });

    // post-processors
    let finalResult = projectRoot;
    for (const projectPostProcessor of this.projectPostProcessors) {
      // eslint-disable-next-line no-await-in-loop
      finalResult = await projectPostProcessor(finalResult, schema, originalSchema);
    }

    return finalResult;
  }

  /**
   * 创建模块构建器
   * @returns 模块构建器
   */
  private createModuleBuilders(): Record<string, IModuleBuilder> {
    const builders: Record<string, IModuleBuilder> = {};

    Object.keys(this.plugins).forEach((pluginName) => {
      // 如果插件数组长度大于0，这里开始要应用插件了，仔细看下
      if (this.plugins[pluginName].length > 0) {
        const options: { mainFileName?: string } = {};
        if (this.template.slots[pluginName] && this.template.slots[pluginName].fileName) {
          options.mainFileName = this.template.slots[pluginName].fileName;
        }
        builders[pluginName] = createModuleBuilder({
          plugins: this.plugins[pluginName],
          postProcessors: this.postProcessors,
          contextData: {
            inStrictMode: this.inStrictMode,
            tolerateEvalErrors: false,
            evalErrorsHandler: '',
            ...this.extraContextData,
          },
          ...options,
        });
      }
    });

    return builders;
  }
}

export function createProjectBuilder(initOptions: ProjectBuilderInitOptions): IProjectBuilder {
  return new ProjectBuilder(initOptions);
}

function getDirFromRoot(root: ResultDir, path: string[]): ResultDir {
  let current: ResultDir = root;
  path.forEach((p) => {
    const exist = current.dirs.find((d) => d.name === p);
    if (exist) {
      current = exist;
    } else {
      const newDir = createResultDir(p);
      addDirectory(current, newDir);
      current = newDir;
    }
  });

  return current;
}
