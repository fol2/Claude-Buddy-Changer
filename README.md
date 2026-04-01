# Claude Buddy Changer

[English](#english)

中文优先的 Claude Code Buddy 本地搜索、预览、切换工具。

<img width="1920" height="989" alt="image" src="https://github.com/user-attachments/assets/7f438153-0246-4ff4-bca0-60cd54a60941" />


它做 4 件事：

- 自动读取你本机 Claude Code 的 `userId`
- 按 `userId + salt` 真实计算宠物结果
- 用接近 Claude Code 原版的 ASCII sprite 做动态预览
- 把你选中的 `salt` 应用到本机 Claude Code 安装，并支持恢复原始值

适合场景：

- 想搜索自己喜欢的 Claude Code 宠物
- 想先在本地页面里预览，再决定是否应用
- 想开源、离线、可恢复地管理 buddy

## 功能

- 真实算法预览：使用本地用户 ID 复现 buddy 生成逻辑
- 真实 sprite 渲染：移植 `sprites.ts` 和渲染规则
- 动态预览：支持 idle 动画、眨眼、shiny 高亮
- 条件搜索：按 species / rarity / eye / hat / shiny / min stat 搜索
- 本机 binary 检测：自动检测 Claude Code 安装和当前 salt
- 一键应用：将选中的 `salt` 应用到本机 Claude Code
- 一键恢复：恢复原始 salt
- 中英文界面切换

## 目录

```text
.
├── binary.js       # Claude Code binary 检测 / apply / restore
├── buddy-core.js   # roll 算法 + sprite 渲染 + 搜索逻辑
├── buddy-lab.js    # 命令行工具
├── index.html      # 本地网页界面
├── server.js       # 本地 HTTP 服务
└── state.js        # 原始 salt 记录文件管理
```

## 环境要求

- Node.js 18+
- 本机已安装 Claude Code
- 建议系统已能正常执行 `claude`

查看版本：

```bash
node -v
which claude
```

## 快速开始

进入项目目录：

```bash
cd /home/ec2-user/claude-buddy-changer
```

启动本地页面：

```bash
node server.js
```

浏览器打开：

```text
http://127.0.0.1:43123
```

## 网页使用说明

### 1. 预览当前宠物

页面启动后会自动：

- 读取本机 Claude 配置里的 `oauthAccount.accountUuid`
- 如果没有，再读取 `userID`
- 检测本机 Claude Code binary

然后你可以直接点击：

- `Preview Buddy`

它会显示当前 `salt` 下的真实宠物预览。

### 2. 搜索喜欢的宠物

左侧可以设置这些筛选条件：

- `Species`
- `Rarity`
- `Eye`
- `Hat`
- `Shiny only`
- `Min stat`

例如：

```text
Species = owl
Rarity = epic
Min stat = CHAOS:80
```

然后点击：

- `Search Matching Buddies`

页面会列出符合条件的结果卡片。

### 3. 预览某个搜索结果

每张结果卡片都有：

- `Preview This / 预览这只`

点击后，上方预览区会切换到该结果。

### 4. 应用到本机 Claude Code

确认喜欢之后，点击：

- `Use This Buddy / 使用这只宠物`

它会：

1. 检测当前 Claude Code binary
2. 记录原始 salt
3. 把当前选中的 salt 写入本机 Claude Code 安装

完成后：

- 重启 Claude Code
- 新宠物生效

### 5. 恢复原始宠物

左侧二进制状态区点击：

- `Restore Original / 恢复原始 Salt`

然后重启 Claude Code 即可恢复。

## 命令行使用说明

除了网页，也可以直接用 CLI。

进入目录：

```bash
cd /home/ec2-user/claude-buddy-changer
```

### 预览当前结果

```bash
node buddy-lab.js preview
```

### 预览指定 salt

```bash
node buddy-lab.js preview --salt friend-2026-401
```

### 搜索指定物种

```bash
node buddy-lab.js search --species owl --total 500000
```

### 搜索稀有宠物

```bash
node buddy-lab.js search --species dragon --rarity legendary --total 1000000
```

### 搜索 shiny

```bash
node buddy-lab.js search --shiny --total 1000000
```

### 搜索高属性宠物

```bash
node buddy-lab.js search --species chonk --min-stat CHAOS:80 --total 500000
```

### 常用参数

- `--species <name>`
- `--rarity <tier>`
- `--eye <glyph>`
- `--hat <name>`
- `--shiny`
- `--min-stat <NAME:value>`
- `--total <n>`
- `--user-id <id>`
- `--salt <salt>`

## 当前工作方式

这套工具当前的核心机制是：

```text
userId + salt -> buddy
```

其中：

- `userId` 默认从用户本机 Claude 配置自动读取
- `salt` 由页面搜索或手动输入决定

这意味着：

- 同一个 `salt`，不同用户的结果可能不同
- 真正决定结果的是 `userId + salt` 组合

## Binary 状态说明

页面会显示：

- Claude Code binary 路径
- 当前正在使用的 salt
- 是否已经记录原始 salt

状态文件默认保存到：

```text
~/.claude-buddy-changer.json
```

这个文件会记录：

- 哪个 binary 的原始 salt 是什么
- 什么时候记录的

## 已验证功能

本项目当前已验证：

- 自动检测本机 user ID
- 真实 buddy 计算
- 真实 ASCII sprite 渲染
- 搜索条件过滤
- 本地网页预览
- binary 状态检测
- 对测试副本执行 `apply`
- 对测试副本执行 `restore`

## 风险说明

请注意：

- `Use This Buddy` 会修改你本机 Claude Code 安装文件
- Claude Code 更新后可能覆盖修改
- 如果你不确定，先用页面预览，不要立即应用
- 应用后通常需要重启 Claude Code
- macOS 下如果未来改为修改真正可执行文件，可能需要重新签名

## 常见问题

### 为什么我和别人用同一个 salt，结果不一样？

因为结果不是只由 `salt` 决定，而是：

```text
userId + salt
```

不同用户的 `userId` 不同，所以最终宠物可能不同。

### 页面里显示不了 Claude binary 怎么办？

先确认：

```bash
which claude
```

如果没有结果，说明当前环境里还没有可检测的 Claude 安装路径。

### 应用之后为什么没变？

通常是因为：

- Claude Code 还没重启
- 你改到的不是实际正在运行的那个安装路径

先看页面左侧 `Claude Binary` 状态区确认路径，再重启 Claude Code。

### 如何恢复？

点击：

- `Restore Original / 恢复原始 Salt`

然后重启 Claude Code。

## 开发

启动网页：

```bash
cd /home/ec2-user/claude-buddy-changer
node server.js
```

调试 CLI：

```bash
node buddy-lab.js preview
node buddy-lab.js search --species owl --total 500000
```

---

## English

`Claude Buddy Changer` is a local tool for searching, previewing, applying, and restoring Claude Code buddy salts.

Main capabilities:

- auto-detect local Claude `userId`
- compute buddy results from `userId + salt`
- render near-original ASCII buddy previews
- search matching salts by filters
- detect local Claude Code binary
- apply a selected salt to the local install
- restore the original salt later

Quick start:

```bash
cd /home/ec2-user/claude-buddy-changer
node server.js
```

Open:

```text
http://127.0.0.1:43123
```

CLI examples:

```bash
node buddy-lab.js preview
node buddy-lab.js preview --salt friend-2026-401
node buddy-lab.js search --species owl --total 500000
node buddy-lab.js search --species dragon --rarity legendary --total 1000000
node buddy-lab.js search --shiny --total 1000000
```

Important note:

- results depend on `userId + salt`, not on `salt` alone
- applying a buddy modifies the local Claude Code installation
- restart Claude Code after applying or restoring
