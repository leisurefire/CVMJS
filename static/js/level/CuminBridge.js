import { GEH } from "../Core.js";
import Level, { level } from "../Level.js";

export default class CuminBridge extends Level {
    static NAME = "孜然断桥";
    static BACKGROUND = "/images/interface/background_33.jpg";
    static MAP_ANIMATION = "/images/interface/bridge.png";

    // 动画相关常量
    static TICK_STEP = 4;
    static CYCLE_LENGTH = 1280;
    static SUB_MOVE_DURATION = 120; // 每个子移动的持续时间

    moveTime = 0;
    mapAnim = "/images/interface/bridge.png";

    // 记录网格实际移动了多少列
    group5678Offset = 0;  // 0, 1, 2 (向左移动)
    group2345Offset = 0;  // 0, -1, -2 (向右移动)

    constructor() {
        super(1000);
        this.StartWaveCreate();
    }

    Enter() {
        GEH.requestBackMusicChange(17);
        this.waterLineGenerate([1, 0, 0, 0, 0, 0, 1]);
        for (let i = 0; i < 9; i++) {
            this.Foods[i].water = true;
        }
        for (let i = 54; i < 63; i++) {
            this.Foods[i].water = true;
        }
        this.initializeBridgeGrids();
        this.createWaveFlag();
        this.setGuardian();
    }

    /**
     * 初始化断桥格子状态
     */
    initializeBridgeGrids() {
        // 设置不可用格子（只设置移动范围内未被有效块覆盖的部分）
        // 第1行(索引1): 有效块5,6,7,8，移动范围3~8，所以3,4列不可用
        this.Foods[1 * level.column_num + 3].noPlace = true;
        this.Foods[1 * level.column_num + 4].noPlace = true;

        // 第2行(索引2): 有效块2,3,4,5，移动范围2~8，所以6,7,8列不可用
        this.Foods[2 * level.column_num + 6].noPlace = true;
        this.Foods[2 * level.column_num + 7].noPlace = true;
        this.Foods[2 * level.column_num + 8].noPlace = true;

        // 第3行(索引3): 有效块5,6,7,8，移动范围3~8，所以3,4列不可用
        this.Foods[3 * level.column_num + 3].noPlace = true;
        this.Foods[3 * level.column_num + 4].noPlace = true;

        // 第4行(索引4): 有效块2,3,4,5，移动范围2~8，所以6,7,8列不可用
        this.Foods[4 * level.column_num + 6].noPlace = true;
        this.Foods[4 * level.column_num + 7].noPlace = true;
        this.Foods[4 * level.column_num + 8].noPlace = true;

        // 第5行(索引5): 有效块5,6,7,8，移动范围3~8，所以3,4列不可用
        this.Foods[5 * level.column_num + 3].noPlace = true;
        this.Foods[5 * level.column_num + 4].noPlace = true;
    }

    victory() {
        return false;
    }

    /**
     * 核心移动逻辑
     */
    mapMove() {
        const prevTime = this.moveTime;
        this.moveTime = (this.moveTime + CuminBridge.TICK_STEP) % CuminBridge.CYCLE_LENGTH;

        // 处理周期重置
        if (this.moveTime < prevTime) {
            this.moveTime = 0;
        }

        // 处理网格更新
        this.handleGridUpdates(prevTime, this.moveTime);

        // 计算视觉偏移
        const offsets = this.calculateVisualOffset();

        // 绘制断桥（使用断桥偏移）
        this.drawBridges(offsets.bridge);

        // 更新实体视觉位置（使用实体偏移）
        this.applyVisualOffsetGroup5678(offsets.entity.group5678);
        this.applyVisualOffsetGroup2345(offsets.entity.group2345);
    }

    /**
     * 处理网格更新 - 在每个子移动完成时更新
     */
    handleGridUpdates(prevTime, currentTime) {
        // === 正向移动子过程1完成 (520时刻) ===
        if (prevTime < 520 && currentTime >= 520) {
            this.shiftGroup5678Left();
            this.shiftGroup2345Right();
            this.group5678Offset = 1;
            this.group2345Offset = -1;
        }

        // === 正向移动子过程2完成 (640时刻) ===
        if (prevTime < 640 && currentTime >= 640) {
            this.shiftGroup5678Left();
            this.shiftGroup2345Right();
            this.group5678Offset = 2;
            this.group2345Offset = -2;
        }

        // === 反向移动子过程1完成 (1160时刻) ===
        if (prevTime < 1160 && currentTime >= 1160) {
            this.shiftGroup5678Right();
            this.shiftGroup2345Left();
            this.group5678Offset = 1;
            this.group2345Offset = -1;
        }

        // === 反向移动子过程2完成 (1280/0时刻) ===
        if ((prevTime < 1280 && currentTime >= 1280) ||
            (prevTime > 1200 && currentTime < 100)) {
            this.shiftGroup5678Right();
            this.shiftGroup2345Left();
            this.group5678Offset = 0;
            this.group2345Offset = 0;
        }
    }

