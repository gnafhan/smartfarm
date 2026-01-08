#!/bin/bash

echo "========================================="
echo "Livestock Monitoring - Traefik Check"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Traefik network
echo "1. Checking Traefik network..."
if docker network ls | grep -q "traefik"; then
    echo -e "${GREEN}✓ Traefik network exists${NC}"
else
    echo -e "${RED}✗ Traefik network NOT found${NC}"
    echo -e "${YELLOW}  Creating traefik network...${NC}"
    docker network create traefik
fi
echo ""

# 2. Check services status
echo "2. Checking services status..."
docker compose -f docker-compose.prod.yml ps
echo ""

# 3. Check if containers are in traefik network
echo "3. Checking if containers are connected to traefik network..."
BACKEND_IN_TRAEFIK=$(docker inspect livestock-backend-prod 2>/dev/null | grep -c '"traefik"')
FRONTEND_IN_TRAEFIK=$(docker inspect livestock-frontend-prod 2>/dev/null | grep -c '"traefik"')

if [ "$BACKEND_IN_TRAEFIK" -gt 0 ]; then
    echo -e "${GREEN}✓ Backend connected to traefik network${NC}"
else
    echo -e "${RED}✗ Backend NOT connected to traefik network${NC}"
fi

if [ "$FRONTEND_IN_TRAEFIK" -gt 0 ]; then
    echo -e "${GREEN}✓ Frontend connected to traefik network${NC}"
else
    echo -e "${RED}✗ Frontend NOT connected to traefik network${NC}"
fi
echo ""

# 4. Check Traefik labels
echo "4. Checking Traefik labels on backend..."
docker inspect livestock-backend-prod 2>/dev/null | grep -A 10 "Labels" | grep "traefik"
echo ""

echo "5. Checking Traefik labels on frontend..."
docker inspect livestock-frontend-prod 2>/dev/null | grep -A 10 "Labels" | grep "traefik"
echo ""

# 6. Check DNS resolution
echo "6. Checking DNS resolution..."
echo "Backend DNS (api-livestock.nafhan.com):"
nslookup api-livestock.nafhan.com 2>/dev/null || dig api-livestock.nafhan.com +short
echo ""
echo "Frontend DNS (livestock.nafhan.com):"
nslookup livestock.nafhan.com 2>/dev/null || dig livestock.nafhan.com +short
echo ""

# 7. Check if services are accessible locally
echo "7. Checking if services are accessible locally..."
echo "Testing backend (http://localhost:3001/)..."
if curl -f -s http://localhost:3001/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is accessible${NC}"
else
    echo -e "${RED}✗ Backend is NOT accessible${NC}"
fi

echo "Testing frontend (http://localhost:3000/)..."
if curl -f -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is NOT accessible${NC}"
fi
echo ""

# 8. Check Traefik container
echo "8. Checking Traefik container..."
if docker ps | grep -q "traefik"; then
    echo -e "${GREEN}✓ Traefik container is running${NC}"
    TRAEFIK_CONTAINER=$(docker ps | grep traefik | awk '{print $1}')
    echo "Traefik container ID: $TRAEFIK_CONTAINER"
    echo ""
    echo "Recent Traefik logs:"
    docker logs $TRAEFIK_CONTAINER --tail 20 2>&1 | grep -i "livestock\|error"
else
    echo -e "${RED}✗ Traefik container NOT found${NC}"
    echo -e "${YELLOW}  Make sure Traefik is running on this server${NC}"
fi
echo ""

# 9. Check ports
echo "9. Checking port usage..."
echo "Port 3000 (Frontend):"
netstat -tulpn 2>/dev/null | grep :3000 || lsof -i :3000 2>/dev/null || echo "Not in use or not exposed"
echo ""
echo "Port 3001 (Backend):"
netstat -tulpn 2>/dev/null | grep :3001 || lsof -i :3001 2>/dev/null || echo "Not in use or not exposed"
echo ""

# 10. Recommendations
echo "========================================="
echo "RECOMMENDATIONS"
echo "========================================="
echo ""

if [ "$BACKEND_IN_TRAEFIK" -eq 0 ] || [ "$FRONTEND_IN_TRAEFIK" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Services not connected to Traefik network${NC}"
    echo "  Run: docker compose -f docker-compose.prod.yml down"
    echo "  Run: docker compose -f docker-compose.prod.yml up -d"
    echo ""
fi

if ! docker ps | grep -q "traefik"; then
    echo -e "${YELLOW}⚠ Traefik container not running${NC}"
    echo "  Make sure Traefik is installed and running"
    echo "  Check Traefik documentation or your Traefik setup"
    echo ""
fi

echo "To view logs:"
echo "  Backend:  docker logs livestock-backend-prod -f"
echo "  Frontend: docker logs livestock-frontend-prod -f"
echo ""

echo "To test with exposed ports:"
echo "  docker compose -f docker-compose.prod-with-ports.yml up -d"
echo "  Then access: http://31.97.223.172:3001/ (backend)"
echo "  Then access: http://31.97.223.172:3000/ (frontend)"
echo ""

echo "========================================="
