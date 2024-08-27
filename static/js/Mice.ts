//注意，老鼠的行数（.y）属性不是实时变化的，请在尝试移动其位置后改变它的.y属性，否则子弹检测不到
import EventHandler from "./EventHandler.js";
import {GEH} from "./Core.js";
import {Stone} from "./Bullets.js";
import {Food, TubeIn} from "./Foods.js";
import {GAME_ERROR_CODE_013} from "./language/Chinese.js";
import {level, MapGrid} from "./Level.js";

class State{
    #tick:number = 0;
    #map:Map<string,number>;
    #name:string;
    #length:number;
    get name(){
        return this.#name;
    }
    set name(value: string){
        if(this.#map.has(value)){
            this.#name = value;
            this.#length = this.#map.get(value) as number;
        }
    }
    get length(){
        return this.#length;
    }
    constructor(name: string, length: number, map:Map<string, number>) {
        this.#map = map;
        this.#name = name;
        this.#length = length;
    }
    behavior(){
        this.#tick++;
    }
    toString() {
        return `${this.name}`;
    }
    update(map:{key: string, value: number}){
        if(this.#map.has(map.key)){
            this.#map.set(map.key, map.value);
        }
        else {
            throw `Key not found.`;
        }
    }
}
export class Mouse {
    ctx = level.Battlefield.Canvas.getContext('2d');
    name = "commonmouse";
    static alternative: typeof Mouse[] = [];
    #health = 240;
    #armorHealth = 0;
    x: number;
    y: number;
    row: number = -1;
    private ignoringTargetPositionX?: number;
    protected ignoringFullDistance?: number;
    private ignoringBeforeSpeed?: number;
    private ignoringBeforeTop?: number;
    private ignoringCurrentDistance?: number;
    get armorHealth(){
        return this.#armorHealth;
    }
    set armorHealth(value){
        if(value < this.#armorHealth){
            this.getDamagedTag = 2;
        }
        this.#armorHealth = value;
    }
    progress?: HTMLDivElement;
    get health(){
        return this.#health;
    }
    set health(value){
        if(value < this.#health){
            this.getDamagedTag = 2;
        }
        if(this.#health > 0 && value <= 0){
            this.die();
        }
        this.#health = value;
    }
    get critical(){
        return this.health <= 80;
    }
    fullHealth = this.health;
    width = 120;
    height = 105;
    get entity(){
        if(this.state === "die"){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "") + ".png";
        }
    }

    get CanUpdateEntity(){
        return !this.frozen
            && !this.halted
            && !this.changingLine
            // && !this.stunned;
    }
    get Movable(){      //是否可以移动，动画仍然会更新
        return this.speed !== 0
            && !(this.state === "attack")
            && !(this.state === "die");
    }
    speed = 1;  //速度，用于调整行为树
    damage = 5; //一般为5
    attackable = true;  //是否可以被攻击
    canBeHit = true;    //是否可以被直线子弹攻击
    canBeThrown = true;     //是否可以被投掷子弹攻击
    canBeFollowed = true;   //是否可跟踪
    fly = false;        //是否属于空中单位
    getDamagedTag = 0;
    freezingLength = 0; //剩余减速时长
    get freezing(){
        return this.freezingLength > 0;
    }
    frozenLength = 0;   //剩余冻结时长
    get frozen(){
        return this.frozenLength > 0;
    }
    haltedLength = 0;   //剩余定身时长
    get halted(){
        return this.haltedLength > 0;
    }
    haltedAttachment:string|null = null;    //定身时头上的巧克力贴图
    changeLineLength = 0;
    changeLinePos = 0;
    get changingLine(){
        return this.changeLineLength > 0;
    }
    ignoring = false;   //是否正在爬梯子
    #state = "idle";
    get state(){
        return this.#state;
    }
    set state(value){
        if(this.#state !== "die"){
            this.#state = value;
        }
    }
    get stateLength(){
        return this.stateLengthSet.get(this.state) || 0;
    }
    stateSet = ["idle", "attack", "die"];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 13]]);
    tick = 0;           //动画刻，用于控制动画
    eyePos = {          //眼睛位置，不过没怎么校准
        x: 6,
        y: 4,
    }
    constructor(x = 0, y = 0) {

        this.row = y;
        this.x = x * 60 + 300;
        this.y = y * 64 + 74;
    }
    get positionX(){
        return EventHandler.getPositionX(this.x + 21);
    }
    get column(){
        return Math.min(Math.max(Math.floor(this.positionX), 0), 9);
    }
    behaviorMove() {
        if (Math.floor(this.positionX) < 0) {
            if (this.speed > 0) {
                if(level){
                    if (level.Guardians[this.row] && !level.Guardians[this.row].onAttack) {
                        level.Guardians[this.row].awake();
                    }
                }
                if (Math.floor(this.positionX) < -1) {
                    level.defeat();
                }
            }
        }
    }
    behaviorAnim() {
        this.attackCheck();
    }
    changeLineProcess(){
        if(this.changingLine){
            this.changeLineLength -= 50;
            if(this.changingLine){
                if(this.state !== this.stateSet[2]){
                    this.state = this.stateSet[0];
                    this.tick = 0;
                }
                if(this.changeLineLength <= 500){
                    this.y += 6.4 * this.changeLinePos;
                }
            }
            else {
                this.row += this.changeLinePos;
            }
        }
    }
    changeLine(pos: number, animation = false) {
        if (this.CanUpdateEntity) {
            if (level.waterLine && level.waterLine[this.row]) {
                if (this.row + pos < level.row_num && this.row + pos >= 0 && level.waterLine[this.row + pos]) {
                } else {
                    pos = -pos;
                    if (this.row + pos < level.row_num && this.row + pos >= 0 && level.waterLine[this.row + pos]) {
                    } else {
                        pos = 0;
                    }
                }
                } else {
                if (this.row + pos < level.row_num && this.row + pos >= 0 && (!level.waterLine || !level.waterLine[this.row + pos])) {
                } else {
                    pos = -pos;
                    if (this.row + pos < level.row_num && this.row + pos >= 0 && (!level.waterLine || !level.waterLine[this.row + pos])) {
                    } else {
                        pos = 0;
                    }
                }
            }
            if(pos !== 0){
                if(animation){
                    this.changeLinePos = pos;
                    this.changeLineLength = 1600;
                }
                else {
                    this.y += 64 * pos;
                    this.row += pos;
                }
            }
        }
    }
    attackCheck() {
        if(this.CanUpdateEntity && this.column <= 8){
            const food = level.Foods[this.row * level.column_num + this.column];
            if(food?.hasTarget){
                if (food.ignored) {
                    this.ignore();
                    return false;
                } else {
                    GEH.requestPlayAudio("ken", this);
                    this.state = this.stateSet[1];
                    food.getDamaged(this.damage / (this.freezing ? 2 : 1), this);
                    return food;
                }
            }
            else {
                this.state = this.stateSet[0];
                this.tick = this.tick % this.stateLength;
                return false;
            }
        }
        return false;
    }
    getOverturned(value = 20) {
        this.getDamaged(value);
    }
    getHit(value = 20) {
        GEH.requestPlayAudio("commonhit");
        this.getDamaged(value);
    }
    getThrown(value = 20) {
        this.getHit(value);
    }
    getFreezingHit(value = 20, length = 10000) {
        this.getHit(value);
        this.getFreezing(length);
    }
    getBlast(value = 20) {
        this.getDamaged(value);
        this.freezingLength = 0;
        this.frozenLength = 0;
        this.tick = Math.floor(this.tick);
        if(this.state === this.stateSet[2]){
            this.tick = this.stateLength - 1;
            level?.createSpriteAnimation(this.positionX * 60 + 300, this.row * 64 + 78,
                    "../static/images/interface/ash.png", 15, {zIndex: this.row * level.column_num + this.column});
        }
    }
    getDamaged(value = 20) {
        this.health = this.health - value;
    }
    getFreezing(length = 10000) {
        this.freezingLength = Math.max(length, this.freezingLength);
    }
    getFrozen(length = 5000) {
        this.frozenLength = Math.max(length, this.frozenLength);
    }
    getHalted(length = 5000, attachment:string|null = null) {
        this.haltedLength = Math.max(length, this.haltedLength);
        this.haltedAttachment = attachment;
    }
    ignore() {
        if (this.ignoring) {
            return false;
        } else {
            this.ignoring = true;
            this.ignoringTargetPositionX = this.column - 0.2;
            this.ignoringFullDistance = this.positionX - this.ignoringTargetPositionX;
            this.ignoringBeforeSpeed = this.speed;
            this.ignoringBeforeTop = this.y;
            this.speed = this.ignoringFullDistance * level.column_gap / 5;
            return true;
        }
    }
    ignoreProcess() {
        if (this.ignoring && this.Movable && this.ignoringTargetPositionX && this.ignoringFullDistance) {
            this.ignoringCurrentDistance = this.positionX - this.ignoringTargetPositionX;
            if (this.ignoringCurrentDistance >= this.ignoringFullDistance / 2) {
                this.y -= 12;
            } else {
                this.y += 12;
                if (this.ignoringCurrentDistance <= 0
                    && typeof this.ignoringBeforeSpeed === 'number'
                    && typeof this.ignoringBeforeTop === 'number') {
                    this.speed = this.ignoringBeforeSpeed;
                    this.y = this.ignoringBeforeTop;
                    this.ignoring = false;
                }
            }
        }
    }
    freezeProcess() {
        if (this.frozenProcess()) {

        } else {
            if (this.freezing) {
                this.freezingLength -= 50;
            }
            else {
                this.tick = (Math.floor(this.tick));
            }
        }
    }
    frozenProcess() {
        if (this.frozen) {
            this.frozenLength -= 50;
            if(this.frozen){
                const img = GEH.requestDrawImage("../static/images/interface/ice.png");
                if(img){
                    this.ctx.drawImage(img, level.column_start + this.positionX * level.row_gap - 12,
                        level.row_start + (this.row + 1) * level.column_gap - 32);
                }
            }
            else {
                level?.createSpriteAnimation(level.column_start + (this.positionX - 1) * level.row_gap - 24,
                    level.row_start + this.row * level.column_gap - 8,
                    "../static/images/interface/ice_break.png",
                    6, {zIndex: this.row * level.column_num + this.column});
                GEH.requestPlayAudio("pobing");
            }
            return true;
        }
        return false;
    }
    haltedProcess() {
        if (this.halted) {
            const img = GEH.requestDrawImage(this.haltedAttachment!);
            if(img){
                this.ctx.drawImage(img, level.column_start + (this.positionX - 1) * level.row_gap + 42,
                    level.row_start + this.row * level.column_gap - 32);
            }
            this.haltedLength -= 50;
            return true;
        }
        else {
            this.haltedAttachment = null;
            return false;
        }
    }
    die() {
        this.state = this.stateSet[2];
        this.tick = 0;
        this.attackable = false;
    }
    remove() {
        this.stateLengthSet.set("die", 1);
        this.die();
        this.tick = 0;
    }
}
class ArmoredMouse extends Mouse {
    name = "footballfanmouse";
    armored = true;
    #armorHealth = 240;
    get armorCritical(){
        return this.#armorHealth <= 80;
    }
    stateSet = ['idle','attack','die','unarmor'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 13],["unarmor", 8]]);
    get entity(){
        if(this.state === this.stateSet[2]){
             return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
            if(this.state === this.stateSet[3]){
                if(this.unarmoredFrom === 'unarmor'){
                    this.unarmoredFrom = 'idle';
                }
                return "../static/images/mice/" + this.name + "/" + this.state + "_" + this.unarmoredFrom + ".png";
            }
            else {
               return "../static/images/mice/" + this.name + "/" + this.state +
                   (this.critical ? "_critical" : (this.armored ? ("_armored" +
                       (this.armorCritical ? "_critical" : "")) : "")) + ".png";
            }
        }
    }
    height = 135;
    width = 150;
    unarmoredFrom = this.state;
    eyePos = {
        x: -35,
        y: 30,
    }
    constructor(x = 0, y = 0) {
        super(x, y);
        this.fullHealth = this.health + this.armorHealth;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 60);
    }

    behaviorAnim() {
        if (this.state === "unarmor") {
            const tick = this.tick;
            this.attackCheck();
            this.tick = tick;
            this.unarmoredFrom = this.state;
            if (this.tick < this.stateLength - 1) {
                this.state = "unarmor";
            }
        }
        else {
            super.behaviorAnim();
        }
    }
    getDamaged(value = 20) {
        if (this.armorHealth > 0 && this.armored) {
            this.armorHealth -= value;
            if(this.armorHealth < 0){
                value = - this.armorHealth;
                this.armorHealth = 0;
                this.unarmored();
                return super.getDamaged(value);
            }
        }
        else {
            return super.getDamaged(value);
        }
    }
    unarmored() {
        if(this.armored){
            this.armored = false;
            this.state = this.stateSet[3];
        }
    }
}
class WaterMouse extends Mouse {
    name = "paperboatmouse";
    stateSet = ['idle','attack','die','dive'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 13],["dive", 10]]);
    width = 121;
    height = 175;
    inWater = false;
    ripple = "../static/images/ripple.png";
    rippleTick = 0;

    get entity() {
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + (this.inWater ? "_inwater" : "") + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.inWater ? "_inwater" : "")
                + (this.critical ? "_critical" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 300;
        this.y = y * 64 + 60;
    }

    behaviorMove() {
        super.behaviorMove();
        if(this.inWater){
            this.rippleAnim();
            this.rippleTick = (this.rippleTick + 1) % 4;
        }
    }

    rippleAnim(){
        const ripple = GEH.requestDrawImage(this.ripple);
        if(ripple){
            this.ctx.drawImage(ripple, 72 * this.rippleTick, 0,
                            72, 39, this.x + 9, this.y + 75,
                            72, 39);
        }
    }

    behaviorAnim() {
        if(this.inWater){
            if(this.state === this.stateSet[3]){
                if (this.tick === this.stateLength - 1) {
                    this.stateLengthSet.set("idle", 6);
                    this.tick = 0;
                    this.attackCheck();
                }
            }
            else {
                this.attackCheck();
            }
        }
        else {
            if (this.column <= 8) {
                if (level.Foods[this.row * level.column_num + this.column] != null && level.Foods[this.row * level.column_num + this.column].water) {
                    GEH.requestPlayAudio("fangka_w");
                    this.dive();
                }
            }
        }
    }

    dive() {
        this.tick = 0;
        this.state = this.stateSet[3];
        this.inWater = true;
    }

    getBlast(value = 20) {
        if(this.inWater){
            this.getDamaged(value);
            if(this.state === this.stateSet[2]){
                this.tick = this.stateLength - 1;
                return true;
            }
            this.freezingLength = 0;
            this.frozenLength = 0;
            this.tick = Math.floor(this.tick);
        }
        else{
            super.getBlast(value);
        }
    }
}
class BossMouse extends Mouse {
    //首领级敌人带有额外特性
    name = "boss";
    speed = 0;

