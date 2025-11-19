# WebP显式启用策略方案

## 1. 问题分析

### 1.1 当前问题
- `EventHandler.requestDrawImage()` 默认将所有 `.png` 资源自动替换为 `.webp`
- Foods/Mice 中的横排Sprite被误认为单帧图,导致渲染错误
- 用户要求: WebP默认不启用,只有显式传参才启用

### 1.2 根本原因
```typescript
// EventHandler.ts 第552-572行
requestDrawImage(src: string, effect: string | null = null, intensity: number | null = null) {
    let actualSrc = src;
    
    // 问题所在: 自动尝试WebP版本
    if (src.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
        actualSrc = src.replace(/\.png$/, '.webp');
    }
    // ...
}
```

## 2. 新的资源加载策略

### 2.1 设计原则
1. **显式优于隐式**: WebP必须通过参数显式启用
2. **向后兼容**: 现有PNG调用保持不变
3. **最小改动**: 只修改必要的接口,不破坏现有架构
4. **清晰职责**: 
   - `requestDrawImage()`: 加载单帧图片,默认PNG
   - `requestAnimationResource()`: 加载动画资源,支持WebP显式启用

### 2.2 接口设计

#### 方案A: 添加可选参数 (推荐)
```typescript
// EventHandler.ts
requestDrawImage(
    src: string, 
    effect: string | null = null, 
    intensity: number | null = null,
    tryWebP: boolean = false  // 新增参数,默认false
): ImageBitmap | null
```

**优势**:
- 最小侵入性
- 向后兼容100%
- 调用方可选择性启用WebP

**调整逻辑**:
```typescript
requestDrawImage(src: string, effect: string | null = null, intensity: number | null = null, tryWebP: boolean = false) {
    let actualSrc = src;
    
    // 只有显式传入 tryWebP=true 才尝试WebP
    if (tryWebP && src.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
        actualSrc = src.replace(/\.png$/, '.webp');
    }
    
    // 其余逻辑保持不变
    // ...
}
```

#### 方案B: 独立WebP方法 (备选)
```typescript
// EventHandler.ts
requestDrawImageWebP(src: string, effect?: string | null, intensity?: number | null): ImageBitmap | null {
    const webpSrc = src.replace(/\.png$/, '.webp');
    return this.requestDrawImage(webpSrc, effect, intensity, false);
}
```

**劣势**: 增加API复杂度,不推荐

## 3. 需要修改的文件与接口

### 3.1 核心修改: EventHandler.ts

#### 修改1: requestDrawImage() 签名
```typescript
// 第552行
requestDrawImage(
    src: string, 
    effect: string | null = null, 
    intensity: number | null = null,
    tryWebP: boolean = false  // 新增
): ImageBitmap | null
```

#### 修改2: requestDrawImage() 实现
```typescript
// 第552-572行
requestDrawImage(src: string, effect: string | null = null, intensity: number | null = null, tryWebP: boolean = false) {
    let actualSrc = src;
    
    // 修改: 只有显式启用才尝试WebP
    if (tryWebP && src.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
        actualSrc = src.replace(/\.png$/, '.webp');
    }
    
    const effectKey = effect !== null ? `${actualSrc}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` : actualSrc;
    
    if (EventHandler.#images.has(effectKey)) {
        return EventHandler.#images.get(effectKey);
    } else {
        this.requestImageCache(actualSrc, effect, intensity).catch(() => {
            if (actualSrc !== src) {
                EventHandler.#webpFallbackCache.add(src);
                this.requestImageCache(src, effect, intensity);
            }
        });
        return null;
    }
}
```

#### 修改3: requestAnimationResource() 保持不变
```typescript
// 第849-871行 - 无需修改
// 此方法已通过 options.isWebP 显式控制WebP
async requestAnimationResource(src: string, frames: number, options?: {...}): Promise<ImageBitmap[] | null>
```

### 3.2 可选修改: 调用方启用WebP

#### 场景1: 背景动画 (mapMove)
```typescript
// Level.ts 或具体关卡文件
mapMove() {
    const IMG = GEH.requestDrawImage(ANIM.SRC, null, null, true);  // 显式启用WebP
    // ...
}
```

#### 场景2: 实体渲染 (Foods/Mice)
```typescript
// GameBattlefield.ts 第1324-1328行
updateMapGrid(mapGrid: MapGrid<Food>) {
    // ...
    const img = GEH.requestDrawImage(layer_1.entity);  // 保持默认PNG
    // ...
}
```

#### 场景3: 特效动画 (已通过 requestAnimationResource)
```typescript
// Level.ts
createSpriteAnimation(x, y, src, frames, { isWebP: true });  // 已支持,无需改动
```

## 4. 兼容性影响评估

### 4.1 对现有PNG资产的影响
- **影响**: 无
- **原因**: 默认 `tryWebP=false`,所有现有调用保持PNG加载

### 4.2 对已有WebP动画的影响
- **影响**: 无
- **原因**: `requestAnimationResource()` 已通过 `options.isWebP` 显式控制

### 4.3 对调用方的改造成本
- **零成本场景**: 不需要WebP的调用方 (99%的代码)
- **低成本场景**: 需要WebP的调用方,添加第4个参数 `true`

