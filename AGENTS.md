# AGENTS.md

## 概述 (Overview)
- 前端游戏逻辑主要位于 `static/js` 目录下，由多个 TypeScript/ES 模块组成，涵盖 UI 组件、事件路由、关卡循环、实体（卡片、子弹、老鼠）和本地化文本。
- **本项目已基于 TypeScript 构建，非必要请勿直接编辑 js 文件。**
- 代码库依赖基于类的抽象、弱引用缓存和对象池（子弹、阳光、精灵动画）来保持低运行时分配。单例/组合类如 `EventHandler`、`Level` 和 `GameBattlefield` 负责协调资源、渲染和交互。
- **渲染架构**：游戏已完成从纯 Canvas 2D 到 **WebGL 渲染架构**的完整迁移，实现了性能提升和高级视觉特效支持。
- 采用混合渲染策略：
  - **背景层 (WebGL)**：使用 `WebGLRenderer` 渲染大量实体（地图格子、敌人、子弹），以获得最大性能。
  - **前景层 (Canvas 2D)**：处理低频或复杂的矢量更新（UI 覆盖层、提示框、光标交互），利用 Canvas 2D 的便捷性。
- 代码库严格使用 `IRenderer` 抽象接口来确保 WebGL 和 Canvas 2D 上下文之间的兼容性，提供 WebGL 不可用时的优雅回退机制。所有游戏实体已重构为使用统一的渲染接口。

## 文件导览 (File tour)
### `static/js/renderer/IRenderer.ts`
- 定义统一的 `IRenderer` 接口，模拟标准 Canvas 2D 的 `drawImage` API。
- 定义 `RenderEffects` 接口，用于传递特殊的渲染状态（受击变红、冰冻变蓝、镜像反转），这些效果在 WebGL 中通过着色器实现。

### `static/js/renderer/TextureManager.ts`
- 使用 LRU（最近最少使用）缓存策略管理 WebGL 纹理资源（默认最大 100 个纹理）。
- 负责将 `HTMLImageElement` 或 `ImageBitmap` 上传至 GPU。
- 自动处理非 2 的幂（NPOT）纹理（使用边缘钳制）并为 POT 纹理生成 Mipmap。

### `static/js/renderer/SpriteBatcher.ts`
- WebGL 的核心优化类。将多个 `drawImage` 调用聚合到单个几何缓冲区中。
- 在以下情况提交（Flush）批次到 GPU：
  - 纹理发生变更（纹理切换）。
  - 批次缓冲区已满（默认 1000 个精灵）。
  - 显式调用 `flush()`。
- 显著减少 Draw Call，这对于渲染数百个实体至关重要。

### `static/js/renderer/WebGLRenderer.ts`
- `IRenderer` 接口的 WebGL 具体实现。
- 协调 `TextureManager`、`SpriteBatcher` 和着色器程序。
- 管理变换栈（平移、缩放、旋转、保存、恢复）以模拟 Canvas 2D 坐标系。

### `static/js/renderer/shaders.ts`
- 包含顶点（Vertex）和片元（Fragment）着色器的 GLSL 源码。
- 在 GPU 上直接实现自定义视觉效果：
  - **色调（Tints）**：受击反馈（红）、冰冻效果（蓝）。
  - **Alpha 混合**：支持全局透明度。
  - **镜像**：支持 X 轴翻转。

### `static/js/Core.ts`
- 定义遵循 Material Design 3 原则的自定义 Web 组件：`MaterialButton`, `MaterialIconButton`, `MaterialDialog`, `MaterialCard` 等。
- 导出全局 `GEH = new EventHandler()` 并设置 `GameReadyPage` 流程。
- 组件利用 Shadow DOM 进行封装，并使用 `:host` 选择器隔离样式。

