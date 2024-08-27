import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class ChampagneIsland extends Level {
    static NAME = "香槟岛（陆）";
    static TIME = 1;
    static REWARDS = 800;
    static BACKGROUND = "../static/images/interface/background_4.jpg";

    constructor() {
        super();
        this.StartWaveCreate();
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 5, 0, 1);
        this.waveCreate(1, 4, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2, 1);
        this.waveCreate(1, 2);
        this.waveCreate(9, 2, 1);
        this.waveCreate(1, 2);
        this.waveCreate(11, 1, 1);
        this.waveCreate(0, 4);
        this.waveCreate(1, 2);
        this.waveCreate(8, 1, 1);
        this.waveCreate(1, 2);
        this.waveCreate(10, 2, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 1, 1);
        this.waveCreate(10, 2, 1);
        this.waveCreate(0, 6, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(11, 1);
        this.waveCreate(8, 2, 1);
        this.waveCreate(10, 2, 1);
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