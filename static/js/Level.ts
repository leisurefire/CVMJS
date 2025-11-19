import EventHandler, { Card } from "./EventHandler.js";
import { i18n } from "./i18n/index.js";
import { Cat, Character, Crab, Food, getFoodDetails, Plate, RatNest } from "./Foods.js";
import { GEH, ToastBox, WarnMessageBox } from "./Core.js";
import { Mouse, getMouseDetails } from "./Mice.js";
import { Bullet, BulletCtor, BulletSpawnOptions, acquireBullet, releaseBullet } from "./Bullets.js";
import SpriteAnimation, { SpriteAnimationManager } from "./SpriteAnimation.js";
import { Sun, MapGrid, GameBattlefield } from "./GameBattlefield.js";
const BULLET_STACK_MAX_SIZE = 999;

export let level: any = {};
level = null;
export default class Level {
    static NAME = "测试关卡";
    static TIME = 0;
    static TYPE = "通关战";
    static WAVES = 4;
    static REWARDS = 0;
    static HAS_FORWARD_WAVES = false;
    static SUGGESTED_TYPE = null;
    static BACKGROUND = "/images/interface/background_0.jpg";
    static SRC = new Map([
        ["fog", "/images/interface/fog.png"],
        ["sun", "/images/interface/sun.png"],
    ]);

    #row_start = 108;
    private Battlefield!: GameBattlefield;
    private waterLineNum: number | undefined;
    private landLineNum: number | undefined;
    private waterPosition: number[] | undefined;
    private landPosition: number[] | undefined;
    private levelTimer: number | undefined;
    get row_start() {
        return this.#row_start;
    }
    get row_gap() {
        return 60;
    }
    #row_num = 7;
    get row_num() {
        return this.#row_num;
    }
    #row_end = 562;
    get row_end() {
        return this.#row_end;
    }
    get column_start() {
        return 304;
    }
    get column_gap() {
        return 64;
    }
    get column_num() {
        return 9;
    }
    get column_end() {
        return 846;
    }

    #Waves: { mice_type: number[], mice_num: number[] }[] = [];				//用于存储波的数组
    #WaveNum = 0;       //共有几波
    WaveTag = 0;   //当前进行到第几波
    #HugeWaveTag = 0;   //当前是第几大波
    #HugeWave: number[] = [];

    #Sun: Sun[] = []; 				   	//火苗模块
    #SunNum = 50; 				//火苗数
    #lastSunNumDisplay: string | null = null;
    get SunNum() {
        return this.#SunNum;
    }
    set SunNum(value) {
        if (value >= 10000) {
            value = 10000;
        }
        const newDisplay = value.toString();
        if (this.#lastSunNumDisplay !== newDisplay) {
            this.Battlefield.SunBar.innerHTML = newDisplay;
            this.#lastSunNumDisplay = newDisplay;
        }
        this.#SunNum = value;
    }

