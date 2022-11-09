# 出码

所谓出码，即将低代码编排出的 schema 进行解析并转换成最终可执行的代码的过程。本模块提供基于 [umi4](https://umijs.org/) 框架的出码方案，并提供了强大而灵活的扩展机制。

## 使用方法

### 1) 通过命令行快速体验

欢迎使用命令行工具快速体验：`npx @seada/lowcode-code-generator -i example-schema.json -o generated -s umi`

其中 example-schema.json 可以从[这里下载](https://unpkg.com/@seada/lowcode-code-generator@beta/example-schema.json)

### 2) 通过设计器插件快速体验

1. 安装依赖: `npm install --save @seada/antd-plugins`
2. 注册插件:

```ts
import { plugins } from '@alilc/lowcode-engine';
import { PluginCodeGenerator } from '@seada/antd-plugins';

// 在你的初始化函数中：
await plugins.register(PluginCodeGenerator);

// 如果您不希望自动加上出码按钮，则可以这样注册
await plugins.register(PluginCodeGenerator, { disableCodeGenActionBtn: true });
```

然后运行你的低代码编辑器项目即可 -- 在设计器的右上角会出现一个“出码”按钮，点击即可在浏览器中出码并预览。

### 3）自定义出码

前端框架灵活多变，默认内置的出码方案很难满足所有人的需求，好在此代码生成器支持非常灵活的插件机制 -- 欢迎参考 ./src/plugins/xxx 来编写您自己的出码插件，然后参考 ./src/solutions/xxx 将各种插件组合成一套适合您的业务场景的出码方案。