    /**
     * 计算视觉偏移量
     */
    calculateVisualOffset() {
        const ROW_GAP = level.row_gap;
        let group5678BridgeOffset = 0;
        let group2345BridgeOffset = 0;

        // === 正向移动阶段 ===
        if (this.moveTime > 400 && this.moveTime <= 640) {
            if (this.moveTime <= 520) {
                // 子移动1: 视觉移动0到1格
                const progress = (this.moveTime - 400) / CuminBridge.SUB_MOVE_DURATION;
                group5678BridgeOffset = -progress * ROW_GAP;  // 向左
                group2345BridgeOffset = progress * ROW_GAP;   // 向右
            } else {
                // 子移动2: 视觉移动1到2格
                const progress = (this.moveTime - 520) / CuminBridge.SUB_MOVE_DURATION;
                group5678BridgeOffset = -ROW_GAP - progress * ROW_GAP;
                group2345BridgeOffset = ROW_GAP + progress * ROW_GAP;
            }
        }
        // === 静止期2 ===
        else if (this.moveTime > 640 && this.moveTime <= 1040) {
            group5678BridgeOffset = -2 * ROW_GAP;
            group2345BridgeOffset = 2 * ROW_GAP;
        }
        // === 反向移动阶段 ===
        else if (this.moveTime > 1040 && this.moveTime <= 1280) {
            if (this.moveTime <= 1160) {
                // 子移动1: 视觉从2格移动到1格
                const progress = (this.moveTime - 1040) / CuminBridge.SUB_MOVE_DURATION;
                group5678BridgeOffset = -2 * ROW_GAP + progress * ROW_GAP;
                group2345BridgeOffset = 2 * ROW_GAP - progress * ROW_GAP;
            } else {
                // 子移动2: 视觉从1格移动到0格
                const progress = (this.moveTime - 1160) / CuminBridge.SUB_MOVE_DURATION;
                group5678BridgeOffset = -ROW_GAP + progress * ROW_GAP;
                group2345BridgeOffset = ROW_GAP - progress * ROW_GAP;
            }
        }

        // 计算实体偏移 = 断桥视觉偏移 - 网格已移动的量
        // group5678Offset: 正值表示向左移动，实际X偏移 = -offset * ROW_GAP
        // group2345Offset: 负值表示向右移动，实际X偏移 = -offset * ROW_GAP
        const group5678EntityOffset = group5678BridgeOffset - this.group5678Offset * (-ROW_GAP);
        const group2345EntityOffset = group2345BridgeOffset - this.group2345Offset * (-ROW_GAP);

        return {
            bridge: { group5678: group5678BridgeOffset, group2345: group2345BridgeOffset },
            entity: { group5678: group5678EntityOffset, group2345: group2345EntityOffset }
        };
    }

    /**
     * 绘制断桥背景
     */
    drawBridges(bridgeOffset) {
        const anim = GEH.requestDrawImage(this.mapAnim);
        if (!anim || !this.Battlefield.ctxBG) return;

        const ctx = this.Battlefield.ctxBG;

        // 绘制各行的断桥片段
        // 第1,3,5行 (group5678)
        [1, 3, 5].forEach(row => {
            const x = level.column_start + 5 * level.row_gap + bridgeOffset.group5678;
            const y = level.row_start + row * level.column_gap;
            ctx.drawImage(anim, x, y);
        });

        // 第2,4行 (group2345)
        [2, 4].forEach(row => {
            const x = level.column_start + 2 * level.row_gap + bridgeOffset.group2345;
            const y = level.row_start + row * level.column_gap;
            ctx.drawImage(anim, x, y);
        });
    }

