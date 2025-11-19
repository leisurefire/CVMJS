import { GEH } from "./Core.js";
import { level } from "./Level.js";
/**
 * SpriteAnimation 对象,用于临时动画展示,可池化复用
 */
export default class SpriteAnimation {
    #x;
    #y;
    #src;
    #frames;
    #tick = 0;
    vertical;
    frameCallback;
    zIndex;
    isSvg;
    isWebP = false;
    scale;
    // 缓存上一帧成功加载的图片,避免 requestDrawImage 偶尔返回 null 时整帧消失
    _img;
    _webpFrames;
    _spriteSlices;
    constructor(x, y, src, frames, options) {
        if (x == null || y == null || src == null || frames == null) {
            throw new Error(`Certain parameter(s) not specified.`);
        }
        this.#x = x;
        this.#y = y;
        this.#src = src;
        this.#frames = frames;
        this.vertical = options?.vertical ?? false;
        this.frameCallback = options?.function ?? options?.func;
        const maxZIndex = level.column_num * level.row_num;
        this.zIndex = Math.min(options?.zIndex ?? maxZIndex - 1, maxZIndex - 1);
        this.isSvg = options?.isSvg ?? false;
        this.isWebP = options?.isWebP ?? false;
        this.scale = options?.scale ?? 1;
        this._img = undefined;
    }
    /**
     * 重置以供对象池复用 - 确保所有状态清零
     */
    reset(x, y, src, frames, options) {
        this.#x = x;
        this.#y = y;
        this.#src = src;
        this.#frames = frames;
        this.vertical = options?.vertical ?? false;
        this.frameCallback = options?.function ?? options?.func;
        const maxZIndex = level.column_num * level.row_num;
        this.zIndex = Math.min(options?.zIndex ?? maxZIndex - 1, maxZIndex - 1);
        this.isSvg = options?.isSvg ?? false;
        this.isWebP = options?.isWebP ?? false;
        this.scale = options?.scale ?? 1;
        this.#tick = 0;
        this._img = undefined;
        this._webpFrames = undefined;
        this._spriteSlices = undefined;
        return this;
    }
    /** acquire 生命周期钩子 */
    onAcquire() { }
    /** release 生命周期钩子 */
    onRelease() { }
    render(ctx) {
        // 模式1: WebP帧数组
        if (this._webpFrames) {
            const frame = this._webpFrames[this.#tick];
            if (!frame)
                return false;
            ctx.drawImage(frame, this.#x, this.#y, frame.width * this.scale, frame.height * this.scale);
            if (this.#tick === this.#frames - 1) {
                this.frameCallback?.();
                return true;
            }
            this.#tick++;
            return false;
        }
        // 模式2: 精灵图切片
        if (this._spriteSlices) {
            const slice = this._spriteSlices[this.#tick];
            if (!slice)
                return false;
            ctx.drawImage(slice, this.#x, this.#y);
            if (this.#tick === this.#frames - 1) {
                this.frameCallback?.();
                return true;
            }
            this.#tick++;
            return false;
        }
        // 模式3: SVG序列 / 模式4: 传统精灵图
        const rawImg = GEH.requestDrawImage(this.isSvg ? `${this.#src}/${this.#tick}.svg` : this.#src);
        if (rawImg) {
            this._img = rawImg;
        }
        const img = this._img;
        if (!img) {
            return false;
        }
        if (this.isSvg) {
            ctx.drawImage(img, this.#x, this.#y, img.width * this.scale, img.height * this.scale);
        }
        else if (this.vertical) {
            const offsetX = img.width;
            const offsetY = img.height / this.#frames;
            ctx.drawImage(img, 0, offsetY * this.#tick, offsetX, offsetY, this.#x, this.#y, offsetX, offsetY);
        }
        else {
            const offsetX = img.width / this.#frames;
            const offsetY = img.height;
            ctx.drawImage(img, offsetX * this.#tick, 0, offsetX, offsetY, this.#x, this.#y, offsetX, offsetY);
        }
        if (this.#tick === this.#frames - 1) {
            this.frameCallback?.();
            return true;
        }
        this.#tick++;
        return false;
    }
}
/**
 * SpriteAnimation 管理器 - 独立管理动画池、栈、渲染
 * 向 Level.ts 只暴露接口，隐藏实现细节
 */
export class SpriteAnimationManager {
    _spritePool = [];
    _maxPoolSize = 100;
    _animationStack = [];
    constructor(gridSize) {
        this._animationStack = Array.from({ length: gridSize + 1 }, () => []);
    }
    /**
     * 获取或创建动画实例
     */
    acquireAnimation(x, y, src, frames, options) {
        let anim = this._spritePool.pop();
        if (anim) {
            anim.reset(x, y, src, frames, options);
            anim.onAcquire();
        }
        else {
            anim = new SpriteAnimation(x, y, src, frames, options);
        }
        return anim;
    }
    /**
     * 归还动画实例到对象池
     */
    releaseAnimation(anim) {
        try {
            anim.onRelease();
        }
        catch { }
        if (this._spritePool.length < this._maxPoolSize) {
            this._spritePool.push(anim);
        }
    }
    /**
     * 创建并播放动画
     */
    async playAnimation(x, y, src, frames, options) {
        const resource = await GEH.requestAnimationResource(src, frames, options).catch(() => null);
        const animation = this.acquireAnimation(x, y, src, frames, options);
        if (Array.isArray(resource)) {
            if (src.endsWith('.webp') || options?.isWebP) {
                animation._webpFrames = resource;
            }
            else {
                animation._spriteSlices = resource;
            }
        }
        const targetStack = this._animationStack[animation.zIndex];
        if (targetStack) {
            targetStack.push(animation);
        }
        return animation;
    }
    /**
     * 更新并绘制所有动画，返回存活的动画栈
     */
    updateAnimations(ctx, gridColumns, gridRows) {
        const animationTemp = Array.from({ length: this._animationStack.length }, () => []);
        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridColumns; j++) {
                const zIndex = (i * gridColumns) + j;
                const stack = this._animationStack[zIndex];
                if (stack && stack.length > 0) {
                    for (const spriteAnimation of stack) {
                        const finished = spriteAnimation.render(ctx);
                        if (!finished) {
                            animationTemp[zIndex].push(spriteAnimation);
                        }
                        else {
                            this.releaseAnimation(spriteAnimation);
                        }
                    }
                }
            }
        }
        // 更新栈
        for (let i = 0; i < this._animationStack.length; i++) {
            this._animationStack[i] = animationTemp[i];
        }
        return this._animationStack;
    }
    /**
     * 清空所有动画
     */
    clear() {
        for (let i = 0; i < this._animationStack.length; i++) {
            for (const anim of this._animationStack[i]) {
                this.releaseAnimation(anim);
            }
            this._animationStack[i].length = 0;
        }
    }
    /**
     * 获取当前动画栈（只读）
     */
    getAnimationStack() {
        return this._animationStack;
    }
}
