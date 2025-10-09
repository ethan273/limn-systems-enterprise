# Memory Management Guide for Limn Systems Enterprise

**Created: 2025-10-07**
**Critical: Read this EVERY session before starting work**

## 🚨 Problem

Next.js 15 + Turbopack uses 2-4GB per dev server instance. Running multiple instances causes:
- System memory exhaustion
- Terminal crashes
- Test timeouts
- "JavaScript heap out of memory" errors

## ✅ Solution Implemented

### 1. Memory Check Script
**Location:** `/check-memory.sh`

```bash
./check-memory.sh  # Run this before ANY work
```

**Shows:**
- System memory status
- Node process count and memory usage
- Duplicate dev server detection
- Active Playwright processes
- Quick cleanup commands

### 2. Updated CLAUDE.md
Added comprehensive "MEMORY MANAGEMENT (CRITICAL)" section with:
- Start of session checklist
- Memory-safe test running guidelines
- Prevention checklist
- Emergency cleanup procedures
- Signs of memory issues

### 3. Optimized playwright.config.ts
**Before:** `workers: 3`
**After:** `workers: process.env.CI ? 1 : 2`

Also uses:
- `video: 'retain-on-failure'` (not 'on')
- `trace: 'retain-on-failure'` (not 'on')

### 4. Added Memory-Safe Test Scripts to package.json
```json
{
  "test:portals": "NODE_OPTIONS='--max-old-space-size=4096' playwright test tests/11-admin-portal.spec.ts tests/15-customer-portal.spec.ts tests/16-designer-portal.spec.ts tests/17-factory-portal.spec.ts --workers=2 --reporter=html",
  "test:portals:safe": "NODE_OPTIONS='--max-old-space-size=4096' playwright test tests/15-customer-portal.spec.ts tests/16-designer-portal.spec.ts tests/17-factory-portal.spec.ts --workers=1 --reporter=html",
  "test:mobile": "NODE_OPTIONS='--max-old-space-size=4096' playwright test tests/18-pwa-mobile.spec.ts tests/19-responsive-design.spec.ts --workers=1 --reporter=html",
  "test:security": "NODE_OPTIONS='--max-old-space-size=4096' playwright test tests/12-trpc-api.spec.ts tests/13-accessibility.spec.ts tests/14-security.spec.ts --workers=1 --reporter=html",
  "test:gap-analysis": "NODE_OPTIONS='--max-old-space-size=4096' playwright test tests/20-gap-analysis.spec.ts --workers=1 --reporter=html"
}
```

## 📋 Every Session Checklist

### Before Starting ANY Work:
```bash
# 1. Check memory
./check-memory.sh

# 2. Clean up
pkill -f "next dev"
pkill -f "playwright"

# 3. Verify clean
ps aux | grep -E "next-server|playwright" | grep -v grep

# 4. Start ONE dev server
npm run dev
```

### Before Running Tests:
```bash
# Verify only ONE dev server running
./check-memory.sh

# Run tests with memory-safe settings
npx playwright test <test-file> --workers=1
# OR use npm scripts
npm run test:portals:safe
```

### During Long Sessions:
```bash
# Every hour, check memory
./check-memory.sh

# If Node memory > 8GB, restart
pkill -f "next dev" && npm run dev
```

## 🚫 Never Do This

- ❌ Start multiple `npm run dev` processes
- ❌ Run tests with `--workers=3` or higher
- ❌ Run tests without checking memory first
- ❌ Leave test processes running in background
- ❌ Ignore memory warnings

## ⚡ Emergency Cleanup

If system is slow or memory is high:

```bash
# Kill everything
pkill -f "next dev"
pkill -f "playwright"
pkill -f "node"

# Wait
sleep 5

# Verify clean
./check-memory.sh

# Restart
npm run dev
```

## 📊 Memory Thresholds

- **Normal**: Node processes < 4GB total
- **High**: Node processes 4-8GB total → Monitor closely
- **Critical**: Node processes > 8GB total → Restart immediately

## 🎯 Key Files Modified

1. **CLAUDE.md** - Added "MEMORY MANAGEMENT (CRITICAL)" section
2. **playwright.config.ts** - Reduced workers from 3 to 2
3. **package.json** - Added memory-safe test scripts
4. **check-memory.sh** - New memory monitoring script (created)

## 💡 Why This Works

- **Single Dev Server**: Prevents 2-4GB × N instances
- **Limited Workers**: Playwright workers = separate browser instances = memory
- **NODE_OPTIONS**: Increases heap size for heavy operations
- **Proactive Monitoring**: Catch issues before crashes

## 📝 Notes

- Memory check script created: `/check-memory.sh` (executable)
- All test scripts now include NODE_OPTIONS memory limits
- Playwright configured for optimal memory usage
- CLAUDE.md ensures future sessions follow these practices

## 🔗 Related Documentation

- CLAUDE.md - Section: "🚨 MEMORY MANAGEMENT (CRITICAL)"
- playwright.config.ts - Workers and video/trace settings
- package.json - Memory-safe test scripts
