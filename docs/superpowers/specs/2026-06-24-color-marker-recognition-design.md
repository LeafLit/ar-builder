# Color Marker Recognition Spike Design

## 背景

Mate40 实测不支持 WebXR immersive-ar，所以主干继续优先保证“手机浏览器 PWA + 真实摄像头识别 + 屏幕锚点 AR 叠加”。为了提升实机稳定性，本轮先增加一个不依赖 WebXR、也不依赖新第三方库的稳定输入方式：颜色标记识别。

## 目标

- 在测试页提供“颜色标记”实验模式。
- 用户把红、绿、蓝色纸片或色块放到摄像头画面中央区域时，可以触发前几个状态。
- 颜色识别触发后复用现有 AR 输出、状态计数、震动和音频逻辑。
- 不影响原有训练模型识别，用户可以随时切回“相机分类”。

## 范围

v1 只识别中央区域的红、绿、蓝三类颜色：

- 红色标记 -> 第 1 个状态。
- 绿色标记 -> 第 2 个状态。
- 蓝色标记 -> 第 3 个状态，如果项目有第 3 个状态。

如果中央区域颜色不明显，recognizer 不输出结果，测试页继续显示“未识别到已训练状态”一类的等待提示。

## 架构

- `colorMarkerRecognizer.ts` 提供纯函数 `detectColorMarker` 和 `createColorMarkerRecognizer`。
- `detectColorMarker` 接收 `ImageData`，只分析像素数据，不接触 DOM，方便单元测试。
- `createColorMarkerRecognizer` 复用现有 `CameraService` 启停摄像头，并按照固定间隔分析视频帧。
- `TestScreen` 新增输入模式切换：训练模型识别 / 颜色标记识别。启动自动识别时根据当前模式选择 recognizer。

## 降级与限制

- 颜色标记需要光线足够清楚，纸片颜色尽量纯。
- v1 不支持用户自定义颜色到状态的映射。
- v1 不保存模式到项目设置，先作为现场调试实验入口。
- 后续如果颜色标记实测稳定，再考虑加入二维码或图片标记。
