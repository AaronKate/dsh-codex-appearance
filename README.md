# DeepSeek Harness 外观插件

在设置中增加「外观」页，以 Codex 风格蓝灰为预设（浅色为纯白底 + 蓝灰面板，深色为蓝灰深色）。支持跟随系统、浅色、深色、自定义颜色、字体与字号、侧边栏模糊、动态效果及对比度。另对行内代码底色、聊天中的文件链接颜色、代码块卡片底色与设置面板做了自适应主题化。通过 Harness 的主�?token 和设�?section 扩展点工作；设置保存在当前桌面应用的本地浏览器存储中�?

Adds an Appearance page to DeepSeek Harness with a blue-gray preset, light/dark modes, colors, typography and motion controls. This is an independent community plugin, not an official Codex or DeepSeek product.

已在 Windows �?DeepSeek Harness 0.2.0-rc.2 中验证安装、设置界面与浅色/深色主题效果。代码未调用操作系统专有 API�?

## 安装

�?[Releases](https://github.com/AaronKate/dsh-codex-appearance/releases) 下载 `dsh-codex-appearance-0.2.19.tgz`，执行：

```sh
dsh plugin --profile desktop add ./dsh-codex-appearance-0.2.19.tgz
```

本地开发可在仓库根目录 `npm pack` 后从 `dist/` 安装打包产物�?

重启 DeepSeek Harness，在「设�?�?外观」中调整。Windows �?PowerShell 同样使用以上命令；路径可改为下载文件的绝对路径。要�?DeepSeek Harness 版本包含 `ui-theme` �?`settings.section` 插件接口�?

## 卸载

```sh
dsh plugin --profile desktop remove dsh-codex-appearance
```

此插件不修改应用安装包或签名。与其他主题插件同时启用时，最后注册的 token 覆盖层决定同名颜色。当前版本的设置属于本机当前桌面应用，不跨设备同步�?
