# Agnes Video 2.0 — 文生视频测试文档

## 概述

本文档记录了 Agnes Video 2.0 文生视频模型的 API 接口信息，以及配套的 Web 测试页面 `video_test.html` 的使用说明。

## 模型信息

| 项目 | 详情 |
|------|------|
| **模型名称** | `agnes-video-v2.0` |
| **模型类型** | 文生视频（Text-to-Video） |
| **文档地址** | https://agnes-ai.com/doc/agnes-video-v20 |
| **API 平台** | Agnes AI (Sapiens AI) |

---

## API 接口文档

### 基础信息

| 项目 | 值 |
|------|------|
| **创建任务端点** | `POST https://apihub.agnes-ai.com/v1/videos` |
| **查询结果端点** | `GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>` |
| **认证方式** | Bearer Token（API Key 放在 Authorization Header 中） |
| **请求格式** | `application/json` |
| **响应格式** | `application/json` |
| **调用模式** | 异步任务（创建 → 轮询 → 获取结果） |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型标识，固定填 `agnes-video-v2.0` |
| `prompt` | string | 是 | 视频描述提示词（英文效果通常更好） |
| `duration` | int | 否 | 视频时长（秒），可选值：`5`、`10`、`15`、`18`、`20`，默认 `5` |
| `aspect_ratio` | string | 否 | 画面比例，可选值：`16:9`、`9:16`、`1:1`，默认 `16:9` |
| `motion_mode` | string | 否 | 生成模式，可选值：`std`（标准）、`pro`（专业），默认 `std` |
| `cfg_scale` | float | 否 | 自由度，范围 [0, 1]，默认 0.5 |
| `negative_prompt` | string | 否 | 负面提示词 |
| `num_frames` | int | 否 | 帧数，需满足 `8n+1` 规则，上限 441 |
| `frame_rate` | int | 否 | 帧率，默认 24fps |

### 时长与帧数对照

| 时长 | 帧数 | 帧率 |
|------|------|------|
| 5 秒 | 121 帧 | 24fps |
| 10 秒 | 241 帧 | 24fps |
| 15 秒 | 361 帧 | 24fps |
| 18~20 秒 | 441 帧 | 24fps |

### 请求示例 (cURL)

```bash
curl --location 'https://apihub.agnes-ai.com/v1/videos' \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "agnes-video-v2.0",
    "prompt": "A cinematic shot of a cat walking on the beach at sunset, golden hour lighting, slow motion",
    "duration": 5,
    "aspect_ratio": "16:9",
    "motion_mode": "std"
  }'
```

### 创建任务响应结构

```json
{
  "id": "task_xxxxxxxxxxxx",
  "task_id": "task_xxxxxxxxxxxx",
  "video_id": "video_xxxxxxxxxxxx",
  "object": "video",
  "model": "agnes-video-v2.0",
  "status": "queued",
  "progress": 0,
  "created_at": 1780457477,
  "seconds": "10.0",
  "size": "1280x768"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` / `task_id` | string | 任务 ID，可用于旧版查询接口 |
| `video_id` | string | **视频 ID，推荐用于轮询查询** |
| `status` | string | 任务状态，详见下方状态枚举 |
| `progress` | integer | 进度百分比（0–100） |
| `created_at` | integer | 任务创建 Unix 时间戳 |
| `seconds` | string | 视频时长 |
| `size` | string | 视频分辨率 |

### 查询结果响应结构

```
GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>
```

```json
{
  "id": "task_xxxxxxxxxxxx",
  "video_id": "video_xxxxxxxxxxxx",
  "model": "agnes-video-v2.0",
  "object": "video",
  "status": "completed",
  "progress": 100,
  "seconds": "10.0",
  "size": "1280x768",
  "remixed_from_video_id": "https://storage.googleapis.com/agnes-aigc/aigc/videos/2026/06/03/video_xxxxxx.mp4",
  "error": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | 当前任务状态 |
| `progress` | integer | 进度百分比 |
| `remixed_from_video_id` | string \| null | **视频下载 URL**（仅在 `status == completed` 时有效） |
| `error` | string \| null | 失败时的错误信息 |

### 任务状态枚举

| 状态 | 说明 |
|------|------|
| `queued` | 任务在队列中等待处理 |
| `in_progress` / `processing` | 视频正在生成中 |
| `completed` | 视频生成完成，可获取下载链接 |
| `failed` | 视频生成失败，查看 `error` 字段 |

### 轮询工作流

```
1. POST /v1/videos
       ↓
   返回 video_id (如: "video_xxxx")
       ↓
2. GET /agnesapi?video_id=video_xxxx
   (每 5 秒轮询一次)
       ↓
   status == "completed"
       ↓
   从 remixed_from_video_id 获取视频 URL
