var _a;
import EventHandler from "./EventHandler.js";
import { Cat, Character, Crab, getFoodDetails, Plate, RatNest } from "./Foods.js";
import { GEH, ToastBox, WarnMessageBox } from "./Core.js";
import { getMouseDetails } from "./Mice.js";
import { CONTINUE, GAME_ERROR_CODE_010, GAME_ERROR_CODE_011, GAME_UI_BUTTON_004, PAUSED } from "./language/Chinese.js";
const BULLET_STACK_MAX_SIZE = 999;
export let level = {};
level = null;
class Level {
    static NAME = "测试关卡";
    static TIME = 0;
    static TYPE = "通关战";
    static WAVES = 4;
    static REWARDS = 0;
    static HAS_FORWARD_WAVES = false;
    static SUGGESTED_TYPE = null;
    static BACKGROUND = "../static/images/interface/background_0.jpg";
    static SRC = new Map([
        ["fog", "../static/images/interface/fog.png"],
        ["sun", "../static/images/interface/sun.png"],
    ]);
    #row_start = 108;
    Battlefield = new GameBattlefield(this);
    waterLineNum;
    landLineNum;
    waterPosition;
    landPosition;
    levelTimer;
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
    #Waves = []; //用于存储波的数组
    #WaveNum = 0; //共有几波
    WaveTag = 0; //当前进行到第几波
    #HugeWaveTag = 0; //当前是第几大波
    #HugeWave = [];
    #Sun = []; //火苗模块
    #SunNum = 50; //火苗数
    get SunNum() {
        return this.#SunNum;
    }
    set SunNum(value) {
        if (value >= 10000) {
            value = 10000;
        }
        this.Battlefield.SunBar.innerHTML = (value).toString();
        this.#SunNum = value;
    }
    characterPlaced = false; //是否放置人物
    #WaveInterval = 24000; //两波之间留给玩家最长的准备时间，以毫秒计，一般为24000
    #NextWaveRemainingTime = 24000;
    #HitPointThreshold = 0.3; //HP阈值，低于此值直接进入下一波
    #autoCollectInterval = 3200; //自动收集火苗的间隔
    #autoProduceInterval = 12000;
    #autoProduceRemainingTime = 12000;
    waterLine; //水路
    #MouseType = []; //本关卡老鼠的种类数组，用于加载老鼠资源
    #LoadProgress = 0; //资源总量
    #Cards = [...GEH.cards];
    get Cards() {
        return this.#Cards;
    }
    Guardians = [];
    #Bullets = [];
    #Foods = Array.from({ length: this.row_num * this.column_num }, () => new MapGrid());
    get Foods() {
        return this.#Foods;
    }
    #Mice = Array.from({ length: this.row_num }, () => Array.from({ length: this.column_num + 1 }, () => []));
    get Mice() {
        return this.#Mice;
    }
    #AirLane = [];
    get AirLane() {
        return this.#AirLane;
    }
    #FogColNum = -1;
    #LightDEG;
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
    #PreviousTimestamp = 0;
    #PreviousFinished = false;
    #SpriteAnimationStack = Array.from({ length: (this.row_num * this.column_num + 1) }, () => []);
    constructor() {
        try {
            if (level) {
                return level;
            }
            level = this;
            this.Battlefield.initialize();
            GEH.cards.length = 0;
            GEH.GameEnd = false;
        }
        catch (error) {
            ToastBox(error);
        }
    }
    createSpriteAnimation(x, y, src, frames, options) {
        const spriteAnimation = new SpriteAnimation(x, y, src, frames, options);
        this.#SpriteAnimationStack[spriteAnimation.zIndex].push(spriteAnimation);
        return spriteAnimation;
    }
    #updateSpriteAnimations(i, j, spriteTemp) {
        const ctx = this.Battlefield.Canvas.getContext('2d');
        if (ctx) {
            const zIndex = (i * this.column_num) + j;
            for (const spriteAnimation of this.#SpriteAnimationStack[zIndex]) {
                if (!spriteAnimation.render(ctx)) {
                    spriteTemp[zIndex].push(spriteAnimation);
                }
            }
        }
    }
    waterLineGenerate(arr) {
        this.waterLine = arr;
        this.waterLineNum = 0;
        this.landLineNum = 0;
        this.waterPosition = [];
        this.landPosition = [];
        for (let i = 0; i < this.waterLine.length; i++) {
            if (this.waterLine[i] === 1) {
                this.waterLineNum += 1;
                this.waterPosition.push(i);
            }
            else {
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
        else
            ToastBox(`Unexpected row num.`);
    }
    StartWaveCreate() {
        this.waveCreate(0, 1, 1); //加入老鼠类型，数量，本波是否结束，本波是否为大波
        this.Load();
    }
    ForwardWaveCreate() {
        this.waveCreate(0, 1, 1);
    }
    Load() {
        this.#Load();
    }
    async LoadAssets() {
        let timestamp = 0;
        const assetsToLoad = [];
        const currentConstructor = this.constructor;
        for (const [_, value] of currentConstructor.SRC) {
            assetsToLoad.push(value);
        }
        for (let i = 0; i < this.#Cards.length; i++) {
            const card = getFoodDetails(this.#Cards[i].type);
            const assets = card.assets;
            if (assets) {
                for (const asset of assets) {
                    const src = `../static/images/foods/${card.name}/${asset}.png`;
                    assetsToLoad.push(src);
                }
            }
        }
        for (let i = 0; i < this.#MouseType.length; i++) {
            const mouse = getMouseDetails(this.#MouseType[i]);
            const assets = mouse.assets;
            for (let j = 0; j < assets.length; j++) {
                const src = `../static/images/mice/${mouse.eName}/${assets[j]}.png`;
                assetsToLoad.push(src);
            }
        }
        for (const src of assetsToLoad) {
            await GEH.requestImageCache(src);
            this.#LoadProgress++;
        }
        return new Promise((resolve, reject) => {
            const checkProgressInterval = setInterval(() => {
                timestamp += 1000;
                if (this.#LoadProgress >= assetsToLoad.length) {
                    clearInterval(checkProgressInterval);
                    resolve();
                }
                else if (timestamp >= 30000) {
                    clearInterval(checkProgressInterval);
                    reject(new Error(`${GAME_ERROR_CODE_011}`));
                }
            }, 1000);
        });
    }
    #Load() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = "block";
            this.LoadAssets().then(() => {
                this.Enter();
                this.gameEventsHandlerFunc();
                this.#RequestPlaceCharacter();
                loader.style.display = "none";
            }).catch(error => {
                loader.style.display = "none";
                ToastBox(`${GAME_ERROR_CODE_011}:${error}`);
                this.exit();
            });
        }
        else {
            throw `DOM structure corrupted.`;
        }
    }
    CreateBossBar(target) {
        return this.Battlefield.createBossBar(target);
    }
    BOSSWaveSummon() { }
    Enter() { }
    //只有使用这个函数才能读取预种植卡片的星级和技能等级
    //水路需要先预种植木盘子再放置卡片，否则什么也不会发生
    PrePlant(type, x, y) {
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
        }
        else {
            const Handler = {
                src: "../static/images/character/player/idle.png",
                offset: Character.offset,
                frames: 8,
                func: ({ positionX, positionY }) => {
                    if (this.characterPlaced) {
                        return true;
                    }
                    else {
                        this.characterPlaced = true;
                        const food = this.#Foods[positionY * level.column_num + positionX];
                        if (food.noPlace) {
                            return false;
                        }
                        else if (food.water) {
                            if (food.layer_1 == null) {
                                if (food.layer_2 == null) {
                                    food.layer_2 = new Plate(positionX, positionY, 1);
                                }
                                food.layer_1 = new Character(positionX, positionY, 1);
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                        else if (food.layer_1 == null) {
                            food.layer_1 = new Character(positionX, positionY, 0);
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                },
                successFunc: () => {
                },
                failFunc: () => {
                }
            };
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
                this.#CurrentWaveFullHealth += getMouseDetails(6).summon().fullHealth;
            }
            else {
                this.Battlefield.showHugeWave(this.#HugeWaveTag);
            }
            this.#Foods.forEach(value => {
                if (value && value.layer_1) {
                    const food = value.layer_1;
                    switch (food.constructor) {
                        case RatNest: {
                            const mouse = value.layer_1.hugeWaveHandler();
                            return this.#CurrentWaveFullHealth += mouse.fullHealth;
                        }
                    }
                }
            });
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
                const type = wave.mice_type[i]; //读取召唤类型
                const currentNum = wave.mice_num[i]; //读取召唤数目
                const summonNum = Math.floor(Math.random() * (currentNum - 1)) + 1; //至少召唤一只
                wave.mice_num[i] = currentNum - summonNum;
                for (let j = 0; j < summonNum; j++) {
                    const fullHealth = getMouseDetails(type).summon().fullHealth;
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
        this.#SpriteAnimationStack.length = 0;
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
            };
            Button_2.onclick = () => {
                Forward.remove();
                GameEndBack.remove();
                this.victory();
            };
        }
    }
    victory() {
        if (GEH.GameEnd)
            return false;
        GEH.GameEnd = true;
        EventHandler.backgroundMusic.pause();
        GEH.requestPlayAudio("shengli");
        const currentStructor = this.constructor;
        const reward = currentStructor.REWARDS;
        const finalReward = this.#IsForwardWaves ? reward * 2 : reward;
        const event = new CustomEvent('levelComplete', {
            detail: {
                level: this,
                reward: finalReward,
            }
        });
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
    }
    ;
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
            flag.style.right = (-4 + (this.#HugeWave[i] / (this.#WaveNum - 1)) * 192) + "px";
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
                    return this.#Foods[pos].layer_1 = new RatNest((x + j) % 6 + 3, y, 3);
                }
            }
        }
    }
    waveCreateTemplate(waveArray) {
        for (let i = 0; i < waveArray.length; i++) {
            const wave = waveArray[i];
            for (let j = 0; j < wave.length; j++) {
                const { type, num, huge = 0 } = wave[j];
                const isLast = j === wave.length - 1;
                this.waveCreate(type, num, isLast ? 1 : 0, huge);
            }
        }
    }
    waveCreate(type, num, end = 0, huge = 0) {
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
            };
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
        }
        else {
            for (let i = 0; i < this.waterLine.length; i++) {
                if (this.waterLine[i]) {
                    this.Guardians[i] = new Crab(-1, i);
                }
                else {
                    this.Guardians[i] = new Cat(-1, i);
                }
            }
        }
    }
    produceSun(x, y, num = 25, animation = false) {
        const sun = new Sun(x, y, num, animation);
        this.#Sun.push(sun);
        return sun;
    }
    requestSummonBullet(type, x = 0, y = 0, dam = 20, angle = 0, parameter_1 = null, parameter_2 = null) {
        const Bullet = new type(x, y, dam, angle, parameter_1, parameter_2);
        this.#Bullets.push(Bullet);
        return Bullet;
    }
    #requestSunBehavior(ctx) {
        this.#autoCollectInterval = this.#autoCollectInterval - 50;
        const { x, y } = this.Battlefield.Cursor;
        for (let i = this.#Sun.length - 1; i >= 0; i--) {
            const sun = this.#Sun[i];
            if (GEH.GameEnd || sun.loopTimes > 12) {
                this.#Sun.splice(i, 1);
            }
            else {
                if (!sun.collected) {
                    if (this.#autoCollectInterval <= 0 && GEH.sunAutoCollect) {
                        sun.collect();
                    }
                    const distance = Math.sqrt(Math.pow(x - sun.x, 2) + Math.pow(y - sun.y, 2));
                    if (distance < 50) {
                        sun.collect();
                    }
                }
                if (!sun.behavior(ctx)) {
                    this.#Sun.splice(i, 1);
                }
            }
        }
        if (this.#autoCollectInterval <= 0) {
            this.#autoCollectInterval = 3200;
        }
    }
    #requestUpdateProcess() {
        const currentConstructor = this.constructor;
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
                const x = Math.floor(Math.random() * 450) + level.column_start; //随机位置，加入一些参数防止位置不合理
                this.produceSun(x, 0, 25, false);
                this.#autoProduceRemainingTime = this.#autoProduceInterval;
            }
            this.#autoProduceRemainingTime -= 100;
        }
        if (this.#FogBlowTag) {
            this.#FogBlowInterval -= 100;
            if (this.#FogBlowInterval <= 0) {
                for (let i = 0; i < (level.column_num + 1) * level.row_num; i++) {
                    this.lightDEGChange(i, -2);
                }
            }
        }
    }
    #requestUpdateBackground() {
        const currentConstructor = this.constructor;
        return this.Battlefield.updateBackground(currentConstructor.BACKGROUND, this.#Cards, this.#SunNum);
    }
    #requestUpdateMapGrid(row, column) {
        if (column < 0 || column >= this.column_num || row < 0 || row >= this.row_num) {
            return false;
        }
        return this.Battlefield.updateMapGrid(this.#Foods[row * this.column_num + column]);
    }
    #requestUpdateMouse(row, column, elapsed, miceTemp, airLaneTemp) {
        if (this.#Mice[row] && this.#Mice[row][column]) {
            for (const [, mouse] of this.#Mice[row][column].entries()) {
                if (mouse) {
                    this.Battlefield.updateEnemies(mouse, elapsed, miceTemp, airLaneTemp);
                }
            }
        }
    }
    #requestUpdateForeground(elapsed) {
        const ctx = this.Battlefield.FrequentCanvas.getContext('2d');
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
    #requestUpdateBullets(ctx) {
        for (let i = 0; i < this.#Bullets.length; i++) {
            const value = this.#Bullets[i];
            if (i > BULLET_STACK_MAX_SIZE) {
                this.#Bullets[Math.floor(Math.random() * BULLET_STACK_MAX_SIZE)].damage += value.damage;
                this.#Bullets.splice(i, 1);
                i--;
            }
            else {
                const value = this.#Bullets[i];
                if (value.move()) {
                    this.#Bullets.splice(i, 1);
                    i--;
                }
                else {
                    if (value.entity) {
                        value.createEntity(ctx);
                    }
                    if (value.CanBoost
                        && value.position !== value.birthPosition
                        && value.positionX < 9
                        && level.Foods[value.positionY * level.column_num + value.column] != null
                        && level.Foods[value.positionY * level.column_num + value.column].layer_1 != null) {
                        if (level.Foods[value.positionY * level.column_num + value.column].layer_1.canBlockBoost) {
                            this.#Bullets.splice(i, 1);
                            i--;
                        }
                        if (level.Foods[value.positionY * level.column_num + value.column].layer_1.canReverseBoost) {
                            const outcome = value.duplicate();
                            if (outcome) {
                                value.angle = (value.angle + 180) % 360;
                                value.birthPosition = Math.floor(value.positionY) * 10 + Math.floor(value.positionX);
                                continue;
                            }
                        }
                        if (level.Foods[value.positionY * level.column_num + value.column].layer_1.canFireBoost) {
                            GEH.requestPlayAudio("firebullet");
                            const outcome = value.fireBoost();
                            if (outcome) {
                                outcome.birthPosition = Math.floor(outcome.positionY) * 10 + Math.floor(outcome.positionX);
                                this.#Bullets.splice(i, 1);
                                this.#Bullets.push(outcome);
                                i--;
                                continue;
                            }
                        }
                    }
                    if (value.takeDamage()) {
                        this.#Bullets.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    }
    #requestUpdateBattleGround(elapsed) {
        this.#requestUpdateBackground();
        const miceTemp = Array.from({ length: this.row_num }, () => Array.from({ length: this.column_num + 1 }, () => []));
        const airLaneTemp = [];
        const spriteTemp = Array.from({ length: (this.row_num * this.column_num + 1) }, () => []);
        for (let i = 0; i < this.row_num; i++) {
            const guardian = this.Guardians[i];
            if (guardian != null) {
                guardian.behavior();
                const img = GEH.requestDrawImage(guardian.entity);
                if (img) {
                    const ctx = this.Battlefield.Canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, guardian.width * guardian.tick, 0, guardian.width, guardian.height, guardian.x, guardian.y, guardian.width, guardian.height);
                    }
                }
            }
            for (let j = 0; j < this.column_num + 1; j++) {
                this.#requestUpdateMapGrid(i, j);
                this.#requestUpdateMouse(i, j, elapsed, miceTemp, airLaneTemp);
                this.#updateSpriteAnimations(i, j, spriteTemp);
            }
        }
        this.#Mice = [...miceTemp];
        this.#AirLane = airLaneTemp;
        this.#SpriteAnimationStack = [...spriteTemp];
    }
    gameEventsHandlerFunc() {
        this.levelTimer = requestAnimationFrame((timestamp) => {
            if (this.#PreviousTimestamp === undefined) {
                this.#PreviousTimestamp = timestamp;
            }
            const elapsed = timestamp - this.#PreviousTimestamp;
            if (GEH.GameEnd) {
                this.#SpriteAnimationStack.length = 0;
                this.#Bullets.length = 0;
                this.Guardians.length = 0;
                this.#Mice.length = 0;
                this.#Foods.length = 0;
                if (this.levelTimer)
                    cancelAnimationFrame(this.levelTimer);
                return false;
            }
            if (this.#Forwarding) {
                if (this.levelTimer)
                    cancelAnimationFrame(this.levelTimer);
                return false;
            }
            if (elapsed >= 40 / GEH.speed && !this.#PreviousFinished) {
                this.#PreviousFinished = true;
                this.#requestUpdateForeground(elapsed);
            }
            else if (elapsed >= 40 * 2 / GEH.speed) {
                this.#requestUpdateBattleGround(elapsed);
                this.#requestUpdateForeground(elapsed);
                this.#requestUpdateProcess();
                this.#PreviousFinished = false;
                this.#PreviousTimestamp = timestamp;
            }
            this.gameEventsHandlerFunc();
        });
    }
    #requestRenderFog(ctx) {
        if (this.#FogBlowTag || !this.#LightDEG) {
            return;
        }
        const fogSrc = _a.SRC.get("fog");
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
                const fog = GEH.requestDrawImage(fogSrc, effect, opacity);
                if (fog) {
                    ctx.drawImage(fog, this.column_start + (x - 1) * (this.column_gap - 4) + 24, this.row_start + (y - 1) * (this.row_gap + 8));
                }
            }
        }
    }
    fogSet(colNum = 0) {
        if (!this.#LightDEG) {
            this.#LightDEG = Array(level.row_num * (level.column_num + 1)).fill(0);
        }
        this.#FogColNum = colNum;
    }
    lightDEGChange(pos, deg) {
        if (!this.#LightDEG) {
            return;
        }
        this.#LightDEG[pos] += Math.floor(deg);
    }
    fogBlowAway(length = 15000) {
        if (!this.#FogBlowTag) {
            for (let i = 0; i < (level.column_num + 1) * level.row_num; i++) {
                this.lightDEGChange(i, 2);
            }
        }
        this.#FogBlowInterval = Math.max(this.#FogBlowInterval, length);
    }
}
_a = Level;
export default Level;
class Sun {
    static src = "../static/images/interface/sun.png";
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
class SpriteAnimation {
    #x;
    #y;
    #src;
    #frames;
    #tick = 0;
    vertical;
    function;
    zIndex;
    isSvg;
    scale;
    constructor(x, y, src, frames, options) {
        if (x == null || y == null || src == null || frames == null) {
            throw new Error(`Certain parameter(s) not specified.`);
        }
        this.#x = x;
        this.#y = y;
        this.#src = src;
        this.#frames = frames;
        this.vertical = options?.vertical || false;
        this.function = options?.function;
        this.zIndex = Math.min(options?.zIndex || level.column_num * level.row_num, level.column_num * level.row_num);
        this.isSvg = options?.isSvg || false;
        this.scale = options?.scale || 1;
    }
    render(ctx) {
        const img = GEH.requestDrawImage(this.isSvg ? `${this.#src}/${this.#tick}.svg` : this.#src);
        if (img) {
            if (this.isSvg) {
                ctx.drawImage(img, this.#x, this.#y, img.width * this.scale, img.height * this.scale);
            }
            else {
                if (this.vertical) {
                    const offsetX = img.width;
                    const offsetY = img.height / this.#frames;
                    ctx.drawImage(img, 0, offsetY * this.#tick, offsetX, offsetY, this.#x, this.#y, offsetX, offsetY);
                }
                else {
                    const offsetX = img.width / this.#frames;
                    const offsetY = img.height;
                    ctx.drawImage(img, offsetX * this.#tick, 0, offsetX, offsetY, this.#x, this.#y, offsetX, offsetY);
                }
            }
            if (this.#tick === this.#frames - 1) {
                if (this.function) {
                    this.function();
                }
                return true;
            }
            else {
                this.#tick++;
                return false;
            }
        }
    }
}
class GameBattlefield extends HTMLElement {
    static COUNTDOWN = "../static/images/interface/countdown.png";
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
    appendChild(node) {
        if (this.shadowRoot) {
            return this.shadowRoot.appendChild(node);
        }
        else {
            throw `Initialization failed.`;
        }
    }
    constructor(Parent = null) {
        super();
        this.#Parent = Parent;
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
                background-image: url("../static/images/flag.svg");
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
                ;
                font-weight: 600;
                transform: scale(0.96);
            }
            
            #BossBar::before {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 200%;
                background: radial-gradient(100% 225% at 100% 0%, #FF0000 0%, #000000 100%), linear-gradient(236deg, #00C2FF 0%, #000000 100%), linear-gradient(135deg, #CDFFEB 0%, #CDFFEB 36%, #009F9D 36%, #009F9D 60%, #07456F 60%, #07456F 67%, #0F0A3C 67%, #0F0A3C 100%);
                content: "";
                animation: boss 8s infinite ease-in-out;
                background-blend-mode: overlay, hard-light, normal;
            }
            
            @keyframes boss {
                0%, 100% {
                    opacity: 0;
                    filter: blur(6px);
                }
            
                20% {
                    opacity: 1;
                }
            
                0% {
                    transform: rotate(0) scale(1);
                }
            
                100% {
                    transform: rotate(360deg) scale(1.5);
                }
            
                50% {
                    opacity: 1;
                    transform: rotate(360deg) scale(2) translateX(-50%);
                    filter: blur(20px);
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
                background-image: url("../static/images/shovel.svg");
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
                background-image: url("../static/images/exit.svg");
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
                background-image: url("../static/images/sunbar.svg");
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
                background-image: url("../static/images/hugewave.png");
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
                background-image: url("../static/images/finalwave.png");
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
                background-image: url("../static/images/interface/icons/forward.svg");
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
                background-image: url("../static/images/award.svg");
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
                background-image: url("../static/images/items/coin.webp");
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
                background-image: url("../static/images/defeat_2.png");
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
                background-image: url("../static/images/defeat_1.png");
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
        const ctx = this.Canvas.getContext('2d');
        if (ctx) {
            ctx.scale(GEH.scale, GEH.scale);
        }
        this.FrequentCanvas.width = document.documentElement.clientWidth;
        this.FrequentCanvas.height = document.documentElement.clientHeight;
        this.FrequentCanvas.style.zIndex = "3";
        this.FrequentCanvas.style.pointerEvents = "none";
        const fctx = this.FrequentCanvas.getContext('2d');
        if (fctx) {
            fctx.scale(GEH.scale, GEH.scale);
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
        this.Cards.id = "Cards";
        this.SunBar.addEventListener('animationend', () => {
            this.SunBar.style.animation = "none";
        });
        this.Exit.addEventListener('click', () => {
            GEH.requestPlayAudio("dida");
            EventHandler.backgroundMusic.pause();
            cancelAnimationFrame(level.levelTimer);
            WarnMessageBox({
                Title: `${PAUSED}`,
                Text: `${GAME_ERROR_CODE_010}`,
                ButtonLabelYes: `${GAME_UI_BUTTON_004}`,
                ButtonLabelNo: `${CONTINUE}`,
                ButtonFuncYes: () => {
                    level.exit();
                    level = null;
                },
                ButtonFuncNo: () => {
                    EventHandler.backgroundMusic.play();
                    level.gameEventsHandlerFunc();
                },
            });
        });
        this.Shovel.addEventListener('click', ev => this.#shovel(ev));
        this.addEventListener("mousemove", (ev) => {
            this.#Cursor.x = ev.clientX / GEH.scale;
            this.#Cursor.y = ev.clientY / GEH.scale;
        });
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
            src: "../static/images/interface/shovel/default.png",
            offset: [-15, -25],
            frames: 1,
            func: () => {
                this.Shovel.style.backgroundColor = "rgba(255,255,255,.64)";
                return true;
            },
            successFunc: ({ positionX, positionY }) => {
                const x = (positionX * level.row_gap + level.column_start - 15);
                const y = (positionY * level.column_gap + level.row_start - 25);
                level.createSpriteAnimation(x, y, "../static/images/interface/shovel/shovel.png", 7);
                if (level.Foods[positionY * level.column_num + positionX] != null) {
                    level.Foods[positionY * level.column_num + positionX].shovel();
                    if (level.Foods[positionY * level.column_num + positionX].water) {
                        this.playPlantAnimation(1, positionX, positionY);
                        return true;
                    }
                }
                this.playPlantAnimation(0, positionX, positionY);
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
            level.createSpriteAnimation(x, y, "../static/images/interface/smoke", 4, {
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
            level.createSpriteAnimation(x, y, "../static/images/interface/spray", 4, {
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
        const ctx = this.FrequentCanvas.getContext('2d');
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
        const { positionX, positionY } = { positionX: Math.floor(EventHandler.getPositionX(this.#Cursor.x)),
            positionY: Math.floor(EventHandler.getPositionY(this.#Cursor.y)) };
        if (positionX >= 0 && positionX < level.column_num
            && positionY >= 0 && positionY < level.row_num) {
            if (this.#Cursor.origin.func({ positionX, positionY })) {
                this.#Cursor.origin.successFunc({ positionX, positionY });
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
            if (IsForwardWaves) {
                this.Progress.style.width = (((WaveTag - ForwardWaveNum)
                    / (WaveNum - 1 - ForwardWaveNum)) * 184 + 20) + "px";
            }
            else {
                this.Progress.style.width = (((WaveTag) / (WaveNum - 1)) * 184 + 20) + "px";
            }
        }
    };
    showHugeWave = (HugeWaveTag) => {
        this.WaveNum.innerText = HugeWaveTag.toString();
        const HugeWave = document.createElement('div');
        HugeWave.id = "HugeWave";
        this.appendChild(HugeWave);
        setTimeout(() => {
            HugeWave.remove();
        }, 1600);
    };
    showFinalWave = (HugeWaveTag) => {
        this.WaveNum.innerText = HugeWaveTag.toString();
        const FinalWave = document.createElement('div');
        FinalWave.id = "FinalWave";
        this.appendChild(FinalWave);
        setTimeout(() => {
            FinalWave.remove();
        }, 1600);
    };
    updateBackground = (backgroundImage, Cards, SunNum) => {
        this.#TotalHitPoints = 0;
        const ctx = this.Canvas.getContext('2d');
        const background = GEH.requestDrawImage(backgroundImage);
        if (ctx && background) {
            ctx.drawImage(background, 80, 0, 954, 600, 0, 0, 954, 600);
            level.mapMove();
            Cards.forEach((value, index) => {
                value.cooldownProcess();
            });
        }
    };
    updateMapGrid = (mapGrid) => {
        const ctx = this.Canvas.getContext('2d');
        if (mapGrid) {
            const { layer_0, layer_1, layer_2 } = mapGrid;
            if (layer_2) {
                layer_2.behavior();
                const img = GEH.requestDrawImage(layer_2.entity);
                if (ctx && img) {
                    ctx.drawImage(img, layer_2.width * layer_2.tick, 0, layer_2.width, layer_2.height, layer_2.x, layer_2.y, layer_2.width, layer_2.height);
                }
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
                    if (ctx && img) {
                        ctx.drawImage(img, layer_0.x, layer_0.y);
                    }
                }
            }
            if (layer_1) {
                layer_1.behavior();
                if (layer_1) {
                    if (layer_1.remainTime != null) {
                        layer_1.remainTime -= 100;
                    }
                    const img = GEH.requestDrawImage(layer_1.entity);
                    if (ctx && img) {
                        ctx.drawImage(img, layer_1.width * layer_1.tick, 0, layer_1.width, layer_1.height, layer_1.x, layer_1.y, layer_1.width, layer_1.height);
                    }
                    if (layer_1) {
                        layer_1.CreateOverlayAnim();
                    }
                }
            }
            if (layer_0) {
                layer_0.behavior();
                const img = GEH.requestDrawImage(layer_0.entity);
                if (ctx && img) {
                    ctx.drawImage(img, layer_0.width * layer_0.tick, 0, layer_0.width, layer_0.height, layer_0.x, layer_0.y, layer_0.width, layer_0.height);
                }
                if (layer_0) {
                    layer_0.CreateOverlayAnim();
                }
            }
        }
    };
    updateEnemies = (mouse, elapsed, miceTemp, airLaneTemp) => {
        const ctx = this.Canvas.getContext('2d');
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
            let img = GEH.requestDrawImage(mouse.entity);
            if (img) {
                let effect = null;
                if (mouse.freezing || mouse.frozen) {
                    effect = "freezing";
                }
                else if (mouse.getDamagedTag > 0) {
                    effect = "damaged";
                }
                if (effect) {
                    const effectImg = GEH.requestDrawImage(mouse.entity, effect);
                    if (effectImg) {
                        img = effectImg;
                    }
                }
                if (ctx)
                    ctx.drawImage(img, mouse.width * Math.floor(mouse.tick), 0, mouse.width, mouse.height, mouse.x, mouse.y, mouse.width, mouse.height);
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
    updateForeground = () => {
    };
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
    remove() {
        document.removeEventListener('keydown', this.#shortCutHandler);
        super.remove();
    }
}
customElements.define('game-battlefield', GameBattlefield);