    constructor(x = 0, y = 0) {
        super(x, y);
    }

    behaviorMove() {
        return true;
    }

    behaviorAnim() {
        return;
    }

    getFreezing() {
        return;
    }

    getFrozen() {
        return;
    }

    getHalted() {
        return;
    }

    getOverturned(value = 20) {
        this.getDamaged(value);
        return true;
    }

    changeLine() {
        return false;
    }

    ignore() {
        return false;
    }
}
class Obstacle extends Mouse {
    name = "obstacle";
    stateSet = ['idle', 'idle', 'die'];
    stateLengthSet = new Map([["idle", 1],["die", 1]]);
    speed = 0;
    get Movable(){
        return false;
    }

    get critical() {
        return this.health <= 400;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 1200;
    }

    behaviorMove() {
        return true;
    }

    getFrozen() {
        return;
    }

    getFreezing() {
        return;
    }

    getHalted() {
        return;
    }

    changeLine() {
        return;
    }

    ignore() {
        return false;
    }
}

export class CommonMouse extends Mouse {
    constructor(x = 0, y = 0) {
        super(x, y);
    }
}
class FootballFanMouse extends ArmoredMouse {
    constructor(x = 0, y = 0) {
        super(x, y);

        this.x = x * 60 + 260;
        this.y = y * 64 + 45;
    }
}
class PanMouse extends ArmoredMouse {
    name = "panmouse";
    get armorCritical() {
        return this.armorHealth <= 320;
    }
    width = 125;
    height = 135;
    eyePos = {
        x: -2,
        y: 38,
    }
    get positionX(){
        return EventHandler.getPositionX(this.x + 30);
    }
    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 292;
        this.y = y * 64 + 35;
        this.armorHealth = 960;
        this.fullHealth = this.health + this.armorHealth;
    }
    getHit(value = 20) {
        if (this.armored) {
            GEH.requestPlayAudio("helmetsound");
        } else {
            GEH.requestPlayAudio("commonhit");
        }
        this.getDamaged(value);
    };
}
class SkatingMouse extends Mouse {
    name = "skatingmouse";
    speed = 2;
    stateSet = ['idle','attack','die','jump'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 14],["jump", 11]]);
    get entity(){
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state +
                (this.jumped ? "_jumped" : "") + (this.critical ? "_critical" : "" ) + ".png";
        }
    }
    get critical(){
        return this.health <= 110;
    }
    width = 202;
    height = 166;
    jumped = false;
    eyePos = {
        x: -81,
        y: 66,
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.health = 330;
        this.fullHealth = this.health;

        this.x = x * 60 + 220;
        this.y = y * 64 + 10;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 110);
    }

    behaviorAnim() {
        if (this.jumped) {
            this.attackCheck();
        } else {
            this.jumpCheck();
        }
    }

    jumpCheck() {
        if (this.state === this.stateSet[3] && this.tick === (this.stateLength - 1)) {
            this.jumped = true;
            this.speed = Math.max(1, this.speed / 6);

            this.tick = 0;
            this.state = this.stateSet[0];
            this.stateLengthSet.set(this.state, 14);
            return false;
        }
        if (this.column < 9 && level.Foods[this.row * level.column_num + this.column] != null
            && level.Foods[this.row * level.column_num + this.column].hasTarget
            && !this.jumped && this.state !== this.stateSet[3]) {
            if (level.Foods[this.row * level.column_num + this.column].ignored) {
                this.ignore();
                return false;
            } else {
                this.tick = 0;
                this.state = this.stateSet[3];
                if (level.Foods[this.row * level.column_num + this.column].layer_1 != null
                    && level.Foods[this.row * level.column_num + this.column].layer_1.tall) {
                    this.speed = 0;
                } else {
                    this.speed *= 3;
                }
                return true;
            }
        }
        return false;
    }
}
class KangarooMouse extends Mouse {
    name = "kangaroomouse";
    width = 163;
    height = 157;

    stateSet = ['idle','attack','die','stop'];
    stateLengthSet = new Map([["idle", 8],["attack", 6],["die", 18],["stop", 11]]);

    jumping = false;
    stopped = false;
    prepareTimes = 0;
    speed = 2;

