@echo off
chcp 65001 >nul
title Paw-Paw — Рабочая тетрадь кинолога

if exist "%~dp0portable\Start-Paw-Paw.bat" (
  call "%~dp0portable\Start-Paw-Paw.bat"
  exit /b 0
)

echo [Paw-Paw] Сборка portable-версии...
call npm.cmd run build:portable
call "%~dp0portable\Start-Paw-Paw.bat"
