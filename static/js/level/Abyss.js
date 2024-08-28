import { GEH } from "../Core.js";
import EventHandler from "../EventHandler.js";
import Level, { level } from "../Level.js";

export default class Abyss extends Level {
    static NAME = "深渊";
    static SUGGESTED_TYPE = 0;
    static WAVES = 9;
    static REWARDS = 3200;
    static BACKGROUND = "../static/images/interface/background_13.jpg";
    static MAP_ANIMATION = {
        SRC: "../static/images/interface/water_2.png",
        X: 36,
        Y: 222,
        WIDTH: 834,
        HEIGHT: 230,
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
        this.waveCreate(1, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(2, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(9, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(3, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1, 0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1);
        this.waveCreate(5, 1);
        this.waveCreate(8, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(2, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 1);
        this.waveCreate(7, 1);
        this.waveCreate(9, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(5, 2);
        this.waveCreate(11, 1, 1);

        this.waveCreate(1, 2);
        this.waveCreate(5, 2);
        this.waveCreate(8, 1);
        this.waveCreate(9, 2);
        this.waveCreate(17, 1, 1);

        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(5, 1);
        this.waveCreate(11, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(8, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(5, 2);
        this.waveCreate(17, 1);
        this.waveCreate(22, 1, 1);

        this.waveCreate(2, 2);
        this.waveCreate(3, 2);
        this.waveCreate(5, 1);
        this.waveCreate(11, 2);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2);
        this.waveCreate(5, 3);
        this.waveCreate(8, 2);
        this.waveCreate(11, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2);
        this.waveCreate(22, 1, 1);

        this.waveCreate(1, 3);
        this.waveCreate(4, 1);
        this.waveCreate(8, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1);
        this.waveCreate(16, 1);
        this.waveCreate(20, 1);
        this.waveCreate(22, 1, 1);

        this.waveCreate(2, 1);
        this.waveCreate(3, 2);
        this.waveCreate(8, 1);
        this.waveCreate(9, 1);
        this.waveCreate(18, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(8, 1);
        this.waveCreate(9, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1);
        this.waveCreate(18, 1);
        this.waveCreate(11, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(7, 2);
        this.waveCreate(16, 1);
        this.waveCreate(20, 1);
        this.waveCreate(22, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1);
        this.waveCreate(5, 2);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1, 0, 1);
        this.waveCreate(2, 1);
        this.waveCreate(3, 1);
        this.waveCreate(4, 1);
        this.waveCreate(7, 2);
        this.waveCreate(8, 1);
        this.waveCreate(9, 2);
        this.waveCreate(11, 2);
        this.waveCreate(16, 2);
        this.waveCreate(18, 2);
        this.waveCreate(20, 2);
        this.waveCreate(22, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1);
        this.waveCreate(7, 2);
        this.waveCreate(8, 2);
        this.waveCreate(11, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(2, 2);
        this.waveCreate(5, 2);
        this.waveCreate(10, 2);
        this.waveCreate(15, 1);
        this.waveCreate(16, 1);
        this.waveCreate(22, 2, 1);

        this.waveCreate(3, 2);
        this.waveCreate(7, 2);
        this.waveCreate(14, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 1);
        this.waveCreate(11, 1);
        this.waveCreate(19, 1);
        this.waveCreate(20, 1);
        this.waveCreate(22, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(13, 2);
        this.waveCreate(14, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(5, 2);
        this.waveCreate(12, 1);
        this.waveCreate(16, 2);
        this.waveCreate(20, 1);
        this.waveCreate(22, 1, 1);

        this.waveCreate(2, 1);
        this.waveCreate(4, 2);
        this.waveCreate(9, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2);
        this.waveCreate(22, 2, 1);

        this.waveCreate(3, 2, 0, 1);
        this.waveCreate(4, 2);
        this.waveCreate(7, 2);
        this.waveCreate(9, 2);
        this.waveCreate(10, 2);
        this.waveCreate(12, 2);
        this.waveCreate(14, 1);
        this.waveCreate(16, 2);
        this.waveCreate(17, 2);
        this.waveCreate(22, 2, 1);

        this.waveCreate(1, 3);
        this.waveCreate(4, 2);
        this.waveCreate(13, 2);
        this.waveCreate(15, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(2, 2);
        this.waveCreate(10, 2);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2);
        this.waveCreate(22, 2, 1);

        this.waveCreate(4, 2);
        this.waveCreate(11, 1);
        this.waveCreate(13, 2);
        this.waveCreate(14, 1);
        this.waveCreate(18, 2);
        this.waveCreate(20, 3, 1);

        this.waveCreate(4, 2);
        this.waveCreate(10, 2);
        this.waveCreate(14, 2);
        this.waveCreate(15, 2);
        this.waveCreate(19, 1);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 2);
        this.waveCreate(2, 3);
        this.waveCreate(11, 1);
        this.waveCreate(14, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 3);
        this.waveCreate(12, 1);
        this.waveCreate(15, 1);
        this.waveCreate(18, 2);
        this.waveCreate(20, 3);
        this.waveCreate(22, 2, 1);

        this.waveCreate(8, 2);
        this.waveCreate(10, 2);
        this.waveCreate(14, 1);
        this.waveCreate(17, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(1, 3, 0, 1);
        this.waveCreate(2, 2);
        this.waveCreate(4, 2);
        this.waveCreate(10, 2);
        this.waveCreate(12, 1);
        this.waveCreate(13, 2);
        this.waveCreate(14, 1);
        this.waveCreate(15, 2);
        this.waveCreate(17, 2);
        this.waveCreate(20, 3);
        this.waveCreate(22, 2, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(5);
        this.waterLineGenerate([0, 0, 1, 1, 1, 0, 0]);
        for (let i = 2; i < 5; i++) {
            for (let j = 0; j < 9; j++) {
                this.Foods[i * level.column_num + j].water = true;
            }
        }
        this.PrePlant(9, 0, 2);
        this.PrePlant(9, 0, 3);
        this.PrePlant(9, 0, 4);
        this.PrePlant(9, 1, 2);
        this.PrePlant(9, 1, 3);
        this.PrePlant(9, 1, 4);

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