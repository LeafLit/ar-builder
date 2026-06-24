# WebXR 空间 AR Spike v1 设计

## 目标

在不破坏现有“相机叠加 + 屏幕锚点 AR”主流程的前提下，增加一个 WebXR 空间 AR 实验入口。支持设备可以进入 `immersive-ar`，并在真实空间里放置一个简单 3D 演示物体；不支持设备显示清楚的降级提示。

## 范围

- 在测试页增加“空间 AR 实验”区域。
- 使用 `navigator.xr.isSessionSupported("immersive-ar")` 检测支持情况。
- 支持时允许用户点击“进入空间 AR”。
- WebXR session 启动后显示“放置演示物体”按钮。
- 用户点击后放置一个简单立方体，先验证空间 AR 渲染链路。
- 退出或组件卸载时停止 WebXR session，清理 Three.js renderer。
- 不支持时显示“当前设备暂不支持 WebXR 空间 AR，继续使用相机叠加模式”。

## 暂不做

- 不把训练识别结果直接绑定到 WebXR 物体。
- 不做平面 hit-test / reticle 精准落点。
- 不替换现有测试页。
- 不承诺 iOS / 鸿蒙支持 WebXR。

## 成功标准

- Android Chrome / 支持 ARCore 和 WebXR 的设备可以启动空间 AR 实验。
- 用户可以放置一个 3D 演示物体。
- 不支持设备不会报错，也不会影响原有相机叠加测试。
- 自动测试覆盖支持、降级、启动、放置、停止清理。
