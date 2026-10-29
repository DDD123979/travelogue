@echo off
chcp 936 >nul
title 游迹 · 一键启动
cd /d "%~dp0"

echo ============================================================
echo    游迹 · 一键启动
echo ============================================================
echo.
echo    Redis 和后端都在后台静默运行，不会再弹出额外的终端窗口。
echo    就绪后浏览器会自动打开 http://localhost:8080
echo.
echo    日志：logs\redis.log、logs\server.log
echo    停止：双击 停止游迹.bat
echo.
echo    正在启动，请稍候 ...
echo.

REM 真正的启动逻辑都在 vbs 里（vbs 是唯一能做到“隐藏窗口启动”的方式）
wscript //nologo "%~dp0启动游迹.vbs"

echo.
echo    启动流程已结束，本窗口自动关闭。
timeout /t 2 >nul
