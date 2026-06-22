# AR Builder 当前进度交接

更新日期：2026-06-22

本文档用于重开 Codex 对话、交接开发上下文或快速恢复项目状态。新的对话建议先阅读本文档，再阅读 `docs/PRD.md`、`docs/DEVELOPMENT_MANUAL.md` 和 `docs/REAL_DEVICE_TEST_PLAN.md`。

## 1. 项目信息

- 本地路径：`C:\Users\Administrator\Desktop\AR Builder`
- GitHub 仓库：`https://github.com/LeafLit/ar-builder`
- 线上测试地址：`https://leaflit.github.io/ar-builder/`
- 最新功能提交：`766e9a9 feat: manage captured samples`
- 防缓存测试地址模板：`https://leaflit.github.io/ar-builder/?v=最新提交短哈希`
- 每次部署后建议把防缓存参数换成最新提交短哈希，例如：`https://leaflit.github.io/ar-builder/?v=最新提交短哈希`

## 2. 技术方向

- React + TypeScript + Vite + PWA。
- 手机浏览器优先，兼容鸿蒙、安卓、iOS。
- 真实摄像头识别。
- MobileNet embedding + 自训练状态分类器。
- 项目数据保存在当前浏览器本地 IndexedDB。
- 当前主路线是方案 A：相机背景 + 屏幕锚点 / 2D-3D 叠加，先保证跨手机浏览器可用。
- 方案 B：WebXR / 原生空间 AR 仍作为后续增强方向。

## 3. 当前已实现能力

1. 创建 AR 原型项目。
2. 采集两个输入状态的样本，状态名称可自定义。
3. 状态名称输入已修复：编辑时可以正常清空、删除第一个字或最后一个字。
4. 训练浏览器端识别模型，并把轻量模型快照随项目保存。
5. 测试页调用真实手机摄像头进行自动识别。
6. 低置信度或未识别到已训练状态时不显示虚拟物体。
7. 稳定识别确认机制，减少状态抖动。
8. 识别灵敏度滑杆，默认 85%，范围 50%-100%，并保存到项目设置。
9. 支持屏幕锚点放置输出：横向位置、纵向位置、大小。
10. 支持文字输出。
11. 支持图片输出。
12. 支持内置 3D 模型输出：立方体、球体、圆锥、树。
13. 支持 3D 模型旋转角度控制。
14. 支持内置音频输出：提示音、成功音、警示音。
15. 支持视觉输出附加音频，也支持纯音频输出。
16. 测试页支持状态触发计数和重置。
17. 首页支持本机项目列表。
18. 本机项目支持继续编辑、重命名和删除。
19. 首页包含真机测试反馈记录面板。
20. 已进行多轮华为 Mate40 鸿蒙浏览器测试。
21. 采集页支持基础样本管理：查看当前状态的样本缩略图、点击缩略图放大查看、删除拍坏样本、删除后重新同步样本数，并可继续补采样本。

## 4. 最近测试结论

- `feat: add built-in 3d model output` 已真机测试通过。
- `feat: add 3d rotation controls` 已真机测试通过。
- `feat: add state trigger counter` 已真机测试通过。
- `feat: add built-in audio output` 已真机测试通过。
- `feat: add combined visual audio output` 已真机测试通过。
- `feat: add custom state names` 已真机测试通过。
- `fix: allow clearing state names while editing` 已真机测试通过。
- `feat: manage local projects` 已真机测试通过。

## 5. 当前边界和未完成内容

- 当前 MVP 仍固定为两个输入状态，但两个状态都可以改名。
- 采集样本已有基础管理能力：查看样本、删除坏样本、补采样本。后续还可以继续补充单张重拍、批量删除和样本质量提示。
- 识别准确率仍依赖现场光线、背景、样本质量和手机性能。
- 目前以屏幕锚点叠加为主，不承诺真实空间锚定。
- 还没有项目导入 / 导出。
- 还没有登录、云同步和多设备同步。
- 还没有完整可视化规则编辑器或状态机编辑器。
- 还没有原生 App 封装、ARKit、ARCore 或华为 AR Engine 接入。

## 6. 建议下一步

优先级从高到低：

1. 增加训练样本质量提示：光线、背景、角度、每个状态建议样本数。
2. 继续打磨采集样本管理：单张重拍、批量删除、删除前确认或撤销。
3. 增加项目导入 / 导出，方便换手机、备份和演示交接。
4. 增加更多输出效果：震动、粒子、简单动画或更多内置 3D 模型。
5. 支持从两个固定状态扩展到多个状态。
6. 优化状态切换体验：连续多帧确认参数、过渡动画、触发冷却时间。
7. 再评估 WebXR / 原生空间 AR 方案。

## 7. 交付说明规则

以后每次完成开发或文档改动后，收尾说明都要包含：

1. 本次做了什么。
2. 已运行哪些检查命令，例如 `pnpm.cmd test`、`pnpm.cmd run build`。
3. 如果本次改动需要真机测试，必须列出“需要实机测试的功能”。
4. 如果本次改动需要真机测试，必须给出测试地址：
   - 默认线上测试地址：`https://leaflit.github.io/ar-builder/`
   - 防缓存测试地址模板：`https://leaflit.github.io/ar-builder/?v=最新提交短哈希`
5. 默认在检查通过后自动提交并推送到当前远端分支，方便尽快真机测试；除非用户明确要求“不要提交 / 不要推送 / 先别动 Git”。
6. 推送后提醒用户等待 GitHub Actions 发布完成，再使用线上测试地址。

## 8. 新对话建议开场

可以直接复制下面这段给新的 Codex 对话：

```text
我们在开发 AR Builder。请先阅读 docs/CURRENT_PROGRESS.md、docs/PRD.md、docs/DEVELOPMENT_MANUAL.md 和 docs/REAL_DEVICE_TEST_PLAN.md，然后根据当前进度继续推进下一步。用户是小白，文档和说明请尽量用中文写清楚。当前主路线是手机浏览器 PWA + 真实摄像头识别 + 屏幕锚点 AR 叠加。
```

## 9. 常用检查命令

```powershell
cd "C:\Users\Administrator\Desktop\AR Builder"
git status --short --branch
git log --oneline -5
pnpm.cmd test
pnpm.cmd run build
gh run list --repo LeafLit/ar-builder --branch main --limit 3
```
