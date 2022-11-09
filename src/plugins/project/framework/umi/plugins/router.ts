import { COMMON_CHUNK_NAME } from './../../../../../const/generator';
import {
  BuilderComponentPlugin,
  BuilderComponentPluginFactory,
  ChunkType,
  FileType,
  ICodeStruct,
  IRouterInfo,
} from './../../../../../types';

const pluginFactory: BuilderComponentPluginFactory<unknown> = () => {
  const plugin: BuilderComponentPlugin = async (pre: ICodeStruct) => {
    const next: ICodeStruct = {
      ...pre,
    };
    // { routes: { path: string; fileName: string; componentName: string; } }
    const { routes } = next.ir as IRouterInfo;
    let hasRootRoute = false;
    // 写一个默认路由
    for (const route of routes) {
      if (route.path === '/') {
        hasRootRoute = true;
        break;
      }
    }

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TS,
      name: COMMON_CHUNK_NAME.FileVarDefine,
      content: `const routes = [
          ${
            !hasRootRoute
              ? `{
            path: '/',
            redirect: '${routes[0].path}'
          },`
              : ''
          }
          ${routes
            .map<string>(
              (route) => `
            {
              name: '${route.title}',
              path: '${route.path}',
              component: '${route.componentName}'
            }
          `,
            )
            .join(',')}
        ]
      `,
      linkAfter: [],
    });

    next.chunks.push({
      type: ChunkType.STRING,
      fileType: FileType.TS,
      name: COMMON_CHUNK_NAME.FileExport,
      content: 'export default routes;',
      linkAfter: [],
    });

    return next;
  };
  return plugin;
};

export default pluginFactory;
