#!/bin/bash
echo "=== NGINX CONFIG DUMP ==="
echo "1. Checking sites-enabled:"
cat /etc/nginx/sites-enabled/*urutix* 2>/dev/null || echo "Not found in sites-enabled"

echo -e "\n2. Checking conf.d:"
cat /etc/nginx/conf.d/*urutix* 2>/dev/null || echo "Not found in conf.d"

echo -e "\n3. Checking nginx.conf for includes:"
grep "include" /etc/nginx/nginx.conf 2>/dev/null || echo "nginx.conf not found"

echo -e "\n4. Checking where certs are located on host:"
ls -la /etc/letsencrypt/live/urutix.com/ 2>/dev/null || echo "Certs not in standard letsencrypt folder"

echo -e "\n5. Testing localhost connection directly to Docker proxy:"
curl -I http://localhost:5173/health || echo "Cannot reach frontend on localhost:5173"
curl -I http://localhost:3005/api/health || echo "Cannot reach backend on localhost:3005"
