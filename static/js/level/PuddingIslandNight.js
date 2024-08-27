import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class PuddingIslandNight extends Level {
    static NAME = "布丁岛（夜）";
    static TIME = 1;
    static REWARDS = 1100;
    static BACKGROUND = "../static/images/interface/background_8.jpg";

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
        this.waveCreate(1, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2, 1);

        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(2, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(8, 2, 1);

        this.waveCreate(0, 2);
        this.waveCreate(2, 2);
        this.waveCreate(16, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1);
        this.waveCreate(17, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1);
        this.waveCreate(12, 1, 1);

        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(2, 1, 1);

        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1);
        this.waveCreate(8, 1);
        this.waveCreate(17, 1, 1);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(2);
        this.PrePlant(13, 1, 2);
        this.PrePlant(13, 1, 3);
        this.PrePlant(13, 1, 4);
        this.ratNestSummon();
        this.createWaveFlag();
        this.setGuardian();
    }

    nextWave() {
        super.nextWave();
        if (this.WaveTag === 6 || this.WaveTag === 8 || this.WaveTag === 12) {
            this.ratNestSummon();
        }
        return true;
    }
}