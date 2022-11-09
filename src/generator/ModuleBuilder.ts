import { ProjectSchema, ResultFile, ResultDir } from '@alilc/lowcode-types';

import {
  BuilderComponentPlugin,
  CodeGeneratorError,
  ICodeChunk,
  ICompiledModule,
  IContextData,
  IModuleBuilder,
  IParseResult,
  ISchemaParser,
  PostProcessor,
} from '../types';

import { COMMON_SUB_MODULE_NAME } from '../const/generator';

import { SchemaParser } from '../parser/SchemaParser';
import { ChunkBuilder } from './ChunkBuilder';
import { CodeBuilder } from './CodeBuilder';
import { createResultFile, createResultDir, addFile } from '../utils/resultHelper';

/**
 * 创建模块构建器，一个模块可以理解为一个容器（Page、Block和Component这样的容器）
 * @param options
 * @returns
 */
export function createModuleBuilder(
  options: {
    plugins: BuilderComponentPlugin[];
    postProcessors: PostProcessor[];
    mainFileName?: string;
    contextData?: IContextData;
  } = {
    plugins: [],
    postProcessors: [],
  },
): IModuleBuilder {
  // 代码块生成器，输入参数为插件数组
  const chunkGenerator = new ChunkBuilder(options.plugins);
  const linker = new CodeBuilder();
  /**
   * 生成模块
   * @param input 输入？为什么类型是未知的呢，这里看代码传入的是 parseResult 中的各个值，比如 containerInfo，比如globalRouter
   * @returns
   */
  const generateModule = async (input: unknown): Promise<ICompiledModule> => {
    // 模块主名称？
    const moduleMainName = options.mainFileName || COMMON_SUB_MODULE_NAME;
    if (chunkGenerator.getPlugins().length <= 0) {
      throw new CodeGeneratorError(
        'No plugins found. Component generation cannot work without any plugins!',
      );
    }

    let files: ResultFile[] = [];
    // 这里执行所有插件，生成代码块
    const { chunks } = await chunkGenerator.run(input, {
      ir: input,
      chunks: [],
      depNames: [],
      contextData: options.contextData || {},
    });

    chunks.forEach((fileChunkList) => {
      const content = linker.link(fileChunkList);
      const file = createResultFile(
        fileChunkList[0].subModule || moduleMainName,
        fileChunkList[0].fileType,
        content,
      );
      files.push(file);
    });

    if (options.postProcessors.length > 0) {
      files = files.map((file) => {
        let { content } = file;
        const type = file.ext;
        options.postProcessors.forEach((processer) => {
          content = processer(content, type);
        });

        return createResultFile(file.name, type, content);
      });
    }

    return {
      files,
    };
  };

  const generateModuleCode = async (schema: ProjectSchema | string): Promise<ResultDir> => {
    // Init
    const schemaParser: ISchemaParser = new SchemaParser();
    const parseResult: IParseResult = schemaParser.parse(schema);

    const containerInfo = parseResult.containers[0];
    const { files } = await generateModule(containerInfo);

    const dir = createResultDir(containerInfo.moduleName);
    files.forEach((file) => addFile(dir, file));

    return dir;
  };

  const linkCodeChunks = (chunks: Record<string, ICodeChunk[]>, fileName: string) => {
    const files: ResultFile[] = [];

    Object.keys(chunks).forEach((fileKey) => {
      const fileChunkList = chunks[fileKey];
      const content = linker.link(fileChunkList);
      const file = createResultFile(
        fileChunkList[0].subModule || fileName,
        fileChunkList[0].fileType,
        content,
      );
      files.push(file);
    });

    return files;
  };

  return {
    generateModule,
    generateModuleCode,
    linkCodeChunks,
    addPlugin: chunkGenerator.addPlugin.bind(chunkGenerator),
  };
}
