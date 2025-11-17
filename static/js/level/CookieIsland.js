import { GEH } from "../Core.js";
import { getMouseDetails } from "../Mice.js";
import Level from "../Level.js";

export default class CookieIsland extends Level {
    static NAME = "曲奇岛";
    static REWARDS = 400;
    static BACKGROUND = "../CVMJS/static/images/interface/background_0.jpg";
    static HAS_FORWARD_WAVES = true;

    constructor() {
        super();
        this.SetRowNum(6);
        this.StartWaveCreate();
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 3, 1);
        this.waveCreate(1, 1);
        this.waveCreate(0, 2, 1);
        this.waveCreate(0, 3, 1);
        this.waveCreate(0, 5, 0, 1);
        this.waveCreate(1, 3, 1, 1);
        this.waveCreate(0, 3, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1, 1);
        this.waveCreate(0, 4);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 4);
        this.waveCreate(2, 1, 1);
        this.waveCreate(0, 3);
        this.waveCreate(1, 2, 1);
        this.waveCreate(0, 5, 0, 1);
        this.waveCreate(1, 3, 1);
        this.Load();
    }

    CreateBossBar(target) {
        GEH.requestBackMusicChange(7);
        return super.CreateBossBar(target);
    }

    ForwardWaveCreate() {
        GEH.requestBackMusicChange(3);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(1, 3);
        this.waveCreate(2, 2);
        this.waveCreate(11, 2, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(1, 3);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 3);
        this.waveCreate(11, 1, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(0, 3, 0, 1);
        this.waveCreate(1, 3);
        this.waveCreate(2, 3);
        this.waveCreate(3, 3);
        this.waveCreate(8, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2);
        this.waveCreate(3, 3, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 2);
        this.waveCreate(4, 1, 1);
        this.waveCreate(1, 3);
        this.waveCreate(2, 2);
        this.waveCreate(3, 2);
        this.waveCreate(8, 1, 1);
        this.waveCreate(0, 5);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2, 1);
        this.waveCreate(0, 2);
        this.waveCreate(1, 2);
        this.waveCreate(3, 2);
        this.waveCreate(4, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 2);
        this.waveCreate(2, 3);
        this.waveCreate(11, 1, 1);
        this.waveCreate(0, 1);
        this.waveCreate(1, 1);
        this.waveCreate(2, 2);
        this.waveCreate(3, 3, 1);
        this.waveCreate(0, 2, 0, 1);
        this.waveCreate(1, 5);
        this.waveCreate(2, 3);
        this.waveCreate(2, 3);
        this.waveCreate(8, 2);
        this.waveCreate(14, 1);
        this.waveCreate(23, 1, 1, 1);
    }

    BOSSWaveSummon() {
        getMouseDetails(0).summon();
        getMouseDetails(0).summon();
        getMouseDetails(1).summon();
        getMouseDetails(1).summon();
        getMouseDetails(2).summon();
        getMouseDetails(2).summon();
        getMouseDetails(3).summon();
        getMouseDetails(3).summon();
        getMouseDetails(8).summon();
        getMouseDetails(8).summon();
        getMouseDetails(11).summon();
    }

    Enter() {
        GEH.requestBackMusicChange(1);

        this.PrePlant(0, 1, 1);
        this.PrePlant(0, 1, 2);
        this.PrePlant(0, 1, 3);
        this.PrePlant(0, 1, 4);

        this.createWaveFlag();
        this.setGuardian();
    }
}