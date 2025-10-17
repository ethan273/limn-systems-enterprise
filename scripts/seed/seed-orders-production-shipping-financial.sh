#!/bin/bash

# Extended Seeding: Orders → Production → Shipping → Financial
# Builds complete business workflows on top of existing 25 customer journeys

# SECURITY: Use environment variables for database credentials
# Set these before running:
#   export PGHOST="db.your-project.supabase.co"
#   export PGUSER="postgres"
#   export PGDATABASE="postgres"
#   export PGPORT="5432"
#   export PGPASSWORD="your-password"

# Validate required environment variables
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ] || [ -z "$PGPASSWORD" ]; then
  echo "❌ ERROR: Missing required database environment variables"
  echo "Please set: PGHOST, PGUSER, PGDATABASE, PGPORT, PGPASSWORD"
  echo ""
  echo "Example:"
  echo "  export PGHOST=\"db.your-project.supabase.co\""
  echo "  export PGUSER=\"postgres\""
  echo "  export PGDATABASE=\"postgres\""
  echo "  export PGPORT=\"5432\""
  echo "  export PGPASSWORD=\"your-password\""
  exit 1
fi

# Default PGPORT if not set
PGPORT="${PGPORT:-5432}"

echo ""
echo "🚀 Starting Orders → Production → Shipping → Financial seeding..."
echo ""

