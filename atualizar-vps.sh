#!/bin/bash
echo "=================================="
echo "Atualizando Backend..."
echo "=================================="
cd /var/www/poisson-backend || exit
git stash
git pull origin main
npm install
pm2 restart poisson-api

echo " "
echo "=================================="
echo "Atualizando Frontend (ERP)..."
echo "=================================="
cd /var/www/poisson-erp || exit
git stash
git pull origin main
npm install
npm run build

echo " "
echo "=================================="
echo "Reiniciando Servidor Web Apache..."
echo "=================================="
systemctl restart httpd

echo " "
echo "=================================="
echo "=== Atualização na VPS concluída com SUCESSO! ==="
echo "=================================="
