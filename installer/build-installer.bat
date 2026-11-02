@echo off
setlocal enabledelayedexpansion
title Compilation de l'Installeur Windows -- DzHerba
color 0A
echo =======================================================================
echo    DzHerba -- COMPILATION DE L'INSTALLEUR WINDOWS (.EXE)
echo =======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
cd /d "%ROOT_DIR%"

:: 1. Verification de l'utilitaire Inno Setup 6
set "ISCC=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist "!ISCC!" (
    set "ISCC=C:\Program Files\Inno Setup 6\ISCC.exe"
)

if not exist "!ISCC!" (
    where ISCC.exe >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "ISCC=ISCC.exe"
    ) else (
        echo [ERREUR] Inno Setup 6 n'est pas installe ou ISCC.exe introuvable.
        echo Veuillez installer Inno Setup 6 : https://jrsoftware.org/isdl.php
        pause
        exit /b 1
    )
)
echo [OK] Compilateur Inno Setup detecte : "!ISCC!"
echo.

:: 2. Compilation de l'application Web React (Frontend)
echo [1/2] Compilation de l'application Web (React / Vite)...
cd /d "%ROOT_DIR%\web"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Echec de la compilation du frontend.
    pause
    exit /b 1
)
echo [OK] Frontend compile avec succes dans web\dist.
echo.

:: 3. Creation de l'installeur via Inno Setup
echo [2/2] Creation du package d'installation Windows (.exe)...
cd /d "%SCRIPT_DIR%"
"!ISCC!" DzHerba.iss
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Echec de la compilation Inno Setup.
    pause
    exit /b 1
)

:: Copier une copie a la racine pour acces direct
if exist "%SCRIPT_DIR%dist\DzHerba-Setup-v1.0.0.exe" (
    copy /y "%SCRIPT_DIR%dist\DzHerba-Setup-v1.0.0.exe" "%ROOT_DIR%\DzHerba-Setup-v1.0.0.exe" >nul
)

echo.
echo =======================================================================
echo [SUCCES] L'installeur Windows a ete cree avec succes !
echo Emplacement : %ROOT_DIR%\DzHerba-Setup-v1.0.0.exe
echo =======================================================================
echo.
pause
exit /b 0
