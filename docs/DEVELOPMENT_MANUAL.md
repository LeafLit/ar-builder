# AR Builder 开发手册

## 1. 项目说明

AR Builder 第一版会先做成手机网页应用。手机网页应用可以直接用浏览器打开，
也可以通过 PWA 的方式安装到手机桌面，看起来接近普通 App。

第一版重点完成一个完整闭环：

1. 手机摄像头看到真实世界。
2. 用户录制不同状态的示例。
3. App 在浏览器里训练一个小模型。
4. App 识别当前画面属于哪个状态。
5. App 根据识别结果显示或改变 AR 内容。

这样既能复现论文的核心思想，又能控制第一版开发难度。

## 2. 推荐技术栈

- 编程语言：TypeScript。
- 前端框架：React。
- 构建工具：Vite。
- PWA 支持：vite-plugin-pwa。
- 3D 渲染：Three.js。
- 可选 AR 场景辅助：A-Frame，如果它能简化编辑流程再接入。
- 机器学习：TensorFlow.js。
- 摄像头访问：浏览器 MediaDevices getUserMedia API。
- 本地数据库：IndexedDB。
- 未来后端：Supabase、Firebase 或自建 API。

## 3. 架构原则

App 应该拆成职责清晰的模块。

- 项目模块：管理项目元数据和保存数据。
- 采集模块：管理摄像头预览和训练样本。
- 机器学习模块：训练模型并进行状态识别。
- 编辑模块：管理“状态 -> 动作”的绑定关系。
- AR 模块：渲染 2D/3D 输出，并处理不同平台能力差异。
- 素材模块：管理 3D 模型、图片、文字和音频。
- 测试模块：运行实时识别和输出触发。

重要原则：每个模块只做自己的事情。例如，机器学习模块不应该直接移动 3D 物体。
它只负责告诉系统“现在识别到了哪个状态”。编辑模块和 AR 模块再决定这个状态对应什么效果。

## 4. 建议目录结构

```text
src/
  app/
    App.tsx
    routes.tsx
  features/
    projects/
    capture/
    ml/
    ar/
    authoring/
    assets/
    testing/
  shared/
    components/
    hooks/
    types/
    utils/
  platform/
    capabilityDetection.ts
    arAdapter.ts
    webxrAdapter.ts
    overlayAdapter.ts
```

## 5. 数据模型草案

```ts
type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  states: InputState[];
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: SerializedRecognitionModel;
  settings?: ProjectSettings;
};

type ProjectSettings = {
  recognitionSensitivity: number;
};

type SerializedRecognitionModel = {
  version: 1;
  classifier: {
    kind: "embedding-centroid-v1";
    centroids: {
      stateId: string;
      vector: number[];
    }[];
  };
};

type InputState = {
  id: string;
  name: string;
  sampleIds: string[];
  order: number;
};

type TrainingSample = {
  id: string;
  stateId: string;
  imageBlobKey: string;
  createdAt: string;
};

type Asset = {
  id: string;
  type: "model3d" | "image2d" | "text" | "audio";
  name: string;
  content?: string;
  localBlobKey?: string;
  url?: string;
  modelId?: BuiltInModel3DId;
  audioId?: BuiltInAudioId;
};

type StateBinding = {
  id: string;
  stateId: string;
  action: OutputAction;
};

type OutputAction = {
  type: "show" | "transform" | "playAudio";
  assetId?: string;
  transform?: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  visible?: boolean;
};

type BuiltInModel3DId = "cube" | "sphere" | "cone" | "tree";
type BuiltInAudioId = "beep" | "success" | "alert";
```

这只是第一版草案。它的重点是给未来扩展留空间，例如用户登录、云同步和玩法系统，
尽量避免以后推倒重来。

## 6. 平台适配层设计

不同手机支持的 AR 能力不同。App 应该用一个适配层隐藏这些复杂差异。

```ts
type ARMode = "webxr" | "camera-overlay" | "screen-only";

type ARAdapter = {
  mode: ARMode;
  isSupported(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
  placeObject(assetId: string): Promise<void>;
  updateObjectTransform(assetId: string, transform: Transform): Promise<void>;
};
```

预期行为：

