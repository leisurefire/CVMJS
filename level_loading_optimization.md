# 关卡加载阶段渲染优化 (Level Loading Rendering Optimization)

## 目标 (Objective)
通过在关卡加载阶段预加载和预渲染关键资源，确保游戏开始时所有必要的实体图像都已准备就绪，从而避免首次渲染时的空白或透明问题。

## 核心策略 (Core Strategy)
1.  **扩展资源预加载列表**：不仅加载实体的默认状态（如 `idle`），还要根据关卡配置预判可能出现的其他状态（如 `attack`），并将其加入预加载队列。
2.  **预渲染关键帧**：对于使用精灵图或 WebP 动画的实体，在加载阶段预先解码第一帧或关键帧，确保 `drawEntity` 首次调用时无需等待解码。
3.  **利用 `Level.LoadAssets`**：利用现有的 `LoadAssets` 方法，注入更全面的资源路径。

## 实施步骤 (Implementation Steps)

### 1. 增强 `Level.LoadAssets` (static/ts/Level.ts)
目前 `LoadAssets` 主要加载基础资源和卡片/老鼠的默认资源。我们需要扩展它以支持更智能的预加载。

*   **扫描卡片与敌人**：遍历本关卡配置的所有卡片 (`this.#Cards`) 和老鼠类型 (`this.#MouseType`)。
*   **全面获取资源路径**：
    *   对于 **Food (植物/防御塔)**：除了 `idle`，根据其特性预加载 `attack`, `produce` 等常见状态。检查 `FoodDetails` 中的 `assets` 列表，尽可能全部预加载。
    *   对于 **Mouse (老鼠/敌人)**：除了 `idle` 和 `walk`，预加载 `attack`, `die` 等关键状态。
    *   **弹丸 (Bullets)**：预加载植物可能发射的子弹资源。这需要建立植物与子弹的关联映射，或者在 `LoadAssets` 中硬编码常见子弹资源。

### 2. 优化 `EventHandler.requestImageCache` (static/ts/eventhandler/EventHandler.ts)
确保 `requestImageCache` 在资源加载完成后，如果资源是精灵图或 WebP，能触发预解码。

*   **预解码 WebP**：如果在 `LoadAssets` 中请求了 `.webp` 文件，确保 `requestWebPFrames` 被调用，以便第一帧进入 `webpFrameCache`。
*   **预处理精灵图**：对于关键的精灵图，可以考虑在加载时就生成 `ImageBitmap` 切片（虽然这会增加内存占用，但能提升渲染性能）。

### 3. 建立“关键状态”白名单
为了避免加载过多不常用的资源（如罕见的受击特效），可以为每种实体定义“关键状态”列表。

*   **Food**: `idle`, `attack`
*   **Mouse**: `idle`, `walk`, `attack`
*   **Bullet**: `idle` (飞行状态), `hit` (击中特效)

在 `LoadAssets` 中优先加载这些状态的资源。

### 4. 示例代码逻辑 (Level.ts)

```typescript
// 在 Level.LoadAssets 中添加：

// 1. 预加载所有卡片的关键状态
for (let i = 0; i < this.#Cards.length; i++) {
    const card = getFoodDetails(this.#Cards[i].type);
    // 假设我们扩展了 getFoodDetails 返回的数据，包含所有 asset 列表
    const assets = card.assets || ["idle", "attack"]; 
    for (const asset of assets) {
        const src = normalizeAssetPath(`/images/foods/${card.name}/${asset}.png`); // 或 .webp
        assetsToLoad.push(src);
    }
    // TODO: 预加载该植物对应的子弹资源
}

// 2. 预加载本关所有老鼠的关键状态
for (let i = 0; i < this.#MouseType.length; i++) {
    const mouse = getMouseDetails(this.#MouseType[i]);
    const assets = mouse.assets || ["idle", "run", "attack"];
    for (const asset of assets) {
        const src = normalizeAssetPath(`/images/mice/${mouse.eName}/${asset}.png`); // 或 .webp
        assetsToLoad.push(src);
    }
}

// 3. 预加载通用特效
assetsToLoad.push(normalizeAssetPath("/images/bullets/common_hit.png"));
// ... 其他通用资源
```

## 结合运行时优化
此“加载阶段优化”与之前的“运行时回退机制”是互补的：
*   **加载阶段**保证了初始状态和常见状态的资源就绪。
*   **运行时回退**作为最后一道防线，处理那些未能预加载或动态生成的资源（如罕见状态、动态生成的子弹变体）。

通过这两者的结合，可以最大程度地消除游戏中的“白块”或透明闪烁现象。