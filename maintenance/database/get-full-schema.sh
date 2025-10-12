#!/bin/bash

# Direct PostgreSQL connection to get ALL tables
PASSWORD="MvVZHHUK4V56Kz3F"
HOST="db.kufakdnlhhcwynkfchbb.supabase.co"

echo "🔍 Attempting to get COMPLETE database schema..."
echo ""

# Test connection first
echo "Testing connection..."
PGPASSWORD="$PASSWORD" psql \
  -h "$HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT version();" 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Connection failed. Trying alternative hosts..."
  
  # Try alternative hosts
  HOSTS=(
    "db.kufakdnlhhcwynkfchbb.supabase.co"
    "aws-0-us-east-1.pooler.supabase.com"
    "kufakdnlhhcwynkfchbb.supabase.co"
  )
  
  for host in "${HOSTS[@]}"; do
    echo "Trying $host..."
    PGPASSWORD="$PASSWORD" psql \
      -h "$host" \
      -p 5432 \
      -U postgres \
      -d postgres \
      -c "SELECT 1;" 2>&1 && break
  done
fi

# Get all tables
echo ""
echo "Getting all tables..."
PGPASSWORD="$PASSWORD" psql \
  -h "$HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "\dt *.*" > all-tables-list.txt 2>&1

echo "Check all-tables-list.txt for results"