### `static/js/EventHandler.ts`
- 中央运行时协调器，处理输入、资产预取、IndexedDB 图像缓存、音频播放（WebAudio + 节流）、本地存档/配置存储、卡包和商店逻辑。
- 维护全局状态（缩放、速度、当前页面、卡组大小）。
- 实现了 `getStaticPath` 静态方法用于统一资源路径解析。

### `static/js/Level.ts`
- 关卡基类：管理波次、生成、输赢规则、自动阳光生产、迷雾和对象池（子弹/阳光）。
- 拥有 `SpriteAnimationManager` 实例，委托所有动画管理（池化、渲染、调度）。
- 与 `GameBattlefield` 协作刷新背景/前景层、地图网格、敌人和子弹。
- 动画生命周期：`createSpriteAnimation()` → 委托给 `SpriteAnimationManager.playAnimation()` → 通过 `updateAnimations()` 调度更新。

### `static/js/GameBattlefield.ts`
- 拥有 Canvas 图层和 HUD 控件（卡槽、铲子、阳光条、波次条、暂停/退出）以及放置/光标交互。
- 初始化渲染上下文：如果支持且启用，则使用 `WebGLRenderer`，否则回退到 `CanvasRenderingContext2D`。
- 管理 `Canvas`（背景/主游戏，使用 WebGL）和 `FrequentCanvas`（前景/UI，使用 2D）。
- 实现倒计时动画、Boss 血条、胜利/失败覆盖层，以及 `Sun` 和 `MapGrid` 等实体助手。

### `static/js/Foods.ts` / `static/js/Mice.ts` / `static/js/Bullets.ts`
- 实体类现在实现了与底层渲染器无关的绘制逻辑。
- `drawEntity` 或 `behavior` 方法接受 `IRenderer | CanvasRenderingContext2D`。
- 使用类型守卫（Type Guards）仅在 WebGL 模式下传递高级特效参数（如 `effects`）。
- 包含所有防御卡、敌人类型和子弹变体的定义及逻辑。

### `static/js/SpriteAnimation.ts`
- **SpriteAnimation 类**：轻量级精灵动画实例，支持 WebP 帧、切片精灵图、SVG 和传统精灵图。
- **SpriteAnimationManager 类**：集中管理动画生命周期、池化和渲染栈。
- 更新了 `render` 方法以支持 `IRenderer`，允许动画进入 WebGL 批处理管线。
- 修复了对象池复用时的状态清理问题。

### `static/js/language/Chinese.ts`
- 集中管理 UI 字符串、提示、错误代码和其他本地化文本，便于复用。

