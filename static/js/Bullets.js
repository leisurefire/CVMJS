import EventHandler from "./EventHandler.js";
import { GEH } from "./Core.js";
import { level } from "./Level.js";
export class Bullet {
    x;
    y;
    angle;
    damage;
    CanBoost;
    speed;
    target;
    width;
    height;
    entity;
    hitCheck;
    birthPosition;
    _defaultCanBoost;
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
        this.entity = "../CVMJS/static/images/bullets/bun.png";
        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.canBeHit
                && (this.target = mouse || true)) ? (this.target) : null;
        };
    }
    restoreBoostFlag() {
        if (this._defaultCanBoost === undefined) {
            this._defaultCanBoost = this.CanBoost;
        }
        this.CanBoost = this._defaultCanBoost;
    }
    // reset for object pooling reuse
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
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
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
        }
    }
    move() {
        this.x = this.x + this.speed * Math.cos(this.angle * 2 * Math.PI / 360);
        this.y = this.y + this.speed * Math.sin(this.angle * 2 * Math.PI / 360);
        return this.y <= level.row_start || this.y >= level.row_end || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 14, this.y - 16, "../CVMJS/static/images/bullets/bun_hit.png", 4);
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
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
            this.createHitAnim();
            target.getHit(this.damage);
            return this.target;
        }
    }
    duplicate() {
        return undefined;
    }
    fireBoost() {
        return undefined;
    }
    onAcquire() {
        // Reserved for pooling lifecycle customization.
    }
    onRelease() {
        // Reserved for pooling lifecycle customization.
    }
}
/**
 * Bullet 对象池实现
 * - 使用构造函数的 `poolKey`（若有）或构造函数名作为池 key
 * - acquireBullet: 尝试从池中复用实例（默认允许复用），否则 new 新实例
 * - releaseBullet: 调用实例的 onRelease 并回收到池中（池大小有上限）
 *
 * 设计说明：将对象池放在 Bullets 模块中以便所有生产子弹的逻辑统一复用，
 * 通过 Bullet.reset/onAcquire/onRelease 支持子类进行自定义重置/回收处理。
 */
const _bulletPool = new Map();
const BULLET_POOL_MAX = 200;
/**
 * 获取/创建子弹实例
 */
export function acquireBullet(ctor, x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null, options) {
    const key = (ctor.poolKey || ctor.name);
    const pool = _bulletPool.get(key) || [];
    let instance;
    if (options?.reuse !== false && pool.length > 0) {
        instance = pool.pop();
        // 通用 reset 支持；子类可覆盖 reset 做额外初始化
        instance.reset(x, y, dam, angle, parameter_1, parameter_2);
    }
    else {
        // 尝试将参数透传给构造函数（兼容不同子类签名）
        instance = new ctor(x, y, dam, angle, parameter_1, parameter_2);
    }
    // 生命周期钩子
    if (typeof instance.onAcquire === "function") {
        instance.onAcquire();
    }
    if (options?.setup) {
        options.setup(instance);
    }
    return instance;
}
/**
 * 回收子弹实例到对象池
 */
