@echo off
set "PORT=8080"
if exist "%~dp0..\active_port.txt" (
    set /p PORT=<"%~dp0..\active_port.txt"
)
start http://localhost:%PORT%