    get entity() {
        if(this.state === this.stateSet[2]){
           return "../static/images/mice/" + this.name + "/" + this.state + (this.stopped ? "_stopped" : "") + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.stopped ? "_stopped" : "")
                + (this.critical ? "_critical" : "") + ".png";
        }
    }


    get critical() {
        return this.health <= 170;
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.health = 510;
        this.fullHealth = this.health;

        this.x = x * 60 + 270;
        this.y = y * 64 + 20;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 54);
    }

    behaviorAnim() {
        if (this.jumping) {
            if(this.tick === this.stateLength - 1){
                if (this.state === 'stop') {
                    this.speed = 1;
                    this.tick = 0;
                    this.state = this.stateSet[0];
                }
                else {
                    this.speed = 2;
                }
                this.prepareTimes = 0;
                this.jumping = false;
            }
            else {
                if (this.state === 'stop') {
                    this.speed = 0;
                }
                else {
                    if (this.tick < this.stateLength / 2) {
                        this.x -= 12 / (this.freezing ? 2 : 1);
                        this.y -= 12 / (this.freezing ? 2 : 1);
                    } else {
                        this.x -= 12 / (this.freezing ? 2 : 1);
                        this.y += 12 / (this.freezing ? 2 : 1);
                    }
                }
            }
        } else {
            if(this.stopped){
                this.attackCheck();
            }
            else {
                this.jumpCheck();
            }
        }
    }

    jumpCheck() {
        if(this.CanUpdateEntity){
            if (this.column < 9 && level.Foods[this.row * level.column_num + this.column] != null
                && level.Foods[this.row * level.column_num + this.column].hasTarget) {
                this.speed = 0;
                if (this.prepareTimes >= 2 * this.stateLength) {
                    if (this.tick === 0) {
                        this.jumping = true;
                        if (level.Foods[this.row * level.column_num + this.column].layer_1 != null && level.Foods[this.row * level.column_num + this.column].layer_1.tall) {
                            this.stopped = true;
                            this.state = this.stateSet[3];
                        }
                    }
                }
                this.prepareTimes++;
            } else {
                this.prepareTimes = 0;
            }
        }
    }

    getFrozen(length = 5000) {
        if (this.stopped) {
            super.getFrozen(length);
        } else {
            return false;
        }
    }
}
class FlagMouse extends Mouse {
    name = "flagmouse";
    stateSet = ['idle','attack','die'];
    stateLengthSet = new Map([["idle", 8],["attack", 6],["die", 13]]);
    width = 75;
    height = 129;
    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 300;
        this.y = y * 64 + 33;
    }

    die() {
        super.die();
        this.width = 117;
        this.height = 129;
        this.x -= 45;
        this.y += 12;
    }
}

class PaperBoatMouse extends WaterMouse {
    constructor(x = 0, y = 0) {
        super(x, y);
    }
}
class DiveMouse extends WaterMouse {
    name = "divemouse";
    stateSet = ['idle','attack','die','dive','float'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 13],["dive", 9],["float", 4]]);
    width = 141;
    height = 190;
    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 280;
        this.y = y * 64 + 30;
    }
    get positionX(){
        return EventHandler.getPositionX(this.x + 48);
    }
    rippleAnim(){
        const ripple = GEH.requestDrawImage(this.ripple);
        if(ripple){
            this.ctx.drawImage(ripple, 72 * this.rippleTick, 0,
                                72, 39, this.x + 15, this.y + 110,
                                72, 39);
        }
    }
    behaviorAnim() {
        if(this.inWater){
            if (this.state === this.stateSet[0]) {
                this.canBeHit = false;
                if (this.column <= 8 && level.Foods[this.row * level.column_num + this.column] != null
                    && level.Foods[this.row * level.column_num + this.column].water
                    && level.Foods[this.row * level.column_num + this.column].hasTarget) {
                    this.state = this.stateSet[4];
                    this.tick = 0;
                }
            }
            else if (this.state === this.stateSet[3]) {
                this.canBeHit = true;
                if (this.tick === this.stateLength - 1) {
                    this.stateLengthSet.set("idle", 4);
                    this.tick = 0;
                    this.attackCheck();
                }
            }
            else if(this.state === this.stateSet[4]){
                this.canBeHit = true;
                if(this.tick === this.stateLength - 1) {
                    this.attackCheck();
                }
            }
            else {
                this.canBeHit = true;
                this.attackCheck();
            }
        }
        else {
            if (this.column <= 8) {
                if (level.Foods[this.row * level.column_num + this.column] != null && level.Foods[this.row * level.column_num + this.column].water) {
                    GEH.requestPlayAudio("fangka_w");
                    this.dive();
                }
            }
        }
    }
}
class FrogMouse extends WaterMouse {
    name = "frogmouse";
    stateSet = ['idle','attack','die','dive','jump'];
    stateLengthSet = new Map([["idle", 4],["attack", 6],["die", 13],["dive", 10],["jump", 10]]);
    width = 99;
    height = 175;
    jumped = false;
    speed = 2;

    get entity() {
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + (this.inWater ? "_inwater" : "") + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.inWater ? "_inwater" : "")
                + (this.jumped ? "_jumped" : "") + (this.critical ? "_critical" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 250;
        this.y = y * 64 + 10;
        this.dive();
    }

    rippleAnim(){
        const ripple = GEH.requestDrawImage(this.ripple);
        if(ripple){
            this.ctx.drawImage(ripple, 72 * this.rippleTick, 0,
                                72, 39, this.x + 9, this.y + 125,
                                72, 39);
        }
    }

    behaviorAnim() {
        if(this.inWater){
            if(this.state === this.stateSet[3]){
                if (this.tick === this.stateLength - 1) {
                    this.tick = 0;
                    this.state = this.stateSet[0];
                }
            }
            else if(this.state === this.stateSet[4]){
                if (this.tick === this.stateLength - 1) {
                    GEH.requestPlayAudio("fangka_w");
                    this.jumped = true;
                    this.speed = 1;
                    this.tick = 0;
                    this.attackCheck();
                    this.stateLengthSet.set("idle", 10);
                }
            }
            else {
                if (this.jumped) {
                    this.attackCheck();
                } else {
                    this.jumpCheck();
                }
            }
        }
        else {
            GEH.requestPlayAudio("fangka_w");
            this.dive();
        }
    }

    jumpCheck() {
        if (this.column < 9 && level.Foods[this.row * level.column_num + this.column] != null
            && level.Foods[this.row * level.column_num + this.column].hasTarget) {
            if (level.Foods[this.row * level.column_num + this.column].ignored) {
                this.ignore();
                return false;
            } else {
                if (level.Foods[this.row * level.column_num + this.column].layer_1 != null
                    && level.Foods[this.row * level.column_num + this.column].layer_1.tall) {
                    this.speed = 0;
                } else {
                    this.speed *= 4;
                }
                this.tick = 0;
                this.state = this.stateSet[4];
                return true;
            }
        }
        return false;
    }
}
class FootballFanMouseWater extends WaterMouse {
    name = "footballfanmousewater";
    stateSet = ['idle','attack','die','dive','unarmor'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 12],["dive", 10],["unarmor", 8]]);
    width = 102;
    height = 122;
    armored = true;

    #armorHealth = 240;
    get armorHealth(){
        return this.#armorHealth;
    }
    set armorHealth(value){
        if(value < this.#armorHealth){
            this.getDamagedTag = 2;
        }
        this.#armorHealth = value;
    }

    get armorCritical(){
        return this.armorHealth <= 80;
    }
    unarmorFrom = "idle";

    get entity() {
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/"
                + this.state + (this.inWater ? "_inwater" : "") + ".png";
        }
        else if (this.state === this.stateSet[4]) {
            return "../static/images/mice/" + this.name + "/"
                + this.state + (this.inWater ? "_inwater" : "")
                + "_" + this.unarmorFrom + ".png";
        } else {
            return "../static/images/mice/" + this.name + "/"
                + this.state + (this.inWater ? "_inwater" : "")
                + (this.armored ? ("_armored" +
                    (this.armorCritical ? "_critical" : "")) : (this.critical ? "_critical" : "")) + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.x = x * 60 + 300;
        this.y = y * 64 + 36;

        this.fullHealth = this.health + this.armorHealth;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 24);
    }

    rippleAnim(){
        const ripple = GEH.requestDrawImage(this.ripple);
        if(ripple){
            this.ctx.drawImage(ripple, 72 * this.rippleTick, 0,
                                72, 39, this.x + 4, this.y + 100,
                                72, 39);
        }
    }

    behaviorAnim() {
        if (this.inWater) {
            if (this.state === this.stateSet[3]) {
                if(this.tick === this.stateLength - 1){
                    this.attackCheck();
                }
            }
            else if (this.state === this.stateSet[4]) {
                if(this.attackCheck()){
                    this.stateLengthSet.set("unarmor", 4);
                    this.state = this.stateSet[4];
                    this.unarmorFrom = "attack";
                    if(this.tick >= this.stateLength - 1){
                        this.state = this.stateSet[1];
                    }
                }
                else {
                    this.stateLengthSet.set("unarmor", 8);
                    this.state = this.stateSet[4];
                    this.unarmorFrom = "idle";
                    if(this.tick >= this.stateLength - 1){
                        this.state = this.stateSet[0];
                    }
                }
            }
            else {
                this.attackCheck();
            }
        } else {
            if (this.state === this.stateSet[4]) {
                if(this.tick === this.stateLength - 1){
                    this.state = this.stateSet[0];
                }
            }
            if (this.column <= 8) {
                if (level.Foods[this.row * level.column_num + this.column] != null && level.Foods[this.row * level.column_num + this.column].water) {
                    GEH.requestPlayAudio("fangka_w");
                    this.dive();
                }
            }
        }
    }

    getDamaged(value = 20) {
        if (this.armorHealth > 0 && this.armored) {
            this.armorHealth -= value;
            if(this.armorHealth < 0){
                value = - this.armorHealth;
                this.armorHealth = 0;
                this.unarmored();
                return super.getDamaged(value);
            }
        }
        else {
            return super.getDamaged(value);
        }
    }

    unarmored() {
        this.tick = 0;
        this.armored = false;
        this.state = this.stateSet[4];
    }
}
class PanMouseWater extends FootballFanMouseWater {
    name = "panmousewater";
    width = 123;
    height = 150;

    get armorCritical(){
        return this.armorHealth <= 320;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 300;
        this.y = y * 64 + 26;

        this.armorHealth = 960;
        this.fullHealth = this.health + this.armorHealth;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 30);
    }

    rippleAnim(){
        const ripple = GEH.requestDrawImage(this.ripple);
        if(ripple){
            this.ctx.drawImage(ripple, 72 * this.rippleTick, 0,
                                72, 39, this.x + 12, this.y + 110,
                                72, 39);
        }
    }

    getHit(value = 20) {
        if (this.armored) {
            GEH.requestPlayAudio("helmetsound");
        } else {
            GEH.requestPlayAudio("commonhit");
        }
        this.getDamaged(value);
    }
}

