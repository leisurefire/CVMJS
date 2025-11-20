/**
 * shaders.ts
 * WebGL着色器程序定义
 * 支持2D精灵渲染和特效(受击变红、冰冻变蓝、镜像反转)
 */
/**
 * 顶点着色器
 * 处理2D变换和UV映射
 */
export const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute float a_alpha;
attribute vec3 a_effects; // x:isHit, y:isFrozen, z:isMirrored

uniform mat3 u_matrix;

varying vec2 v_texCoord;
varying float v_alpha;
varying vec3 v_effects;

void main() {
  vec3 position = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
  
  v_texCoord = a_texCoord;
  v_alpha = a_alpha;
  v_effects = a_effects;
}
`;
/**
 * 片元着色器
 * 支持透明度、受击变红、冰冻变蓝、镜像反转特效
 */
export const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;
varying float v_alpha;
varying vec3 v_effects;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  
  // 应用透明度
  color.a *= v_alpha;
  
  // 受击变红特效
  if (v_effects.x > 0.5) {
    color.r = min(color.r + 0.3, 1.0);
  }
  
  // 冰冻变蓝特效
  if (v_effects.y > 0.5) {
    color.b = min(color.b + 0.3, 1.0);
    color.r *= 0.7;
    color.g *= 0.7;
  }
  
  gl_FragColor = color;
}
`;
/**
 * 编译着色器
 * @param gl WebGL上下文
 * @param type 着色器类型
 * @param source 着色器源码
 * @returns 编译后的着色器对象
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Failed to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${info}`);
    }
    return shader;
}
/**
 * 创建着色器程序
 * @param gl WebGL上下文
 * @param vertexSource 顶点着色器源码
 * @param fragmentSource 片元着色器源码
 * @returns 链接后的着色器程序
 */
export function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) {
        throw new Error("Failed to create program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program linking failed: ${info}`);
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
}
