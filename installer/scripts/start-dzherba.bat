@echo off
title DzHerba - Demarrage de la Plateforme
color 0A
setlocal enabledelayedexpansion

set "APP_DIR=%~dp0.."
cd /d "%APP_DIR%"

echo =======================================================================
echo    DzHerba -- PLATEFORME DE LA FLORE MEDICINALE D'ALGERIE
echo =======================================================================
echo.

:: 1. Verification de Node.js embarque ou systeme
set "NODE_EXE=%APP_DIR%\bin\node.exe"
if not exist "%NODE_EXE%" (
    where node >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "NODE_EXE=node"
    ) else (
        echo [ERREUR] Node.js introuvable dans bin\node.exe.
        pause
        exit /b 1
    )
)

:: 2. Demarrage automatique de MySQL local si disponible
echo [1/3] Verification du service MySQL (Port 3306)...
tasklist /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" >nul
if %ERRORLEVEL% neq 0 (
    if exist "%APP_DIR%\mysql\bin\mysqld.exe" (
        echo [...] Demarrage de MySQL embarque...
        start "DzHerba-MySQL" /b "%APP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%APP_DIR%\mysql\my.ini"
        timeout /t 2 /nobreak >nul
    ) else if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [...] Demarrage de MySQL via XAMPP local...
        start "XAMPP-MySQL" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
    ) else (
        echo [INFO] mysqld.exe non detecte en local. Assurez-vous que MySQL est actif sur le port 3306.
    )
) else (
    echo [OK] Serveur MySQL deja en cours d'execution.
)

:: 3. Initialisation de la base de donnees si premier lancement
echo.
echo [2/3] Verification du schema relationnel et des 773 especes...
"%NODE_EXE%" "%APP_DIR%\scripts\setup-dzherba-db.js" >nul 2>nul

:: 4. Port configuration (Port 8080 par defaut, ou lu depuis port.cfg)
set "PORT=8080"
if exist "%APP_DIR%\port.cfg" (
    set /p PORT=<"%APP_DIR%\port.cfg"
)

:: Supprimer l'ancien fichier de port actif
if exist "%APP_DIR%\active_port.txt" del "%APP_DIR%\active_port.txt" >nul 2>nul

:: 5. Lancement du Serveur Web & API Backend
echo.
echo [3/3] Lancement du Serveur DzHerba (Port %PORT%)...
set "PORT=%PORT%"
start "DzHerba Server" /min "%NODE_EXE%" "%APP_DIR%\server\server.js"

:: 6. Attente et synchronisation du port actif
timeout /t 3 /nobreak >nul
if exist "%APP_DIR%\active_port.txt" (
    set /p ACTIVE_PORT=<"%APP_DIR%\active_port.txt"
    if not "!ACTIVE_PORT!"=="" set "PORT=!ACTIVE_PORT!"
)

:: 7. Ouverture automatique du navigateur
start http://localhost:%PORT%

echo.
echo =======================================================================
echo    DZHERBA EST EN COURS D'EXECUTION !
echo    - Application Web & Cartographie : http://localhost:%PORT%
echo    - API REST Backend               : http://localhost:%PORT%/api
echo =======================================================================
echo.
echo Vous pouvez reduire cette fenetre. Ne la fermez pas pour maintenir le serveur actif.
echo.
pause
