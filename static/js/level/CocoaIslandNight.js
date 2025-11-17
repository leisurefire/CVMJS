import { GEH } from "../Core.js";
import Level from "../Level.js";

export default class CocoaIslandNight extends Level {
    static NAME = "可可岛（夜）";
    static SUGGESTED_TYPE = 0;
    static TIME = 1;
    static REWARDS = 1300;
    static BACKGROUND = "../CVMJS/static/images/interface/background_10.jpg";

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
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(5, 1, 1);

        this.waveCreate(1, 2, 0, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 2);
        this.waveCreate(7, 1);
        this.waveCreate(19, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(5, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 2);
        this.waveCreate(20, 1, 1);

        this.waveCreate(1, 3);
        this.waveCreate(5, 2);
        this.waveCreate(22, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 2);
        this.waveCreate(12, 1);
        this.waveCreate(13, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(5, 2);
        this.waveCreate(22, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(5, 2);
        this.waveCreate(7, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(1, 2, 0, 1);
        this.waveCreate(4, 1);
        this.waveCreate(5, 3);
        this.waveCreate(12, 1);
        this.waveCreate(13, 1);
        this.waveCreate(19, 1);
        this.waveCreate(20, 2);
        this.waveCreate(22, 1, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(2);
        this.waterLineGenerate([1, 1, 0, 0, 0, 1, 1]);
        for (let i = 0; i < 18; i++) {
            this.Foods[i].water = true;
        }
        for (let i = 45; i < 63; i++) {
            this.Foods[i].water = true;
        }
        this.PrePlant(13, 1, 2);
        this.PrePlant(13, 1, 3);
        this.PrePlant(13, 1, 4);
        this.createWaveFlag();
        this.setGuardian();
    }
}