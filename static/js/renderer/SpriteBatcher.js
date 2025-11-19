/**
 * SpriteBatcher.ts
 * 精灵批处理器
 * 合并相同纹理的绘制调用以减少Draw Call
 */
/**
 * 精灵批处理器
 * 单批次最大1000个精灵
 */
export class SpriteBatcher {
    gl;
    program;
    maxSprites;
    vertexBuffer;
    vertexData;
    sprites;
    currentTexture;
    spriteCount;
    // 每个精灵6个顶点(2个三角形),每个顶点8个float(x,y,u,v,alpha,hit,frozen,mirrored)
    static FLOATS_PER_VERTEX = 8;
    static VERTICES_PER_SPRITE = 6;
    constructor(gl, program, maxSprites = 1000) {
        this.gl = gl;
        this.program = program;
        this.maxSprites = maxSprites;
        this.sprites = [];
        this.currentTexture = null;
        this.spriteCount = 0;
        const bufferSize = maxSprites * SpriteBatcher.VERTICES_PER_SPRITE * SpriteBatcher.FLOATS_PER_VERTEX;
        this.vertexData = new Float32Array(bufferSize);
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("Failed to create vertex buffer");
        }
        this.vertexBuffer = buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);
    }
    /**
     * 添加精灵到批次
     */
    addSprite(texture, sx, sy, sw, sh, dx, dy, dw, dh, alpha, effects, textureWidth, textureHeight) {
        if (this.currentTexture && this.currentTexture !== texture) {
            this.flush();
        }
        if (this.spriteCount >= this.maxSprites) {
            this.flush();
        }
        this.currentTexture = texture;
        const u0 = sx / textureWidth;
        const v0 = sy / textureHeight;
        const u1 = (sx + sw) / textureWidth;
        const v1 = (sy + sh) / textureHeight;
        const hit = effects.isHit ? 1.0 : 0.0;
        const frozen = effects.isFrozen ? 1.0 : 0.0;
        const mirrored = effects.isMirrored ? 1.0 : 0.0;
        const offset = this.spriteCount * SpriteBatcher.VERTICES_PER_SPRITE * SpriteBatcher.FLOATS_PER_VERTEX;
        const d = this.vertexData;
        // 三角形1
        d[offset + 0] = dx;
        d[offset + 1] = dy;
        d[offset + 2] = u0;
        d[offset + 3] = v0;
        d[offset + 4] = alpha;
        d[offset + 5] = hit;
        d[offset + 6] = frozen;
        d[offset + 7] = mirrored;
        d[offset + 8] = dx + dw;
        d[offset + 9] = dy;
        d[offset + 10] = u1;
        d[offset + 11] = v0;
        d[offset + 12] = alpha;
        d[offset + 13] = hit;
        d[offset + 14] = frozen;
        d[offset + 15] = mirrored;
        d[offset + 16] = dx;
        d[offset + 17] = dy + dh;
        d[offset + 18] = u0;
        d[offset + 19] = v1;
        d[offset + 20] = alpha;
        d[offset + 21] = hit;
        d[offset + 22] = frozen;
        d[offset + 23] = mirrored;
        // 三角形2
        d[offset + 24] = dx;
        d[offset + 25] = dy + dh;
        d[offset + 26] = u0;
        d[offset + 27] = v1;
        d[offset + 28] = alpha;
        d[offset + 29] = hit;
        d[offset + 30] = frozen;
        d[offset + 31] = mirrored;
        d[offset + 32] = dx + dw;
        d[offset + 33] = dy;
        d[offset + 34] = u1;
        d[offset + 35] = v0;
        d[offset + 36] = alpha;
        d[offset + 37] = hit;
        d[offset + 38] = frozen;
        d[offset + 39] = mirrored;
        d[offset + 40] = dx + dw;
        d[offset + 41] = dy + dh;
        d[offset + 42] = u1;
        d[offset + 43] = v1;
        d[offset + 44] = alpha;
        d[offset + 45] = hit;
        d[offset + 46] = frozen;
        d[offset + 47] = mirrored;
        this.spriteCount++;
    }
    /**
     * 提交批次到GPU渲染
     */
    flush() {
        if (this.spriteCount === 0)
            return;
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData.subarray(0, this.spriteCount * SpriteBatcher.VERTICES_PER_SPRITE * SpriteBatcher.FLOATS_PER_VERTEX));
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
        gl.drawArrays(gl.TRIANGLES, 0, this.spriteCount * SpriteBatcher.VERTICES_PER_SPRITE);
        this.spriteCount = 0;
        this.currentTexture = null;
    }
    /**
     * 释放资源
     */
    dispose() {
        this.gl.deleteBuffer(this.vertexBuffer);
    }
}
