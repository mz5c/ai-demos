# Agnes Image 2.0 Flash — 文生图测试文档

## 概述

本文档记录了 Agnes Image 2.0 Flash 文生图模型的 API 接口信息，以及配套的 Web 测试页面的使用说明。

## 模型信息

| 项目 | 详情 |
|------|------|
| **模型名称** | `agnes-image-2.0-flash` |
| **模型类型** | 文生图（Text-to-Image） |
| **文档地址** | https://agnes-ai.com/doc/agnes-image-20-flash |
| **API 平台** | Agnes AI (Sapiens AI) |

---

## API 接口文档

### 基础信息

| 项目 | 值 |
|------|------|
| **端点** | `POST https://apihub.agnes-ai.com/v1/images/generations` |
| **认证方式** | Bearer Token（API Key 放在 Authorization Header 中） |
| **请求格式** | `application/json` |
| **响应格式** | `application/json` |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型标识，固定填 `agnes-image-2.0-flash` |
| `prompt` | string | 是 | 提示词（英文效果通常更好） |
| `size` | string | 否 | 图片尺寸，详见下方尺寸列表 |
| `n` | integer | 否 | 生成数量，范围 1-4，默认 1 |

### 支持的尺寸

| size 值 | 说明 | 适用场景 |
|----------|------|----------|
| `1024x1024` | 正方形 | 头像、图标、通用场景 |
| `1024x768` | 横版 4:3 | 封面、海报、横幅 |
| `768x1024` | 竖版 3:4 | 手机壁纸、竖版海报 |
| `1024x640` | 宽屏 16:10 | 桌面壁纸、网页 Banner |
| `640x1024` | 窄屏 10:16 | 手机全屏壁纸 |

### 请求示例

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.0-flash",
    "prompt": "a cute orange cat sitting on a windowsill, warm afternoon sunlight, photorealistic style",
    "size": "1024x1024",
    "n": 1
  }'
```

### 响应结构

```json
{
  "created": 1781867051,
  "data": [
    {
      "url": "https://platform-outputs.agnes-ai.space/images/t2i/xxxxxx.png",
      "b64_json": null,
      "revised_prompt": null
    }
  ],
  "output_format": null,
  "quality": null,
  "size": null,
  "usage": {
    "total_tokens": 0,
    "input_tokens": 0
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data[].url` | string | 图片访问 URL |
| `data[].b64_json` | string \| null | Base64 编码的图片数据（当前版本返回 null） |
| `data[].revised_prompt` | string \| null | 模型优化后的提示词（可能为 null） |
| `created` | integer | 生成时间戳（Unix 秒） |
| `usage` | object | 用量统计 |

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

项目目录下只有一个 `index.html` 文件，无需安装任何依赖，直接用浏览器打开或用任意 HTTP 服务启动即可。

#### 方式一：直接打开

```bash
open index.html
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

然后浏览器访问 `http://localhost:8080`

### 功能说明

| 功能 | 说明 |
|------|------|
| **提示词输入** | 多行文本框，支持换行描述，按 Enter 直接生成 |
| **尺寸选择** | 下拉菜单选择 5 种预设尺寸 |
| **数量选择** | 1-4 张，批量生成不同变体 |
| **图片展示** | 单张全屏展示，多张 2x2 网格布局 |
| **灯箱预览** | 点击图片全屏查看原图，ESC 关闭 |
| **下载图片** | 悬停图片显示下载按钮，保存到本地 |
| **复制链接** | 悬停图片显示复制链接按钮，一键复制 URL |
| **历史记录** | 自动保存最近 20 条生成记录到 localStorage |
| **重新生成** | 点击历史记录中的"重新生成"按钮快速复用提示词 |
| **清空历史** | 一键清除所有本地历史记录 |

### 界面预览

```
┌─────────────────────────────────────────────┐
│            🎨 Agnes Image 2.0 Flash         │
│             AI 文生图模型在线测试            │
├─────────────────────────────────────────────┤
│ 提示词                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ 一只坐在阳光下的橘猫，温暖的午后氛围     │ │
│ │ 高清摄影风格                             │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 设置                                        │
│ 尺寸: [1024x1024 ▼]  数量: [1]             │
│              [✨ 生成图片]                   │
├─────────────────────────────────────────────┤
│ 生成结果                                    │
│ ┌─────────────┐                             │
│ │             │                             │
│ │   生成的    │                             │
│ │   图片      │                             │
│ │             │  ⬇  🔗                     │
│ └─────────────┘                             │
├─────────────────────────────────────────────┤
│ 历史记录                [清空]               │
│ [缩略图] 一只坐在阳光下的橘猫...  [重新生成]│
│ [缩略图] 赛博朋克风格的东京夜景... [重新生成]│
└─────────────────────────────────────────────┘
```

### 注意事项

1. **API Key 安全**：页面中硬编码了 API Key，仅用于本地测试，勿部署到公网
2. **CORS**：页面直接调用 Agnes API，如遇 CORS 限制需通过本地代理或部署到有同源配置的服务器
3. **图片有效期**：生成的图片 URL 可能有有效期限制，建议及时下载保存
4. **提示词语言**：虽然支持中文提示词，但英文提示词的生成效果通常更稳定

### 技术栈

| 技术 | 说明 |
|------|------|
| **纯 HTML + CSS + JavaScript** | 无任何外部依赖，零构建步骤 |
| **CSS 变量** | 暗色主题，通过 `:root` 自定义属性集中管理 |
| **localStorage** | 历史记录持久化存储 |
| **fetch API** | 现代浏览器原生 HTTP 请求 |
| **CSS Grid** | 响应式图片网格布局 |
| **响应式设计** | 移动端自适应（≤600px 断点） |
