import { GEH } from "../Core.js";
import Level from "../Level.js";

export default class CurryIslandNight extends Level {
    static NAME = "咖喱岛（夜）";
    static SUGGESTED_TYPE = 0;
    static TIME = 1;
    static REWARDS = 1500;
    static BACKGROUND = "../static/images/interface/background_12.jpg";
    static MAP_ANIMATION = {
        SRC: "../static/images/interface/water_1.png",
        X: 305,
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

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(3, 1);
        this.waveCreate(5, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(5, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(5, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 3);
        this.waveCreate(11, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(3, 1);
        this.waveCreate(5, 2);
        this.waveCreate(8, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(13, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(5, 2);
        this.waveCreate(11, 1);
        this.waveCreate(17, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(1, 1);
        this.waveCreate(3, 1);
        this.waveCreate(5, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(3, 2);
        this.waveCreate(5, 2, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(8, 1);
        this.waveCreate(11, 1);
        this.waveCreate(13, 2);
        this.waveCreate(17, 1);
        this.waveCreate(20, 2);
        this.waveCreate(21, 2, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(2);
        this.waterLineGenerate([0, 0, 1, 1, 1, 0, 0]);
        for (let i = 18; i < 45; i++) {
            this.Foods[i].water = true;
        }

        this.fogSet(4);

        this.PrePlant(9, 1, 2);
        this.PrePlant(9, 1, 3);
        this.PrePlant(9, 1, 4);
        this.PrePlant(13, 1, 2);
        this.PrePlant(13, 1, 3);
        this.PrePlant(13, 1, 4);
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