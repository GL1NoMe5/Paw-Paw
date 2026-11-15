@echo off
chcp 65001 >nul
title Paw-Paw — Сборка Portable
echo [Paw-Paw] Установка зависимостей и сборка автономного файла...
call npm.cmd install
call npm.cmd run build:portable
echo.
echo [Готово] Автономная версия собрана в папке portable\:
echo   - portable\Paw-Paw-Portable.html (1 файл, работает без интернета и Node.js)
echo   - portable\Start-Paw-Paw.bat (запуск в отдельном окне приложения)
echo   - portable\Paw-Paw-Portable.zip (готовый архив)
pause
