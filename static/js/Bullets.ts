import EventHandler from "./EventHandler.js";
import { GEH } from "./Core.js";
import { level } from "./Level.js";
import { Mouse } from "./Mice";
import type { IRenderer } from "./renderer/IRenderer.js";

/**
 * 类型守卫函数：判断ctx是否为IRenderer
 */
function isIRenderer(ctx: IRenderer | CanvasRenderingContext2D): ctx is IRenderer {
    return typeof (ctx as IRenderer).setGlobalAlpha === "function";
}

export class Bullet {
    x: number;
    y: number;
    angle: number;
    damage: number;
    CanBoost: boolean;
    speed: number;
    target: null;
    width: number;
    height: number;
    entity: string;
    hitCheck: (mouse: any) => null;
    birthPosition?: number;
    private _defaultCanBoost?: boolean;
    get positionX() {
        return EventHandler.getPositionX(this.x);
    }

    get column() {
        return Math.floor(this.positionX);
    }
    get positionY() {
        return Math.floor(EventHandler.getPositionY(this.y));
    }

    get position() {
        return Math.floor(this.positionY) * 10 + Math.floor(this.positionX);
    }

    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        this.x = x;
        this.y = y;

        this.angle = angle;
        this.damage = dam;
        this.CanBoost = false;

        this.speed = 11;

        this.target = null;

        this.width = 20;
        this.height = 16;

        this.entity = "/images/bullets/bun.png";

        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.canBeHit
                && (this.target = mouse || true)) ? (this.target) : null;
        }
    }

    private restoreBoostFlag() {
        if (this._defaultCanBoost === undefined) {
            this._defaultCanBoost = this.CanBoost;
        }
        this.CanBoost = this._defaultCanBoost;
    }

    // reset for object pooling reuse
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = dam;
        this.target = null;
        this.birthPosition = undefined;
        this.restoreBoostFlag();
        // subclass-specific defaults are not handled here; subclasses can override
        return this;
    }

    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            const effects = isIRenderer(ctx) ? undefined : undefined;
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, effects as any);
        }
    }

    move() {
        this.x = this.x + this.speed * Math.cos(this.angle * 2 * Math.PI / 360);
        this.y = this.y + this.speed * Math.sin(this.angle * 2 * Math.PI / 360);
        return this.y <= level.row_start || this.y >= level.row_end || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 14, this.y - 16, "/images/bullets/bun_hit.png", 4);
    }

    takeDamage() {
        if (level.Mice[this.positionY] == null) {
            return false;
        }
        else {
            if (level.Mice[this.positionY][this.column]) {
                for (let i = 0; i < level.Mice[this.positionY][this.column].length; i++) {
                    if (this.hitCheck(level.Mice[this.positionY][this.column][i])) {
                        return this.hit(this.target);
                    }
                }
            }
            if (level.Mice[this.positionY][this.column - 1]) {
                for (let i = 0; i < level.Mice[this.positionY][this.column - 1].length; i++) {
                    if (this.hitCheck(level.Mice[this.positionY][this.column - 1][i])) {
                        return this.hit(this.target);
                    }
                }
            }
        }
        return false;
    }

    hit(target: null | Mouse) {
        if (target == null) {
            return null;
        } else {
            this.createHitAnim();
            target.getHit(this.damage);
            return (this.target as unknown as Mouse);
        }
    }

    duplicate(): Bullet | undefined {
        return undefined;
    }

    fireBoost(): Bullet | undefined {
        return undefined;
    }

    onAcquire(): void {
        // Reserved for pooling lifecycle customization.
    }

    onRelease(): void {
        // Reserved for pooling lifecycle customization.
    }
}
export interface BulletSpawnOptions<T extends Bullet = Bullet> {
    reuse?: boolean;
    setup?: (instance: T) => void;
}

export type BulletCtor<T extends Bullet = Bullet> = {
    new(...args: any[]): T;
    poolKey?: string;
};

