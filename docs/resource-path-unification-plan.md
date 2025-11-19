# 资源路径统一化与WebP选择性启用方案

## 一、概述

本方案旨在统一前端资源加载逻辑,实现:
1. 默认假定资源为 PNG 格式,路径以 `/images/` 开头
2. 通过参数声明式切换 WebP/SVG 格式
3. 自动拼接运行环境基路径(本地服务器/GitHub Pages)
4. 为 `Stove` 类启用 WebP 测试

## 二、当前问题分析

### 2.1 现状
- `requestDrawImage` 和 `SpriteAnimation` 调用方需传入完整路径 `../CVMJS/static/images/...`
- 路径硬编码,不利于环境切换
- WebP 支持通过 `tryWebP` 参数实现,但未统一
- 资源类型(png/webp/svg)切换不够声明式

### 2.2 目标
- 调用方只需传入 `/images/` 起始的相对路径
- 通过参数明确指定资源类型
- 运行时自动检测环境并拼接基路径

## 三、设计方案

### 3.1 基路径解析策略

#### 3.1.1 环境检测
在 `EventHandler` 类中添加静态方法:

```typescript
static #basePath: string = '';

static getBasePath(): string {
    if (this.#basePath) return this.#basePath;
    
    const { hostname } = window.location;
    
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
        this.#basePath = '/static';
    } else if (hostname.includes('github.io')) {
        this.#basePath = '/CVMJS/static';
    } else {
        this.#basePath = '/static';
    }
    
    return this.#basePath;
}

static resolveResourcePath(path: string): string {
    if (path.startsWith('http') || path.startsWith('../')) {
        return path;
    }
    
    if (path.startsWith('/images/')) {
        return `${this.getBasePath()}${path}`;
    }
    
    return `${this.getBasePath()}/images/${path}`;
}
```

### 3.2 资源类型参数扩展

#### 3.2.1 类型定义
```typescript
type ResourceFormat = 'png' | 'webp' | 'svg';

interface ResourceOptions {
    format?: ResourceFormat;
    effect?: string | null;
    intensity?: number | null;
}
```

#### 3.2.2 `requestDrawImage` 重构
修改方法签名和实现:

```typescript
requestDrawImage(path: string, options?: ResourceOptions): ImageBitmap | null {
    const format = options?.format || 'png';
    const effect = options?.effect || null;
    const intensity = options?.intensity || null;
    
    let resolvedPath = EventHandler.resolveResourcePath(path);
    
    if (format === 'webp' && resolvedPath.endsWith('.png')) {
        resolvedPath = resolvedPath.replace(/\.png$/, '.webp');
    }
    
    const effectKey = effect !== null 
        ? `${resolvedPath}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` 
        : resolvedPath;
    
    if (EventHandler.#images.has(effectKey)) {
        return EventHandler.#images.get(effectKey)!;
    }
    
    this.requestImageCache(resolvedPath, effect, intensity).catch(() => {
        if (format === 'webp') {
            EventHandler.#webpFallbackCache.add(path);
            const pngPath = resolvedPath.replace(/\.webp$/, '.png');
            this.requestImageCache(pngPath, effect, intensity);
        }
    });
    
    return null;
}
```

#### 3.2.3 `requestAnimationResource` 重构
```typescript
async requestAnimationResource(
    path: string, 
    frames: number, 
    options?: {
        format?: ResourceFormat;
        vertical?: boolean;
        offsetX?: number;
        offsetY?: number;
    }
): Promise<ImageBitmap[] | null> {
    const format = options?.format || 'png';
    let resolvedPath = EventHandler.resolveResourcePath(path);
    
    if (format === 'webp' && !resolvedPath.endsWith('.webp')) {
        resolvedPath = resolvedPath.replace(/\.png$/, '.webp');
    }
    
    if (format === 'webp' || resolvedPath.endsWith('.webp')) {
        try {
            return await this.requestWebPFrames(resolvedPath);
        } catch {
            return null;
        }
    }
    
    if (format === 'svg') {
        return null;
    }
    
    if (frames > 1) {
        try {
            return await this.requestSpriteSlices(
                resolvedPath, 
                frames, 
                options?.offsetX ?? 0, 
                options?.offsetY ?? 0, 
                options?.vertical ?? false
            );
        } catch {
            return null;
        }
    }
    
    return null;
}
```

### 3.3 `SpriteAnimation` 适配

修改构造函数和 `reset` 方法:

