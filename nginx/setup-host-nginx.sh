#!/bin/bash
# ============================================================
# DIAGNOSTIC SCRIPT
# We need to find exactly what is holding port 443 on your server
# ============================================================

echo "=== URUTIX PORT DIAGNOSTICS ==="

echo -e "\n[1] Which process is holding port 443 on the Host?"
netstat -tulpn | grep :443 || echo "netstat not found or nothing on 443"

echo -e "\n[2] Which Docker container is holding port 443?"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 443 || echo "No docker container holds 443"

echo -e "\n[3] List all proxy/nginx containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -iE "nginx|proxy" || echo "No nginx/proxy containers found"

echo -e "\n[4] Localhost curl test:"
curl -I -k https://127.0.0.1/health || echo "Curl failed"

echo -e "\n============================================="
echo "Please copy this ENTIRE output back to the chat!"
echo "============================================="