- Android Chrome 可能使用 `webxr` 模式。
- iOS Safari/PWA 通常使用 `camera-overlay` 或 `screen-only` 模式。
- 鸿蒙浏览器通常使用 `camera-overlay` 或 `screen-only` 模式。
- 未来原生 App 可以继续加入 ARKit、ARCore 和华为 AR Engine 适配器。

## 7. 开发阶段

当前进度（2026-06-23）：

- 阶段 1 到阶段 4 的核心能力已经完成：PWA 外壳、本地项目、摄像头采集、浏览器端训练、编辑器和多种输出类型。
- 阶段 5 已完成相机叠加测试、真实相机识别、稳定识别确认、识别灵敏度、屏幕锚点、3D 预览/叠加、音频触发和状态计数。
- 采集页已支持基础样本管理：查看样本缩略图、点击缩略图放大查看、删除坏样本、撤销删除、批量删除、删除后同步数量，并继续补采。
- 采集页和训练页已支持基础样本质量提示：推荐每个状态至少 5 张，并提示光线、背景、角度和距离。
- 首页项目列表已支持导出 JSON 项目文件和导入 JSON 项目文件；导入会生成新项目副本，不覆盖原项目。
- 测试页已支持状态进入时震动反馈和视觉输出淡入/缩放过渡。
- 当前尚未完成 WebXR 空间 AR、单张重拍、更复杂粒子/动画效果和云同步。
- 最新自动检查通过并已推送的功能提交请以 `git log --oneline -5` 为准；每次功能完成后会自动提交并推送，方便真机测试。

### 阶段 1：项目外壳

- 创建 React + TypeScript + Vite 应用。
- 添加 PWA 配置。
- 搭建手机端优先的导航结构。
- 添加本地项目创建、保存、再次编辑、重命名和删除。

### 阶段 2：摄像头和样本采集

- 请求摄像头权限。
- 显示摄像头预览。
- 添加输入状态管理。
- 为每个状态采集图片样本。
- 将样本保存到本地。
- 在采集页查看每个状态的样本缩略图。
- 点击样本缩略图查看大图，方便确认样本是否拍清楚。
- 删除拍坏样本，并在删除后同步该状态的样本数量。
- 给初学者显示拍样本小贴士，提醒样本数量、光线、背景、角度和距离。

### 阶段 3：浏览器端机器学习

- 接入 TensorFlow.js。
- 加载轻量基础模型。
- 用用户样本训练分类器。
- 把训练后的轻量分类器快照保存到本地项目。
- 从摄像头画面实时推理。
- 显示识别到的状态和置信度。

### 阶段 4：编辑器

- 添加“状态 -> 输出”的编辑器。
- 支持文字、图片、简单 3D 模型和音频输出。
- 文字、2D 图片和 3D 模型输出支持屏幕锚点：横向位置、纵向位置和大小。
- 3D 模型支持旋转角度控制。
- 视觉输出可以附加音频，也可以配置纯音频输出。
- 为每个状态保存输出配置。

### 阶段 5：AR 和实时测试

- 接入 Three.js 渲染。
- 添加相机叠加模式。
- 在相机叠加模式中，先把 `Transform.position` 映射到屏幕百分比，把 `Transform.scale` 映射到显示大小。
- WebXR 模式后续再按设备支持情况添加。
- 根据识别状态触发输出。
- 当前已添加稳定识别确认、低置信度隐藏输出、识别灵敏度滑杆和状态触发计数。
- 后续添加状态切换时的过渡动画。

### 阶段 6：打磨和验证

- 在 Android、iOS 和鸿蒙设备上测试，如果有对应设备的话。
- 优化手机触控操作。
- 添加空状态、错误提示和权限提示。
- 优化性能。

## 8. 测试清单

