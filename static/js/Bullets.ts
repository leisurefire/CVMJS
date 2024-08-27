import EventHandler from "./EventHandler.js";
import {GEH} from "./Core.js";
import {level} from "./Level.js";
import {Mouse} from "./Mice";
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
    get positionX(){
        return EventHandler.getPositionX(this.x);
    }
    get column(){
        return Math.floor(this.positionX);
    }
    get positionY(){
        return Math.floor(EventHandler.getPositionY(this.y));
    }

    get position(){
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

        this.entity = "../static/images/bullets/bun.png";

        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.canBeHit
                && (this.target = mouse || true)) ? (this.target) : null;
        }
    }

    createEntity(ctx: CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
        }
    }

    move() {
        this.x = this.x + this.speed * Math.cos(this.angle * 2 * Math.PI / 360);
        this.y = this.y + this.speed * Math.sin(this.angle * 2 * Math.PI / 360);
        return this.y <= level.row_start || this.y >= level.row_end || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 14, this.y - 16, "../static/images/bullets/bun_hit.png", 4);
    }

    takeDamage() {
        if (level.Mice[this.positionY] == null) {
            return false;
        }
        else {
            if(level.Mice[this.positionY][this.column]){
                for (let i = 0; i < level.Mice[this.positionY][this.column].length; i++) {
                    if(this.hitCheck(level.Mice[this.positionY][this.column][i])){
                        return this.hit(this.target);
                    }
                }
            }
            if(level.Mice[this.positionY][this.column - 1]){
                for (let i = 0; i < level.Mice[this.positionY][this.column - 1].length; i++) {
                    if(this.hitCheck(level.Mice[this.positionY][this.column - 1][i])){
                        return this.hit(this.target);
                    }
                }
            }
        }
        return false;
    }

    hit(target: null|Mouse) {
        if (target == null) {
            return null;
        } else {
            this.createHitAnim();
            target.getHit(this.damage);
            return (this.target as unknown as Mouse);
        }
    }

    duplicate() {
        return;
    }

    fireBoost() {
        return;
    }
}
class BunPrototype extends Bullet{
    CanBoost = true;
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
    }

    createEntity(ctx: CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if(img){
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
        }
    }

    duplicate() {
        return;
    }

    fireBoost() {
        return;
    }
}
class MissilePrototype extends Bullet{
    #positionY = -1;
    protected front: null|Mouse|Boolean;
    notarget: null|Mouse;
    private getFront: (mouse:Mouse) => Mouse | boolean | null;
    private startY?: number;
    private speedY: number = 0;
    private accelerationY: number = 0;
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

        this.entity = "../static/images/bullets/salad.png";

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
    }

    move() {
        if (this.front == null && level.Mice[this.positionY]) {
            let targetX;
            let targetY;
            for (let i = Math.floor(this.positionX); i < level.Mice[this.positionY].length; i++) {
                if (level.Mice[this.positionY][i] != null) {
                    level.Mice[this.positionY][i].forEach(this.getFront);
                    if (this.front != null) {
                        break;
                    }
                }
            }
            if (this.front == null) {
                if (this.notarget != null) {
                    this.createHitAnim();
                    return true;
                }
                targetX = level.column_end;
                targetY = this.y;
                this.front = true;
            } else {
                const front = this.front as Mouse;
                targetX = level.column_start + 60 * (front.positionX)
                targetY = this.y + 30;
            }

            const t = (targetX - this.x) / this.speed;
            this.startY = this.y;
            this.speedY = this.speed / 1.2;

            this.accelerationY = Math.abs(2 * (this.speedY * t - this.y + targetY) / t / t);

        }
        this.x = this.x + this.speed;
        this.y = this.y - this.speedY;
        this.speedY -= this.accelerationY;

        return this.y >= (this.startY as number) + 30 || this.x <= level.column_start - level.column_gap || this.x >= level.column_end + level.row_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 6, "../static/images/bullets/salad_hit.png", 4);
    }

    hit(target: null|Mouse) {
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

    duplicate() {
        return;
    }

    fireBoost() {
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
        this.entity = "../static/images/bullets/snowbun.png";
    }


    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if(img){
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    duplicate() {
        return true;
    }

    fireBoost() {
        return new Bun(this.x, this.y, this.damage, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 8, this.y - 16, "../static/images/bullets/snowbun_hit.png", 4);
    }

    hit(target:null|Mouse) {
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

        this.entity = "../static/images/bullets/firebullet.png";
    }

    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if(img){
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    duplicate() {
        return true;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 5, this.y - 35, "../static/images/bullets/firebullet_hit.png", 5);
    }

    hit(target:null|Mouse) {
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
        this.entity = "../static/images/bullets/waterbullet.png";
    }

    duplicate() {
        return true;
    }

    fireBoost() {
        return new FireBullet(this.x, this.y, this.damage * 2, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "../static/images/bullets/waterbullet_hit.png", 2);
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
        this.targetY = this.y;

        if (line) {
            this.line = line;
            this.times = 0;
            this.targetY = this.y + 64 * this.line;
        }

        this.entity = "../static/images/bullets/winebullet.png";
    }

    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity, this.angle === 180 ? "mirror" : null);
        if(img){
            ctx.drawImage(img,
                this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY);
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

    duplicate() {
        return true;
    }

    fireBoost() {
        return new FireBullet(this.x, this.targetY, this.damage * 2, this.angle);
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 15, this.y - 24, "../static/images/bullets/winebullet_hit.png", 6);
    }
}
export class Star extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20, angle = 0) {
        super(x, y, dam, angle);
        this.height = 33;
        this.width = 31;
        this.entity = "../static/images/bullets/star.png";
    }

    duplicate() {
        return true;
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

        this.entity = "../static/images/bullets/bubble.png";
    }

    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
            if (this.tick <= 3) {
                this.tick++;
            } else {
                this.tick = this.tick === this.frames ? 4 : this.tick + 1;
            }
            ctx.drawImage(img, this.offsetX * this.tick, 0,
                this.offsetX, this.offsetY, this.x - this.width / 2, this.y - this.height / 2,
                this.offsetX, this.offsetY);
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

    constructor(x = 0, y = 0, dam = 20, positionY:null|number = null) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.positionY = positionY!;

        this.entity = "../static/images/bullets/sausage.png";

        this.hitCheck = (mouse) => {
            return (Math.abs(mouse.positionX - this.positionX) <= 0.5
                && mouse.attackable
                && mouse.fly
                && (this.target = mouse || true)) ? (this.target) : null;
        }
    }

    move(pos = null) {
        this.x = this.x + this.speed * Math.cos(this.angle * 2 * Math.PI / 360);
        this.y = this.y + this.speed * Math.sin(this.angle * 2 * Math.PI / 360);
        return this.y <= level.row_start - 64 || this.y >= level.row_end || this.x <= level.column_start || this.x >= level.column_end + level.column_gap;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "../static/images/bullets/salad_hit.png", 4);
    }
}
export class SausageLand extends BunPrototype {
    constructor(x = 0, y = 0, dam = 20) {
        super(x, y, dam, 0);
        this.width = 19;
        this.height = 14;
        this.entity = "../static/images/bullets/sausage.png";
    }

