@echo off
chcp 65001 >nul
echo ==================================
echo Atualizando Poisson Backend (GitHub)
echo ==================================
cd /d C:\poisson-backend
git add .
git commit -m "Atualizacao automatica backend"
git push origin main

echo.
echo ==================================
echo Atualizando Poisson ERP (GitHub)
echo ==================================
cd /d C:\poisson-erp
git add .
git commit -m "Atualizacao automatica frontend"
git push origin main

echo.
echo ==================================
echo === Envio para o GitHub concluido! ===
echo ==================================
pause
