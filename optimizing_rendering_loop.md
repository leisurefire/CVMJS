# 渲染循环优化方案 (Optimizing Rendering Loop)

## 目标 (Objective)
解决 `GameBattlefield` 中的实体在状态切换时，因下一帧资源尚未加载完成而导致的一帧或多帧“渲染为空（透明）”的问题。

## 核心思路 (Core Strategy)
在渲染循环中，当实体更新状态（`behavior()` 或 `behaviorAnim()`）前，先捕获其当前的 **图像路径 (entity)** 和 **帧索引 (tick)**。在随后的绘制调用中，将这些旧值作为 **回退 (fallback)** 参数传递给 `drawEntity`。如果当前帧的新图像资源尚未加载完毕，则使用回退参数渲染上一帧的图像，从而避免画面闪烁。

## 实施步骤 (Implementation Steps)

### 1. 修改 `drawEntity` 方法签名与逻辑
在 `static/ts/GameBattlefield.ts` 中，更新 `drawEntity` 方法，使其接受可选的回退参数。

```typescript
private drawEntity(
    renderer: IRenderer | CanvasRenderingContext2D, 
    src: string, 
    width: number, 
    height: number, 
    tick: number, 
    x: number, 
    y: number, 
    effect: string | null = null,
    fallbackSrc?: string,      // 新增: 回退图片路径
    fallbackTick?: number      // 新增: 回退帧索引
) {
    // 1. 尝试请求当前帧的图像
    let img = GEH.requestDrawImage(src, effect);
    let currentTick = tick;

    // 2. 如果当前图像未加载，且存在回退方案，则尝试使用回退图像
    if (!img && fallbackSrc && fallbackTick !== undefined) {
        // 避免重复查找相同的未加载资源
        if (src !== fallbackSrc) {
             img = GEH.requestDrawImage(fallbackSrc, effect);
             if (img) {
                 currentTick = fallbackTick; // 使用旧状态对应的帧索引
             }
        }
    }

    // 3. 执行绘制
    if (img) {
        // ... 原有的绘制逻辑，使用 img 和 currentTick ...
    }
}
```

### 2. 更新 `updateMapGrid` (植物/食物渲染)
在 `static/ts/GameBattlefield.ts` 的 `updateMapGrid` 方法中，针对每个层级（layer_0, layer_1, layer_2）：
1.  在调用 `layer.behavior()` 之前，记录 `prevEntity` 和 `prevTick`。
2.  调用 `layer.behavior()` 更新状态。
3.  调用 `drawEntity` 时传入 `prevEntity` 和 `prevTick` 作为回退参数。

### 3. 更新 `updateEnemies` (老鼠/敌人渲染)
在 `static/ts/GameBattlefield.ts` 的 `updateEnemies` 方法中：
1.  在调用 `mouse.behaviorAnim()` 之前，记录 `prevEntity` 和 `prevTick`。
2.  执行状态更新逻辑。
3.  调用 `drawEntity` 时传入 `prevEntity` 和 `prevTick`。

## 预期效果 (Expected Outcome)
-   当实体状态发生变化（例如从 `idle` 变为 `attack`），且 `attack` 序列的第一帧图像尚未加载到内存时，游戏画面将继续显示上一帧的 `idle` 图像，而不是空白。
-   一旦新资源加载完成，画面将自动切换到新状态。
-   这将显著提升游戏的视觉稳定性，特别是在网络加载较慢或首次遇到新状态时。