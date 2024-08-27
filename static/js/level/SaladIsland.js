import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class SaladIsland extends Level {
    static NAME = "色拉岛（陆）";
    static REWARDS = 500;
    static BACKGROUND = "../static/images/interface/background_1.jpg";

    constructor() {
        super();
        this.StartWaveCreate();
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);		//加入老鼠类型，数量，本波是否结束，本波是否为大波
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 3, 1);
        this.waveCreate(0, 5, 0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(3, 1, 1);
        this.waveCreate(0, 3, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 4, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 1, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(1);

        this.PrePlant(0, 1, 1);
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);
        this.PrePlant(0, 1, 5);

        this.createWaveFlag();
        this.setGuardian();
    }
}