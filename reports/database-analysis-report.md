# Database Analysis Report

**Generated:** 10/3/2025, 8:36:35 AM

## Summary

- **Total Prisma Models:** 284
- **Total Database Tables:** 299
- **Unused Tables:** 33
- **Missing Indexes:** 50
- **Orphaned Data Issues:** 0

## Unused Tables (33)

Tables in database but not in Prisma schema:

- `_documentsToproduction_orders`
- `cash_flow_summary`
- `collections`
- `customer_summary`
- `database_health_final`
- `design_project_overview`
- `designer_dashboard`
- `designer_performance_summary`
- `email_campaign_performance`
- `email_engagement_timeline`
- `integration_health`
- `inventory_status`
- `invoice_line_items`
- `manufacturer_overview`
- `material_combinations`
- `my_permissions`
- `notification_analytics`
- `optimization_final_status`
- `order_profitability`
- `order_statistics`
- `orders_compatible`
- `payment_batch_summary`
- `policy_count_by_table`
- `production_status`
- `projects_compatible`
- `rls_policy_dashboard`
- `security_audit_log`
- `shipping_status`
- `sms_campaign_performance`
- `sms_delivery_timeline`
- `v_active_pwa_devices`
- `v_ready_to_invoice`
- `warnings_fixed`

**Recommendation:** Review these tables. If no longer needed, consider archiving and dropping.

## Missing Indexes (50)

Foreign keys without indexes (performance impact):

### customer_portal_activity.portal_id
- **Reason:** Foreign key to customer_portals.id
- **SQL:**
  ```sql
  CREATE INDEX idx_customer_portal_activity_portal_id
  ON customer_portal_activity(portal_id);
  ```

### customer_portal_activity.portal_user_id
- **Reason:** Foreign key to customer_portal_users.id
- **SQL:**
  ```sql
  CREATE INDEX idx_customer_portal_activity_portal_user_id
  ON customer_portal_activity(portal_user_id);
  ```

### customer_portal_sessions.portal_user_id
- **Reason:** Foreign key to customer_portal_users.id
- **SQL:**
  ```sql
  CREATE INDEX idx_customer_portal_sessions_portal_user_id
  ON customer_portal_sessions(portal_user_id);
  ```

### document_revisions.changed_by
- **Reason:** Foreign key to user_profiles.id
- **SQL:**
  ```sql
  CREATE INDEX idx_document_revisions_changed_by
  ON document_revisions(changed_by);
  ```

### document_revisions.reviewed_by
- **Reason:** Foreign key to user_profiles.id
- **SQL:**
  ```sql
  CREATE INDEX idx_document_revisions_reviewed_by
  ON document_revisions(reviewed_by);
  ```

### documents.approved_by
- **Reason:** Foreign key to user_profiles.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_approved_by
  ON documents(approved_by);
  ```

### documents.collection_id
- **Reason:** Foreign key to collections.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_collection_id
  ON documents(collection_id);
  ```

### documents.design_project_id
- **Reason:** Foreign key to design_projects.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_design_project_id
  ON documents(design_project_id);
  ```

### documents.manufacturer_project_id
- **Reason:** Foreign key to manufacturer_projects.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_manufacturer_project_id
  ON documents(manufacturer_project_id);
  ```

### documents.order_item_id
- **Reason:** Foreign key to order_items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_order_item_id
  ON documents(order_item_id);
  ```

### documents.uploaded_by_user
- **Reason:** Foreign key to user_profiles.id
- **SQL:**
  ```sql
  CREATE INDEX idx_documents_uploaded_by_user
  ON documents(uploaded_by_user);
  ```

### email_queue.template_id
- **Reason:** Foreign key to email_templates.id
- **SQL:**
  ```sql
  CREATE INDEX idx_email_queue_template_id
  ON email_queue(template_id);
  ```

### order_item_materials.carving_option_id
- **Reason:** Foreign key to carving_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_carving_option_id
  ON order_item_materials(carving_option_id);
  ```

### order_item_materials.metal_option_id
- **Reason:** Foreign key to metal_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_metal_option_id
  ON order_item_materials(metal_option_id);
  ```

### order_item_materials.order_item_id
- **Reason:** Foreign key to order_items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_order_item_id
  ON order_item_materials(order_item_id);
  ```

### order_item_materials.stone_option_id
- **Reason:** Foreign key to stone_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_stone_option_id
  ON order_item_materials(stone_option_id);
  ```

### order_item_materials.weave_option_id
- **Reason:** Foreign key to weave_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_weave_option_id
  ON order_item_materials(weave_option_id);
  ```

### order_item_materials.wood_option_id
- **Reason:** Foreign key to wood_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_item_materials_wood_option_id
  ON order_item_materials(wood_option_id);
  ```

### order_materials.fabric_option_id
- **Reason:** Foreign key to fabric_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_materials_fabric_option_id
  ON order_materials(fabric_option_id);
  ```

### order_materials.order_id
- **Reason:** Foreign key to orders.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_materials_order_id
  ON order_materials(order_id);
  ```

### order_materials.order_item_id
- **Reason:** Foreign key to order_items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_order_materials_order_item_id
  ON order_materials(order_item_id);
  ```