/**
 * Bullet 对象池实现
 * - 使用构造函数的 `poolKey`（若有）或构造函数名作为池 key
 * - acquireBullet: 尝试从池中复用实例（默认允许复用），否则 new 新实例
 * - releaseBullet: 调用实例的 onRelease 并回收到池中（池大小有上限）
 *
 * 设计说明：将对象池放在 Bullets 模块中以便所有生产子弹的逻辑统一复用，
 * 通过 Bullet.reset/onAcquire/onRelease 支持子类进行自定义重置/回收处理。
 */
const _bulletPool: Map<string, Bullet[]> = new Map();
const BULLET_POOL_MAX = 200;

/**
 * 获取/创建子弹实例
 */
export function acquireBullet<T extends Bullet = Bullet>(
    ctor: BulletCtor<T>,
    x = 0,
    y = 0,
    dam = 20,
    angle = 0,
    parameter_1: any = null,
    parameter_2: any = null,
    options?: BulletSpawnOptions<T>
): T {
    const key = (ctor.poolKey || (ctor as any).name) as string;
    const pool = _bulletPool.get(key) || [];
    let instance: T;
    if (options?.reuse !== false && pool.length > 0) {
        instance = pool.pop() as T;
        // 通用 reset 支持；子类可覆盖 reset 做额外初始化
        instance.reset(x, y, dam, angle, parameter_1, parameter_2);
    } else {
        // 尝试将参数透传给构造函数（兼容不同子类签名）
        instance = new (ctor as any)(x, y, dam, angle, parameter_1, parameter_2) as T;
    }
    // 生命周期钩子
    if (typeof (instance as any).onAcquire === "function") {
        (instance as any).onAcquire();
    }
    if (options?.setup) {
        options.setup(instance);
    }
    return instance;
}

/**
 * 回收子弹实例到对象池
 */
export function releaseBullet(instance: Bullet) {
    try {
        if (typeof (instance as any).onRelease === "function") {
            (instance as any).onRelease();
        }
    } catch (e) {
        // 忽略回收钩子中可能的异常，保证回收流程稳定
    }
    const ctor = instance.constructor as BulletCtor;
    const key = (ctor.poolKey || (ctor as any).name) as string;
    const pool = _bulletPool.get(key) || [];
    if (pool.length < BULLET_POOL_MAX) {
        pool.push(instance);
        _bulletPool.set(key, pool);
    }
}
class BunPrototype extends Bullet {
    CanBoost = true;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
    }

    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            const effects = isIRenderer(ctx) ? { isMirrored: this.angle === 180 } : undefined;
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, effects as any);
        }
    }

    duplicate(): Bullet | undefined {
        return undefined;
    }

    fireBoost(): Bullet | undefined {
        return undefined;
    }
}