class SinkMouse extends ArmoredMouse {
    name = "sinkmouse";
    stateSet = ['idle','attack','die','unarmor'];
    stateLengthSet = new Map([["idle", 8],["attack", 6],["die", 12],["unarmor", 8]]);
    get Movable(){
        if(this.state === this.stateSet[3]){
            return false;
        }
        else {
            return super.Movable;
        }
    }
    get armorCritical(){
        return this.armorHealth <= 320;
    }

    width = 115;
    height = 96;

    get entity(){
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + (this.armored ? "_armored" : "") + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "")
                + (this.armored ? ("_armored" + (this.armorCritical ? "_critical" : "")) : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.armorHealth = 960;
        this.fullHealth = this.health + this.armorHealth;

        this.x = x * 60 + 270;
        this.y = y * 64 + 76;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 56);
    }

    behaviorAnim() {
        if (this.state === this.stateSet[3]) {
            if (this.tick === this.stateLength - 1) {
                this.attackCheck();
                this.tick = 0;
                if(this.state === "unarmor"){
                    this.state = "idle";
                }
            }
        } else {
            super.behaviorAnim();
        }
    }

    getThrown(value = 20) {
        this.health = this.health - value;
        GEH.requestPlayAudio("commonhit");
    }

    unarmored() {
        super.unarmored();
        this.stateLengthSet.set("attack", 4);
    }

    getHit(value = 20) {
        if (this.armored) {
            GEH.requestPlayAudio("helmetsound");
        } else {
            GEH.requestPlayAudio("commonhit");
        }
        this.getDamaged(value);
    }

    getFreezingHit(value = 20, length = 10000) {
        if (!this.armored) {
            GEH.requestPlayAudio("commonhit");
            this.getFreezing(length);
        } else {
            GEH.requestPlayAudio("helmetsound");
        }
        this.getDamaged(value);
    }
}
class PotMouse extends SinkMouse {
    name = "potmouse";
    stateSet = ['idle','attack','die','unarmor'];
    stateLengthSet = new Map([["idle", 12],["attack", 6],["die", 14],["unarmor", 10]]);
    width = 69;
    height = 131;

    eyePos = {
        x: 2,
        y: 34,
    }
    get entity() {
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + (this.armored ? "_armored" : "") + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "")
                + (this.armored ? "_armored" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.armorHealth = 120;
        this.fullHealth = this.health + this.armorHealth;

        this.x = x * 60 + 295;
        this.y = y * 64 + 43;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 28);
    }

    behaviorAnim() {
        super.behaviorAnim();
    }
    getHit(value = 20) {
        GEH.requestPlayAudio("commonhit");
        this.getDamaged(value);
    }
    unarmored() {
        super.unarmored();
        this.speed = this.speed * 2;
        this.stateLengthSet.set("idle", 8);
    }


    getFreezingHit(value = 20, length:number) {
        GEH.requestPlayAudio("commonhit");
        if (!this.armored) {
            this.getFreezing(length);
        }
        this.getDamaged(value);
    }

    die() {
        super.die();
        this.width = 111;
        this.height = 102;
        this.y += 36;
    }
}
class MechanicalMouse extends Mouse {
    name = "mechanicalmouse";
    stateSet = ['idle','attack','die','explode'];
    stateLengthSet = new Map([["idle", 4],["attack", 4],["die", 18],["explode", 8]]);
    width = 250;
    height = 226;
    prepareTimes = 0;

    get critical() {
        return this.health <= 170;
    }

    get entity() {
        if(this.state === 'explode'){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
            return super.entity;
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.health = 510;
        this.fullHealth = this.health;

        this.x = x * 60 + 210;
        this.y = y * 64 + 16;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 120);
    }

    attackCheck() {
        if (super.attackCheck()) {
            this.prepareTimes++;
            if (this.prepareTimes >= 16) {
                this.attackable = false;
                this.explode();
            }
        } else {
            this.prepareTimes = 0;
        }
    }

    explode() {
        this.state = this.stateSet[3];
        this.tick = 0;
        this.die = () => {
            return false;
        }
        this.health = 0;
        GEH.requestPlayAudio("pijiubao");
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (this.row + i >= 0 && this.column + j < 9 && level.Foods[(this.row + i) * level.column_num + this.column + j] != null) {
                    level.Foods[(this.row + i) * level.column_num + this.column + j].crashRemove();
                }
            }
        }
    }
}
class NinjaMouse extends Mouse {
    name = "ninjamouse";
    stateSet = ['idle','attack','die','explode'];
    stateLengthSet = new Map([["idle", 6],["attack", 29],["die", 18],["summon", 16]]);
    width = 156;
    height = 136;
    speed = 2;
    summoned = false;
    prepareTimes = 50;
    guard:Array<Mouse|boolean> = [];
    guardNum = 4;

    get critical() {
        return this.health <= 170;
    }

    get entity(){
        if(this.state === 'die'){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
           return "../static/images/mice/" + this.name + "/" + this.state + (this.summoned ? "_summoned" : "")
            + (this.critical ? "_critical" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.health = 510;
        this.fullHealth = this.health;

        this.x = x * 60 + 300;
        this.y = y * 64 + 37;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 36);
    }

    behaviorAnim() {
        if (this.summoned) {
            if (this.state === "summon") {
                if (this.tick === this.stateLength - 1) {
                    this.summon();
                    this.stateLengthSet.set("idle", 12);
                    this.speed = 1;
                    this.tick = 0;
                    if (this.column <= 8 && level.Foods[this.row * level.column_num + this.column] && level.Foods[this.row * level.column_num + this.column].hasTarget) {
                        this.state = "attack";
                    } else {
                        this.state = "idle";
                    }
                }
            } else {
                if (this.state === "idle") {
                    if (this.prepareTimes <= 0 && this.tick === this.stateLength - 1) {
                        this.state = "attack";
                        this.speed = 0;
                        this.tick = 0;
                    }
                } else {
                    if (this.state === "attack" && this.tick === this.stateLength - 1) {
                        if (this.prepareTimes <= 0 && this.summonCheck()) {
                            this.prepareTimes = 50;
                        } else {
                            if (this.prepareTimes <= 0) {
                                this.prepareTimes = 50;
                            }
                            if (this.column <= 8 && level.Foods[this.row * level.column_num + this.column] && level.Foods[this.row * level.column_num + this.column].hasTarget) {

                            } else {
                                this.speed = 1;
                                this.tick = 0;
                                this.state = "idle";
                            }
                        }
                    }
                }
                this.attackCheck();
            }
        } else {
            if (this.positionX <= 6 ||
                (this.column <= 8
                    && level.Foods[this.row * level.column_num + this.column]
                    && level.Foods[this.row * level.column_num + this.column].hasTarget
                    && !level.Foods[this.row * level.column_num + this.column].ignored)) {
                this.summonCheck();
            }
        }
        this.prepareTimes--;
    }

    attackCheck() {
        if (this.CanUpdateEntity) {
            this.ignoring = false;
            if (this.column > 8 || level.Foods[this.row * level.column_num + this.column] == null || !level.Foods[this.row * level.column_num + this.column].hasTarget) {
                return false;
            } else {
                const x = this.column;
                const y = this.row;

                if (level.Foods[y * level.column_num + x].ignored) {
                    return false;
                } else {
                    this.state = "attack";
                    this.speed = 0;
                    level.Foods[y * level.column_num + x].getDamaged(this.damage / (this.freezing ? 2 : 1), this);
                    GEH.requestPlayAudio("ken", this);
                    return true;
                }
            }
        }
        else {
            return false;
        }
    }

    summonCheck() {
        let tag = false;
        for (let i = 0; i < this.guardNum; i++) {
            const guard = this.guard[i];
            if(guard instanceof Mouse && guard.health > 0){

            }
            else{
                tag = true;
                break;
            }
        }
        if (tag) {
            this.state = "summon";
            this.tick = 0;
            this.speed = 0;
            this.summoned = true;
            return true;
        }
        return false;
    }

    summon() {
        for (let i = 0; i < this.guardNum; i++) {
            const guard = this.guard[i];
            if (guard && guard instanceof Mouse && guard.health > 0) {
            } else {
                this.guardSummon(i);
            }
        }
    }

    guardSummon = (i:number) => {
        switch (i) {
            case 0: {
                const mouse = new NinjaGuardMouse(this.positionX - 1, this.row);
                level.Mice[this.row][this.column].push(mouse);
                this.guard[i] = mouse;
                mouse.master = this;
                break;
            }
            case 1: {
                const mouse = new NinjaGuardMouse(this.positionX + 1, this.row);
                level.Mice[this.row][this.column].push(mouse);
                this.guard[i] = mouse;
                mouse.master = this;
                break;
            }
            case 2: {
                if (this.row <= 0 || (level.waterLine && level.waterLine[this.row - 1])) {
                    return this.guard[i] = false;
                }
                else {
                    const mouse = new NinjaGuardMouse(this.positionX, this.row - 1);
                    level.Mice[this.row][this.column].push(mouse);
                    this.guard[i] = mouse;
                    mouse.master = this;
                }
                break;
            }
            case 3: {
                if (this.row >= level.row_num - 1 || (level.waterLine && level.waterLine[this.row + 1])) {
                    this.guard[i] = false;
                }
                else {
                    const mouse = new NinjaGuardMouse(this.positionX, this.row + 1);
                    level.Mice[this.row][this.column].push(mouse);
                    this.guard[i] = mouse;
                    mouse.master = this;
                }
                break;
            }
        }
    }
}
class NinjaGuardMouse extends Mouse {
    name = "ninjaguardmouse";
    width = 186;
    height = 178;
    stateSet = ['idle','attack','die','summon'];
    stateLengthSet = new Map([["idle", 12],["attack", 30],["die", 18],["summon", 10]]);
    speed = 1;
    summoned = false;
    master:Mouse|undefined;