```

### 错误响应

```json
{
  "error": {
    "message": "错误描述信息",
    "type": "错误类型",
    "param": "",
    "code": "400"
  }
}
```

---

## Web 测试页面

### 启动方式

项目目录下的 `video_test.html` 文件，无需安装任何依赖，直接用浏览器打开或用任意 HTTP 服务启动即可。

#### 方式一：直接打开

```bash
open video_test.html
```

#### 方式二：本地 HTTP 服务

```bash
# Python 3
python3 -m http.server 8080

# Node.js (需安装 http-server)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

然后浏览器访问 `http://localhost:8080/video_test.html`

### 功能说明

| 功能 | 说明 |
|------|------|
| **提示词输入** | 多行文本框，支持换行描述，按 Enter 直接生成 |
| **时长选择** | 5 / 10 / 15 / 18 / 20 秒，下拉菜单切换 |
| **比例选择** | 16:9 横屏 / 9:16 竖屏 / 1:1 方形 |
| **生成模式** | std 标准模式 / pro 专业模式 |
| **进度展示** | 实时显示生成进度百分比 + 状态文字，渐变进度条 |
| **视频播放** | HTML5 播放器，支持播放/暂停/进度拖拽/音量/全屏 |
| **下载视频** | 一键新窗口下载生成的 MP4 文件 |
| **复制链接** | 一键复制视频 URL 到剪贴板 |
| **历史记录** | 自动保存最近 20 条生成记录到 localStorage |
| **历史回放** | 点击历史条目的 ▶ 图标可直接播放已生成的视频 |
| **重新生成** | 点击"重新生成"按钮快速复用历史提示词和参数 |
| **清空历史** | 一键清除所有本地历史记录 |

### 页面布局

```
┌─────────────────────────────────────────────┐
│           🎬 Agnes Video 2.0                │
│           AI 文生视频模型在线测试             │
├─────────────────────────────────────────────┤
│ 提示词                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ 一只金毛犬在草地上奔跑，阳光明媚的下午   │ │
│ │ 电影质感，慢动作效果                     │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 设置                                        │
│ 时长: [5秒 ▼]  比例: [16:9 ▼]  模式: [std ▼]│
│              [🎬 生成视频]                   │
├─────────────────────────────────────────────┤
│ 生成进度                                    │
│ 正在生成视频...          42%                │
│ ████████████░░░░░░░░░░░░                   │
├─────────────────────────────────────────────┤
│ 生成结果                                    │
│ ┌─────────────────────────────────────────┐ │
│ │            ▶ 视频播放器                  │ │
│ └─────────────────────────────────────────┘ │
│                    [⬇ 下载] [🔗 复制链接]  │
├─────────────────────────────────────────────┤
│ 历史记录                [清空]               │
│ [▶] 一只金毛犬在草地上奔跑...   [重新生成]  │
│ [▶] 赛博朋克风格的东京雨夜...   [重新生成]  │
└─────────────────────────────────────────────┘
```

### 与图片测试页面的区别

| 特性 | index.html（文生图） | video_test.html（文生视频） |
|------|---------------------|--------------------------|
| **API 模式** | 同步返回图片 URL | **异步任务**，需轮询 |
| **进度反馈** | 只有 loading spinner | 进度条 + 百分比 + 状态文字 |
| **输出** | `<img>` 图片展示 | `<video>` 播放器 |
| **操作按钮** | 下载/复制链接（悬停时显示） | 下载/复制链接（始终可见） |
| **历史预览** | 缩略图（第一帧） | ▶ 图标（点击播放） |
| **主题色** | 紫色 (#7c6ef0) | 橙色 (#f08c3e) |

### 注意事项

1. **API Key 安全**：页面中硬编码了 API Key，仅用于本地测试，勿部署到公网
2. **CORS**：页面直接调用 Agnes API，如遇 CORS 限制需通过本地代理或部署到有同源配置的服务器
3. **视频有效期**：生成的视频 URL 可能有有效期限制，建议及时下载保存
4. **生成时长**：视频生成通常需要 1~5 分钟（取决于时长和模式），请耐心等待轮询完成
5. **提示词语言**：虽然支持中文提示词，但英文提示词的生成效果通常更稳定
6. **页面切换**：轮询期间切换页面或关闭浏览器将丢失进度，需重新生成

### 技术栈

| 技术 | 说明 |
|------|------|
| **纯 HTML + CSS + JavaScript** | 无任何外部依赖，零构建步骤 |
| **CSS 变量** | 暗色主题，通过 `:root` 自定义属性集中管理 |
| **localStorage** | 历史记录持久化存储 |
| **fetch API** | 现代浏览器原生 HTTP 请求 |
| **setTimeout 轮询** | 每 5 秒异步查询视频生成状态 |
| **CSS 动画** | 加载旋转动画、进度条过渡动画 |
| **响应式设计** | 移动端自适应（≤600px 断点） |
