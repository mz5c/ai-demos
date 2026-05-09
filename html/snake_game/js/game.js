/**
 * 游戏主控制器
 * 整合所有模块，管理游戏流程
 */

class Game {
    constructor() {
        // 初始化模块
        this.soundManager = new SoundManager();
        this.levelManager = new LevelManager();
        this.scoreboard = new Scoreboard();
        
        // 游戏状态
        this.state = {
            screen: 'start',        // start, game, pause, gameOver, levelComplete, victory
            isRunning: false,
            lastTime: 0,
            moveTimer: 0,
            timeRemaining: 60,
            timeElapsed: 0,
            lives: 2
        };
        
        // 画布和上下文
        this.canvas = null;
        this.ctx = null;
        this.cellSize = 20;
        this.gridSize = { x: 30, y: 30 };
        
        // 游戏实体
        this.snake = null;
        this.foodManager = null;
        this.enemyManager = null;
        
        // 玩家信息
        this.playerName = '';
        this.lifeMilestonesEarned = 0;
        
        // UI 元素
        this.ui = {};
        this.animationFrameId = null;
        
        // 初始化
        this.init();
    }

    // 初始化游戏
    init() {
        // 获取 UI 元素
        this.ui = {
            startScreen: document.getElementById('start-screen'),
            rankScreen: document.getElementById('rank-screen'),
            gameContainer: document.getElementById('game-container'),
            gameOverScreen: document.getElementById('game-over-screen'),
            levelCompleteScreen: document.getElementById('level-complete-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            
            playerNameInput: document.getElementById('player-name'),
            startBtn: document.getElementById('start-btn'),
            showRankBtn: document.getElementById('show-rank-btn'),
            backBtn: document.getElementById('back-btn'),
            restartBtn: document.getElementById('restart-btn'),
            homeBtn: document.getElementById('home-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            victoryRestartBtn: document.getElementById('victory-restart-btn'),
            victoryHomeBtn: document.getElementById('victory-home-btn'),
            soundBtn: document.getElementById('sound-btn'),
            
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            time: document.getElementById('time'),
            lives: document.getElementById('lives'),
            highScore: document.getElementById('high-score'),
            timeBar: document.getElementById('time-bar'),
            
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            finalHighScore: document.getElementById('final-high-score'),
            
            levelScore: document.getElementById('level-score'),
            nextLevel: document.getElementById('next-level'),
            
            victoryScore: document.getElementById('victory-score'),
            victoryPlayer: document.getElementById('victory-player'),
            
            rankBody: document.getElementById('rank-body'),
            
            pauseOverlay: document.getElementById('pause-overlay')
        };
        
        // 加载保存的玩家昵称
        const savedName = Storage.getPlayerName();
        if (savedName) {
            this.ui.playerNameInput.value = savedName;
        }
        
        // 加载音效设置
        const soundEnabled = Storage.getSoundEnabled();
        if (!soundEnabled) {
            this.soundManager.toggle();
            this.ui.soundBtn.textContent = '🔇';
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化画布
        this.initCanvas();
        
        // 启动渲染循环
        this.render();
    }

    // 初始化画布
    initCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 自适应画布大小
        this.resizeCanvas();
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCanvas();
            if (this.snake && this.foodManager) {
                this.snake.gridSize = this.gridSize;
                this.snake.cellSize = this.cellSize;
                this.foodManager.gridSize = this.gridSize;
                this.foodManager.cellSize = this.cellSize;
                this.enemyManager.gridSize = this.gridSize;
                this.enemyManager.cellSize = this.cellSize;
            }
        }, 200));
    }

    // 调整画布大小
    resizeCanvas() {
        const maxWidth = Math.min(window.innerWidth - 40, 800);
        const maxHeight = window.innerHeight - 200;
        
        const size = Math.min(maxWidth, maxHeight);
        const cols = 30;
        const rows = 30;
        
        this.cellSize = Math.floor(size / cols);
        this.canvas.width = this.cellSize * cols;
        this.canvas.height = this.cellSize * rows;
        
        this.gridSize = { x: cols, y: rows };
    }

    // 绑定事件
    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 开始按钮
        this.ui.startBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.startGame();
        });
        
        // 显示排行榜
        this.ui.showRankBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.showRankScreen();
        });
        
        // 返回按钮
        this.ui.backBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.showScreen('start');
        });
        
        // 重新开始
        this.ui.restartBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.startGame();
        });
        
        // 返回主页
        this.ui.homeBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.showScreen('start');
        });
        
        // 下一关
        this.ui.nextLevelBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.nextLevel();
        });
        
        // 胜利后重新开始
        this.ui.victoryRestartBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.startGame();
        });
        
        // 胜利后返回主页
        this.ui.victoryHomeBtn.addEventListener('click', () => {
            this.soundManager.playClick();
            this.showScreen('start');
        });
        
        // 音效开关
        this.ui.soundBtn.addEventListener('click', () => {
            const enabled = this.soundManager.toggle();
            this.ui.soundBtn.textContent = enabled ? '🔊' : '🔇';
            Storage.saveSoundEnabled(enabled);
        });
        
    }

    // 处理按键
    handleKeyPress(e) {
        // 在开始界面，回车开始游戏
        if (this.state.screen === 'start') {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.startGame();
            }
            return;
        }
        
        // 在游戏中
        if (this.state.screen === 'game') {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.snake.setDirection(0, -1);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.snake.setDirection(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.snake.setDirection(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.snake.setDirection(1, 0);
                    e.preventDefault();
                    break;
                case ' ':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        } else if (this.state.screen === 'pause') {
            if (e.key === ' ') {
                this.togglePause();
                e.preventDefault();
            }
        }
    }

    startRenderLoop() {
        if (this.animationFrameId !== null) return;
        this.animationFrameId = requestAnimationFrame((time) => this.render(time));
    }

    // 切换暂停
    togglePause() {
        if (this.state.screen === 'game') {
            this.state.screen = 'pause';
            this.state.isRunning = false;
            this.ui.pauseOverlay.classList.remove('hidden');
            this.soundManager.playPause();
        } else if (this.state.screen === 'pause') {
            this.state.screen = 'game';
            this.state.isRunning = true;
            this.ui.pauseOverlay.classList.add('hidden');
            this.soundManager.playResume();
            this.state.lastTime = performance.now();
            this.startRenderLoop();
        }
    }

    // 开始游戏
    startGame() {
        // 获取玩家昵称
        this.playerName = this.ui.playerNameInput.value.trim() || 'Player';
        Storage.savePlayerName(this.playerName);
        
        // 获取最高分
        const playerBestScore = this.scoreboard.getPlayerBestScore(this.playerName);
        
        // 初始化关卡
        this.levelManager.init(1);
        const levelConfig = this.levelManager.getCurrentLevel();
        this.lifeMilestonesEarned = 0;
        
        // 初始化游戏实体
        this.snake = new Snake(this.gridSize, this.cellSize);
        this.foodManager = new FoodManager(this.gridSize, this.cellSize, this.soundManager);
        this.enemyManager = new EnemyManager(this.gridSize, this.cellSize, this.soundManager);
        
        // 初始化游戏状态
        this.state.timeRemaining = levelConfig.initialTime;
        this.state.timeElapsed = 0;
        this.state.moveTimer = 0;
        this.state.lives = 2;
        this.state.isRunning = true;
        this.state.screen = 'game';
        this.state.lastTime = performance.now();
        
        // 生成初始食物（确保生成）
        this.foodManager.clear();
        this.foodManager.ensureMinFoods(this.snake.body, []);
        
        // 生成敌人
        if (levelConfig.enemyCount > 0) {
            this.enemyManager.spawnEnemies(levelConfig.enemyCount, [
                ...this.snake.body,
                ...this.foodManager.getAllPositions()
            ]);
        }
        
        // 更新 UI
        this.ui.highScore.textContent = playerBestScore;
        this.updateHUD();
        
        // 显示游戏界面
        this.showScreen('game');
        
        // 确保暂停遮罩是隐藏的
        this.ui.pauseOverlay.classList.add('hidden');
        
        // 启动游戏循环
        this.startRenderLoop();
    }

    // 渲染循环
    render(time = 0) {
        this.animationFrameId = null;
        const deltaTime = time - this.state.lastTime;
        this.state.lastTime = time;
        
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格 (可选)
        this.drawGrid();
        
        if (this.state.isRunning && this.state.screen === 'game') {
            // 更新时间
            this.updateTime(deltaTime);
            
            // 更新敌人
            this.enemyManager.update();

            // 实时检测敌人碰撞，防止敌人主动撞向蛇时产生延迟感
            if (this.enemyManager.checkCollision(this.snake)) {
                this.gameOver('碰到敌人了!');
                return;
            }
            
            // 更新食物动画
            this.foodManager.update();
            
            // 移动蛇
            this.state.moveTimer += deltaTime;
            const currentSpeed = this.levelManager.getCurrentLevel().speed;
            
            if (this.state.moveTimer >= currentSpeed) {
                this.state.moveTimer = 0;
                this.moveSnake();
            }
        }
        
        // 绘制游戏实体
        if (this.snake) this.snake.draw(this.ctx);
        if (this.foodManager) this.foodManager.draw(this.ctx);
        if (this.enemyManager) this.enemyManager.draw(this.ctx);
        
        // 继续渲染循环
        if (this.state.isRunning) {
            this.startRenderLoop();
        }
    }

    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // 更新时间
    updateTime(deltaTime) {
        this.state.timeElapsed += deltaTime / 1000;
        this.state.timeRemaining -= deltaTime / 1000;
        
        // 时间警告音效
        if (this.state.timeRemaining <= 10 && this.state.timeRemaining > 5) {
            if (Math.floor(this.state.timeElapsed * 10) % 10 === 0) {
                this.soundManager.playTimeWarning();
            }
        }
        
        // 时间耗尽
        if (this.state.timeRemaining <= 0) {
            this.gameOver('时间耗尽!');
            return;
        }
        
        // 更新 UI
        this.updateHUD();
    }

    // 移动蛇
    moveSnake() {
        this.snake.move();
        
        // 检查撞墙
        if (this.snake.checkWallCollision()) {
            this.gameOver('撞墙了!');
            return;
        }
        
        // 检查撞自己
        if (this.snake.checkSelfCollision()) {
            this.gameOver('撞到自己了!');
            return;
        }
        
        // 检查撞敌人
        if (this.enemyManager.checkCollision(this.snake)) {
            this.gameOver('碰到敌人了!');
            return;
        }
        
        // 检查吃食物
        const collision = this.foodManager.checkCollision(this.snake);
        if (collision) {
            if (collision.type === 'food') {
                const food = collision.food;
                this.snake.eat();
                this.levelManager.addScore(food.score);
                this.checkLifeReward();
                this.state.timeRemaining += food.effect === 'extendTime' ? 10 : 0;
                
                // 不同食物不同音效
                if (food.type === 'gold') {
                    this.soundManager.playEatGold();
                } else if (food.type === 'shorten') {
                    this.snake.shorten(2);
                }
                
                // 确保至少有 3 个食物
                this.foodManager.ensureMinFoods(
                    this.snake.body,
                    this.enemyManager.getAllPositions()
                );
                
                // 检查是否过关
                if (this.levelManager.checkLevelComplete() && this.levelManager.isLastLevel()) {
                    this.victory();
                    return;
                }

                if (this.levelManager.checkLevelComplete() && !this.levelManager.isLastLevel() && !this.foodManager.portal) {
                    this.foodManager.spawnPortal([
                        ...this.snake.body,
                        ...this.enemyManager.getAllPositions(),
                        ...this.foodManager.getAllPositions()
                    ]);
                }
            } else if (collision.type === 'portal') {
                // 进入传送门
                this.levelComplete();
            }
        }
    }

    checkLifeReward() {
        const milestones = Math.floor(this.levelManager.currentScore / 1000);
        if (milestones > this.lifeMilestonesEarned) {
            this.state.lives += milestones - this.lifeMilestonesEarned;
            this.lifeMilestonesEarned = milestones;
            this.updateHUD();
        }
    }

    // 更新 HUD
    updateHUD() {
        this.ui.score.textContent = this.levelManager.currentScore;
        this.ui.level.textContent = this.levelManager.currentLevel;
        this.ui.time.textContent = Math.ceil(this.state.timeRemaining);
        this.ui.lives.textContent = this.state.lives;
        
        // 更新时间条
        const levelConfig = this.levelManager.getCurrentLevel();
        const timePercent = (this.state.timeRemaining / levelConfig.initialTime) * 100;
        this.ui.timeBar.style.width = `${timePercent}%`;
        
        // 时间条颜色
        this.ui.timeBar.classList.remove('warning', 'critical');
        if (timePercent <= 20) {
            this.ui.timeBar.classList.add('critical');
        } else if (timePercent <= 40) {
            this.ui.timeBar.classList.add('warning');
        }
    }

    // 关卡完成
    levelComplete() {
        this.soundManager.playLevelComplete();
        
        // 更新 UI
        this.ui.levelScore.textContent = this.levelManager.getCurrentLevelScore();
        this.ui.nextLevel.textContent = this.levelManager.currentLevel + 1;
        
        // 显示关卡完成界面
        this.state.screen = 'levelComplete';
        this.state.isRunning = false;
        this.showScreen('levelComplete');
    }

    // 进入下一关
    nextLevel() {
        const hasNext = this.levelManager.nextLevel();
        
        if (!hasNext) {
            // 游戏通关
            this.victory();
            return;
        }
        
        const levelConfig = this.levelManager.getCurrentLevel();
        
        // 重置蛇的位置
        this.snake.reset();
        
        // 清除食物和敌人
        this.foodManager.clear();
        this.enemyManager.clear();
        
        // 生成新食物
        this.foodManager.ensureMinFoods(this.snake.body, []);
        
        // 生成新敌人
        if (levelConfig.enemyCount > 0) {
            this.enemyManager.spawnEnemies(levelConfig.enemyCount, [
                ...this.snake.body,
                ...this.foodManager.getAllPositions()
            ]);
        }
        
        // 重置时间
        this.state.timeRemaining = levelConfig.initialTime;
        this.state.timeElapsed = 0;
        this.state.moveTimer = 0;
        
        // 更新 UI
        this.ui.highScore.textContent = this.scoreboard.getPlayerBestScore(this.playerName);
        
        // 继续游戏
        this.state.screen = 'game';
        this.state.isRunning = true;
        this.showScreen('game');
        this.state.lastTime = performance.now();
        this.ui.pauseOverlay.classList.add('hidden');
        this.startRenderLoop();
    }

    // 游戏失败
    gameOver(reason) {
        this.soundManager.playGameOver();
        this.state.isRunning = false;
        this.state.lives = Math.max(0, this.state.lives - 1);
        
        if (this.state.lives > 0) {
            // 显示短暂的扣命反馈
            this.showDeathFeedback(reason);
            return;
        }
        
        // 保存分数
        this.scoreboard.addScore(
            this.playerName,
            this.levelManager.currentScore,
            this.levelManager.currentLevel
        );
        
        // 更新 UI
        this.ui.finalScore.textContent = this.levelManager.currentScore;
        this.ui.finalLevel.textContent = this.levelManager.currentLevel;
        this.ui.finalHighScore.textContent = this.scoreboard.getPlayerBestScore(this.playerName);
        
        // 显示游戏结束界面
        document.getElementById('game-over-title').textContent = reason;
        this.state.screen = 'gameOver';
        this.showScreen('gameOver');
    }

    showDeathFeedback(reason) {
        this.state.screen = 'death';
        this.ui.pauseOverlay.classList.remove('hidden');
        this.ui.pauseOverlay.querySelector('h2').textContent = reason;
        this.ui.pauseOverlay.querySelector('p').textContent = `扣除 1 条生命，剩余 ${this.state.lives} 条`;
        
        setTimeout(() => {
            if (this.state.screen === 'death') {
                this.restartCurrentLevel();
            }
        }, 1500);
    }

    restartCurrentLevel() {
        const levelConfig = this.levelManager.getCurrentLevel();
        this.levelManager.resetCurrentLevelProgress();
        this.snake.reset();
        this.foodManager.clear();
        this.enemyManager.clear();
        this.foodManager.ensureMinFoods(this.snake.body, []);
        
        if (levelConfig.enemyCount > 0) {
            this.enemyManager.spawnEnemies(levelConfig.enemyCount, [
                ...this.snake.body,
                ...this.foodManager.getAllPositions()
            ]);
        }
        
        this.state.timeRemaining = levelConfig.initialTime;
        this.state.timeElapsed = 0;
        this.state.moveTimer = 0;
        this.state.isRunning = true;
        this.state.screen = 'game';
        this.state.lastTime = performance.now();
        
        this.showScreen('game');
        this.ui.pauseOverlay.classList.add('hidden');
        // 重置提示文案，防止下次暂停时显示死亡信息
        this.ui.pauseOverlay.querySelector('h2').textContent = '游戏暂停';
        this.ui.pauseOverlay.querySelector('p').textContent = '按空格键继续';
        this.updateHUD();
        this.startRenderLoop();
    }

    // 游戏胜利
    victory() {
        this.soundManager.playVictory();
        this.state.isRunning = false;
        
        // 保存分数
        this.scoreboard.addScore(
            this.playerName,
            this.levelManager.currentScore,
            this.levelManager.currentLevel
        );
        
        // 更新 UI
        this.ui.victoryScore.textContent = this.levelManager.currentScore;
        this.ui.victoryPlayer.textContent = this.playerName;
        
        // 显示胜利界面
        this.state.screen = 'victory';
        this.showScreen('victory');
    }

    // 显示排行榜
    showRankScreen() {
        this.scoreboard.renderToTable('rank-body');
        this.showScreen('rank');
    }

    // 切换屏幕
    showScreen(screenName) {
        // 隐藏所有屏幕
        this.ui.startScreen.classList.add('hidden');
        this.ui.rankScreen.classList.add('hidden');
        this.ui.gameContainer.classList.add('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.levelCompleteScreen.classList.add('hidden');
        this.ui.victoryScreen.classList.add('hidden');
        
        // 显示目标屏幕
        switch (screenName) {
            case 'start':
                this.ui.startScreen.classList.remove('hidden');
                break;
            case 'rank':
                this.ui.rankScreen.classList.remove('hidden');
                break;
            case 'game':
                this.ui.gameContainer.classList.remove('hidden');
                // 确保暂停遮罩隐藏
                this.ui.pauseOverlay.classList.add('hidden');
                break;
            case 'gameOver':
                this.ui.gameOverScreen.classList.remove('hidden');
                break;
            case 'levelComplete':
                this.ui.levelCompleteScreen.classList.remove('hidden');
                break;
            case 'victory':
                this.ui.victoryScreen.classList.remove('hidden');
                break;
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// 导出
window.Game = Game;
