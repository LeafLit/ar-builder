# 项目级识别灵敏度保存设计

## 背景

AR Builder 已经在线上加入“识别灵敏度”滑杆，华为 Mate40 真机测试通过。当前滑杆值只存在实时测试页的组件状态里，用户离开页面、刷新页面或重新打开本机项目后，会回到默认 85%。现场调好的值不能跟随项目保存。

## 目标

- 每个 AR 原型项目独立保存识别灵敏度。
- 默认灵敏度继续保持 85%。
- 旧项目没有设置字段时，自动使用默认值，不影响打开。
- 滑杆调整后立即影响当前相机识别结果。
- 用户点击“保存项目”后，灵敏度随项目保存到本机 IndexedDB。
- 文案继续面向小白用户，保持中文清晰。

## 非目标

- 不做账号登录、云同步或跨设备同步。
- 不调整现有置信度算法。
- 不引入连续多帧确认机制。
- 不改变当前 50% 到 100% 的滑杆范围和 5% 步长。

## 方案

采用项目级设置对象：

```ts
type ProjectSettings = {
  recognitionSensitivity: number;
};
```

`Project` 增加可选字段 `settings?: ProjectSettings`。使用可选字段是为了兼容旧项目数据。`AppState` 增加必填 `settings`，默认值为：

```ts
{
  recognitionSensitivity: 85
}
```

测试页 `TestScreen` 不再独自保存灵敏度，而是从 App 接收当前值和更新回调。用户拖动滑杆时，`TestScreen` 立即用新值计算识别阈值，同时通过回调更新 App 状态。保存项目时，`createProjectFromAppState` 把 `state.settings` 写入项目快照。打开项目时，`restoreStateFromProject` 和 reducer 的 `loadProject` 都会用项目设置覆盖默认设置；如果项目没有设置，使用默认 85%。

## 数据流

1. App 初始化时使用默认设置。
2. 用户进入实时测试页，滑杆显示 `state.settings.recognitionSensitivity`。
3. 用户拖动滑杆，`TestScreen` 调用 `onRecognitionSensitivityChange(nextValue)`。
4. App reducer 保存新值，测试页重新渲染，新阈值即时生效。
5. 用户点击“保存项目”，项目快照包含 `settings.recognitionSensitivity`。
6. 用户下次打开该项目，App 从项目设置恢复滑杆值。

## 兼容与校验

旧项目可能没有 `settings`，也可能以后出现非法值。恢复项目时只接受 50 到 100 之间的有限数字；否则回退到默认 85%。这样可以防止本机 IndexedDB 中的旧数据或异常数据影响测试页。

## 测试计划

- `appState`：默认状态包含 85%；加载旧项目时回退 85%；加载带设置的项目时恢复对应值；更新灵敏度 action 能修改状态。
- `appProjectSnapshot`：保存项目时写入 settings；恢复项目时恢复 settings；旧项目兼容默认值。
- `TestScreen`：初始显示传入灵敏度；拖动滑杆会调用回调；滑杆变化后仍即时影响当前识别显示。
- `App`：保存并重新打开项目后，测试页能拿到项目保存的灵敏度。

## 验收标准

- 新项目实时测试页默认显示 85%。
- 同一个项目调到 100%、保存、重新打开后仍显示 100%。
- 旧项目没有 `settings` 字段也能正常打开，并显示 85%。
- 现有自动识别、模拟识别、图片输出、屏幕锚点行为不回退。
