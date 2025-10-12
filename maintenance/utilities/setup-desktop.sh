#!/bin/bash

# ================================================================
# Limn Systems Enterprise - Desktop Setup Script
# ================================================================
# This script automates the setup of the development environment
# for limn-systems-enterprise on a new desktop machine
# ================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="limn-systems-enterprise"
GITHUB_REPO="https://github.com/ethan273/limn-systems-enterprise.git"
WORKSPACE_DIR="$HOME/Projects"

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# ================================================================
# MAIN SETUP
# ================================================================

print_header "Limn Systems Enterprise - Desktop Setup"
echo "This script will set up your development environment for ${PROJECT_NAME}"
echo "Repository: ${GITHUB_REPO}"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# ================================================================
# Step 1: Check Prerequisites
# ================================================================
print_header "Step 1: Checking Prerequisites"

MISSING_DEPS=0

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v)
    echo "  Version: ${NODE_VERSION}"
    
    # Check if version is 20 or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ $MAJOR_VERSION -lt 20 ]; then
        print_warning "Node.js version should be 20 or higher. Current: ${NODE_VERSION}"
    fi
else
    MISSING_DEPS=1
    echo "  Please install Node.js v20 or higher from: https://nodejs.org"
fi

# Check npm
if ! check_command npm; then
    MISSING_DEPS=1
fi

# Check Git
if ! check_command git; then
    MISSING_DEPS=1
    echo "  Please install Git: brew install git"
fi

# Check if Homebrew is installed (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! check_command brew; then
        print_warning "Homebrew is not installed. Consider installing it for easier package management."
        echo "  Install from: https://brew.sh"
    fi
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and run this script again."
    exit 1
fi

# ================================================================
# Step 2: Create Workspace and Clone Repository
# ================================================================
print_header "Step 2: Setting Up Project"

# Create workspace directory
if [ ! -d "$WORKSPACE_DIR" ]; then
    print_success "Creating workspace directory: $WORKSPACE_DIR"
    mkdir -p "$WORKSPACE_DIR"
else
    print_success "Workspace directory exists: $WORKSPACE_DIR"
fi

cd "$WORKSPACE_DIR"

# Clone or update repository
if [ -d "$PROJECT_NAME" ]; then
    print_warning "Project directory already exists"
    read -p "Do you want to pull latest changes? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_NAME"
        git pull origin main
        print_success "Repository updated"
    else
        cd "$PROJECT_NAME"
    fi
else
    print_success "Cloning repository..."
    git clone "$GITHUB_REPO"
    cd "$PROJECT_NAME"
    print_success "Repository cloned"
fi

# ================================================================
# Step 3: Install Dependencies
# ================================================================
print_header "Step 3: Installing Dependencies"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_warning "node_modules already exists"
    read -p "Do you want to reinstall dependencies? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules package-lock.json
        npm install
        print_success "Dependencies reinstalled"
    fi
else
    npm install
    print_success "Dependencies installed"
fi

# Install global packages
print_success "Installing global packages..."
npm install -g prisma

# ================================================================
# Step 4: Environment Configuration
# ================================================================
print_header "Step 4: Setting Up Environment Variables"

# Check for .env files
if [ -f ".env" ]; then
    print_success ".env file exists"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning ".env file created from template - PLEASE UPDATE WITH ACTUAL VALUES"
    else
        print_error "No .env.example file found"
    fi
fi

if [ -f ".env.local" ]; then
    print_success ".env.local file exists"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning ".env.local file created from template - PLEASE UPDATE WITH ACTUAL VALUES"
    else
        print_error "No .env.example file found"
    fi
fi

# ================================================================
# Step 5: Database Setup
# ================================================================
print_header "Step 5: Database Configuration"

# Generate Prisma client
print_success "Generating Prisma client..."
npx prisma generate

# Check if we can connect to database
print_success "Testing database connection..."
if npx prisma db pull &> /dev/null; then
    print_success "Database connection successful!"
else
    print_warning "Could not connect to database. Please check your DATABASE_URL in .env"
fi

# ================================================================
# Step 6: Verification
# ================================================================
print_header "Step 6: Running Verification Checks"

# Run lint
echo "Running ESLint..."
if npm run lint &> /dev/null; then
    print_success "Lint check passed"
else
    print_warning "Lint check has warnings/errors - run 'npm run lint' to see details"
fi

# Run type check
echo "Running TypeScript check..."
if npm run type-check &> /dev/null; then
    print_success "TypeScript check passed"
else
    print_warning "TypeScript check has errors - run 'npm run type-check' to see details"
fi

# ================================================================
# Step 7: Final Setup
# ================================================================
print_header "Setup Complete!"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Desktop setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📁 Project location: ${WORKSPACE_DIR}/${PROJECT_NAME}"
echo ""
echo "📝 Next steps:"
echo "  1. Update .env and .env.local with your actual environment variables"
echo "  2. Copy environment files from your laptop or retrieve from secure storage"
echo "  3. Run 'npm run dev' to start the development server"
echo "  4. Visit http://localhost:3000 to verify everything works"
echo ""
echo "🔧 Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run lint         - Run ESLint"
echo "  npm run type-check   - Check TypeScript"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm run test         - Run tests"
echo ""
echo "📚 Documentation:"
echo "  - Migration Plan: DESKTOP_MIGRATION_PLAN.md"
echo "  - Development Guide: CLAUDE.md"
echo "  - Project Docs: /limn-systems-enterprise-docs/"
echo ""
print_success "Happy coding! 🚀"