class MissilePrototype extends Bullet {
    #positionY = -1;
    protected front: null | Mouse | Boolean;
    notarget: null | Mouse;
    private getFront: (mouse: Mouse) => Mouse | boolean | null;
    private startX?: number;
    private startY?: number;
    private targetX?: number;
    private targetY?: number;
    private totalDistanceX: number = 0;
    private flightProgress: number = 0;
    private arcHeight: number = 0;
    private lingerFrames: number = 0;
    private hasTrajectory: boolean = false;
    private horizontalDirection: number = 1;
    public get positionY() {
        return this.#positionY;
    }
    public set positionY(value) {
        this.#positionY = value;
    }
    constructor(x = 0, y = 0, dam = 20, positionY: number) {
        super(x, y, dam, 0);
        this.width = 17;
        this.height = 12;
        this.speed = 14;
        this.front = null;
        this.positionY = positionY;
        this.notarget = null;

        this.entity = "/images/bullets/salad.png";

        this.getFront = ((mouse) => {
            return (mouse.attackable
                && mouse !== this.notarget
                && mouse.canBeThrown
                && (this.front = mouse || true)) ? (this.front) : null;
        });

        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse !== this.notarget
                && mouse.canBeThrown
                && (this.target = mouse || true)) ? (this.target) : null;
        }
        this.resetTrajectory();
    }

    private resetTrajectory() {
        this.startX = this.x;
        this.startY = this.y;
        this.targetX = undefined;
        this.targetY = undefined;
        this.totalDistanceX = 0;
        this.flightProgress = 0;
        this.arcHeight = 0;
        this.lingerFrames = 0;
        this.hasTrajectory = false;
        this.horizontalDirection = 1;
    }

    protected computeArcHeight(distanceX: number): number {
        const minHeight = 128;
        const maxHeight = 256;
        const scaled = distanceX * 0.3;
        return Math.max(minHeight, Math.min(maxHeight, scaled));
    }

    private establishTrajectory(): boolean {
        if (this.hasTrajectory) {
            return false;
        }

        const laneIndex = this.positionY;
        if (laneIndex >= 0 && level.Mice[laneIndex]) {
            for (let i = Math.floor(this.positionX); i < level.Mice[laneIndex].length; i++) {
                const miceStack = level.Mice[laneIndex][i];
                if (miceStack != null) {
                    miceStack.forEach(this.getFront);
                    if (this.front != null) {
                        break;
                    }
                }
            }
        }

        let nextTargetX: number;
        let nextTargetY: number;

        if (this.front == null) {
            if (this.notarget != null) {
                this.createHitAnim();
                this.resetTrajectory();
                this.hasTrajectory = true;
                this.flightProgress = 1;
                return true;
            }
            nextTargetX = level.column_end;
            nextTargetY = this.y;
            this.front = true;
        } else if (this.front === true) {
            nextTargetX = level.column_end;
            nextTargetY = this.y;
        } else {
            const front = this.front as Mouse;
            nextTargetX = level.column_start + 60 * (front.positionX);
            nextTargetY = this.y + 30;
        }

        this.startX = this.x;
        this.startY = this.y;
        this.targetX = nextTargetX;
        this.targetY = nextTargetY;

        const rawDistanceX = (this.targetX ?? this.x) - this.x;
        this.horizontalDirection = rawDistanceX >= 0 ? 1 : -1;
        this.totalDistanceX = Math.max(1, Math.abs(rawDistanceX));

        this.arcHeight = this.computeArcHeight(this.totalDistanceX);
        this.flightProgress = 0;
        this.lingerFrames = 0;
        this.hasTrajectory = true;

        return false;
    }

    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        super.reset(x, y, dam, 0, parameter_1, parameter_2);
        let resolvedLane: number | undefined;
        if (parameter_1 !== null && parameter_1 !== undefined) {
            resolvedLane = parameter_1 as number;
        } else if (angle !== null && angle !== undefined) {
            resolvedLane = angle as number;
        }
        if (resolvedLane !== undefined) {
            this.positionY = resolvedLane;
        }
        this.front = null;
        this.notarget = parameter_2 ?? null;
        this.resetTrajectory();
        return this;
    }


    onAcquire(): void {
        this.resetTrajectory();
    }

    move() {
        if (this.establishTrajectory()) {
            return true;
        }

        if (!this.hasTrajectory || this.startX === undefined || this.startY === undefined || this.targetX === undefined || this.targetY === undefined) {
            this.x += this.speed;
            return this.y >= level.row_end + level.row_gap
                || this.x <= level.column_start - level.column_gap
                || this.x >= level.column_end + level.row_gap;
        }

        let nextX = this.x + this.speed * this.horizontalDirection;
        if ((this.horizontalDirection > 0 && nextX > this.targetX) || (this.horizontalDirection < 0 && nextX < this.targetX)) {
            nextX = this.targetX;
        }
        this.x = nextX;

        const traveledX = Math.abs(this.x - (this.startX as number));
        this.flightProgress = Math.min(1, traveledX / this.totalDistanceX);

        const progress = this.flightProgress;
        const baseY = (this.startY as number) + ((this.targetY as number) - (this.startY as number)) * progress;
        const arcOffset = this.arcHeight * 4 * progress * (1 - progress);
        this.y = baseY - arcOffset;

        if (progress >= 1) {
            this.lingerFrames += 1;
            if (this.front === true && this.lingerFrames === 1) {
                this.createHitAnim();
            }
            if (this.front === true || this.lingerFrames > 6) {
                return true;
            }
        } else {
            this.lingerFrames = 0;
        }

        return this.y >= level.row_end + level.row_gap
            || this.x <= level.column_start - level.column_gap
            || this.x >= level.column_end + level.row_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 6, "/images/bullets/salad_hit.png", 4);
    }

    hit(target: null | Mouse) {
        if (target == null) {
            return null;
        } else {
            target.getThrown(this.damage);
            return this.target;
        }
    }
}
export class Bun extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    fireBoost(): Bullet | undefined {
        return new FireBullet(this.x, this.y, this.damage * 2, this.angle);
    }
}
export class FreezingBun extends BunPrototype {
    private offsetX: number;
    private offsetY: number;
    private tick: number = 0;
    private frames: number = 3;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.width = 72;
        this.offsetX = 44;
        this.offsetY = this.height;
        this.entity = "/images/bullets/snowbun.png";
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            const effects = isIRenderer(ctx) ? { isMirrored: this.angle === 180 } : undefined;
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY, effects as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    fireBoost(): Bullet | undefined {
        return new Bun(this.x, this.y, this.damage, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 16, "/images/bullets/snowbun_hit.png", 4);
    }

