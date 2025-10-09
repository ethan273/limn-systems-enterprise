#!/bin/bash

# Memory Check Script for Limn Systems Enterprise
# Run this before starting dev server or tests

echo "🔍 System Memory Status"
echo "======================="

# Overall memory
vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%-16s % 16.2f MB\n", "$1:", $2 * $size / 1048576);'

echo ""
echo "📊 Node.js Processes"
echo "======================="

# Node process count and memory
NODE_COUNT=$(ps aux | grep -E "node|next-server" | grep -v grep | wc -l | xargs)
NODE_MEM=$(ps aux | grep -E "node|next-server" | grep -v grep | awk '{sum += $6} END {print sum/1024}')

echo "Active Node processes: $NODE_COUNT"
echo "Total Node memory: ${NODE_MEM} MB"

if (( $(echo "$NODE_MEM > 8000" | bc -l) )); then
  echo "⚠️  HIGH MEMORY USAGE - Consider restarting processes"
fi

echo ""
echo "🎯 Next.js Dev Servers"
echo "======================="
ps aux | grep "next dev" | grep -v grep | awk '{print "PID: "$2" CPU: "$3"% MEM: "$4"% CMD: "$11" "$12" "$13}'

DEV_SERVER_COUNT=$(ps aux | grep "next dev" | grep -v grep | wc -l | xargs)
if [ "$DEV_SERVER_COUNT" -gt 1 ]; then
  echo "⚠️  DUPLICATE DEV SERVERS DETECTED ($DEV_SERVER_COUNT running)"
  echo "Run: pkill -f 'next dev' && npm run dev"
fi

echo ""
echo "🧪 Playwright Processes"
echo "======================="
PLAYWRIGHT_COUNT=$(ps aux | grep playwright | grep -v grep | wc -l | xargs)
echo "Active Playwright processes: $PLAYWRIGHT_COUNT"

if [ "$PLAYWRIGHT_COUNT" -gt 0 ]; then
  ps aux | grep playwright | grep -v grep | awk '{print "PID: "$2" CPU: "$3"% MEM: "$4"%"}'
fi

echo ""
echo "💡 Quick Actions"
echo "======================="
echo "Kill all dev servers:  pkill -f 'next dev'"
echo "Kill all tests:        pkill -f 'playwright'"
echo "Clean restart:         pkill -f 'next dev' && npm run dev"