- App 可以在桌面浏览器打开，方便开发调试。
- App 可以在 Android 手机浏览器打开。
- App 可以在 iOS 手机浏览器打开。
- 如果有鸿蒙设备，App 可以在鸿蒙手机浏览器打开。
- 摄像头权限流程正常。
- 用户可以创建两个状态，并自定义状态名称。
- 用户可以在编辑状态名称时正常清空、删除首字或最后一个字。
- 用户可以为每个状态采集样本。
- 用户可以查看已采集样本，放大查看样本，删除拍坏样本，并补采新的样本。
- 用户可以撤销刚删除的样本，也可以批量选择多张样本后一次删除。
- 用户可以看到样本质量提示，知道每个状态建议拍几张、怎样拍得更容易识别。
- 用户可以训练模型。
- 用户可以运行实时识别。
- 用户可以把不同输出绑定到不同状态。
- 用户可以配置文字、图片、3D 模型、纯音频和视觉输出附加音频。
- 用户可以调整每个视觉输出在相机画面中的位置、大小和 3D 旋转。
- 用户可以调节识别灵敏度。
- 用户可以查看和重置状态触发计数。
- 用户可以保存当前项目，并从首页继续编辑、重命名或删除已保存项目。
- 用户可以导出项目 JSON 文件，也可以导入之前导出的 JSON 文件生成新项目副本。
- 保存前训练成功的项目，重新打开后可以继续启动真实相机识别。
- 识别状态变化时，输出也会变化。
- 识别进入某个状态时，支持手机震动反馈；视觉 AR 输出出现时应有简单过渡。
- 未识别到已训练状态或置信度不足时，不应显示虚拟物体。
- 用户拒绝摄像头权限时，App 能给出清晰提示。
- 当前设备不支持 WebXR 时，App 能自动降级。

## 9. 实用注意事项

- 真机上的摄像头和 AR 功能通常需要 HTTPS。
- 本地开发可以用 localhost，但手机测试可能需要本地 HTTPS、局域网访问或部署预览地址。
- 默认线上真机测试地址是 `https://leaflit.github.io/ar-builder/`。
- 为了避免手机浏览器或 PWA 缓存旧版本，部署后建议使用防缓存地址：`https://leaflit.github.io/ar-builder/?v=最新提交短哈希`。
- 如果代码只在本地改完、还没有提交推送到 `main`，线上测试地址不会出现这些新改动；需要先推送并等待 GitHub Actions 发布完成。
- 浏览器端机器学习在旧手机上可能较慢。第一版应先使用较小图片尺寸和适中的样本数量。
- 训练样本质量很重要。界面应该提醒用户尽量覆盖不同光线、角度和背景。
- 本机项目保存在当前浏览器的 IndexedDB 中，包含素材、绑定和轻量识别模型快照；换设备、换浏览器或清除站点数据后不会自动保留。需要换设备或备份时，优先使用首页的项目导出 / 导入功能。
- 第一版定位是快速原型工具，不是工业级计算机视觉系统。

## 10. 交付说明规则

以后每次完成开发或文档改动后，给用户的收尾说明必须尽量用中文写清楚：

1. 本次做了什么。
2. 已运行哪些检查命令，以及是否通过。
3. 如果需要真机测试，列出需要测试的具体功能。
4. 如果需要真机测试，给出测试地址：
   - 默认线上测试地址：`https://leaflit.github.io/ar-builder/`
   - 防缓存测试地址模板：`https://leaflit.github.io/ar-builder/?v=最新提交短哈希`
5. 默认在检查通过后自动提交并推送到当前远端分支，方便用户尽快真机测试；除非用户明确要求“不要提交 / 不要推送 / 先别动 Git”。
6. 推送后提醒用户等待 GitHub Actions 发布完成，再使用线上测试地址。

## 11. 未来工程扩展点

从第一版开始就建议保留这些接口，即使暂时不完整实现：

- 登录服务接口。
- 项目仓库接口。
- 素材存储接口。
- AR 适配器接口。
- 规则引擎接口。
- 项目导入/导出格式。
- 使用数据统计接口，方便未来做可用性分析。
## 2026-06-23 补充：多状态实现说明

- 状态数据仍然使用 `Project.states` 和应用内 `state.states`。
- `src/features/projects/projectStates.ts` 负责统一规范化状态：旧项目会补齐状态 A / B，额外状态最多保留到 4 个。
- 新增状态使用稳定 id：`state_3`、`state_4`。
- 默认状态 A / B 不能删除；额外状态可以删除。
- 删除额外状态时，reducer 需要同步清理该状态的 `sampleCounts`、输出 `assets`、`bindings` 和 `recognitionModel`，避免测试页继续使用旧模型。
- 采集、训练、编辑、测试页面都应继续从 `states` 数组渲染，不要重新写死状态 A / B。
