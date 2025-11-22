import { GEH } from "./Core.js";
import Level, { level } from "./Level.js";
import { MapGrid } from "./GameBattlefield.js";
import type { IRenderer } from "./renderer/IRenderer.js";
import { Food } from "./Foods.js";

/**
 * 茴香竹筏关卡
 * 核心机制：移动的竹筏 - 地图上的部分网格会周期性地上下移动
 * 周期长度：1281 ticks (每帧 +4)
 * 
 * 状态机：
 * - 0-400: 静止
 * - 401-640: 第一移动阶段（左侧竹筏向下，右侧竹筏向上）
 *   - tick 520, 640: 执行逻辑网格位移
 * - 641-1040: 静止
 * - 1041-1280: 第二移动阶段（左侧竹筏向上，右侧竹筏向下）
 *   - tick 1160, 1280: 执行逻辑网格位移
 * 
 * 布局：
 * - 左侧竹筏：列 1-4 (索引 1-4)
 * - 右侧竹筏：列 5-8 (索引 5-8)
 * - 列 0 和列 8 为固定区域
 */
export default class FennelRaft extends Level {
    static NAME = "茴香竹筏";
    static BACKGROUND = "/images/interface/background_0.jpg";
    static MAP_ANIMATION = "/images/interface/raft.png";

    moveTime = 0;
    mapAnim: string = "/images/interface/raft.png";

    constructor() {
        super(3); // interval参数：两波之间的准备时间（原版传入3）
        this.StartWaveCreate();
    }

    /**
     * 关卡初始化
     * 基于原始 FennelRaft.js Enter() 实现
     */
    Enter() {
        GEH.requestBackMusicChange(17); // BGM

        // 初始化所有格子
        for (let i = 0; i < level.row_num * level.column_num; i++) {
            this.Foods[i] = new MapGrid();
        }

        // 设置初始的不可放置区域
        // 原始代码索引：i + 4 对应列 5-8（右侧竹筏的前半部分）
        // i + 45 和 i + 54 对应底部区域
        for (let i = 1; i < 5; i++) {
            this.Foods[i + 4].noPlace = true;           // Row 0, Col 5-8
            this.Foods[9 + i + 4].noPlace = true;       // Row 1, Col 5-8
            this.Foods[i + 45].noPlace = true;          // Row 5, Col 2-5
            this.Foods[i + 54].noPlace = true;          // Row 6, Col 2-5
        }

        this.setGuardian();
    }

    /**
     * 覆盖 victory() 方法
     * 原版返回 false，可能意味着不是标准的通关条件
     */
    victory() {
        return false;
    }