```typescript
type SpriteAnimationOptions = {
    vertical?: boolean;
    function?: () => void;
    func?: () => void;
    zIndex?: number;
    format?: ResourceFormat;
    scale?: number;
};

constructor(x: number, y: number, src: string, frames: number, options?: SpriteAnimationOptions) {
    this.#src = EventHandler.resolveResourcePath(src);
    
    const format = options?.format || 'png';
    if (format === 'webp' && !this.#src.endsWith('.webp')) {
        this.#src = this.#src.replace(/\.png$/, '.webp');
        this.isWebP = true;
    } else if (format === 'svg') {
        this.isSvg = true;
    }
}
```

### 3.4 `Stove` 类 WebP 测试

#### 3.4.1 Food 基类扩展
```typescript
export class Food {
    static useWebP = false;
    
    get entity() {
        const path = `/images/foods/${this.constructor.name}/${this.state}.png`;
        return EventHandler.resolveResourcePath(path);
    }
    
    protected getResourceFormat(): ResourceFormat {
        const ctor = this.constructor as typeof Food;
        return ctor.useWebP ? 'webp' : 'png';
    }
}
```

#### 3.4.2 Stove 类修改
```typescript
class Stove extends Food {
    static useWebP = true;
    
    get entity() {
        const basePath = `/images/foods/stove/${this.state}.png`;
        return EventHandler.resolveResourcePath(basePath);
    }
}
```

### 3.5 后端基路径协同

Go 服务器无需修改,保持现有静态文件服务:

```go
router.StaticFS("/static", http.Dir("static"))
```

前端自动检测环境并使用正确的基路径。

## 四、实施步骤

### 阶段一: 基础设施
1. 在 `EventHandler.ts` 添加 `getBasePath()` 和 `resolveResourcePath()`
2. 定义 `ResourceFormat` 和 `ResourceOptions` 类型

### 阶段二: API 重构
1. 修改 `requestDrawImage` 签名和实现
2. 修改 `requestAnimationResource` 添加 `format` 参数

### 阶段三: 组件适配
1. 更新 `SpriteAnimation` 构造函数
2. 更新 `SpriteAnimationManager.playAnimation()`

### 阶段四: Stove 测试
1. 修改 `Food` 基类添加 `useWebP` 和 `getResourceFormat()`
2. 在 `Stove` 类设置 `useWebP = true`
3. 验证 WebP 加载和降级

### 阶段五: 全局迁移
1. 批量替换 `../CVMJS/static/images/` 为 `/images/`
2. 运行测试验证

## 五、影响范围

### 需要修改的文件
- `static/js/EventHandler.ts` (核心)
- `static/js/SpriteAnimation.ts` (参数)
- `static/js/Foods.ts` (Stove 和 Food 基类)

### 不需要修改
- `app.go`
- CSS/HTML 文件

## 六、风险与缓解

### 风险
1. 路径解析错误导致 404
2. WebP 兼容性问题
3. 缓存键不匹配

### 缓解
1. 保留完整路径支持作为降级
2. 保留 PNG 降级逻辑
3. 保持缓存键生成一致

## 七、验证方法

### 单元测试
```typescript
describe('EventHandler.resolveResourcePath', () => {
    it('should resolve /images/ path', () => {
        const result = EventHandler.resolveResourcePath('/images/foods/stove/idle.png');
        expect(result).toMatch(/\/static\/images\/foods\/stove\/idle\.png$/);
    });
});
```

### 手动测试清单
- [ ] Stove 类 WebP 显示正常
- [ ] WebP 降级到 PNG 正常
- [ ] 其他 Food 类 PNG 显示正常
- [ ] 本地环境正常
- [ ] GitHub Pages 环境正常

## 八、时间估算

| 阶段 | 工作量 |
|------|--------|
| 阶段一 | 2小时 |
| 阶段二 | 3小时 |
| 阶段三 | 2小时 |
| 阶段四 | 1小时 |
| 阶段五 | 4小时 |
| 测试 | 2小时 |
| **总计** | **14小时** |

## 九、使用示例

### 修改前
```typescript
GEH.requestDrawImage('../CVMJS/static/images/foods/stove/idle.png', null, null, true);
```

### 修改后
```typescript
GEH.requestDrawImage('/images/foods/stove/idle.png', { format: 'webp' });
```

## 十、总结

本方案通过环境自适应、声明式格式选择、向后兼容和渐进迁移,实现了资源路径的统一化管理,为后续 WebP 优化和 CDN 支持奠定基础。