    constructor(x = 0, y = 0) {
        super(x, y);

        this.x = x * 60 + 220;
        this.y = y * 64 + 32;
    }

    get entity() {
        if(this.state === this.stateSet[2] || this.state === this.stateSet[3]){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else{
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "") + ".png";
        }
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 66);
    }

    behaviorAnim() {
        if (!this.summoned) {
            this.state = "summon";
            if (this.tick === this.stateLength - 1) {
                this.summoned = true;
            }
        } else {
            if (this.master != null && this.master.health > 0) {
                if (this.master.state === "summon") {
                    this.state = "attack";
                } else {
                    if (this.attackCheck()) {
                        this.state = "attack";
                    } else {
                        this.state = this.master.state;
                    }
                }
            } else {
                this.attackCheck();
            }
        }
        this.speedGenerate();
    }

    speedGenerate() {
        switch (this.state) {
            case "idle": {
                if (this.master != null && this.master.health > 0) {
                    if (this.master.speed === 0) {
                        this.speed = 0;
                    } else {
                        if (this.ignoring && this.ignoringFullDistance) {
                            this.speed = this.ignoringFullDistance * level.column_gap / 5;
                        } else {
                            this.speed = 1;
                        }
                    }
                } else {
                    if (this.ignoring && this.ignoringFullDistance) {
                        this.speed = this.ignoringFullDistance * level.column_gap / 5;
                    } else {
                        this.speed = 1;
                    }
                }
                break;
            }
            case "attack": {
                if (this.ignoring && this.ignoringFullDistance) {
                    this.speed = this.ignoringFullDistance * level.column_gap / 5;
                } else {
                    this.speed = 0;
                }
                break;
            }
            case "summon": {
                this.speed = 0;
                break;
            }
        }
    }
}
class RepairMouse extends SinkMouse {
    name = "repairmouse";
    stateSet = ['idle','attack','die','unarmor','generate'];
    stateLengthSet = new Map([["idle", 8],["attack", 5],["die", 12],["unarmor", 8],["generate", 6]]);
    width = 159;
    height = 103;
    private generateTarget?: null | MapGrid<Food> | Food;

    get Movable(){
        if(this.state === this.stateSet[4]){
            return false;
        }
        else {
            return super.Movable;
        }
    }
    get armorCritical() {
        return this.armorHealth <= 320;
    }

    get entity(){
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + this.state + (this.armored ? "_armored" : "") + ".png";
        }
        else {
            if(this.state === this.stateSet[4]){
               return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "")
                   + "_armored" + (this.armorCritical ? "_critical" : "") + ".png";
            }
            else {
                return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "")
                    + (this.armored ? ("_armored" + (this.armorCritical ? "_critical" : "")) : "") + ".png";
            }
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);

        this.armorHealth = 960;
        this.fullHealth = this.health + this.armorHealth;

        this.x = x * 60 + 260;
        this.y = y * 64 + 72;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 56);
    }

    attackCheck() {
        this.generateTarget = super.attackCheck();
        if(this.armored && this.state !== this.stateSet[4]){
            if(this.generateTarget){
                if((this.generateTarget as MapGrid<Food>).getShieldType()
                && !(this.generateTarget as MapGrid<Food>).getShieldType()!.ignored){
                    this.generateTarget = (this.generateTarget as MapGrid<Food>).getShieldType();
                    this.generateLadder();
                }
            }
        }
    }

    behaviorAnim() {
        if(this.state === this.stateSet[4]){
            if (this.tick === this.stateLength - 1) {
                if(this.generateTarget && !this.generateTarget.ignored){
                    (this.generateTarget as Food).ignore("ladder" + (this.armorCritical ? "_critical" : ""));
                }
                this.state = this.stateSet[0];
                this.tick = 0;
            }
        }
        else {
            super.behaviorAnim();
        }
    }

    generateLadder() {
        this.armored = false;
        this.tick = 0;
        this.state = this.stateSet[4];
        this.stateLengthSet.set("attack", 4);
    }
}
class GiantMouse extends Mouse {
    name = "giantmouse";
    stateSet = ['idle','attack','die'];
    stateLengthSet = new Map([["idle", 19],["attack", 18],["die", 21]]);
    width = 255;
    height = 173;
    damage = 10000;
    speed = 0.8;
    get critical() {
        return this.health <= 900;
    }
    get entity(){
        if(this.state === 'die'){
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
        else {
            if (this.critical) {
                this.stateLengthSet.set("idle", 20);
                return "../static/images/mice/" + this.name + "/" + this.state + "_critical" + ".png";
            } else {
                this.stateLengthSet.set("idle", 19);
                return "../static/images/mice/" + this.name + "/" + this.state + ".png";
            }
        }
    }
    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 2700;
        this.fullHealth = this.health + this.armorHealth;
        this.x = this.column * 60 + 240;
        this.y = this.row * 64 - 2;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 80);
    }

    behaviorAnim() {
        if (this.state === "attack") {
            if (this.tick === this.stateLength - 1) {
                this.tick = 0;
                this.state = "idle";
                if (this.column < 9) {
                    if (level.Foods[this.row * level.column_num + this.column]) {
                        GEH.requestPlayAudio("ken", this);
                        level.Foods[this.row * level.column_num + this.column].getCrashDamaged(this.damage, this);
                    }
                }
            }
        } else {
            this.attackCheck();
        }
    }

    attackCheck() {
        if (this.CanUpdateEntity) {
            if (this.column > 8 || level.Foods[this.row * level.column_num + this.column] == null
                || !level.Foods[this.row * level.column_num + this.column].hasCrashTarget) {
                return false;
            } else {
                if (level.Foods[this.row * level.column_num + this.column].ignored) {
                    this.ignore();
                    return false;
                } else {
                    this.tick = 0;
                    this.state = "attack";
                    return true;
                }
            }
        }
        else {
            return false;
        }
    }
}
class RollerMouse extends PanMouse {
    name = "rollermouse";
    stateSet = ['idle','attack','die','unarmor'];
    stateLengthSet = new Map([["idle", 10],["attack", 4],["die", 13],["unarmor", 8]]);
    speed = 2;
    damage = 8;
    width = 112;
    height = 114;
    eyePos = {
        x: -2,
        y: 38,
    }
    get armorCritical() {
        return this.armorHealth <= 320;
    }
    constructor(x = 0, y = 0) {
        super(x, y);
        this.armorHealth = 1200;
        this.fullHealth = this.health + this.armorHealth;
        this.x = x * 60 + 280;
        this.y = y * 64 + 60;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 42);
    }
}
class MobileMachineryShop extends Mouse {
    name = "mobilemachineryshop";
    stateSet = ['idle','attack','die','move'];
    stateLengthSet = new Map([["idle", 6],["attack", 12],["die", 13],["move", 6]]);
    width = 283;
    height = 269;
    damage = 10000;
    bulletDam = 80;
    behaviorInterval = 2000;
    target:number|null = null;

    get critical() {
        return this.health <= 280;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 840;
        this.fullHealth = this.health;
        this.state = this.stateSet[3];
        this.x = x * 60 + 220;
        this.y = y * 64 - 2;
    }

    get Movable(){
        if(this.target !== null){
            return false;
        }
        else {
            return super.Movable;
        }
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 115);
    }

    behaviorAnim() {
        if (this.state === 'idle' || this.state === 'move') {
            if (this.behaviorInterval <= 0) {
                if ((this.target = this.attackCheck()) != null) {
                    this.tick = 0;
                    this.state = 'attack';
                    this.behaviorInterval = 3000;
                    if (this.column < 9) {
                        if (level.Foods[this.row * level.column_num + this.column]
                            && level.Foods[this.row * level.column_num + this.column].hasCrashTarget) {
                            GEH.requestPlayAudio("ken", this);
                            level.Foods[this.row * level.column_num + this.column].getCrashDamaged(this.damage, this);
                        }
                    }
                } else {
                    this.state = 'move';
                }
            } else {
                if (this.CanUpdateEntity) {
                    this.behaviorInterval -= 100 / (this.freezing ? 2 : 1);
                }
            }
        } else if (this.state === 'attack') {
            if (this.tick === this.stateLength - 1) {
                this.tick = 0;
                this.state = 'idle';
            } else if (this.tick === 5) {
                level.requestSummonBullet(Stone, this.x + 115, this.y + 60, this.bulletDam, this.row, this.target);
            }
        }
    }

    attackCheck() {
        if(this.column <= 8 && this.CanUpdateEntity){
            for (let i = 0; i < this.column + 1; i++) {
            if (level.Foods[this.row * level.column_num + i] && level.Foods[this.row * level.column_num + i].hasTarget) {
                    return i;
                }
            }
            return null
        }
        else {
            return null;
        }
    }
}

class Mole extends Mouse {
    name = "mole";
    stateSet = ['idle','attack','die','dig','arise','stagger'];
    stateLengthSet = new Map([["idle", 8],["attack", 7],["die", 10],["dig",6],["arise",14],["stagger",4]]);
    width = 135;
    height = 132;
    behaviorInterval = 1000;
    canBeHit = false;
    canBeThrown = false;
    canBeFollowed = false;
    speed = 4;

    get critical() {
        return this.health <= 120;
    }

    get entity() {
        if (this.state === 'die' || this.state === 'dig' || this.state === 'arise') {
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        } else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 360;
        this.fullHealth = this.health;
        this.state = this.stateSet[3];
        this.x = this.column * 60 + 240;
        this.y = this.row * 64 + 42;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 75);
    }
    behaviorMove() {
        return true;
    }

    behaviorAnim() {
        if (this.positionX > 10) {
            this.remove();
            return true;
        }
        if (this.state === 'dig') {
            if (this.positionX <= 0.1) {
                this.state = 'arise';
                this.tick = 0;
                this.speed = 0;
            }
        } else if (this.state === 'arise') {
            this.canBeHit = true;
            this.canBeThrown = true;
            this.canBeFollowed = true;
            if (this.tick === this.stateLength - 1) {
                this.state = 'stagger';
                this.tick = 0;
            }
        } else if (this.state === 'stagger') {
            if (this.CanUpdateEntity) {
                this.behaviorInterval -= 100 / (this.freezing ? 2 : 1);
            }
            if (this.behaviorInterval <= 0) {
                if (this.tick === this.stateLength - 1) {
                    this.state = 'idle';
                    this.tick = 0;
                    this.speed = -1;
                }
            }
        } else {
            this.attackCheck();
        }
    }

    getFrozen(length = 5000) {
        if (this.state === 'dig') {
            return false;
        } else {
            super.getFrozen(length);
        }
    }

    ignore() {
        return false;
    }
}