### 4.4 对缓存/LRU逻辑的影响
- **影响**: 无
- **原因**: 
  - `#webpFallbackCache` 仍正常工作
  - `#webpFrameCache` 和 `#spriteSliceCache` 不受影响

## 5. 实施计划

### 5.1 变更摘要
| 文件 | 修改类型 | 优先级 | 风险 |
|------|---------|--------|------|
| `EventHandler.ts` | 接口扩展 | P0 | 低 |
| 调用方 (可选) | 参数添加 | P1 | 无 |

### 5.2 具体修改步骤

#### 步骤1: 修改 EventHandler.ts (P0)
1. 定位到第552行 `requestDrawImage()` 方法
2. 添加第4个参数 `tryWebP: boolean = false`
3. 修改第555-557行的WebP尝试逻辑:
   ```typescript
   // 修改前
   if (src.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
   
   // 修改后
   if (tryWebP && src.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
   ```
4. 保存文件

#### 步骤2: 编译验证 (P0)
```bash
npx tsc --noEmit
```
预期: 无类型错误

#### 步骤3: 功能测试 (P0)
- 测试场景1: 加载PNG Sprite (Foods/Mice)
  - 预期: 正常渲染,不尝试WebP
- 测试场景2: 显式启用WebP
  - 预期: 成功加载WebP,失败时降级PNG
- 测试场景3: WebP动画 (SpriteAnimation)
  - 预期: 通过 `requestAnimationResource()` 正常工作

#### 步骤4: 可选优化 - 启用WebP (P1)
根据性能需求,选择性为以下场景启用WebP:
- 背景动画 (mapMove): 添加 `tryWebP: true`
- 特定实体: 添加 `tryWebP: true`

**注意**: 此步骤非必需,可根据实际需求决定

### 5.3 风险与回滚策略

#### 风险评估
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 类型错误 | 低 | 中 | TypeScript编译检查 |
| 运行时错误 | 极低 | 低 | 默认值保证向后兼容 |
| 性能退化 | 无 | 无 | 默认行为不变 |

#### 回滚策略
如果出现问题,回滚步骤:
1. 恢复 `EventHandler.ts` 第552-572行
2. 删除新增的 `tryWebP` 参数
3. 重新编译: `npx tsc`

**回滚时间**: < 5分钟

### 5.4 验证方案

#### 编译验证
```bash
npx tsc --noEmit
```
预期输出: 无错误

#### 运行时验证
1. 启动游戏
2. 进入任意关卡
3. 观察以下内容:
   - Foods/Mice 正常渲染 (PNG Sprite)
   - 背景动画正常播放
   - 特效动画正常播放
4. 打开浏览器开发者工具 Network 面板
5. 确认:
   - 默认加载 `.png` 文件
   - 没有自动尝试 `.webp` 文件

#### 特定场景测试
**测试1: PNG Sprite渲染**
- 操作: 放置任意防御卡 (如Stove)
- 预期: 正常显示,无闪烁
- 验证: Network面板只加载 `stove/idle.png`

**测试2: WebP动画 (如果已转换)**
- 操作: 触发特效动画
- 预期: 正常播放
- 验证: 通过 `requestAnimationResource()` 加载

**测试3: 显式启用WebP (如果实施步骤4)**
- 操作: 修改mapMove添加 `tryWebP: true`
- 预期: 优先加载 `.webp`,失败时降级 `.png`
- 验证: Network面板先尝试 `.webp`,失败后加载 `.png`

## 6. 后续优化建议

### 6.1 性能监控
添加WebP使用统计:
```typescript
// EventHandler.ts
static #webpStats = {
    attempted: 0,
    succeeded: 0,
    failed: 0
};
```

### 6.2 配置化
未来可考虑添加全局配置:
```typescript
// config.ts
export const ENABLE_WEBP_BY_DEFAULT = false;
```

### 6.3 资源迁移
如果需要大规模启用WebP:
1. 转换高频资源为WebP
2. 批量添加 `tryWebP: true` 参数
3. 性能对比测试
4. 逐步推广

## 7. 总结

### 7.1 方案优势
- ✅ 最小侵入性: 只修改1个方法签名
- ✅ 完全向后兼容: 默认行为不变
- ✅ 显式控制: 调用方自主决定是否启用WebP
- ✅ 零风险: 默认值保证现有代码正常运行
- ✅ 易于回滚: 修改量小,回滚简单

### 7.2 实施时间估算
- 核心修改 (步骤1-3): 30分钟
- 测试验证: 30分钟
- 可选优化 (步骤4): 按需进行
- **总计**: 1小时 (不含可选优化)

### 7.3 关键决策
1. **采用方案A** (添加可选参数) 而非方案B (独立方法)
2. **默认值为false** 确保向后兼容
3. **保持 requestAnimationResource() 不变** 避免破坏现有WebP动画
4. **可选启用WebP** 给予调用方灵活性

---

**文档版本**: 1.0  
**创建时间**: 2025-11-19  
**状态**: 待审核  
**下一步**: 提交Code模式实施