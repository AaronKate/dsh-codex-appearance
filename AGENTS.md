# 项目协作规则

本文件供 AI 助手（Agent）在本仓库工作时遵守。优先级高于助手的默认行为习惯。

## 〇、默认不打包、不安装、不发版

未明确要求「打包 / 安装 / 发版」时，改动只做三步，做完即止：

1. 改源码，并用 `node --check lib\client.js` 校验；
2. 同步到本机安装副本（DSH 启动直接读这个文件，重启即生效，**不需要打包或安装**）：
   `C:\Users\79294\.dsh\profiles\desktop\node_modules\dsh-eye-comfort\lib\client.js`
3. `git add / commit / push`。

**禁止**在未获明确指示前自行：升版本号、`npm pack`、`npm publish`、打 tag、`gh release create`、`pnpm add` 或 `dsh plugin add` 安装档位。

需要发版时用户会明说「发版 / 打包 / 发布」，那时才按下文第四节流程执行。

补充事实：任何安装或更新（`pnpm add`、市场里点更新）都会用包内文件覆盖第 2 步写进去的 `client.js`，所以本地改动**不是持久的**——这正是默认走第 2 步、而持久化必须发版的原因。

## 一、改动必须由用户验证后才能打包发布

**这是本仓库最重要的一条规则。**

修改 `lib/client.js` 等源码后，一律按以下顺序执行，不得跳步：

1. **只改源码**，并用 `node --check lib\client.js` 校验语法；
2. **同步到本机安装副本**（便于用户立即验证）：
   `C:\Users\79294\.dsh\profiles\desktop\node_modules\dsh-eye-comfort\lib\client.js`
3. **停下，请用户验证**。明确告诉用户需要重启 DeepSeek Harness，并列出应当观察到的具体现象（哪一处、什么颜色、悬停时怎样）；
4. **等待用户明确确认**（例如「好了」「有效」「可以了」）。

只有用户确认后，才可以执行：

- `npm pack --pack-destination .\dist`
- 修改 `package.json` 版本号与 `README.md` 中的版本引用
- `git add / commit / tag / push`
- `gh release create`
- 用 pnpm 把新 tgz 装入 desktop 档位

**禁止**在用户未确认前自行：升版本号、打 tarball、提交、打 tag、发 Release、`pnpm add` 安装包。

若用户反馈「还是不对」，回到第 1 步继续修，**不要**因为「已经改了几次」就跳到打包环节。

## 二、改 CSS 前先查清真实类名，禁止靠猜

DSH 的样式类名是哈希生成的（`_2H3hWW_newSession`、`kuvljq_row`、`hGyLPq_root` 等），且同一模块下子元素共享前缀。

- **禁止**用 `[class*="xxx"]` 这类宽泛子串匹配去「猜」目标元素——它会同时命中 `xxxContent`、`xxxLabel`、`xxxList`、`xxxCell` 等子元素，把样式错误地复制到内部每一层（本项目已因此反复出错）。
- 正确做法：先从 `app.asar` 里导出该模块的**完整类名清单**，再写精确选择器；必要时用元素限定（如 `button[class*="_newSession"]`）+ 子元素重置（`> * { background: transparent }`）。
- 改 token 时先确认该 token 的**定义链**（它是否又引用了别的 token、是否带 alpha、是否被原生层读取）。

## 三、结论必须经过实测，不得只凭代码推断

- 声称「已修复」之前，必须验证实际渲染值，而不是只看源码。可用手段：让用户提供截图后用 `System.Drawing` 采样像素色值，或从 `app.asar` 中确认选择器/ token 的真实定义。
- 尤其注意「改了但看不出来」的情况：接近白色区间（90%~100% 白度）的微调在肉眼上与纯白无区别，必须拉开足够色差。

## 四、发布流程（仅在用户确认后执行）

1. 版本号 patch +1，更新 `README.md` 中引用的 tgz 文件名；
2. `npm pack --pack-destination .\dist`；
3. 同步 `dist\dsh-eye-comfort-<ver>.tgz` → `dist\dsh-eye-comfort.tgz`（保证 `releases/latest/download` 直链可用）；
4. `git add -A && git commit && git tag -a v<ver> && git push origin main && git push origin v<ver>`；
5. `gh release create v<ver> <两个 tgz> --repo AaronKate/dsh-codex-appearance --notes-file <临时说明> --title "..."`；
6. 用 `pnpm add "D:\开发项目\dsh-codex-appearance\dist\dsh-eye-comfort-<ver>.tgz"` 更新 desktop 档位（本机 pnpm 不在 PATH，实际用 `resources\runtime\cli\bin\dsh.cmd plugin --profile desktop add <tgz>`）；
7. 清理临时说明文件。

## 五、环境事实

- 本机档位：`desktop`，插件安装副本位于 `C:\Users\79294\.dsh\profiles\desktop\node_modules\dsh-eye-comfort`
- desktop 档位依赖为 npm 精确版本 `dsh-eye-comfort@0.3.20`（不再指向本地 tarball；装本地 tgz 时才会临时改成 `file:...`）；`package.json` 的 `dsh.profile.bundles` 必须包含 `dsh-eye-comfort`
- `dist/` 只放发布产物，已被 `.gitignore` 忽略；日常不保留历史 tgz
- 应用主进程必须**完全退出**才能重载插件（仅刷新窗口无效）
- Windows 上主窗口未启用 `transparent`，插件无法实现真正的毛玻璃；`--dsw-specific-sidebar-fill` 会被原生标题栏读取，**必须返回不透明色**
- 发布目标仓库：`AaronKate/dsh-codex-appearance`（origin）
