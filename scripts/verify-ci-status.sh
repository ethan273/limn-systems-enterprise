#!/bin/bash
#
# Verify GitHub Actions CI Status
#
# This script checks that GitHub Actions workflows pass before claiming deployment readiness.
# It prevents the recurring issue of committing changes without verifying CI passes.
#
# Usage:
#   ./scripts/verify-ci-status.sh [branch_name]
#
# Returns:
#   0 if all checks pass
#   1 if any checks fail or are pending
#

set -e

BRANCH="${1:-$(git branch --show-current)}"
REPO="limn-systems/limn-systems-enterprise"  # Update this to match your repo

echo "🔍 Verifying GitHub Actions CI Status for branch: $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ ERROR: GitHub CLI (gh) is not installed"
  echo ""
  echo "Install it with:"
  echo "  brew install gh"
  echo "  gh auth login"
  echo ""
  exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ ERROR: Not authenticated with GitHub CLI"
  echo ""
  echo "Run: gh auth login"
  echo ""
  exit 1
fi

# Get the latest commit SHA
COMMIT_SHA=$(git rev-parse HEAD)
echo "📌 Latest commit: $COMMIT_SHA"
echo ""

# Get workflow runs for this commit
echo "⏳ Fetching workflow runs..."
RUNS=$(gh api "repos/$REPO/commits/$COMMIT_SHA/check-runs" --jq '.check_runs[] | {name: .name, status: .status, conclusion: .conclusion}' 2>/dev/null || echo "[]")

if [ -z "$RUNS" ] || [ "$RUNS" = "[]" ]; then
  echo "⚠️  WARNING: No workflow runs found for this commit"
  echo ""
  echo "This could mean:"
  echo "  1. The commit hasn't been pushed yet"
  echo "  2. Workflows haven't started yet (wait 1-2 minutes)"
  echo "  3. No workflows are configured to run on this branch"
  echo ""
  echo "Action required: Push changes and wait for workflows to start"
  exit 1
fi

echo "📊 Workflow Status:"
echo "$RUNS" | jq -r '. | "  • \(.name): \(.status) (\(.conclusion // "in progress"))"'
echo ""

# Check if any runs are still in progress
IN_PROGRESS=$(echo "$RUNS" | jq -r 'select(.status == "in_progress" or .status == "queued") | .name' | wc -l)
if [ "$IN_PROGRESS" -gt 0 ]; then
  echo "⏸️  PENDING: $IN_PROGRESS workflow(s) still running"
  echo ""
  echo "Wait for workflows to complete before claiming deployment readiness."
  echo "Check status: gh run list --branch $BRANCH"
  exit 1
fi

# Check if any runs failed
FAILED=$(echo "$RUNS" | jq -r 'select(.conclusion == "failure") | .name' | wc -l)
if [ "$FAILED" -gt 0 ]; then
  echo "❌ FAILED: $FAILED workflow(s) failed"
  echo ""
  echo "Failed workflows:"
  echo "$RUNS" | jq -r 'select(.conclusion == "failure") | "  • \(.name)"'
  echo ""
  echo "Action required: Fix failing workflows before deployment"
  echo "View logs: gh run view --log"
  exit 1
fi

# Check if all runs succeeded
SUCCESS=$(echo "$RUNS" | jq -r 'select(.conclusion == "success") | .name' | wc -l)
TOTAL=$(echo "$RUNS" | jq -r '. | length')

if [ "$SUCCESS" -eq "$TOTAL" ]; then
  echo "✅ SUCCESS: All $TOTAL workflow(s) passed"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ GitHub Actions CI verification PASSED"
  echo "   Safe to claim deployment readiness"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "⚠️  WARNING: Some workflows have non-success conclusions"
  echo ""
  echo "Summary:"
  echo "  Success: $SUCCESS"
  echo "  Failed: $FAILED"
  echo "  Total: $TOTAL"
  echo ""
  exit 1
fi
