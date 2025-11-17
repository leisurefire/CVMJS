import { GEH } from "../Core.js";
import Level from "../Level.js";

export default class SaladIslandWater extends Level {
    static NAME = "色拉岛（水）";
    static SUGGESTED_TYPE = 0;
    static REWARDS = 600;
    static BACKGROUND = "../static/images/interface/background_2.jpg";
    static MAP_ANIMATION = {
        SRC: "../static/images/interface/water_0.png",
        X: 302,
        Y: 243,
        WIDTH: 548,
        HEIGHT: 184,
        TICK: 0,
        FRAMES: 18,
    }

    constructor() {
        super();
        this.StartWaveCreate();
    }

    CreateBossBar(target) {
        GEH.requestBackMusicChange(7);
        return super.CreateBossBar(target);
    }

    StartWaveCreate() {
        this.waveCreate(23, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(5, 2, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 2, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(2, 1, 1);
        this.waveCreate(1, 3);
        this.waveCreate(5, 2, 1);
        this.waveCreate(0, 3);
        this.waveCreate(2, 3);
        this.waveCreate(5, 3, 1);
        this.waveCreate(0, 5, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(5, 3, 1);
        this.waveCreate(0, 4, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1);
        this.waveCreate(7, 1);
        this.waveCreate(5, 3, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(1);
        this.waterLineGenerate([0, 0, 1, 1, 1, 0, 0]);

        for (let i = 18; i < 45; i++) {
            this.Foods[i].water = true;
        }

        this.PrePlant(9, 1, 2);
        this.PrePlant(9, 1, 3);
        this.PrePlant(9, 1, 4);
        this.PrePlant(0, 1, 1);
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);
        this.PrePlant(0, 1, 5);

        this.createWaveFlag();
        this.setGuardian();
    }

    mapMove() {
        const ANIM = this.constructor.MAP_ANIMATION;
        const IMG = GEH.requestDrawImage(ANIM.SRC);
        if (IMG) {
            const ctx = this.Battlefield.ctxBG;
            if (ctx) {
                ctx.drawImage(IMG,
                    0, ANIM.TICK * ANIM.HEIGHT,
                    ANIM.WIDTH, ANIM.HEIGHT,
                    ANIM.X, ANIM.Y,
                    ANIM.WIDTH, ANIM.HEIGHT);
            }
            ANIM.TICK = (ANIM.TICK + 1) % ANIM.FRAMES;
        }
    }
}