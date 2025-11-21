"use strict";
import { i18n } from "../i18n/index.js";
import { FoodDetails, getFoodDetails } from "../Foods.js";
import { level } from "../Level.js";

// 从Core.js导入必要的组件
import {
    GameReadyPage,
    GEH,
    MaterialButton,
    MaterialCard, MaterialDialog,
    MaterialIconButton,
    MaterialNavigationBar,
    MaterialRangeInput,
    MaterialSwitch,
    ToastBox,
    WarnMessageBox
} from "../Core.js";

// 导入拆分的类
import { StoreItem } from "./StoreItem.js";
import { Card } from "./Card.js";
import { BackpackCard } from "./BackpackCard.js";

// 重新导出Card类供其他模块使用
export { Card } from "./Card.js";

// ---- Types ----
interface IArchiveCard { type: number; star: number; skillLevel: number }
interface IArchive {
    coin: number;
    cardBag: IArchiveCard[];
    mouseDeath: any[];
    foodPlant: any[];
    mapVictory: any[];
    festival: any[];
    character: Record<string, any>;
    storeItems?: any[] | null;
}
interface IConfig { sunAutoCollect: boolean; musicVolume: number; effectVolume: number; webAudio?: boolean; audioLimitMs?: number }

// ---- Small LRU Cache for images ----
class LruCache<K, V> {
    private map = new Map<K, V>();
    constructor(private max: number) { }
    get(key: K): V | undefined {
        const v = this.map.get(key);
        if (v !== undefined) {
            this.map.delete(key);
            this.map.set(key, v);
        }
        return v;
    }
    set(key: K, val: V) {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, val);
        if (this.map.size > this.max) {
            const it = this.map.keys().next();
            if (!it.done) {
                this.map.delete(it.value as K);
            }
        }

    }
    has(key: K) { return this.map.has(key); }
}

document.ondragstart = function () {    //禁止对img的拖拽影响观感
    return false;
}
document.oncontextmenu = function () {
    return false;						//做了右键可以放回，需要屏蔽默认右键菜单
}




export const getLevelDetails = async (type: number) => {
    try {
        if (!EventHandler.levelDetailsCache.has(type)) {
            const levelName = EventHandler.LEVELS.get(type);
            if (!levelName) throw new Error(`Unknown level type: ${type}`);
            // noinspection TypeScriptCheckImport
            const p = import(`../level/${levelName}.js`).then(m => m.default);
            EventHandler.levelDetailsCache.set(type, p);
        }
        return await EventHandler.levelDetailsCache.get(type)!;
    } catch (error) {
        ToastBox(`${error}`);
    }
}




// IndexedDB 版本控制，资源升级时可选择清空缓存