class GlidingMouse extends Mouse {
    name = "glidingmouse";
    stateSet = ['idle','attack','die','fly','drop'];
    stateLengthSet = new Map([["idle", 8],["attack", 4],["die", 12],["fly",6],["drop",6]]);
    width = 188;
    height = 196;
    fly = true;
    canBeHit = false;
    canBeThrown = false;
    speed = 2;

    get entity(){
        if (this.state === 'die' || this.state === 'fly' || this.state === 'drop') {
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        } else {
            return "../static/images/mice/" + this.name + "/" + this.state + (this.critical ? "_critical" : "") + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.armorHealth = 90;
        this.x = this.column * 60 + 240;
        this.y = this.row * 64 - 16;
        this.state = 'fly';
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 58);
    }

    behaviorAnim() {
        if (this.state === 'fly') {
            if (this.armorHealth <= 0) {
                this.tick = 0;
            } else if (this.positionX <= 1) {
                this.tick = 0;
                this.state = 'drop';
                this.speed = 0;
            }
        } else if (this.state === 'drop') {
            if (this.tick === this.stateLength - 1) {
                this.fly = false;
                this.canBeHit = true;
                this.canBeThrown = true;
                this.tick = 0;
                this.state = 'idle';
                this.speed = 1;
            }
        } else {
            this.attackCheck();
        }
    }

    getDamaged(value = 20) {
        if (this.state === "fly") {
            this.armorHealth -= value;
            if(this.armorHealth < 0){
                value = - this.armorHealth;
                this.armorHealth = 0
                this.state = "drop";
                return super.getDamaged(value);
            }
        }
        else {
            return super.getDamaged(value);
        }
    }

    getFrozen(length = 5000) {
        if (this.state === 'fly') {
            return false;
        } else {
            super.getFrozen(length);
        }
    }
}

class RogueMouse extends Mouse {
    name = "roguemouse";
    stateSet = ['idle','attack','die'];
    stateLengthSet = new Map([["idle", 8],["attack", 9],["die", 1]]);
    width = 105;
    height = 83;
    fly = true;
    canBeHit = false;
    canBeThrown = false;
    behaviorInterval = 5000;
    speed = 0;
    target:{layer_0:Food|null, layer_1:Food|null, layer_2:Food|null} = {layer_0: null, layer_1: null, layer_2: null};
    get sign(){
        return "../static/images/mice/" + this.name + "/sign.png";
    }
    rope:string|undefined;

    get entity() {
        if(this.state === this.stateSet[2]){
            return "../static/images/mice/" + this.name + "/" + "idle" + ".png";
        }
        else {
            return "../static/images/mice/" + this.name + "/" + this.state + ".png";
        }
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 280;
        this.y = - this.height;
        // this.sign.className = 'sign';
        // this.sign.style.left = (this.column * 60 + 300) + 'px';
        // this.sign.style.top = (this.row * 64 - 140) + 'px';
        // this.rope.className = 'rope';
        // this.rope.style.left = (this.column * 60 + 340) + 'px';
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 32);
    }

    behaviorAnim() {
        if (this.CanUpdateEntity) {
            const sign = GEH.requestDrawImage(this.sign);
            if(sign){
                this.ctx.drawImage(sign, 62 * this.tick, 0, 62, 60,
                    this.column * 60 + 300, this.y, 62, 60);
            }
            if(this.state === this.stateSet[0]){
                if(this.y < this.row * 64){
                    this.y += 30;
                }
                else if(this.y >= this.row * 64 && this.y < this.row * 64 + 50){
                    this.y += 30;
                    this.fly = false;
                    this.canBeHit = true;
                    this.canBeThrown = true;
                    for (let i = Math.max(this.row - 1, 0); i < Math.min(this.row + 2, level.row_num); i++) {
                        for (let j = Math.max(this.column - 1, 0); j < Math.min(this.column + 2, level.column_num); j++) {
                            if (level.Foods[i * level.column_num + j] != null
                                && level.Foods[i * level.column_num + j].layer_1 != null && level.Foods[i * level.column_num + j].layer_1.airDefense) {
                                level.Foods[i * level.column_num + j].layer_1.defend();
                                this.remove();
                            }
                        }
                    }
                }
                else {
                    this.behaviorInterval -= 100 / (this.freezing ? 2 : 1);
                    if (this.behaviorInterval <= 0) {
                        this.state = this.stateSet[1];
                    }
                }
            }
            else if(this.state === this.stateSet[1]){
                if (!this.attackable) {
                    this.tick = this.stateLength - 1;
                    this.y -= 40;
                    if(this.target){
                        const ctx = level.Battlefield.Canvas.getContext('2d');
                        if(this.target.layer_0){
                            this.target.layer_0.y -= 40;
                            const img = GEH.requestDrawImage(this.target.layer_0.inside!);
                            if(img){
                                ctx.drawImage(img, this.target.layer_0.x, this.target.layer_0.y);
                            }
                        }
                        if (this.target.layer_2) {
                            this.target.layer_2.y -= 40;
                            const img = GEH.requestDrawImage(this.target.layer_2.entity);
                            if(img){
                                ctx.drawImage(img, this.target.layer_2.width * this.target.layer_2.tick, 0,
                                    this.target.layer_2.width, this.target.layer_2.height, this.target.layer_2.x, this.target.layer_2.y,
                                    this.target.layer_2.width, this.target.layer_2.height);
                            }
                        }
                        if (this.target.layer_1) {
                            this.target.layer_1.y -= 40;
                            const img = GEH.requestDrawImage(this.target.layer_1.entity);
                            if(img){
                                ctx.drawImage(img, this.target.layer_1.width * this.target.layer_1.tick, 0,
                                    this.target.layer_1.width, this.target.layer_1.height, this.target.layer_1.x, this.target.layer_1.y,
                                    this.target.layer_1.width, this.target.layer_1.height);
                            }
                        }
                        if (this.target.layer_0) {
                            const img = GEH.requestDrawImage(this.target.layer_0.entity);
                            if(img){
                                ctx.drawImage(img, this.target.layer_0.width * this.target.layer_0.tick, 0,
                                    this.target.layer_0.width, this.target.layer_0.height, this.target.layer_0.x, this.target.layer_0.y,
                                    this.target.layer_0.width, this.target.layer_0.height);
                            }
                        }
                    }
                    if (this.y <= 0) {
                        this.remove();
                    }
                }
                else if(this.tick === this.stateLength - 1) {
                    this.attackable = false;
                    const food = level.Foods[this.row * level.column_num + this.column];
                    if (food != null) {
                        if (food.layer_0) {
                            this.target.layer_0 = food.layer_0;
                        }
                        if(food.layer_1){
                            this.target.layer_1 = food.layer_1;
                        }
                        if(food.layer_2){
                            this.target.layer_2 = food.layer_2;
                        }
                        level.Foods[this.row * level.column_num + this.column].crashRemove();
                    }
                }
            }
        }
    }

    getFrozen() {
        return;
    }
}

class RubbishTruck extends Mouse {
    name = "rubbishtruck";
    stateSet = ['idle','attack','die'];
    stateLengthSet = new Map([["idle", 6],["attack", 1],["die", 13]]);
    width = 295;
    height = 285;
    damage = 10000;

    get critical() {
        return this.health <= 400;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 1200;
        this.fullHealth = this.health + this.armorHealth;
        this.x = x * 60 + 220;
        this.y = y * 64 - 32;
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 115);
    }

    behaviorAnim() {
        if (this.column < 9) {
            if (level.Foods[this.row * level.column_num + this.column]
                && level.Foods[this.row * level.column_num + this.column].hasCrashTarget) {
                GEH.requestPlayAudio("ken", this);
                level.Foods[this.row * level.column_num + this.column].getCrashDamaged(this.damage, this);
            }
        }
    }

    getFrozen() {
        return;
    }

    getFreezing() {
        return;
    }
}

class MarioMouse extends BossMouse {
    //洞君，曲奇岛
    name = "mariomouse";
    width = 184;
    height = 176;
    stateSet = ['idle', "dig", 'die', 'dive', 'jump'];
    stateLengthSet = new Map([["idle", 21],["die", 18],["dig", 8],["dive",18],["jump",14]]);
    tunnelLength = 3;
    jumpLength = 3;
    dizzyTimes = 0;
    dizzyLength = 3;
    jumpedTimes = 0;
    digLength = 3;
    dugTimes = 0;
    skillState = 0;
    get critical() {
        return this.health <= 4000;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.health = 10800;
        this.fullHealth = this.health;
        this.x = x * 60 + 260;
        this.y = y * 64 - 12;
        level.CreateBossBar(this);
    }

