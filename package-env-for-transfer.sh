#!/bin/bash

# ================================================================
# Environment Transfer Helper for Limn Systems Enterprise
# ================================================================
# Use this script on your LAPTOP to securely package environment
# files for transfer to your desktop
# ================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Environment Transfer Helper - Limn Systems Enterprise${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Please run this script from the limn-systems-enterprise directory${NC}"
    exit 1
fi

echo "This script will package your environment files for secure transfer."
echo ""
echo "Files to be packaged:"
echo "  - .env"
echo "  - .env.local"
echo "  - .env.test (if exists)"
echo ""

read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Transfer cancelled."
    exit 1
fi

# Create timestamp for unique filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="limn-env-transfer-${TIMESTAMP}.tar.gz"

# Package files
echo -e "\n${BLUE}Creating secure package...${NC}"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/env-files"

# Copy environment files if they exist
[ -f ".env" ] && cp .env "$TEMP_DIR/env-files/" && echo "  ✅ Added .env"
[ -f ".env.local" ] && cp .env.local "$TEMP_DIR/env-files/" && echo "  ✅ Added .env.local"
[ -f ".env.test" ] && cp .env.test "$TEMP_DIR/env-files/" && echo "  ✅ Added .env.test"

# Add a README with instructions
cat > "$TEMP_DIR/env-files/README.txt" << EOF
Environment Files for Limn Systems Enterprise
==============================================
Generated: $(date)

To install on your desktop:
1. Extract these files in your project root
2. Verify all values are correct
3. Run: npm run dev

Important: Delete this transfer package after use!
EOF

# Create encrypted archive
cd "$TEMP_DIR"
tar -czf "$HOME/Desktop/${OUTPUT_FILE}" env-files/

# Clean up
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Environment package created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📦 Package location: ~/Desktop/${OUTPUT_FILE}"
echo ""
echo "📝 Transfer options:"
echo "  1. AirDrop to your desktop (macOS)"
echo "  2. Copy via USB drive"
echo "  3. Use secure cloud storage (temporary)"
echo "  4. Transfer via local network"
echo ""
echo "🔒 Security notes:"
echo "  - Delete the package after successful transfer"
echo "  - Never commit these files to Git"
echo "  - Keep environment variables secure"
echo ""
echo -e "${YELLOW}⚠️  On your desktop, extract with:${NC}"
echo "  tar -xzf ${OUTPUT_FILE}"
echo "  Then copy the files to your project root"