    /**
     * 核心移动逻辑 - 每帧调用
     * 完全基于原始 FennelRaft.js mapMove() 实现
     */
    mapMove() {
        // 绘制竹筏背景
        const anim = GEH.requestImageCache(this.mapAnim);
        if (anim) {
            // 使用类型断言访问私有 Battlefield 属性
            const battlefield = (this as any).Battlefield;
            // 注意：原版使用 BattleBackground，在新架构中需要访问背景 Canvas
            // 这里假设使用主 Canvas 进行绘制
            const ctx = battlefield?.Canvas?.getContext('2d');
            if (ctx) {
                // 绘制两个竹筏位置
                ctx.drawImage(anim, level.column_start + 62, level.row_start);
                ctx.drawImage(anim, level.column_end - 60 * 4, level.row_start + level.row_gap * 2);
            }
        }

        // 更新时间周期
        this.moveTime = (this.moveTime + 4) % 1281;

        // 阶段 1: 左下右上 (401-640)
        if (this.moveTime > 400 && this.moveTime <= 640) {
            // 视觉偏移更新
            for (let i = level.row_num - 1; i >= 0; i--) {
                // 左侧竹筏（列 1-4）向下移动
                for (let j = 0; j < 4; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 400) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) + offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) + offset;
                    }
                }

                // 右侧竹筏（列 4-7）向上移动
                for (let j = 4; j < 8; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 400) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) - offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) - offset;
                    }
                }
            }

            // 逻辑网格位移（关键帧 520, 640）
            if (this.moveTime === 520 || this.moveTime === 640) {
                // 左侧竹筏逻辑下移
                for (let i = level.row_num - 1; i >= 0; i--) {
                    for (let j = 0; j < 4; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === 0) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const prevIdx = 1 + (i - 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[prevIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row += 1;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row += 1;
                        }

                        // 边界处理
                        if (this.moveTime === 520) {
                            if (i === level.row_num - 1) {
                                this.Foods[idx] = new MapGrid();
                                this.Foods[idx].noPlace = true;
                            }
                        } else {
                            if (i === 1) {
                                this.Foods[idx] = new MapGrid();
                                this.Foods[idx].noPlace = true;
                            }
                        }
                    }
                }

                // 右侧竹筏逻辑上移
                for (let i = 0; i < level.row_num; i++) {
                    for (let j = 4; j < 8; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === level.row_num - 1) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const nextIdx = 1 + (i + 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[nextIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row -= 1;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row -= 1;
                        }

                        // 边界处理
                        if (this.moveTime === 520) {
                            if (i === 0) {
                                this.Foods[idx] = new MapGrid();
                                this.Foods[idx].noPlace = true;
                            }
                        } else {
                            if (i === level.row_num - 2) {
                                this.Foods[idx] = new MapGrid();
                                this.Foods[idx].noPlace = true;
                            }
                        }
                    }
                }
            }
        }
        // 阶段 2: 左上右下 (1040-1160)
        else if (this.moveTime >= 1040 && this.moveTime <= 1160) {
            // 视觉偏移更新
            for (let i = 0; i < level.row_num; i++) {
                // 左侧竹筏向上移动
                for (let j = 0; j < 4; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 1040) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) - offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) - offset;
                    }
                }

                // 右侧竹筏向下移动
                for (let j = 4; j < 8; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 1040) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) + offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) + offset;
                    }
                }
            }

            // 逻辑网格位移（关键帧 1160）
            if (this.moveTime === 1160) {
                // 左侧竹筏逻辑上移
                for (let i = 0; i < level.row_num; i++) {
                    for (let j = 0; j < 4; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === level.row_num - 1) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const nextIdx = 1 + (i + 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[nextIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row -= 1;
                            this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_1!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row -= 1;
                            this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_0!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        
                        if (i === 0) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                        }
                    }
                }

                // 右侧竹筏逻辑下移
                for (let i = level.row_num - 1; i >= 0; i--) {
                    for (let j = 4; j < 8; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === 0) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const prevIdx = 1 + (i - 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[prevIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row += 1;
                            this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_1!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row += 1;
                            this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_0!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }

                        if (i === level.row_num - 1) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                        }
                    }
                }
            }
        }
        // 阶段 3: 继续移动 (1160-1280)
        else if (this.moveTime > 1160 && this.moveTime <= 1280) {
            // 视觉偏移更新
            for (let i = 0; i < level.row_num; i++) {
                // 左侧竹筏向上移动
                for (let j = 0; j < 4; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 1040) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) - offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) - offset;
                    }
                }

                // 右侧竹筏向下移动
                for (let j = 4; j < 8; j++) {
                    const idx = 1 + i * level.column_num + j;
                    const offset = (this.moveTime - 1040) % 121 / 2;
                    
                    if (this.Foods[idx].layer_1 != null) {
                        this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_1!.height / 2) + offset;
                    }
                    if (this.Foods[idx].layer_0 != null) {
                        this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                            - this.Foods[idx].layer_0!.height / 2) + offset;
                    }
                }
            }

            // 逻辑网格位移（关键帧 1280）
            if (this.moveTime === 1280) {
                // 左侧竹筏逻辑上移
                for (let i = 0; i < level.row_num; i++) {
                    for (let j = 0; j < 4; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === level.row_num - 1) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const nextIdx = 1 + (i + 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[nextIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row -= 1;
                            this.Foods[idx].layer_1!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_1!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row -= 1;
                            this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_0!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        
                        if (i === level.row_num - 2) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                        }
                    }
                }

                // 右侧竹筏逻辑下移
                for (let i = level.row_num - 1; i >= 0; i--) {
                    for (let j = 4; j < 8; j++) {
                        const idx = 1 + i * level.column_num + j;
                        
                        if (i === 0) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                            continue;
                        }

                        const prevIdx = 1 + (i - 1) * level.column_num + j;
                        this.Foods[idx] = this.Foods[prevIdx];

                        if (this.Foods[idx].layer_1 != null) {
                            this.Foods[idx].layer_1!.row += 1;
                            this.Foods[idx].layer_1!.y = (this.Foods[idx].layer_1!.row * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_1!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        if (this.Foods[idx].layer_0 != null) {
                            this.Foods[idx].layer_0!.row += 1;
                            this.Foods[idx].layer_0!.y = (i * level.row_gap + level.row_start 
                                - this.Foods[idx].layer_0!.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2;
                        }
                        
                        if (i === 1) {
                            this.Foods[idx] = new MapGrid();
                            this.Foods[idx].noPlace = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * 波次生成逻辑
     * 基于原始 FennelRaft.js 实现
     */
    StartWaveCreate() {
        // 原版只创建一个简单的测试波次
        // type: 0 (基础老鼠), num: 1, end: 1 (结束此波)
        this.waveCreate(0, 1, 1);
        // GetAssets() 在 TypeScript 版本中已由父类的构造流程自动处理
    }
}
