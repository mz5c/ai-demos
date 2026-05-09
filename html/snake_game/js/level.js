/**
 * 关卡系统
 * 管理 10 个关卡的难度配置和进度
 */

class LevelManager {
    constructor() {
        // 10 个关卡的配置
        this.levels = [
            { 
                level: 1, 
                targetScore: 40,      // 当前关卡目标分数
                initialTime: 60,      // 初始时间 (秒)
                speed: 150,           // 蛇移动速度 (毫秒)
                enemyCount: 0,        // 敌人数量
                name: '新手村'
            },
            { 
                level: 2, 
                targetScore: 50, 
                initialTime: 55, 
                speed: 135, 
                enemyCount: 1,
                name: '初探险境'
            },
            { 
                level: 3, 
                targetScore: 60, 
                initialTime: 50, 
                speed: 120, 
                enemyCount: 1,
                name: '危机四伏'
            },
            { 
                level: 4, 
                targetScore: 70, 
                initialTime: 45, 
                speed: 105, 
                enemyCount: 2,
                name: '艰难前行'
            },
            { 
                level: 5, 
                targetScore: 80, 
                initialTime: 40, 
                speed: 90, 
                enemyCount: 2,
                name: '极限挑战'
            },
            { 
                level: 6, 
                targetScore: 90, 
                initialTime: 35, 
                speed: 75, 
                enemyCount: 3,
                name: '生死时速'
            },
            { 
                level: 7, 
                targetScore: 100, 
                initialTime: 30, 
                speed: 65, 
                enemyCount: 3,
                name: '地狱模式'
            },
            { 
                level: 8, 
                targetScore: 110, 
                initialTime: 28, 
                speed: 55, 
                enemyCount: 4,
                name: '极限求生'
            },
            { 
                level: 9, 
                targetScore: 120, 
                initialTime: 25, 
                speed: 50, 
                enemyCount: 4,
                name: '勇者之路'
            },
            { 
                level: 10, 
                targetScore: 130, 
                initialTime: 22, 
                speed: 45, 
                enemyCount: 5,
                name: '最终试炼'
            }
        ];
        
        this.currentLevel = 1;
        this.currentScore = 0;
        this.levelStartScore = 0;
    }

    // 初始化关卡
    init(level = 1) {
        this.currentLevel = level;
        this.currentScore = 0;
        this.levelStartScore = 0;
    }

    // 获取当前关卡配置
    getCurrentLevel() {
        return this.levels.find(l => l.level === this.currentLevel);
    }

    // 获取关卡配置
    getLevelConfig(level) {
        return this.levels.find(l => l.level === level);
    }

    // 更新分数
    addScore(points) {
        this.currentScore += points;
    }

    // 检查是否达到过关条件
    checkLevelComplete() {
        const currentConfig = this.getCurrentLevel();
        return this.getCurrentLevelScore() >= currentConfig.targetScore;
    }

    // 进入下一关
    nextLevel() {
        if (this.currentLevel < this.levels.length) {
            this.levelStartScore = this.currentScore;
            this.currentLevel++;
            return true;
        }
        return false;
    }

    resetCurrentLevelProgress() {
        this.levelStartScore = this.currentScore;
    }

    getCurrentLevelScore() {
        return this.currentScore - this.levelStartScore;
    }

    isLastLevel() {
        return this.currentLevel === this.levels.length;
    }

    // 是否通关
    isGameCompleted() {
        return this.currentLevel >= this.levels.length && this.checkLevelComplete();
    }

    // 重置游戏
    reset() {
        this.currentLevel = 1;
        this.currentScore = 0;
        this.levelStartScore = 0;
    }

    // 获取所有关卡列表
    getLevels() {
        return this.levels;
    }

    // 获取进度百分比
    getProgress() {
        const currentConfig = this.getCurrentLevel();
        return Math.min(100, (this.getCurrentLevelScore() / currentConfig.targetScore) * 100);
    }

    // 格式化关卡信息
    getLevelInfo() {
        const config = this.getCurrentLevel();
        return {
            level: this.currentLevel,
            name: config.name,
            targetScore: config.targetScore,
            levelScore: this.getCurrentLevelScore(),
            currentScore: this.currentScore,
            progress: this.getProgress(),
            time: config.initialTime,
            speed: config.speed,
            enemyCount: config.enemyCount
        };
    }
}

// 导出
window.LevelManager = LevelManager;
