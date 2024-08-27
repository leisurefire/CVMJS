import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class  MousseIsland extends Level {
    static NAME = "慕斯岛";
    static TIME = 1;
    static REWARDS = 700;
    static BACKGROUND = "../static/images/interface/background_3.jpg";

    constructor() {
        super();
        this.StartWaveCreate();
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1);
        this.waveCreate(3, 2, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(4, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1, 1);
        this.Load();

    }

    Enter() {
        GEH.requestBackMusicChange(2);

        this.PrePlant(13, 1, 1);
        this.PrePlant(13, 1, 2);
        this.PrePlant(13, 1, 3);
        this.PrePlant(13, 1, 4);
        this.PrePlant(13, 1, 5);

        this.createWaveFlag();
        this.setGuardian();
    }
}