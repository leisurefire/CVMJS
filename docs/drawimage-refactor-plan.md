# drawImage/requestDrawImage 资源路径统一重构方案

## 1. 概述

本方案旨在系统性地升级项目中所有 `drawImage`/`requestDrawImage`/`requestAnimationResource` 调用,移除旧的路径前缀(`../CVMJS/static`等)与类型后缀,统一到新的资源解析流程。

### 目标
- 移除所有硬编码的 `../CVMJS/static` 路径前缀
- 统一资源路径格式为 `/images/...` 起始
- 默认使用 PNG 格式,通过参数显式切换 WebP/SVG
- 利用 `requestDrawImage` 的 WebP 自动回退机制
- 保持代码简洁性和可维护性

## 2. 影响范围识别

### 2.1 搜索策略
通过以下正则表达式系统性查找所有需要修改的位置:

```bash
# 搜索旧路径前缀
grep -r "\.\.\/CVMJS\/static" static/js/*.ts

# 搜索 requestDrawImage 调用
grep -r "requestDrawImage" static/js/*.ts

# 搜索 requestAnimationResource 调用  
grep -r "requestAnimationResource" static/js/*.ts

# 搜索 createSpriteAnimation 调用
grep -r "createSpriteAnimation" static/js/*.ts
```

### 2.2 已识别的影响文件

根据代码分析,以下文件包含需要修改的资源引用:

1. **Mice.ts** - 老鼠实体类
   - `entity` getter 方法中的路径构建
   - 冰冻效果图片路径
   - 冰块破碎动画路径
   - 涟漪动画路径
   - 各种老鼠状态图片路径

2. **Foods.ts** - 防御卡片类
   - `entity` getter 方法中的路径构建
   - 特殊生成函数中的动画路径
   - 阴影图片路径
   - 睡眠动画路径
   - 各种食物状态图片路径

3. **GameBattlefield.ts** - 战场管理类
   - 倒计时图片路径
   - 铲子图片路径
   - 烟雾/水花动画路径

4. **Level.ts** - 关卡管理类
   - 迷雾图片路径
   - 太阳图片路径
   - 光照效果处理

5. **EventHandler.ts** - 事件处理类
   - 卡片图片路径
   - 图标 SVG 路径
   - 背景图片路径

## 3. 统一调用方式

### 3.1 新的路径规范

**基础规则:**
- 所有资源路径从 `/images/` 开始
- 默认格式为 PNG
- 通过 `tryWebP: true` 参数启用 WebP 自动回退
- SVG 资源保持 `.svg` 后缀

**路径映射表:**

| 旧路径 | 新路径 |
|--------|--------|
| `../CVMJS/static/images/mice/commonmouse/idle.png` | `/images/mice/commonmouse/idle.png` |
| `../CVMJS/static/images/foods/stove/idle.png` | `/images/foods/stove/idle.png` |
| `../CVMJS/static/images/interface/ice.png` | `/images/interface/ice.png` |
| `../CVMJS/static/images/interface/smoke` | `/images/interface/smoke` (SVG序列) |

### 3.2 调用模式示例

**旧的调用方式:**
```typescript
const img = GEH.requestDrawImage("../CVMJS/static/images/mice/commonmouse/idle.png");
```

**新的调用方式:**
```typescript
// PNG (默认)
const img = GEH.requestDrawImage("/images/mice/commonmouse/idle.png");

// WebP 优先 (自动回退到 PNG)
const img = GEH.requestDrawImage("/images/mice/commonmouse/idle.png", null, null, true);

// 带效果
const img = GEH.requestDrawImage("/images/mice/commonmouse/idle.png", "freezing");

// SVG
const img = GEH.requestDrawImage("/images/interface/smoke.svg");
```

