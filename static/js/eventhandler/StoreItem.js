"use strict";
import { getFoodDetails } from "../Foods.js";
import { i18n } from "../i18n/index.js";
import { MaterialButton } from "../Core.js";
export class StoreItem {
    entity = document.createElement("div");
    item_img = document.createElement("img");
    item_text = document.createElement("p");
    price;
    detail;
    constructor(type) {
        this.detail = getFoodDetails(type);
        this.price = this.detail.price || 900;
        this.#initializeElements();
        this.#attachEventListeners();
    }
    #initializeElements() {
        // 使用静态方法获取路径
        const getStaticPath = (path) => {
            const cleanPath = path.replace(/^\/+/, '');
            const base = location.pathname.includes('/CVMJS/')
                ? `${location.origin}/CVMJS/static/`
                : `${location.origin}/static/`;
            return base + cleanPath;
        };
        this.item_img.src = getStaticPath(`images/cards/${this.detail.name}.png`);
        this.item_text.innerText = this.price.toString();
        this.entity.appendChild(this.item_img);
        this.entity.appendChild(this.item_text);
        const storeBox = document.getElementById('storeBox');
        if (storeBox) {
            storeBox.appendChild(this.entity);
        }
    }
    #attachEventListeners() {
        this.entity.onmouseenter = () => this.#handleMouseEnter();
        this.entity.onmouseleave = () => this.#handleMouseLeave();
    }
    #handleMouseEnter() {
        const storeBox = document.getElementById('storeBox');
        if (!storeBox)
            return;
        this.item_img.style.boxShadow = "white 0 0 0 4px";
        const { box_x, box_y } = this.#createHighlightBoxes();
        storeBox.appendChild(box_x);
        storeBox.appendChild(box_y);
        // 使用 requestAnimationFrame 确保 DOM 更新后再应用动画
        requestAnimationFrame(() => {
            this.#animateHighlightBoxes(box_x, box_y);
        });
    }
    #createHighlightBoxes() {
        const box_x = document.createElement('div');
        const box_y = document.createElement('div');
        box_x.id = 'storeItemBoxX';
        box_y.id = 'storeItemBoxY';
        // 设置初始位置和样式
        Object.assign(box_x.style, {
            top: `${this.entity.offsetTop - 6}px`,
            left: `${this.entity.offsetLeft}px`,
            height: `${this.entity.offsetHeight}px`,
            opacity: '0'
        });
        Object.assign(box_y.style, {
            width: `${this.entity.offsetWidth - 14}px`,
            top: `${this.entity.offsetTop - 6}px`,
            left: `${this.entity.offsetLeft}px`,
            opacity: '0'
        });
        return { box_x, box_y };
    }
    #animateHighlightBoxes(box_x, box_y) {
        setTimeout(() => {
            Object.assign(box_x.style, {
                left: "24px",
                width: 'calc(100% - 64px)',
                opacity: "1",
                filter: "blur(0)"
            });
            Object.assign(box_y.style, {
                top: '18px',
                height: 'calc(100% - 48px)',
                opacity: "1",
                filter: "blur(0)"
            });
        }, 100);
    }
    #handleMouseLeave() {
        document.getElementById('storeItemBoxX')?.remove();
        document.getElementById('storeItemBoxY')?.remove();
        this.item_img.style.boxShadow = "transparent 0 0 0 2px";
    }
    /**
     * 创建购买确认对话框
     * @param onPurchase 购买回调函数
     */
    createPurchaseDialog(onPurchase) {
        const getStaticPath = (path) => {
            const cleanPath = path.replace(/^\/+/, '');
            const base = location.pathname.includes('/CVMJS/')
                ? `${location.origin}/CVMJS/static/`
                : `${location.origin}/static/`;
            return base + cleanPath;
        };
        const box = document.createElement("div");
        const div = document.createElement("div");
        const h2 = document.createElement("h2");
        const img = document.createElement('img');
        const p = document.createElement("p");
        const button = new MaterialButton(`${i18n.t("OK")}`, onPurchase, false);
        box.className = "store_purchase";
        img.src = this.item_img.src;
        h2.innerHTML = `${i18n.t("PURCHASE")} <span style='font-weight: 600'>${this.detail.cName}</span>`;
        p.innerText = `${this.price}`;
        div.appendChild(h2);
        div.appendChild(img);
        div.appendChild(p);
        div.appendChild(button);
        box.appendChild(div);
        box.addEventListener('click', () => {
            div.style.animation = "purchaseRemove 0.12s cubic-bezier(0.4, 0, 0.2, 1)";
            div.addEventListener("animationend", () => box.remove());
        });
        document.body.appendChild(box);
    }
}
