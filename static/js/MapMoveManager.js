// MapMoveManager.js  
import { level } from "./Level.js";

/**   
 * 通用地图移动管理器  
 * 支持矩形区域在指定方向上的往复移动  
 */
export class MapMoveManager {
    /**   
     * @param {Object} config 配置对象  
     * @param {number[]} config.cols - 列范围，如 [1,2,3,4] 或 [5,6,7,8]   
     * @param {number[]} config.rows - 行范围，如 [0,1,2,3,4,5,6]   
     * @param {number[]} config.initialRows - 初始可用行，如 [0,1,2,3,4] 或 [2,3,4,5,6]   
     * @param {string} config.initialDirection - 初始方向: 'up', 'down', 'left', 'right'   
     * @param {number} config.waitTime - 边界等待时间  
     * @param {number} config.moveSpeed - 移动速度(每tick移动的单位)   
     * @param {number} config.unitDistance - 单位移动距离(像素或网格数)   
     */
    constructor(config) {
        this.cols = config.cols;
        this.rows = config.rows;
        this.initialRows = config.initialRows;
        this.initialDirection = config.initialDirection;
        this.waitTime = config.waitTime;
        this.moveSpeed = config.moveSpeed || 4;
        this.unitDistance = config.unitDistance || level.column_gap;

        // 计算边界  
        this.minRow = Math.min(...this.rows);
        this.maxRow = Math.max(...this.rows);
        this.minCol = Math.min(...this.cols);
        this.maxCol = Math.max(...this.cols);

        // 计算初始可用行的边界  
        this.initialMinRow = Math.min(...this.initialRows);
        this.initialMaxRow = Math.max(...this.initialRows);

        // 状态变量  
        this.currentTime = 0;
        this.currentDirection = this.initialDirection;
        this.gridOffset = 0; // 网格偏移量(单位格数)   
        this.visualOffset = 0; // 视觉偏移量(像素)

        // 跟踪当前可见的行范围（逻辑行号）
        this.currentVisibleRows = new Set(this.initialRows);

        // 记录每个实体是否需要应用偏移（新放置的实体不需要）
        this.entityNeedsOffset = new WeakSet();

        // 计算移动参数  
        this.calculateMovementParams();
    }

    /**   
     * 计算移动参数  
     */
    calculateMovementParams() {
        // 根据方向计算最大偏移量  
        if (this.initialDirection === 'down') {
            // 向下移动：可以显示底部隐藏的行
            this.maxOffset = this.maxRow - this.initialMaxRow;
            this.minOffset = 0;
        } else if (this.initialDirection === 'up') {
            // 向上移动：可以显示顶部隐藏的行
            this.maxOffset = 0;
            this.minOffset = -(this.initialMinRow - this.minRow);
        }

        // 计算单次移动时间  
        this.moveDistance = Math.abs(this.maxOffset - this.minOffset);
        this.moveDuration = (this.moveDistance * this.unitDistance) / this.moveSpeed;

        // 计算完整周期时间  
        this.cycleLength = 2 * (this.moveDuration + this.waitTime);
    }

