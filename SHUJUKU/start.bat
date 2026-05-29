@echo off
chcp 65001 >nul
echo ========================================
echo   校园智慧社团管理系统 - 一键启动
echo ========================================
echo.

echo [1/4] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js 已安装

echo.
echo [2/4] 安装后端依赖...
cd server
if not exist "node_modules" (
    call npm install
)
echo [OK] 后端依赖安装完成

echo.
echo [3/4] 安装前端依赖...
cd ..\client
if not exist "node_modules" (
    call npm install
)
echo [OK] 前端依赖安装完成

echo.
echo [4/4] 启动服务...
cd ..
echo.
echo ========================================
echo   服务启动中...
echo   后端地址: http://localhost:3000
echo   前端地址: http://localhost:5173
echo ========================================
echo.

start "后端服务" cmd /k "cd server && npm run dev"
timeout /t 3 >nul
start "前端服务" cmd /k "cd client && npm run dev"

echo.
echo [提示] 请在新窗口中查看服务运行状态
echo [提示] 按 Ctrl+C 可停止服务
pause