## 关系与架构 (Relationships / Architecture)
- **Core** → **EventHandler** → **Level**/**GameBattlefield** 构成了从 UI 入口到游戏循环的主管线。
- **渲染器抽象**：`WebGLRenderer` 实现了 `IRenderer`。游戏逻辑与 `IRenderer` 交互，使得实体逻辑对具体的渲染后端透明。
- **批处理管线**：`GameBattlefield` → `WebGLRenderer.drawImage` → `SpriteBatcher.addSprite` → (批次满/纹理切换) → `gl.drawArrays`。
- **纹理流**：`EventHandler` 加载图像 → `TextureManager.uploadTexture` (首次绘制时) → GPU 显存 → `SpriteBatcher` 引用。
- **回退机制**：如果在 `GameBattlefield` 中 WebGL 初始化失败，系统将设置 `useWebGL = false` 并优雅回退到标准 Canvas 2D 上下文。

## 开发指南 (Development Guidelines)

### 渲染逻辑
- 编写或修改涉及绘制的 `render` 或 `behavior` 方法时：
  - 必须使用联合类型 `IRenderer | CanvasRenderingContext2D` 作为上下文参数签名。
  - 在传递 WebGL 特有选项（如 `effects` 对象用于着色）之前，使用类型守卫（如 `isIRenderer(ctx)`）。
  - **不要**假设上下文永远是 Canvas 2D。

### 性能最佳实践
- **保持低 Draw Call**：`SpriteBatcher` 会自动处理批处理，前提是*尽可能连续渲染使用相同纹理的精灵*。
- **纹理图集 / 精灵表**：动画应使用精灵表（Sprite Sheets）而非多张独立图片，以避免频繁的纹理切换（这会强制刷新批次）。
- **对象池**：继续使用已建立的 `Bullets`、`Suns` 和 `SpriteAnimations` 对象池，以减少垃圾回收（GC）造成的卡顿。
- **WebGL 纹理**：纹理在首次 `drawImage` 调用时懒加载上传到 GPU。

## Setup commands
- Install deps: `npm install`
- Type-check the project: `npx tsc --noEmit`

## Code style
- TypeScript strict mode is enforced; keep typings precise and avoid using `any` unless absolutely necessary.
- Match the prevailing formatting: double quotes for strings, semicolons at statement ends, trailing commas in multiline literals.
- Extend gameplay logic via the established class-based patterns (e.g., bullets, foods, mice) and prefer reusing the existing pooling utilities instead of creating ad-hoc instances.
- UI components use `cubic-bezier(0.4, 0, 0.2, 1)` for all animations and transitions to ensure smooth, consistent motion across the interface.

## 近期变更 (Recent Changes)
- **WebGL 迁移完成**：渲染引擎已成功迁移至 WebGL，引入了 `static/js/renderer/*` 核心组件，大幅提升性能。
- **代码清理**：
  - 移除了未使用的 `.js` 构建产物（`Core.js`、`EventHandler.js`、`GameBattlefield.js`、`Level.js`、`Mice.js`、`Foods.js`、`SpriteAnimation.js` 等）。
  - 删除了遗留的 Canvas 2D polyfill（`fillRoundRect`）和过时的兼容性代码。
  - 清理了冗余的类型断言和临时调试代码。
- **严格类型化 (Strict Typing)**：
  - 重构了所有游戏实体（`Level`、`Sun`、`RogueMouse`、`Foods`、`Mice`、`Bullets`）以严格使用 `IRenderer | CanvasRenderingContext2D` 联合类型。
  - 统一了渲染方法签名，确保类型安全和 WebGL 兼容性。
  - 移除了对 Canvas 2D 特定 API 的直接依赖（除回退路径外）。
- **资源路径统一 (EventHandler.ts, Core.ts, GameBattlefield.ts, i18n/index.ts)**：
  - 实现了 `EventHandler.getStaticPath()` 静态方法用于自动路径解析。
  - 自动检测部署环境（GitHub Pages 与 本地服务器），解决了 404 错误。
- **WebP 动画系统 (EventHandler.ts, SpriteAnimation.ts)**：
  - 实现了基于 ImageDecoder API 的 WebP 动画帧解码与缓存。
  - 引入了统一 API `GEH.requestAnimationResource()`，自动检测格式并返回优化后的帧数据。
  - 实现了 LRU 缓存管理。
- **requestDrawImage WebP 支持 (EventHandler.ts)**：
  - 添加了 `tryWebP` 参数用于显式 WebP 开启（仅针对 PNG 文件）。
  - 自动回退机制：当 WebP 加载失败时回退到 PNG。
- **SpriteAnimation 架构重构 (SpriteAnimation.ts, Level.ts)**：
  - 将动画管理提取到独立的 `SpriteAnimationManager` 类中。
  - 修复了对象池复用时的关键 Bug（`reset` 清理 `#tick` 和 `_img` 缓存）。
- **子弹池安全性 (Bullets.ts)**：添加了 `Stone.reset` 实现，防止 `acquireBullet` 中的未定义错误。
- **动画优化 (Core.ts)**：重构了组件动画以使用 `cubic-bezier(0.4, 0, 0.2, 1)` 时间函数。

## 完成 (Finish)
- 运行 `npx tsc` 进行编译。
- 如果逻辑有修改或有新内容添加，请提议修改 `AGENTS.md`。