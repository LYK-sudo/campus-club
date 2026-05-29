@echo off
chcp 65001 >nul
echo ========================================
echo   校园智慧社团管理系统 - 数据库初始化
echo ========================================
echo.

echo [提示] 请确保已安装 MySQL 8.0 并启动服务
echo.

set /p DB_HOST="请输入数据库地址 (默认 localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="请输入数据库端口 (默认 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_USER="请输入数据库用户名 (默认 root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD="请输入数据库密码: "
set /p DB_NAME="请输入数据库名称 (默认 campus_club): "
if "%DB_NAME%"=="" set DB_NAME=campus_club

echo.
echo 正在更新配置文件...

(
echo PORT=3000
echo JWT_SECRET=campus_club_jwt_secret_key_2024
echo JWT_EXPIRES_IN=7d
echo.
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_NAME=%DB_NAME%
echo.
echo UPLOAD_PATH=./uploads
) > server\.env

echo.
echo 正在初始化数据库...
echo.

cd server
call npm install
call npm run init-db

echo.
echo ========================================
echo   数据库初始化完成！
echo ========================================
echo.
echo 默认账号:
echo   管理员: admin / admin123
echo   老师: teacher001 / teacher123
echo   学生: 2021001 / 123456
echo.

pause