    hit(target: null | Mouse) {
        if (target == null) {
            return null;
        } else {
            this.createHitAnim();
            target.getFreezingHit(this.damage);
            return this.target;
        }
    }
}
export class FireBullet extends BunPrototype {
    private tick: number = 0;
    private frames: number = 4;
    private offsetX: number;
    private offsetY: number;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.width = 34;
        this.height = 16;

        this.offsetX = 34;
        this.offsetY = this.height;

        this.entity = "/images/bullets/firebullet.png";
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            const effects = isIRenderer(ctx) ? { isMirrored: this.angle === 180 } : undefined;
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY, effects as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 5, this.y - 35, "/images/bullets/firebullet_hit.png", 5);
    }

    hit(target: null | Mouse) {
        if (target == null) {
            return null;
        } else {
            this.createHitAnim();
            if (level.Mice[this.positionY] == null || level.Mice[this.positionY][Math.floor(this.positionX)] == null) {

            } else {
                for (let mouseElement of level.Mice[this.positionY][Math.floor(this.positionX)]) {
                    if (this.hitCheck(mouseElement)) {
                        if (mouseElement !== target) {
                            mouseElement.getBlast(Math.floor(this.damage / 5));
                        }
                    }
                }
            }
            target.getBlast(this.damage);
            return target;
        }
    }
}
export class WaterBullet extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.width = 22;
        this.height = 15;
        this.entity = "/images/bullets/waterbullet.png";
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    fireBoost(): Bullet | undefined {
        return new FireBullet(this.x, this.y, this.damage * 2, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "/images/bullets/waterbullet_hit.png", 2);
    }
}
export class WineBullet extends BunPrototype {
    private offsetX;
    private offsetY;
    private tick = 0;
    private frames = 4;
    private targetY;
    private line;
    private times;
    constructor(x = 0, y = 0, dam = 20, angle = 0, line = 0) {
        super(x, y, dam, angle);
        this.height = 30;
        this.width = 42;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.line = line;
        this.targetY = this.y;
        this.times = line ? 0 : undefined;
        if (line) {
            this.targetY = this.y + 64 * this.line;
        }

        this.entity = "/images/bullets/winebullet.png";
    }

    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        super.reset(x, y, dam, angle, parameter_1, parameter_2);
        this.tick = 0;
        this.line = parameter_1 ?? 0;
        this.targetY = y;
        this.times = this.line ? 0 : undefined;
        if (this.line) {
            this.targetY = y + 64 * this.line;
        }
        return this;
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            const effects = isIRenderer(ctx) ? { isMirrored: this.angle === 180 } : undefined;
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY, effects as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    move() {
        if (super.move()) {
            return true;
        } else {
            if (this.line) {
                if ((this.times as number) >= 8) {
                } else {
                    (this.times as number)++;
                    this.y += 8 * this.line;
                }
            }
            return false;
        }
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    fireBoost(): Bullet | undefined {
        return new FireBullet(this.x, this.targetY, this.damage * 2, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "/images/bullets/winebullet_hit.png", 6);
    }
}
export class Star extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.height = 33;
        this.width = 31;
        this.entity = "/images/bullets/star.png";
    }

    duplicate(): Bullet | undefined {
        return this;
    }

    createHitAnim() {
        return false;
    }
}
export class CoffeeBubble extends Bullet {
    private birthX;
    private tick = 0;
    private frames = 6;
    private offsetX;
    private offsetY;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.birthX = x;
        this.width = 45;
        this.height = 63;

