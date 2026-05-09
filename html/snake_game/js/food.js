/**
 * 食物系统
 * 包含 4 种食物类型和传送门
 */

class FoodManager {
    constructor(gridSize, cellSize, soundManager) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.soundManager = soundManager;
        this.foods = [];
        this.portal = null;
        
        // 食物类型定义 - 使用更鲜艳的颜色
        this.foodTypes = {
            normal: {
                type: 'normal',
                name: '普通食物',
                color: '#ff0000',
                glowColor: '#ff3333',
                score: 10,
                effect: 'grow'
            },
            shorten: {
                type: 'shorten',
                name: '缩短食物',
                color: '#00ffff',
                glowColor: '#00ffff',
                score: 20,
                effect: 'shorten'
            },
            time: {
                type: 'time',
                name: '时间食物',
                color: '#7cff00',
                glowColor: '#b7ff4a',
                score: 20,
                effect: 'extendTime'
            },
            gold: {
                type: 'gold',
                name: '金币食物',
                color: '#ffd700',
                glowColor: '#ffea00',
                score: 30,
                effect: 'gold'
            }
        };
    }

    // 生成新食物
    spawnFood(excludePositions = []) {
        let food;
        let attempts = 0;
        const maxAttempts = 100;
        
        // 尝试找到一个不冲突的位置
        do {
            food = this.createFood();
            attempts++;
        } while (
            attempts < maxAttempts &&
            this.isPositionExcluded(food.x, food.y, excludePositions)
        );
        
        // 即使位置冲突也生成，避免死循环
        this.foods.push(food);
        return food;
    }

    // 创建食物
    createFood() {
        // 随机选择食物类型 (普通食物概率更高)
        const rand = Math.random();
        let typeKey;
        
        if (rand < 0.6) {
            typeKey = 'normal';
        } else if (rand < 0.8) {
            typeKey = 'shorten';
        } else if (rand < 0.95) {
            typeKey = 'time';
        } else {
            typeKey = 'gold';
        }
        
        const type = this.foodTypes[typeKey];
        
        return {
            x: Utils.randomInt(0, this.gridSize.x - 1),
            y: Utils.randomInt(0, this.gridSize.y - 1),
            ...type,
            // 动画效果
            pulse: 0.8,
            pulseDirection: 1
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

    // 生成传送门
    spawnPortal(excludePositions = []) {
        const portal = {
            x: Utils.randomInt(0, this.gridSize.x - 1),
            y: Utils.randomInt(0, this.gridSize.y - 1),
            pulse: 0.8,
            pulseDirection: 1
        };
        
        // 确保不生成在排除位置
        while (this.isPositionExcluded(portal.x, portal.y, excludePositions)) {
            portal.x = Utils.randomInt(0, this.gridSize.x - 1);
            portal.y = Utils.randomInt(0, this.gridSize.y - 1);
        }
        
        this.portal = portal;
        return portal;
    }

    // 清除传送门
    clearPortal() {
        this.portal = null;
    }

    // 检查蛇是否吃到食物
    checkCollision(snake) {
        for (let i = this.foods.length - 1; i >= 0; i--) {
            if (snake.checkFoodCollision(this.foods[i])) {
                const food = this.foods[i];
                this.foods.splice(i, 1);
                this.soundManager.playEatSpecial();
                return { type: 'food', food };
            }
        }
        
        // 检查传送门
        if (this.portal && snake.checkPortalCollision(this.portal)) {
            this.soundManager.playPortal();
            const portal = this.portal;
            this.clearPortal();
            return { type: 'portal', portal };
        }
        
        return null;
    }

    // 更新食物动画
    update() {
        this.foods.forEach(food => {
            food.pulse += 0.02 * food.pulseDirection;
            if (food.pulse > 1) {
                food.pulse = 1;
                food.pulseDirection = -1;
            } else if (food.pulse < 0.6) {
                food.pulse = 0.6;
                food.pulseDirection = 1;
            }
        });
        
        if (this.portal) {
            this.portal.pulse += 0.03 * this.portal.pulseDirection;
            if (this.portal.pulse > 1) {
                this.portal.pulse = 1;
                this.portal.pulseDirection = -1;
            } else if (this.portal.pulse < 0.5) {
                this.portal.pulse = 0.5;
                this.portal.pulseDirection = 1;
            }
        }
    }

    // 绘制所有食物
    draw(ctx) {
        // 绘制普通食物
        this.foods.forEach(food => {
            this.drawFood(ctx, food);
        });
        
        // 绘制传送门
        if (this.portal) {
            this.drawPortal(ctx, this.portal);
        }
    }

    // 绘制食物
    drawFood(ctx, food) {
        const x = food.x * this.cellSize + this.cellSize / 2;
        const y = food.y * this.cellSize + this.cellSize / 2;
        const radius = (this.cellSize / 2 - 3) * food.pulse;
        
        // 增强发光效果
        ctx.shadowBlur = 25;
        ctx.shadowColor = food.glowColor;
        
        // 外发光层
        ctx.fillStyle = food.glowColor + '66'; // 半透明发光
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制圆形食物
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    // 绘制传送门
    drawPortal(ctx, portal) {
        const x = portal.x * this.cellSize + this.cellSize / 2;
        const y = portal.y * this.cellSize + this.cellSize / 2;
        const outerRadius = (this.cellSize / 2 - 2) * portal.pulse;
        const innerRadius = outerRadius * 0.6;
        
        // 外圈发光
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#aa00ff';
        
        // 外圈
        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, 'rgba(170, 0, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(170, 0, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(170, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内圈
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = '#aa00ff';
        ctx.beginPath();
        ctx.arc(x, y, innerRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 旋转效果
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, Date.now() / 200, Date.now() / 200 + Math.PI);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    // 获取所有占用位置
    getAllPositions() {
        const positions = [...this.foods.map(f => ({ x: f.x, y: f.y }))];
        if (this.portal) {
            positions.push({ x: this.portal.x, y: this.portal.y });
        }
        return positions;
    }

    // 清除所有食物
    clear() {
        this.foods = [];
        this.portal = null;
    }

    // 确保至少有 3 个食物
    ensureMinFoods(snakeBody, enemyPositions = []) {
        const excludePositions = [
            ...snakeBody,
            ...enemyPositions,
            ...this.getAllPositions()
        ];
        
        while (this.foods.length < 3) {
            this.spawnFood(excludePositions);
            excludePositions.push({ 
                x: this.foods[this.foods.length - 1].x, 
                y: this.foods[this.foods.length - 1].y 
            });
        }
    }
}

// 导出
window.FoodManager = FoodManager;
