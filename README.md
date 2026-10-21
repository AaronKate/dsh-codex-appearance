# DeepSeek Harness 外观插件

在设置中增加「外观」页，提供跟随系统、浅色、深色三种模式，以及强调色与背景/前景色、界面与代码的字体和字号、字体样式、内容宽度、对比度和减少动态效果等设置。浅色采用中性暖白以降低长时间阅读的眩光，深色保持蓝灰。另对行内代码底色、聊天中的文件链接颜色、代码块卡片底色、设置面板与轨迹面板做了自适应主题化。通过 Harness 的主题 token 和设置 section 扩展点工作；设置保存在当前桌面应用的本地浏览器存储中。

Adds an Appearance page to DeepSeek Harness with light/dark/system modes, accent and background colours, typography, content width, contrast and motion controls. This is an independent community plugin, not an official Codex or DeepSeek product.

已在 Windows 上 DeepSeek Harness 0.2.0-rc.2 中验证安装、设置界面与浅色/深色主题效果。代码未调用操作系统专有 API。

## 安装

从 [Releases](https://github.com/AaronKate/dsh-codex-appearance/releases) 下载 `dsh-codex-appearance-0.2.26.tgz`，执行：

```sh
dsh plugin --profile desktop add ./dsh-codex-appearance-0.2.26.tgz
```

本地开发可在仓库根目录 `npm pack` 后从 `dist/` 安装打包产物。

重启 DeepSeek Harness，在「设置 → 外观」中调整。Windows 上 PowerShell 同样使用以上命令；路径可改为下载文件的绝对路径。要求 DeepSeek Harness 版本包含 `ui-theme` 和 `settings.section` 插件接口。

## 卸载

```sh
dsh plugin --profile desktop remove dsh-codex-appearance
```

此插件不修改应用安装包或签名。与其他主题插件同时启用时，最后注册的 token 覆盖层决定同名颜色。当前版本的设置属于本机当前桌面应用，不跨设备同步。
