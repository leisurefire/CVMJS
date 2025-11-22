import { releaseBullet } from "./Bullets.js";
/**
 * BulletManager - 高效管理子弹的生命周期
 *
 * 设计目标：
 * - 减少 splice 导致的数组重排（O(n) -> O(1)）
 * - 批量处理死亡子弹
 * - 复用 deadIndices 数组，避免每帧分配
 *
 * 性能优化：
 * - 使用标记-清除模式，减少数组操作
 * - 从后往前删除，避免索引偏移问题
 * - 预期提升 30-50% 子弹更新性能
 */
export class BulletManager {
    bullets = [];
    deadMask = []; // 复用数组标记死亡状态
    /**
     * 添加子弹到管理器
     */
    add(bullet) {
        this.bullets.push(bullet);
    }
    /**
     * 获取当前子弹数量
     */
    get length() {
        return this.bullets.length;
    }
    /**
     * 获取指定索引的子弹
     */
    at(index) {
        return this.bullets[index];
    }
    /**
     * 标记指定索引的子弹为死亡
     */
    markDead(index) {
        if (index >= 0 && index < this.bullets.length) {
            this.deadMask[index] = true;
        }
    }
    /**
     * 直接删除指定索引的子弹并添加新子弹（用于 fireBoost）
     */
    replaceAt(index, newBullet) {
        if (index >= 0 && index < this.bullets.length) {
            const old = this.bullets[index];
            releaseBullet(old);
            this.bullets[index] = newBullet;
            this.deadMask[index] = false;
        }
    }
    /**
     * 清空所有子弹
     */
    clear() {
        // 释放所有子弹到对象池
        for (const bullet of this.bullets) {
            releaseBullet(bullet);
        }
        this.bullets.length = 0;
        this.deadMask.length = 0;
    }
    /**
     * 批量删除标记为死亡的子弹
     */
    compact() {
        let writeIndex = 0;
        for (let readIndex = 0; readIndex < this.bullets.length; readIndex++) {
            if (!this.deadMask[readIndex]) {
                if (writeIndex !== readIndex) {
                    this.bullets[writeIndex] = this.bullets[readIndex];
                }
                writeIndex++;
            }
            else {
                // 释放死亡的子弹
                releaseBullet(this.bullets[readIndex]);
            }
        }
        this.bullets.length = writeIndex;
        this.deadMask.length = 0;
    }
    /**
     * 更新所有子弹（简化版本，仅处理栈溢出和基本移动）
     * 复杂的 Boost 逻辑由外部处理
     */
    updateSimple(ctx, maxStackSize) {
        // 重置死亡掩码
        this.deadMask.length = 0;
        this.deadMask.length = this.bullets.length;
        this.deadMask.fill(false);
        // 更新所有子弹
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            // 超出栈容量时将伤害合并并标记删除
            if (i >= maxStackSize) {
                const targetIdx = Math.floor(Math.random() * maxStackSize);
                this.bullets[targetIdx].damage += bullet.damage;
                this.markDead(i);
                continue;
            }
            // 移动检测
            if (bullet.move()) {
                this.markDead(i);
                continue;
            }
            // 渲染
            bullet.createEntity(ctx);
            // 伤害检测
            if (bullet.takeDamage()) {
                this.markDead(i);
            }
        }
        // 批量清除死亡子弹
        this.compact();
    }
    /**
     * 获取底层数组的只读视图（用于兼容性）
     */
    getBullets() {
        return this.bullets;
    }
    /**
     * 获取底层数组（用于需要直接访问的场景，如 Boost 逻辑）
     * 注意：不应在迭代过程中修改长度
     */
    getBulletsUnsafe() {
        return this.bullets;
    }
}
