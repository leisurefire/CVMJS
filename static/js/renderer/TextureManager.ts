/**
 * TextureManager.ts
 * WebGL纹理管理器
 * 负责纹理上传、缓存和资源释放
 */

/**
 * LRU缓存节点
 */
interface CacheNode {
    key: string;
    texture: WebGLTexture;
    prev: CacheNode | null;
    next: CacheNode | null;
}

/**
 * 纹理管理器
 * 使用LRU策略缓存纹理,最大100个
 */
export class TextureManager {
    private gl: WebGLRenderingContext;
    private cache: Map<string, CacheNode>;
    private head: CacheNode | null;
    private tail: CacheNode | null;
    private maxSize: number;

    constructor(gl: WebGLRenderingContext, maxSize: number = 100) {
        this.gl = gl;
        this.cache = new Map();
        this.head = null;
        this.tail = null;
        this.maxSize = maxSize;
    }

    /**
     * 上传纹理到GPU
     * @param image 图像源
     * @param key 缓存键(可选)
     * @returns WebGL纹理对象
     */
    uploadTexture(image: ImageBitmap | HTMLImageElement, key?: string): WebGLTexture {
        if (key && this.cache.has(key)) {
            return this.moveToFront(key);
        }

        const texture = this.gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create texture");
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

        // 处理非POT纹理
        if (!this.isPowerOfTwo(image.width) || !this.isPowerOfTwo(image.height)) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        } else {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        if (key) {
            this.addToCache(key, texture);
        }

        return texture;
    }

    /**
     * 获取缓存纹理
     * @param key 缓存键
     * @returns 纹理对象或null
     */
    getTexture(key: string): WebGLTexture | null {
        if (!this.cache.has(key)) {
            return null;
        }
        return this.moveToFront(key);
    }

    /**
     * 释放所有纹理资源
     */
    dispose(): void {
        for (const node of this.cache.values()) {
            this.gl.deleteTexture(node.texture);
        }
        this.cache.clear();
        this.head = null;
        this.tail = null;
    }

    private isPowerOfTwo(value: number): boolean {
        return (value & (value - 1)) === 0;
    }

    private addToCache(key: string, texture: WebGLTexture): void {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const node: CacheNode = { key, texture, prev: null, next: this.head };
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
        if (!this.tail) {
            this.tail = node;
        }
        this.cache.set(key, node);
    }

    private moveToFront(key: string): WebGLTexture {
        const node = this.cache.get(key)!;
        if (node === this.head) {
            return node.texture;
        }

        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        if (node === this.tail) {
            this.tail = node.prev;
        }

        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;

        return node.texture;
    }

    private evictLRU(): void {
        if (!this.tail) return;

        this.gl.deleteTexture(this.tail.texture);
        this.cache.delete(this.tail.key);

        if (this.tail.prev) {
            this.tail.prev.next = null;
            this.tail = this.tail.prev;
        } else {
            this.head = null;
            this.tail = null;
        }
    }
}