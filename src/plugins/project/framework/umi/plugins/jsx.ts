import { JSExpression } from '@alilc/lowcode-types';
import { FC_DEFINE_CHUNK_NAME, COMMON_CHUNK_NAME } from '../../../../../const';
import { transformJsExpr } from '../../../../../core/jsx/handlers/transformJsExpression';
import { transformThisInFCJsx } from '../../../../../core/jsx/handlers/transformThis2Context';
import { generateCompositeType } from '../../../../../utils/compositeType';
import { generateExpression } from '../../../../../utils/jsExpression';
import { createReactNodeGenerator } from '../../../../../utils/nodeToJSX';
import { Scope } from '../../../../../utils/Scope';
import {
  BuilderComponentPluginFactory,
  BuilderComponentPlugin,
  ICodeStruct,
  IContainerInfo,
  FileType,
  ChunkType,
  HandlerSet,
  IScope,
  NodeGeneratorConfig,
} from './../../../../../types';

export interface IPluginConfig {
  fileType?: string;
  nodeTypeMapping?: Record<string, string>;
}

const pluginFactory: BuilderComponentPluginFactory<IPluginConfig> = (config) => {
  const cfg: IPluginConfig = {
    fileType: FileType.TSX,
    // 这个属性用来做componentName到jsx真实节点之间的映射，比如Page和Component转换为div
    nodeTypeMapping: {} as Record<string, string>,
    ...config,
  };

  const { nodeTypeMapping } = cfg;

  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    // 前面的插件执行的结果
    const next: ICodeStruct = {
      ...pre,
    };

    const { tolerateEvalErrors, evalErrorsHandler } = next.contextData;

    const customHandlers: HandlerSet<string> = {
      expression(input: JSExpression, scope: IScope, config) {
        // 转换js表达式
        if (input.value.startsWith('this.state')) {
          // hard code将this.state.xxx转换为state.xxx了
          input.value = input.value.slice(5);
        }
        return transformJsExpr(generateExpression(input, scope), scope, {
          dontWrapEval: !(config?.tolerateEvalErrors ?? tolerateEvalErrors),
          dontTransformThis2ContextAtRootScope: true,
        });
      },
      function(input, scope: IScope) {
        // 转换this到context，这里没必要了，用一个新的方法
        return transformThisInFCJsx(
          generateCompositeType(
            {
              type: 'JSFunction',
              value: input.value || 'null',
            },
            Scope.createRootScope(),
          ),
          scope,
          {
            ignoreRootScope: true,
          },
        );
      },
    };

    const generatorPlugins: NodeGeneratorConfig = {
      handlers: customHandlers,
      tagMapping: (v) => nodeTypeMapping?.[v] || v,
      tolerateEvalErrors,
    };
    const generator = createReactNodeGenerator(generatorPlugins);

    const ir = next.ir as IContainerInfo;
    const scope = Scope.createRootScope();
    // 通过容器信息生成jsx
    const jsxContent = generator(ir, scope);
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: cfg.fileType as string,
      name: FC_DEFINE_CHUNK_NAME.ReturnJsx,
      content: `return ${jsxContent}`,
      linkAfter: [
        FC_DEFINE_CHUNK_NAME.Start,
        FC_DEFINE_CHUNK_NAME.UseState,
        FC_DEFINE_CHUNK_NAME.Methods,
      ],
    });
    // 添加包裹try-catch的方法，如果容忍错误则使用try-catch来包裹代码
    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TSX,
      name: COMMON_CHUNK_NAME.CustomContent,
      content: [
        tolerateEvalErrors &&
          `
        function wrapTryCatch(expr) {
          try {
            return expr();
          } catch (error) {
            ${evalErrorsHandler}
          }
        }
        
        function wrapTryCatchArray(expr) {
          const res = wrapTryCatch(expr);
          return Array.isArray(res) ? res : [];
        }
        `,
      ]
        .filter(Boolean)
        .join('\n'),
      linkAfter: [COMMON_CHUNK_NAME.InternalDepsImport],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
