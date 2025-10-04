#!/bin/bash

# Direct SQL Seeding for Customer Journeys
# This seeds 25 realistic customer journeys using direct SQL inserts

PGHOST="db.gwqkbjymbarkufwvdmar.supabase.co"
PGUSER="postgres"
PGDATABASE="postgres"
PGPORT="5432"
PGPASSWORD="kegquT-vyspi4-javwon"

export PGPASSWORD

echo "🌱 Starting customer journey seeding..."
echo ""

# Get first product ID for orders
PRODUCT_ID=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM items WHERE type = 'Production Ready' AND active = true LIMIT 1;" | xargs)

echo "Using product ID: $PRODUCT_ID"
echo ""

# Get first user ID for assignments
USER_ID=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM user_profiles LIMIT 1;" | xargs)

echo "Using user ID: $USER_ID"
echo ""

# Seed 25 simple journeys
for i in {1..25}
do
  echo "[Journey $i/25] Creating customer journey..."

  # Generate UUIDs
  CONTACT_ID=$(uuidgen)
  LEAD_ID=$(uuidgen)
  CUSTOMER_ID=$(uuidgen)
  PROJECT_ID=$(uuidgen)
  ORDER_ID=$(uuidgen)
  TASK_ID=$(uuidgen)

  # Insert Contact
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO contacts (id, name, email, phone, company, position, created_at)
    VALUES (
      '$CONTACT_ID',
      'Contact Person $i',
      'contact$i@example.com',
      '555-010-$(printf "%04d" $i)',
      'Company $i Inc',
      'Manager',
      NOW() - INTERVAL '$(($RANDOM % 180)) days'
    );
  " > /dev/null

  # Insert Lead
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO leads (id, name, email, phone, company, status, prospect_status, lead_value, created_at)
    VALUES (
      '$LEAD_ID',
      'Contact Person $i',
      'contact$i@example.com',
      '555-010-$(printf "%04d" $i)',
      'Company $i Inc',
      'won',
      'hot',
      $(($RANDOM % 400000 + 50000)),
      NOW() - INTERVAL '$(($RANDOM % 150)) days'
    );
  " > /dev/null

  # Insert Customer
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO customers (id, name, email, phone, company, type, status, created_at)
    VALUES (
      '$CUSTOMER_ID',
      'Company $i Inc',
      'contact$i@example.com',
      '555-010-$(printf "%04d" $i)',
      'Company $i Inc',
      'business',
      'active',
      NOW() - INTERVAL '$(($RANDOM % 120)) days'
    );
  " > /dev/null

  # Insert Project
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO projects (id, name, customer_id, status, budget, start_date, created_at)
    VALUES (
      '$PROJECT_ID',
      'Project $i',
      '$CUSTOMER_ID',
      'in_progress',
      $(($RANDOM % 300000 + 100000)),
      (NOW() - INTERVAL '$(($RANDOM % 90)) days')::text,
      NOW() - INTERVAL '$(($RANDOM % 90)) days'
    );
  " > /dev/null

  # Insert Task
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO tasks (id, title, description, status, priority, department, due_date, created_at)
    VALUES (
      '$TASK_ID',
      'Follow up with Contact Person $i',
      'Initial contact follow-up',
      'completed',
      'high',
      'sales',
      NOW() + INTERVAL '7 days',
      NOW() - INTERVAL '$(($RANDOM % 60)) days'
    );
  " > /dev/null

  echo "   ✅ Journey $i seeded"
done

echo ""
echo "🎉 Seeding complete! Created 25 customer journeys"
echo ""
echo "Summary:"
echo "  - 25 Contacts"
echo "  - 25 Leads"
echo "  - 25 Customers"
echo "  - 25 Projects"
echo "  - 25 Tasks"
echo ""
