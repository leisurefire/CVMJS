"use strict";
var _a;
import { i18n } from "./i18n/index.js";
import { FoodDetails, getFoodDetails } from "./Foods.js";
import { level } from "./Level.js";
// 从Core.js导入必要的组件
import { GameReadyPage, GEH, MaterialButton, MaterialCard, MaterialIconButton, MaterialNavigationBar, MaterialRangeInput, MaterialSwitch, ToastBox, WarnMessageBox } from "./Core.js";
// ---- Small LRU Cache for images ----
class LruCache {
    max;
    map = new Map();
    constructor(max) {
        this.max = max;
    }
    get(key) {
        const v = this.map.get(key);
        if (v !== undefined) {
            this.map.delete(key);
            this.map.set(key, v);
        }
        return v;
    }
    set(key, val) {
        if (this.map.has(key))
            this.map.delete(key);
        this.map.set(key, val);
        if (this.map.size > this.max) {
            const it = this.map.keys().next();
            if (!it.done) {
                this.map.delete(it.value);
            }
        }
    }
    has(key) { return this.map.has(key); }
}
document.ondragstart = function () {
    return false;
};
document.oncontextmenu = function () {
    return false; //做了右键可以放回，需要屏蔽默认右键菜单
};
const levels = new Map([
    [0, "CookieIsland"],
    [1, "SaladIsland"],
    [2, "SaladIslandWater"],
    [3, "MousseIsland"],
    [4, "ChampagneIsland"],
    [5, "ChampagneIslandWater"],
    [6, "Temple"],
    [7, "PuddingIslandDay"],
    [8, "PuddingIslandNight"],
    [9, "CocoaIslandDay"],
    [10, "CocoaIslandNight"],
    [11, "CurryIslandDay"],
    [12, "CurryIslandNight"],
    [13, "Abyss"],
    [20, "MarshmallowSky"],
    [99, "Rouge"],
]);
const DataBase = "CVMJSDataBase";
const levelDetailsCache = new Map();
export const getLevelDetails = async (type) => {
    try {
        if (!levelDetailsCache.has(type)) {
            // noinspection TypeScriptCheckImport
            const p = import(`./level/${levels.get(type)}.js`).then(m => m.default);
            levelDetailsCache.set(type, p);
        }
        return await levelDetailsCache.get(type);
    }
    catch (error) {
        ToastBox(`${error}`);
    }
};
// 受限音效节流：每个 origin 分音效名限流
const restrictedAudioPlaybackTime = new WeakMap();
const restrictedAudio = new Set(['ken']); // 老鼠啃食更新是100ms，一只老鼠放两次很吵
let audioCtx = null;
const effectBuffers = new Map();
async function playSfxWebAudio(name, volume = 1) {
    try {
        // @ts-ignore
        audioCtx ??= new window.AudioContext();
        let buf = effectBuffers.get(name);
        if (!buf) {
            const res = await fetch(`../../static/audio/${name}.mp3`);
            const arr = await res.arrayBuffer();
            buf = await audioCtx.decodeAudioData(arr);
            effectBuffers.set(name, buf);
        }
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        src.buffer = buf;
        src.connect(gain).connect(audioCtx.destination);
        src.start();
    }
    catch (e) {
        // fallback 在外层继续
    }
}
const gameMusic = new Map([
    [0, "chengzhen"], //城镇
    [1, "zhandou_day_1"], //美味岛日先锋
    [2, "zhandou_night_1"], //美味岛夜先锋
    [3, "zhandou_day_forward_1"], //美味岛日精英
    [4, null], //美味岛夜精英
    [5, "shendian"], //美味岛核心关卡先锋
    [6, null], //美味岛核心关卡先锋
    [7, "boss_day_1"], //美味岛日Boss
    [8, null], //美味岛夜Boss
    [9, "zhandou_day_2"],
    [17, "zhandou_day_3"], //浮空岛日先锋
    [99, "zhandou_day_4"],
]);
const effectCanvas = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(100, 100) : document.createElement('canvas');
const ctx = effectCanvas.getContext('2d', { willReadFrequently: true });
// IndexedDB 版本控制，资源升级时可选择清空缓存
const DB_VERSION = 2;
const DB_STORE = 'ImageBuffer';
const idle = (cb) => window.requestIdleCallback ? window.requestIdleCallback(cb) : setTimeout(cb, 0);
class EventHandler {
    static icons = new Map([
        ["about", undefined],
        ["update", undefined],
        ["anchor", undefined],
        ["category", undefined],
        ["cooltime", undefined],
        ["day", undefined],
        ["energy", undefined],
        ["flag", undefined],
        ['home', undefined],
        ['compose', undefined],
        ['store', undefined],
        ["night", undefined],
        ["reward", undefined],
        ["tier", undefined],
        ["type", undefined],
        ["waterline", undefined],
        ["settings", undefined],
        ["achievement", undefined],
        ["info", undefined],
        ['unselect', undefined],
        ['close', undefined],
        ['rouge', undefined],
    ]);
    static mobile = false;
    static backgroundMusic;
    static instance;
    static #images = new LruCache(400);
    scale = 1; //网页缩放比例
    effectVolume = 1; //音效音量大小
    musicVolume = 1; //音乐音量大小
    speed = 1;
    GameEnd = false;
    composeAnimTimer = null;
    #resizeRaf = null;
    #tickRaf = null;
    #state = "town";
    #stateSet = ["town", "start", "compose", "store", "rouge", "battle"];
    #maxCardNum = 9; //最大卡片数量
    #archive = {};
    #config = {};
    #coin = 0;
    #cards = []; //卡片数组
    #cardBag = [];
    #StoreItems = [];
    #sunAutoCollect = false;
    #cardDetails = document.createElement("div");
    #debug = false;
    // 静态t方法已移除，请使用i18n.t()代替
    constructor() {
        if (!_a.instance) {
            _a.instance = this;
        }
        else {
            ToastBox("Try to create a new instance of a class that runs in singleton mode.");
            return _a.instance;
        }
        if (/Android|HarmonyOS|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            _a.mobile = true;
        }
        this.#loadIcons();
        this.#loadI18n();
        window.addEventListener('load', async () => {
            await this.#iconsLoaded;
            await this.#i18nLoaded;
            this.#getArchive();
            this.#setStoreItems();
            this.#resize();
            this.#startTick();
            // 空闲时对卡片图像做轻量预热
            idle(() => {
                try {
                    const n = Math.min(this.cardBag.length, 12);
                    for (let i = 0; i < n; i++) {
                        const imgSrc = this.cardBag[i].src;
                        if (imgSrc)
                            this.requestImageCache(imgSrc);
                    }
                }
                catch { }
            });
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = "none";
            }
            this.#cardDetails.className = "description";
            document.addEventListener('levelComplete', (event) => {
                const { NAME, REWARDS } = event.detail.level.constructor;
                this.#addCoins(REWARDS);
                ToastBox(`${i18n.t("NAME")}挑战完成，你获得了 ${i18n.t("REWARDS")} 金币！`);
            });
            // @ts-ignore
            this.coinBar = document.getElementById("coinBar");
            const town = document.getElementById('town');
            const cBag = document.getElementById('CBag');
            if (town) {
                const NavigationBar = new MaterialNavigationBar();
                NavigationBar.id = "";
                NavigationBar.addItem("开始", _a.icons.get('home'), () => {
                    this.#GameStateSwitch('start');
                });
                NavigationBar.addItem("情报", _a.icons.get('compose'), () => {
                    this.#GameStateSwitch('compose');
                });
                // NavigationBar.addItem("商店",
                //     EventHandler.icons.get('store'),
                //     () => {
                //         this.#GameStateSwitch('store');
                //     });
                // NavigationBar.addItem("变幻",
                //     EventHandler.icons.get('rouge'),
                //     () => {
                //         this.#GameStateSwitch('rouge');
                //     });
                const Settings = new MaterialIconButton(_a.icons.get('settings'), () => {
                    SettingPage.show();
                });
                Settings.id = "settings";
                const Information = new MaterialIconButton(_a.icons.get('info'), () => {
                    InformationPage.show();
                });
                Information.id = "info";
                // @ts-ignore
                // @ts-ignore
                const InformationPage = new MaterialCard(`<p class="section">${_a.icons.get("about")}${i18n.t("ABOUT_INFO")}</p>
                    <p>${_a.icons.get("update")}${i18n.t("UPDATE_ANNOUNCEMENT")}</p>`, `svg {
                        position: relative;
                        display: block;
                        margin-bottom: 0.25rem;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 50%;
                        background-color: var(--background);
                    }`);
                const Achievement = new MaterialIconButton(_a.icons.get('achievement'), () => {
                    ToastBox("尚未完成的功能。");
                });
                Achievement.id = "achievement";
                InformationPage.id = "information";
                const SettingPage = new MaterialCard();
                SettingPage.id = "settings";
                const createNewLabel = (item, text, isSection = false) => {
                    const label = document.createElement('label');
                    const span = document.createElement('span');
                    if (isSection)
                        label.className = "section";
                    span.textContent = text;
                    label.append(...[span, item]);
                    SettingPage.appendChild(label);
                    return item;
                };
                const FullCards = createNewLabel(new MaterialSwitch(() => {
                    FullCards.disabled = true;
                    if (cBag) {
                        cBag.innerText = '';
                    }
                    GEH.cardBag.length = 0;
                    for (let i = 0; i < 45; i++) {
                        GEH.cardBag.push(new BackpackCard(i, 9, 0));
                    }
                }), "全卡体验", true);
                createNewLabel(new MaterialRangeInput((value) => {
                    this.musicVolume = value;
                    // @ts-ignore
                    this.#config.musicVolume = Math.floor(value * 100);
                    _a.backgroundMusic.volume = value;
                    this.#saveConfig();
                }, this.musicVolume * 100), `${i18n.t("MUSIC")}`);
                createNewLabel(new MaterialRangeInput((value) => {
                    this.effectVolume = value;
                    // @ts-ignore
                    this.#config.effectVolume = Math.floor(value * 100);
                    this.requestPlayAudio('dida');
                    this.#saveConfig();
                }, this.effectVolume * 100), `${i18n.t("AUDIO_EFFECT")}`);
                createNewLabel(new MaterialSwitch((value) => {
                    this.#sunAutoCollect = value;
                    // @ts-ignore
                    this.#config.sunAutoCollect = value;
                    this.#saveConfig();
                }, this.sunAutoCollect), `${i18n.t("SUN_AUTO_COLLECT")}`);
                createNewLabel(new MaterialSwitch((value) => {
                    this.speed = (value ? 1 : 0) + 1;
                }, false), `两倍速（风驰电掣）`);
                town.append(...[NavigationBar, GameReadyPage, Settings, Information, InformationPage, Achievement,
                    SettingPage]);
            }
            _a.backgroundMusic = new Audio("../../static/audio/chengzhen.mp3");
            _a.backgroundMusic.loop = true;
            _a.backgroundMusic.volume = this.musicVolume;
            const startPlayPromise = _a.backgroundMusic.play();
            if (startPlayPromise !== undefined) {
                startPlayPromise.catch((error) => {
                    if (error.name === "NotAllowedError") {
                        WarnMessageBox({
                            Title: "健康游戏忠告",
                            Text: "抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。" +
                                "适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。",
                            ButtonLabelYes: "好",
                            ButtonFuncYes: () => {
                                _a.backgroundMusic.play();
                            },
                        });
                    }
                });
            }
            const flip = document.getElementById('MeiWeiFlip');
            if (flip) {
                for (let i = 0; i < 14; i++) {
                    getLevelDetails(i).then((detail) => {
                        if (detail) {
                            const button = new MaterialButton(detail.NAME, () => {
                                GameReadyPage.initialize(i);
                            }, false);
                            flip.appendChild(button);
                        }
                    });
                }
                getLevelDetails(20).then((detail) => {
                    if (detail) {
                        const button = new MaterialButton(detail.NAME, () => {
                            GameReadyPage.initialize(20);
                        }, false);
                        flip.appendChild(button);
                    }
                });
                getLevelDetails(99).then((detail) => {
                    if (detail) {
                        const button = new MaterialButton(detail.NAME, () => {
                            GameReadyPage.initialize(99);
                        }, false);
                        flip.appendChild(button);
                    }
                });
            }
            else {
                ToastBox(`发生核心错误`);
            }
            if (cBag) {
                if (window.location.hostname === "127.0.0.1"
                    || window.location.hostname === "localhost") {
                    cBag.innerText = '';
                    this.#debug = true;
                    this.cardBag.length = 0;
                    for (let i = 0; i < 45; i++) {
                        this.cardBag.push(new BackpackCard(i, 12, 0));
                    }
                }
            }
        });
        window.addEventListener('resize', this.#onResize);
    }
    get state() {
        return this.#state;
    }
    set state(state) {
        if (this.#stateSet.includes(state)) {
            this.#state = state;
        }
        else {
            throw `Unrecognized state:${state}`;
        }
    }
    get maxCardNum() {
        return this.#maxCardNum;
    }
    get cards() {
        return this.#cards || [];
    }
    get cardBag() {
        return this.#cardBag;
    }
    get sunAutoCollect() {
        return this.#sunAutoCollect;
    }
    get inCompose() {
        return this.#state === "compose";
    }
    get debug() {
        return this.#debug;
    }
    #iconsLoaded = undefined;
    #i18nLoaded = undefined;
    #loadIcons() {
        this.#iconsLoaded = Promise.all(Array.from(_a.icons.keys()).map(key => fetch(`../../static/images/interface/icons/${key}.svg`)
            .then(res => res.text())
            .then(text => _a.icons.set(key, text))
            .catch(err => console.error(`Failed to load icon ${key}:`, err)))).then(() => { });
    }
    #loadI18n() {
        // i18n现在由i18n模块处理，这里不需要单独加载
        this.#i18nLoaded = i18n.getLoadPromise();
    }
    // }
    get town() {
        return {
            compose: document.getElementById("compose"),
            store: document.getElementById("store"),
            CBag: document.getElementById("CBag"),
            coinBar: document.getElementById("coinBar"),
            rouge: document.getElementById("rouge-like"),
        };
    }
    ;
    static getPositionX = (x) => {
        return (x - level.column_start) / level.row_gap;
    };
    static getPositionY = (y) => {
        return (y - level.row_start) / level.column_gap;
    };
    requestPlayAudio(name, origin = null) {
        try {
            if (origin === null && restrictedAudio.has(name))
                return;
            const now = Date.now();
            if (origin !== null) {
                let perOrigin = restrictedAudioPlaybackTime.get(origin);
                if (!perOrigin) {
                    perOrigin = new Map();
                    restrictedAudioPlaybackTime.set(origin, perOrigin);
                }
                const last = perOrigin.get(name) || 0;
                const limit = this.#config?.audioLimitMs ?? 1000;
                if (now - last < limit && restrictedAudio.has(name))
                    return;
                perOrigin.set(name, now);
            }
            // 优先 WebAudio 播放短音效
            const webAudioEnabled = (this.#config?.webAudio ?? true);
            if (webAudioEnabled && window.AudioContext) {
                playSfxWebAudio(name, this.effectVolume);
            }
        }
        catch (error) {
            ToastBox(`Cannot play this audio: ${error}`);
        }
    }
    requestBackMusicChange(type) {
        const music = gameMusic.get(type);
        if (music) {
            try {
                _a.backgroundMusic.src = `../../static/audio/${music}.mp3`;
                _a.backgroundMusic.play();
                return true;
            }
            catch (error) {
                ToastBox(`Cannot play this audio: ${error}`);
                return false;
            }
        }
        else {
            ToastBox(`Cannot find that resource.`);
            return false;
        }
    }
    requestDrawImage(src, effect = null, intensity = null) {
        const effectKey = effect !== null ? `${src}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` : src;
        if (_a.#images.has(effectKey)) {
            return _a.#images.get(effectKey);
        }
        else {
            this.requestImageCache(src, effect, intensity);
            return null;
        }
    }
    requestImageCache(src, effect = null, intensity = null) {
        return new Promise(async (resolve, reject) => {
            if (_a.#images.has(src)) {
                const bitmap = _a.#images.get(src);
                if (bitmap instanceof ImageBitmap) {
                    resolve(this.#requestApplyEffect(bitmap, effect, intensity, src));
                    return;
                }
                else {
                    ToastBox(`Data corrupted.`);
                    reject(new Error('Data corrupted.'));
                    return;
                }
            }
            const request = indexedDB.open(DataBase, DB_VERSION);
            const storeName = DB_STORE;
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (db.objectStoreNames.contains(storeName)) {
                    db.deleteObjectStore(storeName);
                }
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                store.createIndex('w', 'w', { unique: false });
                store.createIndex('h', 'h', { unique: false });
            };
            request.onsuccess = async (event) => {
                const db = event.target.result;
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(src);
                getRequest.onsuccess = async (event) => {
                    const result = event.target.result;
                    if (result) {
                        try {
                            const blob = result.image;
                            const bitmap = await createImageBitmap(blob);
                            _a.#images.set(src, bitmap);
                            resolve(this.#requestApplyEffect(bitmap, effect, intensity, src));
                        }
                        catch (error) {
                            ToastBox(`Image processing error: ${error}`);
                            reject(error);
                        }
                    }
                    else {
                        this.#fetchAndCacheImage(src, effect, intensity, db, storeName, resolve, reject);
                    }
                };
                getRequest.onerror = (event) => {
                    const request = event.target;
                    ToastBox(`Database retrieval error: ${request.error}`);
                    reject(request.error);
                };
            };
            request.onerror = (event) => {
                const request = event.target;
                ToastBox(`Database open error: ${request.error}`);
                reject(request.error);
            };
        });
    }
    async #fetchAndCacheImage(src, effect, intensity, db, storeName, resolve, reject) {
        const img = new Image();
        img.src = src;
        img.onload = async () => {
            try {
                const bitmap = await createImageBitmap(img);
                _a.#images.set(src, bitmap);
                // Ensure the bitmap has finished processing before accessing its properties
                await new Promise((resolve) => setTimeout(resolve, 0));
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const context = canvas.getContext('2d');
                if (context) {
                    context.drawImage(bitmap, 0, 0);
                }
                // Wrap the canvas.toBlob call in a promise to use with await
                const blob = await new Promise((resolveBlob) => canvas.toBlob(resolveBlob));
                if (!blob) {
                    throw new Error('Blob creation failed.');
                }
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                store.put({ id: src, image: blob, w: bitmap.width, h: bitmap.height });
                // Wait for the transaction to complete or fail
                transaction.oncomplete = () => {
                    resolve(this.#requestApplyEffect(bitmap, effect, intensity, src));
                };
                transaction.onerror = (event) => {
                    const request = event.target;
                    ToastBox(`Transaction error: ${request.error}`);
                    reject(request.error);
                };
            }
            catch (error) {
                ToastBox(`Image loading or processing error: ${error}`);
                reject(error);
            }
        };
        img.onerror = (error) => {
            ToastBox(`Image load error: ${error}`);
            reject(new Error('Image load error.'));
        };
    }
    async #requestApplyEffect(img, effect, intensity, src) {
        const effectKey = effect !== null ? `${src}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` : src;
        if (_a.#images.has(effectKey)) {
            return _a.#images.get(effectKey);
        }
        effectCanvas.width = img.width;
        effectCanvas.height = img.height;
        if (ctx) {
            ctx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
            switch (effect) {
                case "damaged":
                    this.#applyDamagedEffect(ctx, img);
                    break;
                case "freezing":
                    this.#applyFreezingEffect(ctx, img);
                    break;
                case "opacity":
                    this.#applyOpacityEffect(ctx, img, intensity);
                    break;
                case "mirror":
                    this.#applyMirrorEffect(ctx, img);
                    break;
                default:
                    ctx.drawImage(img, 0, 0);
                    break;
            }
        }
        const effectImg = await createImageBitmap(effectCanvas);
        _a.#images.set(effectKey, effectImg);
        return effectImg;
    }
    #applyDamagedEffect(ctx, img) {
        if (!!ctx.filter) {
            ctx.filter = "brightness(125%)";
            ctx.drawImage(img, 0, 0);
        }
        else {
            ctx.drawImage(img, 0, 0);
            const drawable = ctx.getImageData(0, 0, img.width, img.height);
            const pixelData = drawable.data;
            for (let i = 0; i < pixelData.length; i += 4) {
                pixelData[i] = (pixelData[i] >> 2) + pixelData[i];
                pixelData[i + 1] = (pixelData[i + 1] >> 2) + pixelData[i + 1];
                pixelData[i + 2] = (pixelData[i + 2] >> 2) + pixelData[i + 2];
            }
            ctx.putImageData(drawable, 0, 0);
        }
    }
    #applyFreezingEffect(ctx, img) {
        ctx.drawImage(img, 0, 0);
        const drawable = ctx.getImageData(0, 0, img.width, img.height);
        const pixelData = drawable.data;
        for (let i = 0; i < pixelData.length; i += 4) {
            pixelData[i] = pixelData[i] >> 1;
            pixelData[i + 1] = pixelData[i + 1] >> 1;
        }
        ctx.putImageData(drawable, 0, 0);
    }
    #applyOpacityEffect(ctx, img, intensity) {
        ctx.globalAlpha = intensity || 0.5;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1.0; // Reset alpha to default for subsequent drawings
    }
    #applyMirrorEffect(ctx, img) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -img.width, 0);
        ctx.restore();
    }
    requestCardDetailDisplay(origin, type, star, skillLevel) {
        document.body.appendChild(this.#cardDetails);
        this.#cardDetails.style.left = origin.x + "px";
        this.#cardDetails.style.top = origin.y + "px";
        const detail = getFoodDetails(type);
        if (detail) {
            this.#cardDetails.innerHTML = `<h1>${detail.cName}</h1>`;
            this.#cardDetails.innerHTML += `<div>`
                + `<a>${_a.icons.get("type")}${detail.category}</a>`
                + `<a>${_a.icons.get("energy")}${detail.cost + ((detail.addCost) ? "+" : "")}</a>`
                + `<a>${_a.icons.get("cooltime")}${detail.coolTime / 1000}${i18n.t("SECOND")}</a>`
                + `<a>${_a.icons.get("tier")}${star}</a>`
                + `</div>`;
            if (detail.special != null) {
                this.#cardDetails.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_007")}</span><span>${detail.special}</span></li>`;
            }
            this.#cardDetails.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_008")}</span><span style='color: #006400'>${detail.description}</span></li>`;
            this.#cardDetails.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_009")}</span><span style='color: #ff7f50'>${detail.upgrade}</span></li>`;
        }
        return this.#cardDetails;
    }
    #onResize = () => {
        if (this.#resizeRaf != null)
            cancelAnimationFrame(this.#resizeRaf);
        this.#resizeRaf = requestAnimationFrame(this.#resize);
    };
    #resize = () => {
        this.scale = document.documentElement.clientHeight / 600; //提供缩放比例参数
        if (level?.Battlefield) {
            const ctxBG = level.Battlefield.ctxBG;
            if (ctxBG) {
                ctxBG.setTransform(1, 0, 0, 1, 0, 0);
                ctxBG.scale(this.scale, this.scale);
            }
            const ctxFG = level.Battlefield.ctxFG;
            if (ctxFG) {
                ctxFG.setTransform(1, 0, 0, 1, 0, 0);
                ctxFG.scale(this.scale, this.scale);
            }
            level.Battlefield.SunBar.style.left = `${140 * this.scale}px`;
            level.Battlefield.Shovel.style.left = `${140 * this.scale + 136}px`;
            level.Battlefield.Cards.style.transform = `scale(${this.scale})`;
        }
    };
    // 统一 Tick：减少分散样式写入
    #startTick() {
        const tick = () => {
            try {
                for (const bc of this.#cards) {
                    if (bc && bc.card && typeof bc.card.cooldownProcess === 'function') {
                        bc.card.cooldownProcess();
                    }
                }
            }
            catch { }
            this.#tickRaf = requestAnimationFrame(tick);
        };
        if (this.#tickRaf != null)
            cancelAnimationFrame(this.#tickRaf);
        this.#tickRaf = requestAnimationFrame(tick);
    }
    #getArchive() {
        const archive = localStorage.getItem("CVMJSArchive");
        if (archive) {
            this.#archive = JSON.parse(archive);
            if (this.#archive) {
                this.#coin = this.#archive.coin;
                this.#StoreItems = this.#archive.storeItems || null;
                for (const cardBagElement of this.#archive.cardBag) {
                    this.cardBag.push(new BackpackCard(cardBagElement.type, cardBagElement.star, cardBagElement.skillLevel));
                }
            }
        }
        else {
            this.#archive = {
                coin: 0,
                cardBag: [
                    { type: 0, star: 0, skillLevel: 0 },
                    { type: 1, star: 0, skillLevel: 0 },
                    { type: 2, star: 0, skillLevel: 0 },
                    { type: 3, star: 0, skillLevel: 0 },
                ],
                mouseDeath: [],
                foodPlant: [],
                mapVictory: [],
                festival: [],
                character: {},
            };
            localStorage.setItem("CVMJSArchive", JSON.stringify(this.#archive));
        }
        const coinBar = document.getElementById("coinBar");
        if (coinBar) {
            coinBar.innerText = this.#coin.toString();
        }
        const config = localStorage.getItem("CVMJSConfig");
        if (config) {
            this.#config = JSON.parse(config);
            if (typeof this.#config.webAudio === 'undefined')
                this.#config.webAudio = true;
            if (typeof this.#config.audioLimitMs === 'undefined')
                this.#config.audioLimitMs = 1000;
        }
        else {
            this.#config = {
                sunAutoCollect: false,
                musicVolume: 80,
                effectVolume: 80,
                webAudio: true,
                audioLimitMs: 1000,
            };
        }
        this.#sunAutoCollect = this.#config.sunAutoCollect;
        this.musicVolume = this.#config.musicVolume / 100;
        this.effectVolume = this.#config.effectVolume / 100;
        this.#saveConfig();
    }
    #addCoins(num) {
        if (num >= 0) {
            this.#coin = this.#coin + num;
            const coinBar = document.getElementById('coinBar');
            if (coinBar) {
                coinBar.innerHTML = this.#coin + "G";
            }
            this.#archive.coin = this.#coin;
            this.#saveArchive();
            return true;
        }
        else {
            return false;
        }
    }
    #costCoins(num) {
        if (num >= 0 && this.#coin - num >= 0) {
            this.#coin = this.#coin - num;
            const coinBar = document.getElementById('coinBar');
            if (coinBar) {
                coinBar.innerHTML = this.#coin + "G";
            }
            this.#archive.coin = this.#coin;
            this.#saveArchive();
            return true;
        }
        else {
            return false;
        }
    }
    #setStoreItems() {
        this.#addStoreItem();
    }
    #summonStoreItem() {
        let entry = Math.floor(Math.random() * (FoodDetails.size + 1));
        const foodDetails = getFoodDetails(entry);
        if (foodDetails) {
            let rarity = foodDetails.rarity;
            if (this.cardBag.some(value => value.type === entry)) {
                rarity--;
            }
            const maxRetries = 5;
            let attempt = 0;
            while (attempt < maxRetries) {
                const temp = Math.random();
                if (temp <= 0.32) {
                    entry = this.#summonStoreItem();
                }
                else {
                    break;
                }
                attempt++;
            }
            return entry;
        }
        throw "Cannot Proceed";
    }
    #purchaseItem(item, entry, pos) {
        if (this.#costCoins(item.price || 900)) {
            const outcome = this.cardBag.findIndex((value) => {
                return value.type === entry;
            });
            if (outcome === -1) {
                this.#addCard(entry, 0);
            }
            else {
                this.cardBag[outcome].star++;
            }
            const storeBox = document.getElementById('storeBox');
            if (storeBox) {
                storeBox.innerHTML = "";
                const row = Math.floor(pos / 3);
                const col = pos % 3;
                for (let i = 0; i < 3; i++) {
                    this.#StoreItems[row * 3 + i] = this.#setNewItem(row * 3 + i);
                    if (i === row) {
                        continue;
                    }
                    this.#StoreItems[i * 3 + col] = this.#setNewItem(i * 3 + col);
                }
                const frag = document.createDocumentFragment();
                for (let i = 0; i < 9; i++) {
                    frag.appendChild(this.#StoreItems[i].entity);
                }
                storeBox.appendChild(frag);
            }
            else {
                ToastBox(`Page not loaded properly`);
            }
        }
        else {
            WarnMessageBox({
                Text: `${i18n.t("NOT_ENOUGH_COIN")}`,
                ButtonLabelYes: `${i18n.t("OK")}`,
            });
        }
    }
    #setNewItem(pos) {
        const entry = this.#summonStoreItem();
        const item = new StoreItem(entry);
        this.#StoreItems[pos] = item;
        item.entity.onclick = () => {
            this.requestPlayAudio("dida");
            const box = document.createElement("div");
            const div = document.createElement("div");
            const h2 = document.createElement("h2");
            const img = document.createElement('img');
            const p = document.createElement("p");
            const button = new MaterialButton(`${i18n.t("OK")}`, () => {
                this.#purchaseItem(item, entry, pos);
            }, false);
            box.className = "store_purchase";
            document.body.appendChild(box);
            img.src = item.item_img.src;
            h2.innerHTML = `${i18n.t("PURCHASE")} <span style='font-weight: 600'>` + item.detail.cName + '</span>';
            p.innerText = `${(item.price || 900)}`;
            box.appendChild(div);
            div.appendChild(h2);
            div.appendChild(img);
            div.appendChild(p);
            div.appendChild(button);
            box.addEventListener('click', () => {
                div.style.animation = "purchaseRemove 0.12s cubic-bezier(0.4, 0, 0.2, 1)";
                div.addEventListener("animationend", () => {
                    box.remove();
                });
            });
        };
        return item;
    }
    #addStoreItem() {
        if (this.#StoreItems === null) {
            this.#StoreItems = [];
            for (let i = 0; i < 9; i++) {
                this.#setNewItem(i);
            }
        }
        return true;
    }
    #addCard(type, star = 0) {
        if (this.#archive.cardBag.some((card) => {
            return card.type === type;
        })) {
            return false;
        }
        else {
            this.#archive.cardBag.push({
                star: star,
                type: type,
                skillLevel: 0,
            });
            this.#cardBag.push(new BackpackCard(type, star, 0));
            this.#saveArchive();
            return true;
        }
    }
    #saveArchive() {
        // if (this.#username) {
        //     this.#cloudSave();
        // }
        localStorage.setItem("CVMJSArchive", JSON.stringify(this.#archive));
        return true;
    }
    #saveConfig() {
        localStorage.setItem("CVMJSConfig", JSON.stringify(this.#config));
    }
    #GameStateSwitch(des) {
        this.state = des;
        if (this.town.compose && this.town.store && this.town.rouge && this.town.coinBar && this.town.CBag) {
            this.town.compose.style.display = "none";
            this.town.store.style.display = "none";
            this.town.rouge.style.display = "none";
            switch (des) {
                case "start": {
                    this.town.coinBar.style.display = "none";
                    for (let i in this.cardBag) {
                        this.town.CBag.appendChild(this.cardBag[i].entity);
                    }
                    if (this.composeAnimTimer != null) {
                        try {
                            cancelAnimationFrame(this.composeAnimTimer);
                        }
                        catch { }
                        try {
                            clearInterval(this.composeAnimTimer);
                        }
                        catch { }
                    }
                    break;
                }
                case "compose": {
                    this.town.compose.style.display = "block";
                    this.town.coinBar.style.display = "none";
                    for (let i in this.cardBag) {
                        this.town.CBag.appendChild(this.cardBag[i].entity);
                    }
                    this.cardBag[0].entity.click();
                    break;
                }
                case "store": {
                    this.town.store.style.display = "block";
                    this.town.coinBar.style.display = "block";
                    if (this.composeAnimTimer != null) {
                        try {
                            cancelAnimationFrame(this.composeAnimTimer);
                        }
                        catch { }
                        try {
                            clearInterval(this.composeAnimTimer);
                        }
                        catch { }
                    }
                    break;
                }
                case "rouge": {
                    this.town.rouge.style.display = "block";
                    this.town.coinBar.style.display = "none";
                    if (this.composeAnimTimer != null) {
                        try {
                            cancelAnimationFrame(this.composeAnimTimer);
                        }
                        catch { }
                        try {
                            clearInterval(this.composeAnimTimer);
                        }
                        catch { }
                    }
                }
            }
        }
    }
    // 资源与事件清理
    destroy() {
        try {
            if (this.#tickRaf != null)
                cancelAnimationFrame(this.#tickRaf);
            if (this.composeAnimTimer != null) {
                try {
                    cancelAnimationFrame(this.composeAnimTimer);
                }
                catch { }
                try {
                    clearInterval(this.composeAnimTimer);
                }
                catch { }
                this.composeAnimTimer = null;
            }
            if (this.#resizeRaf != null)
                cancelAnimationFrame(this.#resizeRaf);
            window.removeEventListener('resize', this.#onResize);
        }
        catch { }
    }
}
_a = EventHandler;
export default EventHandler;
class StoreItem {
    entity = document.createElement("div");
    item_img = document.createElement("img");
    item_text = document.createElement("p");
    price;
    detail;
    constructor(type) {
        this.detail = getFoodDetails(type);
        this.price = this.detail.price || 900;
        this.item_img.src = "../../static/images/cards/" + this.detail.name + ".png";
        this.item_text.innerText = this.price.toString();
        this.entity.appendChild(this.item_img);
        this.entity.appendChild(this.item_text);
        const storeBox = document.getElementById('storeBox');
        if (storeBox) {
            storeBox.appendChild(this.entity);
            this.entity.onmouseenter = () => {
                this.item_img.style.boxShadow = "white 0 0 0 4px";
                let box_x = document.createElement('div');
                let box_y = document.createElement('div');
                box_x.id = 'storeItemBoxX';
                box_y.id = 'storeItemBoxY';
                box_x.style.top = (this.entity.offsetTop - 6) + "px";
                box_x.style.left = (this.entity.offsetLeft) + "px";
                box_x.style.height = (this.entity.offsetHeight) + "px";
                box_x.style.opacity = '0';
                box_y.style.width = (this.entity.offsetWidth - 14) + "px";
                box_y.style.top = (this.entity.offsetTop - 6) + "px";
                box_y.style.left = (this.entity.offsetLeft) + "px";
                box_y.style.opacity = '0';
                storeBox.appendChild(box_x);
                storeBox.appendChild(box_y);
                setTimeout(() => {
                    box_x.style.left = "24px";
                    box_y.style.top = '18px';
                    box_x.style.width = 'calc(100% - 64px)';
                    box_y.style.height = 'calc(100% - 48px)';
                    box_x.style.opacity = "1";
                    box_y.style.opacity = "1";
                    box_x.style.filter = "blur(0)";
                    box_y.style.filter = "blur(0)";
                }, 100);
            };
            this.entity.onmouseleave = () => {
                let box_x = document.getElementById('storeItemBoxX');
                if (box_x)
                    box_x.remove();
                let box_y = document.getElementById('storeItemBoxY');
                if (box_y)
                    box_y.remove();
                this.item_img.style.boxShadow = "transparent 0 0 0 2px";
            };
        }
    }
}
export class Card extends HTMLElement {
    speed = 1;
    name;
    coolTime = 7500;
    star = 0;
    skillLevel = 0;
    cost = 50;
    #type = 0;
    #remainTime = 0;
    #entity = new Image();
    #details = document.createElement('div');
    #overlay = document.createElement('div');
    #style = document.createElement('style');
    #cost = document.createElement('span');
    constructor(type = 0, star = 0, skill_level = 0) {
        super();
        const style = {
            height: "3.5rem",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxShadow: "var(--shadow)",
            position: "relative",
        };
        Object.assign(this.style, style);
        this.type = type;
        this.star = star;
        this.skillLevel = skill_level;
        this.#details.className = "game-card-details";
        this.attachShadow({ mode: "open" });
        this.#style.textContent = `
            :host(.disabled) img{ filter: brightness(50%); }
            :host(.notenough) span{ color: red; }
            img{
                width: 100%;
                height: 100%;
            }
            span{
                position: absolute;
                right: 0.75rem;
                bottom: 0.125rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            div{
                top: 0;
                left: 0;
                position: absolute;
                width: 100%;
                background-color: rgba(0,0,0,.32);
            }
        `;
        if (this.shadowRoot) {
            this.shadowRoot.append(this.#style);
            this.shadowRoot.append(this.#entity);
            this.shadowRoot.append(this.#cost);
            this.shadowRoot.append(this.#overlay);
        }
        this.addEventListener('click', this.handleClick);
        this.addEventListener('mouseenter', this.showDetails);
        this.addEventListener('mouseleave', this.hideDetails);
    }
    get type() {
        return this.#type;
    }
    set type(value) {
        try {
            const detail = getFoodDetails(value);
            if (detail) {
                const { name, coolTime, cost } = detail || {};
                this.name = name;
                this.coolTime = coolTime;
                this.cost = cost;
                this.#cost.textContent = cost.toString();
                this.#entity.src = `../../static/images/cards/${this.name}.png`;
            }
        }
        catch (error) {
            ToastBox(error);
        }
        this.#type = value;
    }
    get cooling() {
        return this.#remainTime > 0;
    }
    get remainTime() {
        return this.#remainTime;
    }
    set remainTime(value) {
        if (GEH.debug) {
            this.#remainTime = 0;
        }
        else {
            value = Math.max(value, 0);
            const percent = this.coolTime > 0 ? (value / this.coolTime * 100) : 0;
            if (percent <= 5) {
                this.#overlay.style.height = `0`;
            }
            else {
                this.#overlay.style.height = `${percent}%`;
            }
            this.#remainTime = value;
        }
    }
    get detailsHTML() {
        const detail = getFoodDetails(this.type);
        if (detail) {
            let text = "";
            if (level.SunNum >= this.cost) {
                if (this.cooling) {
                    text += `<span>${i18n.t("GAME_ERROR_CODE_006")}</span>`;
                }
            }
            else {
                text += `<span>${i18n.t("GAME_ERROR_CODE_005")}</span>`;
            }
            text += `<strong>${detail.cName}</strong><br>${detail.description}`;
            if (detail.addCost && this.cost - detail.cost > 0) {
                text += `<br><span>${i18n.t("GAME_ERROR_CODE_007")}(${this.cost - detail.cost})</font>`;
            }
            return text;
        }
    }
    showDetails = () => {
        const rect = this.getBoundingClientRect();
        this.#details.style.left = `calc(${rect.x + rect.width}px + 1rem)`;
        this.#details.style.top = `calc(${rect.y + rect.height / 2}px)`;
        this.#details.style.zIndex = `11111`;
        this.#details.innerHTML = this.detailsHTML || "";
        level.Battlefield.appendChild(this.#details);
    };
    hideDetails = () => {
        this.#details.remove();
    };
    handleClick = (ev) => {
        if (level.Battlefield.Cursor.picked) {
            return false;
        }
        if (level.SunNum < this.cost && !GEH.debug) {
            level.Battlefield.SunBar.style.animation = `NOT_ENOUGH_SUN 0.64s cubic-bezier(0.4, 0, 0.2, 1)`;
            return false;
        }
        if (this.cooling) {
            return false;
        }
        GEH.requestPlayAudio("naka");
        const detail = getFoodDetails(this.type);
        if (detail) {
            const Handler = {
                src: `../../static/images/foods/${this.name}/idle.png`,
                slot: this,
                offset: detail.offset,
                frames: detail.idleLength,
                func: ({ positionX, positionY }) => {
                    if (detail) {
                        return detail.generate(positionX, positionY, this.star, this.skillLevel);
                    }
                    else {
                        return false;
                    }
                },
                successFunc: () => {
                    this.remainTime = this.coolTime;
                },
                failFunc: () => {
                    level.SunNum += this.cost;
                }
            };
            if (!GEH.debug) {
                level.SunNum -= this.cost;
            }
            level.Battlefield.requestCursorTracking(ev, Handler);
        }
    };
    unselect() {
        this.remainTime = this.coolTime;
        this.#details.remove();
    }
    cooldownProcess() {
        const disabled = !GEH.debug && (level.Battlefield.Cursor.picked || level.SunNum < this.cost || this.cooling);
        this.classList.toggle('disabled', !!disabled);
        this.classList.toggle('notenough', !GEH.debug && level.SunNum < this.cost);
        if (this.cooling) {
            this.remainTime -= this.speed * 100;
        }
    }
}
customElements.define('game-card', Card);
class BackpackCard {
    entity = document.createElement('img');
    anim = document.createElement('img');
    type = 0;
    star = 0;
    skillLevel = 0;
    animInside;
    card;
    animID;
    src = `../../static/images/cards/stove.png`;
    details;
    #chosen = false;
    #bagEntity = document.createElement('img');
    #animEntity = document.createElement('img');
    constructor(type = 0, star = 0, skillLevel = 0) {
        this.type = type;
        this.star = star;
        this.skillLevel = skillLevel;
        this.card = new Card(type, star, skillLevel);
        this.src = `../../static/images/cards/${this.card.name}.png`;
        this.entity.src = this.src;
        this.#bagEntity.src = this.src;
        this.anim.src = this.src;
        this.#bagEntity.style.opacity = "0";
        this.anim.style.position = "absolute";
        this.entity.addEventListener('mouseenter', this.HandleMouseEnter);
        this.entity.addEventListener('mouseleave', this.HandleMouseLeave);
        this.entity.addEventListener('click', this.#HandleMouseClick);
        this.#bagEntity.addEventListener("click", this.#HandleMouseClick);
    }
    get detail() {
        return getFoodDetails(this.type);
    }
    get rect() {
        return this.entity.getBoundingClientRect();
    }
    HandleMouseEnter = () => {
        if (GEH.inCompose || this.#chosen)
            return;
        this.details = GEH.requestCardDetailDisplay({
            x: this.rect.left,
            y: this.rect.top + this.rect.height
        }, this.type, this.star, this.skillLevel);
    };
    HandleMouseLeave = () => {
        if (this.details) {
            this.details.remove();
            this.details = undefined;
        }
    };
    unselect() {
        this.#chosen = false;
        this.#bagEntity.style.opacity = "0";
        this.entity.style.filter = "none";
        this.entity.removeAttribute("selected");
        this.anim.remove();
        this.#bagEntity.remove();
        if (this.animID) {
            cancelAnimationFrame(this.animID);
        }
    }
    #ComposeHandleMouseClick() {
        const detail = getFoodDetails(this.type);
        if (detail) {
            const CInfoName = document.getElementById('CInfoName');
            if (CInfoName) {
                CInfoName.innerText = detail.cName;
            }
            const InfoDes = document.getElementById("CInfoDes");
            if (InfoDes) {
                InfoDes.innerHTML = "";
                InfoDes.innerHTML += `<a>${EventHandler.icons.get('type')}${detail.category}</a>`;
                InfoDes.innerHTML += `<a>${EventHandler.icons.get('energy')}${detail.cost + ((detail.addCost) ? "+" : "")}</a>`;
                InfoDes.innerHTML += `<a>${EventHandler.icons.get('cooltime')}${detail.coolTime / 1000}${i18n.t("SECOND")}</a>`;
                InfoDes.innerHTML += `<br>`;
                if (detail.special) {
                    InfoDes.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_007")}</span><span>${detail.special}</span></li>`;
                }
                InfoDes.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_008")}</span><span style='color: #006400'>${detail.description}</span></li>`;
                InfoDes.innerHTML += `<li><span>${i18n.t("GAME_UI_TEXT_009")}</span><span style='color: #ff7f50'>${detail.upgrade}</span></li>`;
                InfoDes.innerHTML += `<li>${detail.story}</li>`;
                if (detail.storyContributor) {
                    InfoDes.innerHTML += "<strong><span style='color: #a9a9a9'>" + `${i18n.t("GAME_UI_TEXT_010")}` + "&ensp;&ensp;" + detail.storyContributor + "</span></strong>";
                }
                if (detail.artist) {
                    InfoDes.innerHTML += "<strong><span style='color: #a9a9a9'>" + `画&ensp;&ensp;&ensp;&ensp;师` + "&ensp;&ensp;" + detail.artist + "</span></strong>";
                }
            }
            const idleLength = detail.idleLength || 12;
            const endLength = detail.endLength || idleLength;
            const CInfoBack = document.getElementById("CInfoBack");
            if (CInfoBack) {
                CInfoBack.style.backgroundImage = "url(../../static/images/interface/compose/" + (detail.type || 0) + ".png)";
                CInfoBack.innerHTML = "";
                if (detail.inside) {
                    this.animInside = document.createElement("img");
                    this.animInside.src = "../../static/images/foods/" + detail.name + "/idle_inside.png";
                    this.animInside.style.position = "absolute";
                    this.animInside.style.left = `${detail?.offset[0] + 115}px`;
                    this.animInside.style.top = `${detail?.offset[1] + 40}px`;
                    CInfoBack.appendChild(this.animInside);
                }
                this.#animEntity.src = "../../static/images/foods/" + detail.name + "/idle.png";
                this.#animEntity.onload = () => {
                    this.#animEntity.style.objectPosition = "0 0";
                    this.#animEntity.style.objectFit = "none";
                    this.#animEntity.style.height = this.#animEntity.height + "px";
                    this.#animEntity.style.width = this.#animEntity.width / idleLength + "px";
                    this.#animEntity.style.left = `${detail?.offset[0] + 115}px`;
                    this.#animEntity.style.top = `${detail?.offset[1] + 40}px`;
                    CInfoBack.appendChild(this.#animEntity);
                };
            }
            let temp = 0;
            if (GEH.composeAnimTimer != null) {
                cancelAnimationFrame(GEH.composeAnimTimer);
                clearInterval(GEH.composeAnimTimer);
            }
            const frameDuration = 100; // ms per frame
            let last = performance.now();
            let acc = 0;
            const step = (now) => {
                const dt = now - last;
                last = now;
                acc += dt;
                while (acc >= frameDuration) {
                    this.#animEntity.style.objectPosition = `${-temp * this.#animEntity.offsetWidth}px 0`;
                    temp = (temp + 1) % endLength;
                    acc -= frameDuration;
                }
                GEH.composeAnimTimer = requestAnimationFrame(step);
            };
            GEH.composeAnimTimer = requestAnimationFrame(step);
        }
    }
    #PrepareGameHandleMouseClick() {
        const GameCards = GameReadyPage.GameCards;
        if (this.#chosen) {
            const pos = GEH.cards.findIndex((card) => {
                return card === this.card;
            });
            GEH.cards.splice(pos, 1);
            this.unselect();
        }
        else {
            if (GEH.cards.length >= GEH.maxCardNum) {
                ToastBox(`最多携带${GEH.maxCardNum}张卡片`);
                return false;
            }
            else {
                GameCards.appendChild(this.#bagEntity);
                const detail = getFoodDetails(this.type);
                if (detail) {
                    this.card.cost = detail.cost;
                }
                GameReadyPage.appendChild(this.anim);
                this.anim.style.zIndex = "11111";
                this.anim.style.position = "fixed";
                this.anim.style.top = this.rect.top + "px";
                this.anim.style.left = this.rect.left + "px";
                this.anim.style.borderRadius = this.#bagEntity.style.borderRadius;
                this.anim.height = this.rect.height;
                let top = this.rect.top;
                let left = this.rect.left;
                let height = 50;
                const rect = this.#bagEntity.getBoundingClientRect();
                const targetTop = rect.top;
                const targetLeft = rect.left;
                const targetHeight = this.#bagEntity.offsetHeight;
                const speed = 16;
                const speedX = (left - targetLeft) / speed;
                const speedY = (top - targetTop) / speed;
                const scaleY = (height - targetHeight) / speed;
                let times = 0;
                const animation = (() => {
                    this.animID = requestAnimationFrame(() => {
                        times++;
                        top -= speedY;
                        left -= speedX;
                        height -= scaleY;
                        this.anim.style.top = top + "px";
                        this.anim.style.left = left + "px";
                        this.anim.style.height = height + "px";
                        if (times >= speed) {
                            if (this.animID) {
                                cancelAnimationFrame(this.animID);
                            }
                            this.anim.remove();
                            this.#bagEntity.style.opacity = "1";
                            return;
                        }
                        animation();
                    });
                });
                animation();
                GEH.cards.push(this.card);
                this.entity.setAttribute("selected", "");
                this.entity.style.filter = "brightness(64%)";
                this.#chosen = true;
            }
        }
    }
    #HandleMouseClick = () => {
        GEH.requestPlayAudio("naka");
        if (this.details)
            this.details.remove();
        if (GEH.inCompose) {
            this.#ComposeHandleMouseClick();
        }
        else {
            this.#PrepareGameHandleMouseClick();
        }
    };
}
