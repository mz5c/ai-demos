# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

个人练手项目集合，包含 Java JVM 诊断工具测试和一系列前端交互式 Demo（游戏、算法可视化、创意视觉）。

## Project Structure

```
├── java/
│   └── JvmTest.java               # JVM 诊断工具测试程序，用于演示 jmap/jstack/jstat 等
├── html/
│   ├── snake_game/                # 贪吃蛇大冒险（多文件模块化）
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── utils.js           # 音效系统（Web Audio API）、本地存储、通用工具函数
│   │       ├── snake.js           # 蛇实体：移动、生长、碰撞检测、绘制
│   │       ├── food.js            # 食物系统：4 种食物类型 + 传送门
│   │       ├── enemy.js           # 敌人系统：随机巡逻移动、碰撞检测
│   │       ├── level.js           # 关卡系统：10 关难度递增配置
│   │       ├── scoreboard.js      # 排行榜：localStorage 持久化 Top 10
│   │       └── game.js            # 主控制器：游戏流程、渲染循环、UI 管理
│   ├── 3d-chinese-chess.html      # 3D 中国象棋（Three.js）
│   ├── gomoku.html                # 五子棋（双人 / 人机）
│   ├── minesweeper.html           # 扫雷
│   ├── merge-sort-viz.html        # 归并排序可视化
│   ├── quick-sort-viz.html        # 快速排序可视化
│   └── colorful-black.html        # "五彩斑斓的黑"创意视觉 Demo
```

## Key Architecture Notes

### snake_game 模块化设计

所有类通过 `window.X = X` 导出，在 HTML 中按依赖顺序加载：

```
utils.js → snake.js → food.js → enemy.js → level.js → scoreboard.js → game.js
```

- **Game** 为主控制器，持有 Snake / FoodManager / EnemyManager / LevelManager / Scoreboard 实例
- 渲染循环使用 `requestAnimationFrame`，基于 deltaTime 驱动
- 所有持久化（排行榜、玩家昵称、音效设置）通过 localStorage + `Storage` 工具类

### 单页面 HTML Demo

其余 HTML 文件均为自包含的单页面应用（CSS + JS 内嵌），无构建工具依赖，直接双击或通过 HTTP Server 打开即可运行。

## Commands

```bash
# 启动简易 HTTP Server 预览 HTML 页面
python3 -m http.server 8080 -d html/

# 编译 & 运行 Java 程序
cd java && javac JvmTest.java && java JvmTest
```
