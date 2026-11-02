@echo off
chcp 65001 >nul
title DzHerba - Reentrainement du Modele Vision IA

echo =======================================================================
echo          DzHerba -- REENTRAINEMENT ET INDEXATION VISION IA
echo =======================================================================
echo.
echo Ce script scanne l'ensemble des dossiers dans D:\DzHerba\startup\startup,
echo indexe toutes les nouvelles photos ajoutees, et met a jour la base de donnees.
echo.

cd /d "%~dp0"

echo [1/2] Regeneration des signatures visuelles IA...
node scripts\regenerate_vision_signatures.js
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le script de regeneration a echoue.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Notification du serveur backend DzHerba...
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/vision/retrain' -Method Post -TimeoutSec 5; Write-Host ('[OK] Serveur informe avec succes : ' + $res.count + ' signatures actives.'); } catch { Write-Host '[INFO] Serveur non demarre ou deja synchronise.'; }"

echo.
echo =======================================================================
echo    REENTRAINEMENT TERMINE AVEC SUCCES !
echo    Toutes les nouvelles photos sont desormais reconnues par l'IA.
echo =======================================================================
echo.
pause
