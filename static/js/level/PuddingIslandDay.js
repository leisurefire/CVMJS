import {GEH} from "../Core.js";
import Level from "../Level.js";

export default class PuddingIslandDay extends Level {
    static NAME = "布丁岛（日）";
    static REWARDS = 1000;
    static BACKGROUND = "../static/images/interface/background_7.jpg";

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
        this.waveCreate(0, 2);
        this.waveCreate(1, 1, 1);//召唤鼠洞
        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 1, 1);
        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1, 1);//鼠洞
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(4, 1);
        this.waveCreate(9, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(11, 1, 1);
        this.waveCreate(2, 1);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1);
        this.waveCreate(16, 1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2);
        this.waveCreate(9, 1);
        this.waveCreate(12, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(3, 3);
        this.waveCreate(11, 1, 1);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(4, 3, 1);
        this.waveCreate(2, 1, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(3, 1);
        this.waveCreate(3, 2);
        this.waveCreate(4, 2);
        this.waveCreate(9, 1);
        this.waveCreate(11, 1, 1);

        this.waveCreate()
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(1);
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);
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