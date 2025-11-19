/**
 * IRenderer.ts
 * 渲染器抽象接口,定义统一的绘制API
 * 支持Canvas 2D和WebGL两种实现
 */

/**
 * 特效参数接口
 */
export interface RenderEffects {
    /** 是否受击变红 */
    isHit?: boolean;
    /** 是否冰冻变蓝 */
    isFrozen?: boolean;
    /** 是否镜像反转 */
    isMirrored?: boolean;
}

/**
 * 渲染器接口
 * 提供与Canvas 2D Context兼容的绘制方法
 */
export interface IRenderer {
    /**
     * 绘制图像(9参数重载)
     * @param image 图像源
     * @param sx 源矩形X坐标
     * @param sy 源矩形Y坐标
     * @param sw 源矩形宽度
     * @param sh 源矩形高度
     * @param dx 目标矩形X坐标
     * @param dy 目标矩形Y坐标
     * @param dw 目标矩形宽度
     * @param dh 目标矩形高度
     * @param effects 特效参数(可选)
     */
    drawImage(
        image: CanvasImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
        effects?: RenderEffects
    ): void;

    /**
     * 绘制图像(5参数重载)
     * @param image 图像源
     * @param dx 目标X坐标
     * @param dy 目标Y坐标
     * @param dw 目标宽度
     * @param dh 目标高度
     * @param effects 特效参数(可选)
     */
    drawImage(
        image: CanvasImageSource,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
        effects?: RenderEffects
    ): void;

    /**
     * 保存当前渲染状态到栈
     */
    save(): void;

    /**
     * 从栈恢复渲染状态
     */
    restore(): void;

    /**
     * 缩放变换
     * @param x X轴缩放因子
     * @param y Y轴缩放因子
     */
    scale(x: number, y: number): void;

    /**
     * 平移变换
     * @param x X轴平移距离
     * @param y Y轴平移距离
     */
    translate(x: number, y: number): void;

    /**
     * 旋转变换
     * @param angle 旋转角度(弧度)
     */
    rotate(angle: number): void;

    /**
     * 设置全局透明度
     * @param alpha 透明度值(0-1)
     */
    setGlobalAlpha(alpha: number): void;

    /**
     * 清空画布
     * @param x 清空区域X坐标(可选,默认0)
     * @param y 清空区域Y坐标(可选,默认0)
     * @param width 清空区域宽度(可选,默认画布宽度)
     * @param height 清空区域高度(可选,默认画布高度)
     */
    clear(x?: number, y?: number, width?: number, height?: number): void;

    /**
     * 获取底层Canvas元素
     */
    getCanvas(): HTMLCanvasElement;

    /**
     * 释放渲染器资源
     */
    dispose(): void;
}