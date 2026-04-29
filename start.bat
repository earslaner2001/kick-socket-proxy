@echo off
chcp 65001 >nul
title Kick Socket Proxy

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       Kick Socket Proxy              ║
echo  ╚══════════════════════════════════════╝
echo.

:: proxy-server klasörüne geç
cd /d "%~dp0proxy-server"

:: node_modules yoksa npm install yap
if not exist "node_modules" (
    echo  [*] Bagimliliklar yukleniyor...
    npm install
    echo.
)

:: Proxy'yi arka planda başlat
echo  [*] Proxy sunucu baslatiliyor... (ws://localhost:4000)
start "Kick Proxy Server" cmd /k "node server.js"

:: Biraz bekle
timeout /t 2 /nobreak >nul

:: Ana dizine geç, statik sunucu başlat
cd /d "%~dp0"
echo  [*] Statik sunucu baslatiliyor...
echo.
echo  Tarayicida ac: http://localhost:3000/chat-test.html
echo.
npx --yes serve . --listen 3000
