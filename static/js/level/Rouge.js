import { GEH, ToastBox } from "../Core.js";
import EventHandler from "../EventHandler.js";
import Level, { level } from "../Level.js";

export default class Rouge extends Level {
    static NAME = "变幻之旅";
    static SUGGESTED_TYPE = 0;
    static WAVES = 0;
    static REWARDS = 0;
    static BACKGROUND = "/images/interface/background_233.jpg";

    constructor(level = 7, pivot = 0) {
        super(2000);
        this.level = level;
        this.StartWaveCreate(pivot);
    }

    DifficultyEvaluation(pivot) {
        console.log(`第${this.level}关开始了`);
        this.SunNum = this.level * 250 + 250;
        this.waveCreate(0, 1, 1);
        if (this.level <= 1) {
            this.waveCreate(0, 1, 1);
        }
        else if (this.level <= 4) {
            this.waveCreate(0, 2, 1);
        }
        else {
            this.RandomGenerate(0, 2);
        }
        this.RandomGenerate(0, Math.min(Math.max(this.level, 2), 3));
        this.RandomGenerate(0, Math.min(Math.max(this.level, 2), 4));
        this.RandomGenerate(0, Math.min(Math.max(this.level, 2), 5));
        this.RandomGenerate(0, Math.min(Math.max(this.level, 3), 6));
        this.RandomGenerate(0, Math.min(Math.max(this.level, 3), 7));
        this.RandomGenerate(0, Math.max(Math.floor(this.level * 1.25), 3));
        this.RandomGenerate(0, Math.max(Math.floor(this.level * 1.5), 4));
        this.RandomGenerate(0, Math.max(Math.floor(this.level * 1.75), 5));
        this.RandomGenerate(0, Math.max(Math.floor(this.level * 2), 6));
        if (this.level >= 4) {
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 2.25), 7));
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 2.5), 8));
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 2.75), 8));
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 3), 8));
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 3.25), 8));
            this.RandomGenerate(0, Math.max(Math.floor(this.level * 3.5), 8));
            if (this.level >= 6) {
                if (this.level >= 7) {
                    this.RandomGenerate(4, Math.floor(Math.random()), true, false);
                }
                this.RandomGenerate(3, Math.floor(this.level - Math.random() * 4), true, false);
            }
            this.RandomGenerate(2, Math.floor(this.level - Math.random() * 4), true, false);
        }
        this.RandomGenerate(1, Math.max(this.level, 6), true, false);
        this.RandomGenerate(0, Math.max(this.level, 6), true, true);
    }


    /**
* Generates a wave of enemies based on difficulty index and level,
* with a chance to upgrade individual enemies to higher difficulty pools.
* Aims for more reliable and predictable behavior.
* Assumes 'this.level' and 'this.waveCreate' are accessible in the execution context.
* Assumes 'enemyPools' is defined in an accessible scope (like globally or in the same class).
*
* @param {number} difficultyIndex - Index (0-4) for the base enemy pool in enemyPools.
* @param {number} numEnemies - The target number of enemies to generate for this wave.
* @param {boolean} isHuge - Flag passed to waveCreate, affects enemy properties (default: false).
* @param {boolean} isFinalWave - If true, the last enemy generated gets special handling via waveCreate's 3rd param (default: true).
*/
    RandomGenerate(difficultyIndex, numEnemies, isHuge = false, isFinalWave = true) {
        // Ensure enemyPools is accessible (this might need adjustment based on your scope)
        const enemyPools = [
            [0, 1, 2],
            [3, 5, 7, 8],
            [4, 9, 10, 13, 20],
            [11, 12, 15, 16, 17, 18, 19, 21, 22],
            [14],
        ]
        if (typeof enemyPools === 'undefined' || !Array.isArray(enemyPools)) {
            console.error("RandomGenerate Error: enemyPools is not defined or not an array.");
            return;
        }

        // Clamp difficulty index to ensure it's valid for enemyPools
        difficultyIndex = Math.max(0, Math.min(difficultyIndex, enemyPools.length - 1));

        const basePool = enemyPools[difficultyIndex];
        if (!basePool || basePool.length === 0) {
            console.error(`RandomGenerate Error: Invalid base enemy pool for difficulty index ${difficultyIndex}`);
            return; // Stop if the base pool is invalid
        }
        const basePoolLen = basePool.length;

        console.log(`  RandomGenerate: Generating ${numEnemies} enemies. Base Difficulty=${difficultyIndex}, Huge=${isHuge}, FinalWave=${isFinalWave}`);

        let enemiesGenerated = 0; // Track generated enemies
        // Use a loop that continues until the target number of enemies is generated.
        while (enemiesGenerated < numEnemies) {
            // Determine if this specific enemy is the last one AND part of a "final wave" batch
            const isThisTheLastEnemyInFinalWave = isFinalWave && (enemiesGenerated === numEnemies - 1);

            let enemyType = -1;
            let count = 1; // Generate one enemy per iteration
            let poolToUse = basePool;
            let poolLen = basePoolLen;
            let currentPoolIndex = difficultyIndex;
            let wasUpgrade = false;

            // --- Upgrade Logic (only if not the special last enemy) ---
            if (!isThisTheLastEnemyInFinalWave) {
                // Calculate upgrade probability - increases with level, capped to prevent certainty
                const upgradeChance = Math.min(0.5, 0.1 + this.level * 0.03); // e.g., 10% base + 3% per level, max 50%

                // Attempt upgrade only if not already max difficulty and random chance succeeds
                if (difficultyIndex < enemyPools.length - 1 && Math.random() < upgradeChance) {
                    // --- Single Upgrade Attempt ---
                    let upgradedPoolIndex = Math.min(difficultyIndex + 1, enemyPools.length - 1);
                    let potentialPool = enemyPools[upgradedPoolIndex];

                    if (potentialPool && potentialPool.length > 0) {
                        poolToUse = potentialPool;
                        poolLen = potentialPool.length;
                        currentPoolIndex = upgradedPoolIndex;
                        wasUpgrade = true;

                        // --- Optional: Chance for Double Upgrade ---
                        // Allow a small chance for a second level jump if the first succeeded
                        const doubleUpgradeChance = 0.2; // 20% chance
                        if (currentPoolIndex < enemyPools.length - 1 && Math.random() < doubleUpgradeChance) {
                            let doubleUpgradedPoolIndex = Math.min(currentPoolIndex + 1, enemyPools.length - 1);
                            let potentialDoublePool = enemyPools[doubleUpgradedPoolIndex];
                            if (potentialDoublePool && potentialDoublePool.length > 0) {
                                console.log(`    (Double Upgrade Occurred!)`);
                                poolToUse = potentialDoublePool;
                                poolLen = potentialDoublePool.length;
                                currentPoolIndex = doubleUpgradedPoolIndex;
                            }
                            // If double upgrade pool is invalid, we just stick with the single upgrade pool
                        }
                    } else {
                        // Upgraded pool was invalid? Log warning and revert to base pool.
                        console.warn(`    Upgrade failed: Invalid pool index ${upgradedPoolIndex}. Reverting to base.`);
                        // poolToUse, poolLen, currentPoolIndex remain as base pool values
                    }
                }
            } // End of upgrade logic block

            // Select enemy type from the chosen pool (base or upgraded)
            const factor = Math.floor(Math.random() * poolLen);
            enemyType = poolToUse[factor];

            // Log the generation details
            if (isThisTheLastEnemyInFinalWave) {
                console.log(`    Enemy ${enemiesGenerated + 1}/${numEnemies} (Final): Type=${enemyType} from Pool ${currentPoolIndex}`);
            } else if (wasUpgrade) {
                console.log(`    Enemy ${enemiesGenerated + 1}/${numEnemies} (Upgraded): Type=${enemyType} from Pool ${currentPoolIndex}`);
            } else {
                console.log(`    Enemy ${enemiesGenerated + 1}/${numEnemies} (Default): Type=${enemyType} from Pool ${currentPoolIndex}`);
            }

            // --- Call waveCreate ---
            // The 3rd parameter indicates if this is the special last enemy of a batch marked as isFinalWave
            // Assuming waveCreate(type, number, isFinalEnemyInBatch?, huge?)
            this.waveCreate(enemyType, count, isThisTheLastEnemyInFinalWave, isHuge);

            enemiesGenerated++; // Increment counter only after successfully generating an enemy
        }
        // console.log(`  RandomGenerate: Finished generating ${enemiesGenerated} enemies.`); // Optional: uncomment for end confirmation
    } // End of RandomGenerate function

    StartWaveCreate(pivot) {
        this.DifficultyEvaluation(this.level, pivot);
        this.Load();
    }

    Enter() {
        GEH.requestBackMusicChange(99);
        this.waterLineGenerate([0, 0, 1, 1, 1, 0, 0]);
        for (let i = 2; i < 5; i++) {
            for (let j = 0; j < 9; j++) {
                this.Foods[i * level.column_num + j].water = true;
            }
        }
        this.createWaveFlag();
        this.setGuardian();
    }
}