export default class EventHandler {
    // ===== 静态常量 =====
    static readonly LEVELS = new Map([
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

    static readonly GAME_MUSIC = new Map([
        [0, "chengzhen"],
        [1, "zhandou_day_1"],
        [2, "zhandou_night_1"],
        [3, "zhandou_day_forward_1"],
        [4, null],
        [5, "shendian"],
        [6, null],
        [7, "boss_day_1"],
        [8, null],
        [9, "zhandou_day_2"],
        [17, "zhandou_day_3"],
        [99, "zhandou_day_4"],
    ]);

    static readonly RESTRICTED_AUDIO = new Set(['ken', 'jiubeideng']);
    static readonly DATABASE_NAME = "CVMJSDataBase";
    static readonly DB_VERSION = 2;
    static readonly DB_STORE = 'ImageBuffer';

    // 关卡详情缓存
    static #levelDetailsCache = new Map<number, Promise<any>>();
    // 音频相关静态属性
    static #restrictedAudioPlaybackTime: WeakMap<any, Map<string, number>> = new WeakMap();
    static #sunLastPlayTime = 0;
    static #sunPitchOffset = 0;
    static readonly SUN_COMBO_WINDOW = 1000;
    static readonly SUN_PITCH_STEP = 0.1;
    static readonly SUN_MAX_PITCH = 2.0;
    static #audioCtx: AudioContext | null = null;
    static #effectBuffers = new Map<string, AudioBuffer>();

    // Canvas 相关静态属性
    static #effectCanvas: OffscreenCanvas | HTMLCanvasElement = (typeof OffscreenCanvas !== 'undefined')
        ? new OffscreenCanvas(100, 100) as OffscreenCanvas
        : document.createElement('canvas');
    static #ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

    static #getCtx() {
        if (!EventHandler.#ctx) {
            EventHandler.#ctx = (EventHandler.#effectCanvas as any).getContext('2d', { willReadFrequently: true });
        }
        return EventHandler.#ctx;
    }



    private _staticBaseUrl: string = "";

    static icons = new Map<string, any | undefined>([
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
    static mobile: boolean = false;
    static backgroundMusic: HTMLAudioElement;
    protected static instance: EventHandler;
    static #images: LruCache<string, ImageBitmap> = new LruCache(400);
    static #webpFrameCache = new Map<string, ImageBitmap[]>();
    static #spriteSliceCache = new Map<string, ImageBitmap[]>();
    static #webpFallbackCache = new Set<string>();

    scale: number = 1;                   //网页缩放比例
    effectVolume: number = 1;		         //音效音量大小
    musicVolume: number = 1;		         //音乐音量大小
    speed: number = 1;
    GameEnd = false;
    composeAnimTimer: number | null = null;
    #resizeRaf: number | null = null;
    #tickRaf: number | null = null;
    #state: string = "town";

    #stateSet: string[] = ["town", "start", "compose", "store", "rouge", "battle"];


    #maxCardNum: number = 9;            //最大卡片数量
    #archive: any = {};
    #config: any = {};
    #coin: number = 0;
    #cards: BackpackCard[] = [];				//卡片数组
    #cardBag: BackpackCard[] = [];
    #StoreItems: StoreItem[] = [];
    #sunAutoCollect = false;
    #cardDetails = document.createElement("div");
    #debug = false;

    /**
     * 根据运行环境推断静态资源基路径
     * - GitHub Pages: ${origin}/CVMJS/static
     * - 本地/其它: ${origin}/static
     * - 可通过 sessionStorage/localStorage 覆盖
     */
    private resolveStaticBaseUrl(): string {
        const override = sessionStorage.getItem('CVMJS_STATIC_BASE') || localStorage.getItem('CVMJS_STATIC_BASE');
        if (override) return override;

        const { origin, pathname } = window.location;
        if (origin.includes('github.io')) {
            return `${origin}/CVMJS/static`;
        }
        if (pathname.includes('/static/')) {
            return `${origin}/static`;
        }
        return `${origin}/static`;
    }

    /**
     * 解析资源路径为完整URL
     * @param relativePath 相对路径,如 "/images/mice/idle.png"
     * @returns 完整URL
     */
    resolveResourcePath(relativePath: string): string {
        if (!relativePath.startsWith('/')) return relativePath;
        return `${this._staticBaseUrl}${relativePath}`;
    }

    /**
     * 静态方法：根据当前环境自动适配静态资源路径
     * @param relativePath 相对路径，如 "images/mice/idle.png" 或 "/images/mice/idle.png"
     * @returns 完整的静态资源URL
     */
    static getStaticPath(relativePath: string): string {
        const path = relativePath.replace(/^\/+/, '');
        const base = location.pathname.includes('/CVMJS/')
            ? `${location.origin}/CVMJS/static/`
            : `${location.origin}/static/`;
        return base + path;
    }

    // 静态t方法已移除,请使用i18n.t()代替


    constructor() {
        if (!EventHandler.instance) {
            EventHandler.instance = this;
            this._staticBaseUrl = this.resolveStaticBaseUrl();
        } else {
            ToastBox("Try to create a new instance of a class that runs in singleton mode.");
            return EventHandler.instance;
        }

        if (/Android|HarmonyOS|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            EventHandler.mobile = true;
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
            EventHandler.idle(() => {
                try {
                    const n = Math.min(this.cardBag.length, 12);
                    for (let i = 0; i < n; i++) {
                        const imgSrc = this.cardBag[i].src;
                        if (imgSrc) this.requestImageCache(imgSrc as any);
                    }
                } catch { }
            });

            const loader = document.getElementById('loader');

            if (loader) {
                loader.style.display = "none";
            }

            this.#cardDetails.className = "description";

            document.addEventListener('levelComplete', (event: any) => {
                const { NAME, REWARDS } = event.detail.level.constructor;
                this.#addCoins(REWARDS);
                ToastBox(`${i18n.t("NAME")}挑战完成，你获得了 ${i18n.t("REWARDS")} 金币！`);
            })

            // @ts-ignore
            this.coinBar = document.getElementById("coinBar");

            const town = document.getElementById('town');
            const cBag = document.getElementById('CBag');
            if (town) {
                const NavigationBar = new MaterialNavigationBar();
                NavigationBar.id = "";
                NavigationBar.addItem("开始",
                    EventHandler.icons.get('home'),
                    () => {
                        this.#GameStateSwitch('start');
                    });
                NavigationBar.addItem("情报",
                    EventHandler.icons.get('compose'),
                    () => {
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
                const Settings = new MaterialIconButton(EventHandler.icons.get('settings'), () => {
                    SettingPage.show();
                });
                Settings.id = "settings";
                const Information = new MaterialIconButton(EventHandler.icons.get('info'), () => {
                    InformationPage.show();
                })
                Information.id = "info";
                // @ts-ignore
                // @ts-ignore
                const InformationPage: MaterialCard = new MaterialCard(
                    `<p class="section">${EventHandler.icons.get("about")}${i18n.t("ABOUT_INFO")}</p>
                    <p>${EventHandler.icons.get("update")}${i18n.t("UPDATE_ANNOUNCEMENT")}</p>`,
                    `svg {
                        position: relative;
                        display: block;
                        margin-bottom: 0.25rem;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 50%;
                        background-color: var(--background);
                    }`
                );
                const Achievement = new MaterialIconButton(EventHandler.icons.get('achievement'), () => {
                    ToastBox("尚未完成的功能。");
                });
                Achievement.id = "achievement";
                InformationPage.id = "information";
                const SettingPage = new MaterialCard();
                SettingPage.id = "settings";
                const createNewLabel = (item: any, text: string, isSection: boolean = false) => {
                    const label = document.createElement('label');
                    const span = document.createElement('span');
                    if (isSection) label.className = "section";
                    span.textContent = text;
                    label.append(...[span, item])
                    SettingPage.appendChild(label);
                    return item;
                }
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
                createNewLabel(new MaterialRangeInput((value: number) => {
                    this.musicVolume = value;
                    // @ts-ignore
                    this.#config.musicVolume = Math.floor(value * 100);
                    EventHandler.backgroundMusic.volume = value;
                    this.#saveConfig();
                }, this.musicVolume * 100), `${i18n.t("MUSIC")}`);
                createNewLabel(new MaterialRangeInput((value: number) => {
                    this.effectVolume = value;
                    // @ts-ignore
                    this.#config.effectVolume = Math.floor(value * 100);
                    this.requestPlayAudio('dida');
                    this.#saveConfig();
                }, this.effectVolume * 100), `${i18n.t("AUDIO_EFFECT")}`);
                createNewLabel(new MaterialSwitch((value: boolean) => {
                    this.#sunAutoCollect = value;
                    // @ts-ignore
                    this.#config.sunAutoCollect = value;
                    this.#saveConfig();
                }, this.sunAutoCollect), `${i18n.t("SUN_AUTO_COLLECT")}`);
                createNewLabel(new MaterialSwitch((value: boolean) => {
                    this.speed = (value ? 1 : 0) + 1;
                }, false), `两倍速（风驰电掣）`);

                town.append(...[NavigationBar, GameReadyPage, Settings, Information, InformationPage, Achievement,
                    SettingPage]);
            }

            EventHandler.backgroundMusic = new Audio(EventHandler.getStaticPath('audio/chengzhen.mp3'));
            EventHandler.backgroundMusic.loop = true;
            EventHandler.backgroundMusic.volume = this.musicVolume;

            const startPlayPromise = EventHandler.backgroundMusic.play();
            if (startPlayPromise !== undefined) {
                startPlayPromise.catch((error: { name: string; }) => {
                    if (error.name === "NotAllowedError") {
                        WarnMessageBox({
                            Title: "健康游戏忠告",
                            Text: "抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。" +
                                "适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。",
                            ButtonLabelYes: "好",
                            ButtonFuncYes: () => {
                                EventHandler.backgroundMusic.play();
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
            } else {
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
        })
        window.addEventListener('resize', this.#onResize);

    }

    get state() {
        return this.#state;
    }

    set state(state) {
        if (this.#stateSet.includes(state)) {
            this.#state = state;
        } else {
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

    #iconsLoaded: Promise<void> | undefined = undefined;
    #i18nLoaded: Promise<void> | undefined = undefined;

    #loadIcons() {
        this.#iconsLoaded = Promise.all(
            Array.from(EventHandler.icons.keys()).map(key =>
                fetch(EventHandler.getStaticPath(`images/interface/icons/${key}.svg`))
                    .then(res => res.text())
                    .then(text => EventHandler.icons.set(key, text))
                    .catch(err => console.error(`Failed to load icon ${key}:`, err))
            )
        ).then(() => { });
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
        }
    };


    // 空闲时预取

    static get levelDetailsCache() {
        return EventHandler.#levelDetailsCache;
    }

    static idle(cb: (deadline: any) => void) {
        return (window as any).requestIdleCallback
            ? (window as any).requestIdleCallback(cb as any)
            : setTimeout(cb as any, 0);
    }

    static async playSfxWebAudio(name: string, volume = 1, playbackRate = 1.0) {
        try {
            EventHandler.#audioCtx ??= new (window as any).AudioContext();
            let buf = EventHandler.#effectBuffers.get(name);
            if (!buf) {
                const res = await fetch(EventHandler.getStaticPath(`audio/${name}.mp3`));
                const arr = await res.arrayBuffer();
                buf = await EventHandler.#audioCtx!.decodeAudioData(arr);
                EventHandler.#effectBuffers.set(name, buf);
            }
            const src = EventHandler.#audioCtx!.createBufferSource();
            const gain = EventHandler.#audioCtx!.createGain();
            gain.gain.value = volume;
            src.buffer = buf;
            src.playbackRate.value = playbackRate;
            src.connect(gain).connect(EventHandler.#audioCtx!.destination);
            src.start();
        } catch (e) {
            // fallback 在外层继续
        }
    }

    static getPositionX = (x: number) => {		//获得x坐标，浮点型
        return (x - level.column_start) / level.row_gap;
    }

    static getPositionY = (y: number) => {		//获得y坐标，浮点型
        return (y - level.row_start) / level.column_gap;
    }

    requestPlayAudio(name: string, origin: any = null) {
        try {
            if (origin === null && EventHandler.RESTRICTED_AUDIO.has(name)) return;

            const now = Date.now();
            if (origin !== null) {
                let perOrigin = EventHandler.#restrictedAudioPlaybackTime.get(origin);
                if (!perOrigin) { perOrigin = new Map<string, number>(); EventHandler.#restrictedAudioPlaybackTime.set(origin, perOrigin); }
                const last = perOrigin.get(name) || 0;
                const limit = this.#config?.audioLimitMs ?? 1000;
                if (now - last < limit && EventHandler.RESTRICTED_AUDIO.has(name)) return;
                perOrigin.set(name, now);
            }

            // Sun 音效特殊处理：连击时提高音调
            let playbackRate = 1.0;
            if (name === 'sun') {
                const timeSinceLastSun = now - EventHandler.#sunLastPlayTime;
                if (timeSinceLastSun <= EventHandler.SUN_COMBO_WINDOW) {
                    // 在连击窗口内，增加音调
                    EventHandler.#sunPitchOffset = Math.min(EventHandler.#sunPitchOffset + EventHandler.SUN_PITCH_STEP, EventHandler.SUN_MAX_PITCH - 1.0);
                } else {
                    // 超出连击窗口，重置音调
                    EventHandler.#sunPitchOffset = 0;
                }
                playbackRate = 1.0 + EventHandler.#sunPitchOffset;
                EventHandler.#sunLastPlayTime = now;
            }

            // 优先 WebAudio 播放短音效
            const webAudioEnabled = (this.#config?.webAudio ?? true);
            if (webAudioEnabled && (window as any).AudioContext) {
                EventHandler.playSfxWebAudio(name, this.effectVolume, playbackRate);
            }
        } catch (error) {
            ToastBox(`Cannot play this audio: ${error}`);
        }
    }


    requestBackMusicChange(type: number) {
        const music = EventHandler.GAME_MUSIC.get(type);
        if (music) {
            try {
                EventHandler.backgroundMusic.src = EventHandler.getStaticPath(`audio/${music}.mp3`);
                EventHandler.backgroundMusic.play();
                return true;
            } catch (error) {
                ToastBox(`Cannot play this audio: ${error}`);
                return false;
            }
        } else {
            ToastBox(`Cannot find that resource.`);
            return false;
        }
    }

    requestDrawImage(src: string, effect: string | null = null, intensity: number | null = null, tryWebP: boolean = false) {
        let actualSrc = src.startsWith('http://') || src.startsWith('https://')
            ? src
            : EventHandler.getStaticPath(src);

        if (tryWebP && actualSrc.endsWith('.png') && !EventHandler.#webpFallbackCache.has(src)) {
            actualSrc = actualSrc.replace(/\.png$/, '.webp');
        } else if (actualSrc.endsWith('.webp') && EventHandler.#webpFallbackCache.has(src)) {
            // 如果直接请求 .webp 且已知该 .webp 不可用，则尝试降级为 .png
            actualSrc = actualSrc.replace(/\.webp$/, '.png');
        }

        const effectKey = effect !== null ? `${actualSrc}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` : actualSrc;

        if (EventHandler.#images.has(effectKey)) {
            return EventHandler.#images.get(effectKey);
        } else {
            this.requestImageCache(actualSrc, effect, intensity).catch(() => {
                // 1. tryWebP=true 且尝试加载生成的 .webp 失败 -> 回退到原始 .png
                if (tryWebP && actualSrc.endsWith('.webp')) {
                    EventHandler.#webpFallbackCache.add(src);
                    const fallbackSrc = src.startsWith('http://') || src.startsWith('https://')
                        ? src
                        : EventHandler.getStaticPath(src);
                    this.requestImageCache(fallbackSrc, effect, intensity);
                }
                // 2. 直接请求 .webp 失败 -> 尝试降级到同名 .png
                else if (actualSrc.endsWith('.webp') && !tryWebP) {
                    EventHandler.#webpFallbackCache.add(src);
                    const fallbackSrc = actualSrc.replace(/\.webp$/, '.png');
                    this.requestImageCache(fallbackSrc, effect, intensity);
                }
            });
            return null;
        }
    }

    requestImageCache(src: string, effect: string | null = null, intensity: number | null = null) {
        return new Promise(async (resolve, reject) => {
            if (EventHandler.#images.has(src)) {
                const bitmap = EventHandler.#images.get(src);
                if (bitmap instanceof ImageBitmap) {
                    resolve(this.#requestApplyEffect(bitmap, effect, intensity, src));
                    return;
                } else {
                    ToastBox(`Data corrupted.`);
                    reject(new Error('Data corrupted.'));
                    return;
                }
            }

            const request = indexedDB.open(EventHandler.DATABASE_NAME, EventHandler.DB_VERSION);
            const storeName = EventHandler.DB_STORE;

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (db.objectStoreNames.contains(storeName)) {
                    db.deleteObjectStore(storeName);
                }
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                store.createIndex('w', 'w', { unique: false });
                store.createIndex('h', 'h', { unique: false });
            };


            request.onsuccess = async (event) => {
                const db = (event.target as IDBRequest).result as IDBDatabase;
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(src);

                getRequest.onsuccess = async (event) => {
                    const result = (event.target as IDBRequest).result;

                    if (result) {
                        try {
                            const blob = result.image;
                            const bitmap = await createImageBitmap(blob);
                            EventHandler.#images.set(src, bitmap);
                            resolve(this.#requestApplyEffect(bitmap, effect, intensity, src));
                        } catch (error) {
                            ToastBox(`Image processing error: ${error}`);
                            reject(error);
                        }
                    } else {
                        this.#fetchAndCacheImage(src, effect, intensity, db, storeName, resolve, reject);
                    }
                };

                getRequest.onerror = (event) => {
                    const request = event.target as IDBRequest;
                    ToastBox(`Database retrieval error: ${request.error}`);
                    reject(request.error);
                };
            };

            request.onerror = (event) => {
                const request = event.target as IDBRequest;
                ToastBox(`Database open error: ${request.error}`);
                reject(request.error);
            };
        });
    }

    async #fetchAndCacheImage(
        src: string,
        effect: string | null,
        intensity: number | null,
        db: IDBDatabase,
        storeName: string,
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void
    ): Promise<void> {
        const img = new Image();
        img.src = src;

        img.onload = async () => {
            try {
                const bitmap = await createImageBitmap(img);
                EventHandler.#images.set(src, bitmap);

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
                const blob = await new Promise<Blob | null>((resolveBlob) => canvas.toBlob(resolveBlob));

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
                    const request = event.target as IDBRequest;
                    ToastBox(`Transaction error: ${request.error}`);
                    reject(request.error);
                };
            } catch (error) {
                ToastBox(`Image loading or processing error: ${error}`);
                reject(error);
            }
        };

        img.onerror = (error) => {
            ToastBox(`Image load error: ${error}`);
            reject(new Error('Image load error.'));
        };
    }


    async #requestApplyEffect(img: ImageBitmap, effect: string | null, intensity: number | null, src: string) {
        const effectKey = effect !== null ? `${src}?effect=${effect}${intensity != null ? `&intensity=${intensity}` : ''}` : src;

        if (EventHandler.#images.has(effectKey)) {
            return EventHandler.#images.get(effectKey);
        }

        EventHandler.#effectCanvas.width = img.width;
        EventHandler.#effectCanvas.height = img.height;

        const ctx = EventHandler.#getCtx();
        if (ctx) {
            ctx.clearRect(0, 0, EventHandler.#effectCanvas.width, EventHandler.#effectCanvas.height);
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

        const effectImg = await createImageBitmap(EventHandler.#effectCanvas);
        EventHandler.#images.set(effectKey, effectImg);
        return effectImg;
    }

    #applyDamagedEffect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: ImageBitmap) {
        if (!!ctx.filter) {
            ctx.filter = "brightness(125%)";
            ctx.drawImage(img, 0, 0);
        } else {
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

    #applyFreezingEffect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: ImageBitmap) {
        ctx.drawImage(img, 0, 0);
        const drawable = ctx.getImageData(0, 0, img.width, img.height);
        const pixelData = drawable.data;
        for (let i = 0; i < pixelData.length; i += 4) {
            pixelData[i] = pixelData[i] >> 1;
            pixelData[i + 1] = pixelData[i + 1] >> 1;
        }
        ctx.putImageData(drawable, 0, 0);
    }

    #applyOpacityEffect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: ImageBitmap, intensity: number | null) {
        ctx.globalAlpha = intensity || 0.5;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1.0; // Reset alpha to default for subsequent drawings
    }

    #applyMirrorEffect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: ImageBitmap) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -img.width, 0);
        ctx.restore();
    }

    async requestWebPFrames(src: string): Promise<ImageBitmap[]> {
        const resolvedSrc = this.resolveResourcePath(src);
        if (EventHandler.#webpFrameCache.has(resolvedSrc)) {
            return EventHandler.#webpFrameCache.get(resolvedSrc)!;
        }

        const processBlob = async (blob: Blob) => {
            const buf = await blob.arrayBuffer();
            const decoder = new ImageDecoder({ data: buf, type: "image/webp" });
            await decoder.tracks.ready;

            const frames: ImageBitmap[] = [];
            const track = decoder.tracks.selectedTrack;
            if (!track) throw new Error("No track found");
            const count = track.frameCount;

            for (let i = 0; i < count; i++) {
                const { image } = await decoder.decode({ frameIndex: i });
                const bitmap = await createImageBitmap(image);
                image.close();
                frames.push(bitmap);
            }
            return frames;
        };

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(EventHandler.DATABASE_NAME, EventHandler.DB_VERSION);
            const storeName = EventHandler.DB_STORE;

            request.onerror = () => reject(request.error);
            request.onsuccess = async (event) => {
                const db = (event.target as IDBRequest).result as IDBDatabase;
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(resolvedSrc);

                getRequest.onsuccess = async () => {
                    const result = getRequest.result;
                    if (result && result.image) {
                        try {
                            const frames = await processBlob(result.image);
                            this.#cacheFrames(resolvedSrc, frames);
                            resolve(frames);
                        } catch (e) {
                            // Cache corrupted or decode error, fetch fresh
                            this.#fetchWebP(resolvedSrc, db, storeName).then(resolve).catch(reject);
                        }
                    } else {
                        this.#fetchWebP(resolvedSrc, db, storeName).then(resolve).catch(reject);
                    }
                };
                getRequest.onerror = () => this.#fetchWebP(resolvedSrc, db, storeName).then(resolve).catch(reject);
            };
        });
    }

    #cacheFrames(src: string, frames: ImageBitmap[]) {
        if (EventHandler.#webpFrameCache.size >= 50) {
            const first = EventHandler.#webpFrameCache.keys().next().value;
            if (first) {
                EventHandler.#webpFrameCache.get(first)?.forEach(f => f.close());
                EventHandler.#webpFrameCache.delete(first);
            }
        }
        EventHandler.#webpFrameCache.set(src, frames);
    }

    async #fetchWebP(src: string, db: IDBDatabase, storeName: string): Promise<ImageBitmap[]> {
        const resp = await fetch(src);
        const blob = await resp.blob();

        // Process first to ensure valid
        const buf = await blob.arrayBuffer();
        const decoder = new ImageDecoder({ data: buf, type: "image/webp" });
        await decoder.tracks.ready;

        const frames: ImageBitmap[] = [];
        const track = decoder.tracks.selectedTrack;
        if (!track) throw new Error("No track found");
        const count = track.frameCount;

        for (let i = 0; i < count; i++) {
            const { image } = await decoder.decode({ frameIndex: i });
            const bitmap = await createImageBitmap(image);
            image.close();
            frames.push(bitmap);
        }

        // Store in IDB
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            // WebP 动画不需要 w/h 索引，存 0 即可
            store.put({ id: src, image: blob, w: 0, h: 0 });
        } catch (e) {
            console.warn("Failed to cache WebP to IDB", e);
        }

        this.#cacheFrames(src, frames);
        return frames;
    }

    async requestSpriteSlices(src: string, frames: number, offsetX: number = 0, offsetY: number = 0, vertical: boolean = false): Promise<ImageBitmap[]> {
        const resolvedSrc = this.resolveResourcePath(src);
        const key = `${resolvedSrc}?f=${frames}&ox=${offsetX}&oy=${offsetY}&v=${vertical}`;
        if (EventHandler.#spriteSliceCache.has(key)) {
            return EventHandler.#spriteSliceCache.get(key)!;
        }

        const img = await this.requestImageCache(resolvedSrc) as ImageBitmap;
        const slices: ImageBitmap[] = [];

        if (vertical) {
            const h = img.height / frames;
            for (let i = 0; i < frames; i++) {
                slices.push(await createImageBitmap(img, offsetX, offsetY + h * i, img.width - offsetX, h));
            }
        } else {
            const w = img.width / frames;
            for (let i = 0; i < frames; i++) {
                slices.push(await createImageBitmap(img, offsetX + w * i, offsetY, w, img.height - offsetY));
            }
        }

        if (EventHandler.#spriteSliceCache.size >= 100) {
            const first = EventHandler.#spriteSliceCache.keys().next().value;
            if (first) {
                EventHandler.#spriteSliceCache.get(first)?.forEach(s => s.close());
                EventHandler.#spriteSliceCache.delete(first);
            }
        }

        EventHandler.#spriteSliceCache.set(key, slices);
        return slices;
    }

    /**
     * 同步获取已缓存的 WebP 帧，如果未缓存则触发加载（静默失败）
     */
    getWebPFrame(src: string, index: number): ImageBitmap | null {
        const resolvedSrc = this.resolveResourcePath(src);
        if (EventHandler.#webpFrameCache.has(resolvedSrc)) {
            const frames = EventHandler.#webpFrameCache.get(resolvedSrc)!;
            if (frames.length === 0) return null;
            return frames[index % frames.length];
        }
        // 尝试触发加载
        if (src.endsWith('.webp')) {
            this.requestWebPFrames(src).catch(() => { });
        }
        return null;
    }

    async requestAnimationResource(src: string, frames: number, options?: { isWebP?: boolean; isSvg?: boolean; vertical?: boolean; offsetX?: number; offsetY?: number }): Promise<ImageBitmap[] | null> {
        const resolvedSrc = this.resolveResourcePath(src);
        if (resolvedSrc.endsWith('.webp') || options?.isWebP) {
            try {
                return await this.requestWebPFrames(resolvedSrc);
            } catch {
                return null;
            }
        }

        if (options?.isSvg) {
            return null;
        }

        if (frames > 1) {
            try {
                return await this.requestSpriteSlices(resolvedSrc, frames, options?.offsetX ?? 0, options?.offsetY ?? 0, options?.vertical ?? false);
            } catch {
                return null;
            }
        }

        return null;
    }

    requestCardDetailDisplay(origin: { x: number, y: number }, type: number, star: number, skillLevel: number) {
        document.body.appendChild(this.#cardDetails);

        this.#cardDetails.style.left = origin.x + "px";
        this.#cardDetails.style.top = origin.y + "px";

        const detail = getFoodDetails(type) as {
            cName: string, category: string,
            cost: number, addCost: boolean, coolTime: number, special: string | undefined, description: string, upgrade: string
        };
        if (detail) {
            this.#cardDetails.innerHTML = `<h1>${detail.cName}</h1>`;
            this.#cardDetails.innerHTML += `<div>`
                + `<a>${EventHandler.icons.get("type")}${detail.category}</a>`
                + `<a>${EventHandler.icons.get("energy")}${detail.cost + ((detail.addCost) ? "+" : "")}</a>`
                + `<a>${EventHandler.icons.get("cooltime")}${detail.coolTime / 1000}${i18n.t("SECOND")}</a>`
                + `<a>${EventHandler.icons.get("tier")}${star}</a>`
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
        if (this.#resizeRaf != null) cancelAnimationFrame(this.#resizeRaf);
        this.#resizeRaf = requestAnimationFrame(this.#resize);
    }

    #resize = () => {
        this.scale = document.documentElement.clientHeight / 600;
        if (level?.Battlefield) {
            level.Battlefield.resize(this.scale);
        }
    }

    // 统一 Tick:减少分散样式写入
    #startTick() {
        const tick = () => {
            try {
                for (const bc of this.#cards) {
                    if (bc && bc.card && typeof bc.card.cooldownProcess === 'function') {
                        bc.card.cooldownProcess();
                    }
                }
            } catch { }
            this.#tickRaf = requestAnimationFrame(tick);
        };
        if (this.#tickRaf != null) cancelAnimationFrame(this.#tickRaf);
        this.#tickRaf = requestAnimationFrame(tick);
    }


    #getArchive() {
        const archive = localStorage.getItem("CVMJSArchive");
        if (archive) {
            this.#archive = JSON.parse(archive) as IArchive;

            if (this.#archive) {
                this.#coin = this.#archive.coin;
                this.#StoreItems = this.#archive.storeItems || null;
                for (const cardBagElement of this.#archive.cardBag) {
                    this.cardBag.push(new BackpackCard(cardBagElement.type, cardBagElement.star, cardBagElement.skillLevel));
                }
            }
        } else {
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
            }
            localStorage.setItem("CVMJSArchive", JSON.stringify(this.#archive));
        }


        const coinBar = document.getElementById("coinBar");
        if (coinBar) {
            coinBar.innerText = this.#coin.toString();
        }

        const config = localStorage.getItem("CVMJSConfig");
        if (config) {
            this.#config = JSON.parse(config) as IConfig;
            if (typeof this.#config.webAudio === 'undefined') this.#config.webAudio = true;
            if (typeof this.#config.audioLimitMs === 'undefined') this.#config.audioLimitMs = 1000;
        } else {
            this.#config = {
                sunAutoCollect: false,
                musicVolume: 80,
                effectVolume: 80,
                webAudio: true,
                audioLimitMs: 1000,
            }
        }
        this.#sunAutoCollect = this.#config.sunAutoCollect;
        this.musicVolume = this.#config.musicVolume / 100;
        this.effectVolume = this.#config.effectVolume / 100;
        this.#saveConfig();

    }

    #addCoins(num: number) {
        if (num >= 0) {
            this.#coin = this.#coin + num;
            const coinBar = document.getElementById('coinBar');
            if (coinBar) {
                coinBar.innerHTML = this.#coin + "G";
            }
            this.#archive.coin = this.#coin;
            this.#saveArchive();
            return true;
        } else {
            return false;
        }
    }

    #costCoins(num: number) {
        if (num >= 0 && this.#coin - num >= 0) {
            this.#coin = this.#coin - num;
            const coinBar = document.getElementById('coinBar');
            if (coinBar) {
                coinBar.innerHTML = this.#coin + "G";
            }
            this.#archive.coin = this.#coin;
            this.#saveArchive();
            return true;
        } else {
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
                } else {
                    break;
                }
                attempt++;
            }
            return entry;
        }
        throw "Cannot Proceed";
    }

    #purchaseItem(item: StoreItem, entry: number, pos: number) {
        if (this.#costCoins(item.price || 900)) {
            const outcome = this.cardBag.findIndex((value) => {
                return value.type === entry;
            });

            if (outcome === -1) {
                this.#addCard(entry, 0);
            } else {
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

            } else {
                ToastBox(`Page not loaded properly`);
            }
        } else {
            WarnMessageBox({
                Text: `${i18n.t("NOT_ENOUGH_COIN")}`,
                ButtonLabelYes: `${i18n.t("OK")}`,
            });
        }
    }

    #setNewItem(pos: number) {
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
                })
            })
        }
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

    #addCard(type: number, star: number = 0) {
        if (this.#archive.cardBag.some((card: BackpackCard) => {
            return card.type === type;
        })) {
            return false;
        } else {
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

    #GameStateSwitch(des: string) {
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
                        try { cancelAnimationFrame(this.composeAnimTimer as any); } catch { }
                        try { clearInterval(this.composeAnimTimer as any); } catch { }
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
                        try { cancelAnimationFrame(this.composeAnimTimer as any); } catch { }
                        try { clearInterval(this.composeAnimTimer as any); } catch { }
                    }

                    break;
                }
                case "rouge": {
                    this.town.rouge.style.display = "block";
                    this.town.coinBar.style.display = "none";
                    if (this.composeAnimTimer != null) {
                        try { cancelAnimationFrame(this.composeAnimTimer as any); } catch { }
                        try { clearInterval(this.composeAnimTimer as any); } catch { }
                    }

                }
            }
        }
    }

    // 资源与事件清理
    destroy() {
        try {
            if (this.#tickRaf != null) cancelAnimationFrame(this.#tickRaf);
            if (this.composeAnimTimer != null) {
                try { cancelAnimationFrame(this.composeAnimTimer as any); } catch { }
                try { clearInterval(this.composeAnimTimer as any); } catch { }
                this.composeAnimTimer = null;
            }
            if (this.#resizeRaf != null) cancelAnimationFrame(this.#resizeRaf);
            window.removeEventListener('resize', this.#onResize);
        } catch { }
    }
}

