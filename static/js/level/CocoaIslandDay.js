import { GEH } from "../Core.js";
import Level from "../Level.js";

export default class CocoaIslandDay extends Level {
    static NAME = "可可岛（日）";
    static SUGGESTED_TYPE = 0;
    static REWARDS = 1200;
    static BACKGROUND = "/images/interface/background_9.jpg";

    constructor() {
        super();
        this.StartWaveCreate();
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 2, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(2, 1);
        this.waveCreate(5, 2, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(5, 2);
        this.waveCreate(20, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(2, 2);
        this.waveCreate(5, 1);
        this.waveCreate(7, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 1);
        this.waveCreate(5, 2);
        this.waveCreate(18, 1, 1);

        this.waveCreate(1, 3);
        this.waveCreate(5, 2);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(5, 1);
        this.waveCreate(18, 1);
        this.waveCreate(20, 1, 1);

        this.waveCreate(0, 1);
        this.waveCreate(5, 2);
        this.waveCreate(7, 1);
        this.waveCreate(15, 1, 1);

        this.waveCreate(1, 2);
        this.waveCreate(2, 1);
        this.waveCreate(5, 3, 1);

        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(5, 2);
        this.waveCreate(7, 2, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(5, 3);
        this.waveCreate(7, 2);
        this.waveCreate(15, 1);
        this.waveCreate(18, 1);
        this.waveCreate(20, 2, 1);

        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(1);
        this.waterLineGenerate([1, 1, 0, 0, 0, 1, 1]);
        for (let i = 0; i < 18; i++) {
            this.Foods[i].water = true;
        }
        for (let i = 45; i < 63; i++) {
            this.Foods[i].water = true;
        }
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);

        this.createWaveFlag();
        this.setGuardian();
    }
}