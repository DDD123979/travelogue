@echo off
chcp 936 >nul
title 游迹 · 停止服务
cd /d "%~dp0"

echo ============================================================
echo    游迹 · 停止服务
echo ============================================================
echo.

REM 后端：按占用 8080 端口的进程号精确结束（不会误杀其它 Java 程序）
set FOUND=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":8080 " ^| findstr /i "LISTENING"') do (
    echo 正在停止后端（PID %%a）...
    taskkill /F /T /PID %%a >nul 2>&1
    set FOUND=1
)
if not defined FOUND echo 后端本来就没在运行

REM Redis：按进程名结束（只影响本项目的 redis-server.exe）
tasklist /fi "imagename eq redis-server.exe" 2>nul | findstr /i "redis-server.exe" >nul
if errorlevel 1 (
    echo Redis 本来就没在运行
) else (
    echo 正在停止 Redis ...
    taskkill /F /IM redis-server.exe >nul 2>&1
)

echo.
echo    已全部停止。
echo.
pause
