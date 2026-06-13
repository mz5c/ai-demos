import asyncio
import json
import os
import re
import signal
import sys

import uvicorn
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, StreamingResponse

app = FastAPI(title="SSE 流式作文阅读器")

ESSAY_FILE = os.path.join(os.path.dirname(__file__), "全国II卷高考作文.md")


def prepare_content() -> tuple[str, int]:
    """读取作文文件，去除 Markdown 格式标记，返回纯文本内容和总字数。"""
    with open(ESSAY_FILE, encoding="utf-8") as f:
        text = f.read()

    # 去除 Markdown 格式
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)       # 加粗 **text**
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # 标题标记
    text = text.strip()

    return text, len(text)


async def sse_generator(speed_ms: int):
    """SSE 事件生成器，逐字推送。"""
    content, total = prepare_content()

    yield f"event: start\ndata: {json.dumps({'total': total, 'title': '守其体者终复明', 'done': False})}\n\n"

    for i, ch in enumerate(content):
        yield f"event: char\ndata: {json.dumps({'char': ch, 'index': i, 'done': False})}\n\n"
        await asyncio.sleep(speed_ms / 1000)

    yield f"event: done\ndata: {json.dumps({'index': total, 'done': True})}\n\n"


@app.get("/api/stream")
async def stream(speed: int = Query(default=10, ge=1, le=100)):
    """SSE 流式接口，speed 为每字间隔毫秒数。"""
    return StreamingResponse(
        sse_generator(speed),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/api/info")
async def info():
    """返回作文基本信息。"""
    content, total = prepare_content()
    return {"title": "守其体者终复明", "total": total}


@app.get("/")
async def root():
    """返回前端页面。"""
    return FileResponse(os.path.join(os.path.dirname(__file__), "static", "index.html"))


def main():
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
