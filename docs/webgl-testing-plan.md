# WebGL 迁移测试与性能优化计划

## 1. 测试目标 (Testing Goals)

本计划旨在验证 WebGL 渲染后端的功能正确性、兼容性及性能表现，确保从 Canvas 2D 平滑迁移，并验证回退机制的可靠性。

*   **功能正确性 (Functionality)**: 确保 WebGL 渲染结果与 Canvas 2D 在视觉上保持一致（位置、颜色、透明度、层级、特效）。
*   **兼容性 (Compatibility)**: 覆盖主流浏览器与硬件配置，确保广泛支持。
*   **性能指标 (Performance)**: 验证 WebGL 在高负载下的性能优势（FPS、CPU/GPU 占用），确立性能基准。
*   **稳定性 (Stability)**: 验证长时间运行下的内存管理（纹理缓存）及异常处理（回退机制）。

## 2. 环境矩阵 (Environment Matrix)

测试需覆盖以下组合，优先保证 **Tier 1** 环境的通过率。

| 维度 | 类别 | 详情 | 优先级 |
| :--- | :--- | :--- | :--- |
| **浏览器** | Blink | Chrome / Edge (Latest) | **Tier 1** |
| | Gecko | Firefox (Latest) | Tier 2 |
| | WebKit | Safari (macOS/iOS) | Tier 2 |
| **硬件** | 桌面端 | 独立显卡 (NVIDIA/AMD) | **Tier 1** |
| | 桌面端 | 集成显卡 (Intel UHD/Iris) | Tier 1 |
| | 移动端 | 高通/苹果/联发科 (如适用) | Tier 3 |
| **配置** | WebGL | `useWebGL = true` (默认) | **Tier 1** |
| | Fallback | `useWebGL = false` (强制 Canvas) | Tier 1 |

## 3. 测试清单 (Test Checklist)

### 3.1 渲染正确性 (Rendering Correctness)

*   **基本图元**:
    *   [ ] **静态精灵**: 验证防御塔、植物、背景图渲染无拉伸、模糊或伪影。
    *   [ ] **变换测试**: 验证 `scale` (缩放), `translate` (位移), `rotate` (旋转) 效果是否准确。
    *   [ ] **透明度**: 验证 `globalAlpha` 及纹理自带 Alpha 通道的混合效果 (Blend Mode: `SRC_ALPHA`, `ONE_MINUS_SRC_ALPHA`)。
    *   [ ] **层级 (Z-Index)**: 验证 `GameBattlefield` 中的物体遮挡关系（如：植物在格子之上，子弹在植物之上）。

*   **特效系统 (Effects)**:
    *   [ ] **受击闪光 (Damaged)**: 验证亮度提升滤镜效果。
    *   [ ] **冰冻效果 (Freezing)**: 验证蓝色色调偏移效果。
    *   [ ] **镜像反转 (Mirror)**: 验证纹理水平翻转。
    *   [ ] **透明渐变 (Opacity)**: 验证幽灵/隐形单位的半透明渲染。
    *   *注：目前特效在 `EventHandler` 中通过离屏 Canvas 生成 ImageBitmap，TextureManager 需验证能正确上传这些动态生成的 Bitmap。*

*   **文本与 UI**:
    *   [ ] **HUD 渲染**: 验证阳光数值、冷却遮罩、卡槽图标是否清晰。
    *   [ ] **Canvas 混用**: 验证 WebGL 层 (背景/战斗) 与 DOM UI 层 (菜单/弹窗) 的叠加是否正常。

### 3.2 交互功能 (Interaction)

*   [ ] **鼠标拾取**: 验证 `GameBattlefield` 的坐标转换（`Screen -> World`）在 WebGL 缩放模式下是否准确（点击植物/收集阳光）。
*   [ ] **放置防御塔**: 拖拽植物卡片时，随动图标（Cursor Tracking）渲染是否跟手。
*   [ ] **子弹发射与碰撞**: 验证子弹轨迹渲染流畅，碰撞判定位置与渲染位置一致。
*   [ ] **视野剪裁**: 验证屏幕外的物体是否被正确剔除（虽然 GPU 会处理，但需确认逻辑层未过度剔除）。

### 3.3 回退机制 (Fallback Mechanism)

*   [ ] **初始化失败**: 模拟 `canvas.getContext('webgl')` 返回 `null`，验证游戏自动切回 Canvas 2D 模式且无报错。
*   [ ] **上下文丢失 (Context Lost)**: *（进阶）* 模拟 `webglcontextlost` 事件，验证游戏是否崩溃或能尝试恢复/回退（目前代码暂未处理，需记录为风险）。