**动画资源调用:**
```typescript
// 旧方式
level.createSpriteAnimation(x, y, "../CVMJS/static/images/interface/ice_break.png", 6);

// 新方式 (PNG)
level.createSpriteAnimation(x, y, "/images/interface/ice_break.png", 6);

// 新方式 (WebP)
level.createSpriteAnimation(x, y, "/images/interface/ice_break.png", 6, { isWebP: true });

// 新方式 (SVG序列)
level.createSpriteAnimation(x, y, "/images/interface/smoke", 4, { isSvg: true });
```

### 3.3 路径解析辅助方法

在 `EventHandler.ts` 中添加路径解析辅助方法:

```typescript
/**
 * 解析资源路径,自动添加前缀
 * @param path 相对路径,如 "mice/commonmouse/idle.png"
 * @returns 完整路径,如 "/images/mice/commonmouse/idle.png"
 */
static resolveResourcePath(path: string): string {
    // 如果已经是完整路径,直接返回
    if (path.startsWith('/') || path.startsWith('http')) {
        return path;
    }
    // 移除可能存在的旧前缀
    path = path.replace(/^\.\.\/CVMJS\/static\/images\//, '');
    // 添加新前缀
    return `/images/${path}`;
}
```

## 4. 实施步骤

### 阶段 1: 准备工作
1. 备份当前代码
2. 运行 `npx tsc` 确保编译无误
3. 创建测试检查清单

### 阶段 2: 核心模块重构 (优先级从高到低)

#### Step 1: EventHandler.ts
- 添加 `resolveResourcePath` 辅助方法
- 更新 `requestDrawImage` 方法以支持路径解析
- 修改图标加载路径
- 修改卡片图片路径

#### Step 2: Mice.ts  
- 修改 `Mouse.entity` getter 中的路径构建
- 更新冰冻效果路径 (line 309)
- 更新冰块破碎动画路径 (line 319)
- 更新涟漪动画路径 (line 498, 526, 935, 1009, 1125, 1220)
- 更新各子类的 `entity` getter

#### Step 3: Foods.ts
- 修改 `Food.entity` getter 中的路径构建 (line 169)
- 更新 `specialGenerate` 函数中的动画路径 (line 28, 52, 73)
- 更新 `SHADOW_IMAGE` 静态属性 (line 151)
- 更新睡眠动画路径 (line 1246, 1346, 1631, 2193)
- 更新各子类的特殊路径引用

#### Step 4: GameBattlefield.ts
- 更新 `COUNTDOWN` 静态属性 (line 255)
- 更新铲子动画路径 (line 1072)
- 更新烟雾/水花动画路径 (line 1105, 1117)

#### Step 5: Level.ts
- 更新 `SRC` Map 中的路径 (line 22-25)
- 更新迷雾渲染路径 (line 985)
- 更新光标跟踪中的路径 (line 366, 850)

#### Step 6: 其他模块
- Bullets.ts: 检查子弹相关资源路径
- SpriteAnimation.ts: 确认动画资源加载逻辑
- Core.ts: 检查 UI 组件资源路径

### 阶段 3: 验证与测试

#### 编译验证
```bash
npx tsc --noEmit
```

#### 功能测试清单
- [ ] 启动游戏,检查主界面加载
- [ ] 进入关卡,检查背景图片加载
- [ ] 放置防御卡片,检查卡片图片和动画
- [ ] 生成老鼠,检查老鼠图片和动画
- [ ] 触发冰冻效果,检查冰块图片和破碎动画
- [ ] 检查涟漪动画 (水路老鼠)
- [ ] 检查铲子功能和动画
- [ ] 检查倒计时动画
- [ ] 检查迷雾效果
- [ ] 测试 WebP 资源 (Stove idle.webp)
- [ ] 测试 SVG 序列动画

#### 回归测试
- 运行所有关卡,确保资源加载正常
- 检查控制台是否有 404 错误
- 验证性能无明显下降

## 5. 风险与缓解措施

