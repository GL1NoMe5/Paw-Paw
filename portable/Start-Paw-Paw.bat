@echo off
chcp 65001 >nul
title Paw-Paw — Рабочая тетрадь кинолога
set "APP_HTML=%~dp0Paw-Paw-Portable.html"

where msedge >nul 2>nul
if %errorlevel%==0 (
  start "" msedge --app="file:///%APP_HTML:=/%" --window-size=1440,920
  exit /b 0
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_HTML:=/%" --window-size=1440,920
  exit /b 0
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%APP_HTML:=/%" --window-size=1440,920
  exit /b 0
)

start "" "%APP_HTML%"
