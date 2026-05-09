/**
 * 贪吃蛇类
 * 负责蛇的移动、生长、碰撞检测等
 */

class Snake {
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.reset();
    }

    reset() {
        // 初始位置 (居中)
        const startX = Math.floor(this.gridSize.x / 2);
        const startY = Math.floor(this.gridSize.y / 2);
        
        // 蛇身数组，头部在前
        this.body = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        // 初始方向：向右
        this.direction = { x: 1, y: 0 };
        // 下一个方向 (防止快速按键导致自撞)
        this.nextDirection = { x: 1, y: 0 };
        // 上一次移动时实际使用的方向
        this.lastMoveDirection = { x: 1, y: 0 };
        // 是否刚吃到食物 (本帧不能转向)
        this.justAte = false;
    }

    // 获取头部位置
    get head() {
        return this.body[0];
    }

    // 设置方向
    setDirection(x, y) {
        // 不能直接反向（基于上一次实际移动的方向判断，防止快速连续按键自撞）
        if (x === -this.lastMoveDirection.x && y === -this.lastMoveDirection.y) {
            return;
        }
        // 不能与当前方向相同
        if (x === this.direction.x && y === this.direction.y) {
            return;
        }
        this.nextDirection = { x, y };
    }

    // 更新方向 (在移动时调用)
    updateDirection() {
        this.direction = { ...this.nextDirection };
        this.lastMoveDirection = { ...this.direction };
    }

    // 移动蛇
    move() {
        this.updateDirection();
        
        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };
        
        // 添加到头部
        this.body.unshift(newHead);
        
        // 如果没吃到食物，移除尾部
        if (!this.justAte) {
            this.body.pop();
        } else {
            this.justAte = false;
        }
    }

    // 吃到食物 (增长)
    eat() {
        this.justAte = true;
    }

    // 缩短蛇身
    shorten(length = 2) {
        if (this.body.length > 3) {
            const removeCount = Math.min(length, this.body.length - 3);
            this.body.splice(this.body.length - removeCount, removeCount);
        }
    }

    // 检查是否撞墙
    checkWallCollision() {
        return (
            this.head.x < 0 ||
            this.head.x >= this.gridSize.x ||
            this.head.y < 0 ||
            this.head.y >= this.gridSize.y
        );
    }

    // 检查是否撞自己
    checkSelfCollision() {
        for (let i = 1; i < this.body.length; i++) {
            if (this.head.x === this.body[i].x && this.head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    // 检查是否撞到敌人
    checkEnemyCollision(enemy) {
        const enemyRect = {
            x: enemy.x * this.cellSize,
            y: enemy.y * this.cellSize,
            width: this.cellSize,
            height: this.cellSize
        };

        for (const segment of this.body) {
            const segmentRect = {
                x: segment.x * this.cellSize,
                y: segment.y * this.cellSize,
                width: this.cellSize,
                height: this.cellSize
            };

            if (this.rectCollision(segmentRect, enemyRect)) {
                return true;
            }
        }
        return false;
    }

    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // 检查是否吃到食物
    checkFoodCollision(food) {
        return (
            this.head.x === food.x &&
            this.head.y === food.y
        );
    }

    // 检查是否进入传送门
    checkPortalCollision(portal) {
        return (
            this.head.x === portal.x &&
            this.head.y === portal.y
        );
    }

    // 获取蛇的矩形区域
    getRect() {
        return {
            x: this.head.x * this.cellSize,
            y: this.head.y * this.cellSize,
            width: this.cellSize,
            height: this.cellSize
        };
    }

    // 绘制蛇
    draw(ctx) {
        this.body.forEach((segment, index) => {
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            if (index === 0) {
                // 头部 - 更亮的颜色
                this.drawSegment(ctx, x, y, '#00ff88', true);
                
                // 绘制眼睛
                this.drawEyes(ctx, x, y);
            } else {
                // 身体 - 渐变色
                const gradient = 0.8 - (index / this.body.length) * 0.4;
                this.drawSegment(ctx, x, y, `rgba(0, 255, 136, ${gradient})`, false);
            }
        });
    }

    // 绘制蛇身段
    drawSegment(ctx, x, y, color, isHead) {
        const padding = 1;
        const size = this.cellSize - padding * 2;
        
        // 发光效果
        ctx.shadowBlur = isHead ? 15 : 8;
        ctx.shadowColor = color;
        
        // 圆角矩形
        ctx.fillStyle = color;
        this.roundRect(ctx, x + padding, y + padding, size, size, 4);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowBlur = 0;
    }

    // 绘制眼睛
    drawEyes(ctx, x, y) {
        const eyeSize = this.cellSize / 5;
        const eyeOffset = this.cellSize / 3;
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#fff';
        
        // 根据方向调整眼睛位置
        let eye1X, eye1Y, eye2X, eye2Y;
        
        if (this.direction.x === 1) { // 向右
            eye1X = x + this.cellSize - eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + this.cellSize - eyeOffset;
            eye2Y = y + this.cellSize - eyeOffset;
        } else if (this.direction.x === -1) { // 向左
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + this.cellSize - eyeOffset;
        } else if (this.direction.y === -1) { // 向上
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + this.cellSize - eyeOffset;
            eye2Y = y + eyeOffset;
        } else { // 向下
            eye1X = x + eyeOffset;
            eye1Y = y + this.cellSize - eyeOffset;
            eye2X = x + this.cellSize - eyeOffset;
            eye2Y = y + this.cellSize - eyeOffset;
        }
        
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    // 绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 获取蛇的长度
    getLength() {
        return this.body.length;
    }
}

// 导出
window.Snake = Snake;