    characterPlaced = false;      //是否放置人物
    #WaveInterval = 24000;	//两波之间留给玩家最长的准备时间，以毫秒计，一般为24000
    #NextWaveRemainingTime = 24000;
    #HitPointThreshold = 0.3;      //HP阈值，低于此值直接进入下一波
    #autoCollectInterval = 3200;    //自动收集火苗的间隔
    #autoProduceInterval = 12000;
    #autoProduceRemainingTime = 12000;
    waterLine: number[] | undefined;		//水路
    #MouseType: number[] = [];			//本关卡老鼠的种类数组，用于加载老鼠资源
    #LoadProgress = 0;		//资源总量
    #Cards = [...GEH.cards] as unknown as Card[];
    get Cards() {
        return this.#Cards;
    }
    Guardians: Cat[] | Crab[] = [];
    #Bullets: Bullet[] = [];
    #Foods = Array.from({ length: this.row_num * this.column_num }, () => new MapGrid());
    get Foods() {
        return this.#Foods;
    }
    // explicitly type the mice grid to avoid TS inferring never[][][]
    #Mice: Mouse[][][] = Array.from({ length: this.row_num }, () => Array.from({ length: this.column_num + 1 }, () => [] as Mouse[]));
    get Mice() {
        return this.#Mice;
    }
    #AirLane: Mouse[][][] = [] as Mouse[][][];
    get AirLane() {
        return this.#AirLane;
    }
    #FogColNum = -1;
    #LightDEG: Int8Array | undefined;
    get #FogBlowTag() {
        return this.#FogBlowInterval > 0;
    }
    #FogBlowInterval = 0;
    #CurrentWaveFullHealth = 0;
    #CurrentWaveNum = 0;
    #SummonRemainingTime = 2000;
    #SummonInterval = 2000;
    #BOSSWaveSummonRemainingTime = 12000;
    #BOSSWaveSummonInterval = 12000;
    #IsForwardWaves = false;
    #ForwardWaveNum = 0;
    #Forwarding = false;
    #PreviousTimestamp: number = 0;
    #PreviousFinished = false;

    // 临时复用缓冲区，减少垃圾回收开销
    // temporary reuse buffers (typed in class to avoid TS never[][][] issue)
    private _miceTemp?: Mouse[][][];
    private _airLaneTemp?: Mouse[][][];

    // 对象池字段: 子弹、太阳 复用池
    // object pools
    private _bulletPool: Map<any, Bullet[]> = new Map();
    private _sunPool: Sun[] = [];
    private _summonQueue: Mouse[] = [];
    // 动画管理器（独立管理所有动画相关逻辑）
    private _animationManager!: SpriteAnimationManager;

    // 对象池方法: 获取或创建 Sun 实例
    // Sun 对象池与 SpriteAnimation 对象池辅助方法
    private acquireSun(x: number, y: number, num: number, animation: boolean): Sun {
        let sun = this._sunPool.pop();
        if (sun) {
            sun.reset(x, y, num, animation);
        } else {
            sun = new Sun(x, y, num, animation);
        }
        return sun;
    }

    private releaseSun(sun: Sun) {
        try { sun.onRelease(); } catch { }
        this._sunPool.push(sun);
    }

    // bound frame loop to avoid per-frame closure allocation
    #frameLoop = (timestamp: number) => {
        if (this.#PreviousTimestamp === undefined) {
            this.#PreviousTimestamp = timestamp;
        }
        const elapsed = timestamp - this.#PreviousTimestamp;
        if (GEH.GameEnd) {

            this._animationManager.clear();
            this.#Bullets.length = 0;
            this.Guardians.length = 0;
            this.#Mice.length = 0;
            this.#Foods.length = 0;
            if (this.levelTimer) cancelAnimationFrame(this.levelTimer);
            return;
        }
        if (this.#Forwarding) {
            if (this.levelTimer) cancelAnimationFrame(this.levelTimer);
            return;
        }
        if (elapsed >= 40 / GEH.speed && !this.#PreviousFinished) {
            this.#PreviousFinished = true;
            this.#requestUpdateForeground(elapsed);
        }
        else if (elapsed >= 40 * 2 / GEH.speed) {
            this.#requestUpdateProcess();
            this.#requestUpdateBattleGround(elapsed);
            this.#requestUpdateForeground(elapsed);
            this.#PreviousFinished = false;
            this.#PreviousTimestamp = timestamp;
        }
        this.levelTimer = requestAnimationFrame(this.#frameLoop);
    }

    constructor(interval: number | undefined, useWebGL: boolean = false) {
        if (interval) {
            this.#NextWaveRemainingTime = interval;
            this.#WaveInterval = interval;
        }
        try {
            if (level) {
                return level;
            }
            level = this;
            // 初始化动画管理器（栅格数 = row_num * column_num + 1）
            this._animationManager = new SpriteAnimationManager(this.row_num * this.column_num);
            this.Battlefield = new GameBattlefield(this, useWebGL);
            this.Battlefield.initialize();
            GEH.cards.length = 0;
            GEH.GameEnd = false;
        }
        catch (error: any) {
            ToastBox(error);
        }
    }

    /**
     * 创建并播放动画（供 Foods, Mice, Bullets 等模块调用）
     */
    createSpriteAnimation(x: number, y: number, src: string, frames: number, options: any) {
        return this._animationManager.playAnimation(x, y, src, frames, options);
    }
    waterLineGenerate(arr: number[]) {
        this.waterLine = arr;
        this.waterLineNum = 0;
        this.landLineNum = 0;
        this.waterPosition = [];
        this.landPosition = [];
        for (let i = 0; i < this.waterLine.length; i++) {
            if (this.waterLine[i] === 1) {
                this.waterLineNum += 1;
                this.waterPosition.push(i);
            } else {
                this.landLineNum += 1;
                this.landPosition.push(i);
            }
        }
    }
    SetRowNum(x = 7) {
        if (x === 7) {
            this.#row_start = 108;
            this.#row_num = 7;
            this.#row_end = 562;
        }
        else if (x === 6) {
            this.#row_start = 106;
            this.#row_num = 6;
            this.#row_end = 493;
        }
        else ToastBox(`Unexpected row num.`);
    }
    StartWaveCreate() {
        this.waveCreate(0, 1, 1);		//加入老鼠类型，数量，本波是否结束，本波是否为大波
        this.Load();
    }
    ForwardWaveCreate() {
        this.waveCreate(0, 1, 1);
    }
    Load() {
        this.#Load();
    }

    async LoadAssets() {
        const assetsToLoad: string[] = [];

        const currentConstructor = this.constructor as typeof Level;
        for (const [_, value] of currentConstructor.SRC) {
            assetsToLoad.push(value);
        }

        for (let i = 0; i < this.#Cards.length; i++) {
            const card = getFoodDetails(this.#Cards[i].type);
            const assets = card.assets;
            if (assets) {
                for (const asset of assets) {
                    const src = `/images/foods/${card.name}/${asset}.png`;
                    assetsToLoad.push(src);
                }
            }
        }

        for (let i = 0; i < this.#MouseType.length; i++) {
            const mouse = getMouseDetails(this.#MouseType[i]);
            const assets = mouse.assets;
            for (let j = 0; j < assets.length; j++) {
                const src = `/images/mice/${mouse.eName}/${assets[j]}.png`;
                assetsToLoad.push(src);
            }
        }

        const uniqueAssets = Array.from(new Set(assetsToLoad));
        const promises = uniqueAssets.map(src => GEH.requestImageCache(src));

        const allSettled = Promise.allSettled(promises);
        // 等待i18n加载完成后再创建错误消息
        const timeoutPromise = i18n.getLoadPromise().then(() => {
            return new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${i18n.t("GAME_ERROR_CODE_011")}`)), 30000));
        });
        const results = await Promise.race([allSettled, timeoutPromise]) as PromiseSettledResult<unknown>[];

        let fulfilled = 0;
        let rejected = 0;
        for (const r of results) {
            if ((r as PromiseFulfilledResult<unknown>).status === 'fulfilled') fulfilled++;
            else rejected++;
        }
        this.#LoadProgress = fulfilled;
        if (rejected > 0) {
            throw new Error(`${i18n.t("GAME_ERROR_CODE_011")}`);
        }
        return;
    }
    #Load() {
        const loader = document.getElementById('loader');
        if (loader) {
            this.#Cards.forEach(card => {
                card.remainTime = 0;
            })
            loader.style.display = "block";
            this.LoadAssets().then(() => {
                this.Enter();
                this.gameEventsHandlerFunc();
                this.#RequestPlaceCharacter();
                loader.style.display = "none";
            }).catch(error => {
                loader.style.display = "none";
                // 等待i18n加载完成后再显示错误消息
                const showError = () => {
                    ToastBox(`${i18n.t("GAME_ERROR_CODE_011")}:${error}`);
                };
                if (i18n.isReady()) {
                    showError();
                } else {
                    i18n.getLoadPromise().then(showError).catch(console.error);
                }
                this.exit();
            });
        }
        else {
            throw `DOM structure corrupted.`
        }
    }
    CreateBossBar(target: Mouse) {
        return this.Battlefield.createBossBar(target);
    }
    BOSSWaveSummon() { }
    Enter() { }
    //只有使用这个函数才能读取预种植卡片的星级和技能等级
    //水路需要先预种植木盘子再放置卡片，否则什么也不会发生
    PrePlant(type: number, x: number, y: number) {
        for (const value of this.#Cards) {
            if (type === value.type) {
                const { star, skillLevel } = value;
                return getFoodDetails(type).generate(x, y, star, skillLevel);
            }
        }
        getFoodDetails(type).generate(x, y);
    }

    #RequestPlaceCharacter() {
        this.Battlefield.Cursor.picked = false;
        if (this.characterPlaced) {
            return false;
        } else {
            const Handler = {
                src: "/images/character/player/idle.png",
                offset: Character.offset,
                frames: 8,
                func: ({ positionX, positionY }: { positionX: number, positionY: number }) => {
                    if (this.characterPlaced) {
                        return true;
                    }
                    const food = this.#Foods[positionY * level.column_num + positionX] as unknown as MapGrid<Food>;
                    if (!food || food.noPlace) {
                        return false;
                    }
                    if (food.water) {
                        if (food.layer_1 == null) {
                            if (food.layer_2 == null) {
                                food.layer_2 = new Plate(positionX, positionY, 1);
                            }
                            food.layer_1 = new Character(positionX, positionY, 1);
                            this.characterPlaced = true;
                            return true;
                        }
                        return false;
                    }
                    if (food.layer_1 == null) {
                        food.layer_1 = new Character(positionX, positionY, 0);
                        this.characterPlaced = true;
                        return true;
                    }
                    return false;
                },

                successFunc: () => {
                },
                failFunc: () => {
                }
            }
            return this.Battlefield.requestCursorTracking(null, Handler);
        }
    }

    nextWave() {
        GEH.requestPlayAudio("putong");
        this.WaveTag++;
        this.Battlefield.nextWave(this.WaveTag, this.#WaveNum, this.#IsForwardWaves, this.#ForwardWaveNum);

        this.#CurrentWaveFullHealth = 0;
        if (this.#HugeWave.includes(this.WaveTag)) {
            this.#HugeWaveTag++;
            if (this.WaveTag === this.#WaveNum - 1) {
                this.Battlefield.showFinalWave(this.#HugeWaveTag);
                this.#CurrentWaveFullHealth += (getMouseDetails(6).summon()! as Mouse).fullHealth;
            } else {
                this.Battlefield.showHugeWave(this.#HugeWaveTag);
            }
            this.#Foods.forEach(value => {
                if (value && value.layer_1) {
                    const food = value.layer_1;
                    switch (food.constructor) {
                        case RatNest: {
                            const mouse = value.layer_1.hugeWaveHandler() as unknown as Mouse;
                            return this.#CurrentWaveFullHealth += mouse.fullHealth;
                        }
                    }
                }
            })
        }

        this.#waveSummonProgress();
        this.waveEvent();
        return true;
    }

    waveEvent() {
        return false;
    }

    #waveSummonProgress() {
        this.#CurrentWaveNum = 0;
        const wave = this.#Waves[this.WaveTag];

        for (let i = 0; i < wave.mice_type.length; i++) {
            if (wave.mice_num[i] > 0) {
                const type = wave.mice_type[i];		//读取召唤类型
                const currentNum = wave.mice_num[i];	//读取召唤数目
                const summonNum = Math.floor(Math.random() * (currentNum - 1)) + 1;	//至少召唤一只

                wave.mice_num[i] = currentNum - summonNum;
                for (let j = 0; j < summonNum; j++) {

                    const mouse = getMouseDetails(type).summon()! as Mouse;

                    const fullHealth = mouse.fullHealth;

                    if (fullHealth > 0) {
                        this.#CurrentWaveFullHealth += fullHealth;
                    }
                }

                this.#CurrentWaveNum += wave.mice_num[i];
            }
        }
    }

    exit() {
        GEH.GameEnd = true;
        this.Battlefield.remove();
        GEH.requestBackMusicChange(0);
        this.#Cards.length = 0;
        this.#Waves.length = 0;
        this.Guardians.length = 0;
        this.#Foods.length = 0;
        this.#Mice.length = 0;
        this._animationManager.clear();
        this.#Bullets.length = 0;
        level = null;
    }

    mapMove() { }

    #forward() {
        if (!this.#Forwarding) {
            this.#Forwarding = true;
            if (this.levelTimer) {
                cancelAnimationFrame(this.levelTimer);
            }

            const Forward = document.createElement("div");
            Forward.id = "Forward";
            this.Battlefield.appendChild(Forward);

            const Box = document.createElement('div');
            Box.id = 'Box';

            const Title = document.createElement('h2');
            Title.innerText = '继续？';
            Title.id = 'Title';

            const Description = document.createElement('p');
            Description.innerText = "业已击溃先锋鼠军，不妨乘胜追击";
            Description.id = 'Description';

            const Button_1 = document.createElement('button');
            Button_1.innerText = "继续作战";

            const Button_2 = document.createElement('button');
            Button_2.innerText = "领取奖励";

            Forward.appendChild(Box);
            Box.append(Title, Description, Button_1, Button_2);

            const GameEndBack = document.createElement("div");
            GameEndBack.id = "GameEndBack";
            this.Battlefield.appendChild(GameEndBack);
            Button_1.onclick = () => {
                this.#Forwarding = false;
                Forward.remove();
                GameEndBack.remove();
                this.gameEventsHandlerFunc();
                this.#IsForwardWaves = true;
                this.#ForwardWaveNum = this.WaveTag;
                this.ForwardWaveCreate();
                this.Battlefield.Progress.style.width = "28px";
                this.#NextWaveRemainingTime = 100;
            }
            Button_2.onclick = () => {
                Forward.remove();
                GameEndBack.remove();
                this.victory();
            }
        }
    }

    victory() {
        if (GEH.GameEnd) return false;
        GEH.GameEnd = true;
        EventHandler.backgroundMusic.pause();
        GEH.requestPlayAudio("shengli");
        const currentStructor = this.constructor as typeof Level;
        const reward = currentStructor.REWARDS;
        const finalReward = this.#IsForwardWaves ? reward * 2 : reward;

        const event = new CustomEvent('levelComplete', {
            detail: {
                level: this,
                reward: finalReward,
            }
        })
        document.dispatchEvent(event);

        const overlay = document.createElement("div");
        overlay.className = "overlay";
        overlay.style.zIndex = "99";
        overlay.style.backgroundColor = "rgba(0,0,0,.24)";
        this.Battlefield.appendChild(overlay);

        const victoryBox = document.createElement("div");
        victoryBox.id = "victoryBox";
        this.Battlefield.appendChild(victoryBox);

        const titleElement = document.createElement('h2');
        titleElement.innerText = '胜利';
        titleElement.id = 'victoryTitle';
        victoryBox.appendChild(titleElement);

        const scoreContainer = document.createElement('div');
        scoreContainer.id = "scoreContainer";
        victoryBox.appendChild(scoreContainer);

        const scoreElement = document.createElement('h2');
        scoreElement.innerText = '0';
        scoreContainer.appendChild(scoreElement);

        const awardContainer = document.createElement('div');
        awardContainer.id = 'awardContainer';
        victoryBox.appendChild(awardContainer);

        const rewardElement = document.createElement('div');
        const rewardText = document.createElement('p');
        rewardText.innerText = finalReward.toString();
        rewardElement.appendChild(rewardText);
        awardContainer.appendChild(rewardElement);

        const closeButton = document.createElement('button');
        closeButton.innerText = '完成';

        const handleCloseButtonClick = () => {
            victoryBox.remove();
            overlay.remove();
            closeButton.removeEventListener('click', handleCloseButtonClick);
            this.exit();
        };

        closeButton.addEventListener('click', handleCloseButtonClick);
        victoryBox.appendChild(closeButton);

        return true;
    };

    defeat() {
        if (GEH.GameEnd || this.WaveTag === 0) {
            return false;
        }
        GEH.GameEnd = true;
        GEH.requestPlayAudio("shibai");
        EventHandler.backgroundMusic.pause();

        const Defeat = document.createElement("div");
        Defeat.id = "Defeat";
        this.Battlefield.appendChild(Defeat);

        const GameEndBack = document.createElement("div");
        GameEndBack.id = "GameEndBack";
        this.Battlefield.appendChild(GameEndBack);

        const timer = setTimeout(() => {
            clearTimeout(timer);
            Defeat.remove();
            GameEndBack.remove();
            this.exit();
        }, 6000);
        return true;
    }

    createWaveFlag() {
        for (let i = 0; i < this.#HugeWave.length; i++) {
            let flag = document.createElement("div");
            flag.className = "flag";
            flag.style.right = (- 4 + (this.#HugeWave[i] / (this.#WaveNum - 1)) * 192) + "px";
            this.Battlefield.WaveBar.appendChild(flag);
        }
    }

    ratNestSummon() {
        for (let i = 0; i < level.row_num; i++) {
            const y = (Math.floor(Math.random() * level.row_num) + i) % level.row_num;
            const x = Math.floor(Math.random() * 6);
            for (let j = 0; j < 6; j++) {
                const pos = (y * level.column_num + (x + j) % 6 + 3) % (level.row_num * level.column_num);
                if (!this.#Foods[pos].water && !this.#Foods[pos].layer_0
                    && !this.#Foods[pos].layer_1 && !this.#Foods[pos].layer_2) {
                    this.#Foods[pos] = new MapGrid();
                    return this.#Foods[pos].layer_1 = new RatNest((x + j) % 6 + 3, y, 3) as unknown as Food;
                }
            }
        }
    }

    waveCreateTemplate(waveArray: [][]) {
        for (let i = 0; i < waveArray.length; i++) {
            const wave = waveArray[i];
            for (let j = 0; j < wave.length; j++) {
                const { type, num, huge = 0 } = wave[j];
                const isLast = j === wave.length - 1;
                this.waveCreate(type, num, isLast ? 1 : 0, huge);
            }
        }
    }

    waveCreate(type: number, num: number, end = 0, huge = 0) {
        if (huge) {
            this.#HugeWave.push(this.#WaveNum);
        }

        if (!this.#MouseType.some((value) => {
            return value === type;
        })) {
            this.#MouseType.push(type);
        }

        if (!(this.#WaveNum in this.#Waves)) {
            this.#Waves[this.#WaveNum] = {
                mice_type: [],
                mice_num: [],
            }
        }

        this.#Waves[this.#WaveNum].mice_type.push(type);
        this.#Waves[this.#WaveNum].mice_num.push(num);

        if (end) {
            this.#WaveNum++;
        }
    }

    setGuardian() {
        if (this.waterLine == null) {
            for (let i = 0; i < level.row_num; i++) {
                this.Guardians[i] = new Cat(-1, i);
            }
        } else {
            for (let i = 0; i < this.waterLine.length; i++) {
                if (this.waterLine[i]) {
                    this.Guardians[i] = new Crab(-1, i);
                } else {
                    this.Guardians[i] = new Cat(-1, i);
                }
            }
        }
    }

    produceSun(x: number, y: number, num = 25, animation = false) {  // 像素坐标 x, y；animation 为 true 时开启跳跃动画
        const sun = new Sun(x, y, num, animation);
        this.#Sun.push(sun);
        return sun;
    }
    /**
     * 从对象池获取或创建子弹实例，并加入当前关卡渲染队列
     */
    /**
     * 从对象池获取 Bullet 实例并加入当前关卡渲染队列
     */
    requestSummonBullet<T extends Bullet = Bullet>(
        ctor: BulletCtor<T>,
        x = 0,
        y = 0,
        dam = 20,
        angle = 0,
        parameter_1: any = null,
        parameter_2: any = null,
        options?: BulletSpawnOptions<T>
    ): T {
        const bullet = acquireBullet(ctor, x, y, dam, angle, parameter_1, parameter_2, options);
        this.#Bullets.push(bullet);
        return bullet;
    }

    #requestSunBehavior(ctx: CanvasRenderingContext2D) {
        this.#autoCollectInterval = this.#autoCollectInterval - 50;
        const { x, y } = this.Battlefield.Cursor;
        for (let i = this.#Sun.length - 1; i >= 0; i--) {
            const sun = this.#Sun[i];
            if (GEH.GameEnd || sun.loopTimes > 12) {
                this.#Sun.splice(i, 1);
                this.releaseSun(sun);
            } else {
                if (!sun.collected) {
                    if (this.#autoCollectInterval <= 0 && GEH.sunAutoCollect) {
                        sun.collect();
                    }
                    const distance = Math.hypot(x - sun.x, y - sun.y);
                    if (distance < 50) {
                        sun.collect();
                    }
                }
                if (!sun.behavior(ctx)) {
                    this.#Sun.splice(i, 1);
                    this.releaseSun(sun);
                }
            }
        }
        if (this.#autoCollectInterval <= 0) {
            this.#autoCollectInterval = 3200;
        }
    }

    #requestUpdateProcess() {
        const currentConstructor = this.constructor as typeof Level;
        if (this.WaveTag < this.#WaveNum - 1) {
            if (this.#NextWaveRemainingTime <= 18000) {
                if (this.#NextWaveRemainingTime <= 0) {
                    this.#NextWaveRemainingTime = this.#WaveInterval;
                    this.nextWave();
                }
                else if (this.WaveTag !== 0
                    && this.#CurrentWaveNum === 0
                    && this.#CurrentWaveFullHealth > 0
                    && this.Battlefield.TotalHitPoints / this.#CurrentWaveFullHealth <= this.#HitPointThreshold) {
                    this.#NextWaveRemainingTime = this.#WaveInterval;
                    this.nextWave();
                }
            }
        }
        else {
            if (this.#IsForwardWaves) {
                if (this.#BOSSWaveSummonRemainingTime <= 0) {
                    this.#BOSSWaveSummonRemainingTime = this.#BOSSWaveSummonInterval;
                    this.BOSSWaveSummon();
                }
                this.#BOSSWaveSummonRemainingTime -= 100;
            }
            if (this.Battlefield.TotalHitPoints <= 0 && !this.#Forwarding) {

                if (currentConstructor.HAS_FORWARD_WAVES
                    && !this.#IsForwardWaves) {
                    this.#forward();
                }
                else {
                    this.victory();
                }
            }
        }
        this.#NextWaveRemainingTime -= 100;

        if (this.#CurrentWaveNum) {
            if (this.#SummonRemainingTime <= 0) {

                this.#waveSummonProgress();
                this.#SummonRemainingTime = this.#SummonInterval;
            }
            this.#SummonRemainingTime -= 100;
        }

        if (!currentConstructor.TIME) {
            if (this.#autoProduceRemainingTime <= 0) {
                const x = Math.floor(Math.random() * 450) + level.column_start;	//随机位置，加入一些参数防止位置不合理
                this.produceSun(x, 0, 25, false);
                this.#autoProduceRemainingTime = this.#autoProduceInterval;
            }
            this.#autoProduceRemainingTime -= 100;
        }
    }

    #requestUpdateBackground() {
        const currentConstructor = this.constructor as typeof Level;
        return this.Battlefield.updateBackground(currentConstructor.BACKGROUND, (this.#Cards as any), this.#SunNum);
    }

    #requestUpdateMapGrid(row: number, column: number) {
        if (column < 0 || column >= this.column_num || row < 0 || row >= this.row_num) {
            return false;
        }
        return this.Battlefield.updateMapGrid(this.#Foods[row * this.column_num + column]);
    }

    #requestUpdateMouse(row: number, column: number, elapsed: number, miceTemp: Mouse[][][], airLaneTemp: Mouse[][][]) {
        if (this.#Mice[row] && this.#Mice[row][column]) {
            for (const [, mouse] of this.#Mice[row][column].entries()) {
                if (mouse) {
                    this.Battlefield.updateEnemies(mouse, elapsed, miceTemp, airLaneTemp);
                }
            }
        }
    }

    #requestUpdateForeground(elapsed: number) {
        const ctx = this.Battlefield.ctxFG;
        if (ctx) {
            ctx.clearRect(0, 0, this.Battlefield.FrequentCanvas.width, this.Battlefield.FrequentCanvas.height);
            this.#requestUpdateBullets(ctx);
            this.#requestRenderFog(ctx);
            this.#requestSunBehavior(ctx);
            const { x, y, origin, picked } = this.Battlefield.Cursor;
            if (picked && origin) {
                const positionX = Math.floor(EventHandler.getPositionX(x));
                const positionY = Math.floor(EventHandler.getPositionY(y));
                const entity = GEH.requestDrawImage(origin.src);
                const shadow = GEH.requestDrawImage(origin.src, "opacity");
                if (entity && shadow) {
                    const entityWidth = entity.width / origin.frames;
                    const entityHeight = entity.height;
                    const shadowX = this.column_start + positionX * this.row_gap + origin.offset[0];
                    const shadowY = this.row_start + positionY * this.column_gap + origin.offset[1];
                    const entityX = x - entityWidth / 2;
                    const entityY = y - entityHeight / 2;
                    if (positionX >= 0 && positionX < this.column_num && positionY >= 0 && positionY < this.row_num) {
                        ctx.drawImage(shadow, 0, 0, entityWidth, entityHeight, shadowX, shadowY, entityWidth, entityHeight);
                    }
                    ctx.drawImage(entity, 0, 0, entityWidth, entityHeight, entityX, entityY, entityWidth, entityHeight);
                }
            }
        }
        if (!this.characterPlaced) {
            this.Battlefield.playCountDownAnimation(elapsed);
        }
    }
    #requestUpdateBullets(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.#Bullets.length; i++) {
            const bullet = this.#Bullets[i];
            // 超出栈容量时将伤害合并并回收
            if (i > BULLET_STACK_MAX_SIZE) {
                this.#Bullets[Math.floor(Math.random() * BULLET_STACK_MAX_SIZE)].damage += bullet.damage;
                this.#Bullets.splice(i, 1);
                releaseBullet(bullet);
                i--;
            } else {
                if (bullet.move()) {
                    this.#Bullets.splice(i, 1);
                    releaseBullet(bullet);
                    i--;
                } else {
                    bullet.createEntity(ctx);
                    // Boost 逻辑维持不变
                    if (bullet.CanBoost
                        && bullet.position !== bullet.birthPosition
                        && bullet.positionX < 9
                        && level.Foods[bullet.positionY * level.column_num + bullet.column]?.layer_1) {
                        const cell = level.Foods[bullet.positionY * level.column_num + bullet.column].layer_1!;
                        if (cell.canBlockBoost) {
                            this.#Bullets.splice(i, 1);
                            releaseBullet(bullet);
                            i--;
                        }
                        if (cell.canReverseBoost) {
                            const outcome = bullet.duplicate();
                            if (outcome) {
                                bullet.angle = (bullet.angle + 180) % 360;
                                bullet.birthPosition = Math.floor(bullet.positionY) * 10 + Math.floor(bullet.positionX);
                                continue;
                            }
                        }
                        if (cell.canFireBoost) {
                            const outcome = bullet.fireBoost();
                            if (outcome) {
                                GEH.requestPlayAudio("firebullet");
                                (outcome as Bullet).birthPosition = Math.floor((outcome as Bullet).positionY) * 10 + Math.floor((outcome as Bullet).positionX);
                                this.#Bullets.splice(i, 1);
                                releaseBullet(bullet);
                                this.#Bullets.push(outcome);
                                i--;
                                continue;
                            }
                        }
                    }
                    if (bullet.takeDamage()) {
                        this.#Bullets.splice(i, 1);
                        releaseBullet(bullet);
                        i--;
                    }
                }
            }
        }
    }

    #requestUpdateBattleGround(elapsed: number) {
        this.#requestUpdateBackground();

        const miceTemp: Mouse[][][] = Array.from(
            { length: this.row_num },
            () => Array.from({ length: this.column_num + 1 }, () => [] as Mouse[])
        );
        const airLaneTemp: Mouse[][][] = Array.from(
            { length: this.row_num },
            () => [] as Mouse[][]
        );

        for (let i = 0; i < this.row_num; i++) {

            const guardian = this.Guardians[i];
            if (guardian != null) {
                guardian.behavior();
                const img = GEH.requestDrawImage(guardian.entity);
                if (img) {
                    const ctx = this.Battlefield.ctxBG;
                    if (ctx) {
                        ctx.drawImage(img, guardian.width * guardian.tick, 0, guardian.width, guardian.height, guardian.x, guardian.y, guardian.width, guardian.height);
                    }
                }
            }
            for (let j = 0; j < this.column_num + 1; j++) {
                this.#requestUpdateMapGrid(i, j);
                this.#requestUpdateMouse(i, j, elapsed, miceTemp, airLaneTemp);
            }
        }
        // 更新动画（由 animationManager 负责）
        const renderer = (this.Battlefield as any).renderer || this.Battlefield.ctxBG;
        if (renderer) {
            this._animationManager.updateAnimations(renderer as any, this.column_num, this.row_num);
        }

        this.#Mice = miceTemp;
        this.#AirLane = airLaneTemp;
    }


    gameEventsHandlerFunc() {
        // start the bound frame loop
        this.levelTimer = requestAnimationFrame(this.#frameLoop);
    }

    #requestRenderFog(ctx: CanvasRenderingContext2D) {
        if (!this.#LightDEG) return;
        let offsetX = 24;
        if (this.#FogBlowTag) {
            this.#FogBlowInterval -= 50;
            if (this.fogBlowAnimation > 0) {
                offsetX += ((this.fogBlowAnimationLength - this.fogBlowAnimation) / this.fogBlowAnimationLength) * 2048;
                this.fogBlowAnimation -= 50;
            }
            else return;
        }
        const fogSrc = Level.SRC.get("fog");

        for (let i = 0; i < this.#LightDEG.length; i++) {
            const x = i % (this.column_num + 1);
            const y = Math.floor(i / (this.column_num + 1));

            if (x < this.column_num + 1 - this.#FogColNum) {
                continue;
            }
            if (this.#LightDEG[i] < 2) {
                let effect = null;
                let opacity = null;

                if (this.#LightDEG[i] === 1) {
                    effect = "opacity";
                    opacity = 0.64;
                }
                const fog = GEH.requestDrawImage(fogSrc!, effect, opacity);
                if (fog) {
                    ctx.drawImage(fog,
                        this.column_start + (x - 1) * (this.column_gap - 4) + offsetX,
                        this.row_start + (y - 1) * (this.row_gap + 8));
                }
                else {
                    const ori = GEH.requestDrawImage(fogSrc!);
                    if (ori) ctx.drawImage(ori,
                        this.column_start + (x - 1) * (this.column_gap - 4) + offsetX,
                        this.row_start + (y - 1) * (this.row_gap + 8));
                }
            }
        }
    }

    fogSet(colNum = 0) {
        if (!this.#LightDEG) {
            this.#LightDEG = new Int8Array(level.row_num * (level.column_num + 1));
        }
        this.#FogColNum = colNum;
    }

    lightDEGChange(pos: number, deg: number) {
        if (!this.#LightDEG) {
            return;
        }
        this.#LightDEG[pos] = (this.#LightDEG[pos] + Math.floor(deg)) as any;
    }

    fogBlowAnimation = 0;
    fogBlowAnimationLength = 1000;
    fogBlowAway(length = 15000) {
        if (this.fogBlowAnimation <= 0) {
            this.fogBlowAnimation = this.fogBlowAnimationLength;
        }
        this.#FogBlowInterval = Math.max(this.#FogBlowInterval, length);
    }
}