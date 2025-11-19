/**
 * WebGLRenderer.ts
 * WebGL渲染器实现
 * 实现IRenderer接口,提供与Canvas 2D兼容的API
 */
import { TextureManager } from "./TextureManager.js";
import { SpriteBatcher } from "./SpriteBatcher.js";
import { createProgram, VERTEX_SHADER, FRAGMENT_SHADER } from "./shaders.js";
/**
 * WebGL渲染器
 */
export class WebGLRenderer {
    canvas;
    gl;
    program;
    textureManager;
    batcher;
    stateStack;
    currentState;
    matrixLocation;
    textureLocation;
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
        if (!gl) {
            throw new Error("WebGL not supported");
        }
        this.gl = gl;
        this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        this.textureManager = new TextureManager(gl);
        this.batcher = new SpriteBatcher(gl, this.program);
        this.stateStack = [];
        this.currentState = {
            matrix: this.createIdentityMatrix(),
            alpha: 1.0
        };
        gl.useProgram(this.program);
        this.setupAttributes();
        this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        this.textureLocation = gl.getUniformLocation(this.program, "u_texture");
        gl.uniform1i(this.textureLocation, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, canvas.width, canvas.height);
        this.updateMatrix();
    }
    drawImage(image, ...args) {
        let sx, sy, sw, sh;
        let dx, dy, dw, dh;
        let effects = {};
        if (args.length >= 8) {
            [sx, sy, sw, sh, dx, dy, dw, dh, effects = {}] = args;
        }
        else {
            [dx, dy, dw, dh, effects = {}] = args;
            sx = 0;
            sy = 0;
            sw = image.width || image.width;
            sh = image.height || image.height;
        }
        const key = image.src || "";
        let texture = this.textureManager.getTexture(key);
        if (!texture) {
            texture = this.textureManager.uploadTexture(image, key);
        }
        this.batcher.addSprite(texture, sx, sy, sw, sh, dx, dy, dw, dh, this.currentState.alpha, effects, sw, sh);
    }
    save() {
        this.stateStack.push({
            matrix: new Float32Array(this.currentState.matrix),
            alpha: this.currentState.alpha
        });
    }
    restore() {
        const state = this.stateStack.pop();
        if (state) {
            this.batcher.flush();
            this.currentState = state;
            this.updateMatrix();
        }
    }
    scale(x, y) {
        this.batcher.flush();
        const m = this.currentState.matrix;
        m[0] *= x;
        m[1] *= x;
        m[2] *= x;
        m[3] *= y;
        m[4] *= y;
        m[5] *= y;
        this.updateMatrix();
    }
    translate(x, y) {
        this.batcher.flush();
        const m = this.currentState.matrix;
        m[6] += m[0] * x + m[3] * y;
        m[7] += m[1] * x + m[4] * y;
        this.updateMatrix();
    }
    rotate(angle) {
        this.batcher.flush();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const m = this.currentState.matrix;
        const m0 = m[0], m1 = m[1], m3 = m[3], m4 = m[4];
        m[0] = m0 * c + m3 * s;
        m[1] = m1 * c + m4 * s;
        m[3] = m0 * -s + m3 * c;
        m[4] = m1 * -s + m4 * c;
        this.updateMatrix();
    }
    setGlobalAlpha(alpha) {
        this.currentState.alpha = alpha;
    }
    clear(x = 0, y = 0, width = this.canvas.width, height = this.canvas.height) {
        this.batcher.flush();
        this.gl.scissor(x, y, width, height);
        this.gl.enable(this.gl.SCISSOR_TEST);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.disable(this.gl.SCISSOR_TEST);
    }
    getCanvas() {
        return this.canvas;
    }
    dispose() {
        this.batcher.flush();
        this.batcher.dispose();
        this.textureManager.dispose();
        this.gl.deleteProgram(this.program);
    }
    setupAttributes() {
        const gl = this.gl;
        const stride = 8 * 4;
        const posLoc = gl.getAttribLocation(this.program, "a_position");
        const texLoc = gl.getAttribLocation(this.program, "a_texCoord");
        const alphaLoc = gl.getAttribLocation(this.program, "a_alpha");
        const effectsLoc = gl.getAttribLocation(this.program, "a_effects");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(alphaLoc);
        gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, stride, 16);
        gl.enableVertexAttribArray(effectsLoc);
        gl.vertexAttribPointer(effectsLoc, 3, gl.FLOAT, false, stride, 20);
    }
    createIdentityMatrix() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        return new Float32Array([
            2 / w, 0, 0,
            0, -2 / h, 0,
            -1, 1, 1
        ]);
    }
    updateMatrix() {
        this.gl.uniformMatrix3fv(this.matrixLocation, false, this.currentState.matrix);
    }
}
