#!/bin/bash

# Agent Session Starter for Limn Systems Enterprise
# Usage: ./agents/start-agent.sh [agent-type]

AGENTS_DIR="/Users/eko3/limn-systems-enterprise/.agents"

echo "🤖 Limn Systems Enterprise - Agent Session Starter"
echo "=================================================="
echo ""

# Show available agents if no argument
if [ -z "$1" ]; then
    echo "Available agents:"
    echo ""
    echo "  code      - Generate new features and components"
    echo "  debug     - Fix bugs and errors"
    echo "  test      - Write and run tests"
    echo "  database  - Database schema and migrations"
    echo ""
    echo "Usage: ./agents/start-agent.sh [agent-type]"
    echo "Example: ./agents/start-agent.sh code"
    echo ""
    exit 0
fi

AGENT_TYPE=$1

# Validate agent type
case $AGENT_TYPE in
    code|debug|test|database)
        ;;
    *)
        echo "❌ Unknown agent type: $AGENT_TYPE"
        echo "Valid types: code, debug, test, database"
        exit 1
        ;;
esac

# Generate prompt
echo "📋 Copy this prompt to start your agent session:"
echo ""
echo "================================================================"
echo ""
echo "I'm working on Limn Systems Enterprise."
echo ""
echo "Please read these files first:"
echo "1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md"
echo "2. /Users/eko3/limn-systems-enterprise/.agents/${AGENT_TYPE}-agent.md"
echo ""
echo "Then help me with: [DESCRIBE YOUR TASK HERE]"
echo ""
echo "================================================================"
echo ""

# Copy to clipboard if pbcopy available (macOS)
if command -v pbcopy &> /dev/null; then
    echo "I'm working on Limn Systems Enterprise.

Please read these files first:
1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
2. /Users/eko3/limn-systems-enterprise/.agents/${AGENT_TYPE}-agent.md

Then help me with: [DESCRIBE YOUR TASK HERE]" | pbcopy
    echo "✅ Prompt copied to clipboard!"
    echo ""
fi

echo "💡 Tips:"
echo "  - Be specific about what you need"
echo "  - Reference similar existing code when possible"
echo "  - Ask the agent to verify its work"
echo ""
