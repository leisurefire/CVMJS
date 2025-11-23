import { level } from "../Level.js";
import { GEH } from "../Core.js";
export default class Sun {
    reset(x, y, num, animation) {
        this.x = x;
        this.y = y;
        this.num = num;
        this.hasAnimation = animation;
        this.loopTimes = 0;
        this.tick = 0;
        return this;
    }
    onAcquire() { }
    onRelease() { }
    static src = "/images/interface/sun.png";
    loopTimes = 0;
    tick = 0;
    collected = false;
    x = 0;
    y = 0;
    num = 0;
    hasAnimation = false;
    acceleration = 0;
    targetedTop = 33;
    targetedLeft = 176;
    span = 50 * 0.125;
    scale = 1;
    speedX = 0;
    speedY = 0;
    offsetY = 0;
    constructor(x, y, num, animation = false) {
        this.x = x;
        this.y = y;
        this.num = num;
        this.hasAnimation = animation;
        this.span = 50 / 8;
        if (animation) {
            this.y = y - 60;
        }
        else {
            this.offsetY = (Math.floor(Math.random() * 120) + level.row_start + 20) * GEH.scale;
            this.y = y;
        }
        if (level.Cards.length > 9) {
            this.targetedLeft += 132;
        }
    }
    behavior(ctx) {
        if (this.tick === 9) {
            this.loopTimes++;
        }
        const currentConstructor = this.constructor;
        const img = GEH.requestDrawImage(currentConstructor.src);
        const width = this.num >= 25 ? 100 : 64;
        ctx.drawImage(img, 200 * this.tick, 0, 200, 200, this.x - width * this.scale / 2, this.y - width * this.scale / 2, width * this.scale, width * this.scale);
        this.tick = (this.tick + 1) % 10;
        if (this.collected) {
            this.y += this.speedY;
            this.x += this.speedX;
            this.scale -= 0.64 / this.span;
            return this.x > this.targetedLeft;
        }
        else {
            if (this.hasAnimation) {
                if (this.acceleration > 18) {
                    return true;
                }
                else {
                    this.x++;
                    this.y += this.acceleration;
                    this.acceleration += 3;
                    return true;
                }
            }
            else {
                if (this.y >= this.offsetY) {
                    return true;
                }
                this.y += 3;
                return true;
            }
        }
    }
    collect = () => {
        if (this.collected) {
            return false;
        }
        GEH.requestPlayAudio("sun");
        this.collected = true;
        this.speedX = (this.targetedLeft - this.x) / this.span;
        this.speedY = (this.targetedTop - this.y) / this.span;
        level.SunNum += this.num;
        return true;
    };
}