### 3.4 资源管理 (Resource Management)

*   [ ] **纹理上传**: 验证 POT (2的幂次) 与 NPOT 纹理的上传与采样参数（NPOT 应使用 `CLAMP_TO_EDGE`）。
*   [ ] **LRU 缓存**: 
    *   加载超过 100 张不同纹理（`TextureManager` 默认上限）。
    *   验证旧纹理是否被 `gl.deleteTexture` 释放。
    *   验证再次使用已驱逐纹理时是否自动重新上传。
*   [ ] **内存泄漏**: 长时间挂机（10分钟+），监控 GPU 内存占用是否稳定。

## 4. 性能基准 (Performance Benchmarks)

### 4.1 目标指标
*   **FPS**: 稳定 60 FPS (无大量单位时)，复杂场景（50+ 单位）下 > 45 FPS。
*   **Draw Calls**:
    *   静态场景 < 10 Calls/Frame (依靠 SpriteBatcher 合批)。
    *   战斗场景 < 50 Calls/Frame。
*   **CPU 占用**: 相比 Canvas 2D 降低 30% 以上（主线程渲染开销减少）。

### 4.2 测量方法
*   **工具**: Chrome DevTools (Performance 面板), Spector.js (查看 Draw Calls), `console.time` 插桩。
*   **Draw Call 验证**: 在 `SpriteBatcher.flush()` 中添加计数器日志，每秒输出一次。
*   **SpriteBatcher 效率**: 验证同一纹理连续绘制是否只产生 1 次 Draw Call。

## 5. 自动化脚本构想 (Smoke Test Automation)

使用 Puppeteer 进行冒烟测试，确保基本流程不崩。

```javascript
// pseudo-code: smoke-test.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 1. 启用 WebGL 访问页面
  await page.goto('http://localhost:5000/?useWebGL=true');
  
  // 2. 等待游戏加载完成 (监听 console 或 检查 DOM)
  await page.waitForSelector('#town'); 
  
  // 3. 进入战斗 (点击"开始" -> "第一关")
  await page.click('#home-btn'); // 假设 ID
  await page.click('#level-1-btn');
  
  // 4. 性能采样
  await page.tracing.start({ path: 'profile.json' });
  await page.waitForTimeout(5000); // 运行 5 秒
  await page.tracing.stop();
  
  // 5. 检查错误日志
  const errors = []; 
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  // 6. 验证结果
  if (errors.length > 0) console.error('Smoke Test Failed:', errors);
  else console.log('Smoke Test Passed');
  
  await browser.close();
})();
```

## 6. 回归策略 (Regression Strategy)

1.  **Pre-Commit**: 开发人员自测 Tier 1 环境，确保 `SpriteBatcher` 无显式报错。
2.  **Nightly/Weekly**: 运行自动化 Smoke Test，覆盖 WebGL 和 Canvas 两种模式。
3.  **Release Candidate**:
    *   在低端机型（模拟或真机）上进行压力测试。
    *   手动测试 UI 交互细节（拖拽、特效）。

## 7. 风险与缓解措施 (Risks & Mitigation)

| 风险点 | 影响 | 缓解措施 |
| :--- | :--- | :--- |
| **NPOT 纹理兼容性** | 部分旧设备不支持 NPOT 或 Mipmap 生成失败 | `TextureManager` 已检测 NPOT 并强制设置 `CLAMP_TO_EDGE` + `LINEAR` (无 Mipmap)。 |
| **纹理频繁切换中断合批** | Draw Calls 激增，性能下降 | 优化资源图集 (Texture Atlas)；在渲染层对精灵按纹理 ID 排序（需权衡 Z-Index 正确性）。 |
| **上下文丢失 (Context Lost)** | 游戏白屏或卡死 | 监听 `webglcontextlost`，简单策略是重载页面或尝试重建 Renderer；当前阶段建议弹窗提示刷新。 |
| **内存溢出** | 浏览器崩溃 | 严格验证 `TextureManager` LRU 逻辑；限制最大纹理尺寸。 |
| **着色器编译失败** | 无法渲染 | 保留 `try-catch` 包裹 WebGL 初始化代码，失败时无缝降级至 Canvas 2D。 |

## 8. 下一步执行建议

1.  **集成测试脚本**: 编写上述 Puppeteer 脚本并集成到 CI/CD 或本地测试流。
2.  **插桩统计**: 在 `GameBattlefield` 或 `WebGLRenderer` 中添加临时的 FPS 和 DrawCall 统计面板 (Debug Overlay)。
3.  **图集优化**: 观察 Draw Call 数据，如果过高，考虑引入纹理打包工具生成 Sprite Sheet，减少纹理切换。