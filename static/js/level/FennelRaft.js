import { GEH } from "../Core.js";
import Level, { level } from "../Level.js";

export default class FennelRaft extends Level {
    static NAME = "茴香竹筏";
    static BACKGROUND = "/images/interface/background_33.jpg";
    static MAP_ANIMATION = "/images/interface/raft.png";

    // 动画相关常量
    static TICK_STEP = 4;
    static CYCLE_LENGTH = 1280;
    static SUB_MOVE_DURATION = 120; // 每个子移动的持续时间

    moveTime = 0;
    mapAnim = "/images/interface/raft.png";

    // 记录网格实际移动了多少行
    leftGridOffset = 0;  // 0, 1, 2
    rightGridOffset = 0; // 0, -1, -2

    constructor() {
        super(1000);
        this.StartWaveCreate();
    }

    Enter() {
        GEH.requestBackMusicChange(17);
        this.initializeRaftGrids();
        this.createWaveFlag();
        this.setGuardian();
    }

    /**
     * 初始化竹筏格子状态
     */
    initializeRaftGrids() {
        // 左筏初始位置：行0-4可用
        for (let row = 5; row < level.row_num; row++) {
            for (let col = 1; col <= 4; col++) {
                this.Foods[row * level.column_num + col].noPlace = true;
            }
        }

        // 右筏初始位置：行2-6可用
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col <= 8; col++) {
                this.Foods[row * level.column_num + col].noPlace = true;
            }
        }
    }

    BOSSWaveSummon() {
        getMouseDetails(0).summon();
        getMouseDetails(0).summon();
        getMouseDetails(1).summon();
        getMouseDetails(1).summon();
        getMouseDetails(2).summon();
        getMouseDetails(2).summon();
        getMouseDetails(3).summon();
        getMouseDetails(3).summon();
        getMouseDetails(8).summon();
        getMouseDetails(8).summon();
        getMouseDetails(11).summon();
    }

    CreateBossBar(target) {
        GEH.requestBackMusicChange(7);
        return super.CreateBossBar(target);
    }

    victory() {
        return false;
    }

    /**
     * 核心移动逻辑
     */
    mapMove() {
        const prevTime = this.moveTime;
        this.moveTime = (this.moveTime + FennelRaft.TICK_STEP) % FennelRaft.CYCLE_LENGTH;

        // 处理周期重置
        if (this.moveTime < prevTime) {
            this.moveTime = 0;
        }

        // 处理网格更新
        this.handleGridUpdates(prevTime, this.moveTime);

        // 计算视觉偏移
        const offsets = this.calculateVisualOffset();

        // 绘制竹筏（使用竹筏偏移）
        this.drawRafts(offsets.raft);

        // 更新实体视觉位置（使用实体偏移）
        this.applyVisualOffset(1, 4, offsets.entity.left);
        this.applyVisualOffset(5, 8, offsets.entity.right);
    }

    /**
     * 处理网格更新 - 在每个子移动完成时更新
     */
    handleGridUpdates(prevTime, currentTime) {
        // === 正向移动子过程1完成 (520时刻) ===
        if (prevTime < 520 && currentTime >= 520) {
            this.shiftRaftDown(1, 4);
            this.shiftRaftUp(5, 8);
            this.leftGridOffset = 1;
            this.rightGridOffset = -1;
        }

        // === 正向移动子过程2完成 (640时刻) ===
        if (prevTime < 640 && currentTime >= 640) {
            this.shiftRaftDown(1, 4);
            this.shiftRaftUp(5, 8);
            this.leftGridOffset = 2;
            this.rightGridOffset = -2;
        }

        // === 反向移动子过程1完成 (1160时刻) ===
        if (prevTime < 1160 && currentTime >= 1160) {
            this.shiftRaftUp(1, 4);
            this.shiftRaftDown(5, 8);
            this.leftGridOffset = 1;
            this.rightGridOffset = -1;
        }

        // === 反向移动子过程2完成 (1280/0时刻) ===
        if ((prevTime < 1280 && currentTime >= 1280) ||
            (prevTime > 1200 && currentTime < 100)) {
            this.shiftRaftUp(1, 4);
            this.shiftRaftDown(5, 8);
            this.leftGridOffset = 0;
            this.rightGridOffset = 0;
        }
    }

    /**
     * 计算视觉偏移量
     * 返回: 
     * - raft: 竹筏背景的完整视觉偏移
     * - entity: 实体需要的额外偏移（已补偿网格移动）
     */
    calculateVisualOffset() {
        const COL_GAP = level.column_gap;
        let leftRaftOffset = 0;
        let rightRaftOffset = 0;

        // === 正向移动阶段 ===
        if (this.moveTime > 400 && this.moveTime <= 640) {
            if (this.moveTime <= 520) {
                // 子移动1: 视觉移动0到1格
                const progress = (this.moveTime - 400) / FennelRaft.SUB_MOVE_DURATION;
                leftRaftOffset = progress * COL_GAP;
                rightRaftOffset = -progress * COL_GAP;
            } else {
                // 子移动2: 视觉移动1到2格
                const progress = (this.moveTime - 520) / FennelRaft.SUB_MOVE_DURATION;
                leftRaftOffset = COL_GAP + progress * COL_GAP;
                rightRaftOffset = -COL_GAP - progress * COL_GAP;
            }
        }
        // === 静止期2 ===
        else if (this.moveTime > 640 && this.moveTime <= 1040) {
            leftRaftOffset = 2 * COL_GAP;
            rightRaftOffset = -2 * COL_GAP;
        }
        // === 反向移动阶段 ===
        else if (this.moveTime > 1040 && this.moveTime <= 1280) {
            if (this.moveTime <= 1160) {
                // 子移动1: 视觉从2格移动到1格
                const progress = (this.moveTime - 1040) / FennelRaft.SUB_MOVE_DURATION;
                leftRaftOffset = 2 * COL_GAP - progress * COL_GAP;
                rightRaftOffset = -2 * COL_GAP + progress * COL_GAP;
            } else {
                // 子移动2: 视觉从1格移动到0格
                const progress = (this.moveTime - 1160) / FennelRaft.SUB_MOVE_DURATION;
                leftRaftOffset = COL_GAP - progress * COL_GAP;
                rightRaftOffset = -COL_GAP + progress * COL_GAP;
            }
        }
        // === 静止期1 (默认) ===
        // leftRaftOffset = 0, rightRaftOffset = 0

        // 计算实体偏移 = 竹筏视觉偏移 - 网格已移动的量
        const leftEntityOffset = leftRaftOffset - this.leftGridOffset * COL_GAP;
        const rightEntityOffset = rightRaftOffset - this.rightGridOffset * COL_GAP;

        return {
            raft: { left: leftRaftOffset, right: rightRaftOffset },
            entity: { left: leftEntityOffset, right: rightEntityOffset }
        };
    }

    /**
     * 绘制竹筏背景
     */
    drawRafts(raftOffset) {
        const anim = GEH.requestDrawImage(this.mapAnim);
        if (!anim || !this.Battlefield.ctxBG) return;

        const ctx = this.Battlefield.ctxBG;

        // 绘制左筏
        const leftX = level.column_start + level.row_gap;
        const leftY = level.row_start + raftOffset.left;
        ctx.drawImage(anim, leftX, leftY);

        // 绘制右筏  
        const rightX = level.column_start + 5 * level.row_gap;
        const rightY = level.row_start + 2 * level.column_gap + raftOffset.right;
        ctx.drawImage(anim, rightX, rightY);
    }

    /**
     * 竹筏下移: 内容向下移动一行
     */
    shiftRaftDown(colStart, colEnd) {
        // 保存当前数据
        const tempData = [];
        for (let row = 0; row < level.row_num; row++) {
            tempData[row] = {};
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;
                tempData[row][col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }
        }

        // 更新网格：每行接收上一行的数据
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;

                if (row === 0) {
                    // 顶部行变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从上一行复制数据
                    const sourceData = tempData[row - 1][col];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体行号
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
        // 保存当前数据
        const tempData = [];
        for (let row = 0; row < level.row_num; row++) {
            tempData[row] = {};
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;
                tempData[row][col] = {
                    layer_1: this.Foods[idx].layer_1,
                    layer_0: this.Foods[idx].layer_0,
                    noPlace: this.Foods[idx].noPlace
                };
            }
        }

        // 更新网格：每行接收下一行的数据
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const idx = row * level.column_num + col;

                if (row === level.row_num - 1) {
                    // 底部行变为不可用
                    this.Foods[idx].layer_1 = null;
                    this.Foods[idx].layer_0 = null;
                    this.Foods[idx].noPlace = true;
                } else {
                    // 从下一行复制数据
                    const sourceData = tempData[row + 1][col];
                    this.Foods[idx].layer_1 = sourceData.layer_1;
                    this.Foods[idx].layer_0 = sourceData.layer_0;
                    this.Foods[idx].noPlace = sourceData.noPlace;

                    // 更新实体行号
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
     * 应用视觉偏移到实体
     */
    applyVisualOffset(colStart, colEnd, offsetY) {
        for (let row = 0; row < level.row_num; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const grid = this.Foods[row * level.column_num + col];

                [grid.layer_1, grid.layer_0].forEach(entity => {
                    if (entity) {
                        const ctor = entity.constructor;
                        const baseY = level.row_start + row * level.column_gap;
                        const ctorOffset = ctor.offset ? ctor.offset[1] : 0;
                        const typeOffset = entity.type ? -10 : 0;
                        entity.y = baseY + ctorOffset + typeOffset + offsetY;
                    }
                });
            }
        }
    }

    StartWaveCreate() {
        this.waveCreate(0, 1, 1);
        this.waveCreate(23, 1, 1);
        this.Load();
    }
}