    behaviorAnim() {
        if(this.progress){
            this.progress.style.width = (this.health / this.fullHealth * 224) + "px";
        }
        if (this.state === "idle") {
            this.x = 800;
            if (this.tick === this.stateLength - 1) {
                if (this.dizzyTimes >= this.dizzyLength) {
                    this.dizzyTimes = 0;
                    if (this.skillState) {
                        this.state = "dig";
                        this.tick = 0;
                        this.skillState = (this.skillState + 1) % 2;
                    } else {
                        this.state = "jump";
                        this.tick = 0;
                        this.skillState = (this.skillState + 1) % 2;
                    }
                } else {
                    this.tick = 13;
                    this.dizzyTimes++;
                }
            }
        }
        else if(this.state === "dig"){
            if (this.tick === this.stateLength - 1) {
                this.dugTimes++;
                if (this.dugTimes === this.digLength) {
                    this.tunnelSet();
                    const temp = Math.floor(Math.random() * level.row_num);
                    for (let i = 0; i < level.row_num; i++) {
                        if(level.waterLine === null
                            || level.waterLine[this.row] === level.waterLine[(temp + i) % level.row_num]){
                            const out = new TubeOut(level.column_num - this.tunnelLength, (temp + i) % level.row_num);
                            level.Mice[this.row][this.column].push(out);

                            if (level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength] == null) {
                            } else {
                                if (level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_0 != null) {
                                    GEH.requestPlayAudio('ken', this);
                                    level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_0.remove();
                                }
                                if (level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_1 != null
                                    && level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_1.attackable
                                    && level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_1.constructor.name !== 'player') {
                                    GEH.requestPlayAudio('ken', this);
                                    level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_1.remove();
                                }
                                if (level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_2 != null) {
                                    GEH.requestPlayAudio('ken', this);
                                    level.Foods[(temp + i) % level.row_num * level.column_num + level.column_num - this.tunnelLength].layer_2.remove();
                                }
                            }

                            if (level.Foods[this.row * level.column_num + level.column_num - 1].layer_0 != null) {
                                level.Foods[this.row * level.column_num + level.column_num - 1].layer_0.remove();
                            }
                            if (level.Foods[this.row * level.column_num + level.column_num - 1].layer_1 != null
                                && level.Foods[this.row * level.column_num + level.column_num - 1].layer_1.constructor.name !== 'player') {
                                GEH.requestPlayAudio('ken', this);
                                level.Foods[this.row * level.column_num + level.column_num - 1].layer_1.remove();
                            }
                            if (level.Foods[this.row * level.column_num + level.column_num - 1].layer_2 != null) {
                                level.Foods[this.row * level.column_num + level.column_num - 1].layer_2.remove();
                            }

                            level.Foods[this.row * level.column_num + level.column_num - 1].layer_1 = new TubeIn(level.column_num - 1, this.row, 3);
                            level.Foods[this.row * level.column_num + level.column_num - 1].layer_1.forward = this.tunnelLength;
                            level.Foods[this.row * level.column_num + level.column_num - 1].layer_1.line = (temp + i) % level.row_num - this.row;
                            out.entry = level.Foods[this.row * level.column_num + level.column_num - 1].layer_1;
                            break;

                        }
                    }
                } else if (this.dugTimes > this.digLength) {
                    this.dugTimes = 0;
                    this.tick = 0;
                    this.state = "dive";
                }
            }
        }
        else if(this.state === "jump"){
            if (this.tick < 4 || this.tick > 9) {

            } else {
                this.x -= 20;
            }
            if (this.tick === 9) {
                this.jumpedTimes++;
                if (level.Foods[this.row * level.column_num + this.column] != null) {
                    if (level.Foods[this.row * level.column_num + this.column].layer_0 != null) {
                        level.Foods[this.row * level.column_num + this.column ].layer_0.remove();
                    }
                    if (level.Foods[this.row * level.column_num + this.column].layer_1 != null
                        && level.Foods[this.row * level.column_num + this.column].layer_1.attackable
                        && level.Foods[this.row * level.column_num + this.column].layer_1.constructor.name !== 'player') {
                        GEH.requestPlayAudio('ken', this);
                        level.Foods[this.row * level.column_num + this.column].layer_1.remove();
                    }
                    if (level.Foods[this.row * level.column_num + this.column].layer_2 != null) {
                        level.Foods[this.row * level.column_num + this.column].layer_2.remove();
                    }
                }
            } else if (this.tick === this.stateLength - 1) {
                if (this.jumpedTimes >= this.jumpLength) {
                    this.tick = 0;
                    this.state = "dive";
                    this.jumpedTimes = 0;
                }
            }
        }
        else if(this.state === "dive"){
            if(this.tick === this.stateLength - 1){
                this.tick = 0;
                this.state = "idle";
                this.changePos();
            }
        }
        super.behaviorAnim();
    }

    get positionX(){
        return EventHandler.getPositionX(this.x + 75);
    }

    tunnelSet() {
        this.tunnelLength = Math.floor(Math.random() * 4) + 2;
    }

    changePos() {
        const pos = Math.floor(Math.random() * level.row_num) - this.row;
        this.y += 64 * pos;
        this.row += pos;
    }

    die() {
        if (level != null) {
            level.victory();
        }
        if(this.progress != null){
            this.progress.style.width = "0";
        }
        return super.die();
    }
}

class TubeOut extends Obstacle {
    name = "tube_1";
    width = 104;
    height = 86;
    stateSet = ['idle', 'idle', 'die'];
    stateLengthSet = new Map([["idle", 6],["die", 1]]);
    entry?:Food;

    get CanUpdateEntity(){
        return this.tick !== this.stateLength - 1;
    }

    get entity() {
        return "../static/images/interface/" + this.name + (this.critical ? "_critical" : "") + ".png"
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        this.x = x * 60 + 280;
        this.y = y * 64 + 78;
    }

    behaviorAnim() {
        if(this.critical){
            this.stateLengthSet.set("idle", 1);
        }
    }

