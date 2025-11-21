import EventHandler from "../eventhandler/EventHandler.js";
import { GEH } from "../Core.js";
import Level, { level } from "../Level.js";

export default class MarshmallowSky extends Level {
    static NAME = "棉花糖天空";
    static SUGGESTED_TYPE = 1;
    static BACKGROUND = "/images/interface/background_20.jpg";
    cloudPosition = [];
    cloudCavityGeneratePos = -1;
    cloudCavityPosition = [];

    constructor() {
        super();
        this.StartWaveCreate();
    }

    cloudLineGenerate(arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === 1) {
                let front = null;
                for (let j = 0; j < 7; j++) {
                    const cloud = new Cloud(i, j % 2);
                    if (j === 0) {
                        front = cloud;
                        this.cloudPosition.push(cloud);
                    }
                    cloud.top = (level.row_start + (level.column_gap + 0.6) * i + 11);
                    cloud.left = level.column_start + level.row_gap * (j + 2);
                    front.next = cloud;
                    front = cloud;
                }
            }
        }
    }

    cloudCavityGenerate = () => {
        this.cloudCavityGeneratePos = Math.floor(Math.random() * this.cloudPosition.length);
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.Load();
    }

    mapMove() {
        this.cloudCavityPosition = [];
        for (let i = 0; i < this.cloudPosition.length; i++) {
            let front = this.cloudPosition[i];
            for (let j = 0; j < 7; j++) {
                if (front.cavity) {
                    this.cloudCavityPosition.push(front);
                }
                if (front.move()) {
                    if (this.cloudCavityGeneratePos === i) {
                        front.cavity = true;
                        this.cloudCavityGeneratePos = -1;
                    }
                }
                front = front.next;
            }
        }
    }

    victory() {
        return false;
    }

    Enter() {
        const button = document.createElement('button');
        button.style.bottom = '1rem';
        button.style.right = '1rem';
        button.innerText = '产生空洞';
        button.addEventListener("click", this.cloudCavityGenerate);
        this.Battlefield.appendChild(button);
        GEH.requestBackMusicChange(9);
        this.cloudLineGenerate([1, 1, 1, 1, 1, 1, 1]);
        // this.firstWaveWait();
        this.setGuardian();
    }
}
export class Cloud {
    constructor(row, type = 0) {
        this.next = null;
        this.top = 0;
        this.left = 0;
        this.type = type;
        this.cavity = false;
        this.ctx = level.Battlefield.ctxBG;
        this.row = row;
        this.column = -1;
    }

    get entity() {
        return "/images/interface/cloud_" + this.type + ".png";
    }

    move() {
        this.left -= 1;
        this.column = Math.floor(EventHandler.getPositionX(this.left) + 1);

        if (this.left < level.column_start + level.row_gap - 6) {
            this.left += level.row_gap * 7;
            this.type = 1 - this.type;
            this.cavity = false;
            this.column = Math.floor(EventHandler.getPositionX(this.left) + 1);
            return true;
        }

        if (this.cavity && this.column >= 2 && level.Foods[this.row * level.column_num + this.column]) {
            level.Foods[this.row * level.column_num + this.column].crashRemove();
        } else if (!this.cavity && this.entity) {
            const entity = GEH.requestDrawImage(this.entity);
            if (entity) {
                this.ctx.drawImage(entity, this.left, this.top)
            }
        }

        return false;
    }
}