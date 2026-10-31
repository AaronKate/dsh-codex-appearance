# DeepSeek Harness 护眼外观插件

在设置中增加「外观」页，提供五套浅色护眼主题（暖白、米纸、豆沙绿、雾蓝、石墨）与五套深色主题（蓝灰、纯黑、北境、暖褐、墨绿），以及跟随系统／浅色／深色／按时间表四种模式、强调色与背景色、界面与代码的字体和字号、字体样式、内容宽度、对比度、纸张质感和减少动态效果等设置。每套主题各自带有匹配的强调色与链接色，并覆盖消息气泡、轮次预览、输入框、改动文件卡片等界面区域。语法高亮的九个着色器变量（关键字、字符串、注释、常量、函数、参数、标点、链接等）与 diff 的增删底色、行号槽、标记色都按主题重新调制，并按实际代码块底色校验对比度；另有色盲友好档把增删行的红绿换成蓝橙。设置可导出为 JSON 再导入到另一台机器，也可设定「浅色起／深色起」两个时间点让界面自动切换。字体下拉会列出本机安装的全部字族（由插件主进程读取系统字体清单，读不到时回退到内置候选探测），可分别设置界面、内容与代码字体。纸张质感在内容区、侧栏、输入框和卡片上叠一层极淡的纸纤维颗粒，强度可调；纹理自带主题底色，不改变原有色温，也不触碰原生标题栏。输入框在鼠标移入时轻微上浮、聚焦输入时落回原位。通过 Harness 的主题 token 和设置 section 扩展点工作；设置保存在当前桌面应用的本地浏览器存储中。

Eye-comfort appearance controls for DeepSeek Harness: five light and five dark themes, themed syntax highlighting and diff colours (with a colour-blind-friendly option), scheduled light/dark switching, JSON import and export, accent and background colours, typography, content width, contrast and paper grain. This is an independent community plugin, not an official Codex or DeepSeek product.

已在 Windows 上 DeepSeek Harness 0.2.0-rc.2 中验证安装、设置界面与浅色/深色主题效果。字体清单通过主进程调用系统接口读取（Windows 用 GDI+，macOS 用 system_profiler，Linux 用 fc-list），不修改系统设置。

## 主题与配色

- **浅色**：暖白、米纸、豆沙绿、雾蓝、石墨。每套都带自己的纸面、侧栏、气泡、输入框与选中态，全部由「纸面 + 正文」按固定明度阶梯推导，所以换主题时层次不会塌。纸面之间用 CIEDE2000 校验可辨性（两套纸面的 ΔE00 必须明显高于刚可察觉阈，否则就等于同一套主题）。
- **深色**：蓝灰、纯黑、北境（Nord 冷灰）、暖褐（Gruvbox 系）、墨绿。深色侧的最深一档（内容区／侧栏／菜单／代码块的基准）跟随所选主题，不再是写死的蓝灰。
- **语法高亮**：DSH 把着色器颜色暴露成 `--shiki-token-*`，插件按主题前景重新调制九个 token，并按「实际代码块底色」逐个校验对比度（正文级 4.5:1、注释 3.6:1）。
- **diff**：`--dsw-alias-file-diff-*`（整行底色、行号槽、标记色）与 `--dsw-alias-code-diff-*`（代码块内叠加色）按纸面调制；开启「色盲友好 diff」后增删色相换成蓝／橙。
- **链接色**：每套主题一个专属链接色，不再是统一蓝。冷色主题沿用自己的链接色；暖纸/绿纸换色相——米纸用深靛 `#4A3B6B`、豆沙绿用墨青 `#24596B`（正文是暖褐/墨绿，直接沿用链接色会变成「正文的另一档深浅」）。深色侧直接用主题强调色，仅在对比不足时提亮。所有文件链接常驻 1px 实线下划线（`text-decoration-skip-ink: none`，长路径折行也连续），悬停加深。
- **会话进行时**：输入框右下角的发送按钮变成停止（■）时，按钮外缘有一圈 2.6s 的呼吸——单层 2px 中蓝环（合成后对卡片 2.3:1）+ 10px 柔光 + 3.5% 缩放；不做亮度闪、不加内白环（三层边界会「太跳」）。点击停止即消失；状态判定用图标形状（`:has(svg rect)`）而非文案，另留 `aria-label` 兜底；开启「减少动态效果」时整条不注入。
- **选中态**：侧栏会话／搜索命中／导航选中统一为「侧栏底色 + 主题强调色 14%」，五套主题与侧栏的明度差都在 ΔL\* 4.5–6.3，看得出选中但不成块。
- **定时切换**：「模式」里选「定时」，再设定「浅色起／深色起」两个时间点；跨零点自动折返，每 30 秒对一次表。
- **导入导出**：设置导出为 JSON（颜色、字体、尺寸、模式全在里面），可在另一台机器导入；导入走一遍校验，非法值回落到默认。

## 截图

![五套护眼主题](assets/five-themes.png)

![冷白与微暖对比](assets/warm-tone-compare.png)

![三种暖调](assets/tone-variants.png)

![对比度 0 / 50 / 100](assets/contrast-levels.png)

## 安装

从 [Releases](https://github.com/AaronKate/dsh-codex-appearance/releases) 下载 `dsh-eye-comfort-0.3.19.tgz`，执行：

```sh
dsh plugin --profile desktop add ./dsh-eye-comfort-0.3.19.tgz
```

本地开发可在仓库根目录 `npm pack` 后从 `dist/` 安装打包产物。

重启 DeepSeek Harness，在「设置 → 外观」中调整。Windows 上 PowerShell 同样使用以上命令；路径可改为下载文件的绝对路径。要求 DeepSeek Harness 版本包含 `ui-theme` 和 `settings.section` 插件接口。

> 从 `dsh-codex-appearance` 改名为 `dsh-eye-comfort`。若你装过旧版本，请先执行下方卸载命令移除旧包，再按上面的方式安装新包；外观设置保存在浏览器存储中，与包名无关，重装后不会丢失。

## 卸载

```sh
dsh plugin --profile desktop remove dsh-eye-comfort
```

此插件不修改应用安装包或签名。与其他主题插件同时启用时，最后注册的 token 覆盖层决定同名颜色。当前版本的设置属于本机当前桌面应用，不跨设备同步。
