/**
 * 排行榜系统
 * 管理玩家得分排行榜
 */

class Scoreboard {
    constructor() {
        this.maxEntries = 10;
        this.scores = Storage.getScoreboard();
    }

    // 添加新分数
    addScore(playerName, score, level) {
        const entry = {
            id: Date.now(),
            playerName: this.sanitizeName(playerName),
            score: score,
            bestLevel: level,
            date: new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            timestamp: Date.now()
        };

        this.scores.push(entry);
        
        // 按分数降序排序
        this.scores.sort((a, b) => b.score - a.score);
        
        // 只保留前 10 名
        if (this.scores.length > this.maxEntries) {
            this.scores = this.scores.slice(0, this.maxEntries);
        }
        
        // 保存到本地存储
        Storage.saveScoreboard(this.scores);
        
        return entry;
    }

    // 清理玩家昵称
    sanitizeName(name) {
        // 去除首尾空格，限制长度
        return name.trim().substring(0, 10) || 'Player';
    }

    // 获取排行榜
    getScores() {
        return this.scores;
    }

    // 获取玩家最高分
    getPlayerBestScore(playerName) {
        const playerScores = this.scores.filter(s => 
            s.playerName === this.sanitizeName(playerName)
        );
        
        if (playerScores.length === 0) return 0;
        
        return Math.max(...playerScores.map(s => s.score));
    }

    // 获取玩家最佳关卡
    getPlayerBestLevel(playerName) {
        const playerScores = this.scores.filter(s => 
            s.playerName === this.sanitizeName(playerName)
        );
        
        if (playerScores.length === 0) return 1;
        
        return Math.max(...playerScores.map(s => s.bestLevel));
    }

    // 获取当前玩家的排名
    getPlayerRank(playerName) {
        const playerNameNormalized = this.sanitizeName(playerName);
        const sortedScores = [...this.scores].sort((a, b) => b.score - a.score);
        
        for (let i = 0; i < sortedScores.length; i++) {
            if (sortedScores[i].playerName === playerNameNormalized) {
                return i + 1;
            }
        }
        
        return null; // 不在排行榜上
    }

    // 渲染排行榜到表格
    renderToTable(tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.scores.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center; color: #888;">暂无记录</td>';
            tbody.appendChild(row);
            return;
        }
        
        this.scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // 排名图标
            let rankIcon = `#${index + 1}`;
            if (index === 0) rankIcon = '🥇';
            else if (index === 1) rankIcon = '🥈';
            else if (index === 2) rankIcon = '🥉';
            
            row.innerHTML = `
                <td>${rankIcon}</td>
                <td>${this.escapeHtml(entry.playerName)}</td>
                <td style="color: #00ff88; font-weight: bold;">${entry.score}</td>
                <td>第 ${entry.bestLevel} 关</td>
                <td>${entry.date}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 清除排行榜
    clear() {
        this.scores = [];
        Storage.saveScoreboard(this.scores);
    }

    // 获取排行榜统计信息
    getStats() {
        if (this.scores.length === 0) {
            return {
                totalPlayers: 0,
                highestScore: 0,
                averageScore: 0
            };
        }
        
        const uniquePlayers = new Set(this.scores.map(s => s.playerName));
        const highestScore = this.scores[0]?.score || 0;
        const averageScore = this.scores.reduce((sum, s) => sum + s.score, 0) / this.scores.length;
        
        return {
            totalPlayers: uniquePlayers.size,
            highestScore: highestScore,
            averageScore: Math.round(averageScore)
        };
    }
}

// 导出
window.Scoreboard = Scoreboard;
