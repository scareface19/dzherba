@echo off
title Initialisation Base de Donnees DzHerba
cd /d "%~dp0.."

set "NODE_EXE=%~dp0..\bin\node.exe"
if not exist "%NODE_EXE%" (
    set "NODE_EXE=node"
)

"%NODE_EXE%" "%~dp0setup-dzherba-db.js"
echo.
pause
