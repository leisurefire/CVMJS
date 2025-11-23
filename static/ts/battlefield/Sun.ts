
import { level } from "../Level.js";
import type IRenderer from "../renderer/IRenderer.js";
import { GEH } from "../Core.js";

export default class Sun {
    reset(x: number, y: number, num: number, animation: boolean): Sun {
        this.x = x;
        this.y = y;
        this.num = num;
        this.hasAnimation = animation;
        this.loopTimes = 0;
        this.tick = 0;
        return this;
    }
    onAcquire(): void { }
    onRelease(): void { }

    static src = "/images/interface/sun.png";
    loopTimes: number = 0;
    tick: number = 0;
    collected: boolean = false;
    x: number = 0;
    y: number = 0;
    private num: number = 0;
    private hasAnimation: boolean = false;
    private acceleration: number = 0;
    private targetedTop: number = 33;
    private targetedLeft: number = 176;
    private span: number = 50 * 0.125;
    private scale: number = 1;
    private speedX: number = 0;
    private speedY: number = 0;
    private offsetY: number = 0;
    constructor(x: number, y: number, num: number, animation: boolean = false) {
        this.x = x;
        this.y = y;
        this.num = num;
        this.hasAnimation = animation;
        this.span = 50 / 8;

        if (animation) {
            this.y = y - 60;
        } else {
            this.offsetY = (Math.floor(Math.random() * 120) + level.row_start + 20) * GEH.scale;
            this.y = y;
        }

        if (level.Cards.length > 9) {
            this.targetedLeft += 132;
        }
    }

    behavior(ctx: IRenderer | CanvasRenderingContext2D) {
        if (this.tick === 9) {
            this.loopTimes++;
        }
        const currentConstructor = this.constructor as typeof Sun;
        const img = GEH.requestDrawImage(currentConstructor.src);
        const width = this.num >= 25 ? 100 : 64;
        ctx.drawImage(img!, 200 * this.tick, 0, 200, 200,
            this.x - width * this.scale / 2, this.y - width * this.scale / 2,
            width * this.scale, width * this.scale);
        this.tick = (this.tick + 1) % 10;

        if (this.collected) {
            this.y += this.speedY;
            this.x += this.speedX;
            this.scale -= 0.64 / this.span;
            return this.x > this.targetedLeft;
        } else {
            if (this.hasAnimation) {
                if (this.acceleration > 18) {
                    return true;
                } else {
                    this.x++;
                    this.y += this.acceleration;
                    this.acceleration += 3;
                    return true;
                }
            } else {
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
    }
}