    duplicate() {
        return true;
    }

    createHitAnim() {
        level?.createSpriteAnimation(this.x - 24, this.y - 20, "../static/images/bullets/salad_hit.png", 4);
    }
}
export class Boomerang extends Bullet {
    speed = 14;
    targetX:number|null;
    targetY:number|null;
    animAngle:number = 0;
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
        this.entity = "../static/images/bullets/boomerang.png";
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
    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
           ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
           this.tick = (this.tick + 1) % this.frames;
        }
    }

    takeDamage() {
        return null;
    }

    createHitAnim() {
        return false;
    }

    hit(target:Mouse|null) {
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

    constructor(x = 0, y = 0, dam = 20, positionY :number|null = null) {
        super(x, y, dam, positionY!);
        this.width = 16;
        this.height = 13;
        this.entity = "../static/images/bullets/chocolate_0.png";
    }

    createHitAnim() {
        return true;
    }
}
export class Chocolate extends MissilePrototype {
    haltTime;
    constructor(x = 0, y = 0, dam = 20, positionY:number|null = null, haltTime = 5000) {
        super(x, y, dam, positionY!);
        this.width = 42;
        this.height = 33;
        this.haltTime = haltTime || 5000;
        this.entity = "../static/images/bullets/chocolate_1.png";
    }

    createHitAnim() {
        return true;
    }

    hit(target:Mouse|null){
        if (target == null) {
            return null;
        } else {
            target.getHalted(this.haltTime, "../static/images/bullets/halted.png");
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
    constructor(x = 0, y = 0, dam = 20, positionY:number|null = null) {
        super(x, y, dam, positionY!);
        this.width = 48;
        this.height = 46;
        this.speed = 14;
        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "../static/images/bullets/egg.png";
    }
    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 43, this.y - 48, "../static/images/bullets/egg_hit.png", 5);
    }

    hit(target:Mouse|null) {
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
    constructor(x = 0, y = 0, dam = 20, positionY:number|null = null) {
        super(x, y, dam, positionY!);
        this.width = 49;
        this.height = 48;
        this.speed = 14;

        this.offsetX = this.width;
        this.offsetY = this.height;
        this.entity = "../static/images/bullets/snowegg.png";
    }

    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
            ctx.drawImage(img, this.offsetX * this.tick, 0, this.offsetX, this.offsetY,
                this.x - this.width / 2, this.y - this.height / 2, this.offsetX, this.offsetY);
            this.tick = (this.tick + 1) % this.frames;
        }
    }

    createHitAnim() {
        GEH.requestPlayAudio('zadao');
        level?.createSpriteAnimation(this.x - 42, this.y - 50, "../static/images/bullets/snowegg_hit.png", 10);
    }

    hit(target:null|Mouse) {
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
    x:number;
    y:number;
    startY;
    width = 23;
    height = 17;
    targetPositionX:number;
    positionY:number;
    damage;
    speed = 12;
    speedY = 0;
    entity = "../static/images/bullets/stone.png";
    accelerationY?:number;
    get positionX(){
        return EventHandler.getPositionX(this.x);
    }

    get column(){
        return Math.floor(this.positionX);
    }

    constructor(x = 0, y = 0, dam = 20, positionY = null, targetPositionX = null) {

        this.x = x;
        this.y = y;
        this.startY = y;

        this.targetPositionX = targetPositionX!;

        this.positionY = positionY!;
        this.damage = dam;
    }

    createEntity(ctx:CanvasRenderingContext2D) {
        const img = GEH.requestDrawImage(this.entity);
        if(img){
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
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
        level?.createSpriteAnimation(this.x - 28, this.y - 32, "../static/images/bullets/stone_hit.png", 5);
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