### 5.1 主要风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 路径错误导致资源加载失败 | 高 | 使用辅助方法统一路径解析,编译前充分测试 |
| 忘记传递 format 参数 | 中 | 默认使用 PNG,WebP 通过参数显式启用 |
| 特殊路径处理遗漏 | 中 | 系统性搜索所有引用,建立检查清单 |
| 性能回归 | 低 | 保持现有缓存机制,监控加载时间 |
| 破坏现有 WebP 功能 | 中 | 保留 `tryWebP` 参数,测试 Stove 等已有 WebP 资源 |

### 5.2 回滚策略

如果重构后出现严重问题:
1. 使用 Git 回滚到重构前的提交
2. 保留 `resolveResourcePath` 辅助方法供后续使用
3. 分析失败原因,调整方案后重新实施

## 6. 特殊情况处理

### 6.1 绝对路径
某些场景可能需要使用绝对路径(如外部资源):
```typescript
// 保持原样,不做转换
const img = GEH.requestDrawImage("https://example.com/image.png");
```

### 6.2 动态路径构建
对于动态构建的路径,使用辅助方法:
```typescript
// 旧方式
const path = `../CVMJS/static/images/mice/${this.name}/${this.state}.png`;

// 新方式
const path = EventHandler.resolveResourcePath(`mice/${this.name}/${this.state}.png`);
```

### 6.3 SVG 序列
SVG 序列动画不需要文件扩展名:
```typescript
// 正确
level.createSpriteAnimation(x, y, "/images/interface/smoke", 4, { isSvg: true });

// 错误
level.createSpriteAnimation(x, y, "/images/interface/smoke.svg", 4, { isSvg: true });
```

## 7. 验证标准

### 7.1 代码质量
- [ ] 所有 TypeScript 文件编译无错误
- [ ] 无 ESLint 警告
- [ ] 代码格式符合项目规范

### 7.2 功能完整性
- [ ] 所有资源正常加载
- [ ] 动画播放流畅
- [ ] 特效显示正确
- [ ] WebP 自动回退机制工作正常

### 7.3 性能指标
- [ ] 首屏加载时间无明显增加
- [ ] 游戏运行帧率稳定
- [ ] 内存占用无异常增长

## 8. 产出物

### 8.1 文档
- [x] 本重构方案文档 (`docs/drawimage-refactor-plan.md`)
- [ ] 修改记录文档 (记录每个文件的具体修改)
- [ ] 测试报告 (记录测试结果和发现的问题)

### 8.2 代码变更
- [ ] EventHandler.ts: 添加路径解析辅助方法
- [ ] Mice.ts: 更新所有资源路径
- [ ] Foods.ts: 更新所有资源路径
- [ ] GameBattlefield.ts: 更新所有资源路径
- [ ] Level.ts: 更新所有资源路径
- [ ] 其他相关文件的路径更新

### 8.3 更新 AGENTS.md
在完成重构后,更新 `AGENTS.md` 文档,记录:
- 新的资源路径规范
- `resolveResourcePath` 辅助方法的使用说明
- WebP 资源的使用指南

## 9. 时间估算

| 阶段 | 预计时间 |
|------|----------|
| 准备工作 | 0.5小时 |
| EventHandler.ts 重构 | 1小时 |
| Mice.ts 重构 | 2小时 |
| Foods.ts 重构 | 2小时 |
| GameBattlefield.ts 重构 | 1小时 |
| Level.ts 重构 | 1小时 |
| 其他模块重构 | 1小时 |
| 测试与验证 | 2小时 |
| 文档更新 | 0.5小时 |
| **总计** | **11小时** |

## 10. 后续优化建议

1. **资源预加载优化**: 考虑在游戏启动时预加载常用资源
2. **路径配置化**: 将资源路径前缀提取为配置项,便于环境切换
3. **类型安全**: 为资源路径添加 TypeScript 类型定义
4. **自动化测试**: 编写单元测试验证路径解析逻辑
5. **性能监控**: 添加资源加载性能监控,及时发现问题

---

**方案版本**: 1.0  
**创建日期**: 2025-01-19  
**最后更新**: 2025-01-19