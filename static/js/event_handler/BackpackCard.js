"use strict";
var _a;
import { getFoodDetails } from "../Foods.js";
import { i18n } from "../i18n/index.js";
import { GEH, GameReadyPage } from "../Core.js";
import Card from "./Card.js";
export class BackpackCard {
    entity = document.createElement('img');
    anim = document.createElement('img');
    type = 0;
    star = 0;
    skillLevel = 0;
    animInside;
    card;
    animID;
    src;
    details;
    #chosen = false;
    #bagEntity = document.createElement('img');
    #animEntity = document.createElement('img');
    constructor(type = 0, star = 0, skillLevel = 0) {
        this.type = type;
        this.star = star;
        this.skillLevel = skillLevel;
        this.card = new Card(type, star, skillLevel);
        this.src = _a.getStaticPath(`images/cards/${this.card.name}.png`);
        this.#initializeElements();
        this.#attachEventListeners();
    }
    #initializeElements() {
        this.entity.src = this.src;
        this.#bagEntity.src = this.src;
        this.anim.src = this.src;
        this.#bagEntity.style.opacity = "0";
        this.anim.style.position = "absolute";
    }
    #attachEventListeners() {
        this.entity.addEventListener('mouseenter', this.HandleMouseEnter);
        this.entity.addEventListener('mouseleave', this.HandleMouseLeave);
        this.entity.addEventListener('click', this.#HandleMouseClick);
        this.#bagEntity.addEventListener("click", this.#HandleMouseClick);
    }
    get detail() {
        return getFoodDetails(this.type);
    }
    get rect() {
        return this.entity.getBoundingClientRect();
    }
    HandleMouseEnter = () => {
        if (GEH.inCompose || this.#chosen)
            return;
        this.details = GEH.requestCardDetailDisplay({ x: this.rect.left, y: this.rect.top + this.rect.height }, this.type, this.star, this.skillLevel);
    };
    HandleMouseLeave = () => {
        if (this.details) {
            this.details.remove();
            this.details = undefined;
        }
    };
    unselect() {
        this.#chosen = false;
        this.#bagEntity.style.opacity = "0";
        this.entity.style.filter = "none";
        this.entity.removeAttribute("selected");
        this.anim.remove();
        this.#bagEntity.remove();
        if (this.animID) {
            cancelAnimationFrame(this.animID);
        }
    }
    #ComposeHandleMouseClick() {
        const detail = getFoodDetails(this.type);
        if (!detail)
            return;
        this.#updateComposeInfo(detail);
        this.#setupComposeAnimation(detail);
    }
    #updateComposeInfo(detail) {
        const CInfoName = document.getElementById('CInfoName');
        if (CInfoName) {
            CInfoName.innerText = detail.cName;
        }
        const InfoDes = document.getElementById("CInfoDes");
        if (!InfoDes)
            return;
        const getIcon = (name) => {
            const icons = window.EventHandler?.icons;
            return icons?.get(name) || '';
        };
        InfoDes.innerHTML = `
            <a>${getIcon('type')}${detail.category}</a>
            <a>${getIcon('energy')}${detail.cost}${detail.addCost ? '+' : ''}</a>
            <a>${getIcon('cooltime')}${detail.coolTime / 1000}${i18n.t("SECOND")}</a>
            <br>
            ${detail.special ? `<li><span>${i18n.t("GAME_UI_TEXT_007")}</span><span>${detail.special}</span></li>` : ''}
            <li><span>${i18n.t("GAME_UI_TEXT_008")}</span><span style='color: #006400'>${detail.description}</span></li>
            <li><span>${i18n.t("GAME_UI_TEXT_009")}</span><span style='color: #ff7f50'>${detail.upgrade}</span></li>
            <li>${detail.story}</li>
            ${detail.storyContributor ? `<strong><span style='color: #a9a9a9'>${i18n.t("GAME_UI_TEXT_010")}&ensp;&ensp;${detail.storyContributor}</span></strong>` : ''}
            ${detail.artist ? `<strong><span style='color: #a9a9a9'>画&ensp;&ensp;&ensp;&ensp;师&ensp;&ensp;${detail.artist}</span></strong>` : ''}
        `;
    }
    #setupComposeAnimation(detail) {
        const CInfoBack = document.getElementById("CInfoBack");
        if (!CInfoBack)
            return;
        CInfoBack.style.backgroundImage = `url(${_a.getStaticPath(`images/interface/compose/${detail.type || 0}.png`)})`;
        CInfoBack.innerHTML = "";
        // 设置内部动画（如果有）
        if (detail.inside) {
            this.animInside = document.createElement("img");
            this.animInside.src = _a.getStaticPath(`images/foods/${detail.name}/idle_inside.png`);
            Object.assign(this.animInside.style, {
                position: "absolute",
                left: `${detail.offset[0] + 115}px`,
                top: `${detail.offset[1] + 40}px`
            });
            CInfoBack.appendChild(this.animInside);
        }
        // 设置主动画
        this.#animEntity.src = _a.getStaticPath(`images/foods/${detail.name}/idle.png`);
        this.#animEntity.onload = () => {
            const idleLength = detail.idleLength || 12;
            Object.assign(this.#animEntity.style, {
                objectPosition: "0 0",
                objectFit: "none",
                height: `${this.#animEntity.height}px`,
                width: `${this.#animEntity.width / idleLength}px`,
                left: `${detail.offset[0] + 115}px`,
                top: `${detail.offset[1] + 40}px`
            });
            CInfoBack.appendChild(this.#animEntity);
            this.#startComposeAnimation(detail.endLength || idleLength);
        };
    }
    #startComposeAnimation(frameCount) {
        if (GEH.composeAnimTimer != null) {
            cancelAnimationFrame(GEH.composeAnimTimer);
            clearInterval(GEH.composeAnimTimer);
        }
        let currentFrame = 0;
        const frameDuration = 100;
        let lastTime = performance.now();
        let accumulator = 0;
        const animate = (now) => {
            const deltaTime = now - lastTime;
            lastTime = now;
            accumulator += deltaTime;
            while (accumulator >= frameDuration) {
                this.#animEntity.style.objectPosition = `${-currentFrame * this.#animEntity.offsetWidth}px 0`;
                currentFrame = (currentFrame + 1) % frameCount;
                accumulator -= frameDuration;
            }
            GEH.composeAnimTimer = requestAnimationFrame(animate);
        };
        GEH.composeAnimTimer = requestAnimationFrame(animate);
    }
    #PrepareGameHandleMouseClick() {
        const GameCards = GameReadyPage.GameCards;
        if (this.#chosen) {
            this.#removeCardFromSelection();
        }
        else {
            this.#addCardToSelection(GameCards);
        }
    }
    #removeCardFromSelection() {
        const pos = GEH.cards.findIndex((card) => card === this.card);
        if (pos !== -1) {
            GEH.cards.splice(pos, 1);
        }
        this.unselect();
    }
    #addCardToSelection(GameCards) {
        if (GEH.cards.length >= GEH.maxCardNum) {
            const ToastBox = window.ToastBox;
            if (ToastBox)
                ToastBox(`最多携带${GEH.maxCardNum}张卡片`);
            return;
        }
        GameCards.appendChild(this.#bagEntity);
        const detail = getFoodDetails(this.type);
        if (detail) {
            this.card.cost = detail.cost;
        }
        this.#animateCardSelection();
        GEH.cards.push(this.card);
        this.entity.setAttribute("selected", "");
        this.entity.style.filter = "brightness(64%)";
        this.#chosen = true;
    }
    #animateCardSelection() {
        GameReadyPage.appendChild(this.anim);
        Object.assign(this.anim.style, {
            zIndex: "11111",
            position: "fixed",
            top: `${this.rect.top}px`,
            left: `${this.rect.left}px`,
            borderRadius: this.#bagEntity.style.borderRadius,
            height: `${this.rect.height}px`
        });
        const targetRect = this.#bagEntity.getBoundingClientRect();
        this.#performSmoothAnimation(targetRect);
    }
    #performSmoothAnimation(targetRect) {
        const startTop = this.rect.top;
        const startLeft = this.rect.left;
        const startHeight = 50;
        const deltaTop = startTop - targetRect.top;
        const deltaLeft = startLeft - targetRect.left;
        const deltaHeight = startHeight - this.#bagEntity.offsetHeight;
        const duration = 16; // frames
        const stepTop = deltaTop / duration;
        const stepLeft = deltaLeft / duration;
        const stepHeight = deltaHeight / duration;
        let frame = 0;
        let currentTop = startTop;
        let currentLeft = startLeft;
        let currentHeight = startHeight;
        const animate = () => {
            this.animID = requestAnimationFrame(() => {
                frame++;
                currentTop -= stepTop;
                currentLeft -= stepLeft;
                currentHeight -= stepHeight;
                Object.assign(this.anim.style, {
                    top: `${currentTop}px`,
                    left: `${currentLeft}px`,
                    height: `${currentHeight}px`
                });
                if (frame >= duration) {
                    if (this.animID)
                        cancelAnimationFrame(this.animID);
                    this.anim.remove();
                    this.#bagEntity.style.opacity = "1";
                    return;
                }
                animate();
            });
        };
        animate();
    }
    #HandleMouseClick = () => {
        GEH.requestPlayAudio("naka");
        if (this.details)
            this.details.remove();
        if (GEH.inCompose) {
            this.#ComposeHandleMouseClick();
        }
        else {
            this.#PrepareGameHandleMouseClick();
        }
    };
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
_a = BackpackCard;
