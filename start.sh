#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting Services Stack${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo ""
    echo -e "Please create a .env file from the example:"
    echo -e "  ${YELLOW}cp .env.example .env${NC}"
    echo -e "  ${YELLOW}nano .env${NC}  (or use your preferred editor)"
    echo ""
    echo -e "Then fill in your AWS credentials and other configuration."
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Check if AWS credentials are set in .env
if ! grep -q "AWS_ACCESS_KEY_ID=.\+" .env || ! grep -q "AWS_SECRET_ACCESS_KEY=.\+" .env; then
    echo -e "${YELLOW}⚠️  Warning: AWS credentials may not be configured in .env${NC}"
    echo -e "${YELLOW}   The data-initializer service will fail without AWS credentials${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ AWS credentials configured in .env${NC}"
fi

echo ""
echo -e "${GREEN}Starting Docker Compose...${NC}"
docker compose --env-file .env up -d

echo ""
echo -e "${GREEN}Services starting. Checking status...${NC}"
sleep 3
docker compose ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Information${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "n8n:        ${GREEN}http://localhost:5678${NC}"
echo -e "            User: admin / Pass: admin123"
echo ""
echo -e "PostgreSQL: ${GREEN}localhost:5432${NC}"
echo -e "            User: postgres / Pass: postgres123"
echo -e "            Database: main_db"
echo ""
echo -e "Redis:      ${GREEN}localhost:6379${NC}"
echo -e "            Password: redis123"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To view logs:"
echo -e "  ${YELLOW}docker compose logs -f${NC}"
echo ""
echo -e "To view data-initializer logs:"
echo -e "  ${YELLOW}docker compose logs -f data-initializer${NC}"
echo ""
echo -e "To stop all services:"
echo -e "  ${YELLOW}docker compose down${NC}"
echo ""

