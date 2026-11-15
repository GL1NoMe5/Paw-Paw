import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');
const portableDir = path.join(rootDir, 'portable');

fs.mkdirSync(portableDir, { recursive: true });

const indexHtmlPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
const jsFile = assetFiles.find((f) => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  throw new Error('Could not find built CSS or JS in dist/assets');
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

// Safely escape closing script tags inside JS literals if any
const safeJsContent = jsContent.replace(/<\/script/gi, '<\\/script');

// Replace stylesheet link with inline <style>
html = html.replace(
  /<link[^>]+rel="stylesheet"[^>]*>/i,
  () => `<style>\n${cssContent}\n</style>`
);

// Replace module script tag with inline <script type="module">
html = html.replace(
  /<script[^>]+type="module"[^>]+src="[^"]+"[^>]*><\/script>/i,
  () => `<script type="module">\n${safeJsContent}\n</script>`
);

const portableHtmlPath = path.join(portableDir, 'Paw-Paw-Portable.html');
fs.writeFileSync(portableHtmlPath, html, 'utf8');

// Create Windows App-Mode Launcher .bat inside portable/
const launcherBat = `@echo off
chcp 65001 >nul
title Paw-Paw — Рабочая тетрадь кинолога
set "APP_HTML=%~dp0Paw-Paw-Portable.html"

where msedge >nul 2>nul
if %errorlevel%==0 (
  start "" msedge --app="file:///%APP_HTML:\=/%" --window-size=1440,920
  exit /b 0
)

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%APP_HTML:\=/%" --window-size=1440,920
  exit /b 0
)

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%APP_HTML:\=/%" --window-size=1440,920
  exit /b 0
)

start "" "%APP_HTML%"
`;

fs.writeFileSync(path.join(portableDir, 'Start-Paw-Paw.bat'), launcherBat.replace(/\n/g, '\r\n'), 'utf8');

// Create a ZIP archive portable/Paw-Paw-Portable.zip using PowerShell Compress-Archive
const zipPath = path.join(portableDir, 'Paw-Paw-Portable.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${portableDir}\\Paw-Paw-Portable.html', '${portableDir}\\Start-Paw-Paw.bat' -DestinationPath '${zipPath}' -Force"`,
  { stdio: 'inherit' }
);

console.log('✓ Built portable/Paw-Paw-Portable.html');
console.log('✓ Built portable/Start-Paw-Paw.bat');
console.log('✓ Built portable/Paw-Paw-Portable.zip');
