# Better Life · 高性价比人生指南

基于 [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) 的独立视觉重设计。本地项目包含原仓库内容；原文目录保存于 `CONTENT.md`；`book/`、`docs/` 和许可证保留。

## 打开网站

无需安装依赖。在本文件所在目录运行：

```sh
npm run dev
```

访问 http://127.0.0.1:4173。也可直接运行 `node tools/preview/serve.mjs`。本地服务只监听当前电脑，不对公网开放；需要其他端口时可设置 `PORT`。

## 生成完全离线版

```sh
node tools/offline/build.mjs
```

产物：`dist/HowToLiveBetter.html`。双击即可阅读与搜索，不需要服务器或网络。32 章正文、视觉和交互都内置于文件；期刊来源、核实记录和补充长文链接仍需联网打开。

## 已有交互

- 三个生活场景入口：健康与精力、金钱与工作、安全与关系，合计覆盖 32 章。
- 全文搜索，以及章节、性价比、收益口径、证据等级、钱、时间、毅力等组合筛选。
- 一键查看不花钱且不用毅力的建议。
- 本地收藏与收藏筛选；大字号和深浅色偏好记忆。
- 来源展开、术语解释、原有章节间引用与条目定位。
- 手机筛选抽屉、键盘焦点循环、Escape 关闭、搜索快捷键 `/`、返回顶部、页面阅读进度。
- 主视觉轻浮动、卡片抬升、箭头转向及收藏反馈；尊重系统减少动态效果设置。

收藏与偏好仅保存在当前浏览器，不上传，也不跨设备同步。更换浏览器、清除站点数据或移动离线文件时，可能无法继承先前记录。

## 文件说明

- `index.html`：新版网站入口，样式与脚本内置，正文从原 Markdown 读取。
- `tools/offline/build.mjs`：原构建流程的适配版。
- `tools/preview/serve.mjs`：零依赖本地预览服务。
- `design/*.png`：桌面、手机、深色和阅读区实测截图。
- `tools/tests/ui.cjs`：浏览器回归检查；需要可用的 Playwright 与 Chrome。可通过 `NODE_PATH` 指向已安装 Playwright 的目录，在预览服务运行时执行 `node tools/tests/ui.cjs`。
- `CONTENT.md`：正文索引与术语表。

网站通过 GitHub Pages 发布：https://jackyme.github.io/how-to-live-better/，推送 main 后自动更新。网站保留原仓库的内容归属与 Unlicense 许可。页面中的科学、健康、法律和财务陈述来自原仓库，本次没有逐一重新核实这些陈述。
