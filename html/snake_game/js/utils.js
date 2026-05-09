/**
 * 工具函数模块
 * 包含音效系统、本地存储等通用功能
 */

// ==================== 音效系统 ====================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.init();
    }

    init() {
        try {
            // 创建 AudioContext
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // 恢复 AudioContext (需要用户交互后调用)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // 播放吃普通食物音效
    playEatNormal() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(800, 'sine', 0.1, 0.05);
    }

    // 播放吃特殊食物音效
    playEatSpecial() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(1000, 'sine', 0.1, 0.05, () => {
            this.playTone(1500, 'sine', 0.1, 0.05);
        });
    }

    // 播放吃金币音效
    playEatGold() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(1200, 'sine', 0.1, 0.05, () => {
            setTimeout(() => {
                this.playTone(1800, 'sine', 0.1, 0.05, () => {
                    setTimeout(() => {
                        this.playTone(2400, 'sine', 0.1, 0.05);
                    }, 50);
                });
            }, 50);
        });
    }

    // 播放进入传送门音效
    playPortal() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(400, 'sine', 0.2, 0.05, () => {
            this.playTone(600, 'sine', 0.2, 0.05, () => {
                this.playTone(800, 'sine', 0.2, 0.05);
            });
        });
    }

    // 播放过关音效
    playLevelComplete() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.15, 0.05);
            }, i * 100);
        });
    }

    // 播放游戏失败音效
    playGameOver() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.3, 0.05);
            }, i * 150);
        });
    }

    // 播放胜利音效
    playVictory() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [523, 659, 784, 1047, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.2, 0.05);
            }, i * 120);
        });
    }

    // 播放时间警告音效
    playTimeWarning() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(800, 'sine', 0.1, 0.03);
    }

    // 播放暂停音效
    playPause() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(600, 'sine', 0.15, 0.05);
    }

    // 播放继续音效
    playResume() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(800, 'sine', 0.15, 0.05);
    }

    // 播放按钮点击音效
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(500, 'sine', 0.05, 0.02);
    }

    // 播放通用音效
    playTone(frequency, type, duration, attackTime, callback) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // 音量包络
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + attackTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        if (callback) {
            setTimeout(callback, duration * 1000);
        }
    }
}

// ==================== 本地存储 ====================
const Storage = {
    // 保存排行榜
    saveScoreboard(scores) {
        try {
            localStorage.setItem('snake_scoreboard', JSON.stringify(scores));
        } catch (e) {
            console.warn('Failed to save scoreboard:', e);
        }
    },

    // 获取排行榜
    getScoreboard() {
        try {
            const data = localStorage.getItem('snake_scoreboard');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load scoreboard:', e);
            return [];
        }
    },

    // 保存玩家昵称
    savePlayerName(name) {
        try {
            localStorage.setItem('snake_player_name', name);
        } catch (e) {
            console.warn('Failed to save player name:', e);
        }
    },

    // 获取玩家昵称
    getPlayerName() {
        try {
            return localStorage.getItem('snake_player_name') || '';
        } catch (e) {
            console.warn('Failed to load player name:', e);
            return '';
        }
    },

    // 保存音效设置
    saveSoundEnabled(enabled) {
        try {
            localStorage.setItem('snake_sound_enabled', enabled);
        } catch (e) {
            console.warn('Failed to save sound setting:', e);
        }
    },

    // 获取音效设置
    getSoundEnabled() {
        try {
            const data = localStorage.getItem('snake_sound_enabled');
            return data !== null ? JSON.parse(data) : true;
        } catch (e) {
            console.warn('Failed to load sound setting:', e);
            return true;
        }
    }
};

// ==================== 其他工具函数 ====================
const Utils = {
    // 随机生成数字
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 检查两个矩形是否碰撞
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // 格式化时间 (秒 -> 分:秒)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ==================== 导出 ====================
window.SoundManager = SoundManager;
window.Storage = Storage;
window.Utils = Utils;