        this.offsetX = this.width;
        this.offsetY = this.height;

        this.entity = "/images/bullets/bubble.png";
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            if (this.tick <= 3) {
                this.tick++;
            } else {
                this.tick = this.tick === this.frames ? 4 : this.tick + 1;
            }
            ctx.drawImage(img, this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY, undefined as any);
        }
    }

    move() {
        return super.move() || this.x - this.birthX >= 210;
    }

    createHitAnim() {
        return false;
    }
}
export class SausageAir extends Bullet {
    private _positionY = -1;
    public get positionY() {
        return this._positionY;
    }
    public set positionY(value) {
        this._positionY = value;
    }

    constructor(x = 0, y = 0, dam = 20, positionY: null | number = null) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.positionY = positionY!;

        this.entity = "/images/bullets/sausage.png";

        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.fly
                && (this.target = mouse || true)) ? (this.target) : null;
        }
    }

    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        super.reset(x, y, dam, 0, parameter_1, parameter_2);
        this.positionY = parameter_1 ?? -1;
        return this;
    }

    move(pos = null) {
        this.x = this.x + this.speed * Math.cos(this.angle * 2 * Math.PI / 360);
        this.y = this.y + this.speed * Math.sin(this.angle * 2 * Math.PI / 360);
        return this.y <= level.row_start - 64 || this.y >= level.row_end || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "/images/bullets/salad_hit.png", 4);
    }
}
export class SausageLand extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.entity = "/images/bullets/sausage.png";
    }

    duplicate(): Bullet | undefined {
        return undefined;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "/images/bullets/salad_hit.png", 4);
    }
}
export class Boomerang extends Bullet {
    speed = 14;
    targetX: number | null;
    targetY: number | null;
    animAngle: number = 0;
    offsetX;
    offsetY;
    tick = 0;
    frames = 6;
    constructor(x = 0, y = 0, dam = 20) {
        super(x, y, dam, 0);

        this.targetX = null;
        this.targetY = null;

        this.width = 32;
        this.height = 34;
        this.offsetX = this.width;
        this.offsetY = this.height;

        this.tick = 0;
        this.frames = 6;
        this.entity = "/images/bullets/boomerang.png";
    }

    move(pos = null) {
        const target = level?.Battlefield?.OverallFront;
        if (target !== null) {
            this.targetX = target.x + target.width / 3;
            this.targetY = (target.row + 2) * level.column_gap;
            let deltaX = (this.targetX as number) - this.x;
            let deltaY = this.targetY - this.y;

            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                return this.hit(target) || true;
            } else if (deltaX > 0 && deltaY > 0) {
                this.angle = Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            } else if (deltaX < 0 && deltaY > 0) {
                this.angle = Math.PI - Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            } else if (deltaX < 0 && deltaY < 0) {
                this.angle = Math.PI + Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            } else {
                this.angle = 2 * Math.PI - Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            }
        }
        this.x = this.x + this.speed * Math.cos(this.angle);
        this.y = this.y + this.speed * Math.sin(this.angle);

        this.animAngle = (this.animAngle + 60) % 360;

