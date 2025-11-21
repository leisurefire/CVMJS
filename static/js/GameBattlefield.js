import EventHandler from "./EventHandler.js";
import { i18n } from "./i18n/index.js";
import { Character, Plate } from "./Foods.js";
import { GEH, WarnMessageBox } from "./Core.js";
import { level } from "./Level.js";
import { WebGLRenderer } from "./renderer/WebGLRenderer.js";
/**
 * 通用节流函数，控制高频调用
 */
function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}
export class Sun {
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
export class MapGrid {
    static typeShield = new Set(["watermelonrind", "toast", "chocolatebread"]);
    static protected = new Set(["player"]);
    #layers = [];
    water = false;
    lava = false;
    noPlace = false;
    get layers() {
        return [this.#layers[1],
            this.#layers[0],
            this.#layers[2]];
    }
    get layer_0() {
        return this.#layers[0];
    }
    set layer_0(value) {
        this.#layers[0] = value;
    }
    get layer_1() {
        return this.#layers[1];
    }
    set layer_1(value) {
        this.#layers[1] = value;
    }
    get layer_2() {
        return this.#layers[2];
    }
    set layer_2(value) {
        this.#layers[2] = value;
    }
    get ignored() {
        return this.layer_0?.ignored || this.layer_1?.ignored;
    }
    get hasTarget() {
        return (this.layer_1?.attackable && !this.layer_1.short)
            || (this.layer_0?.attackable && !this.layer_0.short)
            || (this.layer_2?.attackable && !this.layer_2.short);
    }
    get hasCrashTarget() {
        return this.layer_1?.attackable
            || this.layer_0?.attackable
            || this.layer_2?.attackable;
    }
    constructor(water = false, lava = false) {
        this.water = water;
        this.lava = lava;
    }
    shovel() {
        if (this.#layers[1]?.canShovel) {
            this.#layers[1].remove();
            this.#layers[1] = undefined;
            return true;
        }
        else if (this.#layers[0]?.canShovel) {
            this.#layers[0].remove();
            this.#layers[0] = null;
            return true;
        }
        else if (this.#layers[2]?.canShovel) {
            if (this.#layers[1]?.constructor.name && MapGrid.protected.has(this.#layers[1].constructor.name)) {
                return false;
            }
            this.#layers[2].remove();
            this.#layers[2] = null;
            return true;
        }
        return false;
    }
    getCrashDamaged(value = 20, origin = null) {
        for (const layer of this.layers) {
            if (layer?.attackable) {
                const health = layer.health;
                layer.getCrashDamaged(value, origin);
                value -= health;
                if (value <= 0) {
                    return true;
                }
            }
        }
        return true;
    }
    getDamaged(value = 20, origin = null) {
        for (const layer of this.#layers) {
            if (layer?.attackable) {
                const health = layer.health;
                layer.getDamaged(value, origin);
                value -= health;
                if (value <= 0) {
                    return true;
                }
            }
        }
        return true;
    }
    getShieldType() {
        for (const layer of this.#layers) {
            if (layer && MapGrid.typeShield.has(layer.constructor.name)) {
                return layer;
            }
        }
        return null;
    }
    getThrown(value = 20) {
        for (const layer of this.layers) {
            if (layer) {
                layer.getDamaged(value);
                return true;
            }
        }
        return false;
    }
    crashRemove() {
        for (const [index, layer] of this.#layers.entries()) {
            if (layer?.attackable) {
                if (!MapGrid.protected.has(layer.constructor.name)) {
                    layer.remove();
                    this.#layers[index] = null;
                }
            }
        }
        return true;
    }
}
export class GameBattlefield extends HTMLElement {
    static COUNTDOWN = "/images/interface/countdown.png";
    #Parent;
    #Cursor = {
        x: 0,
        y: 0,
        origin: null,
        picked: true,
    };
    BossBar;
    BossProgress;
    get Cursor() {
        return this.#Cursor;
    }
    ctxBG = null;
    ctxFG = null;
    #Style = document.createElement('style');
    Canvas = document.createElement('canvas');
    FrequentCanvas = document.createElement('canvas');
    WaveBar = document.createElement('div');
    WaveNum = document.createElement('h2');
    ProgressBar = document.createElement('div');
    Progress = document.createElement('div');
    Shovel = document.createElement('div');
    Exit = document.createElement('div');
    SunBar = document.createElement('div');
    Cards = document.createElement('div');
    #CountDownElapsed = 0;
    #OverallFront = null;
    get OverallFront() {
        return this.#OverallFront;
    }
    #TotalHitPoints = 0;
    get TotalHitPoints() {
        return this.#TotalHitPoints;
    }
    _lastProgressWidth = null;
    _lastWaveNum = null;
    _lastBossProgressWidth = null;
    useWebGL = false;
    renderer = null;
    appendChild(node) {
        if (this.shadowRoot) {
            return this.shadowRoot.appendChild(node);
        }
        else {
            throw `Initialization failed.`;
        }
    }
    #mouseMove = (ev) => {
        this.#Cursor.x = ev.clientX / GEH.scale;
        this.#Cursor.y = ev.clientY / GEH.scale;
    };
    constructor(Parent = null, useWebGL = false) {
        super();
        this.#Parent = Parent;
        this.useWebGL = useWebGL;
        document.body.appendChild(this);
        document.addEventListener('keydown', this.#shortCutHandler);
        this.attachShadow({ mode: "open" });
        this.#Style.textContent = `
            div{
                transform-origin: left top;
            }
            
            canvas{
                position: fixed;
                z-index: 1;
                pointer-event: none;
            }
            
            button {
                position: absolute;
                z-index: 3;
                padding: 12px;
                border: none;
                background-color: rgba(255,255,255,.64);
                cursor: pointer;
                backdrop-filter: blur(20px) saturate(200%);
            }
            
            #Cards{
                position: absolute;
                left: 1rem;
                top: 1rem;
                z-index: 2;
                padding: 0.5rem;
                border-radius: 1rem;
                display: grid;
                width: 6rem;
                grid-template-columns: repeat(1, 1fr);
                row-gap: 0.25rem;
                background-color: rgba(255,255,255,.64);
                backdrop-filter: blur(20px) saturate(200%);
                transform: scale(${GEH.scale});
            }
            #Cards>*{
                height: 3.5rem;
                padding: 0;
            }
            #WaveBar {
                position: absolute;
                top: 1rem;
                right: 5rem;
                z-index: 2;
                width: 264px;
                height: 52px;
                border-radius: 52px;
                background-color: rgba(255,255,255,.64);
                float: right;
                font-weight: 600;
                backdrop-filter: blur(20px) saturate(200%);
            }
            
            #WaveBar #WaveNum {
                position: absolute;
                top: 0;
                left: 16px;
                z-index: 2;
                width: 24px;
                height: 24px;
                border-radius: 12px;
                text-align: center;
                font-weight: 900;
                font-size: 18px;
                line-height: 24px;
                transform: scale(0.96);
                user-select: none;
            }
            
            #WaveBar #ProgressBar {
                position: absolute;
                top: 0;
                right: 12px;
                bottom: 0;
                z-index: 2;
                overflow: hidden;
                margin: auto;
                width: 200px;
                height: 18px;
                border-radius: 9px;
                background-color: rgba(0, 0, 0, .12);
                user-select: none;
            }
            
            #WaveBar #ProgressBar #Progress {
                position: absolute;
                top: 0;
                right: -4.2px;
                bottom: 0;
                z-index: 2;
                margin: auto;
                width: 22px;
                height: 19px;
                border-radius: 9px;
                background-color: black;
                transition: width .32s;
            }
            
            #WaveBar .flag {
                position: absolute;
                top: 2px;
                z-index: 2;
                margin: auto;
                width: 27px;
                height: 27px;
                border-radius: 0;
                background-color: transparent;
                background-image: url("${EventHandler.getStaticPath('images/flag.svg')}");
                background-size: cover;
                transform: scale(0.96);
            }
            
            #BossBar {
                position: absolute;
                top: 12px;
                left: calc(162px + 260px);
                z-index: 2;
                overflow: hidden;
                width: 264px;
                height: 52px;
                border-radius: 52px;
                background-color: black;
                font-weight: 600;
                transform: scale(0.96);
            }
            
            #BossBar::before {
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border-radius: 56px;
                background: conic-gradient(from 0deg, #FF0000, #00C2FF, #CDFFEB, #009F9D, #07456F, #0F0A3C, #FF0000);
                content: "";
                animation: boss 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                z-index: -1;
            }
            
            @keyframes boss {
                0%{
                    transform: rotate(0deg);
                    filter: blur(48px);
                }
                50% {
                    transform: rotate(360deg);
                    filter: blur(64px);
                }
                100% {
                    transform: rotate(360deg);
                    filter: blur(48px);
                }
            }
            #BossBar #BossProgress {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 20px;
                z-index: 2;
                margin: auto;
                width: 224px;
                height: 19px;
                border-radius: 9px;
                background-color: white;
                text-align: left;
                transition: width .32s;
            }
            
            #Shovel {
                position: absolute;
                top: 1rem;
                left: 240px;
                z-index: 2;
                width: 6rem;
                height: 52px;
                border-radius: 52px;
                background-color: rgba(255,255,255,.64);
                background-image: url("${EventHandler.getStaticPath('images/shovel.svg')}");
                background-size: 38%;
                background-position: center;
                background-repeat: no-repeat;
                cursor: pointer;
                transition: background-color .12s;
                user-select: none;
                backdrop-filter: blur(20px) saturate(200%);
            }
            #Exit {
                position: absolute;
                top: 1rem;
                right: 1rem;
                z-index: 2;
                width: 3.25rem;
                height: 3.25rem;
                border-radius: 50%;
                background-color: rgba(255,255,255,.64);
                background-image: url("${EventHandler.getStaticPath('images/exit.svg')}");
                background-position: center;
                background-size: 61%;
                background-repeat: no-repeat;
                text-align: center;
                font-weight: 600;
                line-height: 52px;
                cursor: pointer;
                transition: background-color .12s;
                transform: scale(0.96);
                backdrop-filter: blur(20px) saturate(200%);
                user-select: none;
            }
            
            #Exit:active {
                background-color: var(--main_color);
            }
            @keyframes NOT_ENOUGH_SUN{
                from, to{
                    color: black;
                }
                25%{
                    color: red;
                }
                50%{
                    color: black;
                }
                75%{
                    color: red;
                }
            }
            #SunBar {
                position: absolute;
                color: black;
                top: 1rem;
                left: 140px;
                z-index: 2;
                padding-right: 1.25rem;
                width: 6.5rem;
                height: 3.25rem;
                border-radius: 3.25rem;
                background-color: rgba(255,255,255,.64);
                text-align: right;
                font-weight: 600;
                font-size: 1rem;
                line-height: 3.25rem;
                backdrop-filter: blur(20px) saturate(200%);
            }
            #SunBar:before{
                content: "";
                position: absolute;
                display: block;
                top: 0.375rem;
                left: 0.375rem;
                width: 2.5rem;
                height: 2.5rem;
                background-color: var(--main_color);
                border-radius: 50%;
            }
            #SunBar:after{
                content: "";
                position: absolute;
                display: block;
                top: 0.375rem;
                left: 0.375rem;
                width: 2.5rem;
                height: 2.5rem;
                background-image: url("${EventHandler.getStaticPath('images/sunbar.svg')}");
                background-position: center bottom;
                background-repeat: no-repeat;
                border-radius: 50%;
            }
            
            #HugeWave {
                position: absolute;
                top: calc((var(--window_height) - 165px) / 2);
                left: calc((var(--window_width) - 349px) / 2);
                z-index: 2;
                width: 349px;
                height: 165px;
                background-image: url("/images/hugewave.png");
                opacity: 0;
                transform: scale(0);
                animation: hugewave 0.8s forwards;
                pointer-events: none;
            }
            
            #FinalWave {
                position: absolute;
                top: calc((var(--window_height) - 84px) / 2);
                left: calc((var(--window_width) - 297px) /2);
                z-index: 2;
                width: 397px;
                height: 84px;
                background-image: url("/images/finalwave.png");
                opacity: 0;
                animation: finalwave 1.2s forwards;
                pointer-events: none;
            }
            
            #Forward {
                position: fixed;
                z-index: 3;
                margin: 0;
                padding: 0;
                width: var(--window_width);
                height: var(--window_height);
                color: var(--outline);
            }
            
            #Forward #Box {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                margin: auto;
                padding: 0;
                width: 60%;
                height: fit-content;
                border-radius: var(--box_radius_huge);
                background-color: rgb(250,241,244);
            }
            
            #Forward #Box #Title {
                position: relative;
                top: 12px;
                left: 36px;
                color: var(--outline);
                font-weight: 500;
                font-size: 36px;
            }
            
            #Forward #Box #Title:before {
                position: relative;
                display: block;
                width: 48px;
                height: 48px;
                background-image: url("/images/interface/icons/forward.svg");
                background-size: contain;
                content: "";
            }
            
            #Forward #Box #Description {
                position: relative;
                top: 0;
                left: 36px;
                color: var(--outline);
                font-weight: 400;
                font-size: 16px;
            }
            
            #Forward #Box button {
                position: relative;
                top: 12px;
                right: 36px;
                float: right;
                margin-bottom: 48px;
                padding: 12px 24px;
                border: none;
                border-radius: 32px;
                background-color: var(--main_color);
                box-shadow: transparent;
                color: white;
                text-align: left;
                cursor: pointer;
                transition: all 0.24s;
            }
            
            #Forward #Box button:last-of-type {
                background-color: transparent;
                color: var(--outline);
            }
            #Forward #Box button:hover {
                box-shadow: var(--main_color) 0 3px 6px;
            }
            #Forward #Box button:last-of-type:hover {
                color: var(--main_color);
                box-shadow: transparent;
            }
            
            #victoryBox {
                text-align: left;
                position: fixed;
                left: 50%;
                top: 50%;
                z-index: 99;
                margin: 0;
                width: calc(var(--window_width)* 0.618);
                color: var(--outline);
                background-color: var(--background);
                transform: translate(-50%, -50%);
                border-radius: var(--box_radius_huge);
                padding: 2rem;
            }
            
            #victoryBox #victoryTitle {
                position: relative;
                color: var(--outline);
                font-weight: 500;
                font-size: 3rem;
                margin: 2rem;
            }
            
            #victoryBox #scoreContainer {
                position: relative;
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;
                margin: 2rem;
                height: 4rem;
                border: solid rgba(0, 0, 0, 0.16) 1px;
                border-radius: 2rem;
                background-color: #fffbff;
                color: var(--outline);
                text-align: left;
            }
            
            #victoryBox #awardContainer {
                position: relative !important;
                top: 0;
                right: 0;
                left: 0;
                margin: 2rem;
                padding: 2rem;
                border-radius: 2rem;
                background-color: #fffbff;
                color: var(--outline);
                text-align: center;
            }
            
            #victoryBox .box::before {
                position: relative;
                top: 32px;
                left: 16px;
                margin: auto;
                color: var(--outline);
                content: "";
                font-weight: 500;
                transform: translateY(-50%);
            }
            
            #victoryBox #awardContainer::before {
                content: "";
                position: relative;
                display: block;
                margin-bottom: 1rem;
                top: 0;
                left: 50%;
                width: 54px;
                height: 36px;
                border-radius: 1rem;
                background-color: rgb(250, 241, 244);
                background-image: url("${EventHandler.getStaticPath('images/award.svg')}");
                background-position: center;
                background-repeat: no-repeat;
                transform: translateX(-50%);
            }
            
            #victoryBox #scoreContainer::before {
                position: absolute;
                top: 50%;
                left: 1.5rem;
                transform: translateY(-50%);
                content: "得分";
            }
            
            #victoryBox #scoreContainer h2 {
                position: absolute;
                top: 50%;
                right: 24px;
                margin: 0;
                font-size: 36px;
                transform: translateY(-50%);
            }
            
            #victoryBox #awardContainer div {
                position: relative;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                display: inline-block;
                overflow: hidden;
                margin: auto;
                padding-top: 42px;
                width: 72px;
                height: 30px;
                border-radius: 12px;
                background-color: rgb(250, 241, 244);
                background-image: url("/images/items/coin.webp");
                background-position: center 6px;
                background-repeat: no-repeat;
                color: var(--outline);
                text-align: center;
                font-weight: 500;
                font-size: 12px;
            }
            
            #victoryBox button {
                position: relative;
                float: right;
                margin: 2rem;
                padding: 1rem;
                border: none;
                border-radius: 2rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.24s;
                color: white;
                background-color: var(--main_color);
            }
            
            #victoryBox button:hover {
                transform: scale(1.1);
            }
            
            #Defeat {
                position: absolute;
                top: 233px;
                left: calc(477px - 157px);
                z-index: 99;
                width: 315px;
                height: 68px;
                background-image: url("/images/defeat_2.png");
                opacity: 0;
                animation-play-state: running;
                animation: defeat_2 .7s forwards;
            }
            
            #Defeat:after {
                position: absolute;
                top: -45px;
                left: 81px;
                z-index: 100;
                width: 152px;
                height: 79px;
                background-image: url("/images/defeat_1.png");
                content: '';
                animation-play-state: running;
                animation: defeat_1 .7s forwards;
            }
            
            .game-card-details{
                position: absolute;
                z-index: 2;
                padding: 0.75rem;
                max-width: 12rem;
                min-width: 8rem;
                border: rgba(255, 255, 255, .12) 1px solid;
                border-radius: 1rem;
                background-color: rgba(255,255,255,.64);
                box-shadow: rgba(0, 0, 0, .32) 1px 1px 12px;
                text-align: left;
                font-size: 0.875rem;
                backdrop-filter: blur(20px) saturate(200%);
                transform: translateY(-50%);
            }
            .game-card-details a {
                position: relative;
                top: 4px;
                right: 4px;
                float: right;
                padding: 2px 6px 0 2px;
                border-radius: 8px;
                background-color: var(--outline);
                color: white;
            }
            .game-card-details span {
                text-align: center;
                display: block;
                padding: 4px;
                border-radius: 1rem;
                background-color: rgba(255,255,255,.64);
                margin: 0 0.25rem 0.5rem 0.25rem;
                color: red;
                font-weight: 600;
            }
            
            @keyframes screenMove {
                0% {
                    margin-top: 0;
                }
                50% {
                    margin-top: 2px;
                }
                100% {
                    margin-top: 0;
                }
            }
            @keyframes hugewave {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                70% {
                    transform: scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            @keyframes finalwave {
                0% {
                    opacity: 0;
                    top: calc(300px - 42px - 60px);
                }
                40% {
                    opacity: 1;
                    top: calc(300px - 42px + 10px);
                }
                50% {
                    opacity: 1;
                    top: calc(300px - 42px - 10px);
                }
                60% {
                    opacity: 1;
                    top: calc(300px - 42px + 5px);
                }
                70% {
                    opacity: 1;
                    top: calc(300px - 42px - 5px);
                }
                100% {
                    opacity: 1;
                    top: calc(300px - 42px);
                }
            }
            @keyframes defeat_1 {
                0% {
                    top: -345px;
                    transform: scaleX(0.6);
                }
                60% {
                    top: -135px;
                    transform: scaleX(1.2);
                }
                100% {
                    top: -45px;
                    transform: scaleX(1);
                }
            }
            @keyframes defeat_2 {
                0% {
                    opacity: 0;
                    top: -100px;
                }
                100% {
                    opacity: 1;
                    top: 233px;
                }
            }
        `;
        this.Canvas.width = document.documentElement.clientWidth;
        this.Canvas.height = document.documentElement.clientHeight;
        if (this.useWebGL) {
            try {
                this.renderer = new WebGLRenderer(this.Canvas);
                this.renderer.scale(GEH.scale, GEH.scale);
                console.log('[GameBattlefield] WebGL renderer initialized');
            }
            catch (error) {
                console.warn('[GameBattlefield] WebGL initialization failed, falling back to Canvas 2D:', error);
                this.useWebGL = false;
                this.ctxBG = this.Canvas.getContext('2d');
                if (this.ctxBG) {
                    this.ctxBG.scale(GEH.scale, GEH.scale);
                }
            }
        }
        else {
            this.ctxBG = this.Canvas.getContext('2d');
            if (this.ctxBG) {
                this.ctxBG.scale(GEH.scale, GEH.scale);
            }
        }
        this.FrequentCanvas.width = document.documentElement.clientWidth;
        this.FrequentCanvas.height = document.documentElement.clientHeight;
        this.FrequentCanvas.style.zIndex = "3";
        this.FrequentCanvas.style.pointerEvents = "none";
        this.ctxFG = this.FrequentCanvas.getContext('2d');
        if (this.ctxFG) {
            this.ctxFG.scale(GEH.scale, GEH.scale);
        }
        this.Shovel.style.left = `${140 * GEH.scale + 136}px`;
        this.Shovel.id = "Shovel";
        this.SunBar.style.left = `${140 * GEH.scale}px`;
        this.SunBar.innerText = "50";
        this.SunBar.id = "SunBar";
        this.WaveBar.id = "WaveBar";
        this.Exit.id = "Exit";
        this.ProgressBar.id = "ProgressBar";
        this.Progress.id = "Progress";
        this.WaveNum.id = "WaveNum";
        this.WaveNum.innerText = '0';
        this._lastWaveNum = '0';
        this.Cards.id = "Cards";
        this.SunBar.addEventListener('animationend', () => {
            this.SunBar.style.animation = "none";
        });
        this.Exit.addEventListener('click', () => {
            GEH.requestPlayAudio("dida");
            EventHandler.backgroundMusic.pause();
            cancelAnimationFrame(level.levelTimer);
            // 等待i18n加载完成后再显示暂停对话框
            const showPauseDialog = () => {
                WarnMessageBox({
                    Title: `${i18n.t("PAUSED")}`,
                    Text: `${i18n.t("GAME_ERROR_CODE_010")}`,
                    ButtonLabelYes: `${i18n.t("GAME_UI_BUTTON_004")}`,
                    ButtonLabelNo: `${i18n.t("CONTINUE")}`,
                    ButtonFuncYes: () => {
                        level.exit();
                    },
                    ButtonFuncNo: () => {
                        EventHandler.backgroundMusic.play();
                        level.gameEventsHandlerFunc();
                    },
                });
            };
            if (i18n.isReady()) {
                showPauseDialog();
            }
            else {
                i18n.getLoadPromise().then(showPauseDialog).catch(console.error);
            }
        });
        this.Shovel.addEventListener('click', ev => this.#shovel(ev));
        this.addEventListener("mousemove", this.#mouseMove);
        this.WaveBar.appendChild(this.WaveNum);
        this.WaveBar.appendChild(this.ProgressBar);
        this.ProgressBar.appendChild(this.Progress);
        if (this.shadowRoot) {
            this.shadowRoot.appendChild(this.#Style);
            this.shadowRoot.appendChild(this.Canvas);
            this.shadowRoot.appendChild(this.FrequentCanvas);
            this.shadowRoot.appendChild(this.Cards);
            this.shadowRoot.appendChild(this.SunBar);
            this.shadowRoot.appendChild(this.Shovel);
            this.shadowRoot.appendChild(this.WaveBar);
            this.shadowRoot.appendChild(this.Exit);
        }
    }
    initialize() {
        this.Cards.append(...this.#Parent.Cards);
    }
    #shovel(ev = null) {
        if (this.#Cursor.picked) {
            return false;
        }
        GEH.requestPlayAudio('chanzi');
        this.Shovel.style.backgroundColor = "var(--main_color)";
        const Handler = {
            src: "/images/interface/shovel/default.png",
            offset: [-15, -25],
            frames: 1,
            func: () => {
                this.Shovel.style.backgroundColor = "rgba(255,255,255,.64)";
                return true;
            },
            successFunc: ({ positionX, positionY }) => {
                const x = (positionX * level.row_gap + level.column_start - 15);
                const y = (positionY * level.column_gap + level.row_start - 25);
                level.createSpriteAnimation(x, y, "/images/interface/shovel/shovel.png", 7, {
                    zIndex: positionY * level.column_num + positionX,
                });
                const grid = level.Foods[positionY * level.column_num + positionX];
                if (grid != null) {
                    const isWater = grid.water;
                    grid.shovel();
                    this.playPlantAnimation(isWater ? 1 : 0, positionX, positionY);
                }
                else {
                    this.playPlantAnimation(0, positionX, positionY);
                }
                return true;
            },
            failFunc: () => {
                this.Shovel.style.backgroundColor = "rgba(255,255,255,.64)";
                return false;
            },
            slot: this.Shovel,
        };
        return this.requestCursorTracking(ev, Handler);
    }
    #shortCutHandler = (ev) => {
        if (ev.key === "1") {
            this.#shovel();
        }
    };
    playPlantAnimation(type = 0, positionX = 0, positionY = 0) {
        if (type === 0) {
            GEH.requestPlayAudio("fangka");
            const x = (positionX * level.row_gap + level.column_start - 10);
            const y = (positionY * level.column_gap + level.row_start + 20);
            level.createSpriteAnimation(x, y, "/images/interface/smoke", 4, {
                isSvg: true,
                scale: 0.24,
                zIndex: positionY * level.column_num + positionX,
            });
            return true;
        }
        else if (type === 1) {
            GEH.requestPlayAudio("fangka_w");
            const x = (positionX * level.row_gap + level.column_start);
            const y = (positionY * level.column_gap + level.row_start + 25);
            level.createSpriteAnimation(x, y, "/images/interface/spray", 4, {
                isSvg: true,
                zIndex: positionY * level.column_num + positionX,
            });
            return true;
        }
        else {
            return false;
        }
    }
    playCountDownAnimation(elapsed) {
        const CountDown = GEH.requestDrawImage(GameBattlefield.COUNTDOWN);
        const ctx = this.ctxFG;
        this.#CountDownElapsed += Math.min(50, elapsed);
        if (ctx && CountDown) {
            const width = CountDown.width / 3;
            const height = CountDown.height;
            const x = document.documentElement.clientWidth / GEH.scale / 2 - width / 2;
            const y = document.documentElement.clientHeight / GEH.scale / 2 - height / 2;
            if (this.#CountDownElapsed <= 1000) {
                ctx.drawImage(CountDown, 0, 0, width, height, x, y, width, height);
            }
            else if (this.#CountDownElapsed > 1000 && this.#CountDownElapsed <= 2000) {
                ctx.drawImage(CountDown, width, 0, width, height, x, y, width, height);
            }
            else if (this.#CountDownElapsed > 2000 && this.#CountDownElapsed <= 3000) {
                ctx.drawImage(CountDown, width * 2, 0, width, height, x, y, width, height);
            }
            else {
                if (!level.characterPlaced) {
                    this.removeCursorTracking();
                    level.characterPlaced = true;
                    const col = Math.floor(Math.random() * level.row_num);
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < level.column_num; j++) {
                            let y = (j + col) % level.column_num;
                            if (level.Foods[y * level.column_num + i].noPlace) {
                            }
                            else if (level.Foods[y * level.column_num + i].water) {
                                if (level.Foods[y * level.column_num + i].layer_1 == null) {
                                    if (level.Foods[y * level.column_num + i].layer_2 == null) {
                                        level.Foods[y * level.column_num + i].layer_2 = new Plate(i, y);
                                    }
                                    level.Foods[y * level.column_num + i].layer_1 = new Character(i, y, 1);
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            }
                            else if (level.Foods[y * level.column_num + i].layer_1 == null) {
                                level.Foods[y * level.column_num + i].layer_1 = new Character(i, y, 0);
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    requestCursorTracking(ev, origin) {
        if (this.#Cursor.picked) {
            return false;
        }
        this.#Cursor.picked = true;
        this.#Cursor.origin = origin;
        this.addEventListener("click", this.#handleCursorClick);
        this.addEventListener("contextmenu", this.#handleCursorContextMenu);
    }
    removeCursorTracking() {
        this.#Cursor.picked = false;
        this.#Cursor.origin = null;
        this.removeEventListener('click', this.#handleCursorClick);
        this.removeEventListener("contextmenu", this.#handleCursorContextMenu);
    }
    #handleCursorClick = (ev) => {
        if (this.#Cursor.origin && this.#Cursor.origin.slot) {
            const rect = this.#Cursor.origin.slot.getBoundingClientRect();
            if (ev.x >= rect.x && ev.x <= rect.x + rect.width
                && ev.y >= rect.y && ev.y <= rect.y + rect.height) {
                return false;
            }
        }
        const { positionX, positionY } = {
            positionX: Math.floor(EventHandler.getPositionX(this.#Cursor.x)),
            positionY: Math.floor(EventHandler.getPositionY(this.#Cursor.y))
        };
        if (positionX >= 0 && positionX < level.column_num
            && positionY >= 0 && positionY < level.row_num) {
            if (this.#Cursor.origin.func({ positionX, positionY })) {
                this.#Cursor.origin.successFunc({ positionX, positionY });
            }
            else {
                this.#Cursor.origin.failFunc({ positionX, positionY });
            }
        }
        else {
            this.#Cursor.origin.failFunc({ positionX, positionY });
        }
        if (level.characterPlaced) {
            this.removeCursorTracking();
        }
    };
    #handleCursorContextMenu = (ev) => {
        this.#Cursor.origin.failFunc(ev);
        if (level.characterPlaced) {
            this.removeCursorTracking();
        }
    };
    nextWave = (WaveTag, WaveNum, IsForwardWaves, ForwardWaveNum) => {
        if (WaveTag > 1) {
            let newWidth = 0;
            if (IsForwardWaves) {
                newWidth = (((WaveTag - ForwardWaveNum) / (WaveNum - 1 - ForwardWaveNum)) * 184 + 20);
            }
            else {
                newWidth = (((WaveTag) / (WaveNum - 1)) * 184 + 20);
            }
            const widthPx = `${newWidth.toFixed(2)}px`;
            if (this._lastProgressWidth !== widthPx) {
                this.Progress.style.width = widthPx;
                this._lastProgressWidth = widthPx;
            }
        }
    };
    #updateWaveNumDisplay(value) {
        const text = value.toString();
        if (this._lastWaveNum !== text) {
            this.WaveNum.innerText = text;
            this._lastWaveNum = text;
        }
    }
    // 节流: 显示大波提示，100ms限频避免频繁DOM操作
    showHugeWave = throttle((HugeWaveTag) => {
        this.#updateWaveNumDisplay(HugeWaveTag);
        const HugeWave = document.createElement('div');
        HugeWave.id = "HugeWave";
        this.appendChild(HugeWave);
        setTimeout(() => {
            HugeWave.remove();
        }, 1600);
    }, 100);
    // 节流: 显示最终波提示，100ms限频避免频繁DOM操作
    showFinalWave = throttle((HugeWaveTag) => {
        this.#updateWaveNumDisplay(HugeWaveTag);
        const FinalWave = document.createElement('div');
        FinalWave.id = "FinalWave";
        this.appendChild(FinalWave);
        setTimeout(() => {
            FinalWave.remove();
        }, 1600);
    }, 100);
    updateBackground = (backgroundImage, Cards, SunNum) => {
        this.#TotalHitPoints = 0;
        const renderer = this.useWebGL ? this.renderer : this.ctxBG;
        const background = GEH.requestDrawImage(backgroundImage);
        if (renderer && background) {
            renderer.drawImage(background, 80, 0, 954, 600, 0, 0, 954, 600);
            level.mapMove();
            Cards.forEach((value, index) => {
                value.cooldownProcess();
            });
        }
    };
    drawEntity(renderer, src, width, height, tick, x, y, effect = null) {
        if (src.endsWith('.webp') && !effect) {
            const frame = GEH.getWebPFrame(src, tick);
            if (frame) {
                renderer.drawImage(frame, x, y, width, height);
                return;
            }
        }
        const img = GEH.requestDrawImage(src, effect);
        if (img) {
            if (img.width >= width * 2 || (img.width > width && src.endsWith('.png'))) {
                renderer.drawImage(img, width * tick, 0, width, height, x, y, width, height);
            }
            else {
                renderer.drawImage(img, x, y, width, height);
            }
        }
    }
    updateMapGrid = (mapGrid) => {
        const renderer = this.useWebGL ? this.renderer : this.ctxBG;
        if (mapGrid && renderer) {
            const { layer_0, layer_1, layer_2 } = mapGrid;
            if (layer_2) {
                layer_2.behavior();
                this.drawEntity(renderer, layer_2.entity, layer_2.width, layer_2.height, layer_2.tick, layer_2.x, layer_2.y);
                if (layer_2) {
                    layer_2.CreateOverlayAnim();
                }
            }
            if (!mapGrid.water) {
                if (layer_0) {
                    layer_0.CreateUnderlayAnim();
                }
                else if (layer_1) {
                    layer_1.CreateUnderlayAnim();
                }
            }
            if (layer_0) {
                if (layer_0.inside) {
                    const img = GEH.requestDrawImage(layer_0.inside);
                    if (img) {
                        const imgWidth = 'width' in img ? img.width : 0;
                        const imgHeight = 'height' in img ? img.height : 0;
                        renderer.drawImage(img, layer_0.x, layer_0.y, imgWidth, imgHeight);
                    }
                }
            }
            if (layer_1) {
                layer_1.behavior();
                if (layer_1) {
                    if (layer_1.remainTime != null) {
                        layer_1.remainTime -= 100;
                    }
                    this.drawEntity(renderer, layer_1.entity, layer_1.width, layer_1.height, layer_1.tick, layer_1.x, layer_1.y);
                    if (layer_1) {
                        layer_1.CreateOverlayAnim();
                    }
                }
            }
            if (layer_0) {
                layer_0.behavior();
                this.drawEntity(renderer, layer_0.entity, layer_0.width, layer_0.height, layer_0.tick, layer_0.x, layer_0.y);
                if (layer_0) {
                    layer_0.CreateOverlayAnim();
                }
            }
        }
    };
    updateEnemies = (mouse, elapsed, miceTemp, airLaneTemp) => {
        const renderer = this.useWebGL ? this.renderer : this.ctxBG;
        if (mouse) {
            if (mouse.state === "die" || mouse.state === "explode") {
                if (mouse === this.#OverallFront) {
                    this.#OverallFront = null;
                }
                if (mouse.tick === mouse.stateLength - 1) {
                    return;
                }
            }
            else {
                if (mouse.attackable && mouse.canBeFollowed) {
                    if (!this.#OverallFront ||
                        this.#OverallFront.health <= 0 ||
                        !this.#OverallFront.attackable ||
                        !this.#OverallFront.canBeFollowed) {
                        this.#OverallFront = mouse;
                    }
                    else {
                        if (this.#OverallFront.fly) {
                            if (mouse.fly) {
                                if (mouse.positionX < this.#OverallFront.positionX) {
                                    this.#OverallFront = mouse;
                                }
                            }
                        }
                        else {
                            if (mouse.fly) {
                                this.#OverallFront = mouse;
                            }
                            else {
                                if (mouse.positionX < this.#OverallFront.positionX) {
                                    this.#OverallFront = mouse;
                                }
                            }
                        }
                    }
                }
                mouse.behaviorAnim();
                this.#TotalHitPoints += mouse.health;
                if (mouse.armorHealth > 0) {
                    this.#TotalHitPoints += mouse.armorHealth;
                }
            }
            mouse.behaviorMove();
            let effect = null;
            if (mouse.freezing || mouse.frozen) {
                effect = "freezing";
            }
            else if (mouse.getDamagedTag > 0) {
                effect = "damaged";
            }
            if (renderer) {
                this.drawEntity(renderer, mouse.entity, mouse.width, mouse.height, Math.floor(mouse.tick), mouse.x, mouse.y, effect);
            }
            if (mouse.CanUpdateEntity) {
                mouse.tick = (mouse.tick + 1 / (mouse.freezing ? 2 : 1)) % (mouse.stateLength);
            }
            else {
                mouse.tick = mouse.tick % (mouse.stateLength);
            }
            mouse.freezeProcess();
            mouse.haltedProcess();
            mouse.changeLineProcess();
            if (mouse.CanUpdateEntity && mouse.Movable) {
                mouse.ignoreProcess();
                mouse.x = mouse.x - mouse.speed / (mouse.freezing ? 2 : 1);
            }
            if (mouse.getDamagedTag) {
                mouse.getDamagedTag -= 1;
            }
            if (mouse.fly) {
                airLaneTemp[mouse.row] = airLaneTemp[mouse.row] || [];
                if (!airLaneTemp[mouse.row][mouse.column]) {
                    airLaneTemp[mouse.row][mouse.column] = [];
                }
                airLaneTemp[mouse.row][mouse.column].push(mouse);
            }
            miceTemp[mouse.row][mouse.column].push(mouse);
        }
    };
    renderFog(ctx, fogSrc, lightDEG, fogColNum, fogBlowInterval, fogBlowAnimation, fogBlowAnimationLength) {
        if (!lightDEG)
            return;
        let offsetX = 24;
        if (fogBlowInterval > 0) {
            if (fogBlowAnimation > 0) {
                offsetX += ((fogBlowAnimationLength - fogBlowAnimation) / fogBlowAnimationLength) * 2048;
            }
            else
                return;
        }
        for (let i = 0; i < lightDEG.length; i++) {
            const x = i % (level.column_num + 1);
            const y = Math.floor(i / (level.column_num + 1));
            if (x < level.column_num + 1 - fogColNum)
                continue;
            const deg = lightDEG[i];
            if (deg >= 2)
                continue;
            const dx = level.column_start + (x - 1) * (level.column_gap - 4) + offsetX;
            const dy = level.row_start + (y - 1) * (level.row_gap + 8);
            if (deg === 1) {
                const fog = GEH.requestDrawImage(fogSrc, "opacity", 0.64);
                if (fog) {
                    ctx.drawImage(fog, dx, dy, fog.width, fog.height);
                }
                else {
                    const ori = GEH.requestDrawImage(fogSrc);
                    if (ori)
                        ctx.drawImage(ori, dx, dy, ori.width, ori.height);
                }
            }
            else if (deg === 0) {
                const fog = GEH.requestDrawImage(fogSrc);
                if (fog)
                    ctx.drawImage(fog, dx, dy, fog.width, fog.height);
            }
        }
    }
    updateBullets = () => {
    };
    createBossBar = (target) => {
        this.BossBar = document.createElement("div");
        this.BossBar.id = "BossBar";
        this.appendChild(this.BossBar);
        this.BossProgress = document.createElement('div');
        this.BossProgress.id = 'BossProgress';
        this.BossBar.appendChild(this.BossProgress);
        target.progress = this.BossProgress;
    };
    resize(scale) {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        this.Canvas.width = width;
        this.Canvas.height = height;
        this.FrequentCanvas.width = width;
        this.FrequentCanvas.height = height;
        if (this.useWebGL && this.renderer) {
            this.renderer.resize(width, height);
            this.renderer.scale(scale, scale);
        }
        else if (this.ctxBG) {
            this.ctxBG.setTransform(1, 0, 0, 1, 0, 0);
            this.ctxBG.scale(scale, scale);
        }
        if (this.ctxFG) {
            this.ctxFG.setTransform(1, 0, 0, 1, 0, 0);
            this.ctxFG.scale(scale, scale);
        }
        this.SunBar.style.left = `${140 * scale}px`;
        this.Shovel.style.left = `${140 * scale + 136}px`;
        this.Cards.style.transform = `scale(${scale})`;
    }
    remove() {
        document.removeEventListener('keydown', this.#shortCutHandler);
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        super.remove();
    }
}
customElements.define('game-battlefield', GameBattlefield);
