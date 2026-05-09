/**
 * 敌人系统
 * 敌人在地图上随机移动，碰到即失败
 */

class EnemyManager {
    constructor(gridSize, cellSize, soundManager) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.soundManager = soundManager;
        this.enemies = [];
        
        // 移动方向 (上下左右)
        this.directions = [
            { x: 0, y: -1 }, // 上
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }, // 左
            { x: 1, y: 0 }   // 右
        ];
    }

    // 生成敌人
    spawnEnemies(count, excludePositions = []) {
        for (let i = 0; i < count; i++) {
            const enemy = this.createEnemy(excludePositions);
            this.enemies.push(enemy);
        }
    }

    // 创建单个敌人
    createEnemy(excludePositions = []) {
        let x, y;
        let attempts = 0;
        
        // 尝试找到一个不冲突的位置
        do {
            x = Utils.randomInt(0, this.gridSize.x - 1);
            y = Utils.randomInt(0, this.gridSize.y - 1);
            attempts++;
        } while (
            attempts < 100 &&
            this.isPositionExcluded(x, y, excludePositions)
        );
        
        return {
            x,
            y,
            direction: this.directions[Utils.randomInt(0, 3)],
            moveTimer: 0,
            moveInterval: Utils.randomInt(20, 40) // 移动间隔 (帧数)
        };
    }

    // 检查位置是否在排除列表中
    isPositionExcluded(x, y, excludePositions) {
        for (const pos of excludePositions) {
            if (pos.x === x && pos.y === y) {
                return true;
            }
        }
        return false;
    }

    // 更新敌人 (移动)
    update() {
        this.enemies.forEach(enemy => {
            enemy.moveTimer++;
            
            // 定期移动
            if (enemy.moveTimer >= enemy.moveInterval) {
                enemy.moveTimer = 0;
                this.moveEnemy(enemy);
            }
        });
    }

    // 移动敌人
    moveEnemy(enemy) {
        // 随机选择方向 (有 70% 概率保持原方向)
        let newDirection;
        if (Math.random() < 0.7) {
            newDirection = enemy.direction;
        } else {
            newDirection = this.directions[Utils.randomInt(0, 3)];
        }
        
        const newX = enemy.x + newDirection.x;
        const newY = enemy.y + newDirection.y;
        
        // 检查是否越界
        if (newX >= 0 && newX < this.gridSize.x && 
            newY >= 0 && newY < this.gridSize.y) {
            enemy.x = newX;
            enemy.y = newY;
            enemy.direction = newDirection;
        } else {
            // 越界则随机选择新方向
            enemy.direction = this.directions[Utils.randomInt(0, 3)];
        }
    }

    // 检查是否与蛇碰撞
    checkCollision(snake) {
        for (const enemy of this.enemies) {
            if (snake.checkEnemyCollision(enemy)) {
                return true;
            }
        }
        return false;
    }

    // 绘制所有敌人
    draw(ctx) {
        this.enemies.forEach(enemy => {
            this.drawEnemy(ctx, enemy);
        });
    }

    // 绘制敌人
    drawEnemy(ctx, enemy) {
        const x = enemy.x * this.cellSize;
        const y = enemy.y * this.cellSize;
        const padding = 1;
        const size = this.cellSize - padding * 2;
        
        // 敌人颜色 - 红色渐变
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        
        // 发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        
        // 绘制敌人 (带尖刺的方形)
        ctx.fillStyle = gradient;
        
        // 外框
        ctx.beginPath();
        ctx.moveTo(x + padding + 3, y + padding);
        ctx.lineTo(x + padding + size - 3, y + padding);
        ctx.lineTo(x + padding + size, y + padding + 3);
        ctx.lineTo(x + padding + size, y + padding + size - 3);
        ctx.lineTo(x + padding + size - 3, y + padding + size);
        ctx.lineTo(x + padding + 3, y + padding + size);
        ctx.lineTo(x + padding, y + padding + size - 3);
        ctx.lineTo(x + padding, y + padding + 3);
        ctx.closePath();
        ctx.fill();
        
        // 内部细节
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.fillRect(x + padding + size * 0.3, y + padding + size * 0.3, 
                     size * 0.4, size * 0.4);
        
        // 眼睛
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';
        
        const eyeSize = size * 0.15;
        const eyeOffset = size * 0.25;
        
        // 左眼
        ctx.beginPath();
        ctx.arc(
            x + padding + size * 0.35,
            y + padding + size * 0.35,
            eyeSize, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.arc(
            x + padding + size * 0.65,
            y + padding + size * 0.35,
            eyeSize, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 嘴巴 (愤怒表情)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + padding + size * 0.3, y + padding + size * 0.65);
        ctx.lineTo(x + padding + size * 0.7, y + padding + size * 0.65);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    // 获取所有敌人位置
    getAllPositions() {
        return this.enemies.map(e => ({ x: e.x, y: e.y }));
    }

    // 清除所有敌人
    clear() {
        this.enemies = [];
    }

    // 获取敌人数量
    getCount() {
        return this.enemies.length;
    }
}

// 导出
window.EnemyManager = EnemyManager;