    die() {
        if (this.entry) {
            this.entry.remove();
        }
        return super.die();
    }
}
const landSummon = function (item:typeof Mouse, x = 9, y = -1) {
    const {GameEnd} = GEH;

    if (!level || GameEnd) {
        return false;
    }

    if (level.waterPosition == null) {
        if (y === -1) {
            y = Math.floor(Math.random() * level.row_num);
        }
    } else {
        if (y === -1) {
            if (level.landLineNum === 0) {
                return false;
            }
            const pos = Math.floor(Math.random() * level.landLineNum);
            y = level.landPosition[pos];
        } else {
            if (level.waterLine[y]) {
                return false;
            }
        }
    }

    const mouse = new item(x, y);
    level.Mice[y][x]?.push(mouse);
    return mouse;
};
const waterSummon = function (item: typeof Mouse, x = 9, y = -1) {
    const {GameEnd } = GEH;
    if (!level || GameEnd || !level.waterPosition) {
        return false;
    }

    if (y === -1 && level.waterLineNum !== 0) {
        const pos = Math.floor(Math.random() * level.waterLineNum);
        y = level.waterPosition[pos];
    }

    const mouse = new item(x, y);
    level.Mice[y][x]?.push(mouse);
    return mouse;
};
const foodPosSummon = function (item: typeof Mouse) {
    const {GameEnd } = GEH;

    if (!level || GameEnd) {
        return false;
    }

    const totalPositions = level.column_num * level.row_num;
    let pos = Math.floor(Math.random() * totalPositions);

    for (let i = 0; i < totalPositions; i++) {
        const currentPos = (pos + i) % totalPositions;
        const currentFood = level.Foods[currentPos];

        if (currentFood && currentFood.hasCrashTarget && (!currentFood.layer_1 || currentFood.layer_1.constructor.name !== "player")) {
            pos = currentPos;
            break;
        }
    }

    const x = pos % level.column_num;
    const y = Math.floor(pos / level.column_num);

    const mouse = new item(x, y);
    level.Mice[y][x]?.push(mouse);
    return mouse;
};
export const getMouseDetails = function (type:number|string = 0) {
    switch (type) {
        case 0:
        case "commonmouse":
            return {
                type: 0,
                cName: "普通鼠",
                eName: "commonmouse",
                assets: ["attack","attack_critical","die","idle","idle_critical"],
                description: "平平无奇的海盗鼠",
                story: "在这普通的一天，我穿着普通的鞋，很普通地走在这普通的街。",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80}
                ],
                summon: (function () {
                    return landSummon(CommonMouse);
                })
            };
        case 1:
        case "footballfanmouse":
            return {
                type: 1,
                cName: "球迷鼠",
                eName: "footballfanmouse",
                assets: ["attack","attack_armored","attack_armored_critical","attack_critical","die","idle","idle_armored","idle_armored_critical","idle_critical","unarmor_attack","unarmor_idle"],
                description: "戴着半截足球作为防具的海盗鼠",
                story: "球迷鼠的愤怒总是被鼠国国足的遗憾离场点燃。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(FootballFanMouse);
                })
            };
        case 2:
        case "skatingmouse":
            return {
                type: 2,
                cName: "滑板鼠",
                eName: "skatingmouse",
                assets: ["attack_jumped","attack_jumped_critical","die","idle","idle_critical","idle_jumped","idle_jumped_critical","jump","jump_critical"],
                description: "行动快速的海盗鼠，能够越过防御卡",
                story: "滑板鼠不是滑鼠。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(SkatingMouse);
                })
            };
        case 3:
        case "potmouse":
            return {
                type: 3,
                cName: "捧花僵尸鼠",
                eName: "potmouse",
                assets: ["attack","attack_armored","attack_critical","attack_critical_armored","die","die_armored","idle","idle_armored","idle_critical","idle_critical_armored","unarmor","unarmor_critical"],
                description: "捧着花盆作为防具的海盗鼠，花盆破碎后会被激怒",
                story: "久仰久仰，第三代脆皮坚果想必就是出自这位大师之手。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(PotMouse);
                })
            };
        case 4:
        case "panmouse":
            return {
                type: 4,
                cName: "铁锅鼠",
                eName: "panmouse",
                assets: ["attack","attack_armored","attack_armored_critical","attack_critical","die","idle","idle_armored","idle_armored_critical","idle_critical","unarmor_attack","unarmor_idle"],
                description: "戴着铁锅作为防具的海盗鼠",
                story: "行无辙迹，居无炊具，幕天席地，纵意所知。",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(PanMouse);
                })
            };
        case 5:
        case "paperboatmouse":
            return {
                type: 5,
                cName: "纸船鼠",
                eName: "paperboatmouse",
                assets: ["attack_inwater","attack_inwater_critical","die","die_inwater","dive_inwater","dive_inwater_critical","idle","idle_critical","idle_inwater","idle_inwater_critical"],
                description: "乘坐纸船的水路海盗鼠",
                story: "船儿船儿看不见，船上也没帆。",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return waterSummon(PaperBoatMouse);
                })
            };
        case 6:
        case "flagmouse":
            return {
                type: 6,
                cName: "旗帜鼠",
                eName: "flagmouse",
                assets: ["attack","attack_critical","die","idle","idle_critical"],
                description: "举着旗帜的海盗鼠，标志大波鼠军的到来",
                story: "出发！目标安戈洛！",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(FlagMouse);
                })
            };
        case 7:
        case "divemouse":
            return {
                type: 7,
                cName: "潜水鼠",
                eName: "divemouse",
                assets: ["attack_inwater","attack_inwater_critical","die","die_inwater","dive_inwater","dive_inwater_critical","float_inwater","float_inwater_critical","idle","idle_critical","idle_inwater","idle_inwater_critical"],
                description: "能够潜入水下躲避子弹的水路海盗鼠",
                story: "心事浩茫连广宇，于无声处听惊雷。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return waterSummon(DiveMouse);
                })
            };
        case 8:
        case "sinkmouse":
            return {
                type: 8,
                cName: "房东鼠",
                eName: "sinkmouse",
                assets: ["attack","attack_armored","attack_armored_critical","attack_critical","attack_critical_armored","attack_critical_armored_critical","die","die_armored","idle","idle_armored","idle_armored_critical","idle_critical","idle_critical_armored","idle_critical_armored_critical","unarmor","unarmor_critical"],
                description: "举着地漏作为防具的海盗鼠，地漏能阻挡直线子弹",
                story: "Good morning，房东鼠！",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(SinkMouse);
                })
            };
        case 9:
        case "kangaroomouse":
            return {
                type: 9,
                cName: "跳跳鼠",
                eName: "kangaroomouse",
                assets: ["attack_stopped","attack_stopped_critical","die","die_stopped","idle","idle_critical","idle_stopped","idle_stopped_critical","stop_stopped","stop_stopped_critical"],
                description: "蹦蹦跳跳、行动快速的海盗鼠，能够越过防御卡",
                story: "小老鼠黄又黄，两只耳朵竖起来，爱吃火炉爱吃菜，蹦蹦跳跳真可爱。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(KangarooMouse);
                })
            };
        case 10:
        case "mechanicalmouse":
            return {
                type: 10,
                cName: "机器鼠",
                eName: "mechanicalmouse",
				assets: ["attack","attack_critical","die","explode","idle","idle_critical"],
                description: "攻击过程中会自爆的海盗鼠",
                story: "机器鼠，瘦鼠又来欺负我了！",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(MechanicalMouse);
                })
            };
        case 11:
        case "ninjamouse":
            return {
                type: 11,
                cName: "忍者鼠首领",
                eName: "ninjamouse",
				assets: ["attack_summoned","attack_summoned_critical","die","idle","idle_critical","idle_summoned","idle_summoned_critical","summon_summoned","summon_summoned_critical"],
                description: "行动快速的海盗鼠，能召唤忍者鼠护卫",
                story: "说出的话言出必行，这就是我的忍道。",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(NinjaMouse);
                })
            };
        case 12:
        case "repairmouse":
            return {
                type: 12,
                cName: "修理鼠",
                eName: "repairmouse",
				assets: ["attack","attack_armored","attack_armored_critical","attack_critical","attack_critical_armored","attack_critical_armored_critical","die","die_armored","generate_armored","generate_armored_critical","generate_critical_armored","generate_critical_armored_critical","idle","idle_armored","idle_armored_critical","idle_critical","idle_critical_armored","idle_critical_armored_critical","unarmor","unarmor_critical"],
                description: "举着梯子作为防具的海盗鼠，架设有梯子的防御卡会被快速翻过",
                story: "修理鼠修理修理署的修理枢。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(RepairMouse);
                })
            };
        case 13:
        case "frogmouse":
            return {
                type: 13,
                cName: "青蛙王子鼠",
                eName: "frogmouse",
                assets: ["attack_inwater_jumped", "attack_inwater_jumped_critical", "die_inwater", "dive_inwater", "dive_inwater_critical", "idle", "idle_inwater", "idle_inwater_critical", "idle_inwater_jumped", "idle_inwater_jumped_critical", "jump_inwater", "jump_inwater_critical"],
                description: "行动快速的水路海盗鼠，能够越过防御卡",
                story: "你不一定要成为公主，才能找到你的王子。",
                awardEvents: [
                    {type: 0, num: 50, needChance: 80},
                ],
                summon: (function () {
                    return waterSummon(FrogMouse);
                })
            };
        case 14:
        case "giantmouse":
            return {
                type: 14,
                cName: "巨型鼠",
                eName: "giantmouse",
                assets: ["attack", "attack_critical", "die", "idle", "idle_critical"],
                description: "体格巨大的海盗鼠，攻击造成碾压",
                story: "碧海擎鲸望巨“型”，云天张翼仰高“朋”。",
                awardEvents: [
                    {type: 0, num: 100, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(GiantMouse);
                })
            };
        case 15:
        case "rollermouse":
            return {
                type: 15,
                cName: "轮滑鼠",
                eName: "rollermouse",
                assets: ["attack", "attack_armored", "attack_armored_critical", "attack_critical", "die", "idle", "idle_armored", "idle_armored_critical", "idle_critical", "unarmor_attack", "unarmor_idle"],
                description: "行动快速、戴着全副武装的海盗鼠",
                story: "我的滑板鞋，时尚时尚最时尚。",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(RollerMouse);
                })
            };
        case 16:
        case "mobilemachineryshop":
            return {
                type: 16,
                cName: "工程车鼠",
                eName: "mobilemachineryshop",
                assets: ["attack", "attack_critical", "die", "idle", "idle_critical", "move", "move_critical"],
                description: "驾驶工程车的海盗鼠，能向防御卡投掷石头",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(MobileMachineryShop);
                })
            };
        case 17:
        case "mole":
            return {
                type: 17,
                cName: "鼹鼠",
                eName: "mole",
                assets: ["arise", "attack", "attack_critical", "die", "dig", "idle", "idle_critical", "stagger", "stagger_critical"],
                description: "能够快速移动到战场后方，而后向前偷袭的海盗鼠",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(Mole);
                })
            };
        case 18:
        case "glidingmouse":
            return {
                type: 18,
                cName: "滑翔鼠",
                eName: "glidingmouse",
                assets: ["attack", "attack_critical", "die", "drop", "fly", "idle", "idle_critical"],
                description: "驾驶滑翔翼的空中海盗鼠",
                story: "我的青春小鸟一样不回来。",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(GlidingMouse);
                })
            };
        case 19:
        case "roguemouse":
            return {
                type: 19,
                cName: "大盗鼠",
                eName: "roguemouse",
                assets: ["attack", "idle"],
                description: "从高空一跃而下、窃取防御卡的海盗鼠",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 75, needChance: 80},
                ],
                summon: (function () {
                    return foodPosSummon(RogueMouse);
                })
            };
        case 20:
        case "footballfanmousewater":
            return {
                type: 20,
                cName: "泳圈球迷鼠",
                eName: "footballfanmousewater",
                assets: ["attack_inwater", "attack_inwater_armored", "attack_inwater_armored_critical", "attack_inwater_critical", "die", "die_inwater", "dive_inwater", "dive_inwater_armored", "dive_inwater_armored_critical", "dive_inwater_critical", "idle", "idle_armored", "idle_armored_critical", "idle_critical", "idle_inwater", "idle_inwater_armored", "idle_inwater_armored_critical", "idle_inwater_critical", 'unarmor_idle', "unarmor_inwater_attack", "unarmor_inwater_idle"],
                description: "戴着半截足球作为防具的水路海盗鼠",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return waterSummon(FootballFanMouseWater);
                })
            };
        case 21:
        case "rubbishtruck":
            return {
                type: 21,
                cName: "垃圾车鼠",
                eName: "rubbishtruck",
                assets: ["die", "idle", "idle_critical"],
                description: "驾驶垃圾车的海盗鼠，攻击造成碾压",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(RubbishTruck);
                })
            };
        case 22:
        case "panmousewater":
            return {
                type: 22,
                cName: "泳圈铁锅鼠",
                eName: "panmousewater",
                assets: ["attack_inwater", "attack_inwater_armored", "attack_inwater_armored_critical", "attack_inwater_critical", "die", "die_inwater", "dive_inwater", "dive_inwater_armored", "dive_inwater_armored_critical", "dive_inwater_critical", "idle", "idle_armored", "idle_armored_critical", "idle_critical", "idle_inwater", "idle_inwater_armored", "idle_inwater_armored_critical", "idle_inwater_critical", 'unarmor_idle', "unarmor_inwater_attack", "unarmor_inwater_idle"],
                description: "戴着铁锅作为防具的水路海盗鼠",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return waterSummon(PanMouseWater);
                })
            };
        case 23:
        case "mariomouse":
            return {
                type: 23,
                cName: "“洞君”",
                eName: "mariomouse",
                assets: ["die", "dig", "dig_critical", "dive", "dive_critical", "idle", "idle_critical", "jump", "jump_critical"],
                description: "镇守曲奇岛和色拉岛的首领，能够挖掘管道、蹦跳着碾压防御卡",
                story: "这里是老鼠的故事",
                awardEvents: [
                    {type: 0, num: 25, needChance: 80},
                ],
                summon: (function () {
                    return landSummon(MarioMouse);
                })
            };
        case 24:
            return {
                type: 24,
                cName: "管道",
                eName: "tube",
                assets: ["idle", "idle_critical"],
                description: "由“洞君”召唤的管道",
                story: "这里是老鼠的故事",
                summon: (function () {
                    return landSummon(TubeOut);
                })
            };
        default:
            return {
                type: -1,
                cName: "老鼠",
                eName: "mouse",
                assets: ["attack", "attack_critical", "die", "idle", "idle_critical"],
                description: "这里是老鼠的概述",
                story: "这里是老鼠的故事。",
                summon: (function () {
                    throw GAME_ERROR_CODE_013 + type;
                })
            };
    }
}