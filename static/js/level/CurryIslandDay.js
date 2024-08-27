import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class CurryIslandDay extends Level {
    static NAME = "咖喱岛（日）";
    static REWARDS = 1400;
    static BACKGROUND = "../static/images/interface/background_11.jpg";

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

        this.waveCreate(0, 2);
        this.waveCreate(3, 1, 1);

        this.waveCreate(1, 3);
        this.waveCreate(3, 1, 1);

        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(9, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(2, 2);
        this.waveCreate(3, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(4, 1);
        this.waveCreate(18, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 1);
        this.waveCreate(11, 1, 1);

        this.waveCreate(1, 2);
        this.waveCreate(1, 2);
        this.waveCreate(0, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(15, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(11, 1, 1);

        this.waveCreate(1, 2);
        this.waveCreate(3, 1);
        this.waveCreate(9, 1);
        this.waveCreate(13, 2, 1);

        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1);
        this.waveCreate(9, 1);
        this.waveCreate(11, 1);
        this.waveCreate(13, 1);
        this.waveCreate(19, 1);
        this.waveCreate(21, 1, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(1);
        this.fogSet(4);
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);

        this.createWaveFlag();
        this.setGuardian();
    }
}