import { GEH } from "../Core.js";
import Level, { level } from "../Level.js";
import { MapGrid } from "../GameBattlefield.js";


/**  
 * 茴香竹筏关卡  
 *   
 * 周期: 1281 ticks (每帧 +4, 实际0-1280)  
 *   
 * 动画逻辑 (每个周期完全相同):  
 * - 0-400: 静止  
 * - 401-640: 正向移动 (左下右上)  
 *   - 401-520: 子移动1, 在520完成时更新网格  
 *   - 521-640: 子移动2, 在640完成时更新网格  
 * - 641-1040: 静止  
 * - 1041-1280: 反向移动 (左上右下)  
 *   - 1041-1160: 子移动1, 在1160完成时更新网格  
 *   - 1161-1280: 子移动2, 在1280/0完成时更新网格  
 *   
 * 竹筏布局:  
 * - 左侧竹筏 (列1-4): 初始行0-4, 正向后行2-6, 反向后回到行0-4  
 * - 右侧竹筏 (列5-8): 初始行2-6, 正向后行0-4, 反向后回到行2-6  
 */
export default class FennelRaft extends Level {
    static NAME = "茴香竹筏";
    static BACKGROUND = "/images/interface/background_33.jpg";
    static MAP_ANIMATION = "/images/interface/raft.png";


    moveTime = 0;
    mapAnim = "/images/interface/raft.png";


    constructor() {
        super();
        this.StartWaveCreate();
    }


