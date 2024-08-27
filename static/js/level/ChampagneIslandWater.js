import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class ChampagneIslandWater extends Level {
    static NAME = "香槟岛（水）";
    static SUGGESTED_TYPE = 0;
    static TIME = 1;
    static REWARDS = 900;
    static BACKGROUND = "../static/images/interface/background_5.jpg";
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
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(2, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1);
        this.waveCreate(5, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(2, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(4, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);
        this.waveCreate(2, 3);
        this.waveCreate(5, 1);
        this.waveCreate(13, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(2, 1);
        this.waveCreate(5, 3, 1);
        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1);
        this.waveCreate(5, 2);
        this.waveCreate(12, 1);
        this.waveCreate(13, 2, 1);

        this.Load();
    }

    Enter() {
        this.waterLineGenerate([0, 0, 1, 1, 1, 0, 0]);

        for (let i = 18; i < 45; i++) {
            this.Foods[i].water = true;
        }

        this.PrePlant(9, 1, 2);
        this.PrePlant(9, 1, 3);
        this.PrePlant(9, 1, 4);
        this.PrePlant(13, 1, 1);
        this.PrePlant(13, 1, 2);
        this.PrePlant(13, 1, 3);
        this.PrePlant(13, 1, 4);
        this.PrePlant(13, 1, 5);

        GEH.requestBackMusicChange(2);

        this.createWaveFlag();
        this.setGuardian();
    }

    mapMove() {
        const ANIM = this.constructor.MAP_ANIMATION;
        const IMG = GEH.requestDrawImage(ANIM.SRC);
        if (IMG) {
            this.Battlefield.Canvas.getContext('2d').drawImage(IMG,
                0, ANIM.TICK * ANIM.HEIGHT,
                ANIM.WIDTH, ANIM.HEIGHT,
                ANIM.X, ANIM.Y,
                ANIM.WIDTH, ANIM.HEIGHT);
            ANIM.TICK = (ANIM.TICK + 1) % ANIM.FRAMES;
        }
    }
}