    /**   
     * 更新移动状态  
     * @returns {Object} 包含网格更新和视觉偏移信息  
     */
    update() {
        const prevTime = this.currentTime;
        this.currentTime = (this.currentTime + this.moveSpeed) % this.cycleLength;

        // 处理周期重置  
        if (this.currentTime < prevTime) {
            this.currentTime = 0;
        }

        const result = {
            gridUpdates: [],
            visualOffset: 0,
            entityOffset: 0
        };

        // 判断当前阶段  
        const phase = this.getPhase();

        switch (phase.type) {
            case 'wait1':
                // 初始等待  
                this.visualOffset = 0;
                break;

            case 'moveForward':
                // 正向移动  
                const forwardProgress = phase.progress;
                this.visualOffset = forwardProgress * this.moveDistance * this.unitDistance;

                // 检查网格更新点  
                const newGridOffset = Math.floor(forwardProgress * this.moveDistance);
                if (newGridOffset !== this.gridOffset) {
                    const offsetDiff = newGridOffset - this.gridOffset;

                    // 更新当前可见行
                    this.updateVisibleRows(this.initialDirection, offsetDiff);
                    this.gridOffset = newGridOffset;

                    // 只在可见行发生变化时才推送网格更新
                    result.gridUpdates.push({
                        type: 'visibility',  // 改为 visibility 类型，表示只更新可见性
                        offset: offsetDiff,
                        direction: this.initialDirection
                    });
                }
                break;

            case 'wait2':
                // 边界等待  
                this.visualOffset = this.moveDistance * this.unitDistance;
                break;

            case 'moveBackward':
                // 反向移动  
                const backwardProgress = phase.progress;
                this.visualOffset = (1 - backwardProgress) * this.moveDistance * this.unitDistance;

                // 检查网格更新点  
                const newBackOffset = Math.floor((1 - backwardProgress) * this.moveDistance);
                if (newBackOffset !== this.gridOffset) {
                    const reverseDir = this.getReverseDirection(this.initialDirection);
                    const offsetDiff = this.gridOffset - newBackOffset;

                    // 更新当前可见行
                    this.updateVisibleRows(reverseDir, offsetDiff);
                    this.gridOffset = newBackOffset;

                    // 只在可见行发生变化时才推送网格更新
                    result.gridUpdates.push({
                        type: 'visibility',  // 改为 visibility 类型
                        offset: offsetDiff,
                        direction: reverseDir
                    });
                }
                break;
        }

        // 计算实际的视觉偏移（根据方向）
        let actualVisualOffset = this.visualOffset;
        if (this.initialDirection === 'up') {
            actualVisualOffset = -this.visualOffset;
        }

        result.visualOffset = actualVisualOffset;

        // 实体偏移 = 视觉偏移 - 网格已经移动的距离
        // 网格移动时，实体的row已经更新，所以只需要补偿剩余的偏移
        const gridMovedDistance = this.gridOffset * this.unitDistance;
        if (this.initialDirection === 'down') {
            result.entityOffset = actualVisualOffset - gridMovedDistance;
        } else if (this.initialDirection === 'up') {
            result.entityOffset = actualVisualOffset + gridMovedDistance;
        }

        return result;
    }

    /**
     * 更新当前可见行集合
     */
    updateVisibleRows(direction, offset) {
        const newVisibleRows = new Set();

        if (direction === 'down') {
            // 向下移动offset格
            for (const row of this.currentVisibleRows) {
                const newRow = row + offset;
                if (newRow >= this.minRow && newRow <= this.maxRow) {
                    newVisibleRows.add(newRow);
                }
            }
        } else if (direction === 'up') {
            // 向上移动offset格
            for (const row of this.currentVisibleRows) {
                const newRow = row - offset;
                if (newRow >= this.minRow && newRow <= this.maxRow) {
                    newVisibleRows.add(newRow);
                }
            }
        }

        this.currentVisibleRows = newVisibleRows;
    }

    /**   
     * 获取当前移动阶段  
     * @returns {Object} 阶段信息  
     */
    getPhase() {
        if (this.currentTime < this.waitTime) {
            return { type: 'wait1', progress: this.currentTime / this.waitTime };
        } else if (this.currentTime < this.waitTime + this.moveDuration) {
            return {
                type: 'moveForward',
                progress: (this.currentTime - this.waitTime) / this.moveDuration
            };
        } else if (this.currentTime < this.waitTime * 2 + this.moveDuration) {
            return {
                type: 'wait2',
                progress: (this.currentTime - this.waitTime - this.moveDuration) / this.waitTime
            };
        } else {
            return {
                type: 'moveBackward',
                progress: (this.currentTime - this.waitTime * 2 - this.moveDuration) / this.moveDuration
            };
        }
    }

    /**   
     * 获取反向方向  
     */
    getReverseDirection(direction) {
        const reverseMap = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return reverseMap[direction];
    }