    Enter() {
        GEH.requestBackMusicChange(17);


        // 左侧竹筏初始: 行0-4可用, 行5-6禁用  
        for (let row = 5; row < level.row_num; row++) {
            for (let col = 1; col <= 4; col++) {
                this.Foods[row * level.column_num + col].noPlace = true;
            }
        }


        // 右侧竹筏初始: 行2-6可用, 行0-1禁用  
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col <= 8; col++) {
                this.Foods[row * level.column_num + col].noPlace = true;
            }
        }


        this.createWaveFlag();
        this.setGuardian();
    }


    victory() {
        return false;
    }


    /**  
     * 核心移动逻辑  
     */
    mapMove() {
        const COL_GAP = level.column_gap; // 64px  
        const SUBPROCESS_DURATION = 120;


        const prevTime = this.moveTime;
        this.moveTime = (this.moveTime + 4) % 1281;


        // MapAnim的偏移量 (相对于初始位置)  
        let leftRaftOffsetY = 0;
        let rightRaftOffsetY = 0;


        // === 正向移动阶段: 401-640 (左下右上) ===  
        if (this.moveTime > 400 && this.moveTime <= 640) {
            if (this.moveTime <= 520) {
                // 子移动1: 401-520  
                const progress = this.moveTime - 400; // 1-120  
                leftRaftOffsetY = (progress / SUBPROCESS_DURATION) * COL_GAP;
                rightRaftOffsetY = -(progress / SUBPROCESS_DURATION) * COL_GAP;


                // 在520时刻完成, 更新网格  
                if (prevTime < 520 && this.moveTime >= 520) {
                    this.shiftRaftDown(1, 4);
                    this.shiftRaftUp(5, 8);
                }
            } else {
                // 子移动2: 521-640  
                // 已经完成了1次移动 (64px), 现在继续移动  
                const progress = this.moveTime - 520; // 1-120  
                leftRaftOffsetY = COL_GAP + (progress / SUBPROCESS_DURATION) * COL_GAP;
                rightRaftOffsetY = -COL_GAP - (progress / SUBPROCESS_DURATION) * COL_GAP;


                // 在640时刻完成, 更新网格  
                if (prevTime < 640 && this.moveTime >= 640) {
                    this.shiftRaftDown(1, 4);
                    this.shiftRaftUp(5, 8);
                }
            }
        }
        // === 反向移动阶段: 1041-1280 (左上右下) ===  
        else if (this.moveTime >= 1041 && this.moveTime <= 1280) {
            if (this.moveTime <= 1160) {
                // 子移动1: 1041-1160  
                // 从正向结束位置 (+2*COL_GAP) 开始向回移动  
                const progress = this.moveTime - 1040; // 1-120  
                leftRaftOffsetY = 2 * COL_GAP - (progress / SUBPROCESS_DURATION) * COL_GAP;
                rightRaftOffsetY = -2 * COL_GAP + (progress / SUBPROCESS_DURATION) * COL_GAP;


                // 在1160时刻完成, 更新网格  
                if (prevTime < 1160 && this.moveTime >= 1160) {
                    this.shiftRaftUp(1, 4);
                    this.shiftRaftDown(5, 8);
                }
            } else {
                // 子移动2: 1161-1280  
                const progress = this.moveTime - 1160; // 1-120  
                leftRaftOffsetY = COL_GAP - (progress / SUBPROCESS_DURATION) * COL_GAP;
                rightRaftOffsetY = -COL_GAP + (progress / SUBPROCESS_DURATION) * COL_GAP;


                // 在1280/0时刻完成, 更新网格  
                if ((prevTime < 1280 && this.moveTime >= 1280) ||
                    (prevTime > 1200 && this.moveTime < 100)) {
                    this.shiftRaftUp(1, 4);
                    this.shiftRaftDown(5, 8);
                }
            }
        }
        // === 第二个静止阶段: 641-1040 ===  
        else if (this.moveTime > 640 && this.moveTime <= 1040) {
            // 保持正向移动结束的位置  
            leftRaftOffsetY = 2 * COL_GAP;
            rightRaftOffsetY = -2 * COL_GAP;
        }
        // === 第一个静止阶段: 0-400 ===  
        // leftRaftOffsetY = 0, rightRaftOffsetY = 0 (默认值)  


        // 绘制竹筏背景  
        const anim = GEH.requestDrawImage(this.mapAnim);
        if (anim && this.Battlefield.ctxBG) {
            const ctx = this.Battlefield.ctxBG;


            // 左侧竹筏: 列1-4, 初始在行0  
            const leftX = level.column_start + level.row_gap + 2;
            const leftY = level.row_start + leftRaftOffsetY;
            ctx.drawImage(anim, leftX, leftY);


            // 右侧竹筏: 列5-8, 初始在行2  
            const rightX = level.column_start + 5 * level.row_gap;
            const rightY = level.row_start + 2 * COL_GAP + rightRaftOffsetY;
            ctx.drawImage(anim, rightX, rightY);
        }


        // 应用视觉偏移到实体  
        this.applyVisualOffset(1, 4, leftRaftOffsetY);
        this.applyVisualOffset(5, 8, rightRaftOffsetY);
    }


    /**  
     * 应用视觉偏移  
     */
    applyVisualOffset(colStart, colEnd, offsetY) {
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const grid = this.Foods[row * level.column_num + col];


                if (grid.layer_1) {
                    const ctor = grid.layer_1.constructor;
                    const baseY = level.row_start + row * level.column_gap;
                    const ctorOffset = ctor.offset ? ctor.offset[1] : 0;
                    const typeOffset = grid.layer_1.type ? -10 : 0;
                    grid.layer_1.y = baseY + ctorOffset + typeOffset + offsetY;
                }


                if (grid.layer_0) {
                    const ctor = grid.layer_0.constructor;
                    const baseY = level.row_start + row * level.column_gap;
                    const ctorOffset = ctor.offset ? ctor.offset[1] : 0;
                    const typeOffset = grid.layer_0.type ? -10 : 0;
                    grid.layer_0.y = baseY + ctorOffset + typeOffset + offsetY;
                }
            }
        }
    }


    /**  
     * 竹筏下移: 内容向下移动一行  
     */
    shiftRaftDown(colStart, colEnd) {
        // 先保存所有需要移动的数据  
        const tempData = [];
        for (let row = 0; row < level.row_num; row++) {
            tempData[row] = [];
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;
                tempData[row][col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }
        }


        // 统一更新: 每行的数据来自上一行  
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;


                if (row === 0) {
                    // 顶部行: 设为noPlace  
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 其他行: 从上一行复制  
                    this.Foods[idx].layer_1 = tempData[row - 1][col].layer_1;
                    this.Foods[idx].layer_0 = tempData[row - 1][col].layer_0;
                    this.Foods[idx].noPlace = tempData[row - 1][col].noPlace;


                    // 更新实体的行号  
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.row = row;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.row = row;
                    }
                }
            }
        }
    }


    /**  
     * 竹筏上移: 内容向上移动一行  
     */
    shiftRaftUp(colStart, colEnd) {
        // 先保存所有需要移动的数据  
        const tempData = [];
        for (let row = 0; row < level.row_num; row++) {
            tempData[row] = [];
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;
                tempData[row][col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }
        }


        // 统一更新: 每行的数据来自下一行  
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;


                if (row === level.row_num - 1) {
                    // 底部行: 设为noPlace  
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 其他行: 从下一行复制  
                    this.Foods[idx].layer_1 = tempData[row + 1][col].layer_1;
                    this.Foods[idx].layer_0 = tempData[row + 1][col].layer_0;
                    this.Foods[idx].noPlace = tempData[row + 1][col].noPlace;


                    // 更新实体的行号  
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.row = row;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.row = row;
                    }
                }
            }
        }
    }


    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.Load();
    }
}