        return this.y >= level.row_end + level.row_gap || this.y <= level.row_start - level.row_gap || this.x <= level.column_start - level.column_gap || this.x >= level.column_end + level.column_gap;
    }

    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY, undefined as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    takeDamage() {
        return null;
    }

    createHitAnim() {
        return false;
    }

    hit(target: Mouse | null) {
        if (target == null || target.health < 0) {
            return null;
        } else {
            target.getHit(this.damage);
            return this.target;
        }
    }
}
export class Missile extends MissilePrototype {
    times;
    notarget: Mouse | null
    constructor(x = 0, y = 0, dam = 20, times = 1, positionY = 0, noTarget = null) {
        super(x, y, dam, positionY);
        this.times = times;
        this.notarget = noTarget;
    }

    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        const reusePositionY = parameter_1 ?? this.positionY;
        const reuseNotarget = parameter_2 ?? null;
        const reuseTimes = Number.isFinite(angle) ? Math.floor(Number(angle)) : 0;

        super.reset(x, y, dam, 0, reusePositionY, reuseNotarget);
        this.positionY = reusePositionY as number;
        this.times = Math.max(0, reuseTimes);
        this.notarget = reuseNotarget;
        return this;
    }

    hit(target: Mouse | null) {
        if (target == null || target === this.notarget) {
            return null;
        } else {
            if (this.times <= 0) {
                this.createHitAnim();
            } else {
                level.requestSummonBullet(Missile, this.x, this.y, this.damage / 2, this.times - 1, this.positionY, this.front);
            }
            target.getThrown(this.damage);
            return this.target;
        }
    }
}
export class ChocolateDot extends MissilePrototype {

    constructor(x = 0, y = 0, dam = 20, positionY: number | null = null) {
        super(x, y, dam, positionY!);
        this.width = 16;
        this.height = 13;
        this.entity = "/images/bullets/chocolate_0.png";
    }

    createHitAnim() {
        return false;
    }
}
export class Chocolate extends MissilePrototype {
    haltTime;
    constructor(x = 0, y = 0, dam = 20, positionY: number | null = null, haltTime = 5000) {
        super(x, y, dam, positionY!);
        this.width = 42;
        this.height = 33;
        this.haltTime = haltTime || 5000;
        this.entity = "/images/bullets/chocolate_1.png";
    }

    createHitAnim() {
        return false;
    }

