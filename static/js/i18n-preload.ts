"use strict";
import { i18n } from "./i18n/index.js";

// 在所有其他模块加载之前预加载i18n
const i18nLoadPromise = i18n.loadLanguage('zh-CN');

// 导出Promise和i18n实例，确保所有模块都能等待i18n加载完成
export { i18n, i18nLoadPromise };

// 等待i18n加载完成后再继续
export async function waitForI18n() {
    await i18nLoadPromise;
}

// 检查i18n是否已经加载
export function isI18nReady(): boolean {
    return i18n.isReady();
}