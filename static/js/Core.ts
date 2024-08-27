"use strict";
import EventHandler, {getLevelDetails} from "./EventHandler.js";
import {
    CANCEL,
    DAYTIME,
    GAME_ERROR_CODE_008, GAME_ERROR_CODE_009,
    GAME_UI_BUTTON_002, GAME_UI_BUTTON_003,
    NIGHTTIME,
    RESELECT,
    START_GAME,
    WATERLINE
} from "./language/Chinese.js";
export const GEH = new EventHandler();
declare global {
    interface CanvasRenderingContext2D {
        fillRoundRect(x: number, y: number, width: number, height: number, radius: number): void;
    }
}
CanvasRenderingContext2D.prototype.fillRoundRect = function(x,y,width,height,radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.arcTo(x + width, y, x + width, y + radius, radius);
    this.lineTo(x + width, y + height - radius);
    this.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    this.lineTo(x + radius, y + height);
    this.arcTo(x, y + height, x, y + height - radius, radius);
    this.lineTo(x, y + radius);
    this.arcTo(x, y, x + radius, y, radius);
    this.closePath();
    this.fill();
}
export class MaterialButton extends HTMLElement{
    #text:string = '';
    private readonly func: Function|null;
    private options: { icon: boolean };
    get text(){
        return this.#text;
    }
    set text(value){
        this.#span.textContent = value;
        this.#text = value;
    }
    shadow = this.attachShadow({mode: 'open'});
    button = document.createElement('a');
    #span = document.createElement('span');
    #effect = document.createElement('div');
    stylesheet = document.createElement('style');
    constructor(text:string|null = null, func:Function|null = null, colored = true, options:{icon:boolean}|null = null){
        super();
        this.text = text!;
        this.func = func;
        this.options = {
            icon: options?.icon!,
        };
        const EFFECT_BACKGROUND_COLOR = colored ? "rgba(255, 255, 255, .24)" : "var(--main_color_48)";
        const BUTTON_BACKGROUND_COLOR = colored ? "var(--main_color)" : "var(--background)";
        const TEXT_COLOR = colored ? "white" : "var(--outline)";
        this.stylesheet.textContent = `
            div{
                z-index: 0;
                pointer-events: none;
                position: absolute;
                border-radius: 50%;
                background-color: ${EFFECT_BACKGROUND_COLOR};
                animation: BUTTON_EFFECT ease-in-out 0.24s forwards;
                transform: scale(0.25);
                transition: transform 1.2s ease-in-out;
                filter: blur(2rem);
            }
            @keyframes BUTTON_EFFECT {
                to{
                    opacity: 1;
                    transform: scale(1);
                }
            }
            a{  
                height: calc(100% - 1.5rem);
                width: calc(100% - 3rem);
                position: relative;
                font-weight: 600;
                display: inline-block;
                cursor: pointer;
                border: none;
                background-color: ${BUTTON_BACKGROUND_COLOR};
                border-radius: var(--box_radius_huge);
                font-size: 1rem;
                padding: 0.75rem 1.5rem;
                overflow: hidden;
                transition: all 0.24s ease-in-out;
                color: transparent;
            }
            a:hover{
                background-color: var(--main_color_48);
            }
            svg{
                display: inline-block;
                position: relative;
                z-index: 1;
                top: 0.125rem;
                height: 1rem;
                width: 1rem;
                pointer-events: none;
                transform: scale(1.25);
            }
            span{
                display: inline-block;
                z-index: 1;
                height: 100%;
                pointer-events: none;
                text-align: center;
                position: relative;
                left: 0;
                color: ${TEXT_COLOR};
            }
            span:nth-child(2){
                margin-left: 0.75rem;
            }
        `
        this.button.addEventListener("mouseup", ()=>{
            this.#effect.remove();
        })

        this.button.addEventListener('mouseout', ()=>{
            this.#effect.remove();
        })

        this.button.addEventListener('mousedown', (ev)=>{
            if(!this.button.querySelector('div')){
                const width = this.button.clientWidth;
                this.#effect.style.width = width * 2 + "px";
                this.#effect.style.height = width * 2 + "px";
                this.#effect.style.left = `calc(-${width + "px"} + ${ev.offsetX}px)`;
                this.#effect.style.top = `calc(-${width + "px"} + ${ev.offsetY}px)`;
                this.button.appendChild(this.#effect);
            }
        })

        this.button.addEventListener('click', ()=>{
            GEH.requestPlayAudio("dida");
            if(this.func){
                this.func();
            }
        })

        this.shadow.appendChild(this.stylesheet);
        this.shadow.appendChild(this.button);
        if(this.options?.icon){
            this.button.innerHTML += this.options.icon;
        }
        if(this.text){
            this.button.appendChild(this.#span);
        }
    }
}
customElements.define('material-button', MaterialButton);
export class MaterialIconButton extends MaterialButton{
    constructor(icon:boolean|null = null, func:Function|null = null, style = false) {
        super(null, func, false, {icon: icon!});
        this.stylesheet.textContent = `
            *{
                fill: white;
            }
            div{
                z-index: 0;
                pointer-events: none;
                position: absolute;
                border-radius: 50%;
                background-color: rgba(255,255,255,.48);
                animation: BUTTON_EFFECT ease-in-out 0.24s forwards;
                transform: scale(0.25);
                transition: transform 1.2s ease-in-out;
                filter: blur(1rem);
            }
            @keyframes BUTTON_EFFECT {
                to{
                    opacity: 1;
                    transform: scale(1);
                }
            }
            a{
                width: 2rem;
                height: 2rem;
                position: relative;
                display: inline-block;
                cursor: pointer;
                border: none;
                background-color: rgba(${style ? "255,255,255" : "0,0,0"},.48);
                backdrop-filter: blur(20px) saturate(200%);
                border-radius: 50%;
                padding: 0.5rem;
                overflow: hidden;
                transition: all 0.24s ease-in-out;
                color: transparent;
            }
            a:hover{
                background-color: rgba(${style ? "255,255,255" : "0,0,0"},.24);
            }
            svg{
                display: inline-block;
                position: relative;
                z-index: 1;
                height: 100%;
                width: 100%;
                pointer-events: none;
            }
        `;
    }
}
customElements.define('material-icon-button', MaterialIconButton);
export class MaterialRangeInput extends HTMLElement{
    #value:number = 0;
    get value(){
        return this.#value;
    }
    set value(value){
        this.#value = value;
    }
    constructor(target:Function|null = null, dft = 0) {
        super();
        this.value = dft;
        const shadow = this.attachShadow({mode: "open"});
        const style = document.createElement('style');
        style.textContent = `
            div{
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            input[type="range"] {
                position: relative;
                opacity: 0;
                margin: auto;
                cursor: pointer;
                height: 2rem;
                width: 100%;
                border-radius: 1rem;
                top: 0;
                left: 0;
                background-color: black;
            }
            
            .material-range-input-rail {
                display: block;
                position: absolute;
                top: 0.625rem;
                left: 0;
                border-radius: 0.5rem 1rem 1rem 0.5rem;
                pointer-events: none;
                width: 100%;
                height: 0.75rem;
                background-color: var(--main_color_background);
            }
            
            .material-range-input-progress{
                display: block;
                position: absolute;
                top: 0.5rem;
                left: 0;
                border-radius: 1rem 0.5rem 0.5rem 1rem;
                pointer-events: none;
                width: 0.5rem;
                height: 1rem;
                background-color: var(--main_color);
            }
            
            .material-range-input-thumb {
                pointer-events: none;
                display: block;
                position: absolute;
                top: 0;
                border-radius: 1rem;
                background-color: var(--main_color);
                width: 0.25rem;
                height: 2rem;
                box-shadow: none;
                cursor: pointer;
                transition: box-shadow 0.16s ease-in-out;
            }
        `
        const Box = document.createElement('div');
        const input = document.createElement('input');
        input.type = "range";
        const rail = document.createElement('span');
        rail.className = "material-range-input-rail";
        const progress = document.createElement('span');
        progress.className = "material-range-input-progress";
        const thumb = document.createElement('span');
        thumb.className = "material-range-input-thumb";
        shadow.appendChild(style);
        shadow.appendChild(Box);
        Box.appendChild(input);
        Box.appendChild(rail);
        Box.appendChild(progress);
        Box.appendChild(thumb);

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                position((entry.target as HTMLElement).offsetWidth);
            }
        })
        resizeObserver.observe(input);

