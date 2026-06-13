#!/bin/bash
# 检查指定端口是否被占用，可选杀掉占用进程
# 用法: ./check-port.sh [端口号]

PORT="${1:-8080}"

# 查找端口占用的进程 (优先取 LISTEN 状态的进程)
PROC=$(lsof -i :"$PORT" -P -n 2>/dev/null | awk '/LISTEN/ {print $1, $2}')

# 如果没有 LISTEN 进程，取第一个连接进程
if [ -z "$PROC" ]; then
    PROC=$(lsof -i :"$PORT" -P -n 2>/dev/null | awk 'NR==2 {print $1, $2}')
fi

if [ -z "$PROC" ]; then
    echo "✓ 端口 $PORT 未被占用"
    exit 0
fi

CMD=$(echo "$PROC" | awk '{print $1}')
PID=$(echo "$PROC" | awk '{print $2}')

echo "⚠ 端口 $PORT 已被占用:"
echo "  进程 PID: $PID"
echo "  进程名称: $CMD"
echo ""

# 询问是否杀掉进程
read -r -p "是否杀掉该进程? (y/n): " choice
case "$choice" in
    [yY]|[yY][eE][sS])
        kill -15 "$PID" 2>/dev/null
        sleep 1
        # 检查是否成功终止
        if kill -0 "$PID" 2>/dev/null; then
            echo "  进程未响应 SIGTERM，尝试 SIGKILL..."
            kill -9 "$PID" 2>/dev/null
            sleep 0.5
        fi
        if lsof -i :"$PORT" -P -n 2>/dev/null | awk 'NR==2 {exit 1}'; then
            echo "✓ 已终止端口 $PORT 的进程 (PID: $PID)"
        else
            echo "✗ 无法终止端口 $PORT 的进程"
            exit 1
        fi
        ;;
    *)
        echo "  跳过，未做任何操作"
        ;;
esac