# Get existing projects and customers
PROJECTS=($(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM projects WHERE name LIKE 'Project%' ORDER BY created_at LIMIT 25;" | xargs))
CUSTOMERS=($(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM customers WHERE name LIKE 'Company%Inc' ORDER BY created_at LIMIT 25;" | xargs))

# Get product IDs for order items
PRODUCTS=($(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM items WHERE type = 'Production Ready' AND active = true LIMIT 60;" | xargs))

# Get first user ID for assignments
USER_ID=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT id FROM user_profiles LIMIT 1;" | xargs)

echo "Found ${#PROJECTS[@]} projects, ${#CUSTOMERS[@]} customers, ${#PRODUCTS[@]} products"
echo ""

# Status arrays for variation
ORDER_STATUSES=("pending" "pending" "pending" "confirmed" "confirmed" "confirmed" "confirmed" "confirmed" "in_production" "in_production" "in_production" "in_production" "in_production" "in_production" "in_production" "shipped" "shipped" "shipped" "delivered" "delivered" "delivered" "delivered" "delivered" "delivered" "delivered")
PROD_STATUSES=("awaiting_deposit" "awaiting_deposit" "awaiting_deposit" "in_production" "in_production" "in_production" "in_production" "in_production" "quality_check" "quality_check" "quality_check" "quality_check" "quality_check" "quality_check" "quality_check" "completed" "completed" "completed" "completed" "completed" "completed" "completed" "shipped" "shipped" "shipped")
SHIP_STATUSES=("pending" "pending" "pending" "processing" "processing" "processing" "processing" "shipped" "shipped" "shipped" "shipped" "shipped" "shipped" "shipped" "shipped" "in_transit" "in_transit" "in_transit" "in_transit" "in_transit" "in_transit" "in_transit" "delivered" "delivered" "delivered")
INVOICE_STATUSES=("pending" "pending" "pending" "partial" "partial" "partial" "partial" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "paid" "overdue" "overdue" "paid")
CARRIERS=("FedEx" "UPS" "DHL" "FedEx" "UPS" "FedEx" "UPS" "DHL" "FedEx" "UPS")

# Seed 25 complete journeys
for i in {0..24}
do
  JOURNEY_NUM=$((i + 1))
  echo "[Journey $JOURNEY_NUM/25] Creating complete business workflow..."

  PROJECT_ID="${PROJECTS[$i]}"
  CUSTOMER_ID="${CUSTOMERS[$i]}"
  ORDER_STATUS="${ORDER_STATUSES[$i]}"
  PROD_STATUS="${PROD_STATUSES[$i]}"
  SHIP_STATUS="${SHIP_STATUSES[$i]}"
  INVOICE_STATUS="${INVOICE_STATUSES[$i]}"
  CARRIER="${CARRIERS[$((RANDOM % 10))]}"

  # Generate UUIDs
  ORDER_ID=$(uuidgen)
  ORDER_ITEM1_ID=$(uuidgen)
  ORDER_ITEM2_ID=$(uuidgen)
  ORDER_ITEM3_ID=$(uuidgen)
  PROD_ORDER_ID=$(uuidgen)
  SHOP_DRAWING_ID=$(uuidgen)
  QC_INSPECTION_ID=$(uuidgen)
  SHIPMENT_ID=$(uuidgen)
  INVOICE_ID=$(uuidgen)
  INVOICE_ITEM1_ID=$(uuidgen)
  INVOICE_ITEM2_ID=$(uuidgen)
  INVOICE_ITEM3_ID=$(uuidgen)
  PAYMENT_ID=$(uuidgen)

  # Random products for order (2-3 items)
  ITEM_COUNT=$((2 + RANDOM % 2))  # 2 or 3 items
  PRODUCT1="${PRODUCTS[$((RANDOM % 60))]}"
  PRODUCT2="${PRODUCTS[$((RANDOM % 60))]}"
  PRODUCT3="${PRODUCTS[$((RANDOM % 60))]}"

  # Get product prices
  PRICE1=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT price FROM items WHERE id = '$PRODUCT1';" | xargs)
  PRICE2=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT price FROM items WHERE id = '$PRODUCT2';" | xargs)
  PRICE3=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT price FROM items WHERE id = '$PRODUCT3';" | xargs)

  # Get product names
  PRODUCT1_NAME=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT name FROM items WHERE id = '$PRODUCT1';" | xargs)

  # Random quantities
  QTY1=$((1 + RANDOM % 3))
  QTY2=$((1 + RANDOM % 3))
  QTY3=$((1 + RANDOM % 2))

  # Calculate totals using bc for decimal math
  TOTAL1=$(echo "$PRICE1 * $QTY1" | bc)
  TOTAL2=$(echo "$PRICE2 * $QTY2" | bc)
  if [ $ITEM_COUNT -eq 3 ]; then
    TOTAL3=$(echo "$PRICE3 * $QTY3" | bc)
    ORDER_TOTAL=$(echo "$TOTAL1 + $TOTAL2 + $TOTAL3" | bc)
  else
    ORDER_TOTAL=$(echo "$TOTAL1 + $TOTAL2" | bc)
  fi

  # Calculate invoice amounts (with 8% tax)
  SUBTOTAL=$ORDER_TOTAL
  TAX_TOTAL=$(echo "$SUBTOTAL * 0.08" | bc)
  INVOICE_TOTAL=$(echo "$SUBTOTAL + $TAX_TOTAL" | bc)

  # Amount paid based on status
  if [ "$INVOICE_STATUS" = "paid" ]; then
    AMOUNT_PAID=$INVOICE_TOTAL
  elif [ "$INVOICE_STATUS" = "partial" ]; then
    AMOUNT_PAID=$(echo "$INVOICE_TOTAL * 0.5" | bc)
  else
    AMOUNT_PAID=0
  fi

  # 1. CREATE ORDER
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO orders (id, order_number, customer_id, status, total_amount, created_at)
    VALUES (
      '$ORDER_ID',
      'ORD-2025-$(printf "%03d" $JOURNEY_NUM)',
      '$CUSTOMER_ID',
      '$ORDER_STATUS',
      $ORDER_TOTAL,
      NOW() - INTERVAL '$(($RANDOM % 90)) days'
    );
  " > /dev/null

  # 2. CREATE ORDER ITEMS (no total field - computed automatically)
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO order_items (id, order_id, item_id, quantity, unit_price, created_at)
    VALUES
      ('$ORDER_ITEM1_ID', '$ORDER_ID', '$PRODUCT1', $QTY1, $PRICE1, NOW()),
      ('$ORDER_ITEM2_ID', '$ORDER_ID', '$PRODUCT2', $QTY2, $PRICE2, NOW());
  " > /dev/null

  if [ $ITEM_COUNT -eq 3 ]; then
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
      INSERT INTO order_items (id, order_id, item_id, quantity, unit_price, created_at)
      VALUES ('$ORDER_ITEM3_ID', '$ORDER_ID', '$PRODUCT3', $QTY3, $PRICE3, NOW());
    " > /dev/null
  fi

  # Determine deposit/final payment status
  DEPOSIT_PAID="false"
  FINAL_PAID="false"
  if [ "$PROD_STATUS" != "awaiting_deposit" ]; then
    DEPOSIT_PAID="true"
  fi
  if [ "$PROD_STATUS" = "completed" ] || [ "$PROD_STATUS" = "shipped" ]; then
    FINAL_PAID="true"
  fi

  # 3. CREATE PRODUCTION ORDER
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO production_orders (
      id, order_number, order_id, catalog_item_id, product_type, item_name,
      quantity, unit_price, total_cost, deposit_paid, final_payment_paid,
      status, order_date, created_at
    )
    VALUES (
      '$PROD_ORDER_ID',
      'PRD-2025-$(printf "%03d" $JOURNEY_NUM)',
      '$ORDER_ID',
      '$PRODUCT1',
      'Production Ready',
      '$PRODUCT1_NAME',
      $((QTY1 + QTY2)),
      $PRICE1,
      $ORDER_TOTAL,
      $DEPOSIT_PAID,
      $FINAL_PAID,
      '$PROD_STATUS',
      NOW() - INTERVAL '$(($RANDOM % 80)) days',
      NOW() - INTERVAL '$(($RANDOM % 80)) days'
    );
  " > /dev/null

  # 4. CREATE SHOP DRAWING (requires drawing_name, current_version, created_by)
  DRAWING_STATUS="approved"
  if [ $((RANDOM % 10)) -lt 2 ]; then
    DRAWING_STATUS="in_review"
  fi

  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO shop_drawings (id, drawing_number, drawing_name, production_order_id, status, current_version, created_by, created_at)
    VALUES (
      '$SHOP_DRAWING_ID',
      'SD-$(printf "%03d" $JOURNEY_NUM)',
      'Shop Drawing $(printf "%03d" $JOURNEY_NUM)',
      '$PROD_ORDER_ID',
      '$DRAWING_STATUS',
      1,
      '$USER_ID',
      NOW() - INTERVAL '$(($RANDOM % 70)) days'
    );
  " > /dev/null

  # 5. CREATE QC INSPECTION (requires order_id, qc_stage, uses order_item_id not production_order_id)
  QC_STATUS="passed"
  if [ $((RANDOM % 10)) -lt 2 ]; then
    QC_STATUS="pending"
  fi
  QC_STAGE="final_inspection"

  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO qc_inspections (id, order_id, order_item_id, qc_stage, status, notes, created_at)
    VALUES (
      '$QC_INSPECTION_ID',
      '$ORDER_ID',
      '$ORDER_ITEM1_ID',
      '$QC_STAGE',
      '$QC_STATUS',
      'Quality inspection $QC_STATUS',
      NOW() - INTERVAL '$(($RANDOM % 60)) days'
    );
  " > /dev/null

  # 6. CREATE SHIPMENT
  TRACKING_NUM=$(LC_ALL=C tr -dc 'A-Z0-9' < /dev/urandom | head -c 12)

  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO shipments (
      id, shipment_number, order_id, status, carrier, tracking_number,
      package_count, shipped_date, created_at
    )
    VALUES (
      '$SHIPMENT_ID',
      'SHP-2025-$(printf "%03d" $JOURNEY_NUM)',
      '$ORDER_ID',
      '$SHIP_STATUS',
      '$CARRIER',
      '$TRACKING_NUM',
      $((1 + RANDOM % 3)),
      NOW() - INTERVAL '$(($RANDOM % 50)) days',
      NOW() - INTERVAL '$(($RANDOM % 50)) days'
    );
  " > /dev/null

  # 7. CREATE INVOICE
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO invoices (
      id, invoice_number, customer_id, order_id, status,
      invoice_date, due_date, subtotal, tax_total, total_amount, amount_paid,
      payment_terms, created_at
    )
    VALUES (
      '$INVOICE_ID',
      'INV-2025-$(printf "%03d" $JOURNEY_NUM)',
      '$CUSTOMER_ID',
      '$ORDER_ID',
      '$INVOICE_STATUS',
      CURRENT_DATE - INTERVAL '$(($RANDOM % 60)) days',
      CURRENT_DATE + INTERVAL '30 days',
      $SUBTOTAL,
      $TAX_TOTAL,
      $INVOICE_TOTAL,
      $AMOUNT_PAID,
      'Net 30',
      NOW() - INTERVAL '$(($RANDOM % 60)) days'
    );
  " > /dev/null

  # 8. CREATE INVOICE ITEMS (requires description, no total field - line_total is computed)
  PRODUCT1_DESC=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT name FROM items WHERE id = '$PRODUCT1';" | xargs)
  PRODUCT2_DESC=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT name FROM items WHERE id = '$PRODUCT2';" | xargs)

  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
    INSERT INTO invoice_items (id, invoice_id, item_id, description, quantity, unit_price, created_at)
    VALUES
      ('$INVOICE_ITEM1_ID', '$INVOICE_ID', '$PRODUCT1', '$PRODUCT1_DESC', $QTY1, $PRICE1, NOW()),
      ('$INVOICE_ITEM2_ID', '$INVOICE_ID', '$PRODUCT2', '$PRODUCT2_DESC', $QTY2, $PRICE2, NOW());
  " > /dev/null

  if [ $ITEM_COUNT -eq 3 ]; then
    PRODUCT3_DESC=$(psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -t -c "SELECT name FROM items WHERE id = '$PRODUCT3';" | xargs)
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
      INSERT INTO invoice_items (id, invoice_id, item_id, description, quantity, unit_price, created_at)
      VALUES ('$INVOICE_ITEM3_ID', '$INVOICE_ID', '$PRODUCT3', '$PRODUCT3_DESC', $QTY3, $PRICE3, NOW());
    " > /dev/null
  fi

  # 9. CREATE PAYMENT (only if invoice is paid or partial)
  # Note: invoice_id is TEXT, amount is INTEGER (cents), payment_date is TEXT
  if [ "$INVOICE_STATUS" = "paid" ] || [ "$INVOICE_STATUS" = "partial" ]; then
    PAYMENT_METHODS=("wire_transfer" "credit_card" "check" "ACH")
    PAYMENT_METHOD="${PAYMENT_METHODS[$((RANDOM % 4))]}"
    REF_NUM=$(LC_ALL=C tr -dc 'A-Z0-9' < /dev/urandom | head -c 10)
    PAYMENT_NUM="PAY-2025-$(printf "%03d" $JOURNEY_NUM)"
    AMOUNT_CENTS=$(echo "$AMOUNT_PAID * 100" | bc | awk '{printf "%d", $0}')

    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
      INSERT INTO payments (id, payment_number, invoice_id, amount, payment_method, payment_date, reference_number, status, created_at)
      VALUES (
        '$PAYMENT_ID',
        '$PAYMENT_NUM',
        '$INVOICE_ID'::text,
        $AMOUNT_CENTS,
        '$PAYMENT_METHOD',
        (NOW() - INTERVAL '$(($RANDOM % 40)) days')::text,
        '$REF_NUM',
        'processed',
        NOW() - INTERVAL '$(($RANDOM % 40)) days'
      );
    " > /dev/null
  fi

  echo "   ✅ Journey $JOURNEY_NUM: Order $ORDER_STATUS → Production $PROD_STATUS → Shipment $SHIP_STATUS → Invoice $INVOICE_STATUS"
done

echo ""
echo "🎉 Seeding complete! Created complete business workflows for 25 journeys"
echo ""

# Verify counts
echo "📊 Data Summary:"
echo ""
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -c "
SELECT 'Orders' as entity, COUNT(*) as count FROM orders WHERE order_number LIKE 'ORD-2025-%'
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-2025-%')
UNION ALL
SELECT 'Production Orders', COUNT(*) FROM production_orders WHERE order_number LIKE 'PRD-2025-%'
UNION ALL
SELECT 'Shop Drawings', COUNT(*) FROM shop_drawings WHERE drawing_number LIKE 'SD-%'
UNION ALL
SELECT 'QC Inspections', COUNT(*) FROM qc_inspections WHERE production_order_id IN (SELECT id FROM production_orders WHERE order_number LIKE 'PRD-2025-%')
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipments WHERE shipment_number LIKE 'SHP-2025-%'
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices WHERE invoice_number LIKE 'INV-2025-%'
UNION ALL
SELECT 'Invoice Items', COUNT(*) FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'INV-2025-%')
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'INV-2025-%');
"

echo ""
echo "✨ Complete business flow now testable: Contact → Lead → Customer → Project → Order → Production → Shipment → Invoice → Payment"
echo ""
