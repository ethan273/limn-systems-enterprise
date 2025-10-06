# Desktop Migration Plan for Limn Systems Enterprise

## 📋 Migration Overview
This plan outlines the complete setup process to replicate your limn-systems-enterprise development environment from your laptop to your desktop.

---

## 🎯 Phase 1: Prerequisites & System Setup

### 1.1 Core Development Tools
Install the following software on your desktop:

1. **Node.js & npm** (v20.x or later)
   ```bash
   # macOS with Homebrew
   brew install node@20
   
   # Or download from nodejs.org
   ```

2. **Git**
   ```bash
   brew install git
   ```

3. **PostgreSQL** (for local development)
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

4. **Prisma CLI** (globally)
   ```bash
   npm install -g prisma
   ```

5. **VS Code or your preferred IDE**
   - Download from: https://code.visualstudio.com/

6. **Claude Code** (if using)
   - Follow installation from: https://docs.claude.com/en/docs/claude-code

### 1.2 Optional but Recommended Tools
```bash
# Package manager alternatives
brew install pnpm  # Faster alternative to npm

# Database GUI
brew install --cask tableplus  # Or pgAdmin, DBeaver

# API testing
brew install --cask postman
```

---

## 🎯 Phase 2: Project Setup

### 2.1 Clone the Repository
```bash
# Create workspace directory
mkdir -p ~/Projects
cd ~/Projects

# Clone the repository
git clone https://github.com/ethan273/limn-systems-enterprise.git
cd limn-systems-enterprise
```

### 2.2 Install Dependencies
```bash
# Install all npm packages
npm install

# Or if using pnpm
pnpm install

# Generate Prisma client
npm run prisma:generate
```

### 2.3 Environment Configuration

1. **Copy environment template**
   ```bash
   cp .env.example .env
   cp .env.example .env.local
   ```

2. **Transfer your actual environment variables from laptop**
   
   **Option A: Secure Transfer**
   ```bash
   # On laptop - create encrypted archive
   cd /Users/eko3/limn-systems-enterprise
   tar -czf - .env .env.local | openssl enc -aes-256-cbc -out env-files.enc
   
   # Transfer to desktop via AirDrop/USB/secure method
   
   # On desktop - decrypt and extract
   openssl enc -aes-256-cbc -d -in env-files.enc | tar -xzf -
   ```
   
   **Option B: Manual Copy**
   - Copy the contents of `.env` and `.env.local` from laptop
   - Paste into corresponding files on desktop
   
   **Critical Environment Variables to Verify:**
   - `DATABASE_URL` - Supabase connection string
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key
   - `NEXTAUTH_SECRET` - Must match production

---

## 🎯 Phase 3: Database Setup

### 3.1 Verify Supabase Connection
```bash
# Test database connection
npm run db:studio
# Should open Prisma Studio connected to your Supabase database
```

### 3.2 Sync Database Schema
```bash
# Pull latest schema from Supabase
npx prisma db pull

# Generate Prisma client
npm run prisma:generate
```

---

## 🎯 Phase 4: Documentation Sync

### 4.1 Clone Documentation Repository (if separate)
```bash
cd ~/Projects
git clone [your-docs-repo-url] limn-systems-enterprise-docs
```

### 4.2 Or Copy Documentation Locally
```bash
# If docs are not in Git, copy from laptop
rsync -av laptop:/Users/eko3/limn-systems-enterprise-docs/ ~/limn-systems-enterprise-docs/
```

---

## 🎯 Phase 5: Verification & Testing

### 5.1 Run Development Server
```bash
cd ~/Projects/limn-systems-enterprise

# Start development server
npm run dev

# Should start on http://localhost:3000
```

### 5.2 Run Quality Checks
```bash
# Lint check
npm run lint

# Type check
npm run type-check  

# Build test
npm run build

# Run tests
npm run test
```

### 5.3 Verify Key Features
- [ ] Login/Authentication works
- [ ] Database queries execute properly
- [ ] File uploads work (check Supabase storage)
- [ ] API routes respond correctly
- [ ] UI renders without console errors

---

## 🎯 Phase 6: IDE & Development Setup

### 6.1 VS Code Extensions (Recommended)
Install these extensions for optimal development:
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

### 6.2 Git Configuration
```bash
# Set your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up SSH key for GitHub (optional but recommended)
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add public key to GitHub settings
```

---

## 🎯 Phase 7: Additional Services Setup

### 7.1 Google Drive Integration (if using)
- Ensure Google OAuth credentials are properly set in `.env`
- Test Google Drive functionality if applicable

### 7.2 PWA Features
```bash
# Regenerate PWA assets if needed
npm run generate-pwa-icons
```

### 7.3 Chromatic/Storybook (if using)
- Verify CHROMATIC_PROJECT_TOKEN in environment
- Test with: `npm run chromatic`

---

## 📝 Migration Checklist

### Pre-Migration (On Laptop)
- [ ] Commit and push all changes to GitHub
- [ ] Export environment variables securely
- [ ] Document any local-only configurations
- [ ] Note any running services/dependencies

### During Migration (On Desktop)
- [ ] Install all prerequisites
- [ ] Clone repository
- [ ] Install npm dependencies
- [ ] Configure environment variables
- [ ] Test database connection
- [ ] Verify development server starts

### Post-Migration Verification
- [ ] All lint checks pass
- [ ] TypeScript compilation succeeds
- [ ] Build completes successfully
- [ ] Authentication works
- [ ] Database queries execute
- [ ] No console errors in browser

---

## 🚨 Troubleshooting

### Common Issues & Solutions

1. **Database Connection Errors**
   ```bash
   # Verify DATABASE_URL format
   # Should be: postgresql://[user]:[password]@[host]:[port]/[database]
   
   # Test with Prisma
   npx prisma db pull
   ```

2. **Module Not Found Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Port 3000 Already in Use**
   ```bash
   # Find and kill process
   lsof -i :3000
   kill -9 [PID]
   
   # Or use different port
   PORT=3001 npm run dev
   ```

4. **Prisma Client Issues**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   ```

5. **Build Memory Errors**
   ```bash
   # Increase Node memory
   NODE_OPTIONS='--max-old-space-size=8192' npm run build
   ```

---

## 📞 Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repository**: https://github.com/ethan273/limn-systems-enterprise
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Claude Code Documentation**: https://docs.claude.com/en/docs/claude-code

---

## ✅ Final Verification Script

Create and run this script to verify everything is working:

```bash
#!/bin/bash
# save as verify-setup.sh

echo "🔍 Verifying Limn Systems Enterprise Setup..."

# Check Node version
echo "Node version: $(node -v)"

# Check npm packages
echo "Checking dependencies..."
npm list --depth=0

# Test database connection
echo "Testing database..."
npx prisma db pull

# Run quality checks
echo "Running quality checks..."
npm run lint
npm run type-check

# Attempt build
echo "Testing build..."
npm run build

echo "✅ Setup verification complete!"
```

---

## 🎉 Migration Complete!

Once all checks pass, your desktop environment should be identical to your laptop setup. Remember to:
- Pull latest changes before starting work: `git pull origin main`
- Create feature branches for new work: `git checkout -b feature/your-feature`
- Run quality checks before committing: `npm run pre-commit`

---

**Last Updated**: October 2025
**Project**: Limn Systems Enterprise
**Repository**: https://github.com/ethan273/limn-systems-enterprise