    /**
     * group5678 向左移动: 内容向左移动一列
     */
    shiftGroup5678Left() {
        const targetRows = [1, 3, 5];

        targetRows.forEach(row => {
            // 保存当前行的数据
            const tempData = {};
            for (let col = 3; col <= 8; col++) {
                const idx = row * level.column_num + col;
                tempData[col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }

            // 更新网格：每列接收右边一列的数据
            for (let col = 3; col <= 8; col++) {
                const idx = row * level.column_num + col;

                if (col === 8) {
                    // 最右列变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从右边一列复制数据
                    const sourceData = tempData[col + 1];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体列号
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.column = col;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.column = col;
                    }
                }
            }
        });
    }

    /**
     * group2345 向右移动: 内容向右移动一列
     */
    shiftGroup2345Right() {
        const targetRows = [2, 4];

        targetRows.forEach(row => {
            // 保存当前行的数据
            const tempData = {};
            for (let col = 2; col <= 8; col++) {
                const idx = row * level.column_num + col;
                tempData[col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }

            // 更新网格：每列接收左边一列的数据
            for (let col = 2; col <= 8; col++) {
                const idx = row * level.column_num + col;

                if (col === 2) {
                    // 最左列变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从左边一列复制数据
                    const sourceData = tempData[col - 1];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体列号
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.column = col;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.column = col;
                    }
                }
            }
        });
    }

    /**
     * group5678 向右移动: 内容向右移动一列（反向）
     */
    shiftGroup5678Right() {
        const targetRows = [1, 3, 5];

        targetRows.forEach(row => {
            // 保存当前行的数据
            const tempData = {};
            for (let col = 3; col <= 8; col++) {
                const idx = row * level.column_num + col;
                tempData[col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }

            // 更新网格：每列接收左边一列的数据
            for (let col = 3; col <= 8; col++) {
                const idx = row * level.column_num + col;

                if (col === 3) {
                    // 最左列变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从左边一列复制数据
                    const sourceData = tempData[col - 1];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体列号
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.column = col;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.column = col;
                    }
                }
            }
        });
    }

    /**
     * group2345 向左移动: 内容向左移动一列（反向）
     */
    shiftGroup2345Left() {
        const targetRows = [2, 4];

        targetRows.forEach(row => {
            // 保存当前行的数据
            const tempData = {};
            for (let col = 2; col <= 8; col++) {
                const idx = row * level.column_num + col;
                tempData[col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }

            // 更新网格：每列接收右边一列的数据
            for (let col = 2; col <= 8; col++) {
                const idx = row * level.column_num + col;

                if (col === 8) {
                    // 最右列变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从右边一列复制数据
                    const sourceData = tempData[col + 1];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体列号
                    if (this.Foods[idx].layer_1) {
                        this.Foods[idx].layer_1.column = col;
                    }
                    if (this.Foods[idx].layer_0) {
                        this.Foods[idx].layer_0.column = col;
                    }
                }
            }
        });
    }

    /**
     * 应用视觉偏移到 group5678 实体
     * 关键：使用循环变量 col（当前网格位置）+ 实体偏移
     */
    applyVisualOffsetGroup5678(offsetX) {
        const targetRows = [1, 3, 5];

        targetRows.forEach(row => {
            for (let col = 3; col <= 8; col++) {
                const grid = this.Foods[row * level.column_num + col];

                [grid.layer_1, grid.layer_0].forEach(entity => {
                    if (entity) {
                        const ctor = entity.constructor;
                        // 使用当前网格的列号 col 计算基础位置
                        const baseX = level.column_start + col * level.row_gap;
                        const ctorOffset = ctor.offset ? ctor.offset[0] : 0;
                        entity.x = baseX + ctorOffset + offsetX;
                    }
                });
            }
        });
    }

    /**
     * 应用视觉偏移到 group2345 实体
     * 关键：使用循环变量 col（当前网格位置）+ 实体偏移
     */
    applyVisualOffsetGroup2345(offsetX) {
        const targetRows = [2, 4];

        targetRows.forEach(row => {
            for (let col = 2; col <= 8; col++) {
                const grid = this.Foods[row * level.column_num + col];

                [grid.layer_1, grid.layer_0].forEach(entity => {
                    if (entity) {
                        const ctor = entity.constructor;
                        // 使用当前网格的列号 col 计算基础位置
                        const baseX = level.column_start + col * level.row_gap;
                        const ctorOffset = ctor.offset ? ctor.offset[0] : 0;
                        entity.x = baseX + ctorOffset + offsetX;
                    }
                });
            }
        });
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(0, 1, 1);
        this.Load();
    }
}