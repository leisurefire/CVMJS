import EventHandler from '../event_handler/EventHandler.js';
// ---- I18n Module ----
class I18nModule {
    static instance;
    dictionary = {};
    isLoaded = false;
    loadPromise = null;
    constructor() { }
    static getInstance() {
        if (!I18nModule.instance) {
            I18nModule.instance = new I18nModule();
        }
        return I18nModule.instance;
    }
    /**
     * 加载语言文件，确保在应用启动时调用
     */
    async loadLanguage(locale = 'zh-CN') {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        this.loadPromise = new Promise((resolve, reject) => {
            fetch(EventHandler.getStaticPath(`i18n/${locale}.json`))
                .then(res => res.json())
                .then(data => {
                this.dictionary = data;
                this.isLoaded = true;
                resolve();
            })
                .catch(err => {
                console.error('Failed to load i18n:', err);
                // 设置空字典作为fallback
                this.dictionary = {};
                this.isLoaded = true;
                resolve(); // 不要reject，让应用继续运行
            });
        });
        return this.loadPromise;
    }
    /**
     * 翻译函数
     */
    t(key, options) {
        if (!key) {
            return options?.fallback ?? "";
        }
        // 如果还未加载完成，返回key或fallback
        if (!this.isLoaded) {
            console.warn(`i18n not loaded yet, returning key: ${key}`);
            return options?.fallback ?? key;
        }
        const segments = key.split('.').filter(Boolean);
        let value = this.dictionary;
        for (const segment of segments) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                value = value[segment];
            }
            else {
                value = undefined;
                break;
            }
        }
        let resolved;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            resolved = String(value);
        }
        else if (Array.isArray(value)) {
            resolved = value.map(v => String(v)).join(options?.joiner ?? "");
        }
        resolved ??= options?.fallback ?? key;
        // 参数替换
        if (resolved && options?.params) {
            resolved = resolved.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, token) => {
                const replacement = options.params?.[token];
                return typeof replacement === "number" || typeof replacement === "boolean" || typeof replacement === "string"
                    ? String(replacement)
                    : match;
            });
        }
        return resolved;
    }
    /**
     * 检查是否已加载
     */
    isReady() {
        return this.isLoaded;
    }
    /**
     * 获取加载Promise
     */
    getLoadPromise() {
        return this.loadPromise ?? Promise.resolve();
    }
}
// 导出单例实例
export const i18n = I18nModule.getInstance();
// 便捷的翻译函数
export const t = i18n.t.bind(i18n);
