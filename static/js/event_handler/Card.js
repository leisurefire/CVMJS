"use strict";
import { getFoodDetails } from "../Foods.js";
import { i18n } from "../i18n/index.js";
import { GEH } from "../Core.js";
import { level } from "../Level.js";
export default class Card extends HTMLElement {
    speed = 1;
    name;
    coolTime = 7500;
    star = 0;
    skillLevel = 0;
    cost = 50;
    #type = 0;
    #remainTime = 0;
    #entity = new Image();
    #details = document.createElement('div');
    #overlay = document.createElement('div');
    #style = document.createElement('style');
    #cost = document.createElement('span');
    constructor(type = 0, star = 0, skill_level = 0) {
        super();
        this.#initializeStyles();
        this.#initializeShadowDOM();
        this.#attachEventListeners();
        this.type = type;
        this.star = star;
        this.skillLevel = skill_level;
    }
    #initializeStyles() {
        Object.assign(this.style, {
            height: "3.5rem",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxShadow: "var(--shadow)",
            position: "relative",
        });
        this.#details.className = "game-card-details";
        this.#style.textContent = `
            :host(.disabled) img{ filter: brightness(50%); }
            :host(.notenough) span{ color: red; }
            img{
                width: 100%;
                height: 100%;
            }
            span{
                position: absolute;
                right: 0.75rem;
                bottom: 0.125rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            div{
                top: 0;
                left: 0;
                position: absolute;
                width: 100%;
                background-color: rgba(0,0,0,.32);
            }
        `;
    }
    #initializeShadowDOM() {
        this.attachShadow({ mode: "open" });
        if (this.shadowRoot) {
            this.shadowRoot.append(this.#style, this.#entity, this.#cost, this.#overlay);
        }
    }
    #attachEventListeners() {
        this.addEventListener('click', this.handleClick);
        this.addEventListener('mouseenter', this.showDetails);
        this.addEventListener('mouseleave', this.hideDetails);
    }
    get type() {
        return this.#type;
    }
    set type(value) {
        try {
            const detail = getFoodDetails(value);
            if (detail) {
                const { name, coolTime, cost } = detail;
                this.name = name;
                this.coolTime = coolTime;
                this.cost = cost;
                this.#cost.textContent = cost.toString();
                this.#entity.src = Card.getStaticPath(`images/cards/${this.name}.png`);
            }
        }
        catch (error) {
            console.error(`Failed to set card type: ${error}`);
        }
        this.#type = value;
    }
    get cooling() {
        return this.#remainTime > 0;
    }
    get remainTime() {
        return this.#remainTime;
    }
    set remainTime(value) {
        if (GEH.debug) {
            this.#remainTime = 0;
            return;
        }
        value = Math.max(value, 0);
        const percent = this.coolTime > 0 ? (value / this.coolTime * 100) : 0;
        this.#overlay.style.height = percent <= 5 ? '0' : `${percent}%`;
        this.#remainTime = value;
    }
    get detailsHTML() {
        const detail = getFoodDetails(this.type);
        if (!detail)
            return "";
        let text = "";
        if (level.SunNum >= this.cost) {
            if (this.cooling) {
                text += `<span>${i18n.t("GAME_ERROR_CODE_006")}</span>`;
            }
        }
        else {
            text += `<span>${i18n.t("GAME_ERROR_CODE_005")}</span>`;
        }
        text += `<strong>${detail.cName}</strong><br>${detail.description}`;
        if (detail.addCost && this.cost - detail.cost > 0) {
            text += `<br><span>${i18n.t("GAME_ERROR_CODE_007")}(${this.cost - detail.cost})</span>`;
        }
        return text;
    }
    showDetails = () => {
        const rect = this.getBoundingClientRect();
        Object.assign(this.#details.style, {
            left: `calc(${rect.x + rect.width}px + 1rem)`,
            top: `calc(${rect.y + rect.height / 2}px)`,
            zIndex: '11111'
        });
        this.#details.innerHTML = this.detailsHTML;
        level.Battlefield.appendChild(this.#details);
    };
    hideDetails = () => {
        this.#details.remove();
    };
    handleClick = (ev) => {
        if (level.Battlefield.Cursor.picked)
            return false;
        if (level.SunNum < this.cost && !GEH.debug) {
            level.Battlefield.SunBar.style.animation = `NOT_ENOUGH_SUN 0.64s cubic-bezier(0.4, 0, 0.2, 1)`;
            return false;
        }
        if (this.cooling)
            return false;
        GEH.requestPlayAudio("naka");
        const detail = getFoodDetails(this.type);
        if (!detail)
            return false;
        const handler = {
            src: Card.getStaticPath(`images/foods/${this.name}/idle.png`),
            slot: this,
            offset: detail.offset,
            frames: detail.idleLength,
            func: ({ positionX, positionY }) => {
                return detail.generate(positionX, positionY, this.star, this.skillLevel);
            },
            successFunc: () => {
                this.remainTime = this.coolTime;
            },
            failFunc: () => {
                level.SunNum += this.cost;
            }
        };
        if (!GEH.debug) {
            level.SunNum -= this.cost;
        }
        level.Battlefield.requestCursorTracking(ev, handler);
    };
    unselect() {
        this.remainTime = this.coolTime;
        this.#details.remove();
    }
    cooldownProcess() {
        const disabled = !GEH.debug && (level.Battlefield.Cursor.picked ||
            level.SunNum < this.cost ||
            this.cooling);
        this.classList.toggle('disabled', !!disabled);
        this.classList.toggle('notenough', !GEH.debug && level.SunNum < this.cost);
        if (this.cooling) {
            this.remainTime -= this.speed * 100;
        }
    }
    /**
     * 静态方法：获取静态资源路径
     */
    static getStaticPath(relativePath) {
        const path = relativePath.replace(/^\/+/, '');
        const base = location.pathname.includes('/CVMJS/')
            ? `${location.origin}/CVMJS/static/`
            : `${location.origin}/static/`;
        return base + path;
    }
}