        const position = (width:number) => {
            rail.style.left = `${12 + this.value / 100 * (width - 16)}px`;
            rail.style.width = `${-16 + width - this.value / 100 * (width - 16)}px`
            progress.style.width = `${this.value / 100 * (width - 16)}px`;
            thumb.style.left = `${4 + this.value / 100 * (width - 16)}px`;
        }
        input.addEventListener('wheel', (ev)=>{
            let value = -1;
            if(ev.deltaY < 0){
                value = - value;
            }
            value += this.value;
            value = Math.min(100, Math.max(0, value));
            input.value = value.toString();
            this.value = value;
            position(input.offsetWidth);
            if(target != null){
                target(value);
            }
        })
        input.addEventListener('input', ()=>{
            this.value = parseInt(input.value);
            position(input.offsetWidth);
            if(target){
                target(this.value / 100);
            }
        })
        input.addEventListener("mouseenter", ()=>{
            thumb.style.boxShadow = "var(--main_color_48) 0 0 0 0.5rem";
        })
        input.addEventListener('mouseleave', ()=>{
            thumb.style.boxShadow = "none";
        })
    }
}
customElements.define('material-range-input', MaterialRangeInput);
export class MaterialSwitch extends HTMLElement{
    input:HTMLInputElement;
    get disabled(){
        return this.input.disabled;
    }
    set disabled(value){
        if(value){
            (this.input as HTMLElement).style.pointerEvents = "none";
        }
        this.input.disabled = value;
    }
    get value(){
        return this.input.checked;
    }
    set value(value){
        this.input.checked = value;
    }
    constructor(target:Function|null = null, value = false) {
        super();
        const threshold = 10;
        const shadow = this.attachShadow({mode: "open"});
        const box = document.createElement('div');
        const style = document.createElement('style');
        this.input = document.createElement('input');
        const thumb = document.createElement('span');
        this.input.type = "checkbox";
        this.value = value;
        style.textContent = `
        div{
            display: inline-block;
            position: relative;
        }
        input[type='checkbox'] {
            position: relative;
            cursor: pointer;
            margin: auto;
            appearance: none;
            border-radius: 1rem;
            width: 3rem;
            height: 1.8rem;
            background-color: transparent;
            transition: all 0.24s ease-in-out;
            box-shadow: inset var(--outline) 0 0 0 0.125rem;
        }
        
        input[type='checkbox']:checked {
            background-color: var(--main_color);
            box-shadow: inset var(--main_color) 0 0 0 0.125rem;
        }
        
        input[type='checkbox']:disabled {
            opacity: 0.36;
        }
        
        input[type='checkbox']+span {
            margin: 0;
            pointer-events: none;
            position: absolute;
            display: inline-block;
            top: 0.425rem;
            left: 0.4rem;
            border-radius: 1rem;
            width: 1rem;
            height: 1rem;
            background-color: var(--outline);
            transition: all 0.12s ease-in-out;
        }
        
        input[type='checkbox']:hover+span{
            box-shadow: var(--outline_48) 0 0 0 0.5rem;
        }
        
        input[type='checkbox']:active+span{
            transform: scale(1.2);
        }
        
        input[type='checkbox']:checked+span {
            background-color: var(--background);
            top: 0.3rem;
            transition: all 0.24s ease-in-out;
            width: 1.25rem;
            height: 1.25rem;
        }
        
        input[type='checkbox']:checked:hover+span{
            box-shadow: var(--main_color_48) 0 0 0 0.625rem;
        }
        `;
        let mouse_start_x:number|undefined = undefined;
        let mouse_input_x :number|undefined = undefined;
        const thumb_reset = ()=>{
            if(this.value){
                thumb.style.left = `1.475rem`;
            }
            else {
                thumb.style.left = `0.4rem`;
            }
        }
        thumb_reset();
        this.input.addEventListener('mousedown', (ev:MouseEvent)=>{
            if(this.disabled){
                return false;
            }
            mouse_start_x = ev.x;
        })
        this.input.addEventListener('mousemove', (ev:MouseEvent)=>{
            if(mouse_start_x != null){
                mouse_input_x = ev.x - mouse_start_x;
                if(this.input.checked){
                    if(mouse_input_x < 0){
                        thumb.style.left = `max(0.4rem , calc(1.475rem + ${mouse_input_x}px))`;
                    }
                }
                else {
                    if(mouse_input_x > 0){
                        thumb.style.left = `min(1.475rem , calc(0.4rem + ${mouse_input_x}px))`;
                    }
                }
            }
        })
        this.input.addEventListener('mouseup', ()=>{
            mouse_start_x = undefined;
        })
        this.input.addEventListener('mouseleave', ()=>{
            thumb_reset();
            if(mouse_start_x != null){
                if(this.value){
                    if(mouse_input_x! < 0 && Math.abs(mouse_input_x!) >= threshold){
                        this.input.click();
                    }
                }
                else {
                    if(mouse_input_x! > 0 && Math.abs(mouse_input_x!) >= threshold){
                        this.input.click();
                    }
                }
            }
            mouse_start_x = undefined;
        })
        this.input.addEventListener('input', ()=>{
            GEH.requestPlayAudio('dida');
            if(target){
                target(this.value);
            }
            thumb_reset();
        })
        shadow.appendChild(style);
        shadow.appendChild(box);
        box.appendChild(this.input);
        box.appendChild(thumb);
    }
}
customElements.define('material-switch', MaterialSwitch);
export class MaterialDialog extends HTMLElement{
    constructor(options:any) {
        super();
        const {
        Title = null,
        Text,
        ButtonLabelYes = null,
        ButtonLabelNo = null,
        ButtonFuncYes = null,
        ButtonFuncNo = null,
        Icon = null,
        } = options;
        if(ButtonLabelYes === null && ButtonLabelNo === null){
            ToastBox("Button needed for the dialog to be closed.");
        }
        const ShadowRoot = this.attachShadow({mode: "open"});
        const Style = document.createElement('style');
        Style.textContent = `
            .overlay{
                width: 100vw;
                height: 100vh;
                top:  0;
                left: 0;
                margin: 0;
                display: block;
                position: fixed;
                animation: none;
                z-index: 98;
                background-color: rgba(0,0,0,.24);
                opacity: 0;
                animation: opacityGain 0.12s forwards ease-in-out;
            }
            
            .material-dialog-box {
                display: block;
                position: absolute;
                user-select: none;
                text-align: center;
                margin: auto;
                width: max(calc(var(--window_height) * 0.48), 24rem);
                height: max-content;
                font-weight: 600;
                z-index: 10240;
                left: calc(var(--window_width) / 2);
                top: calc(var(--window_height) / 2);
                padding: var(--box_radius_huge);
                transform: translateX(-50%) translateY(-50%);
                animation: displayWarnBox 0.36s forwards ease-in-out;
            }
            
            .material-dialog-background{
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                height: calc(100% - 4rem);
                width: 100%;
                background-color: var(--background);
                border-radius: var(--box_radius_huge);
                box-shadow: var(--shadow);
                animation: 0.36s displayWarnBack forwards 0.12s ease-in-out;
            }
            
            .material-dialog-icon {
                position: relative;
                left: 50%;
                margin-bottom: 1rem;
                display: block;
                width: 3.5rem;
                height: 2rem;
                transform: translateX(-50%);
            }
            
            .material-dialog-box h2 {
                display: block;
                font-weight: 600;
                position: relative;
                color: var(--outline);
                font-size: 1.5rem;
                max-height: 1.5rem;
                text-align: center;
                margin: 0 0 2rem;
            }
            
            .material-dialog-box p {
                position: relative;
                font-weight: 400;
                color: var(--outline);
                font-size: 1rem;
                min-height: 4rem;
                text-align: left;
                opacity: 0;
                animation: 0.12s opacityGain 0.12s forwards ease-in-out;
            }
            
            .material-dialog-box material-button {
                position: relative;
                float: right;
                opacity: 0;
                animation: 0.12s opacityGain 0.24s forwards ease-in-out;
            }
            
            .material-dialog-box material-button:last-of-type {
                margin-right: 0.5rem;
            }
            
            @keyframes displayWarnBack{
                to{
                    height: 100%;
                }
            }
            
            @keyframes hideWarnBack{
                from{
                    height: 100%;
                }
                to{
                    height: calc(100% - 2rem);
                }
            }
            
            @keyframes displayWarnBox {
                0% {
                    opacity: 0;
                    margin-top: -4rem;
                }
                100% {
                    opacity: 1;
                    margin-top: 0;
                }
            }
            
            @keyframes hideWarnBox {
                from {
                    margin-top: 0;
                }
                to {
                    opacity: 0;
                    margin-top: -2rem;
                }
            }
            
            @keyframes opacityGain{
                to{
                    opacity: 1;
                }
            }
            
            @keyframes opacityLose{
                from{
                    opacity: 1;
                }
                to{
                    opacity: 0;
                }
            }
        `
        const Overlay = document.createElement("div");
        Overlay.className = "overlay";

        const Box = document.createElement("div");
        Box.className = "material-dialog-box";

        const Background = document.createElement('div');
        Background.className = 'material-dialog-background';
        Box.appendChild(Background);

        if (Icon) {
            const Image = document.createElement('img');
            Image.className = "material-dialog-icon";
            Image.src = Icon;
            Box.appendChild(Image);
        }

        if (Title) {
            const H2 = document.createElement('h2');
            H2.className = "material-dialog-title";
            H2.innerText = Title;
            Box.appendChild(H2);
        }

        const P = document.createElement("p");
        P.className = "material-dialog-text";
        P.innerText = Text;
        Box.appendChild(P);

        const handleButtonClick = (func:Function) => {
            func!();
            Overlay.style.animation = "opacityLose 0.36s forwards ease-in-out";
            Box.style.animation = "0.24s hideWarnBox forwards 0.18s ease-in-out";
            Background.style.animation = "0.48s hideWarnBack forwards ease-in-out";

            Box.addEventListener("animationend", () => {
                this.remove();
            });
        };

        const handleYesButtonClick = () => {
            handleButtonClick(ButtonFuncYes);
        };

        const handleNoButtonClick = () => {
            handleButtonClick(ButtonFuncNo);
        };

        const yesButton = new MaterialButton(ButtonLabelYes, handleYesButtonClick);
        if(ButtonLabelYes){
            Box.appendChild(yesButton);
        }

        const noButton = new MaterialButton(ButtonLabelNo, handleNoButtonClick, false);
        if(ButtonLabelNo){
            Box.appendChild(noButton);
        }

        ShadowRoot.appendChild(Style);
        ShadowRoot.appendChild(Box);
        ShadowRoot.appendChild(Overlay);
    }
}
customElements.define('material-dialog', MaterialDialog);
export class MaterialLoader extends HTMLElement{
    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode:'open'});
        const style = document.createElement('style');
        const background = document.createElement('div');
        const logo = document.createElement('img');
        const text = document.createElement('span');
        const loader = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        style.textContent = `
        .material-loader-background {
            margin: 0;
            position: fixed;
            height: 100%;
            width: 100%;
            background-image: url("../static/images/interface/loader_2.png");
            background-size: cover;
            background-repeat: no-repeat;
        }
        span{
            position: fixed;
            color: white;
            margin: auto;
            left: 0;
            right: 0;
            top: 1rem;
            width: fit-content;
            text-align: center;
        }
        svg{
            position: fixed;
            margin: auto;
            right: 3rem;
            bottom: 2rem;
            height: 150px;
            width: 150px;
        }
        
        circle {
            fill: none;
            stroke: white;
            stroke-linecap: round;
            stroke-width: 0.75rem;
            stroke-dasharray: 252;
            stroke-dashoffset: 252;
            animation: circle 1.2s infinite linear;
            transform: rotate(-90deg);
            transform-origin: center;
            transform-box: fill-box;
        }
        
        @keyframes circle {
            from {
                stroke-dashoffset: 210;
                transform: rotate(-45deg);
            }
            50% {
                stroke-dashoffset: 63;
                transform: rotate(315deg);
            }
            to {
                stroke-dashoffset: 210;
                transform: rotate(675deg);
            }
        }    
        img{
            position: absolute;
            margin: auto;
            top: 0;
            bottom: 2rem;
            left: 0;
            right: 0;
            height: 6rem;
            animation: logo 0.64s infinite ease-in-out;
        }
        @keyframes logo {
            from to {
                transform: scale(1);
            }
            81%{
                transform: scale(1.125);
            }
        }
        `;
        background.className = "material-loader-background";
        logo.src = "../static/images/logo.svg";
        text.innerText = "本程序美术资料及部分音频版权归上海欢乐互娱网络科技有限公司所有，而仍保留法律范围内最大限度的权益；除资料引用外，本程序与前述公司并无任何关联。" +
            "\n健康游戏忠告：抵制不良游戏，拒绝盗版游戏。注意自我防护，谨防受骗上当。适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。";
        loader.innerHTML = `<circle cx="80" cy="80" r="40"></circle>`;
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(background);
        shadowRoot.appendChild(logo);
        shadowRoot.appendChild(text);
        shadowRoot.appendChild(loader);
    }
}
customElements.define('material-loader', MaterialLoader);
export class MaterialCard extends HTMLElement{
    #box = document.createElement('div');
    get visible(){
        return this.hasAttribute("visible");
    }
    #height:number = 0;
    constructor(innerHTML:string|null = null, customStyle:string|null = null) {
        super();
        const shadowRoot = this.attachShadow({mode: "open"});
        const style = document.createElement('style');
        this.#box.className = "box";
        style.textContent = `
            ${customStyle}
            *{
                color: var(--outline);
                transition-timing-function: ease-in-out !important;
            }
            p, label {
                position: relative;
                animation: display 0.24s 0.24s ease-in-out forwards;
                opacity: 0;
            }
            @keyframes display {
                from{
                    top: 1rem;
                    transform: scaleY(1.1);
                }
                to{
                    opacity: 1;
                    top: 0;
                    transform: scaleY(1);
                }
            }
            .box{
                width: calc(100% - 4rem);
                height: fit-content;
                padding: var(--box_radius_huge);
                border-radius: var(--box_radius_huge);
                background-color: var(--background);
                box-shadow: var(--shadow);
                overflow: hidden;
                transition: height 0.48s, opacity 0.24s, top 0.24s;
                opacity: 0;
                position: relative;
                top: 2rem;
            }
            span{
            
            }
            label{
                padding: 0.5rem;
                display: block;
                position: relative;
                min-height: 1rem;
            }
            p{
                padding: 1rem;
                background-color: #fffbff;
                margin-top: 0;
                margin-bottom: 1rem;
                border-radius: 1rem;
            }
            p:last-child{
                margin: 0;
            }
            material-range-input{
                display: block;
                position: relative;
                margin-top: 0.5rem;
            }
            material-switch{
                position: absolute;
                float: right;
                right: 0.5rem;
                height: 1.8rem;
                top: 50%;
                transform: translateY(-50%);
            }
            .section{
                padding: 1rem;
                background-color: var(--main_color_background);
                border-radius: 1rem;
                margin-bottom: 0.5rem;
            }
        `;
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(this.#box);
        this.appendChild = (node)=>{
            return this.#box.appendChild(node);
        }
        this.#box.innerHTML = innerHTML!;
        setTimeout(()=>{
            this.#height = this.#box.offsetHeight;
            this.#box.style.height = '0';
            this.style.display = "none";
        })
    }
    #display_status_function = ()=>{
        this.style.display = "none";
    }
    show(){
        this.style.display = "block";
        this.setAttribute('visible', '');
        setTimeout(()=>{
            this.#box.style.height = `calc(${this.#height}px - 4rem)`;
            this.#box.style.opacity = '1';
            this.#box.style.top = '0';
            this.#box.removeEventListener('transitionend', this.#display_status_function);
            const back = document.createElement('div');
            back.className = 'overlay';
            document.getElementById('town')!.appendChild(back);
            back.onclick = () => {
                this.hide();
                back.remove();
            }
        })
    }
    hide(){
        this.#box.style.height = '0';
        this.#box.style.opacity = '0';
        this.#box.style.top = "2rem";
        this.#box.addEventListener('transitionend', this.#display_status_function);
        this.removeAttribute('visible');
    }
}
customElements.define("material-card", MaterialCard);
export class MaterialNavigationBar extends HTMLElement{
    static #instance:MaterialNavigationBar;
    #items:any[] = [];
    #container = document.createElement('ul');
    constructor() {
        super();
        if (!MaterialNavigationBar.#instance) {
            MaterialNavigationBar.#instance = this;
        }
        else {
            ToastBox("Try to create a new instance of a class that runs in singleton mode.");
            return MaterialNavigationBar.#instance;
        }
        const shadowRoot = this.attachShadow({mode: "open"});
        const style = document.createElement('style');
        style.textContent = `
            *{
                color: #fffbff;
                fill: #fffbff;
                transition: all 0.24s ease-in-out;
            }
            ul{
                margin: 0;
                list-style: none;
                position: relative;
                display: grid;
                padding: 0.5rem;
                width: 24rem;
                height: 2.25rem;
                border-radius: 6rem;
                background-color: rgba(0, 0, 0, .48);
                pointer-events: all;
                grid-template-columns: repeat(auto-fit,minmax(3rem,1fr));
                grid-template-rows: repeat(1, 1fr);
                grid-column-gap: 0.5rem;
                backdrop-filter: blur(20px) saturate(200%);
            }
            li{
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                list-style: none;
                border-radius: 2rem;
                cursor: pointer;
            }
            li:before {
                position: absolute;
                top: 50%;
                left: 50%;
                display: block;
                width: 50%;
                height: 100%;
                border-radius: 2rem;
                background-color: transparent;
                content: "";
                transform: translateX(-50%) translateY(-50%);
                transition: all 0.24s ease-in-out;
                pointer-events: none;
            }
            li:hover{
                background-color: var(--main_color_48);
            }
            li:active {
                background-color: transparent;
            }
            svg{
                display: inline-block;
                height: 1.75rem;
                width: 1.75rem;
                position: relative;
                margin-right: 0.5rem;
            }
            span{
                font-size: 1rem;
                font-weight: 600;
                text-align: center;
                display: inline-block;
                position: relative;
            }
            .selected:before{
                width: 100%;
                height: 100%;
                background-color: var(--main_color);
            }
            .selected:hover{
                background-color: transparent;
            }
        `;
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(this.#container);
    }
    addItem(text:string, icon:string, func:Function){
        const item = document.createElement('li');
        item.innerHTML = `${icon}<span>${text}</span>`;
        item.addEventListener('click', ()=>{
            GEH.requestPlayAudio("dida");
            this.#items.forEach((node:HTMLElement) => {
                if(node === item){
                    item.className = "selected";
                }
                else {
                    node.className = "";
                }
            })
            if(func){
                func();
            }
        })
        if(this.#items.length === 0){
            item.className = "selected";
        }
        this.#items.push(item);
        this.#container.appendChild(item);
    }
}
customElements.define('material-navigation-bar', MaterialNavigationBar);
export class MaterialDescription extends HTMLElement{
    static #stack:any[] = [];
    #display = true;
    #background = document.createElement('div');
    #text = document.createElement('span');
    #button = document.createElement('a');
    #close = new MaterialIconButton(
        (EventHandler.icons).get('close'),
        ()=>{
            this.hide();
        });
    private timer: any;
    private readonly Style: HTMLStyleElement;
    constructor(text:string, button_text:string|null = null) {
        super();
        MaterialDescription.#stack.push(this);
        this.addEventListener('mouseenter', ()=>{
            if(this.timer){
                clearTimeout(this.timer);
                this.timer = null;
            }
        });
        this.addEventListener('mouseleave', () => {
            if(this.#display && this.timer == null){
                this.timer = setTimeout(()=>{
                    this.hide();
                }, 6400);
            }
        })
        this.style.transition = `all 0.24s ease-in-out`;
        this.style.bottom = `${-3 + (MaterialDescription.#stack.length * 5)}rem`;
        this.attachShadow({mode: "open"});
        this.Style = document.createElement('style');
        this.Style.textContent = `
            @keyframes animation{
                to{
                    opacity: 1;
                    height: 1rem;
                }
            }
            .material-description-background{
                opacity: 0;
                position: relative;
                color: var(--background);
                background-color: var(--outline);
                height: 0;
                min-width: 16rem;
                border-radius: 0.5rem;
                padding: 1.5rem 1rem;
                box-shadow: var(--outline) 0 0.25rem 0.5rem;
                animation: animation 0.24s ease-in-out forwards;
            }
            span{
                position: relative;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                max-width: 24rem;
                display: inline-block;
                margin-right: 3rem;
            }
            material-icon-button{
                display: block;
                position: absolute;
                bottom: 0.4rem;
                right: 0.625rem;
            }
            a{
                color: var(--main_color);
                margin-right: 3rem;
            }
        `;
        this.#text.textContent = text;
        this.#close.button.style.backgroundColor = "transparent";
        this.#close.button.style.backdropFilter = "none";
        this.#close.button.style.fill = "var(--background)";
        this.#close.button.style.height = "1.5rem";
        this.#close.button.style.width = "1.5rem";
        this.#close.button.addEventListener('mouseenter', ()=>{
            this.#close.button.style.backgroundColor = "rgba(255,255,255,.24)";
        })
        this.#close.button.addEventListener('mouseleave', ()=>{
            this.#close.button.style.backgroundColor = "transparent";
        })
        this.#background.className = 'material-description-background';
        this.shadowRoot!.appendChild(this.Style);
        this.shadowRoot!.appendChild(this.#background);
        this.#background.appendChild(this.#text);
        if(button_text){
            this.#button.textContent = button_text;
            this.#background.appendChild(this.#button);
        }
        this.#background.appendChild(this.#close);
        this.timer = setTimeout(()=>{
            this.hide();
        }, 6400);
    }
    hide(){
        if(this.#display){
            this.#display = false;
            clearTimeout(this.timer);
            this.timer = null;
            for (let i = 0; i < MaterialDescription.#stack.length; i++) {
                const item = MaterialDescription.#stack[i];
                if(item === this){
                    MaterialDescription.#stack.splice(i, 1);
                    i--;
                }
                else {
                    item.style.bottom = `${2 + (i * 5)}rem`;
                }
            }
            this.remove();
        }
    }
}
customElements.define('material-description', MaterialDescription);
export const WarnMessageBox = function (options:any) {
    const dialog = new MaterialDialog(options);
    document.body.appendChild(dialog);
    return dialog;
};
export const ToastBox = function (text: string, button_text = null) {
    const toast = new MaterialDescription(text, button_text);
    document.body.appendChild(toast);
    return toast;
}
class GameReadyPagePrototype extends HTMLElement {
    static #instance: GameReadyPagePrototype;
    GameCards = document.createElement('div');
    #Entry: any;
    #Box = document.createElement('div');
    #Title = document.createElement('h2');
    #BackpackCards = document.createElement('div');
    #LevelInfo = document.createElement('div');
    #LevelInfoBox = document.createElement('div');
    #ReselectButton = new MaterialButton(`${RESELECT}`, () => {
        GEH.cards.length = 0;
        GEH.cardBag.forEach((value: any) => {
            value.unselect();
        })
    }, false, {icon: EventHandler.icons.get('unselect')});
    #CancelButton = new MaterialButton(`${CANCEL}`, () => {
        this.#Box.style.animation = "cancelGame 0.12s forwards ease-in-out";
        const animationHandler = () => {
            this.style.display = "none";
            this.#Box.removeEventListener('animationend', animationHandler);
        }
        this.#Box.addEventListener('animationend', animationHandler);
        GEH.cardBag.forEach((value: any) => {
            value.unselect();
        })
    }, false);

    constructor() {
        super();
        if (!GameReadyPagePrototype.#instance) {
            GameReadyPagePrototype.#instance = this;
        } else {
            ToastBox("Try to create a new instance of a class that runs in singleton mode.");
            return GameReadyPagePrototype.#instance;
        }
        this.style.display = "none";
        const ShadowRoot = this.attachShadow({mode: "open"});
        const Style = document.createElement('style');
        Style.textContent = `
            *{
                color: var(--outline);
                fill: var(--outline);
                transition: all, .24s ease-in-out;
                background-color: var(--background);
            }
            .game-ready-page-box{
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
                background-color: var(--background);
                background-position: center top;
                background-size: 954px;
                background-repeat: no-repeat;
                box-shadow: var(--shadow);
                margin: auto;
                overflow: hidden;
                border-radius: 0 2rem 2rem 0;
            }
            
            img {
                padding: 0;
                height: 3rem;
                border-radius: 8px;
                box-shadow: rgb(0,0,0,.08) 1px 1px 0 0;
                cursor: pointer;
                transition: box-shadow, transform 0.24s ease-in-out;
            }
            
            img:hover {
                box-shadow: var(--outline) 0 0 0 2px;
                transform: scale(0.9);
            }
            
            img[selected]:hover{
                transform: scale(1);
            }
            
            h2{
                left: 50%;
                top: 0;
                position: relative;
                display: block;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                font-weight: 600;
                font-size: 1.5rem;
                transform: translateX(-50%);
                width: fit-content;
            }
            
            h2 > svg {
                position: relative;
                top: 0.3rem;
                display: inline-block;
                margin-right: 0.3rem;
                padding: 0;
                width: 1.5rem;
                height: 1.5rem;
            }
            
            .game-ready-page-game-cards {
                position: absolute;
                top: 12.5rem;
                margin: auto;
                left: 1rem;
                display: block;
                overflow-x: hidden;
                overflow-y: scroll;
                padding: 1rem;
                width: 5rem;
                height: min(calc(100% - 16rem), calc(31.25em));
                border-radius: 1rem;
                background-color: var(--background);
                box-shadow: rgba(0,0,0, .16) 0 0 4rem;
            }
            .game-ready-page-game-cards img{
                margin-bottom: 0.25rem;
            }
            .game-ready-page-game-cards img:last-child{
                margin-bottom: 0;
            }
            .game-ready-page-level-info {
                position: relative;
                margin-top: 0;
                display: block;
                margin: 1rem;
                padding: 0.5rem;
                height: 4.5rem;
                font-weight: 400;
                background-color: transparent;
            }
            
            .game-ready-page-level-info div {
                position: absolute;
                top: 0;
                left: 50%;
                display: block;
                margin: 0;
                padding: 1rem;
                border-radius: 1.5rem;
                color: var(--outline);
                transform: translateX(-50%);
                width: max-content;
            }
            
            .game-ready-page-level-info div a {
                display: inline-block;
                margin-right: 1rem;
                padding: 0.75rem 1rem;
                border-radius: 1rem;
                text-align: center;
                font-size: 1rem;
                background-color: #fffbff;
                font-weight: 600;
            }
            
            .game-ready-page-level-info div a:last-of-type{
                margin-right: 0;
            }
            
            .game-ready-page-level-info div a>svg {
                display: block;
                margin-left: 50%;
                margin-bottom: 0.25rem;
                transform: translateX(-50%);
                background-color: transparent;
            }
            
            .game-ready-page-backpack-cards {
                position: relative;
                float: right;
                top: 0.625rem;
                right: 1rem;
                display: grid;
                overflow-x: hidden;
                overflow-y: scroll;
                height: min(calc(100% - 20.5rem), calc(31.25em));
                width: calc(100% - 12rem);
                border-radius: 1rem;
                grid-template-columns: repeat(auto-fit, 5.125rem);
                grid-template-rows: repeat(auto-fit, 3rem);
                column-gap: 0.5rem;;
                row-gap: 0.5rem;
                padding: 1rem;
            }
            
            .game-ready-page-backpack-cards img {
                object-fit: cover;
                border-radius: 0.5rem;
                background-color: #e7bdb1;
                background-image: url("../static/images/undo.svg");
                background-position: center;
                background-repeat: no-repeat;
            }
            
            .game-ready-page-backpack-reselect{
                position: absolute;
                left: 9rem;
                bottom: 1.125rem;
            }
            
            .game-ready-page-backpack-start, .game-ready-page-backpack-cancel {
                position: absolute;
                bottom: 1.125rem;
                right: 1.5rem;
                float: right;
                display: inline-block;
            }
            
            .game-ready-page-backpack-cancel {
                right: 9rem;
            }
            
            @keyframes startGame {
                from{
                    left: -4rem;
                    opacity: 0;
                }
                to{
                    left: 0;
                    opacity: 1;
                }
            }
            
            @keyframes cancelGame{
                to{
                    left: -2rem;
                    opacity: 0;
                }
            }
        `;
        this.#Box.className = "game-ready-page-box";
        this.#LevelInfo.className = "game-ready-page-level-info";
        this.GameCards.className = "game-ready-page-game-cards";
        this.#BackpackCards.className = "game-ready-page-backpack-cards";
        this.#ReselectButton.className = "game-ready-page-backpack-reselect";
        this.#CancelButton.className = "game-ready-page-backpack-cancel";
        this.#StartButton.className = "game-ready-page-backpack-start";

        ShadowRoot.appendChild(Style);
        ShadowRoot.appendChild(this.#Box);
        this.#Box.appendChild(this.#Title);
        this.#Box.appendChild(this.#LevelInfo);
        this.#LevelInfo.appendChild(this.#LevelInfoBox);
        this.#Box.appendChild(this.GameCards);
        this.#Box.appendChild(this.#BackpackCards);
        this.#Box.appendChild(this.#ReselectButton);
        this.#Box.appendChild(this.#CancelButton);
        this.#Box.appendChild(this.#StartButton);
    }

    appendChild<T extends Node>(node: T): T {
        return this.#Box.appendChild(node);
    }

    async initialize(type: number) {
        this.#Entry = await getLevelDetails(type);
        GEH.cards.length = 0;
        this.style.display = "block";
        this.#Box.style.animation = "startGame 0.48s forwards ease-in-out";
        this.#Box.style.backgroundImage =
            "linear-gradient(to top, var(--background) 50%, transparent 100%), "
            + "url(../static/images/interface/background_" + (type || 0) + ".jpg)";
        this.GameCards.childNodes.forEach(node => {
            node.remove();
        })
        this.#BackpackCards.scrollTop = 0;
        this.#BackpackCards.childNodes.forEach(node => {
            node.remove();
        })
        GEH.cardBag.forEach((card: any) => {
            this.#BackpackCards.appendChild(card.entity);
        })
        this.#Title.innerHTML = EventHandler.icons.get("anchor") + this.#Entry.NAME;
        this.#LevelInfoBox.innerHTML = "";
        if (this.#Entry.TIME) {
            this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("night")}${NIGHTTIME}</a>`;
        } else {
            this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("day")}${DAYTIME}</a>`;
        }
        this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("category")}${this.#Entry.TYPE}</a>`;
        this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("reward")}${this.#Entry.REWARDS || 0}</a>`;
        this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("flag")}${this.#Entry.WAVES || 0}</a>`;
        if (this.#Entry.SUGGESTED_TYPE === 0) {
            this.#LevelInfoBox.innerHTML += `<a>${EventHandler.icons.get("waterline")}${WATERLINE}</a>`;
        }
    }

    #CardSet = () => {
        this.style.display = "none";
        new this.#Entry();
        for (let i = 0; i < GEH.cardBag.length; i++) {
            GEH.cardBag[i].unselect();
        }
    }

    #StartButton = new MaterialButton(`${START_GAME}`, () => {
        if (GEH.cards.length) {
            if (!GEH.debug && this.#Entry.SUGGESTED_TYPE != null) {
                if (this.#Entry.SUGGESTED_TYPE === 0) {
                    if (GEH.cards.find((value: any) => {
                        return value.name === 'plate';
                    })) {

                    } else {
                        WarnMessageBox({
                            Text: `${GAME_ERROR_CODE_008}`,
                            ButtonLabelYes: `${GAME_UI_BUTTON_002}`,
                            ButtonLabelNo: `${GAME_UI_BUTTON_003}`,
                            ButtonFuncYes: () => {
                                this.#CardSet();
                            }
                        });
                        return;
                    }
                } else if (this.#Entry.SUGGESTED_TYPE === 1) {
                    if (GEH.cards.find((value: any) => {
                        return value.name === 'marshmallow';
                    })) {

                    } else {
                        WarnMessageBox({
                            Text: "你没有携带棉花糖卡片，确认继续吗？",
                            ButtonLabelYes: `${GAME_UI_BUTTON_002}`,
                            ButtonLabelNo: `${GAME_UI_BUTTON_003}`,
                            ButtonFuncYes: () => {
                                this.#CardSet();
                            }
                        });
                        return;
                    }
                }
            }
            this.#CardSet();
        } else {
            ToastBox(`${GAME_ERROR_CODE_009}`);
        }
    });
}
customElements.define('game-ready-page', GameReadyPagePrototype);
export const GameReadyPage = new GameReadyPagePrototype();