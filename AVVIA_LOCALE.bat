@echo off
setlocal
title Gestionale Pro Loco - Avvio in Locale
cd /d "%~dp0"
echo ===================================================
echo   AVVIO GESTIONALE PRO LOCO IN LOCALE (PORTA 3000)
echo ===================================================
if not exist "node_modules" (
    echo Installazione pacchetti in corso...
    call npm.cmd install
)
echo Avvio server su http://localhost:3000 ...
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:3000"
call npm.cmd run dev
echo.
echo Il server e' stato arrestato. Premi un tasto per chiudere questa finestra.
pause >nul