    hit(target: Mouse | null) {
        if (target == null) {
            return null;
        } else {
            target.getHalted(this.haltTime, "/images/bullets/halted.png");
            target.getThrown(this.damage);
            return this.target;
        }
    }
}
export class Egg extends MissilePrototype {
    offsetX;
    offsetY;
    tick = 0;
    frames = 4;
    constructor(x = 0, y = 0, dam = 20, positionY: number | null = null) {
        super(x, y, dam, positionY!);
        this.width = 48;
        this.height = 46;
        this.speed = 14;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "/images/bullets/egg.png";
    }

    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY, undefined as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 43, this.y - 48, "/images/bullets/egg_hit.png", 5);
    }

    hit(target: Mouse | null) {
        if (target == null) {
            return null;
        } else {
            target.getThrown(this.damage);
            this.createHitAnim();
            let column = Math.floor(this.positionX);
            for (let i = Math.max(0, this.positionY - 1); i < Math.min(level.row_num, this.positionY + 2); i++) {
                if (level.Mice[i] != null) {
                    for (let j = Math.max(0, column - 1); j < Math.max(level.column_num, column + 2); j++) {
                        if (level.Mice[i][j] != null) {
                            for (let k = 0; k < level.Mice[i][j].length; k++) {
                                if (level.Mice[i][j][k] !== target
                                    && level.Mice[i][j][k].attackable
                                    && level.Mice[i][j][k].canBeThrown) {
                                    level.Mice[i][j][k].getThrown(Math.floor(this.damage * 0.2))
                                }
                            }
                        }
                    }
                }
            }
            return this.target;
        }
    }
}
export class SnowEgg extends MissilePrototype {
    offsetX;
    offsetY;
    tick = 0;
    frames = 5;
    constructor(x = 0, y = 0, dam = 20, positionY: number | null = null) {
        super(x, y, dam, positionY!);
        this.width = 49;
        this.height = 48;
        this.speed = 14;

        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "/images/bullets/snowegg.png";
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY, undefined as any);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 42, this.y - 50, "/images/bullets/snowegg_hit.png", 10);
    }

    hit(target: null | Mouse) {
        if (target == null || target === this.notarget) {
            return null;
        } else {
            target.getThrown(this.damage);
            target.getFreezing();
            this.createHitAnim();
            let column = Math.floor(this.positionX);
            for (let i = Math.max(0, this.positionY - 1); i < Math.min(level.row_num, this.positionY + 2); i++) {
                if (level.Mice[i] != null) {
                    for (let j = Math.max(0, column - 1); j < Math.max(level.column_num, column + 2); j++) {
                        if (level.Mice[i][j] != null) {
                            for (let k = 0; k < level.Mice[i][j].length; k++) {
                                if (level.Mice[i][j][k] !== target
                                    && level.Mice[i][j][k].attackable
                                    && level.Mice[i][j][k].canBeThrown) {
                                    level.Mice[i][j][k].getThrown(Math.floor(this.damage * 0.2))
                                    level.Mice[i][j][k].getFreezing();
                                }
                            }
                        }
                    }
                }
            }
            return this.target;
        }
    }
}
export class Stone {
    x: number;
    y: number;
    startY;
    width = 23;
    height = 17;
    targetPositionX: number;
    positionY: number;
    damage;
    speed = 12;
    speedY = 0;
    entity = "/images/bullets/stone.png";
    accelerationY?: number;
    get positionX() {
        return EventHandler.getPositionX(this.x);
    }

    get column() {
        return Math.floor(this.positionX);
    }

    constructor(x = 0, y = 0, dam = 20, positionY: number | null = null, targetPositionX: number | null = null) {

        this.x = x;
        this.y = y;
        this.startY = y;

        this.targetPositionX = targetPositionX!;

        this.positionY = positionY!;
        this.damage = dam;
    }

    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1: any = null, parameter_2: any = null) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.damage = dam;
        this.speedY = 0;
        this.accelerationY = undefined;
        if (typeof angle === "number" && !Number.isNaN(angle)) {
            this.positionY = angle;
        }
        this.targetPositionX = parameter_1 ?? null;
        return this;
    }
    createEntity(ctx: IRenderer | CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, undefined as any);
        }
    }

    move() {
        if (this.targetPositionX == null) {
            this.createHitAnim();
            return true;
        } else {
            let t = (this.x - (level.column_start + this.targetPositionX * level.column_gap)) / this.speed;
            this.accelerationY = 60 / t / t;

            this.x = this.x - this.speed;
            this.y = this.y + this.speedY * 0.618;

            this.speedY += this.accelerationY;

            return this.y >= this.startY + 120 || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
        }
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 28, this.y - 32, "/images/bullets/stone_hit.png", 5);
    }

    takeDamage() {
        if (this.positionX <= this.targetPositionX + 0.5) {
            for (let i = Math.max(this.positionY - 1, 0); i < Math.min(this.positionY + 2, level.row_num); i++) {
                for (let j = Math.max(Math.floor(this.targetPositionX) - 1, 0); j < Math.min(Math.floor(this.targetPositionX) + 2, level.column_num); j++) {
                    if (level.Foods[i * level.column_num + j] != null
                        && level.Foods[i * level.column_num + j].layer_1 != null && level.Foods[i * level.column_num + j].layer_1.airDefense) {
                        level.Foods[i * level.column_num + j].layer_1.defend();
                        return true;
                    }
                }
            }
            this.createHitAnim();
            if (level.Foods[this.positionY * level.column_num + Math.floor(this.targetPositionX)]) {
                level.Foods[this.positionY * level.column_num + Math.floor(this.targetPositionX)].getThrown(this.damage);
            }
            return true;
        }
        return false;
    }
}