    /**   
     * 初始化网格状态  
     * @param {Array} Foods - 网格数组  
     */
    initializeGrid(Foods) {
        const initialRowSet = new Set(this.initialRows);

        for (const row of this.rows) {
            for (const col of this.cols) {
                const idx = row * level.column_num + col;
                if (!initialRowSet.has(row)) {
                    Foods[idx].noPlace = true;
                }

                // 标记初始实体需要偏移
                if (Foods[idx].layer_1) {
                    this.entityNeedsOffset.add(Foods[idx].layer_1);
                }
                if (Foods[idx].layer_0) {
                    this.entityNeedsOffset.add(Foods[idx].layer_0);
                }
            }
        }
    }

    /**   
 * 更新网格可见性（原 shiftGrid 方法）  
 * @param {Array} Foods - 网格数组  
 * @param {string} updateType - 更新类型  
 * @param {number} offset - 偏移量  
 * @param {string} direction - 方向  
 */
    updateGridVisibility(Foods, updateType, offset, direction) {
        // 只更新 noPlace 状态，不移动实体
        if (updateType === 'visibility') {
            this.updateNoPlaceStatus(Foods);
        }
    }

    /**
     * 更新所有格子的 noPlace 状态
     */
    updateNoPlaceStatus(Foods) {
        for (const row of this.rows) {
            for (const col of this.cols) {
                const idx = row * level.column_num + col;

                // 根据当前可见行更新 noPlace
                Foods[idx].noPlace = !this.currentVisibleRows.has(row);
            }
        }
    }



    /**   
 * 应用视觉偏移到实体  
 * @param {Array} Foods - 网格数组
 * @param {number} offset - 视觉偏移量（已经减去了网格移动的部分）
 */
    applyEntityOffset(Foods, offset) {
        for (const row of this.rows) {
            for (const col of this.cols) {
                const idx = row * level.column_num + col;
                const grid = Foods[idx];

                [grid.layer_1, grid.layer_0].forEach(entity => {
                    if (entity) {
                        const ctor = entity.constructor;
                        // 实体始终保持在其原始行，row 属性不应该被改变
                        const baseY = level.row_start + row * level.column_gap;
                        const ctorOffset = ctor.offset ? ctor.offset[1] : 0;
                        const typeOffset = entity.type ? -10 : 0;

                        // 只有标记为需要偏移的实体才应用偏移
                        // 新放置的实体不应该有偏移
                        const appliedOffset = this.entityNeedsOffset.has(entity) ? offset : 0;
                        entity.y = baseY + ctorOffset + typeOffset + appliedOffset;

                        // 确保 entity.row 始终等于其实际所在的网格行
                        entity.row = row;
                    }
                });
            }
        }
    }








    /**
 * 处理新放置的实体
 * @param {Object} entity - 新放置的实体
 * @param {number} row - 放置的行号
 */
    handleNewEntity(entity, row) {
        if (!entity) return;

        // 确保实体的 row 属性正确
        entity.row = row;

        // 获取当前的移动阶段
        const phase = this.getPhase();

        // 只有当地图正在移动或已经移动过时，新实体才需要应用偏移
        // 如果地图在初始位置（wait1阶段且gridOffset为0），新实体不需要偏移
        if (this.gridOffset > 0 || (phase.type !== 'wait1')) {
            this.entityNeedsOffset.add(entity);
        } else {
            // 确保新实体不在偏移集合中
            this.entityNeedsOffset.delete(entity);
        }
    }

    /**
     * 检查某行是否当前可见（可放置）
     */
    isRowVisible(row) {
        return this.currentVisibleRows.has(row);
    }

    /**
     * 获取当前的实体偏移量
     */
    getCurrentEntityOffset() {
        const gridMovedDistance = this.gridOffset * this.unitDistance;
        let actualVisualOffset = this.visualOffset;

        if (this.initialDirection === 'up') {
            actualVisualOffset = -this.visualOffset;
        }

        if (this.initialDirection === 'down') {
            return actualVisualOffset - gridMovedDistance;
        } else if (this.initialDirection === 'up') {
            return actualVisualOffset + gridMovedDistance;
        }

        return 0;
    }
}