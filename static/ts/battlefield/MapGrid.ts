import { Food } from "../Foods.js";
export default class MapGrid<T extends Food> {
    static typeShield =
        new Set(["watermelonrind", "toast", "chocolatebread"]);
    static protected = new Set(["player"]);
    #layers: Array<T | null | undefined> = [];
    water = false;
    lava = false;
    noPlace = false;
    get layers() {
        return [this.#layers[1],
        this.#layers[0],
        this.#layers[2]];
    }
    get layer_0() {
        return this.#layers[0];
    }
    set layer_0(value) {
        this.#layers[0] = value;
    }
    get layer_1() {
        return this.#layers[1];
    }
    set layer_1(value) {
        this.#layers[1] = value;
    }
    get layer_2() {
        return this.#layers[2];
    }
    set layer_2(value) {
        this.#layers[2] = value;
    }
    get ignored() {
        return this.layer_0?.ignored || this.layer_1?.ignored;
    }

    get hasTarget() {
        return (this.layer_1?.attackable && !this.layer_1.short)
            || (this.layer_0?.attackable && !this.layer_0.short)
            || (this.layer_2?.attackable && !this.layer_2.short);
    }

    get hasCrashTarget() {
        return this.layer_1?.attackable
            || this.layer_0?.attackable
            || this.layer_2?.attackable;
    }

    constructor(water = false, lava = false) {
        this.water = water;
        this.lava = lava;
    }

    shovel() {
        if (this.#layers[1]?.canShovel) {
            this.#layers[1].remove();
            this.#layers[1] = undefined;
            return true;
        }
        else if (this.#layers[0]?.canShovel) {
            this.#layers[0].remove();
            this.#layers[0] = null;
            return true;
        }
        else if (this.#layers[2]?.canShovel) {
            if (this.#layers[1]?.constructor.name && MapGrid.protected.has(this.#layers[1].constructor.name)) {
                return false;
            }
            this.#layers[2].remove();
            this.#layers[2] = null;
            return true;
        }
        return false;
    }

    getCrashDamaged(value = 20, origin = null) {
        for (const layer of this.layers) {
            if (layer?.attackable) {
                const health = layer.health;
                layer.getCrashDamaged(value, origin);
                value -= health;
                if (value <= 0) {
                    return true;
                }
            }
        }
        return true;
    }

    getDamaged(value = 20, origin = null) {
        for (const layer of this.#layers) {
            if (layer?.attackable) {
                const health = layer.health;
                layer.getDamaged(value, origin);
                value -= health;
                if (value <= 0) {
                    return true;
                }
            }
        }
        return true;
    }

    getShieldType() {
        for (const layer of this.#layers) {
            if (layer && MapGrid.typeShield.has(layer.constructor.name)) {
                return layer;
            }
        }
        return null;
    }

    getThrown(value = 20) {
        for (const layer of this.layers) {
            if (layer) {
                layer.getDamaged(value);
                return true;
            }
        }
        return false;
    }

    crashRemove() {
        for (const [index, layer] of this.#layers.entries()) {
            if (layer?.attackable) {
                if (!MapGrid.protected.has(layer.constructor.name)) {
                    layer.remove();
                    this.#layers[index] = null;
                }
            }
        }
        return true;
    }
}