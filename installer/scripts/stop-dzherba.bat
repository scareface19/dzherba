@echo off
title DzHerba - Arret des Services
set "APP_DIR=%~dp0.."
echo Arret des processus DzHerba en cours...

taskkill /f /fi "windowtitle eq DzHerba Server*" >nul 2>nul
taskkill /f /im node.exe >nul 2>nul

if exist "%APP_DIR%\mysql\bin\mysqladmin.exe" (
    "%APP_DIR%\mysql\bin\mysqladmin.exe" -u root shutdown >nul 2>nul
)

echo [OK] DzHerba arrete avec succes.
timeout /t 2 >nul