### orders_old.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_orders_old_customer_id
  ON orders_old(customer_id);
  ```

### orders.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_orders_customer_id
  ON orders(customer_id);
  ```

### orders_old.project_id
- **Reason:** Foreign key to projects.id
- **SQL:**
  ```sql
  CREATE INDEX idx_orders_old_project_id
  ON orders_old(project_id);
  ```

### packing_boxes.packing_job_id
- **Reason:** Foreign key to packing_jobs.id
- **SQL:**
  ```sql
  CREATE INDEX idx_packing_boxes_packing_job_id
  ON packing_boxes(packing_job_id);
  ```

### packing_jobs.order_item_id
- **Reason:** Foreign key to order_items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_packing_jobs_order_item_id
  ON packing_jobs(order_item_id);
  ```

### packing_jobs.qc_inspection_id
- **Reason:** Foreign key to qc_inspections.id
- **SQL:**
  ```sql
  CREATE INDEX idx_packing_jobs_qc_inspection_id
  ON packing_jobs(qc_inspection_id);
  ```

### pandadoc_documents.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_pandadoc_documents_customer_id
  ON pandadoc_documents(customer_id);
  ```

### pandadoc_documents.order_id
- **Reason:** Foreign key to orders.id
- **SQL:**
  ```sql
  CREATE INDEX idx_pandadoc_documents_order_id
  ON pandadoc_documents(order_id);
  ```

### payment_allocations.invoice_id
- **Reason:** Foreign key to invoices.id
- **SQL:**
  ```sql
  CREATE INDEX idx_payment_allocations_invoice_id
  ON payment_allocations(invoice_id);
  ```

### payment_allocations.payment_id
- **Reason:** Foreign key to payments.id
- **SQL:**
  ```sql
  CREATE INDEX idx_payment_allocations_payment_id
  ON payment_allocations(payment_id);
  ```

### portal_access_logs.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_access_logs_customer_id
  ON portal_access_logs(customer_id);
  ```

### portal_access_logs.portal_user_id
- **Reason:** Foreign key to portal_users.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_access_logs_portal_user_id
  ON portal_access_logs(portal_user_id);
  ```

### portal_activity_log.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_activity_log_customer_id
  ON portal_activity_log(customer_id);
  ```

### portal_documents.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_documents_customer_id
  ON portal_documents(customer_id);
  ```

### portal_sessions.customer_id
- **Reason:** Foreign key to customers.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_sessions_customer_id
  ON portal_sessions(customer_id);
  ```

### portal_sessions.portal_user_id
- **Reason:** Foreign key to portal_users.id
- **SQL:**
  ```sql
  CREATE INDEX idx_portal_sessions_portal_user_id
  ON portal_sessions(portal_user_id);
  ```

### product_materials.carving_option_id
- **Reason:** Foreign key to carving_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_carving_option_id
  ON product_materials(carving_option_id);
  ```

### product_materials.metal_option_id
- **Reason:** Foreign key to metal_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_metal_option_id
  ON product_materials(metal_option_id);
  ```

### product_materials.product_id
- **Reason:** Foreign key to items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_product_id
  ON product_materials(product_id);
  ```

### product_materials.stone_option_id
- **Reason:** Foreign key to stone_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_stone_option_id
  ON product_materials(stone_option_id);
  ```

### product_materials.weave_option_id
- **Reason:** Foreign key to weave_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_weave_option_id
  ON product_materials(weave_option_id);
  ```

### product_materials.wood_option_id
- **Reason:** Foreign key to wood_options.id
- **SQL:**
  ```sql
  CREATE INDEX idx_product_materials_wood_option_id
  ON product_materials(wood_option_id);
  ```

### production_items.order_id
- **Reason:** Foreign key to orders.id
- **SQL:**
  ```sql
  CREATE INDEX idx_production_items_order_id
  ON production_items(order_id);
  ```

### production_items.order_item_id
- **Reason:** Foreign key to order_items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_production_items_order_item_id
  ON production_items(order_item_id);
  ```

### production_milestones.manufacturer_project_id
- **Reason:** Foreign key to manufacturer_projects.id
- **SQL:**
  ```sql
  CREATE INDEX idx_production_milestones_manufacturer_project_id
  ON production_milestones(manufacturer_project_id);
  ```

### production_orders.prototype_id
- **Reason:** Foreign key to items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_production_orders_prototype_id
  ON production_orders(prototype_id);
  ```

### production_orders.concept_id
- **Reason:** Foreign key to items.id
- **SQL:**
  ```sql
  CREATE INDEX idx_production_orders_concept_id
  ON production_orders(concept_id);
  ```

### qc_inspections.prototype_production_id
- **Reason:** Foreign key to prototype_production.id
- **SQL:**
  ```sql
  CREATE INDEX idx_qc_inspections_prototype_production_id
  ON qc_inspections(prototype_production_id);
  ```

### shop_drawings.prototype_production_id
- **Reason:** Foreign key to prototype_production.id
- **SQL:**
  ```sql
  CREATE INDEX idx_shop_drawings_prototype_production_id
  ON shop_drawings(prototype_production_id);
  ```

---

*Generated by Database Analysis Script*