export function releaseBullet(instance) {
    try {
        if (typeof instance.onRelease === "function") {
            instance.onRelease();
        }
    }
    catch (e) {
        // 忽略回收钩子中可能的异常，保证回收流程稳定
    }
    const ctor = instance.constructor;
    const key = (ctor.poolKey || ctor.name);
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
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
        }
    }
    duplicate() {
        return undefined;
    }
    fireBoost() {
        return undefined;
    }
}
class MissilePrototype extends Bullet {
    #positionY = -1;
    front;
    notarget;
    getFront;
    startX;
    startY;
    targetX;
    targetY;
    totalDistanceX = 0;
    flightProgress = 0;
    arcHeight = 0;
    lingerFrames = 0;
    hasTrajectory = false;
    horizontalDirection = 1;
    get positionY() {
        return this.#positionY;
    }
    set positionY(value) {
        this.#positionY = value;
    }
    constructor(x = 0, y = 0, dam = 20, positionY) {
        super(x, y, dam, 0);
        this.width = 17;
        this.height = 12;
        this.speed = 14;
        this.front = null;
        this.positionY = positionY;
        this.notarget = null;
        this.entity = "../CVMJS/static/images/bullets/salad.png";
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
        };
        this.resetTrajectory();
    }
    resetTrajectory() {
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
    computeArcHeight(distanceX) {
        const minHeight = 128;
        const maxHeight = 256;
        const scaled = distanceX * 0.3;
        return Math.max(minHeight, Math.min(maxHeight, scaled));
    }
    establishTrajectory() {
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
        let nextTargetX;
        let nextTargetY;
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
        }
        else if (this.front === true) {
            nextTargetX = level.column_end;
            nextTargetY = this.y;
        }
        else {
            const front = this.front;
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
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
        super.reset(x, y, dam, 0, parameter_1, parameter_2);
        let resolvedLane;
        if (parameter_1 !== null && parameter_1 !== undefined) {
            resolvedLane = parameter_1;
        }
        else if (angle !== null && angle !== undefined) {
            resolvedLane = angle;
        }
        if (resolvedLane !== undefined) {
            this.positionY = resolvedLane;
        }
        this.front = null;
        this.notarget = parameter_2 ?? null;
        this.resetTrajectory();
        return this;
    }
    onAcquire() {
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
        const traveledX = Math.abs(this.x - this.startX);
        this.flightProgress = Math.min(1, traveledX / this.totalDistanceX);
        const progress = this.flightProgress;
        const baseY = this.startY + (this.targetY - this.startY) * progress;
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
        }
        else {
            this.lingerFrames = 0;
        }
        return this.y >= level.row_end + level.row_gap
            || this.x <= level.column_start - level.column_gap
            || this.x >= level.column_end + level.row_gap;
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 6, "../CVMJS/static/images/bullets/salad_hit.png", 4);
    }
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
            target.getThrown(this.damage);
            return this.target;
        }
    }
}
export class Bun extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
    }
    duplicate() {
        return this;
    }
    fireBoost() {
        return new FireBullet(this.x, this.y, this.damage * 2, this.angle);
    }
}
export class FreezingBun extends BunPrototype {
    offsetX;
    offsetY;
    tick = 0;
    frames = 3;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.width = 72;
        this.offsetX = 44;
        this.offsetY = this.height;
        this.entity = "../CVMJS/static/images/bullets/snowbun.png";
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    duplicate() {
        return this;
    }
    fireBoost() {
        return new Bun(this.x, this.y, this.damage, this.angle);
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 16, "../CVMJS/static/images/bullets/snowbun_hit.png", 4);
    }
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
            this.createHitAnim();
            target.getFreezingHit(this.damage);
            return this.target;
        }
    }
}
export class FireBullet extends BunPrototype {
    tick = 0;
    frames = 4;
    offsetX;
    offsetY;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.width = 34;
        this.height = 16;
        this.offsetX = 34;
        this.offsetY = this.height;
        this.entity = "../CVMJS/static/images/bullets/firebullet.png";
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    duplicate() {
        return this;
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 5, this.y - 35, "../CVMJS/static/images/bullets/firebullet_hit.png", 5);
    }
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
            this.createHitAnim();
            if (level.Mice[this.positionY] == null || level.Mice[this.positionY][Math.floor(this.positionX)] == null) {
            }
            else {
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
        this.entity = "../CVMJS/static/images/bullets/waterbullet.png";
    }
    duplicate() {
        return this;
    }
    fireBoost() {
        return new FireBullet(this.x, this.y, this.damage * 2, this.angle);
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "../CVMJS/static/images/bullets/waterbullet_hit.png", 2);
    }
}
export class WineBullet extends BunPrototype {
    offsetX;
    offsetY;
    tick = 0;
    frames = 4;
    targetY;
    line;
    times;
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
        this.entity = "../CVMJS/static/images/bullets/winebullet.png";
    }
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
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
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    move() {
        if (super.move()) {
            return true;
        }
        else {
            if (this.line) {
                if (this.times >= 8) {
                }
                else {
                    this.times++;
                    this.y += 8 * this.line;
                }
            }
            return false;
        }
    }
    duplicate() {
        return this;
    }
    fireBoost() {
        return new FireBullet(this.x, this.targetY, this.damage * 2, this.angle);
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "../CVMJS/static/images/bullets/winebullet_hit.png", 6);
    }
}
export class Star extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.height = 33;
        this.width = 31;
        this.entity = "../CVMJS/static/images/bullets/star.png";
    }
    duplicate() {
        return this;
    }
    createHitAnim() {
        return false;
    }
}
export class CoffeeBubble extends Bullet {
    birthX;
    tick = 0;
    frames = 6;
    offsetX;
    offsetY;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.birthX = x;
        this.width = 45;
        this.height = 63;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "../CVMJS/static/images/bullets/bubble.png";
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            if (this.tick <= 3) {
                this.tick++;
            }
            else {
                this.tick = this.tick === this.frames ? 4 : this.tick + 1;
            }
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
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
    _positionY = -1;
    get positionY() {
        return this._positionY;
    }
    set positionY(value) {
        this._positionY = value;
    }
    constructor(x = 0, y = 0, dam = 20, positionY = null) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.positionY = positionY;
        this.entity = "../CVMJS/static/images/bullets/sausage.png";
        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.fly
                && (this.target = mouse || true)) ? (this.target) : null;
        };
    }
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
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
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "../CVMJS/static/images/bullets/salad_hit.png", 4);
    }
}
export class SausageLand extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.entity = "../CVMJS/static/images/bullets/sausage.png";
    }
    duplicate() {
        return undefined;
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "../CVMJS/static/images/bullets/salad_hit.png", 4);
    }
}
export class Boomerang extends Bullet {
    speed = 14;
    targetX;
    targetY;
    animAngle = 0;
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
        this.entity = "../CVMJS/static/images/bullets/boomerang.png";
    }
    move(pos = null) {
        const target = level?.Battlefield?.OverallFront;
        if (target !== null) {
            this.targetX = target.x + target.width / 3;
            this.targetY = (target.row + 2) * level.column_gap;
            let deltaX = this.targetX - this.x;
            let deltaY = this.targetY - this.y;
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                return this.hit(target) || true;
            }
            else if (deltaX > 0 && deltaY > 0) {
                this.angle = Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            }
            else if (deltaX < 0 && deltaY > 0) {
                this.angle = Math.PI - Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            }
            else if (deltaX < 0 && deltaY < 0) {
                this.angle = Math.PI + Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            }
            else {
                this.angle = 2 * Math.PI - Math.atan(Math.abs(deltaY / deltaX));
                this.angle = (this.angle) % (Math.PI * 2);
            }
        }
        this.x = this.x + this.speed * Math.cos(this.angle);
        this.y = this.y + this.speed * Math.sin(this.angle);
        this.animAngle = (this.animAngle + 60) % 360;
        return this.y >= level.row_end + level.row_gap || this.y <= level.row_start - level.row_gap || this.x <= level.column_start - level.column_gap || this.x >= level.column_end + level.column_gap;
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    takeDamage() {
        return null;
    }
    createHitAnim() {
        return false;
    }
    hit(target) {
        if (target == null || target.health < 0) {
            return null;
        }
        else {
            target.getHit(this.damage);
            return this.target;
        }
    }
}
export class Missile extends MissilePrototype {
    times;
    notarget;
    constructor(x = 0, y = 0, dam = 20, times = 1, positionY = 0, noTarget = null) {
        super(x, y, dam, positionY);
        this.times = times;
        this.notarget = noTarget;
    }
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
        const reusePositionY = parameter_1 ?? this.positionY;
        const reuseNotarget = parameter_2 ?? null;
        const reuseTimes = Number.isFinite(angle) ? Math.floor(Number(angle)) : 0;
        super.reset(x, y, dam, 0, reusePositionY, reuseNotarget);
        this.positionY = reusePositionY;
        this.times = Math.max(0, reuseTimes);
        this.notarget = reuseNotarget;
        return this;
    }
    hit(target) {
        if (target == null || target === this.notarget) {
            return null;
        }
        else {
            if (this.times <= 0) {
                this.createHitAnim();
            }
            else {
                level.requestSummonBullet(Missile, this.x, this.y, this.damage / 2, this.times - 1, this.positionY, this.front);
            }
            target.getThrown(this.damage);
            return this.target;
        }
    }
}
export class ChocolateDot extends MissilePrototype {
    constructor(x = 0, y = 0, dam = 20, positionY = null) {
        super(x, y, dam, positionY);
        this.width = 16;
        this.height = 13;
        this.entity = "../CVMJS/static/images/bullets/chocolate_0.png";
    }
    createHitAnim() {
        return false;
    }
}
export class Chocolate extends MissilePrototype {
    haltTime;
    constructor(x = 0, y = 0, dam = 20, positionY = null, haltTime = 5000) {
        super(x, y, dam, positionY);
        this.width = 42;
        this.height = 33;
        this.haltTime = haltTime || 5000;
        this.entity = "../CVMJS/static/images/bullets/chocolate_1.png";
    }
    createHitAnim() {
        return false;
    }
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
            target.getHalted(this.haltTime, "../CVMJS/static/images/bullets/halted.png");
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
    constructor(x = 0, y = 0, dam = 20, positionY = null) {
        super(x, y, dam, positionY);
        this.width = 48;
        this.height = 46;
        this.speed = 14;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "../CVMJS/static/images/bullets/egg.png";
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 43, this.y - 48, "../CVMJS/static/images/bullets/egg_hit.png", 5);
    }
    hit(target) {
        if (target == null) {
            return null;
        }
        else {
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
                                    level.Mice[i][j][k].getThrown(Math.floor(this.damage * 0.2));
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
    constructor(x = 0, y = 0, dam = 20, positionY = null) {
        super(x, y, dam, positionY);
        this.width = 49;
        this.height = 48;
        this.speed = 14;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "../CVMJS/static/images/bullets/snowegg.png";
    }
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }
    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 42, this.y - 50, "../CVMJS/static/images/bullets/snowegg_hit.png", 10);
    }
    hit(target) {
        if (target == null || target === this.notarget) {
            return null;
        }
        else {
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
                                    level.Mice[i][j][k].getThrown(Math.floor(this.damage * 0.2));
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
    x;
    y;
    startY;
    width = 23;
    height = 17;
    targetPositionX;
    positionY;
    damage;
    speed = 12;
    speedY = 0;
    entity = "../CVMJS/static/images/bullets/stone.png";
    accelerationY;
    get positionX() {
        return EventHandler.getPositionX(this.x);
    }
    get column() {
        return Math.floor(this.positionX);
    }
    constructor(x = 0, y = 0, dam = 20, positionY = null, targetPositionX = null) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.targetPositionX = targetPositionX;
        this.positionY = positionY;
        this.damage = dam;
    }
    reset(x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
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
    createEntity(ctx) {
        const img = GEH.requestDrawImage(this.entity);
        if (img) {
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
        }
    }
    move() {
        if (this.targetPositionX == null) {
            this.createHitAnim();
            return true;
        }
        else {
            let t = (this.x - (level.column_start + this.targetPositionX * level.column_gap)) / this.speed;
            this.accelerationY = 60 / t / t;
            this.x = this.x - this.speed;
            this.y = this.y + this.speedY * 0.618;
            this.speedY += this.accelerationY;
            return this.y >= this.startY + 120 || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
        }
    }
    createHitAnim() {
        level?.createSpriteAnimation(this.x - 28, this.y - 32, "../CVMJS/static/images/bullets/stone_hit.png", 5);
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
