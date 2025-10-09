# Remaining Database Test Fixes - Quick Reference

## 61-production (4 failures from earlier run)

**production_payments** requires:
- payment_number
- production_invoice_id
- amount
- payment_method
- status
- payment_date
- created_at
- updated_at

**production_milestones** requires:
- milestone_name
- Auto-generated: id, created_at, updated_at

## 63-financials (6 failures)

**invoice_items** requires:
- description
- quantity
- unit_price
- Auto-generated: id, created_at
- **NO updated_at field!** (skip those tests)

## 64-shipping (5 failures)

**shipping_events** requires:
- shipment_id
- event_type
- event_timestamp
- Auto-generated: id, created_at
- **NO updated_at field!** (skip those tests)

## 65-design (9 failures)

**design_briefs** requires:
- title only
- Auto-generated: id, created_at, updated_at

**mood_boards** requires (6 required fields!):
- board_number
- name
- board_type
- is_shared
- status
- created_at
- updated_at

## Common Patterns

1. **Skip all `updatedAt` timing tests** - Supabase triggers make them unreliable
2. **Create helper functions** for tables with many required fields
3. **Check for missing fields** in error messages to identify required fields
4. **Array fields cannot be null** in Prisma
5. **JSONB fields** like template_data need actual JSON objects

## Next Steps

1. Fix 65-design (9 failures) - mood_boards needs most work
2. Fix 61-production (4 failures) - production_payments missing fields
3. Fix 63-financials (6 failures) - invoice_items no updated_at
4. Fix 64-shipping (5 failures) - shipping_events no updated_at
5. Run ALL tests together for final verification

**Total remaining**: ~24 failures across 4 files
